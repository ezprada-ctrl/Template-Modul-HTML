import { useState } from 'react';
import type { ModuleData } from '../types';
import { normalizeModule } from '../types';
import { generateHtml, listDrafts, loadDraft, saveDraft } from '../api';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function PreviewExport({ module, setModule }: Props) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  async function doPreview() {
    setError('');
    try {
      const out = await generateHtml(module);
      setHtml(out);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function doExport() {
    setError('');
    try {
      const out = await generateHtml(module);
      const blob = new Blob([out], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module.slug || 'modul'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function refreshDrafts() {
    setDrafts(await listDrafts());
  }

  async function doSave() {
    await saveDraft(module.slug, module);
    setStatus(`Tersimpan sebagai draft "${module.slug}"`);
    refreshDrafts();
  }

  async function doLoad(name: string) {
    const data = await loadDraft(name);
    setModule(normalizeModule(data));
    setStatus(`Draft "${name}" dimuat`);
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 14px' }}>Preview &amp; Export</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={doPreview}>Live Preview</button>
        <button onClick={doExport}>Export HTML</button>
        <button onClick={doSave}>Simpan Draft</button>
        <button className="btn-ghost" onClick={refreshDrafts}>Muat daftar draft</button>
      </div>
      {status && <p style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 500 }}>{status}</p>}
      {drafts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {drafts.map(d => <button className="btn-sm" key={d} onClick={() => doLoad(d)}>{d}</button>)}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {html && (
        <iframe srcDoc={html} style={{ width: '100%', height: '80vh', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }} />
      )}
    </div>
  );
}
