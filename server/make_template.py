"""
One-off script: reads the reference Modul 1 HTML (proven bug-free blueprint)
and produces a "shell" template with placeholder tokens where per-module
content lives. The shell keeps 100% of the CSS + mechanism JS (gating, quiz,
SCORM, sound, sidebar, dev mode, nav, component helper functions) untouched.

Placeholders (replaced by the generator at export time):
  __TITLE__            <title> text
  __COVER_IMAGE__       cover-bg background-image data URI (jpeg/png)
  __STORAGE_KEY__       localStorage key slug
  __SECTIONS_JS__       `const SECTIONS = [...]`  body (array literal)
  __SLIDE_CONSTS_JS__   all `const SLIDE_N = ...;` declarations + SLIDES map
  __SLIDE_TITLES_JS__   `const SLIDE_TITLES = {...}` body
  __QUIZZES_JS__        `const QUIZZES = {...}` body
  __MULTI_GROUPS_JS__   `const MULTI_GROUPS = {...}` body
  __NAV_JS__            `const NAV = [...]` body (was hand-built with hardcoded
                         section ids + slide-number ranges — this was missed in
                         the first extraction pass and caused stale nav/progress)
  __HERO_TITLE_HTML__   renderHero() <h1 class="hero-title"> inner HTML
  __HERO_DESC__         renderHero() <p class="hero-desc"> text
  __SIDEBAR_EYEBROW__   sidebar brand <div class="t1"> (small eyebrow, e.g. "Open Access")
  __SIDEBAR_TITLE__     sidebar brand <div class="t2"> (short module name shown in sidebar)
"""
import re, io

SRC = r"\\?\C:\Users\muhammad.ikram\OneDrive - Kemenkeu\Ikram's Work\2026\WORK\TUSI\OA Ikram In Charge\E-Learning Gambaran, Tahapan, Teknik dan Metode Pemeriksaan (Open Access)\Konsep Baru\Modul 1 - Gambaran Umum, Aspek Hukum Pem dan Etika Profesi\Gambaran Umum, Aspek Hukum Pemeriksaan, dan Etika Profesi - Bahan Ajar Interaktif.html"
OUT = r"\\?\C:\Users\muhammad.ikram\OneDrive - Kemenkeu\Ikram's Work\2026\WORK\Template Modul Ikram\server\shell-template.html"
REPORT = r"\\?\C:\Users\muhammad.ikram\OneDrive - Kemenkeu\Ikram's Work\2026\WORK\Template Modul Ikram\server\make_template_report.txt"

with io.open(SRC, encoding='utf-8') as f:
    src = f.read()

report = []

def do(label, pattern, replacement, flags=re.S):
    global src
    m = re.search(pattern, src, flags)
    report.append(f"{label} match: {bool(m)}")
    if not m:
        with io.open(REPORT, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        raise SystemExit(f"FAILED: {label}")
    src = src[:m.start()] + replacement + src[m.end():]

do('title', r'<title>.*?</title>', '<title>__TITLE__</title>')

do('cover-bg',
   r"background-image:linear-gradient\(.*?\),url\('data:image/[^']+'\);",
   "background-image:linear-gradient(180deg,rgba(10,14,20,.35),rgba(8,10,14,.72)),url('__COVER_IMAGE__');")

do('SECTIONS', r"const SECTIONS = \[.*?\];\n", "const SECTIONS = __SECTIONS_JS__;\n")

do('SLIDE consts+map',
   r"const SLIDE_2 = `.*?const SLIDES = \{[^;]*?\};\n",
   "__SLIDE_CONSTS_JS__\n")

do('SLIDE_TITLES', r"const SLIDE_TITLES = \{.*?\};\n", "const SLIDE_TITLES = __SLIDE_TITLES_JS__;\n")

do('QUIZZES', r"const QUIZZES = \{.*?\n\};\n", "const QUIZZES = __QUIZZES_JS__;\n")

do('MULTI_GROUPS', r"const MULTI_GROUPS = \{.*?\n\};\n", "const MULTI_GROUPS = __MULTI_GROUPS_JS__;\n")

do('STORAGE_KEY', r"const STORAGE_KEY = '[^']*';", "const STORAGE_KEY = '__STORAGE_KEY__';", flags=0)

do('NAV',
   r"/\* Build linear navigation \*/\nconst NAV = \[\];\n(?:NAV\.push\([^)]*\);\n|for\([^)]*\) NAV\.push\([^)]*\);\n)*",
   "/* Build linear navigation */\nconst NAV = __NAV_JS__;\n")

do('HERO_TITLE',
   r'<h1 class="hero-title">.*?</h1>',
   '<h1 class="hero-title">__HERO_TITLE_HTML__</h1>')

do('HERO_DESC',
   r'<p class="hero-desc">.*?</p>',
   '<p class="hero-desc">__HERO_DESC__</p>')

do('SIDEBAR_EYEBROW', r'<div class="t1">.*?</div>', '<div class="t1">__SIDEBAR_EYEBROW__</div>')

do('SIDEBAR_TITLE', r'<div class="t2">.*?</div>', '<div class="t2">__SIDEBAR_TITLE__</div>')

with io.open(OUT, 'w', encoding='utf-8') as f:
    f.write(src)

with io.open(REPORT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(report))
    f.write(f"\nshell length: {len(src)}\n")

print('\n'.join(report))
print('shell length', len(src))
