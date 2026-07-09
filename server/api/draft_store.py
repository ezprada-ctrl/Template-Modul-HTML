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
