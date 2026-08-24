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
# fungsi serverless (yang jatah memorinya terbatas). Dinaikin dari 200rb:
# 500rb baris ~150MB di memori (masih di bawah jatah fungsi Vercel), dan
# ngasih ruang jauh lebih lega karena data MENUMPUK lintas pelatihan (gak ada
# retensi). Kalau tembus ini, hasilnya DIPOTONG — tapi sekarang potongannya
# KELIATAN (lihat _TRUNCATED), gak lagi diam-diam.
MAX_ROWS = 500000

# Ditandai true kalau fetch terakhir kepotong di MAX_ROWS. Dipakai biar
# Command Center bisa ngasih tau "data cuma sebagian" alih-alih diam-diam
# nampilin rekap yang kurang. Di-reset di awal tiap operasi baca top-level.
_TRUNCATED = False


def reset_truncation():
    global _TRUNCATED
    _TRUNCATED = False


def was_truncated():
    return _TRUNCATED


def _headers():
    return {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
    }


def fetch_rows(module_slug=None, columns='*', event_type=None, learner_id=None):
    """Ambil semua baris, dipaginasi.

    Loop-nya sengaja maju sebanyak baris yang BENERAN diterima dan berhenti
    pas halaman kosong — BUKAN berhenti pas `len(rows) < PAGE_SIZE`. Setelan
    `db-max-rows` Supabase bisa mangkas balasan jadi lebih kecil dari yang
    diminta; cara yang naif bikin ekspor kepotong diam-diam (pelajaran dari
    project survei-pasca-pembelajaran).

    `event_type` (opsional) nyaring di sisi server (PostgREST) — dipakai buat
    ambil cuma baris session_start yang jumlahnya = jumlah sesi (jauh lebih
    sedikit dari total baris), jadi bisa narik payload jsonb-nya tanpa nyeret
    semua event.
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
        if event_type:
            params['event_type'] = f'eq.{event_type}'
        # Disaring di sisi server (PostgREST): rekap pribadi peserta cuma
        # butuh barisnya sendiri, jangan seret seluruh baris modul ke memori
        # fungsi serverless cuma buat dibuang lagi di sini.
        if learner_id:
            params['learner_id'] = f'eq.{learner_id}'
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
            global _TRUNCATED
            _TRUNCATED = True
            break
    return out


# Baris uji dari tombol "Cek Rekam Aktivitas" di Dev Mode modul. Berguna buat
# ekspor mentah (bukti modul pernah diverifikasi & kapan), tapi HARUS disaring
# dari semua rekap: itu penyusun modul yang lagi ngetes, bukan peserta belajar.
# Kalau ikut keitung, tiap modul dapat "sesi" palsu berdurasi nol.
PREFLIGHT_EVENT = 'preflight'


def _tanpa_preflight(rows):
    return [r for r in rows if r.get('event_type') != PREFLIGHT_EVENT]


def _judul_per_slug():
    """Peta module_slug -> daftar judul modul (module_title) yang pernah muncul.

    Kenapa penting: `slug` itu identitas PROJECT di builder, bukan identitas
    modul. Kalau satu project didaur ulang (diedit jadi modul beda lalu
    di-export lagi), dua file modul yang beda hidup di LMS dengan slug SAMA →
    datanya nyampur di bawah satu slug. Satu slug dengan >1 judul modul =
    tanda bentrok itu. Diambil dari payload session_start (1 baris per sesi,
    jauh lebih sedikit dari total event) biar gak berat.
    """
    rows = _tanpa_preflight(
        fetch_rows(columns='module_slug,payload', event_type='session_start'))
    judul = {}
    for r in rows:
        p = r.get('payload') or {}
        t = (p.get('module_title') or '').strip()
        if t:
            judul.setdefault(r['module_slug'], set()).add(t)
    return {slug: sorted(s) for slug, s in judul.items()}


def list_modules():
    """Ringkasan per modul buat layar utama Command Center."""
    rows = _tanpa_preflight(
        fetch_rows(columns='module_slug,session_id,learner_id,created_at,event_type'))
    judul_map = _judul_per_slug()
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
        judul = judul_map.get(m['module_slug'], [])
        out.append({
            'module_slug': m['module_slug'],
            'rows': m['rows'],
            'sessions': len(m['_sessions']),
            'learners': len(m['_learners']),
            'first_seen': m['first_seen'],
            'last_seen': m['last_seen'],
            'judul_modul': judul,
            # >1 judul di bawah satu slug = project didaur ulang, datanya
            # nyampur. Ditandai keras biar penganalisis tau harus misahin per
            # judul (tiap sesi bawa module_title-nya, lihat summarize_sessions).
            'kemungkinan_bentrok': len(judul) > 1,
        })
    out.sort(key=lambda m: m['last_seen'], reverse=True)
    return out


def summarize_sessions(module_slug):
    """Satu baris per sesi belajar — bentuk yang paling langsung kepakai buat
    analisis habit (siapa, berapa lama, sejauh mana, skor berapa)."""
    rows = _tanpa_preflight(fetch_rows(module_slug=module_slug))
    sessions = {}
    for r in rows:
        s = sessions.setdefault(r['session_id'], {
            'session_id': r['session_id'],
            'module_slug': r['module_slug'],
            'learner_name': None, 'learner_id': None,
            'identity_source': None,
            'module_title': None,
            # Total slide KONTEN modul ini (ditanam saat export). None kalau
            # modulnya di-export sebelum fitur ini ada - gak ada cara nebak
            # dari data lama, jadi jujur ditandai "gak diketahui" bukan 0.
            'total_slide': None,
            # Total blok video/YouTube di modul ini (ditanam saat export,
            # TIDAK termasuk Instagram - itu gak mungkin diamati sama sekali,
            # lihat catatan di generator.py). None = modul lama sebelum fitur
            # ini ada, bukan "gak punya video".
            'total_video': None,
            # Total blok Articulate terpasang di modul ini (ditanam saat
            # export). None = modul lama sebelum fitur ini ada, BUKAN "gak
            # punya paket" - dibedain biar kolomnya bisa jujur nampilin "-".
            'total_articulate': None,
            'mulai': r['created_at'], 'selesai': r['created_at'],
            'durasi_total_ms': 0, 'durasi_terekam_ms': 0,
            'jumlah_slide_dilihat': 0, 'jumlah_interaksi': 0,
            'kuis_dijawab': 0, 'kuis_benar': 0, 'kuis_diulang': 0,
            'kuis_gagal': 0,
            'peringatan_baca_cepat': 0, 'peringatan_diabaikan': 0,
            # Knowledge Check (blok cek-paham inline, TIDAK mengunci). Dihitung
            # TERPISAH dari kuis section biar angka "gagal kuis" tetap bersih.
            'kc_dijawab': 0, 'kc_benar': 0,
            'perangkat': None,
            '_ada_session_end': False,
            # Nomor slide KONTEN unik yang pernah dibuka (bukan kunjungan) -
            # buat bedain "diulang" (jumlah_slide_dilihat > total_slide) dari
            # "ada yang gak pernah disentuh sama sekali" (slide_unik < total_slide).
            '_slide_unik': set(),
            # blockId -> persen TERJAUH yang pernah dicapai video itu (event
            # video_progress bisa nembak beberapa kali per blok - jeda-lanjut,
            # nonton ulang - makanya diambil nilai MAX-nya, bukan yang terakhir).
            '_video_max': {},
            # blockId -> nomor slide rumah video itu (dikirim tiap checkpoint,
            # sama di semua baris blok yang sama - dipakai buat label
            # "Slide N" di rincian per-video Command Center, bukan cuma
            # rata-rata gabungan semua video.
            '_video_slide': {},
            # blockId paket Articulate yang PERNAH dilaporkan selesai. Pakai
            # set, bukan penghitung: satu paket bisa nembak completed berkali-
            # kali (peserta buka ulang, atau SCORM di dalamnya ngirim status
            # dua kali) dan itu tetap satu paket yang sama.
            '_articulate_selesai': set(),
            # Rincian tiap kejadian reading_warning (section + nomor slide
            # persis yang ketangkap + pilihan peserta) - beda dari
            # peringatan_baca_cepat/peringatan_diabaikan yang cuma angka
            # agregat. Ditembak SEKALI per section (gerbang quizWarnShown di
            # shell-template.html), jadi ini otomatis sudah "percobaan
            # pertama saja" - gak ada duplikat dari percobaan kuis berikutnya.
            '_peringatan_detail': [],
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
            # Judul modul saat sesi ini direkam. Kalau satu slug ternyata
            # berisi beberapa judul (project didaur ulang), kolom inilah yang
            # dipakai buat misahin sesi milik modul yang mana.
            s['module_title'] = p.get('module_title')
            s['total_slide'] = p.get('total_slide')
            s['total_video'] = p.get('total_video')
            s['total_articulate'] = p.get('total_articulate')
        elif t == 'video_progress':
            block = p.get('block')
            persen = p.get('persen')
            if block and persen is not None:
                prev = s['_video_max'].get(block, 0)
                if persen > prev:
                    s['_video_max'][block] = persen
                if p.get('slide') is not None:
                    s['_video_slide'][block] = p.get('slide')
        elif t == 'session_end':
            s['durasi_total_ms'] = max(s['durasi_total_ms'], p.get('total_ms') or 0)
            s['_ada_session_end'] = True
        elif t == 'slide_view':
            s['jumlah_slide_dilihat'] += 1
            s['durasi_terekam_ms'] += p.get('ms') or 0
            if p.get('kind') == 'slide' and p.get('num') is not None:
                s['_slide_unik'].add(p['num'])
        elif t == 'interaction':
            s['jumlah_interaksi'] += 1
        elif t == 'quiz_answer':
            s['kuis_dijawab'] += 1
            if p.get('benar'):
                s['kuis_benar'] += 1
        elif t == 'quiz_retry':
            s['kuis_diulang'] += 1
        elif t == 'quiz_submit':
            # Sumber yang lebih tepat buat "berapa kali gagal" dibanding
            # kuis_diulang (klik tombol Ulangi): tombol Ulangi cuma muncul
            # kalau gagal (lihat shell-template.html), TAPI peserta yang gagal
            # lalu langsung nutup modul tanpa pernah klik Ulangi bakal kehitung
            # 0 kali gagal kalau sumbernya klik tombol - padahal dia beneran
            # gagal 1x. quiz_submit tercatat setiap kali submit ditekan,
            # terlepas peserta lanjut ngulang atau nyerah di situ.
            if p.get('lulus') is False:
                s['kuis_gagal'] += 1
        elif t == 'reading_warning':
            # Ditembak sekali per section, pas peserta ketangkap ngeklik-
            # lewat slide terlalu cepat (< 50% waktu baca minimum Brysbaert)
            # sebelum percobaan kuis pertama bagian itu.
            s['peringatan_baca_cepat'] += 1
            if p.get('choice') == 'yakin':
                s['peringatan_diabaikan'] += 1
            s['_peringatan_detail'].append({
                'section': p.get('section'),
                'slides': p.get('slides') or [],
                'choice': p.get('choice'),
            })
        elif t == 'kc_answer':
            # Jawaban blok Knowledge Check (cek paham inline). Direkam tiap
            # jawaban, benar maupun salah - TERPISAH dari kuis section.
            s['kc_dijawab'] += 1
            if p.get('benar'):
                s['kc_benar'] += 1
        elif t == 'articulate_selesai':
            # Paket Articulate ngasih tau "completed/passed" lewat SHIM SCORM
            # kita (lihat artMarkDone di shell-template.html). Sebelum ini
            # event-nya kerekam di tabel tapi gak pernah dibaca siapa pun -
            # jadi paket Articulate, satu-satunya blok yang isinya kita gak
            # bisa amati sama sekali dari luar, malah jadi blok yang paling
            # gak kelihatan di Command Center.
            if p.get('blok'):
                s['_articulate_selesai'].add(p['blok'])

    out = list(sessions.values())
    for s in out:
        ada_end = s.pop('_ada_session_end')
        s['jumlah_slide_unik'] = len(s.pop('_slide_unik'))
        # "Berapa video yang DIMULAI" (persen tercatat > 0, apa pun) dari
        # total video di modul ini, + rata-rata seberapa jauh video yang
        # DIMULAI itu ditonton. Video yang gak pernah disentuh gak masuk
        # rata-rata (bukan dianggap 0%) - itu urusan kolom "dimulai", bukan
        # bikin rata-ratanya keliatan jelek gara-gara video yang emang gak
        # dibuka sama sekali.
        video_max = s.pop('_video_max')
        video_slide = s.pop('_video_slide')
        s['video_dimulai'] = len(video_max)
        s['video_rata_persen'] = round(sum(video_max.values()) / len(video_max)) if video_max else None
        # Rincian PER VIDEO (bukan cuma rata-rata gabungan) - video_rata_persen
        # di atas gampang menyamarkan satu video yang beneran gak ditonton di
        # antara yang lain ditonton penuh. Diurutkan dari yang paling rendah
        # duluan (paling perlu ditinjau), sama seperti pola peringatan_detail.
        s['video_detail'] = sorted(
            [{'slide': video_slide.get(b), 'persen': p} for b, p in video_max.items()],
            key=lambda d: d['persen'])
        s['articulate_selesai'] = len(s.pop('_articulate_selesai'))
        s['peringatan_detail'] = s.pop('_peringatan_detail')
        # Kalau sesi ditutup paksa (tab dibunuh HP), session_end gak pernah
        # terkirim -> total_ms 0. Pakai jumlah durasi slide sebagai gantinya
        # biar barisnya tetap kepakai, bukan kebuang.
        if not s['durasi_total_ms']:
            s['durasi_total_ms'] = s['durasi_terekam_ms']
        s['durasi_menit'] = round(s['durasi_total_ms'] / 60000, 1)
        # "Tatap layar" = waktu tab ini beneran KELIHATAN aktif (dari
        # slide_view, yang berhenti dihitung begitu visibilitychange jadi
        # 'hidden'). Lebih jujur buat ditampilkan sebagai durasi utama
        # daripada durasi_menit total: peserta yang tab-nya dibiarkan
        # kebuka sambil ditinggal lama akan keliatan durasi TOTAL-nya
        # besar padahal dia gak natap sama sekali.
        s['durasi_tatap_layar_menit'] = round(s['durasi_terekam_ms'] / 60000, 1)
        # "Ditinggal" = selisihnya. Cuma bermakna kalau session_end beneran
        # kekirim (barulah durasi_total_ms itu independen dari
        # durasi_terekam_ms) - kalau enggak, durasi_total sengaja DIPINJEM
        # dari durasi_terekam di atas, jadi selisihnya bakal 0 palsu, bukan
        # "gak pernah ditinggal". None di sini artinya "gak bisa dihitung",
        # bukan "nol menit".
        if ada_end:
            s['durasi_ditinggal_menit'] = round(
                max(0, s['durasi_total_ms'] - s['durasi_terekam_ms']) / 60000, 1)
        else:
            s['durasi_ditinggal_menit'] = None
    out.sort(key=lambda s: s['mulai'], reverse=True)
    return out


def summarize_learners():
    """Satu baris per PESERTA, lintas semua modul.

    Kenapa ini ada: satu pelatihan biasanya dipecah jadi beberapa modul =
    beberapa SCORM terpisah = beberapa module_slug. Tampilan per-modul gak
    bisa jawab "si A ini udah nyelesain modul apa aja, total berapa lama" —
    tanpa view ini orang harus unduh tiap CSV dan nge-join sendiri di Excel.

    Digabung pakai learner_id (NIP), BUKAN nama: nama yang diketik manual
    bervariasi ("Budi Santoso" / "budi santoso" / "Budi S.") dan bakal mecah
    satu orang jadi beberapa baris. Varian nama yang pernah dipakai tetap
    dikumpulin di `nama_varian` supaya kalau satu NIP muncul dengan nama yang
    beda-beda jauh, itu keliatan (bisa jadi tanda NIP-nya salah ketik / dipakai
    berdua), bukan disembunyiin.
    """
    rows = _tanpa_preflight(fetch_rows())
    by_session = {}
    for r in rows:
        by_session.setdefault(r['session_id'], []).append(r)

    learners = {}
    for sess_rows in by_session.values():
        nip = None
        nama = None
        slug = sess_rows[0]['module_slug']
        source = None
        mulai = sess_rows[0]['created_at']
        total_ms = 0
        terekam_ms = 0
        ada_end = False
        slide = 0
        inter = 0
        kuis_dijawab = 0
        kuis_benar = 0
        kuis_gagal = 0
        peringatan_baca_cepat = 0
        peringatan_diabaikan = 0
        kc_dijawab = 0
        kc_benar = 0
        total_video_modul = None
        total_articulate_modul = None
        articulate_sesi = set()
        video_max_sesi = {}
        video_slide_sesi = {}
        total_slide_modul = None
        slide_unik_sesi = set()
        peringatan_detail_sesi = []
        for r in sess_rows:
            if r.get('learner_id'):
                nip = r['learner_id']
            if r.get('learner_name'):
                nama = r['learner_name']
            if r['created_at'] < mulai:
                mulai = r['created_at']
            p = r.get('payload') or {}
            t = r['event_type']
            if t == 'session_start':
                source = p.get('identity_source')
                total_slide_modul = p.get('total_slide')
                total_video_modul = p.get('total_video')
                total_articulate_modul = p.get('total_articulate')
            elif t == 'video_progress':
                block = p.get('block')
                persen = p.get('persen')
                if block and persen is not None and persen > video_max_sesi.get(block, 0):
                    video_max_sesi[block] = persen
                if block and p.get('slide') is not None:
                    video_slide_sesi[block] = p.get('slide')
            elif t == 'session_end':
                total_ms = max(total_ms, p.get('total_ms') or 0)
                ada_end = True
            elif t == 'slide_view':
                slide += 1
                terekam_ms += p.get('ms') or 0
                if p.get('kind') == 'slide' and p.get('num') is not None:
                    slide_unik_sesi.add(p['num'])
            elif t == 'interaction':
                inter += 1
            elif t == 'quiz_answer':
                kuis_dijawab += 1
                if p.get('benar'):
                    kuis_benar += 1
            elif t == 'quiz_submit':
                if p.get('lulus') is False:
                    kuis_gagal += 1
            elif t == 'reading_warning':
                peringatan_baca_cepat += 1
                if p.get('choice') == 'yakin':
                    peringatan_diabaikan += 1
                peringatan_detail_sesi.append({
                    'section': p.get('section'),
                    'slides': p.get('slides') or [],
                    'choice': p.get('choice'),
                })
            elif t == 'kc_answer':
                kc_dijawab += 1
                if p.get('benar'):
                    kc_benar += 1
            elif t == 'articulate_selesai':
                if p.get('blok'):
                    articulate_sesi.add(p['blok'])
        if not total_ms:
            total_ms = terekam_ms

        # Sesi tanpa identitas sama sekali (mis. baris probe lama) gak punya
        # kunci gabung — dikelompokkan terpisah, jangan dicampur ke peserta
        # manapun.
        key = nip or '(tanpa identitas)'
        L = learners.setdefault(key, {
            'learner_id': key,
            'nama_varian': [],
            'identity_sources': [],
            'modul': {},
            'jumlah_modul': 0,
            'jumlah_sesi': 0,
            'durasi_total_ms': 0,
            'durasi_terekam_ms': 0,
            'durasi_ditinggal_ms': 0,
            'sesi_tanpa_end': 0,
            'jumlah_slide_dilihat': 0,
            'jumlah_interaksi': 0,
            'kuis_dijawab': 0,
            'kuis_benar': 0,
            'kuis_gagal': 0,
            'peringatan_baca_cepat': 0,
            'peringatan_diabaikan': 0,
            # Rincian tiap kejadian reading_warning, ditag dengan slug modul
            # asalnya (peserta bisa punya beberapa modul) - lihat catatan
            # yang sama di summarize_sessions soal kenapa ini otomatis
            # "percobaan pertama saja".
            'peringatan_detail': [],
            'kc_dijawab': 0,
            'kc_benar': 0,
            'pertama': mulai,
            'terakhir': mulai,
            # (slug, nomor) biar nomor slide yang sama di modul BEDA gak
            # ketuker jadi satu waktu digabung.
            '_slide_unik': set(),
            # (slug, block) - sama alasannya kayak _slide_unik: block id yang
            # kebetulan sama di modul BEDA gak boleh ketuker jadi satu video.
            '_video_max': {},
            # (slug, block) -> nomor slide, dipasangkan sama _video_max buat
            # bangun video_detail (rincian per video, bukan cuma rata-rata).
            '_video_slide': {},
            # (slug, block) - block id yang kebetulan sama di modul BEDA gak
            # boleh ketuker jadi satu paket, sama alasannya kayak _video_max.
            '_articulate_selesai': set(),
        })
        if nama and nama not in L['nama_varian']:
            L['nama_varian'].append(nama)
        if source and source not in L['identity_sources']:
            L['identity_sources'].append(source)
        m = L['modul'].setdefault(slug, {'sesi': 0, 'durasi_ms': 0, 'total_slide': None, 'total_video': None, 'total_articulate': None})
        m['sesi'] += 1
        m['durasi_ms'] += total_ms
        # total_slide/total_video sama di semua sesi modul ini (baked saat
        # export) - cukup dicatat sekali, gak perlu dijumlah per sesi.
        if total_slide_modul is not None:
            m['total_slide'] = total_slide_modul
        if total_video_modul is not None:
            m['total_video'] = total_video_modul
        if total_articulate_modul is not None:
            m['total_articulate'] = total_articulate_modul
        for blok in articulate_sesi:
            L['_articulate_selesai'].add((slug, blok))
        for num in slide_unik_sesi:
            L['_slide_unik'].add((slug, num))
        for block, persen in video_max_sesi.items():
            key2 = (slug, block)
            if persen > L['_video_max'].get(key2, 0):
                L['_video_max'][key2] = persen
            if block in video_slide_sesi:
                L['_video_slide'][key2] = video_slide_sesi[block]
        L['jumlah_sesi'] += 1
        L['durasi_total_ms'] += total_ms
        L['durasi_terekam_ms'] += terekam_ms
        # Ditinggal cuma bisa dijumlah dari sesi yang session_end-nya beneran
        # kekirim (sama seperti summarize_sessions) - kalau enggak,
        # total_ms sesi itu dipinjam dari terekam_ms, jadi selisihnya 0
        # palsu kalau ikut dijumlah.
        if ada_end:
            L['durasi_ditinggal_ms'] += max(0, total_ms - terekam_ms)
        else:
            L['sesi_tanpa_end'] += 1
        L['jumlah_slide_dilihat'] += slide
        L['jumlah_interaksi'] += inter
        L['kuis_dijawab'] += kuis_dijawab
        L['kuis_benar'] += kuis_benar
        L['kuis_gagal'] += kuis_gagal
        L['peringatan_baca_cepat'] += peringatan_baca_cepat
        L['peringatan_diabaikan'] += peringatan_diabaikan
        for d in peringatan_detail_sesi:
            L['peringatan_detail'].append({**d, 'modul': slug})
        L['kc_dijawab'] += kc_dijawab
        L['kc_benar'] += kc_benar
        if mulai < L['pertama']:
            L['pertama'] = mulai
        if mulai > L['terakhir']:
            L['terakhir'] = mulai

    out = []
    for L in learners.values():
        L['jumlah_modul'] = len(L['modul'])
        L['modul_slugs'] = sorted(L['modul'].keys())
        L['jumlah_slide_unik'] = len(L.pop('_slide_unik'))
        # Jumlah slide KONTEN di seluruh modul yang pernah dia buka (dijumlah
        # sekali per modul, bukan per sesi). None kalau SEMUA modulnya
        # di-export sebelum fitur ini ada - jangan ditampilkan sebagai 0.
        totals = [m['total_slide'] for m in L['modul'].values() if m['total_slide'] is not None]
        L['total_slide_program'] = sum(totals) if totals else None
        video_totals = [m['total_video'] for m in L['modul'].values() if m['total_video'] is not None]
        L['total_video_program'] = sum(video_totals) if video_totals else None
        art_totals = [m['total_articulate'] for m in L['modul'].values() if m['total_articulate'] is not None]
        L['total_articulate_program'] = sum(art_totals) if art_totals else None
        L['articulate_selesai'] = len(L.pop('_articulate_selesai'))
        video_max = L.pop('_video_max')
        video_slide = L.pop('_video_slide')
        L['video_dimulai'] = len(video_max)
        L['video_rata_persen'] = round(sum(video_max.values()) / len(video_max)) if video_max else None
        # Sama seperti summarize_sessions, tapi ditag nama modul karena satu
        # peserta bisa punya video di beberapa modul. Diurutkan dari yang
        # paling rendah duluan.
        L['video_detail'] = sorted(
            [{'modul': slug, 'slide': video_slide.get((slug, b)), 'persen': p}
             for (slug, b), p in video_max.items()],
            key=lambda d: d['persen'])
        L['durasi_menit'] = round(L['durasi_total_ms'] / 60000, 1)
        L['durasi_tatap_layar_menit'] = round(L['durasi_terekam_ms'] / 60000, 1)
        # None kalau SEMUA sesi peserta ini gak pernah ngirim session_end -
        # gak ada satu pun angka ditinggal yang bisa dipercaya buat
        # dijumlah. Kalau cuma SEBAGIAN, tetap ditampilkan (parsial lebih
        # berguna daripada disembunyikan) tapi ditandai lewat
        # sesi_tanpa_end > 0 biar Command Center bisa kasih tau "sebagian
        # sesi gak keitung" alih-alih diam-diam kurang lengkap.
        sesi_lengkap = L['jumlah_sesi'] - L['sesi_tanpa_end']
        L['durasi_ditinggal_menit'] = (
            round(L['durasi_ditinggal_ms'] / 60000, 1) if sesi_lengkap > 0 else None
        )
        L['nama'] = L['nama_varian'][0] if L['nama_varian'] else None
        # Ditandai supaya penganalisis curiga duluan, bukan ketipu diam-diam:
        # satu NIP dengan nama yang beda jauh biasanya berarti NIP salah ketik
        # atau dipakai dua orang.
        L['nama_bervariasi'] = len(L['nama_varian']) > 1
        out.append(L)
    out.sort(key=lambda x: (-x['jumlah_modul'], -x['durasi_total_ms']))
    return out


# ---------------------------------------------------------------------------
# Rekap pribadi peserta ("Ringkasan Belajarmu")
#
# BEDA TOTAL dari summarize_sessions/summarize_learners di atas: yang itu buat
# TIM (semua peserta, dikunci password). Yang ini buat PESERTA ITU SENDIRI,
# dipanggil dari dalam modul yang lagi dia buka, dan CUMA boleh balikin baris
# milik NIP yang diminta - jangan pernah ditambahi kebocoran ke peserta lain.
#
# Ambang "jelek" di bawah ini SUDAH DISEPAKATI user, jangan diubah diam-diam:
#   slide kelewat cepat  -> ada minimal 1
#   ditinggal            -> > 10 menit (sama persis ambang ⚠ Command Center)
#   video                -> ada yang gak diklik SAMA SEKALI, atau rata-rata <50%
#   knowledge check      -> benar < 50% DARI PERCOBAAN PERTAMA
#   kuis                 -> section terparah gagal >= 2 kali
#   interaktif           -> < 50% menu yang tersedia pernah diklik
#
# Tiap sinyal TRI-STATE: 'jelek' / 'bagus' / None (= n/a, modulnya emang gak
# punya elemen itu). n/a WAJIB dibedakan dari 'jelek' - kalau modul tanpa video
# dihitung "jelek", semua peserta di modul itu kena vonis gara-gara sesuatu
# yang gak pernah ada.
DITINGGAL_JELEK_MENIT = 10
VIDEO_JELEK_PERSEN = 50
KC_JELEK_PERSEN = 50
KUIS_JELEK_GAGAL = 2
INTERAKTIF_JELEK_PERSEN = 50

# idx 0 pada tabs & diagram alur TAMPIL DULUAN tanpa diklik - jadi dia bukan
# "menu tersembunyi yang harus digali". Dikecualikan di dua sisi sekaligus
# (penyebut di generator.py, dan penghitungan unik di sini) supaya rasionya
# jujur; kalau cuma dikecualikan sebelah, peserta bisa dapat 5/4.
_IDX0_DEFAULT_VISIBLE = ('tabs', 'flow')


def _interaksi_key(payload):
    """Kunci unik satu elemen interaktif, atau None kalau elemen itu memang
    tampil duluan tanpa perlu diklik (idx 0 tabs/flow)."""
    jenis = payload.get('jenis')
    idx = payload.get('idx')
    if jenis in _IDX0_DEFAULT_VISIBLE and (idx == 0 or idx is None):
        return None
    return (jenis, payload.get('id'), idx)


def recap_for_learner(module_slug, learner_id, live_session_id=None, live_total_ms=None):
    """Rekap satu peserta di satu modul + pembanding rata-rata kelas.

    Balikan sengaja berisi ANGKA MENTAH + status tiap sinyal, bukan kalimat
    jadi - narasinya disusun di sisi modul (shell-template.html) supaya bisa
    diubah tanpa deploy ulang backend.

    `live_*` itu sesi yang LAGI BERJALAN waktu peserta buka rekapnya. Wajib
    ada, kalau enggak sinyal "ditinggal" gak akan pernah nyala di popup ini:
    ditinggal = total waktu sesi - waktu yang beneran ketatap, dan "total
    waktu sesi" cuma dikirim di `session_end` - yang justru belum kejadian
    persis pada saat peserta lagi ngeliat rekapnya. Modul yang tau angka itu
    sekarang, jadi dia yang nyetorin.
    """
    rows = _tanpa_preflight(fetch_rows(module_slug=module_slug, learner_id=learner_id))

    nama = None
    total_slide = None
    total_video = None
    total_interaktif = None
    slide_titles = {}
    section_titles = {}
    terekam_ms = 0
    # Ditinggal dihitung PER SESI, bukan dari satu angka gabungan. Peserta yang
    # ngulang modul punya beberapa sesi; kalau waktu tatap dijumlah lintas sesi
    # tapi totalnya cuma diambil dari satu sesi, selisihnya jadi ngawur (bisa
    # minus lalu ke-clamp jadi 0 = "gak pernah ditinggal" palsu).
    sesi_terekam_ms = {}
    sesi_total_ms = {}
    slide_unik = set()
    video_max = {}
    video_slide = {}
    peringatan_detail = []
    kuis_gagal_per_section = {}
    interaksi_unik = set()
    # (block, soal) -> benar?  HANYA percobaan PERTAMA yang disimpan. Baris
    # datang urut created_at.asc, jadi kemunculan pertama = percobaan pertama.
    # Ini krusial: mode perOption ngasih peserta ngulang SAMPAI benar, jadi
    # kalau dipukul rata semua percobaan, hampir semua orang keliatan 100%.
    kc_pertama = {}

    for r in rows:
        if r.get('learner_name'):
            nama = r['learner_name']
        p = r.get('payload') or {}
        t = r['event_type']
        if t == 'session_start':
            total_slide = p.get('total_slide', total_slide)
            total_video = p.get('total_video', total_video)
            total_interaktif = p.get('total_interaktif', total_interaktif)
            if p.get('slide_titles'):
                slide_titles = p['slide_titles']
            if p.get('section_titles'):
                section_titles = p['section_titles']
        elif t == 'slide_view':
            ms = p.get('ms') or 0
            terekam_ms += ms
            sesi_terekam_ms[r.get('session_id')] = sesi_terekam_ms.get(r.get('session_id'), 0) + ms
            if p.get('kind') == 'slide' and p.get('num') is not None:
                slide_unik.add(p['num'])
        elif t == 'session_end':
            sid = r.get('session_id')
            sesi_total_ms[sid] = max(sesi_total_ms.get(sid, 0), p.get('total_ms') or 0)
        elif t == 'video_progress':
            block, persen = p.get('block'), p.get('persen')
            if block and persen is not None:
                if persen > video_max.get(block, 0):
                    video_max[block] = persen
                if p.get('slide') is not None:
                    video_slide[block] = p['slide']
        elif t == 'quiz_submit':
            if p.get('lulus') is False and p.get('section'):
                kuis_gagal_per_section[p['section']] = kuis_gagal_per_section.get(p['section'], 0) + 1
        elif t == 'reading_warning':
            peringatan_detail.append({
                'section': p.get('section'),
                'slides': p.get('slides') or [],
                'choice': p.get('choice'),
            })
        elif t == 'kc_answer':
            key = (p.get('block'), p.get('soal'))
            if key not in kc_pertama:
                kc_pertama[key] = bool(p.get('benar'))
        elif t == 'interaction':
            k = _interaksi_key(p)
            if k:
                interaksi_unik.add(k)

    # Sesi yang lagi berjalan: totalnya belum pernah dikirim lewat session_end
    # (peserta masih di dalam modul), jadi diambil dari setoran modul. Kalau
    # sesi itu ternyata SUDAH punya session_end (peserta buka rekap, nutup
    # modul, lalu buka lagi), yang dari database menang - itu angka final.
    if live_session_id and live_total_ms and live_session_id not in sesi_total_ms:
        sesi_total_ms[live_session_id] = live_total_ms

    # ---- ringkas tiap sinyal ----
    tatap_menit = round(terekam_ms / 60000, 1)
    # Cuma sesi yang totalnya diketahui yang ikut dihitung. Sesi yang tabnya
    # dibunuh paksa (gak pernah ngirim session_end) sengaja dilewatin, bukan
    # dianggap nol - lihat alasan yang sama di summarize_sessions.
    ditinggal_ms = sum(
        max(0, tot - sesi_terekam_ms.get(sid, 0)) for sid, tot in sesi_total_ms.items()
    )
    ditinggal_menit = round(ditinggal_ms / 60000, 1) if sesi_total_ms else None

    # Slide kelewat cepat: nomor slide unik + judulnya, plus apakah peserta
    # sempat diperingatkan tapi tetap milih lanjut ke kuis.
    slide_rushed = []
    seen_rushed = set()
    for d in peringatan_detail:
        for num in d['slides']:
            if num in seen_rushed:
                continue
            seen_rushed.add(num)
            slide_rushed.append({'num': num, 'judul': slide_titles.get(str(num)) or ''})
    peringatan_diabaikan = sum(1 for d in peringatan_detail if d.get('choice') == 'yakin')

    video_dimulai = len(video_max)
    video_rata = round(sum(video_max.values()) / video_dimulai) if video_dimulai else None
    video_detail = sorted(
        [{'slide': video_slide.get(b), 'persen': p} for b, p in video_max.items()],
        key=lambda d: d['persen'])

    kc_total = len(kc_pertama)
    kc_benar = sum(1 for v in kc_pertama.values() if v)

    kuis_section_terparah = None
    if kuis_gagal_per_section:
        sid, gagal = max(kuis_gagal_per_section.items(), key=lambda kv: kv[1])
        kuis_section_terparah = {'section': sid, 'judul': section_titles.get(sid) or '', 'gagal': gagal}

    interaktif_diklik = len(interaksi_unik)

    # ---- status tiap sinyal (None = n/a, modulnya gak punya elemen ini) ----
    def _st(kondisi_jelek, ada_datanya=True):
        if not ada_datanya:
            return None
        return 'jelek' if kondisi_jelek else 'bagus'

    sinyal = {
        # n/a kalau modulnya gak punya kuis sama sekali - tanpa kuis, gerbang
        # peringatan baca-cepat memang gak pernah ketrigger, jadi "nol
        # peringatan" di situ bukan bukti peserta membaca dengan benar.
        'slide_cepat': _st(len(slide_rushed) > 0, bool(section_titles)),
        'ditinggal': _st((ditinggal_menit or 0) > DITINGGAL_JELEK_MENIT, ditinggal_menit is not None),
        'video': _st(
            (total_video or 0) > video_dimulai or (video_rata or 0) < VIDEO_JELEK_PERSEN,
            bool(total_video)),
        'kc': _st(kc_benar * 100 < kc_total * KC_JELEK_PERSEN, kc_total > 0),
        'kuis': _st(
            bool(kuis_section_terparah) and kuis_section_terparah['gagal'] >= KUIS_JELEK_GAGAL,
            bool(section_titles)),
        'interaktif': _st(
            interaktif_diklik * 100 < (total_interaktif or 0) * INTERAKTIF_JELEK_PERSEN,
            bool(total_interaktif)),
    }
    jumlah_jelek = sum(1 for v in sinyal.values() if v == 'jelek')
    cabang = 'kurang' if jumlah_jelek >= 3 else ('menengah' if jumlah_jelek == 2 else 'rajin')

    return {
        'ada_data': bool(rows),
        'nama': nama,
        'learner_id': learner_id,
        'tatap_menit': tatap_menit,
        'ditinggal_menit': ditinggal_menit,
        'slide_unik': len(slide_unik),
        'total_slide': total_slide,
        'slide_rushed': slide_rushed,
        'peringatan_diabaikan': peringatan_diabaikan,
        'video_dimulai': video_dimulai,
        'total_video': total_video,
        'video_rata_persen': video_rata,
        'video_detail': video_detail,
        'kc_benar': kc_benar,
        'kc_total': kc_total,
        'kuis_terparah': kuis_section_terparah,
        'interaktif_diklik': interaktif_diklik,
        'total_interaktif': total_interaktif,
        'sinyal': sinyal,
        'jumlah_jelek': jumlah_jelek,
        'cabang': cabang,
        'rata_kelas_tatap_menit': _rata_kelas_tatap_menit(module_slug, exclude_learner_id=learner_id),
    }


def _rata_kelas_tatap_menit(module_slug, exclude_learner_id=None):
    """Rata-rata tatap layar peserta LAIN di modul ini, buat pembanding di
    rekap pribadi. None kalau belum ada peserta LAIN yang cukup buat
    dibandingkan - satu orang gak bisa jadi 'rata-rata kelas', dan diri
    sendiri bukan pembanding buat diri sendiri.

    BUG yang sempat kejadian (ketemu 2026-07-26 pas verifikasi lewat replay
    event sungguhan, bukan angka karangan): sebelum ini `exclude_learner_id`
    gak ada sama sekali, jadi peserta yang buka rekapnya ikut kehitung di
    dalam "rata-rata peserta LAIN" miliknya sendiri - labelnya bilang "peserta
    lain" tapi angkanya diam-diam kecampur data dia sendiri.

    Cuma narik kolom seperlunya DAN cuma event_type slide_view (disaring di
    server lewat PostgREST, bukan dibuang belakangan di Python) - beda dari
    fetch_rows(learner_id=...) punya recap_for_learner yang otomatis kecil
    karena udah difilter ke satu NIP, query pembanding ini jalan buat SEMUA
    peserta modul, jadi paling gampang membengkak kalau gak disaring ketat
    dari awal. Tiap peserta yang buka rekapnya manggil ulang query ini.
    """
    rows = _tanpa_preflight(fetch_rows(
        module_slug=module_slug, columns='learner_id,payload', event_type='slide_view'))
    per_learner = {}
    for r in rows:
        nip = r.get('learner_id')
        if not nip or nip == exclude_learner_id:
            continue
        per_learner[nip] = per_learner.get(nip, 0) + ((r.get('payload') or {}).get('ms') or 0)
    if len(per_learner) < 1:
        return None
    return round(sum(per_learner.values()) / len(per_learner) / 60000, 1)
