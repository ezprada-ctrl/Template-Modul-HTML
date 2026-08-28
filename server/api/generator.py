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
            f'<span class="pq-text">{nl2br(b.get("text",""))}</span></div>')


def render_ticklist(b):
    tag = 'ol' if b.get('ordered') else 'ul'
    stacked = ' tick-stacked' if b.get('stacked') else ''
    items = ''.join(f'<li>{item}</li>' for item in b.get('items', []))
    # Opsional (reuses card's `heading` field) - kosong = cuma daftarnya
    # tampil sendiri, persis perilaku sebelum field ini ada.
    heading = f'<div class="tick-heading">{esc(b.get("heading",""))}</div>' if b.get('heading') else ''
    return f'{heading}<{tag} class="tick{stacked}">{items}</{tag}>'


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
    n_cols = len(b.get('headers', []))

    # Optional group-header row ABOVE the normal header row (e.g. "Mitra
    # Transaksi" spanning 3 sub-columns) - purely additive, blocks authored
    # before this existed have no 'dtableGroups' key at all, so this whole
    # <tr> is simply absent and the table looks byte-identical to before.
    groups = b.get('dtableGroups') or []
    group_row = ''
    if groups:
        cells = ''.join(
            f'<th colspan="{max(1, int(g.get("span", 1)))}" class="dtable-group">{esc(g.get("label", ""))}</th>'
            for g in groups
        )
        group_row = f'<tr>{cells}</tr>'

    headers = ''.join(f'<th>{esc(h)}</th>' for h in b.get('headers', []))

    # A row with FEWER cells than there are columns gets its LAST cell
    # stretched with colspan to cover the gap - so a row can be one cell per
    # column, or a single cell spanning the whole row, mixed freely row by
    # row (see DtableFields in BlockEditor.tsx, where "− gabung"/"+ pisah"
    # shrink/grow a row to produce this). A full-length row's colspan is
    # always 1, so tables authored before this existed render unchanged.
    rows = ''
    for row in b.get('rows', []):
        cells = ''
        last = len(row) - 1
        for i, cell in enumerate(row):
            span = n_cols - len(row) + 1 if i == last and len(row) < n_cols else 1
            colspan_attr = f' colspan="{span}"' if span > 1 else ''
            cells += f'<td{colspan_attr}>{esc(cell)}</td>'
        rows += f'<tr>{cells}</tr>'

    return f'<table class="dtable"><thead>{group_row}<tr>{headers}</tr></thead><tbody>{rows}</tbody></table>'


FLOW_DATA = {}  # collected across the whole generation pass, flushed after SLIDES map

# Flags collected while rendering blocks in one generation pass. `has_instagram`
# drives whether the shell loads Instagram's embed.js (a <script> the block
# itself can't run, because slide HTML is injected via innerHTML which never
# executes injected <script> tags). Reset at the start of generate_html.
GEN_FLAGS = {'has_instagram': False, 'has_youtube': False, 'has_articulate': False,
             # true cuma kalau HTML ini digenerate buat dibungkus jadi paket
             # SCORM .zip (Export SCORM). Di export HTML tunggal / Live
             # Preview, folder articulate/ gak ada di sebelah file ini, jadi
             # iframe-nya SENGAJA gak dipasang - lihat render_articulate().
             'art_packaged': False}


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
    # Semua field layout opsional. Kalau gak diisi -> boxed, 100%, tengah,
    # gak float = PERSIS output lama, jadi draft/modul lama render sama.
    clean = bool(b.get('imgClean'))
    align = b.get('imgAlign') if b.get('imgAlign') in ('left', 'center', 'right') else 'center'
    float_side = b.get('imgFloat') if b.get('imgFloat') in ('left', 'right') else 'none'
    try:
        w = int(b.get('imgWidth')) if b.get('imgWidth') is not None else 100
    except (TypeError, ValueError):
        w = 100
    w = max(10, min(100, w))

    caption = (f'<p class="img-cap">{esc(b.get("caption",""))}</p>'
               if b.get('caption') else '')
    inner_cls = 'img-inner img-clean' if clean else 'img-inner img-card'
    box = f'<div class="{inner_cls}"><img src="{b.get("src","")}" alt="">{caption}</div>'

    wrap = 'img-float-' + float_side if float_side != 'none' else 'img-align-' + align
    return f'<div class="img-blk {wrap}" style="--img-w:{w}%">{box}</div>'


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


# Rasio kotak video upload (bukan YouTube - itu punya rasio otomatis sendiri).
# Unset/nilai gak dikenal = 'asli' = ikut rasio asli file video, gak ada
# aspect-ratio yang di-set sama sekali (perilaku lama, draft lama gak berubah).
VIDEO_RATIO_CSS = {'16:9': '16/9', '4:3': '4/3', '1:1': '1/1', '9:16': '9/16'}


def render_media(b):
    source = b.get('mediaSource', 'video')
    caption = _caption_html(b)
    block_id = esc(b.get('id', 'media'))

    if source == 'youtube':
        raw_url = b.get('embedUrl', '') or ''
        vid = _youtube_id(raw_url)
        if not vid:
            return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                    '⚠ URL YouTube belum valid — tempel link seperti '
                    'https://youtu.be/xxxx atau .../watch?v=xxxx.</p></div>')
        # Facade: tampilkan thumbnail asli video di dalam kotak beraspek-rasio
        # + tombol play; baru pas diklik player YouTube asli (YT.Player, lewat
        # IFrame Player API - bukan iframe polos, biar bisa dengar
        # play/pause/selesai buat rekam aktivitas) dimuat (playYouTube di
        # shell). Lebih ringan + lebih rapi ketimbang langsung nanam iframe,
        # dan yang keliatan di slide persis gambar depan videonya. Shorts =
        # 9:16 (portrait, lebar dibatasi), selain itu 16:9.
        is_short = '/shorts/' in raw_url
        ratio = '177.78%' if is_short else '56.25%'  # tinggi:lebar (9:16 vs 16:9)
        thumb = f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'
        GEN_FLAGS['has_youtube'] = True
        facade = (
            f'<div class="video-facade" data-ytid="{vid}" data-block="{block_id}" role="button" tabindex="0" '
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
    # so mobile doesn't force fullscreen. Inline event-handler attributes
    # (onplay/ontimeupdate/dst) - BUKAN <script>, jadi tetap jalan normal
    # walau videonya disuntik lewat innerHTML (beda dari tag <script> yang
    # dibungkam browser kalau ditanam lewat innerHTML). Dipakai buat rekam
    # "seberapa jauh beneran ditonton", bukan cuma "pernah dibuka" - lihat
    # videoTrackTime/videoSendCheckpoint di shell-template.html.
    src = b.get('src', '')
    if not src:
        return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                '⚠ Video belum diupload.</p></div>')
    # 'asli' (default): gak ada aspect-ratio di-set, tinggi kotak ngikut rasio
    # asli file video-nya sendiri - persis perilaku sebelum field ini ada.
    # Rasio dipilih: kotak dipaksa ke rasio itu + object-fit:contain, jadi
    # video yang aslinya beda rasio ditampilkan UTUH dengan letterbox (bar
    # hitam dari background:#000 di bawahnya), bukan dipotong.
    ratio_css = VIDEO_RATIO_CSS.get(b.get('videoRatio'))
    style = 'width:100%;border-radius:12px;display:block;background:#000;'
    if ratio_css:
        style += f'aspect-ratio:{ratio_css};object-fit:contain;'
    return (
        '<div class="card">'
        f'<video controls playsinline preload="metadata" src="{src}" data-block="{block_id}" '
        f'onplay="videoMarkStarted(\'{block_id}\')" '
        f'ontimeupdate="videoTrackTime(\'{block_id}\',this.currentTime,this.duration)" '
        f'onpause="videoSendCheckpoint(\'{block_id}\',false)" '
        f'onended="videoSendCheckpoint(\'{block_id}\',true)" '
        f'style="{style}"></video>'
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
    can inject them straight into innerHTML without re-escaping.

    Two feedback modes per question (authored via `feedbackMode`, defaults to
    'single'): 'single' carries `feedbackCorrect`/`feedbackWrong` (split by
    outcome, so an author can't write a verdict-specific text that then shows
    under the opposite verdict); 'perOption' instead carries `optFeedback` -
    one entry per option, index-matched to `opts`, each optional. The shell
    picks whichever mode applies at answer time (kcApply).

    Drafts authored before the correct/wrong split only have the old shared
    `feedback` field - it's folded into BOTH feedbackCorrect and
    feedbackWrong here (whichever new field is empty) so those old questions
    keep rendering exactly as before until someone edits them in the new UI."""
    out = []
    for b in slide.get('blocks', []):
        if b.get('type') != 'knowledge':
            continue
        items = []
        for it in (b.get('kcItems') or []):
            opts = it.get('opts') or []
            if not opts:
                continue  # skip malformed questions with no options
            mode = it.get('feedbackMode') or 'single'
            opt_feedback_raw = it.get('optFeedback') or []
            legacy_feedback = it.get('feedback', '')
            item = {
                'q': esc(it.get('q', '')),
                'opts': [esc(o) for o in opts],
                'correct': it.get('correct', 0),
                'feedbackMode': mode,
                'feedbackCorrect': nl2br(it.get('feedbackCorrect') or legacy_feedback),
                'feedbackWrong': nl2br(it.get('feedbackWrong') or legacy_feedback),
                # Index-matched to opts; missing/short entries just become ''.
                'optFeedback': [nl2br(opt_feedback_raw[i]) if i < len(opt_feedback_raw) else '' for i in range(len(opts))],
            }
            items.append(item)
        if items:
            out.append({'block': b.get('id', 'kc'), 'items': items})
    return out


def art_entry(b):
    """File pembuka paket Articulate, RELATIF terhadap folder tujuan
    `articulate/<idBlok>/`.

    Perakit paket (scormZip.ts) membuang folder akar paket waktu menyalin,
    jadi isinya selalu mendarat rata di `articulate/<idBlok>/`. Kalau src
    iframe di sini masih bawa-bawa nama folder induk, dia nunjuk ke folder
    yang sudah dibuang itu - iframe 404 dan kontennya gak pernah muncul.

    Blok yang diupload SEBELUM artRoot ada menyimpan path lengkap (termasuk
    folder induk) di artEntry; buat blok itu nama folder diturunkan di sini,
    persis seperti yang dilakukan perakit, biar draft lama tetap cocok tanpa
    perlu upload ulang.
    """
    raw = (b.get('artEntry') or 'index_lms.html').lstrip('/')
    if b.get('artRoot') is not None:
        return raw
    return raw.rsplit('/', 1)[-1]


ART_RATIOS = {'16:9': '56.25%', '4:3': '75%'}


def render_articulate(b):
    """Konten Articulate 360 (Storyline/Rise) yang dibungkus jadi bagian modul.

    Yang dirender di sini cuma KERANGKANYA (kotak + tombol layar penuh +
    label status). Isi aslinya jalan di dalam <iframe> yang nunjuk ke
    `articulate/<id>/<entry>` - file-file itu baru ada kalau modulnya
    di-export sebagai paket SCORM .zip (Export SCORM), bukan HTML tunggal.
    Makanya src-nya cuma dipasang kalau art_packaged nyala; kalau enggak,
    yang tampil pesan jujur "baru hidup di paket SCORM", bukan iframe kosong
    atau 404 yang bikin bingung.

    Kenapa iframe biasa dan bukan embed lain: paket Articulate itu situs
    kecil (ratusan file) yang HARUS dilayani apa adanya. Karena dia satu
    origin sama modul ini (sama-sama di dalam paket SCORM yang sama), dia
    bisa manjat window.parent dan nemu SCORM API - yang dia temuin adalah
    SHIM punya kita (lihat artShim* di shell-template.html), bukan API LMS
    langsung. Itu yang bikin lapor "completed"-nya sampai ke kita buat kunci
    slide, tanpa nabrak status modul di LMS.
    """
    block_id = esc(b.get('id', 'art'))
    entry = art_entry(b)
    caption = _caption_html(b)
    GEN_FLAGS['has_articulate'] = True

    if not b.get('artUrl'):
        return ('<div class="card"><p style="color:var(--text-faint);font-size:12.5px;">'
                '&#9888; Blok Articulate belum ada file ZIP-nya.</p></div>')

    ratio = b.get('artRatio') or '16:9'
    if ratio == 'tinggi':
        frame_style = 'height:80vh;'
    else:
        frame_style = f'padding-bottom:{ART_RATIOS.get(ratio, "56.25%")};height:0;'

    if not GEN_FLAGS['art_packaged']:
        return (
            '<div class="card art-card">'
            '<div class="art-placeholder">'
            '<div class="art-ph-icon">&#9635;</div>'
            '<div><strong>Konten Articulate 360</strong>'
            f'<div class="art-ph-sub">{esc(b.get("artName") or "paket Articulate")}</div>'
            '<div class="art-ph-sub">Baru hidup di hasil <strong>Export SCORM (.zip)</strong> &mdash; '
            'di Live Preview dan Export HTML tunggal, file-nya belum ikut dibawa.</div>'
            '</div></div>'
            f'{caption}</div>'
        )

    return (
        f'<div class="card art-card" data-art="{block_id}">'
        f'<div class="art-frame" id="artframe-{block_id}" style="{frame_style}">'
        f'<iframe class="art-iframe" src="articulate/{block_id}/{esc(entry)}" '
        f'title="Konten Articulate" allowfullscreen '
        f'allow="autoplay; fullscreen; encrypted-media; microphone; camera"></iframe>'
        '</div>'
        '<div class="art-bar">'
        f'<span class="art-status" id="artstatus-{block_id}">Belum selesai</span>'
        f'<button type="button" class="art-full" onclick="artFullscreen(&#39;{block_id}&#39;)">&#9974; Layar penuh</button>'
        '</div>'
        f'{caption}</div>'
    )


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
    'articulate': render_articulate,
}


def render_block(b):
    fn = BLOCK_RENDERERS.get(b.get('type'))
    if not fn:
        return ''
    return fn(b)


def count_articulate(blocks):
    """Berapa blok Articulate di modul ini, termasuk yang bersarang di Grid.

    Penyebut buat kolom Articulate di Command Center. Yang dihitung cuma blok
    yang BENERAN punya paket terpasang - blok Articulate kosong (baru ditambah,
    ZIP-nya belum diupload) gak akan pernah bisa "selesai", jadi kalau ikut
    dihitung penyebutnya selamanya gak bakal ketutup.
    """
    total = 0
    for b in blocks or []:
        t = b.get('type')
        if t == 'articulate' and (b.get('artUrl') or b.get('artPath')):
            total += 1
        elif t == 'grid':
            total += count_articulate(b.get('blocks', []))
    return total


def count_interaktif(blocks):
    """Berapa banyak "menu tersembunyi" yang HARUS diklik peserta buat kebuka.

    Ini penyebut buat sinyal interaktif di rekap peserta. Harus persis
    sepadan dengan apa yang dihitung `_interaksi_key()` di activity_store.py
    sebagai pembilang, kalau enggak rasionya bisa keluar aneh (5/4).

    Yang dihitung: tiap item accordion (masing-masing punya id sendiri), tiap
    tombol modal, dan tab/langkah alur SELAIN yang pertama - idx 0 di tabs &
    diagram alur udah kebuka duluan tanpa diklik, jadi dia bukan sesuatu yang
    "digali". Blok statis (card/callout/timeline/tabel) sengaja gak dihitung:
    gak ada yang perlu diklik, jadi gak ada yang bisa kelewat.
    """
    total = 0
    for b in blocks or []:
        t = b.get('type')
        if t == 'accordion':
            total += len(b.get('accItems', []))
        elif t == 'modal':
            total += 1
        elif t == 'tabs':
            total += max(0, len(b.get('tabItems', [])) - 1)
        elif t == 'flow':
            total += max(0, len(b.get('steps', [])) - 1)
        elif t == 'grid':
            # Grid cuma wadah - blok interaktif di dalamnya tetap harus diklik.
            total += count_interaktif(b.get('blocks', []))
    return total


def clamp_brightness(value, default):
    """0-100, dipakai buat gambar latar sampul & slide penutup. `default`
    beda-beda per konteks (lihat pemanggilnya) - sengaja parameter, bukan
    konstanta, karena sampul & slide penutup punya alasan default berbeda."""
    try:
        b = int(value) if value is not None else default
    except (TypeError, ValueError):
        b = default
    return max(0, min(100, b))


def render_bg_image_layer(css_class, src, brightness):
    """Div lapisan gambar latar dengan filter:brightness() DI LAYER GAMBARNYA
    SENDIRI, bukan di container yang sama dengan teks - kalau container yang
    kena filter, teksnya ikut meredup juga. Dipakai sampul (.cover-bg-img,
    di depan-nya masih ada .cover-bg-gradient bawaan) dan slide penutup
    (.ending-bg-img). Kosong kalau src kosong - gak nyisain <div> percuma."""
    if not src:
        return ''
    return f'<div class="{css_class}" style="background-image:url(\'{src}\');filter:brightness({brightness}%)"></div>'


# ---------------------------------------------------------------- graphic style decorations
# 10 gaya dekorasi siap-pakai (ModuleData.graphicStyle, pilihan INDEPENDEN dari
# theme/warna - lihat GRAPHIC_STYLES di app/src/graphicStyles.ts).
#
# SEMUA angka px di GRAPHIC_DECO ditulis dalam SKALA PANEL MOCKUP
# (app/src/graphicStylePreviews.ts, panel 158px lebar / rasio 4:3) - persis
# angka yang sudah direview & di-approve user. Angka itu TIDAK dipakai apa
# adanya: _responsive_geometry() di bawah mengubahnya jadi unit relatif
# kontainer, jadi dekorasi tampil dengan PROPORSI YANG SAMA di ukuran render
# apa pun. Ini penting karena ukuran render sangat bervariasi: panel "Preview
# langsung" di builder cuma ~626x295, layar penuh ~1320x810, dan di dalam Web
# Object Storyline/KLC bisa ukuran lain lagi. Versi sebelumnya pakai px tetap
# (di-skala 3.3x sekali di muka) sehingga dekorasi yang sama kelihatan
# raksasa di panel preview (tinggi blob 154% dari sampul) tapi kekecilan di
# layar penuh (56%) - itu bug yang diperbaiki di sini.
#
# Tiap gaya wajib punya 3 varian BEDA KOMPOSISI (bukan bentuk sama ditempel
# ulang): 'cover' paling bold TAPI tetap dijaga ringan (Sampul bisa punya foto
# upload di belakangnya - lihat coverImageDataUri - motif solid-fill/opacity
# tinggi gampang tabrakan, ini pelajaran dari fix diagonal-block/cover),
# 'content' PALING kecil/redup (dipakai SAMA di semua slide konten, jangan
# ganggu teks), 'ending' sengaja beda dari cover (simetris 2 sisi atau
# dikalikan/disebar).

# Ukuran panel mockup di GraphicStyleSelect.tsx - basis konversi di bawah.
PREVIEW_PANEL_W = 158.0
PREVIEW_PANEL_H = PREVIEW_PANEL_W * 3 / 4      # panel-nya aspect-ratio 4/3
PREVIEW_PANEL_MIN = min(PREVIEW_PANEL_W, PREVIEW_PANEL_H)

# Skala px yang dipakai SEBAGAI FALLBACK buat browser yang belum dukung
# container query units (Chrome <105 / Safari <16). Nilainya = perilaku versi
# sebelumnya, jadi browser lama dapat persis tampilan yang sudah pernah rilis,
# bukan layar kosong. Browser modern selalu pakai deklarasi cq* sesudahnya.
_LEGACY_PX_SCALE = 3.3

# Cuma properti GEOMETRI yang diskalakan. Ketebalan garis (border), blur, dan
# stroke SVG sengaja TIDAK ikut - garis tipis harus tetap kerasa tipis di
# kanvas besar, bukan ikut menebal jadi batang.
# Lookbehind `(?<![-\w])` mencegah `max-width`/`border-width`/dsb ikut kena.
_GEOM_RE = re.compile(r'(?<![-\w])(width|height|top|right|bottom|left)\s*:\s*(-?[\d.]+)px')


def _responsive_geometry(css_html, unit, basis):
    """Ubah tiap `prop:Npx` (skala panel mockup) jadi dua deklarasi berurutan:
    px fallback dulu, lalu nilai relatif kontainer. Browser lama membuang
    deklarasi ber-unit cq* yang gak dikenal dan tetap memakai px-nya; browser
    modern memakai yang belakangan. Pola progressive-enhancement biasa, cuma
    ditulis di inline style."""
    def repl(m):
        prop, num = m.group(1), float(m.group(2))
        legacy = round(num * _LEGACY_PX_SCALE)
        rel = round(num / basis * 100, 2)
        return f'{prop}:{legacy}px;{prop}:{rel}{unit}'
    return _GEOM_RE.sub(repl, css_html)


# Pola titik dot-grid ikut diskalakan supaya kerapatannya sama kayak mockup
# (kalau ukuran areanya membesar tapi jarak titiknya tetap 12px, teksturnya
# berubah total: dari ~13 titik selebar panel jadi ratusan titik renik).
# Ditulis inline per-konteks karena unitnya beda (cover/ending pakai cqmin,
# slide konten pakai cqw); class .g-dotgrid di shell-template.html tetap ada
# sebagai fallback px buat browser lama.
_DOTS_CQMIN = (
    'background-image:radial-gradient(var(--accent) 1.01cqmin, transparent 1.27cqmin);'
    'background-size:10.13cqmin 10.13cqmin;'
)
_DOTS_CQW = (
    'background-image:radial-gradient(var(--accent) 0.76cqw, transparent 0.95cqw);'
    'background-size:7.59cqw 7.59cqw;'
)

GRAPHIC_DECO = {
    'blob': {
        'cover': (
            '<div class="g-blob" style="width:150px;height:138px;right:-46px;bottom:-40px;opacity:.35;background:var(--accent);border-radius:42% 58% 65% 35% / 45% 40% 60% 55%;"></div>'
            '<div class="g-blob" style="width:78px;height:70px;left:-22px;top:-20px;opacity:.16;background:var(--navy);border-radius:58% 42% 35% 65% / 55% 60% 40% 45%;"></div>'
        ),
        'content': (
            '<div class="g-blob" style="width:62px;height:56px;right:-16px;top:-14px;opacity:.10;background:var(--accent);border-radius:40% 60% 55% 45% / 55% 45% 60% 40%;"></div>'
        ),
        'ending': (
            '<div class="g-blob" style="width:96px;height:88px;left:-28px;top:-24px;opacity:.22;background:var(--accent);border-radius:48% 52% 40% 60% / 50% 45% 55% 50%;"></div>'
            '<div class="g-blob" style="width:96px;height:88px;right:-28px;bottom:-24px;opacity:.22;background:var(--navy);border-radius:52% 48% 60% 40% / 50% 55% 45% 50%;"></div>'
        ),
    },
    'gradient-orb': {
        'cover': '<div class="g-orb" style="width:190px;height:190px;right:-64px;top:-70px;"></div>',
        'content': '<div class="g-orb" style="width:44px;height:44px;right:10px;top:6px;"></div>',
        'ending': (
            '<div class="g-orb" style="width:70px;height:70px;left:-18px;bottom:-26px;"></div>'
            '<div class="g-orb" style="width:42px;height:42px;left:56px;bottom:-14px;"></div>'
            '<div class="g-orb" style="width:54px;height:54px;right:14px;bottom:-20px;"></div>'
            '<div class="g-orb" style="width:30px;height:30px;right:96px;bottom:4px;"></div>'
        ),
    },
    'dot-grid': {
        'cover': (
            '<div class="g-dotgrid" style="width:150px;height:150px;right:-10px;bottom:-10px;opacity:.55;'
            + _DOTS_CQMIN +
            '-webkit-mask-image:radial-gradient(circle at 100% 100%, black 0%, black 25%, transparent 72%);'
            'mask-image:radial-gradient(circle at 100% 100%, black 0%, black 25%, transparent 72%);"></div>'
        ),
        'content': (
            '<div class="g-dotgrid" style="width:64px;height:64px;right:0;top:0;opacity:.35;'
            + _DOTS_CQW +
            '-webkit-mask-image:radial-gradient(circle at 100% 0%, black 0%, black 15%, transparent 75%);'
            'mask-image:radial-gradient(circle at 100% 0%, black 0%, black 15%, transparent 75%);"></div>'
        ),
        'ending': (
            '<div class="g-dotgrid" style="left:0;right:0;bottom:0;height:54px;opacity:.4;'
            + _DOTS_CQMIN +
            '-webkit-mask-image:linear-gradient(to top, black 0%, transparent 100%);'
            'mask-image:linear-gradient(to top, black 0%, transparent 100%);"></div>'
        ),
    },
    'corner-bracket': {
        # Sampul & Penutup punya teks TERPUSAT (title di tengah layar, bukan
        # rata kiri kayak slide konten) - lengan bracket yang kepanjangan
        # gampang nabrak huruf pertama judul. Dulu 46px/offset14 di basis
        # cqmin 118.5 = lengannya nyampe 50,6% jarak ke tengah (LEBIH DARI
        # SETENGAH sisi terpendek Sampul) - ketauan dari laporan user (huruf
        # "J" di "Judul" nempel garis). Diperkecil supaya jelas berhenti di
        # zona sudut, jangan sampe nyerempet area teks di tengah manapun
        # posisi/panjang judulnya. `content` gak kena masalah ini (teks
        # slide konten rata kiri, bukan di tengah) jadi dibiarin.
        'cover': (
            '<div class="g-bracket" style="width:12px;height:12px;left:10px;top:10px;border-top:2px solid var(--accent);border-left:2px solid var(--accent);opacity:.5;"></div>'
            '<div class="g-bracket" style="width:12px;height:12px;right:10px;bottom:10px;border-bottom:2px solid var(--accent);border-right:2px solid var(--accent);opacity:.5;"></div>'
        ),
        'content': (
            '<div class="g-bracket" style="width:22px;height:22px;right:10px;top:10px;border-top:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.3;"></div>'
        ),
        'ending': (
            '<div class="g-bracket" style="width:10px;height:10px;left:8px;top:8px;border-top:1.6px solid var(--accent);border-left:1.6px solid var(--accent);opacity:.45;"></div>'
            '<div class="g-bracket" style="width:10px;height:10px;right:8px;top:8px;border-top:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.45;"></div>'
            '<div class="g-bracket" style="width:10px;height:10px;left:8px;bottom:8px;border-bottom:1.6px solid var(--accent);border-left:1.6px solid var(--accent);opacity:.45;"></div>'
            '<div class="g-bracket" style="width:10px;height:10px;right:8px;bottom:8px;border-bottom:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.45;"></div>'
        ),
    },
    'diagonal-block': {
        # Cover SENGAJA kecil+redup - ini hasil fix eksplisit user (dulu 2
        # segitiga solid gede/tebal, tabrakan sama foto sampul upload-an).
        'cover': '<div class="g-tri" style="width:72px;height:64px;right:-12px;bottom:-10px;opacity:.26;background:var(--accent);"></div>',
        'content': '<div class="g-tri" style="width:52px;height:22px;right:-8px;top:-8px;background:var(--accent);opacity:.65;transform:rotate(8deg);"></div>',
        'ending': (
            '<div class="g-tri" style="width:70px;height:64px;left:-14px;top:-12px;background:var(--navy);opacity:.4;transform:rotate(180deg);"></div>'
            '<div class="g-tri" style="width:70px;height:64px;right:-14px;bottom:-12px;background:var(--accent);opacity:.7;"></div>'
        ),
    },
    'ring': {
        'cover': '<div class="g-ring" style="width:200px;height:200px;border:2px solid var(--accent);right:-70px;top:-84px;opacity:.4;"></div>',
        'content': '<div class="g-ring" style="width:40px;height:40px;border:1.5px solid var(--accent);right:8px;top:6px;opacity:.28;"></div>',
        'ending': (
            '<div class="g-ring" style="width:64px;height:64px;border:1.6px solid var(--accent);left:-20px;bottom:-24px;opacity:.4;"></div>'
            '<div class="g-ring" style="width:40px;height:40px;border:1.6px solid var(--navy);left:30px;bottom:-10px;opacity:.35;"></div>'
            '<div class="g-ring" style="width:50px;height:50px;border:1.6px solid var(--accent);right:-6px;bottom:-18px;opacity:.3;"></div>'
        ),
    },
    'layered-triangle': {
        'cover': (
            '<div class="g-tri" style="width:110px;height:100px;right:-18px;bottom:-16px;background:var(--accent);opacity:.24;transform:rotate(-6deg);"></div>'
            '<div class="g-tri" style="width:80px;height:74px;right:6px;bottom:-10px;background:var(--navy);opacity:.2;transform:rotate(10deg);"></div>'
        ),
        'content': (
            '<svg viewBox="0 0 40 40" style="position:absolute;right:4px;top:4px;width:26px;height:26px;">'
            '<polygon points="20,4 4,34 36,34" style="stroke:var(--accent);" stroke-width="1.6" fill="none" opacity="0.4"/>'
            '</svg>'
        ),
        'ending': (
            '<div class="g-tri" style="width:34px;height:30px;left:20px;bottom:6px;background:var(--accent);opacity:.3;transform:rotate(-14deg);"></div>'
            '<div class="g-tri" style="width:26px;height:24px;left:80px;bottom:26px;background:var(--navy);opacity:.25;transform:rotate(20deg);"></div>'
            '<div class="g-tri" style="width:30px;height:28px;right:24px;bottom:2px;background:var(--accent);opacity:.28;transform:rotate(8deg);"></div>'
        ),
    },
    'confetti': {
        'cover': (
            '<div class="g-dot" style="width:8px;height:8px;background:var(--accent);right:20px;bottom:60px;opacity:.6;"></div>'
            '<div class="g-dot" style="width:5px;height:5px;background:var(--navy);right:56px;bottom:30px;opacity:.4;"></div>'
            '<div class="g-dot" style="width:6px;height:6px;background:var(--accent);right:90px;bottom:70px;opacity:.5;"></div>'
            '<div class="g-dash" style="width:12px;height:3px;background:var(--accent-2);right:40px;bottom:44px;opacity:.55;transform:rotate(-24deg);"></div>'
            '<div class="g-dot" style="width:4px;height:4px;background:var(--navy);right:14px;bottom:20px;opacity:.45;"></div>'
            '<div class="g-dash" style="width:10px;height:3px;background:var(--accent);right:110px;bottom:36px;opacity:.4;transform:rotate(18deg);"></div>'
            '<div class="g-dot" style="width:6px;height:6px;background:var(--accent-2);right:70px;bottom:14px;opacity:.5;"></div>'
        ),
        'content': (
            '<div class="g-dot" style="width:5px;height:5px;background:var(--accent);right:12px;top:8px;opacity:.5;"></div>'
            '<div class="g-dot" style="width:3.5px;height:3.5px;background:var(--navy);right:26px;top:18px;opacity:.4;"></div>'
        ),
        'ending': (
            '<div class="g-dot" style="width:6px;height:6px;background:var(--accent);left:16px;bottom:16px;opacity:.55;"></div>'
            '<div class="g-dash" style="width:11px;height:3px;background:var(--navy);left:44px;bottom:10px;opacity:.4;transform:rotate(-16deg);"></div>'
            '<div class="g-dot" style="width:4px;height:4px;background:var(--accent-2);left:80px;bottom:20px;opacity:.5;"></div>'
            '<div class="g-dot" style="width:7px;height:7px;background:var(--accent);left:130px;bottom:8px;opacity:.5;"></div>'
            '<div class="g-dash" style="width:12px;height:3px;background:var(--accent);left:168px;bottom:16px;opacity:.45;transform:rotate(20deg);"></div>'
            '<div class="g-dot" style="width:5px;height:5px;background:var(--navy);right:24px;bottom:14px;opacity:.45;"></div>'
            '<div class="g-dot" style="width:4px;height:4px;background:var(--accent-2);right:50px;bottom:22px;opacity:.4;"></div>'
        ),
    },
    'stacked-arc': {
        'cover': (
            '<div class="g-arcband" style="width:200px;height:200px;right:-110px;bottom:-120px;background:var(--accent);opacity:.16;"></div>'
            '<div class="g-arcband" style="width:150px;height:150px;right:-85px;bottom:-95px;background:var(--accent);opacity:.22;"></div>'
            '<div class="g-arcband" style="width:100px;height:100px;right:-58px;bottom:-68px;background:var(--navy);opacity:.28;"></div>'
        ),
        'content': (
            '<div class="g-arcband" style="width:56px;height:56px;right:-24px;top:-30px;background:var(--accent);opacity:.16;"></div>'
            '<div class="g-arcband" style="width:34px;height:34px;right:-12px;top:-16px;background:var(--accent);opacity:.22;"></div>'
        ),
        'ending': (
            '<div class="g-arcband" style="width:90px;height:90px;left:-50px;bottom:-56px;background:var(--accent);opacity:.18;"></div>'
            '<div class="g-arcband" style="width:60px;height:60px;left:-32px;bottom:-38px;background:var(--navy);opacity:.24;"></div>'
            '<div class="g-arcband" style="width:90px;height:90px;right:-50px;bottom:-56px;background:var(--navy);opacity:.18;"></div>'
            '<div class="g-arcband" style="width:60px;height:60px;right:-32px;bottom:-38px;background:var(--accent);opacity:.24;"></div>'
        ),
    },
    'layered-rect': {
        'cover': (
            '<div class="g-rectstack" style="width:90px;height:70px;border:1.6px solid var(--accent);right:-16px;bottom:-14px;opacity:.3;transform:rotate(-7deg);"></div>'
            '<div class="g-rectstack" style="width:90px;height:70px;border:1.6px solid var(--accent);right:-6px;bottom:-8px;opacity:.45;transform:rotate(2deg);"></div>'
            '<div class="g-rectstack" style="width:90px;height:70px;border:1.6px solid var(--navy);right:2px;bottom:-2px;opacity:.55;transform:rotate(9deg);"></div>'
        ),
        'content': '<div class="g-rectstack" style="width:30px;height:24px;border:1.4px solid var(--accent);right:6px;top:6px;opacity:.32;"></div>',
        'ending': (
            '<div class="g-rectstack" style="width:50px;height:40px;border:1.5px solid var(--accent);left:-10px;top:-8px;opacity:.3;transform:rotate(-6deg);"></div>'
            '<div class="g-rectstack" style="width:50px;height:40px;border:1.5px solid var(--navy);left:-2px;top:-2px;opacity:.45;transform:rotate(4deg);"></div>'
            '<div class="g-rectstack" style="width:50px;height:40px;border:1.5px solid var(--navy);right:-10px;bottom:-8px;opacity:.3;transform:rotate(6deg);"></div>'
            '<div class="g-rectstack" style="width:50px;height:40px;border:1.5px solid var(--accent);right:-2px;bottom:-2px;opacity:.45;transform:rotate(-4deg);"></div>'
        ),
    },
}


def render_graphic_deco(style_id, kind):
    """Dekorasi grafis opsional (ModuleData.graphicStyle) buat satu bagian
    modul. `kind`: 'cover'|'content'|'ending' - masing-masing komposisi beda
    (lihat GRAPHIC_DECO di atas), gak boleh reuse bentuk yang sama.

    'content' dibungkus `.g-deco-behind` (z-index NEGATIF, biar otomatis kalah
    tumpuk dari SEMUA jenis blok konten tanpa perlu utak-atik z-index tiap
    jenis blok satu-satu); 'cover'/'ending' dibungkus `.g-deco` biasa (duduk di
    ANTARA layer foto & gradasi gelap dengan teks). Dua-duanya `container-type:
    size` di shell-template.html, jadi unit cq* di bawah mengacu ke kotak
    pembungkusnya sendiri.

    Basis unitnya beda per konteks, dan ini disengaja:
    - cover/ending -> `cqmin` (sisi terpendek kontainer). Sampul/penutup
      setinggi viewport, dan rasionya berubah-ubah (panel preview di builder
      pendek-lebar, layar penuh lebih lega). Mengunci ke sisi terpendek bikin
      dekorasi gak pernah membengkak melewati tinggi sampul di kontainer yang
      pendek - persis keluhan yang memicu perbaikan ini.
    - content -> `cqw` (lebar kontainer). Tinggi slide konten mengikuti panjang
      isinya (bisa 500px, bisa 3000px), jadi `cqmin` bakal bikin ukuran
      dekorasi ikut berubah-ubah cuma gara-gara slide-nya kepanjangan.

    Balikin string kosong kalau style_id 'none'/gak dikenal, atau kind itu
    kebetulan kosong buat gaya ini - konsisten sama render_bg_image_layer()
    yang juga gak nyisain div percuma.
    """
    html = GRAPHIC_DECO.get(style_id or 'none', {}).get(kind, '')
    if not html:
        return ''
    if kind == 'content':
        html = _responsive_geometry(html, 'cqw', PREVIEW_PANEL_W)
        wrapper = 'g-deco-behind'
    else:
        html = _responsive_geometry(html, 'cqmin', PREVIEW_PANEL_MIN)
        wrapper = 'g-deco'
    return f'<div class="{wrapper}" aria-hidden="true">{html}</div>'


def render_slide_html(slide, graphic_style='none'):
    # Sama persis di SETIAP slide konten (bukan diacak per-slide) - "unik cuma
    # buat konteks itu sendiri" berarti satu treatment kecil/redup yang
    # konsisten di semua slide isi, beda dari Sampul/Penutup yang masing-masing
    # cuma sekali. `.g-deco-behind` di z-index NEGATIF, jadi otomatis kalah
    # tumpuk dari blok apa pun (card/accordion/tabs/dst) tanpa perlu
    # nyentuh CSS tiap jenis blok - lihat render_graphic_deco().
    deco = render_graphic_deco(graphic_style, 'content')
    kicker = f'<div class="kicker"><span class="num">{slide["number"]}</span>{esc(slide.get("kickerLabel",""))}</div>'
    title = f'<h1 class="slide-title">{esc(slide.get("title",""))}</h1>'
    sub = f'<p class="slide-sub">{slide.get("subtitle","")}</p>' if slide.get('subtitle') else ''
    body = ''.join(render_block(b) for b in slide.get('blocks', []))
    # Nutup float dari blok gambar "dampingi teks" biar tingginya kekurung di
    # dalam slide ini (gak bocor ke bawah/ke slide lain). Kosong + zero-height
    # kalau gak ada float sama sekali - aman selalu ditaruh.
    return deco + kicker + title + sub + body + '<div class="img-clear"></div>'


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
    # Sampul SENGAJA gak punya section. Dia pintu masuk modul, bukan bagian
    # dari materi mana pun - dulu dititipkan ke section pertama dan akibatnya
    # muncul MENJOROK DI DALAM section itu di menu samping, seolah-olah
    # Sampul salah satu slide "Pendahuluan". section=None bikin dia lolos
    # dari filter per-section di renderSidebar, jadi dia dirender sendiri di
    # paling atas, sejajar dengan section - bukan anaknya.
    nav.append({'kind': 'hero', 'section': None, 'num': 1})
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
    GEN_FLAGS['has_youtube'] = False
    GEN_FLAGS['has_articulate'] = False
    # Dikirim frontend CUMA lewat jalur "Export SCORM (.zip)". Bukan field
    # yang diisi penyusun modul, jadi sengaja gak masuk ModuleData/draft -
    # dia sifat dari CARA generate-nya, bukan sifat modulnya.
    GEN_FLAGS['art_packaged'] = bool(module.get('artPackaged'))

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

    # Independen dari theme di atas - lihat render_graphic_deco(). 'none'
    # (default/modul lama tanpa field ini) = tiga placeholder deco di bawah
    # semua balik string kosong, render identik ke sebelum fitur ini ada.
    graphic_style = module.get('graphicStyle') or 'none'

    # Default 100 (bukan 50 kayak slide penutup) - sampul udah punya
    # .cover-bg-gradient bawaan buat jamin judul putih kebaca, jadi slider
    # ini murni tambahan opsional buat MEREDAM LEBIH LANJUT di atas itu.
    # Modul lama (belum ada field ini) render identik: brightness 100% =
    # filter no-op, gambar tampil apa adanya persis kayak sebelum ada fitur ini.
    cover = module.get('coverImageDataUri', '')
    cover_brightness = clamp_brightness(module.get('coverImageBrightness'), 100)
    out = out.replace('__COVER_BG_IMG_HTML__', render_bg_image_layer('cover-bg-img', cover, cover_brightness))
    out = out.replace('__COVER_DECO_HTML__', render_graphic_deco(graphic_style, 'cover'))

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
        html_body = render_slide_html(s, graphic_style)
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

    # Blok Articulate per slide: {nomorSlide: [{block, entry, lock}]}. Dipakai
    # shell buat (a) nyalain shim SCORM cuma kalau modulnya emang punya blok
    # ini, dan (b) nahan peserta pindah slide selama konten Articulate-nya
    # belum lapor selesai (lock). Blok di dalam Grid ikut kejaring - kalau
    # enggak, blok yang kebetulan ditaruh di dalam grid bakal diam-diam gak
    # ngunci apa-apa padahal penyusunnya nyentang "kunci".
    def _art_in(blocks):
        found = []
        for b in blocks or []:
            if b.get('type') == 'articulate' and b.get('artUrl'):
                found.append({
                    'block': b.get('id', 'art'),
                    'entry': art_entry(b),
                    'lock': b.get('artLock', True) is not False,
                    'nama': b.get('artName') or 'Konten Articulate',
                })
            elif b.get('type') == 'grid':
                found.extend(_art_in(b.get('blocks', [])))
        return found

    slide_art = {}
    for s in slides:
        arts = _art_in(s.get('blocks', []))
        if arts:
            slide_art[str(s['number'])] = arts
    out = out.replace('__SLIDE_ART_JS__', js_str(slide_art))
    out = out.replace('__ART_PACKAGED_JS__', js_str(GEN_FLAGS['art_packaged']))

    # Whether any block is an Instagram embed → shell conditionally loads
    # embed.js. Set during the render_slide_html loop above (render_media flips
    # the flag), so it's accurate by now.
    out = out.replace('__HAS_INSTAGRAM_JS__', js_str(GEN_FLAGS['has_instagram']))
    out = out.replace('__HAS_YOUTUBE_JS__', js_str(GEN_FLAGS['has_youtube']))

    out = out.replace('__SLIDE_TITLES_JS__', js_str(titles))
    # Ditanam biar Command Center bisa nunjukin "52 kunjungan (50/50 slide)"
    # alih-alih angka telanjang - penyusun modul jarang inget persis modulnya
    # ada berapa slide, jadi tanpa pembanding ini gak ada yang tau kalau
    # kunjungan udah lebih dari totalnya (tanda ada pengulangan) atau malah
    # ada slide yang gak pernah kesentuh sama sekali.
    out = out.replace('__TOTAL_SLIDES_JS__', js_str(len(slides)))
    # Sama filosofinya kayak TOTAL_SLIDES: tanpa pembanding, Command Center gak
    # bisa bedain "0 dari 3 video ditonton" dari "modul ini emang gak punya
    # video". Instagram SENGAJA gak dihitung - widgetnya jalan di iframe
    # cross-origin milik instagram.com, gak ada cara kita amati apa pun yang
    # terjadi di dalamnya (bukan belum-dibikin, tapi mentok teknis).
    total_video = sum(
        1 for s in slides for b in s.get('blocks', [])
        if b.get('type') == 'media' and (b.get('mediaSource') or 'video') in ('video', 'youtube')
    )
    out = out.replace('__TOTAL_VIDEO_JS__', js_str(total_video))
    # Penyebut sinyal interaktif di rekap peserta ("baru 2 dari 9 menu yang
    # kamu buka"). Sama alasannya kayak dua konstanta di atas: tanpa angka
    # total, "2 menu diklik" gak bisa dibedain antara modul yang cuma punya 2
    # dan modul yang punya 20.
    out = out.replace('__TOTAL_INTERAKTIF_JS__', js_str(
        sum(count_interaktif(s.get('blocks', [])) for s in slides)))
    # Penyebut buat "berapa paket Articulate yang diselesaikan". Sama alasannya
    # kayak total_video: tanpa angka total, "0 paket selesai" gak bisa dibedain
    # antara peserta yang gak nyentuh sama sekali dan modul yang emang gak
    # punya paket Articulate. Ditelusuri sampai ke dalam Grid - blok Articulate
    # boleh nangkring di dalam sel grid (lihat articulateBlocks di scormZip.ts).
    out = out.replace('__TOTAL_ARTICULATE_JS__', js_str(
        sum(count_articulate(s.get('blocks', [])) for s in slides)))
    # Waktu baca minimum per slide (ms), dari jumlah kata / 238 wpm (Brysbaert
    # 2019). Dipakai modul buat deteksi slide yang di-klik-lewat terlalu
    # cepat sebelum kuis bagian itu - lihat resolveReadingWarning() di
    # shell-template.html.
    out = out.replace('__SLIDE_MIN_MS_JS__', js_str(min_ms_per_slide))

    quizzes = module.get('quizzes', {})
    out = out.replace('__QUIZZES_JS__', js_str(quizzes))

    # Judul section yang PUNYA kuis, buat narasi rekap ("paling banyak gagal di
    # Section B (Judulnya)"). Sengaja cuma yang punya kuis, bukan semua section:
    # backend pakai map ini juga sebagai penanda "modul ini punya kuis apa
    # nggak". Section tanpa kuis gak pernah ngelewatin gerbang peringatan
    # baca-cepat, jadi kalau ikut dihitung, modul tanpa kuis bakal dinilai
    # "bagus" di dua sinyal yang sebenarnya gak berlaku buat dia (n/a).
    section_titles = {
        sec['id']: sec.get('title', '') for sec in sections if quizzes.get(sec['id'])
    }
    out = out.replace('__SECTION_TITLES_JS__', js_str(section_titles))

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

    # Popup "Ringkasan Belajarmu" buat peserta sendiri di slide Ringkasan.
    # Dipaksa mati kalau perekaman aktivitas mati: tanpa tracking gak ada satu
    # baris pun buat direkap, jadi popup-nya cuma bakal nampilin kosong.
    show_recap = track and bool(module.get('showRecap', False))
    out = out.replace('__SHOW_RECAP_JS__', js_str(show_recap))
    # Beda dari event aktivitas yang nembak Supabase LANGSUNG (anon
    # INSERT-only), rekap harus MEMBACA - dan anon sengaja nol izin SELECT.
    # Jadi bacanya lewat backend kita (service_role di sisi server). Modul
    # selama ini gak pernah tau URL backend, makanya wajib ditanam di sini.
    out = out.replace('__RECAP_API_JS__', js_str(
        os.environ.get('RECAP_API_BASE', 'https://template-modul-html-backend.vercel.app').rstrip('/')
        if show_recap else ''))

    # Co-creation - catatan peserta per slide. SENGAJA TIDAK di-AND dengan
    # `track` (beda dari show_recap di atas): tanpa perekaman pun peserta tetap
    # bisa mencatat & meninjau catatannya sendiri di perangkatnya. Yang hilang
    # cuma sinkronisasi lintas perangkat & tampilan di Command Center.
    show_cocreation = bool(module.get('showCocreation', False))
    out = out.replace('__SHOW_COCREATION_JS__', js_str(show_cocreation))
    # Alamat backend buat MENARIK BALIK catatan dari server (anon key modul
    # cuma bisa INSERT, nol SELECT - sama alasannya kayak RECAP_API di atas).
    # Kosong = mode terbatas: catatan cuma hidup di localStorage perangkat itu.
    # Butuh `track` karena catatan di server dikenali lewat NIP, dan yang
    # menanyakan NIP cuma sistem rekam aktivitas.
    out = out.replace('__COCREATION_API_JS__', js_str(
        os.environ.get('RECAP_API_BASE', 'https://template-modul-html-backend.vercel.app').rstrip('/')
        if (show_cocreation and track) else ''))

    hero_title_html = nl2br(module.get('heroTitleHtml') or esc(module.get('title', '')))
    out = out.replace('__HERO_TITLE_HTML__', hero_title_html)

    hero_desc = nl2br(module.get('heroDesc', ''))
    out = out.replace('__HERO_DESC__', hero_desc)

    # Judul slide penutup ("Selesai") - dulu ini teks tetap ("Materi Gambaran
    # Umum, Hukum, dan Etika Berhasil Diselesaikan") ketinggalan dari modul
    # lain di shell-template.html, jadi nongol di SEMUA modul orang lain
    # walau temanya beda-beda. Sekarang bisa dikustom per modul dari tab
    # Sampul; kalau dikosongkan, jatuh ke default otomatis pakai judul
    # modul-nya sendiri (bukan sisa teks modul lain).
    default_ending = f"{esc(module.get('title', ''))}<br><span>Berhasil Diselesaikan</span>"
    ending_title_html = nl2br(module.get('endingTitleHtml') or '') or default_ending
    out = out.replace('__ENDING_TITLE_HTML__', ending_title_html)

    # Deskripsi singkat di bawah judul penutup - pasangan __HERO_DESC__ milik
    # Sampul, lewat nl2br yang sama (jadi Enter = ganti baris, dan <span>
    # highlight emas tetap bisa dipakai). BEDA dari sampul: seluruh <p>-nya
    # baru dikeluarkan kalau diisi, bukan <p> kosong - modul lama yang gak
    # punya field ini render byte-identical ke sebelum fitur ini ada, tanpa
    # jarak nyasar di bawah judul dari elemen kosong.
    ending_desc = nl2br(module.get('endingDesc', ''))
    out = out.replace('__ENDING_DESC_HTML__',
                      f'<p class="hero-desc">{ending_desc}</p>' if ending_desc else '')

    # Gambar latar opsional slide penutup, diredupkan lewat filter:brightness()
    # di LAYER GAMBARNYA SENDIRI (div terpisah di belakang teks) - bukan di
    # container yang sama dengan judul, soalnya filter di container bakal
    # ikut meredupkan teksnya juga. Kosong = slide penutup polos, class+div
    # kosong semua, byte-identical ke sebelum field ini ada.
    ending_image = module.get('endingImageDataUri', '')
    ending_brightness = clamp_brightness(module.get('endingImageBrightness'), 50)
    out = out.replace('__ENDING_BG_CLASS__', ' ending-bg' if ending_image else '')
    out = out.replace('__ENDING_BG_IMG_HTML__', render_bg_image_layer('ending-bg-img', ending_image, ending_brightness))
    out = out.replace('__ENDING_DECO_HTML__', render_graphic_deco(graphic_style, 'ending'))

    sidebar_eyebrow = esc(module.get('sidebarEyebrow') or 'Open Access')
    out = out.replace('__SIDEBAR_EYEBROW__', sidebar_eyebrow)

    sidebar_title = esc(module.get('sidebarTitle') or module.get('title', ''))
    out = out.replace('__SIDEBAR_TITLE__', sidebar_title)

    return out
