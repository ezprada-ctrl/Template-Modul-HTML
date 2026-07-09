import os
import tempfile

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

import generator
import pptx_extract
import draft_store

app = Flask(__name__)

# Allow the deployed Vercel frontend + local dev origins. Set CORS_ORIGINS in
# the Vercel project's env vars to a comma-separated list (e.g.
# "https://template-modul-html.vercel.app") once the frontend is deployed;
# defaults to "*" so local dev keeps working.
_origins = os.environ.get('CORS_ORIGINS', '*')
CORS(app, origins=_origins.split(',') if _origins != '*' else '*')


@app.post('/api/generate')
def api_generate():
    module = request.get_json(force=True)
    html = generator.generate_html(module)
    return Response(html, mimetype='text/html')


@app.post('/api/extract-pptx')
def api_extract_pptx():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'no file'}), 400
    with tempfile.NamedTemporaryFile(suffix='.pptx', delete=False) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    try:
        slides = pptx_extract.extract(tmp_path)
    finally:
        os.unlink(tmp_path)
    return jsonify({'slides': slides})


@app.get('/api/drafts')
def api_list_drafts():
    return jsonify({'drafts': draft_store.list_drafts()})


@app.get('/api/drafts/<name>')
def api_load_draft(name):
    data = draft_store.load_draft(name)
    if data is None:
        return jsonify({'error': 'not found'}), 404
    return jsonify(data)


@app.post('/api/drafts/<name>')
def api_save_draft(name):
    data = request.get_json(force=True)
    draft_store.save_draft(name, data)
    return jsonify({'ok': True})


@app.get('/api/health')
def api_health():
    return jsonify({'ok': True, 'storage': 'supabase' if draft_store.USE_SUPABASE else 'local-file'})


if __name__ == '__main__':
    # Local dev only — on Vercel this file is imported as a WSGI app by
    # their Python runtime, this block never runs there.
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5800)), debug=True)
