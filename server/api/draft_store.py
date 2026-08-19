"""
Draft persistence via Supabase (PostgREST), so drafts survive redeploys/
restarts on Render (whose local disk is ephemeral) — reuses the same
Supabase project as the PILAR app (isolated in its own `modul_drafts`
table, doesn't touch PILAR's other tables/RLS).

Falls back to local JSON files under ../drafts/ when SUPABASE_URL /
SUPABASE_ANON_KEY aren't set, so local dev without those env vars keeps
working exactly like before.
"""
import os
import json
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DRAFTS_DIR = os.path.join(BASE_DIR, '..', '..', 'drafts')

USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def _headers():
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
    }


def _safe_name(name):
    return ''.join(c for c in name if c.isalnum() or c in ('-', '_')) or 'draft'


def ping():
    """One cheap read against the database, purely to register activity.

    Supabase's free tier pauses a project after ~7 days with no database
    activity, which takes every saved draft offline until someone manually
    resumes it from the Supabase dashboard — there is no API to un-pause,
    so preventing the pause is the only option that doesn't need a human.
    Called daily by the keep-alive cron (see server/vercel.json).

    Deliberately read-only and capped at 1 row: it only needs to *be* a
    query, not return anything useful, and it must stay cheap since it runs
    unattended forever.
    """
    if not USE_SUPABASE:
        return {'ok': True, 'storage': 'local-file', 'pinged': False}
    res = requests.get(
        f'{SUPABASE_URL}/rest/v1/modul_drafts',
        params={'select': 'slug', 'limit': 1},
        headers=_headers(),
        timeout=10,
    )
    res.raise_for_status()
    return {'ok': True, 'storage': 'supabase', 'pinged': True}


def list_drafts():
    if USE_SUPABASE:
        res = requests.get(
            f'{SUPABASE_URL}/rest/v1/modul_drafts',
            params={'select': 'slug'},
            headers=_headers(),
            timeout=10,
        )
        res.raise_for_status()
        return sorted(row['slug'] for row in res.json())

    os.makedirs(LOCAL_DRAFTS_DIR, exist_ok=True)
    return sorted(f[:-5] for f in os.listdir(LOCAL_DRAFTS_DIR) if f.endswith('.json'))


def load_draft(name):
    slug = _safe_name(name)
    if USE_SUPABASE:
        res = requests.get(
            f'{SUPABASE_URL}/rest/v1/modul_drafts',
            params={'select': 'data', 'slug': f'eq.{slug}'},
            headers=_headers(),
            timeout=10,
        )
        res.raise_for_status()
        rows = res.json()
        if not rows:
            return None
        return rows[0]['data']

    path = os.path.join(LOCAL_DRAFTS_DIR, slug + '.json')
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def save_draft(name, data):
    slug = _safe_name(name)
    if USE_SUPABASE:
        res = requests.post(
            f'{SUPABASE_URL}/rest/v1/modul_drafts',
            params={'on_conflict': 'slug'},
            headers={**_headers(), 'Prefer': 'resolution=merge-duplicates'},
            json={'slug': slug, 'data': data},
            timeout=10,
        )
        res.raise_for_status()
        return

    os.makedirs(LOCAL_DRAFTS_DIR, exist_ok=True)
    path = os.path.join(LOCAL_DRAFTS_DIR, slug + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def rename_draft(old_name, new_name):
    """Renames a draft in place - `slug` IS the primary key (modul_drafts
    table, see server/supabase_setup.sql), so this changes that key rather
    than copying+deleting. Raises ValueError if new_name is already taken by
    a DIFFERENT draft, so a rename can never silently clobber someone else's
    draft the way save_draft's upsert-by-slug normally would (that upsert is
    fine for autosave, which always targets its OWN slug - it's specifically
    wrong here, where the whole point is landing on a name that might belong
    to something else). Returns the actual slug used (name after
    _safe_name() sanitizing), since what the caller typed may not survive
    unchanged."""
    old_slug = _safe_name(old_name)
    new_slug = _safe_name(new_name)
    if old_slug == new_slug:
        return new_slug
    if load_draft(new_slug) is not None:
        raise ValueError(f'Nama "{new_slug}" sudah dipakai draft lain')

    if USE_SUPABASE:
        res = requests.patch(
            f'{SUPABASE_URL}/rest/v1/modul_drafts',
            params={'slug': f'eq.{old_slug}'},
            headers=_headers(),
            json={'slug': new_slug},
            timeout=10,
        )
        res.raise_for_status()
        return new_slug

    old_path = os.path.join(LOCAL_DRAFTS_DIR, old_slug + '.json')
    new_path = os.path.join(LOCAL_DRAFTS_DIR, new_slug + '.json')
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
    return new_slug
