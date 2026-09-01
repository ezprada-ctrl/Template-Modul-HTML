"""Bangun ulang Template-Modul-Ikram-Source-Code.html dari isi repo saat ini.

Cetakan itu satu halaman berisi seluruh source code, dipakai buat dibaca/dibagi
tanpa perlu buka repo. Sebelum ada skrip ini isinya disusun manual, jadi begitu
repo jalan terus dia ketinggalan diam-diam: versi terakhir masih memuat 37 file
sementara repo sudah punya belasan file baru (Command Center, Articulate/SCORM,
gaya grafis, dsb), dan yang membaca gak punya cara tau isinya basi.

    python tools/build_source_printout.py

DESAIN halamannya TIDAK ditulis ulang di sini - blok <style> dan <script> di
akhir diambil apa adanya dari berkas cetakan yang sudah ada, jadi tampilan &
perilaku (filter, lipat-buka, sorot sidebar) tetap persis. Yang dibangun ulang
cuma daftar sidebar + isi tiap berkas.
"""
import html
import io
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

AKAR = Path(__file__).resolve().parent.parent
CETAKAN = AKAR / 'Template-Modul-Ikram-Source-Code.html'

# Urutan baca yang disengaja: pintu masuk -> data/logic -> komponen -> backend
# -> konfigurasi. Bukan urutan abjad; yang baru pertama kali lihat repo ini
# butuh urutan yang menjelaskan, bukan yang gampang di-sort.
GRUP = [
    ('Frontend — masuk &amp; setup', [
        'app/src/main.tsx',
        'app/src/App.tsx',
        'app/src/App.css',
        'app/src/index.css',
        'app/src/vite-env.d.ts',
    ]),
    ('Frontend — data &amp; logic inti', [
        'app/src/types.ts',
        'app/src/api.ts',
        'app/src/themes.ts',
        'app/src/graphicStyles.ts',
        'app/src/graphicStylePreviews.ts',
        'app/src/emojiData.ts',
        'app/src/assetEmbed.ts',
        'app/src/scormZip.ts',
        'app/src/demoActivityData.ts',
    ]),
    ('Frontend — komponen (6 tab wizard)', [
        'app/src/components/SlideBank.tsx',
        'app/src/components/Canvas.tsx',
        'app/src/components/BlockEditor.tsx',
        'app/src/components/BlockAddMenu.tsx',
        'app/src/components/BlockPreview.tsx',
        'app/src/components/EmojiPicker.tsx',
        'app/src/components/CoverForm.tsx',
        'app/src/components/GraphicStyleSelect.tsx',
        'app/src/components/QuizBuilder.tsx',
        'app/src/components/SlidePreview.tsx',
        'app/src/components/PreviewExport.tsx',
        'app/src/components/CommandCenter.tsx',
    ]),
    ('Backend — API &amp; generator', [
        'server/api/index.py',
        'server/api/pptx_extract.py',
        'server/api/generator.py',
        'server/api/draft_store.py',
        'server/api/activity_store.py',
        'server/api/r2.py',
        'server/api/shell-template.html',
    ]),
    ('Backend — skrip sekali-jalan', [
        'server/make_template.py',
        'server/test_gen.py',
        'tools/hkpd_to_moduledata.mjs',
    ]),
    ('Konfigurasi &amp; infra', [
        'app/package.json',
        'app/vite.config.ts',
        'app/tsconfig.json',
        'app/tsconfig.app.json',
        'app/tsconfig.node.json',
        'app/.oxlintrc.json',
        'server/vercel.json',
        'server/requirements.txt',
        'server/supabase_setup.sql',
        'server/supabase_activity_setup.sql',
        'server/supabase_storage_setup.sql',
        'server/supabase_storage_media_setup.sql',
        'render.yaml',
    ]),
]

BAHASA = {
    '.tsx': 'tsx', '.ts': 'ts', '.css': 'css', '.py': 'py', '.html': 'html',
    '.json': 'json', '.sql': 'sql', '.yaml': 'yaml', '.yml': 'yaml',
    '.txt': 'txt', '.mjs': 'mjs',
}


def id_berkas(jalur: str) -> str:
    """Id jangkar yang stabil - dipakai href sidebar dan id <section>."""
    return re.sub(r'[^A-Za-z0-9]+', '-', jalur).strip('-')


def ambil_desain(teks: str):
    """Kembalikan (kepala, ekor): semuanya sebelum <div class="wrap"> dan blok
    <script> penutup. Diambil dari cetakan lama supaya desainnya gak berubah
    tiap kali isi di-refresh."""
    potong = teks.find('<div class="wrap">')
    mulai_script = teks.rfind('<script>')
    if potong == -1 or mulai_script == -1:
        sys.exit('Struktur cetakan lama gak dikenali - <div class="wrap"> atau <script> penutup gak ketemu.')
    return teks[:potong], teks[mulai_script:]


def main():
    if not CETAKAN.exists():
        sys.exit(f'{CETAKAN.name} gak ada - skrip ini menyegarkan isinya, bukan membuat desainnya dari nol.')
    kepala, ekor = ambil_desain(io.open(CETAKAN, encoding='utf-8').read())

    berkas = []          # (grup, jalur, isi, jumlah_baris)
    hilang = []
    for label, daftar in GRUP:
        for jalur in daftar:
            p = AKAR / jalur
            if not p.exists():
                hilang.append(jalur)
                continue
            isi = io.open(p, encoding='utf-8').read()
            berkas.append((label, jalur, isi, isi.count('\n') + 1))

    if hilang:
        # Berhenti, bukan diam-diam melewatinya: berkas yang hilang dari daftar
        # berarti daftarnya sudah gak cocok dengan repo, dan cetakan yang jalan
        # terus tanpa suara persis bikin masalah yang skrip ini mau hilangkan.
        sys.exit('Berkas berikut ada di daftar tapi gak ada di repo:\n  ' + '\n  '.join(hilang))

    total_baris = sum(b[3] for b in berkas)
    try:
        komit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=AKAR,
                               capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        komit = 'tidak diketahui'

    keluar = [kepala]
    keluar.append('<div class="wrap">\n  <nav class="sidebar" id="sidebar">\n')
    keluar.append('    <div class="sidebar-head">\n')
    keluar.append('      <p class="sidebar-title">Template Modul Ikram</p>\n')
    keluar.append(f'      <p class="sidebar-sub">{len(berkas)} file / {total_baris} baris kode</p>\n')
    keluar.append('    </div>\n')
    keluar.append('    <div class="filter-box"><input id="filterInput" type="text" placeholder="Cari nama file..." autocomplete="off"></div>\n')

    for label, daftar in GRUP:
        keluar.append(f'    <div class="fgroup"><div class="fgroup-label">{label}</div>\n')
        for jalur in daftar:
            direktori, _, nama = jalur.rpartition('/')
            keluar.append(
                f'      <a class="fitem" href="#{id_berkas(jalur)}" data-path="{jalur.lower()}">'
                f'<span class="fname">{html.escape(nama)}</span>'
                f'<span class="fdir">{html.escape(direktori)}</span></a>\n'
            )
        keluar.append('    </div>\n')
    keluar.append('  </nav>\n\n  <main class="main">\n')

    keluar.append('    <div class="intro">\n')
    keluar.append('      <h1>Seluruh source code, satu halaman</h1>\n')
    keluar.append(
        '      <p>Semua file penting di repo <code>ezprada-ctrl/Template-Modul-HTML</code> digabung '
        'berurutan: frontend (React/TypeScript) dulu, lalu backend (Python), lalu file konfigurasi. '
        'Klik nama file di sidebar buat langsung lompat ke situ, atau ketik di kolom cari. '
        'Klik judul tiap file buat lipat/buka isinya.</p>\n'
    )
    keluar.append(
        f'      <p class="stats">{len(berkas)} file / {total_baris} baris kode &middot; '
        f'commit <code>{komit}</code> &middot; dicetak {date.today():%d %B %Y} &middot; '
        'perbarui dengan <code>python tools/build_source_printout.py</code></p>\n'
    )
    keluar.append('    </div>\n\n')

    for _label, jalur, isi, baris in berkas:
        direktori, _, nama = jalur.rpartition('/')
        bahasa = BAHASA.get(Path(jalur).suffix, 'txt')
        keluar.append(f'<section class="file" id="{id_berkas(jalur)}">\n')
        keluar.append('  <div class="file-head">\n')
        keluar.append(
            f'    <div class="file-path"><span class="dir">{html.escape(direktori + "/" if direktori else "")}</span>'
            f'<span class="base">{html.escape(nama)}</span></div>\n'
        )
        keluar.append(
            f'    <div class="file-meta"><span class="lang">{bahasa}</span>'
            f'<span class="lines">{baris} baris</span></div>\n'
        )
        keluar.append('  </div>\n')
        keluar.append(f'  <pre class="code lang-{bahasa}"><code>{html.escape(isi, quote=True)}</code></pre>\n')
        keluar.append('</section>\n\n')

    keluar.append('  </main>\n</div>\n\n')
    keluar.append(ekor)

    io.open(CETAKAN, 'w', encoding='utf-8', newline='\n').write(''.join(keluar))
    print(f'{CETAKAN.name}: {len(berkas)} file / {total_baris} baris (commit {komit})')


main()
