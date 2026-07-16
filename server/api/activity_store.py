"""
Baca data rekaman aktivitas peserta buat Command Center.

Kenapa file ini ada di BACKEND, bukan langsung dari browser:

Modul nulis ke `modul_activity` pakai anon key yang keliatan di source-nya.
Itu aman karena RLS cuma ngasih anon izin INSERT, NOL SELECT — jadi anon key
gak bisa dipakai baca data peserta lain. Konsekuensinya: yang mau BACA harus
pakai `service_role` key, dan key itu boleh hidup CUMA di sini (env var
server-side Vercel, gak pernah sampai ke browser).

JANGAN PERNAH kasih service_role key ke frontend / prefix `VITE_`: dia
nembus semua RLS dan bisa baca/hapus seluruh isi database.
"""
import os
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

READY = bool(SUPABASE_URL and SERVICE_KEY)

PAGE_SIZE = 1000
# Katup pengaman biar satu permintaan gak narik jutaan baris ke memori
# fungsi serverless (yang jatah memorinya terbatas).
MAX_ROWS = 200000


def _headers():
    return {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
    }


def fetch_rows(module_slug=None, columns='*'):
    """Ambil semua baris, dipaginasi.

    Loop-nya sengaja maju sebanyak baris yang BENERAN diterima dan berhenti
    pas halaman kosong — BUKAN berhenti pas `len(rows) < PAGE_SIZE`. Setelan
    `db-max-rows` Supabase bisa mangkas balasan jadi lebih kecil dari yang
    diminta; cara yang naif bikin ekspor kepotong diam-diam (pelajaran dari
    project survei-pasca-pembelajaran).
    """
    if not READY:
        raise RuntimeError(
            'SUPABASE_SERVICE_ROLE_KEY belum diset di project backend Vercel. '
            'Command Center butuh itu buat baca data (anon key sengaja gak punya izin baca).'
        )
    out = []
    offset = 0
    while True:
        params = {
            'select': columns,
            'order': 'created_at.asc',
            'limit': PAGE_SIZE,
            'offset': offset,
        }
        if module_slug:
            params['module_slug'] = f'eq.{module_slug}'
        res = requests.get(
            f'{SUPABASE_URL}/rest/v1/modul_activity',
            params=params, headers=_headers(), timeout=30,
        )
        res.raise_for_status()
        rows = res.json()
        if not rows:
            break
        out.extend(rows)
        offset += len(rows)
        if len(out) >= MAX_ROWS:
            break
    return out


def list_modules():
    """Ringkasan per modul buat layar utama Command Center."""
    rows = fetch_rows(columns='module_slug,session_id,learner_id,created_at')
    by_slug = {}
    for r in rows:
        slug = r['module_slug']
        m = by_slug.setdefault(slug, {
            'module_slug': slug, 'rows': 0,
            '_sessions': set(), '_learners': set(),
            'first_seen': r['created_at'], 'last_seen': r['created_at'],
        })
        m['rows'] += 1
        m['_sessions'].add(r['session_id'])
        if r.get('learner_id'):
            m['_learners'].add(r['learner_id'])
        if r['created_at'] < m['first_seen']:
            m['first_seen'] = r['created_at']
        if r['created_at'] > m['last_seen']:
            m['last_seen'] = r['created_at']

    out = []
    for m in by_slug.values():
        out.append({
            'module_slug': m['module_slug'],
            'rows': m['rows'],
            'sessions': len(m['_sessions']),
            'learners': len(m['_learners']),
            'first_seen': m['first_seen'],
            'last_seen': m['last_seen'],
        })
    out.sort(key=lambda m: m['last_seen'], reverse=True)
    return out


def summarize_sessions(module_slug):
    """Satu baris per sesi belajar — bentuk yang paling langsung kepakai buat
    analisis habit (siapa, berapa lama, sejauh mana, skor berapa)."""
    rows = fetch_rows(module_slug=module_slug)
    sessions = {}
    for r in rows:
        s = sessions.setdefault(r['session_id'], {
            'session_id': r['session_id'],
            'module_slug': r['module_slug'],
            'learner_name': None, 'learner_id': None,
            'identity_source': None,
            'mulai': r['created_at'], 'selesai': r['created_at'],
            'durasi_total_ms': 0, 'durasi_terekam_ms': 0,
            'jumlah_slide_dilihat': 0, 'jumlah_interaksi': 0,
            'kuis_dijawab': 0, 'kuis_benar': 0, 'kuis_diulang': 0,
            'perangkat': None,
        })
        if r.get('learner_name'):
            s['learner_name'] = r['learner_name']
        if r.get('learner_id'):
            s['learner_id'] = r['learner_id']
        if r['created_at'] < s['mulai']:
            s['mulai'] = r['created_at']
        if r['created_at'] > s['selesai']:
            s['selesai'] = r['created_at']

        p = r.get('payload') or {}
        t = r['event_type']
        if t == 'session_start':
            s['identity_source'] = p.get('identity_source')
            s['perangkat'] = p.get('screen')
        elif t == 'session_end':
            s['durasi_total_ms'] = max(s['durasi_total_ms'], p.get('total_ms') or 0)
        elif t == 'slide_view':
            s['jumlah_slide_dilihat'] += 1
            s['durasi_terekam_ms'] += p.get('ms') or 0
        elif t == 'interaction':
            s['jumlah_interaksi'] += 1
        elif t == 'quiz_answer':
            s['kuis_dijawab'] += 1
            if p.get('benar'):
                s['kuis_benar'] += 1
        elif t == 'quiz_retry':
            s['kuis_diulang'] += 1

    out = list(sessions.values())
    for s in out:
        # Kalau sesi ditutup paksa (tab dibunuh HP), session_end gak pernah
        # terkirim -> total_ms 0. Pakai jumlah durasi slide sebagai gantinya
        # biar barisnya tetap kepakai, bukan kebuang.
        if not s['durasi_total_ms']:
            s['durasi_total_ms'] = s['durasi_terekam_ms']
        s['durasi_menit'] = round(s['durasi_total_ms'] / 60000, 1)
    out.sort(key=lambda s: s['mulai'], reverse=True)
    return out
