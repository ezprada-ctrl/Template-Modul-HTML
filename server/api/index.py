import os
import sys
import tempfile

# Vercel's Python runtime imports this file dynamically (not via a normal
# `python index.py` invocation), so this directory isn't automatically on
# sys.path — without this, sibling imports below fail with
# "ModuleNotFoundError: No module named 'generator'" in production even
# though it works fine locally.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import generator
import pptx_extract
import draft_store
import activity_store

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


@app.post('/api/extract-pptx')
def api_extract_pptx():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'no file'}), 400
    with tempfile.NamedTemporaryFile(suffix='.pptx', delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    try:
        slides = pptx_extract.extract(tmp_path)
    finally:
        os.unlink(tmp_path)
    return jsonify({'slides': slides})


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
