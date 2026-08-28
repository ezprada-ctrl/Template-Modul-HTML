import io
import os
import sys
import uuid

# Vercel's Python runtime imports this file dynamically (not via a normal
# `python index.py` invocation), so this directory isn't automatically on
# sys.path — without this, sibling imports below fail with
# "ModuleNotFoundError: No module named 'generator'" in production even
# though it works fine locally.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import generator
import pptx_extract
import draft_store
import activity_store
import r2

app = Flask(__name__)

# Allow the deployed Vercel frontend + local dev origins. Set CORS_ORIGINS in
# the Vercel project's env vars to a comma-separated list (e.g.
# "https://template-modul-html.vercel.app") once the frontend is deployed;
# defaults to "*" so local dev keeps working.
_origins = os.environ.get('CORS_ORIGINS', '*')
CORS(app, origins=_origins.split(',') if _origins != '*' else '*')


@app.post('/api/generate')
def api_generate():
    module = request.get_json(force=True)
    html = generator.generate_html(module)
    return Response(html, mimetype='text/html')


@app.get('/api/tracking-config')
def api_tracking_config():
    """Apakah kredensial rekam-aktivitas terpasang di backend?

    Builder gak punya cara lain buat tau ini: kredensial disuntikkan
    server-side saat generate (dari os.environ), jadi kalau env var-nya kosong,
    modul yang di-export bakal BISU total tanpa gejala walau checkbox "Rekam
    aktivitas" dicentang. Endpoint ini bikin kegagalan senyap itu keliatan di
    builder SEBELUM modul di-export.

    Cuma balikin boolean — gak pernah bocorin nilai key-nya. Ngecek env var
    yang PERSIS sama dengan yang disuntikkan generator (SUPABASE_URL +
    SUPABASE_ANON_KEY), bukan service_role. CATATAN: ini bukti kredensial
    ADA, bukan bukti jaringan dari LMS tembus — buat itu pakai tombol "Cek
    Rekam Aktivitas" di Dev Mode modul, dijalankan dari dalam LMS."""
    configured = bool(os.environ.get('SUPABASE_URL') and os.environ.get('SUPABASE_ANON_KEY'))
    return jsonify({'configured': configured})


# The PPTX itself never touches this Vercel function's request body anymore
# (that's the ~4.5MB ceiling that used to break big decks) — the frontend
# uploads it straight to Supabase Storage first, then just tells us the path.
# We pull the bytes back down server-side via service_role (bypasses RLS, so
# no anon SELECT policy is needed on the bucket) and delete the blob right
# after extraction: unlike images/video, nothing keeps referencing a PPTX
# after its slides are back in the browser, so there's no reason to let it
# sit in Storage forever.
PPTX_BUCKET = 'modul-media'


def _storage_creds():
    return os.environ.get('SUPABASE_URL', '').rstrip('/'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


def _storage_download(bucket, path):
    url, key = _storage_creds()
    res = requests.get(
        f'{url}/storage/v1/object/{bucket}/{path}',
        headers={'apikey': key, 'Authorization': f'Bearer {key}'}, timeout=30,
    )
    res.raise_for_status()
    return res.content


def _storage_delete(bucket, path):
    url, key = _storage_creds()
    try:
        requests.delete(
            f'{url}/storage/v1/object/{bucket}/{path}',
            headers={'apikey': key, 'Authorization': f'Bearer {key}'}, timeout=15,
        )
    except Exception:
        pass  # best-effort cleanup — a leftover blob is harmless, just untidy


@app.post('/api/extract-pptx')
def api_extract_pptx():
    data = request.get_json(silent=True) or {}
    path = data.get('path')
    if not path:
        return jsonify({'error': 'path wajib diisi'}), 400
    url, key = _storage_creds()
    if not (url and key):
        return jsonify({
            'error': 'SUPABASE_SERVICE_ROLE_KEY belum diset di project backend Vercel. '
                     'Ekstraksi PPTX butuh itu buat baca file dari Storage.'
        }), 503
    try:
        pptx_bytes = _storage_download(PPTX_BUCKET, path)
    except Exception as e:
        return jsonify({'error': f'Gagal ambil file PPTX dari storage: {e}'}), 502
    try:
        slides = pptx_extract.extract(io.BytesIO(pptx_bytes))
    except Exception as e:
        return jsonify({'error': f'Gagal ekstrak PPTX: {e}'}), 400
    finally:
        _storage_delete(PPTX_BUCKET, path)
    return jsonify({'slides': slides})


# ------------------------------------------------------------- Cloudflare R2
# Paket Articulate disimpan di R2, bukan Supabase Storage. Alasannya ada di
# server/api/r2.py - ringkasnya: Supabase gratis mematok 50MB/file (gak bisa
# dinaikkan) dan kuota 1GB-nya dipakai barengan semua modul, sementara R2
# kasih 10GB gratis + egress gratis.
#
# Endpoint di bawah CUMA membagikan URL bertanda tangan berumur pendek. Byte
# file-nya sendiri gak pernah lewat sini, jadi paket 100MB gak kena batas
# request backend sama sekali.

# Umur URL upload. Dibuat longgar karena upload 100MB lewat jaringan kantor
# bisa lama; kalau kependekan, upload yang jalannya benar bisa gagal di tengah.
R2_UPLOAD_TTL = 3600
# Umur URL unduh. Dipakai perakit paket SCORM di browser, sekali tarik lalu
# selesai - gak perlu berumur panjang.
R2_DOWNLOAD_TTL = 900


@app.get('/api/r2/configured')
def api_r2_configured():
    """Apakah backend punya kredensial R2? Frontend menanyakan ini SEBELUM
    pengguna milih file, biar bisa jatuh ke jalur Supabase (dengan batas 50MB)
    secara sadar alih-alih gagal misterius di tengah upload."""
    return jsonify({'configured': r2.is_configured()})


@app.post('/api/r2/upload-url')
def api_r2_upload_url():
    """URL sementara buat browser meng-upload satu paket Articulate langsung
    ke R2. Nama objek DIBUAT DI SINI, bukan diterima dari klien - kalau klien
    yang menentukan, dia bisa menimpa objek milik modul lain."""
    if not r2.is_configured():
        return jsonify({'error': 'Kredensial R2 belum diset di backend.'}), 503
    data = request.get_json(silent=True) or {}
    nama = (data.get('filename') or 'paket.zip').strip()
    # Cuma ekstensi yang dipertahankan dari nama asli; sisanya dibuang supaya
    # nama file aneh dari pengguna gak pernah jadi bagian dari path objek.
    ext = 'zip' if nama.lower().endswith('.zip') else 'bin'
    key = f"articulate/{uuid.uuid4().hex}.{ext}"
    try:
        url = r2.presign('PUT', key, expires=R2_UPLOAD_TTL)
    except Exception as e:
        return jsonify({'error': f'Gagal membuat URL upload: {e}'}), 500
    return jsonify({'uploadUrl': url, 'key': key, 'expiresIn': R2_UPLOAD_TTL})


@app.post('/api/r2/download-url')
def api_r2_download_url():
    """URL sementara buat menarik balik paket saat Export SCORM."""
    if not r2.is_configured():
        return jsonify({'error': 'Kredensial R2 belum diset di backend.'}), 503
    key = ((request.get_json(silent=True) or {}).get('key') or '').strip()
    # Bucket ini cuma dipakai buat paket Articulate. Menolak key di luar
    # prefix itu bikin endpoint ini gak bisa dipakai memancing objek lain
    # kalau suatu saat bucket-nya dipakai buat hal lain juga.
    if not key.startswith('articulate/'):
        return jsonify({'error': 'key tidak valid'}), 400
    try:
        return jsonify({'downloadUrl': r2.presign('GET', key, expires=R2_DOWNLOAD_TTL)})
    except Exception as e:
        return jsonify({'error': f'Gagal membuat URL unduh: {e}'}), 500


@app.post('/api/r2/delete-url')
def api_r2_delete_url():
    """URL sementara buat menghapus paket yang bloknya dibuang/diganti. Tanpa
    ini, tiap penggantian file bakal meninggalkan objek yatim yang terus makan
    kuota 10GB."""
    if not r2.is_configured():
        return jsonify({'error': 'Kredensial R2 belum diset di backend.'}), 503
    key = ((request.get_json(silent=True) or {}).get('key') or '').strip()
    if not key.startswith('articulate/'):
        return jsonify({'error': 'key tidak valid'}), 400
    try:
        return jsonify({'deleteUrl': r2.presign('DELETE', key, expires=300)})
    except Exception as e:
        return jsonify({'error': f'Gagal membuat URL hapus: {e}'}), 500


@app.get('/api/drafts')
def api_list_drafts():
    return jsonify({'drafts': draft_store.list_drafts()})


@app.get('/api/drafts/<name>')
def api_load_draft(name):
    data = draft_store.load_draft(name)
    if data is None:
        return jsonify({'error': 'not found'}), 404
    return jsonify(data)


@app.post('/api/drafts/<name>')
def api_save_draft(name):
    data = request.get_json(force=True)
    draft_store.save_draft(name, data)
    return jsonify({'ok': True})


@app.post('/api/drafts/<name>/rename')
def api_rename_draft(name):
    body = request.get_json(force=True) or {}
    new_name = (body.get('new_name') or '').strip()
    if not new_name:
        return jsonify({'error': 'Nama baru gak boleh kosong'}), 400
    try:
        slug = draft_store.rename_draft(name, new_name)
    except ValueError as e:
        return jsonify({'error': str(e)}), 409
    return jsonify({'ok': True, 'slug': slug})


@app.get('/api/health')
def api_health():
    return jsonify({'ok': True, 'storage': 'supabase' if draft_store.USE_SUPABASE else 'local-file'})


# --------------------------------------------------------------- Command Center
# Isi endpoint di bawah ini = DATA PRIBADI (nama + NIP + rekam jejak belajar),
# sementara builder app-nya sendiri gak punya login dan URL-nya publik. Jadi
# password DIVALIDASI DI SINI, bukan di frontend: kalau cuma dicek di browser,
# siapa pun tinggal manggil endpoint-nya langsung dan pengecekannya terlewat.
#
# Password dikirim lewat body JSON (POST), bukan query string, supaya gak
# nyangkut di log server / riwayat browser.

def _check_cc_password(data):
    """None kalau boleh lanjut, atau (response, status) kalau ditolak."""
    expected = os.environ.get('COMMAND_CENTER_PASSWORD', '')
    if not expected:
        # Fail-safe: belum dikonfigurasi = TUTUP, bukan terbuka. Data pribadi
        # gak boleh kebuka cuma gara-gara env var kelupaan diset.
        return jsonify({
            'error': 'COMMAND_CENTER_PASSWORD belum diset di project backend Vercel. '
                     'Command Center sengaja ditutup sampai password-nya dipasang.'
        }), 503
    if (data or {}).get('password') != expected:
        return jsonify({'error': 'Password salah.'}), 401
    return None


@app.post('/api/activity/modules')
def api_activity_modules():
    data = request.get_json(silent=True) or {}
    denied = _check_cc_password(data)
    if denied:
        return denied
    try:
        activity_store.reset_truncation()
        modules = activity_store.list_modules()
        return jsonify({'modules': modules, 'terpotong': activity_store.was_truncated()})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/activity/sessions')
def api_activity_sessions():
    data = request.get_json(silent=True) or {}
    denied = _check_cc_password(data)
    if denied:
        return denied
    slug = data.get('module_slug')
    if not slug:
        return jsonify({'error': 'module_slug wajib diisi'}), 400
    try:
        activity_store.reset_truncation()
        sessions = activity_store.summarize_sessions(slug)
        return jsonify({'sessions': sessions, 'terpotong': activity_store.was_truncated()})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/activity/learners')
def api_activity_learners():
    """Rekap per peserta lintas semua modul — buat pelatihan yang dipecah
    jadi beberapa SCORM/modul terpisah."""
    data = request.get_json(silent=True) or {}
    denied = _check_cc_password(data)
    if denied:
        return denied
    try:
        activity_store.reset_truncation()
        learners = activity_store.summarize_learners()
        return jsonify({'learners': learners, 'terpotong': activity_store.was_truncated()})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/activity/rows')
def api_activity_rows():
    """Semua event mentah satu modul — buat ekspor CSV yang lossless."""
    data = request.get_json(silent=True) or {}
    denied = _check_cc_password(data)
    if denied:
        return denied
    slug = data.get('module_slug')
    if not slug:
        return jsonify({'error': 'module_slug wajib diisi'}), 400
    try:
        return jsonify({'rows': activity_store.fetch_rows(module_slug=slug)})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/activity/my-recap')
def api_activity_my_recap():
    """Rekap belajar SATU peserta, dipanggil dari dalam modul yang lagi dia buka.

    SENGAJA TANPA PASSWORD — beda peruntukan dari endpoint Command Center di
    atas. Yang di atas itu buat TIM (semua peserta sekaligus, data pribadi
    orang lain, wajib dikunci). Yang ini cuma balikin rekap milik NIP yang
    diminta, dalam bentuk AGREGAT (angka ringkas), bukan baris mentah.

    Batas yang disadari: siapa pun yang tau NIP orang lain bisa manggil ini
    dan lihat rekap orang itu. Itu konsekuensi model kepercayaan yang sudah
    dipakai modul sejak awal (NIP = identitas, gak ada login di mana pun) —
    bukan kebocoran baru yang diperkenalkan endpoint ini. Yang TIDAK boleh
    ditambahkan ke sini: daftar peserta, pencarian NIP, atau apa pun yang
    bikin NIP bisa DITEMUKAN dari sini; tanpa itu, endpoint ini gak bisa
    dipakai buat memanen data massal.
    """
    data = request.get_json(silent=True) or {}
    slug = (data.get('module_slug') or '').strip()
    nip = (data.get('learner_id') or '').strip()
    if not slug or not nip:
        return jsonify({'error': 'module_slug dan learner_id wajib diisi'}), 400
    # Sesi yang lagi berjalan waktu rekap dibuka. Belum ada di database
    # (session_end baru kekirim pas modulnya ditutup), padahal justru sesi
    # inilah yang barusan dijalani peserta - tanpa ini sinyal "ditinggal"
    # gak pernah bisa nyala di popup.
    live_session_id = (data.get('live_session_id') or '').strip() or None
    try:
        live_total_ms = int(data.get('live_total_ms') or 0) or None
    except (TypeError, ValueError):
        live_total_ms = None
    try:
        activity_store.reset_truncation()
        return jsonify(activity_store.recap_for_learner(
            slug, nip, live_session_id=live_session_id, live_total_ms=live_total_ms))
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/cocreation/my-notes')
def api_cocreation_my_notes():
    """Catatan Co-creation milik SATU peserta, dipanggil dari dalam modulnya.

    Inilah yang bikin catatan tahan ganti perangkat: modul menulis catatan ke
    Supabase pakai anon key (INSERT-only), lalu menariknya balik lewat sini.

    SENGAJA TANPA PASSWORD, alasan & batasnya sama persis dengan
    /api/activity/my-recap di atas — silakan baca penjelasan di situ. Bedanya
    satu dan penting: yang dibalikin di sini bukan angka agregat, tapi TEKS
    CATATAN peserta apa adanya. Jadi aturan "jangan pernah tambahkan daftar
    peserta atau pencarian NIP ke endpoint ini" berlaku lebih keras lagi di
    sini — tanpa cara menemukan NIP, catatan orang lain tetap tidak bisa
    dipanen massal.
    """
    data = request.get_json(silent=True) or {}
    slug = (data.get('module_slug') or '').strip()
    nip = (data.get('learner_id') or '').strip()
    if not slug or not nip:
        return jsonify({'error': 'module_slug dan learner_id wajib diisi'}), 400
    try:
        activity_store.reset_truncation()
        return jsonify({'notes': activity_store.cocreation_notes_for_learner(slug, nip)})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.post('/api/activity/cocreation')
def api_activity_cocreation():
    """Catatan Co-creation satu modul, dikelompokkan per slide — buat pemateri.

    Dikunci password seperti endpoint Command Center lain: ini teks catatan
    SEMUA peserta, bukan cuma milik satu orang.
    """
    data = request.get_json(silent=True) or {}
    denied = _check_cc_password(data)
    if denied:
        return denied
    slug = (data.get('module_slug') or '').strip()
    if not slug:
        return jsonify({'error': 'module_slug wajib diisi'}), 400
    try:
        activity_store.reset_truncation()
        slides = activity_store.cocreation_by_slide(slug)
        return jsonify({'slides': slides, 'terpotong': activity_store.was_truncated()})
    except Exception as e:
        return jsonify({'error': str(e)}), 503


@app.get('/api/keepalive')
def api_keepalive():
    """Hit daily by Vercel Cron (schedule lives in server/vercel.json) so the
    Supabase free tier never sees a 7-day idle stretch and auto-pauses the
    project. A pause would take all saved drafts offline and can only be
    undone by a human clicking "Restore project" in the Supabase dashboard —
    the Management API needs an account-wide token we deliberately don't ship
    here (this app has no auth, so any token it held would be reachable by
    anyone with the URL).

    Optional CRON_SECRET env var locks this to Vercel's cron caller; when
    unset the endpoint stays open, which is acceptable because it's
    read-only and has no side effects beyond the ping itself.
    """
    secret = os.environ.get('CRON_SECRET')
    if secret and request.headers.get('Authorization') != f'Bearer {secret}':
        return jsonify({'ok': False, 'error': 'unauthorized'}), 401
    try:
        return jsonify(draft_store.ping())
    except Exception as e:
        # 503 (not 500) so an actual paused/unreachable database is
        # distinguishable from a bug in this handler.
        return jsonify({'ok': False, 'error': str(e)}), 503


if __name__ == '__main__':
    # Local dev only — on Vercel this file is imported as a WSGI app by
    # their Python runtime, this block never runs there.
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5800)), debug=True)
