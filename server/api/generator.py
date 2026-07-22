"""
Generator: turns a ModuleData JSON (built via the drag-drop app) into a single
self-contained HTML file identical in mechanics to Modul 1 / Modul 2 blueprint.

Strategy: load shell-template.html (produced once by make_template.py from the
proven-bug-free Modul 1 source) and replace the placeholder tokens. All CSS +
gating/quiz/SCORM/sound/sidebar/dev-mode JS is left 100% untouched.
"""
import json
import re
import html as html_lib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHELL_PATH = os.path.join(BASE_DIR, 'shell-template.html')

with open(SHELL_PATH, encoding='utf-8') as f:
    SHELL = f.read()


def hex_to_rgba(hex_color, alpha):
    hex_color = hex_color.lstrip('#')
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    return f'rgba({r},{g},{b},{alpha})'


def lighten_hex(hex_color, amount=18):
    hex_color = hex_color.lstrip('#')
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
    r, g, b = (min(255, c + amount) for c in (r, g, b))
    return f'#{r:02x}{g:02x}{b:02x}'


def js_str(value):
    """Encode a Python value as a JSON literal safe to embed inside a <script> tag."""
    raw = json.dumps(value, ensure_ascii=False)
    return raw.replace('</script', '<\\/script').replace('<!--', '<\\!--')


def esc(s):
    return html_lib.escape(s or '', quote=False)


def nl2br(text):
    """Every newline the author actually typed (pressing Enter in the
    textarea) becomes one <br> - so plain Enter presses produce spacing in
    the output instead of requiring hand-typed <br> tags. Old content that
    already has literal <br> text (no real newline characters) is untouched
    by this - there's nothing here for it to convert."""
    return (text or '').replace('\r\n', '\n').replace('\r', '\n').replace('\n', '<br>')


# ---------------------------------------------------------------- block renderers

def render_card(b):
    icon_html = ''
    if b.get('icon'):
        bg = b.get('iconBg', 'var(--accent-soft)')
        color = b.get('iconColor', 'var(--accent-2)')
        icon_html = f'<span class="ic" style="background:{bg};color:{color};">{b["icon"]}</span>'
    heading = f'<h3>{icon_html}{esc(b.get("heading",""))}</h3>' if b.get('heading') else ''
    return f'<div class="card">{heading}{nl2br(b.get("bodyHtml",""))}</div>'


def render_callout(b):
    variant = b.get('variant', 'amber')
    inner = ''
    if b.get('badge'):
        inner += f'<span class="ic-badge">{esc(b["badge"])}</span>'
    elif b.get('pill'):
        inner += f'<span class="ic-pill">{esc(b["pill"])}</span>'
    elif b.get('icon'):
        inner += f'<span class="ic">{b["icon"]}</span>'
    inner += f'<div>{nl2br(b.get("bodyHtml",""))}</div>'
    return f'<div class="callout {variant}">{inner}</div>'


def render_definition(b):
    tag = f'<span class="tag">{esc(b.get("tag","DEFINISI"))}</span>'
    return f'<div class="definition">{tag}{nl2br(b.get("bodyHtml",""))}</div>'


def render_pullquote(b):
    return (f'<div class="pull-quote"><span class="pq-num">{esc(b.get("num",""))}</span>'
            f'<span class="pq-text">{b.get("text","")}</span></div>')


def render_ticklist(b):
    tag = 'ol' if b.get('ordered') else 'ul'
    stacked = ' tick-stacked' if b.get('stacked') else ''
    items = ''.join(f'<li>{item}</li>' for item in b.get('items', []))
    return f'<{tag} class="tick{stacked}">{items}</{tag}>'


def render_accordion(b):
    prefix = b.get('id', 'acc')
    items = b.get('accItems', [])
    out = ''
    for i, it in enumerate(items):
        m = re.match(r'^([a-z](?:-[a-z])?)\.\s*(.*)$', it.get('h', ''), re.I)
        badge = m.group(1) if m else str(i + 1)
        label = m.group(2) if m else it.get('h', '')
        out += (f'<div class="acc-item" id="{prefix}-{i}">'
                f'<button class="acc-head" onclick="toggleAcc(\'{prefix}-{i}\')">'
                f'<span class="acc-n">{esc(badge)}</span><span>{esc(label)}</span>'
                f'<span class="acc-chevron">⌄</span></button>'
                f'<div class="acc-body"><div class="acc-body-inner">{nl2br(it.get("b",""))}</div></div></div>')
    return f'<div class="acc-group">{out}</div>'


def render_tabs(b):
    prefix = b.get('id', 'tabs')
    tabs = b.get('tabItems', [])
    head = f'<div class="tabs" id="{prefix}-tabs">'
    body = ''
    for i, t in enumerate(tabs):
        active = ' active' if i == 0 else ''
        head += f'<button class="tab-btn{active}" onclick="switchTab(\'{prefix}\',{i})">{esc(t.get("label",""))}</button>'
        body += f'<div class="tab-panel{active}" id="{prefix}-panel-{i}">{nl2br(t.get("content",""))}</div>'
    head += '</div>'
    return f'<div class="tabs-wrap" id="{prefix}-wrap">{head}{body}</div>'


def render_timeline(b):
    items = b.get('tlItems', [])
    out = '<div class="timeline">'
    for it in items:
        out += (f'<div class="tl-item"><div class="tl-dot-wrap"><div class="tl-dot"></div>'
                f'<div class="tl-item-line"></div></div><div class="tl-content">'
                f'<div class="tl-time">{esc(it.get("time",""))}</div>'
                f'<div class="tl-title">{esc(it.get("title",""))}</div>'
                f'<div class="tl-desc">{nl2br(it.get("desc",""))}</div></div></div>')
    out += '</div>'
    return out


def render_dtable(b):
    headers = ''.join(f'<th>{esc(h)}</th>' for h in b.get('headers', []))
    rows = ''
    for row in b.get('rows', []):
        rows += '<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>'
    return f'<table class="dtable"><thead><tr>{headers}</tr></thead><tbody>{rows}</tbody></table>'


FLOW_DATA = {}  # collected across the whole generation pass, flushed after SLIDES map

# Flags collected while rendering blocks in one generation pass. `has_instagram`
# drives whether the shell loads Instagram's embed.js (a <script> the block
# itself can't run, because slide HTML is injected via innerHTML which never
# executes injected <script> tags). Reset at the start of generate_html.
GEN_FLAGS = {'has_instagram': False}


def render_flow(b):
    container_id = b.get('id', 'flow')
    # detail is pre-processed here (not left raw) because it's also stored
    # into FLOW_DATA below, which the client JS later injects via
    # `.innerHTML = steps[idx].detail` (see toggleFlow in shell-template.html)
    # - it needs to already be <br>-ified by the time it lands there.
    steps = [{**s, 'detail': nl2br(s.get('detail', ''))} for s in b.get('steps', [])]
    FLOW_DATA[container_id] = steps
    out = f'<div class="card"><div id="{container_id}-wrap"><div class="flow">'
    for i, s in enumerate(steps):
        badge_cls = ' new' if s.get('badge') else ''
        badge_html = f'<div class="fs-badge">{esc(s["badge"])}</div>' if s.get('badge') else ''
        out += (f'<div class="flow-step{badge_cls}" data-idx="{i}" onclick="toggleFlow(\'{container_id}\',{i})">'
                f'{badge_html}<div class="fs-num">{esc(str(s.get("n","")))}</div>'
                f'<div class="fs-title">{esc(s.get("title",""))}</div></div>')
        if i < len(steps) - 1:
            out += '<div class="flow-arrow">›</div>'
    out += '</div>'
    first_detail = steps[0]['detail'] if steps else ''
    out += f'<div class="flow-detail" id="{container_id}-detail">{first_detail}</div></div></div>'
    return out


def render_grid(b):
    cols = b.get('columns', 2)
    cls = 'grid2' if cols == 2 else 'grid3'
    inner = ''.join(render_block(sub) for sub in b.get('blocks', []))
    return f'<div class="{cls}">{inner}</div>'


def render_image(b):
    caption = f'<p style="font-size:12.5px;color:var(--text-faint);margin-top:8px;">{esc(b.get("caption",""))}</p>' if b.get('caption') else ''
    return f'<div class="card"><img src="{b.get("src","")}" style="width:100%;border-radius:12px;display:block;" alt="">{caption}</div>'


def render_badge_ref(b):
    return f'<span class="badge-ref">{esc(b.get("refText",""))}</span>'


def render_html(b):
    return b.get('raw', '')


def _caption_html(b):
    if not b.get('caption'):
        return ''
    return f'<p style="font-size:12.5px;color:var(--text-faint);margin-top:8px;">{esc(b.get("caption",""))}</p>'


def _youtube_id(url):
    """Pull the 11-char video id out of any common YouTube URL shape
    (watch?v=, youtu.be/, /embed/, /shorts/, /live/) or accept a bare id.
    Returns '' if nothing plausible is found, so render_media can show a hint
    instead of a broken embed."""
    url = (url or '').strip()
    if not url:
        return ''
    patterns = [
        # watch?v=ID and ...&v=ID — the `[?&]` matches the `?` right before v,
        # which the previous (buggy) pattern required a param BEFORE v to work.
        r'[?&]v=([A-Za-z0-9_-]{11})',
        r'youtu\.be/([A-Za-z0-9_-]{11})',
        r'youtube\.com/embed/([A-Za-z0-9_-]{11})',
        r'youtube\.com/shorts/([A-Za-z0-9_-]{11})',
        r'youtube\.com/live/([A-Za-z0-9_-]{11})',
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    # Bare id pasted on its own.
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', url):
        return url
    return ''


def render_media(b):
    source = b.get('mediaSource', 'video')
    caption = _caption_html(b)

    if source == 'youtube':
        raw_url = b.get('embedUrl', '') or ''
        vid = _youtube_id(raw_url)
        if not vid:
            return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                    '⚠ URL YouTube belum valid — tempel link seperti '
                    'https://youtu.be/xxxx atau .../watch?v=xxxx.</p></div>')
        # Facade: tampilkan thumbnail asli video di dalam kotak beraspek-rasio
        # + tombol play; baru pas diklik iframe player-nya dimuat (playYouTube
        # di shell). Lebih ringan + lebih rapi ketimbang langsung nanam iframe,
        # dan yang keliatan di slide persis gambar depan videonya. Shorts =
        # 9:16 (portrait, lebar dibatasi), selain itu 16:9.
        is_short = '/shorts/' in raw_url
        ratio = '177.78%' if is_short else '56.25%'  # tinggi:lebar (9:16 vs 16:9)
        thumb = f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'
        facade = (
            f'<div class="video-facade" data-ytid="{vid}" role="button" tabindex="0" '
            f'onclick="playYouTube(this)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){{event.preventDefault();playYouTube(this);}}" '
            f'aria-label="Putar video YouTube" '
            f'style="position:relative;width:100%;padding-bottom:{ratio};height:0;'
            f'border-radius:12px;overflow:hidden;cursor:pointer;'
            f'background:#000 center/cover no-repeat url(&#39;{thumb}&#39;);">'
            '<span class="video-play"></span>'
            '</div>'
        )
        # Shorts (9:16) dibatasi lebarnya lewat WRAPPER, bukan max-width di
        # facade-nya sendiri - padding-bottom% dihitung dari lebar containing
        # block, jadi kalau facade-nya yang di-cap, rasionya jadi meleset.
        if is_short:
            facade = f'<div style="max-width:320px;margin:0 auto;">{facade}</div>'
        return f'<div class="card">{facade}{caption}</div>'

    if source == 'instagram':
        url = esc(b.get('embedUrl', '').strip())
        if not url:
            return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                    '⚠ URL Instagram belum diisi.</p></div>')
        GEN_FLAGS['has_instagram'] = True
        # Official embed markup; embed.js (loaded by the shell) upgrades this
        # blockquote into the responsive widget yang menampilkan thumbnail +
        # caption postingan. Beda dari YouTube, thumbnail IG gak bisa diambil
        # tanpa API token Meta, jadi widget resmi ini satu-satunya cara anon
        # buat nampilin gambar depannya. Placeholder di dalam blockquote tampil
        # sebelum widget selesai load (atau kalau jaringan blokir instagram.com).
        return (
            '<div class="card" style="display:flex;flex-direction:column;align-items:center;">'
            f'<blockquote class="instagram-media" data-instgrm-permalink="{url}" '
            'data-instgrm-version="14" '
            'style="background:#FFF;border:0;margin:0 auto;max-width:540px;width:100%;min-height:120px;padding:0;">'
            '<div style="padding:24px;text-align:center;color:#8891a8;font-size:12.5px;">Memuat postingan Instagram…</div>'
            '</blockquote>'
            f'{caption}</div>'
        )

    # Default: uploaded video. controls + WITH sound (no `muted`), playsinline
    # so mobile doesn't force fullscreen.
    src = b.get('src', '')
    if not src:
        return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                '⚠ Video belum diupload.</p></div>')
    return (
        '<div class="card">'
        f'<video controls playsinline preload="metadata" src="{src}" '
        'style="width:100%;border-radius:12px;display:block;background:#000;"></video>'
        f'{caption}</div>'
    )


def render_knowledge(b):
    """Knowledge-check renders NOTHING inline. It surfaces as a popup when the
    learner tries to LEAVE the slide it's on (see openKcPopup/goTo in the
    shell). The question data is baked per-slide into SLIDE_KC (built in
    generate_html), so nothing needs to be in the slide body here."""
    return ''


def kc_items_for_slide(slide):
    """Collect all knowledge-check blocks on a slide into the shape the shell's
    popup needs. q/opts are HTML-escaped and feedback nl2br'd here so the shell
    can inject them straight into innerHTML without re-escaping."""
    out = []
    for b in slide.get('blocks', []):
        if b.get('type') != 'knowledge':
            continue
        items = [
            {
                'q': esc(it.get('q', '')),
                'opts': [esc(o) for o in (it.get('opts') or [])],
                'correct': it.get('correct', 0),
                'feedback': nl2br(it.get('feedback', '')),
            }
            for it in (b.get('kcItems') or [])
            if (it.get('opts') or [])  # skip malformed questions with no options
        ]
        if items:
            out.append({'block': b.get('id', 'kc'), 'items': items})
    return out


def render_modal(b):
    modal_id = b.get('id', 'modal')
    title = esc(b.get('heading', 'Info Tambahan'))
    body = nl2br(b.get('bodyHtml', ''))
    icon = b.get('icon') or '📝'
    return (
        f'<button class="modal-trigger" onclick="openModal(\'{modal_id}\')">'
        f'<span class="ic">{icon}</span><span>{title}</span><span class="chevron">›</span></button>'
        f'<div class="modal-overlay" id="{modal_id}" onclick="if(event.target===this) closeModal(\'{modal_id}\')">'
        f'<div class="modal-box"><button class="modal-close" onclick="closeModal(\'{modal_id}\')">✕</button>'
        f'<h3>{title}</h3>{body}</div></div>'
    )


BLOCK_RENDERERS = {
    'card': render_card,
    'callout': render_callout,
    'definition': render_definition,
    'pullquote': render_pullquote,
    'ticklist': render_ticklist,
    'accordion': render_accordion,
    'tabs': render_tabs,
    'timeline': render_timeline,
    'dtable': render_dtable,
    'flow': render_flow,
    'grid': render_grid,
    'image': render_image,
    'modal': render_modal,
    'badgeref': render_badge_ref,
    'html': render_html,
    'media': render_media,
    'knowledge': render_knowledge,
}


def render_block(b):
    fn = BLOCK_RENDERERS.get(b.get('type'))
    if not fn:
        return ''
    return fn(b)


def render_slide_html(slide):
    kicker = f'<div class="kicker"><span class="num">{slide["number"]}</span>{esc(slide.get("kickerLabel",""))}</div>'
    title = f'<h1 class="slide-title">{esc(slide.get("title",""))}</h1>'
    sub = f'<p class="slide-sub">{slide.get("subtitle","")}</p>' if slide.get('subtitle') else ''
    body = ''.join(render_block(b) for b in slide.get('blocks', []))
    return kicker + title + sub + body


# Kecepatan baca diam rata-rata orang dewasa: 238 kata/menit (Brysbaert 2019,
# meta-analisis 190 studi/18.573 partisipan - lihat memory
# project_reading_speed_brysbaert). BUKAN 250-300 yang sering dikutip - itu
# angka lama yang ikut menghitung skimming sebagai "membaca".
BRYSBAERT_WPM = 238


def count_words(html_fragment):
    """Perkiraan jumlah kata dari HTML yang sudah dirender: buang semua tag,
    hitung token yang dipisah spasi. Kasar buat blok non-prosa (Tabel Data,
    Diagram Alur) - dihitung dari teks yang ada apa adanya, gak sempurna tapi
    cukup adil buat semua jenis blok tanpa perlu logika beda-beda per tipe."""
    text = re.sub(r'<[^>]+>', ' ', html_fragment)
    text = html_lib.unescape(text)
    return len(text.split())


def slide_min_read_ms(word_count):
    """Waktu minimum buat SECARA MASUK AKAL membaca slide ini, berdasar
    kecepatan baca rata-rata. Dipakai Command Center/modul buat bedain
    "dibaca" dari "numpang klik lewat" - bukan estimasi "dibaca sampai
    tuntas", cuma batas bawah paling longgar."""
    return round(word_count / BRYSBAERT_WPM * 60000)


# ---------------------------------------------------------------- main generator

def slugify(text):
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return s or 'modul'


def build_nav(module):
    sections = module.get('sections', [])
    quizzes = module.get('quizzes', {})
    slides_by_section = {}
    for s in module.get('slides', []):
        slides_by_section.setdefault(s['sectionId'], []).append(s)
    for sid in slides_by_section:
        slides_by_section[sid].sort(key=lambda s: s['number'])

    nav = []
    first_section_id = sections[0]['id'] if sections else None
    nav.append({'kind': 'hero', 'section': first_section_id, 'num': 1})
    for sec in sections:
        for s in slides_by_section.get(sec['id'], []):
            nav.append({'kind': 'slide', 'section': sec['id'], 'num': s['number']})
        # Skip the quiz checkpoint entirely for sections with no authored
        # questions - a section with nothing to quiz on shouldn't gate
        # navigation, and the client renderer crashes trying to render a
        # quiz with an undefined question list.
        if quizzes.get(sec['id']):
            nav.append({'kind': 'quiz', 'section': sec['id']})
    last_section_id = sections[-1]['id'] if sections else None
    nav.append({'kind': 'summary', 'section': last_section_id})
    return nav


def generate_html(module):
    FLOW_DATA.clear()
    GEN_FLAGS['has_instagram'] = False

    out = SHELL

    out = out.replace('__TITLE__', esc(module.get('title', 'Modul E-Learning')))

    theme = module.get('theme') or {}
    theme_accent = theme.get('accent', '#c99a3d')
    theme_navy = theme.get('navy', '#1b2a4a')
    out = out.replace('__THEME_ACCENT_2__', theme.get('accent2', '#b3822a'))
    out = out.replace('__THEME_ON_ACCENT__', theme.get('onAccent', '#2a1c04'))
    out = out.replace('__THEME_ACCENT_SOFT__', hex_to_rgba(theme_accent, '.14'))
    out = out.replace('__THEME_ACCENT_GLOW__', hex_to_rgba(theme_accent, '.45'))
    out = out.replace('__THEME_NAVY_SOFT__', hex_to_rgba(theme_navy, '.16'))
    out = out.replace('__THEME_NAVY_2__', lighten_hex(theme_navy))
    out = out.replace('__THEME_ACCENT__', theme_accent)
    out = out.replace('__THEME_NAVY__', theme_navy)

    cover = module.get('coverImageDataUri', '')
    out = out.replace('__COVER_IMAGE__', cover)

    slug = module.get('slug') or slugify(module.get('title', 'modul'))
    out = out.replace('__STORAGE_KEY__', f'pilar-{slug}-progress-v1')
    # Tags every activity row so the Command Center can tell modules apart.
    out = out.replace('__MODULE_SLUG_JS__', js_str(slug))

    module_title_js = esc(module.get('sidebarTitle') or module.get('title', '')).replace("'", "\\'")
    out = out.replace('__MODULE_TITLE__', module_title_js)

    sections = module.get('sections', [])
    out = out.replace('__SECTIONS_JS__', js_str(sections))

    slides = sorted(module.get('slides', []), key=lambda s: s['number'])
    consts = []
    titles = {}
    min_ms_per_slide = {}
    for s in slides:
        html_body = render_slide_html(s)
        consts.append(f'const SLIDE_{s["number"]} = {js_str(html_body)};')
        titles[str(s['number'])] = s.get('title', '')
        min_ms_per_slide[str(s['number'])] = slide_min_read_ms(count_words(html_body))
    slides_map = 'const SLIDES = {' + ','.join(f'{s["number"]}:SLIDE_{s["number"]}' for s in slides) + '};'
    flow_flush = ''.join(
        f"window._flowData['{cid}'] = {js_str(steps)};\n" for cid, steps in FLOW_DATA.items()
    )
    slide_block = '\n'.join(consts) + '\n' + slides_map + '\n' + flow_flush
    out = out.replace('__SLIDE_CONSTS_JS__', slide_block)

    # Per-slide voiceover audio: {slideNumber: {src, mode}}. Only slides that
    # actually have audio are included, so the map stays small.
    slide_audio = {
        str(s['number']): {'src': s['audioSrc'], 'mode': s.get('audioMode') or 'manual'}
        for s in slides if s.get('audioSrc')
    }
    out = out.replace('__SLIDE_AUDIO_JS__', js_str(slide_audio))

    # Knowledge-check questions, per slide: {slideNumber: [{block, items:[...]}]}.
    # Renders as NOTHING in the slide body (render_knowledge returns '') -
    # the shell shows these as a popup when the learner tries to LEAVE the
    # slide, not inline. Only slides that actually carry a knowledge-check
    # block are included.
    slide_kc = {}
    for s in slides:
        kc = kc_items_for_slide(s)
        if kc:
            slide_kc[str(s['number'])] = kc
    out = out.replace('__SLIDE_KC_JS__', js_str(slide_kc))

    # Whether any block is an Instagram embed → shell conditionally loads
    # embed.js. Set during the render_slide_html loop above (render_media flips
    # the flag), so it's accurate by now.
    out = out.replace('__HAS_INSTAGRAM_JS__', js_str(GEN_FLAGS['has_instagram']))

    out = out.replace('__SLIDE_TITLES_JS__', js_str(titles))
    # Ditanam biar Command Center bisa nunjukin "52 kunjungan (50/50 slide)"
    # alih-alih angka telanjang - penyusun modul jarang inget persis modulnya
    # ada berapa slide, jadi tanpa pembanding ini gak ada yang tau kalau
    # kunjungan udah lebih dari totalnya (tanda ada pengulangan) atau malah
    # ada slide yang gak pernah kesentuh sama sekali.
    out = out.replace('__TOTAL_SLIDES_JS__', js_str(len(slides)))
    # Waktu baca minimum per slide (ms), dari jumlah kata / 238 wpm (Brysbaert
    # 2019). Dipakai modul buat deteksi slide yang di-klik-lewat terlalu
    # cepat sebelum kuis bagian itu - lihat resolveReadingWarning() di
    # shell-template.html.
    out = out.replace('__SLIDE_MIN_MS_JS__', js_str(min_ms_per_slide))

    quizzes = module.get('quizzes', {})
    out = out.replace('__QUIZZES_JS__', js_str(quizzes))

    multi_groups = module.get('multiGroups', {})
    out = out.replace('__MULTI_GROUPS_JS__', js_str(multi_groups))

    nav = build_nav(module)
    out = out.replace('__NAV_JS__', js_str(nav))

    out = out.replace('__HIDE_PROGRESS_JS__', js_str(bool(module.get('hideProgress', False))))

    # Activity recording (opt-in per module via the Sampul tab). The anon key
    # is deliberately baked into the exported HTML: the module is a static
    # file running inside an LMS with no backend of its own, so it writes to
    # Supabase directly. That's safe *only* because RLS grants anon
    # INSERT-only with zero SELECT on modul_activity — see
    # server/supabase_activity_setup.sql. Never swap this for a service_role
    # key: it would be readable by every learner who views source.
    # Kredensial cuma ditanam kalau modulnya memang merekam. Modul biasa
    # jangan sampai bawa-bawa key yang gak dia pakai.
    track = bool(module.get('trackActivity', False))
    out = out.replace('__TRACK_ACTIVITY_JS__', js_str(track))
    out = out.replace('__SUPABASE_URL_JS__', js_str(os.environ.get('SUPABASE_URL', '').rstrip('/') if track else ''))
    out = out.replace('__SUPABASE_ANON_KEY_JS__', js_str(os.environ.get('SUPABASE_ANON_KEY', '') if track else ''))

    hero_title_html = nl2br(module.get('heroTitleHtml') or esc(module.get('title', '')))
    out = out.replace('__HERO_TITLE_HTML__', hero_title_html)

    hero_desc = nl2br(module.get('heroDesc', ''))
    out = out.replace('__HERO_DESC__', hero_desc)

    sidebar_eyebrow = esc(module.get('sidebarEyebrow') or 'Open Access')
    out = out.replace('__SIDEBAR_EYEBROW__', sidebar_eyebrow)

    sidebar_title = esc(module.get('sidebarTitle') or module.get('title', ''))
    out = out.replace('__SIDEBAR_TITLE__', sidebar_title)

    return out
