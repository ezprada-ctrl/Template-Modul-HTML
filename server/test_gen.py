import json
import generator

module = {
  "title": "Modul Uji Coba",
  "slug": "uji-coba",
  "heroTitleHtml": "PKN STAN<br><span>Untuk Indonesia</span>",
  "heroDesc": "Deskripsi uji coba modul.",
  "coverImageDataUri": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "sections": [
    {"id": "a", "title": "A. Bagian Satu", "short": "Bagian Satu", "icon": "A", "color": "#c99a3d"}
  ],
  "slides": [
    {"number": 2, "sectionId": "a", "title": "Learning Objective", "kickerLabel": "A.1 UJI", "blocks": [
        {"type": "card", "icon": "\U0001F4CC", "heading": "Kartu", "bodyHtml": "<p>isi kartu</p>"},
    ]},
    {"number": 3, "sectionId": "a", "title": "Slide Kedua", "kickerLabel": "A.2", "blocks": [
        {"type": "callout", "variant": "amber", "badge": "1", "bodyHtml": "catatan penting"},
    ]},
    {"number": 4, "sectionId": "a", "title": "Slide Ketiga", "kickerLabel": "A.3", "blocks": [
        {"type": "ticklist", "ordered": True, "items": ["item satu", "item dua"]},
    ]},
  ],
  "quizzes": {"a": [{"q": "Contoh soal?", "opts": ["A", "B", "C", "D"], "correct": 1, "explain": "karena B"}]},
  "multiGroups": {}
}

html = generator.generate_html(module)
print("LENGTH", len(html))
leftovers = [tok for tok in ["__TITLE__", "__SECTIONS_JS__", "__SLIDE_CONSTS_JS__", "__COVER_IMAGE__",
                              "__STORAGE_KEY__", "__SLIDE_TITLES_JS__", "__QUIZZES_JS__", "__MULTI_GROUPS_JS__",
                              "__NAV_JS__", "__HERO_TITLE_HTML__", "__HERO_DESC__"]
             if tok in html]
print("leftover placeholders:", leftovers)

import re
nav_match = re.search(r"const NAV = (\[.*?\]);", html, re.S)
print("NAV:", nav_match.group(1) if nav_match else "NOT FOUND")
hero_match = re.search(r'<h1 class="hero-title">(.*?)</h1>\s*<p class="hero-desc">(.*?)</p>', html, re.S)
print("HERO:", hero_match.groups() if hero_match else "NOT FOUND")
with open('test_out.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("wrote test_out.html")
