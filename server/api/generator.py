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


# ---------------------------------------------------------------- block renderers

def render_card(b):
    icon_html = ''
    if b.get('icon'):
        bg = b.get('iconBg', 'var(--accent-soft)')
        color = b.get('iconColor', 'var(--accent-2)')
        icon_html = f'<span class="ic" style="background:{bg};color:{color};">{b["icon"]}</span>'
    heading = f'<h3>{icon_html}{esc(b.get("heading",""))}</h3>' if b.get('heading') else ''
    return f'<div class="card">{heading}{b.get("bodyHtml","")}</div>'


def render_callout(b):
    variant = b.get('variant', 'amber')
    inner = ''
    if b.get('badge'):
        inner += f'<span class="ic-badge">{esc(b["badge"])}</span>'
    elif b.get('pill'):
        inner += f'<span class="ic-pill">{esc(b["pill"])}</span>'
    elif b.get('icon'):
        inner += f'<span class="ic">{b["icon"]}</span>'
    inner += f'<div>{b.get("bodyHtml","")}</div>'
    return f'<div class="callout {variant}">{inner}</div>'


def render_definition(b):
    tag = f'<span class="tag">{esc(b.get("tag","DEFINISI"))}</span>'
    return f'<div class="definition">{tag}{b.get("bodyHtml","")}</div>'


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
                f'<div class="acc-body"><div class="acc-body-inner">{it.get("b","")}</div></div></div>')
    return f'<div class="acc-group">{out}</div>'


def render_tabs(b):
    prefix = b.get('id', 'tabs')
    tabs = b.get('tabItems', [])
    head = f'<div class="tabs" id="{prefix}-tabs">'
    body = ''
    for i, t in enumerate(tabs):
        active = ' active' if i == 0 else ''
        head += f'<button class="tab-btn{active}" onclick="switchTab(\'{prefix}\',{i})">{esc(t.get("label",""))}</button>'
        body += f'<div class="tab-panel{active}" id="{prefix}-panel-{i}">{t.get("content","")}</div>'
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
                f'<div class="tl-desc">{it.get("desc","")}</div></div></div>')
    out += '</div>'
    return out


def render_dtable(b):
    headers = ''.join(f'<th>{esc(h)}</th>' for h in b.get('headers', []))
    rows = ''
    for row in b.get('rows', []):
        rows += '<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>'
    return f'<table class="dtable"><thead><tr>{headers}</tr></thead><tbody>{rows}</tbody></table>'


FLOW_DATA = {}  # collected across the whole generation pass, flushed after SLIDES map


def render_flow(b):
    container_id = b.get('id', 'flow')
    steps = b.get('steps', [])
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


def render_modal(b):
    modal_id = b.get('id', 'modal')
    title = esc(b.get('heading', 'Info Tambahan'))
    body = b.get('bodyHtml', '')
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

    module_title_js = esc(module.get('sidebarTitle') or module.get('title', '')).replace("'", "\\'")
    out = out.replace('__MODULE_TITLE__', module_title_js)

    sections = module.get('sections', [])
    out = out.replace('__SECTIONS_JS__', js_str(sections))

    slides = sorted(module.get('slides', []), key=lambda s: s['number'])
    consts = []
    titles = {}
    for s in slides:
        html_body = render_slide_html(s)
        consts.append(f'const SLIDE_{s["number"]} = {js_str(html_body)};')
        titles[str(s['number'])] = s.get('title', '')
    slides_map = 'const SLIDES = {' + ','.join(f'{s["number"]}:SLIDE_{s["number"]}' for s in slides) + '};'
    flow_flush = ''.join(
        f"window._flowData['{cid}'] = {js_str(steps)};\n" for cid, steps in FLOW_DATA.items()
    )
    slide_block = '\n'.join(consts) + '\n' + slides_map + '\n' + flow_flush
    out = out.replace('__SLIDE_CONSTS_JS__', slide_block)

    out = out.replace('__SLIDE_TITLES_JS__', js_str(titles))

    quizzes = module.get('quizzes', {})
    out = out.replace('__QUIZZES_JS__', js_str(quizzes))

    multi_groups = module.get('multiGroups', {})
    out = out.replace('__MULTI_GROUPS_JS__', js_str(multi_groups))

    nav = build_nav(module)
    out = out.replace('__NAV_JS__', js_str(nav))

    out = out.replace('__HIDE_PROGRESS_JS__', js_str(bool(module.get('hideProgress', False))))

    hero_title_html = module.get('heroTitleHtml') or esc(module.get('title', ''))
    out = out.replace('__HERO_TITLE_HTML__', hero_title_html)

    hero_desc = module.get('heroDesc', '')
    out = out.replace('__HERO_DESC__', hero_desc)

    sidebar_eyebrow = esc(module.get('sidebarEyebrow') or 'Open Access')
    out = out.replace('__SIDEBAR_EYEBROW__', sidebar_eyebrow)

    sidebar_title = esc(module.get('sidebarTitle') or module.get('title', ''))
    out = out.replace('__SIDEBAR_TITLE__', sidebar_title)

    return out
