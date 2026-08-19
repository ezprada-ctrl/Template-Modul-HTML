import { useState } from 'react';
import type { ModuleData } from '../types';
import { normalizeModule } from '../types';
import { generateHtml, listDrafts, loadDraft, saveDraft, renameDraft, copyDraft } from '../api';
import { articulateBlocks, exportScormZip, type ZipProgress } from '../scormZip';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function PreviewExport({ module, setModule }: Props) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [zip, setZip] = useState<ZipProgress | null>(null);

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

  // Paket SCORM .zip — satu-satunya bentuk export yang membawa serta konten
  // Articulate. Dirakit di browser (lihat scormZip.ts), jadi ukuran paketnya
  // gak dibatasi limit fungsi serverless.
  async function doExportScorm() {
    setError('');
    setZip({ fase: 'html', pesan: 'Menyiapkan…', persen: null });
    try {
      await exportScormZip(module, setZip);
    } catch (e: any) {
      // Dialog "Simpan sebagai" yang ditutup pengguna = batal, bukan kegagalan
      // yang perlu ditampilkan sebagai error merah.
      if (e?.name !== 'AbortError') setError(e.message);
      setZip(null);
      return;
    }
    setTimeout(() => setZip(null), 4000);
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

  // Duplicates the draft under a new name the user picks. Doesn't touch
  // whatever's currently open in the editor - just adds a new independent
  // copy to the list, ready to load later.
  async function doCopy(name: string) {
    const newName = window.prompt(`Nama draft salinan dari "${name}":`, `${name}-copy`);
    if (!newName || !newName.trim() || newName.trim() === name) return;
    setError('');
    try {
      await copyDraft(name, newName.trim());
      setStatus(`Draft "${name}" disalin jadi "${newName.trim()}"`);
      refreshDrafts();
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Changes an existing draft's name in place (not a copy - the old name
  // stops existing). If the draft being renamed is the one currently open
  // in the editor, module.slug is updated too - autosave targets whatever
  // module.slug currently holds (see App.tsx), so without this the very
  // next autosave would silently recreate the old name from stale state.
  async function doRename(name: string) {
    const newName = window.prompt(`Nama baru buat "${name}":`, name);
    if (!newName || !newName.trim() || newName.trim() === name) return;
    setError('');
    try {
      const slug = await renameDraft(name, newName.trim());
      setStatus(`Draft "${name}" diganti nama jadi "${slug}"`);
      if (module.slug === name) setModule({ ...module, slug });
      refreshDrafts();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const artBlocks = articulateBlocks(module);
  const jumlahArt = artBlocks.length;
  const totalArtMb = artBlocks.reduce((n, b) => n + (b.artSize || 0), 0) / 1024 / 1024;

  return (
    <div>
      <h2 style={{ margin: '0 0 14px' }}>Preview &amp; Export</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={doPreview}>Live Preview</button>
        <button onClick={doExport}>Export HTML</button>
        <button onClick={doExportScorm} disabled={!!zip}>
          {zip ? 'Membungkus…' : 'Export SCORM (.zip)'}
        </button>
        <button onClick={doSave}>Simpan Draft</button>
        <button className="btn-ghost" onClick={refreshDrafts}>Muat daftar draft</button>
      </div>
      {status && <p style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 500 }}>{status}</p>}
      {jumlahArt > 0 && (
        <p className="hint" style={{ fontSize: 11.5, lineHeight: 1.6, margin: '0 0 10px' }}>
          Modul ini punya <strong>{jumlahArt} blok Articulate</strong> ({totalArtMb.toFixed(0)}MB).
          Konten itu <strong>cuma ikut di Export SCORM (.zip)</strong> — di Live Preview dan Export HTML
          yang muncul cuma kotak penanda, karena file-nya belum dibawa ke mana-mana.
        </p>
      )}
      {zip && (
        <p style={{ fontSize: 12.5, color: zip.fase === 'selesai' ? 'var(--success)' : 'var(--text-dim)', fontWeight: 500 }}>
          {zip.pesan}{zip.persen !== null && zip.fase !== 'selesai' ? ` ${zip.persen}%` : ''}
        </p>
      )}
      {drafts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {drafts.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button className="btn-sm" style={{ border: 'none', borderRadius: 0 }} onClick={() => doLoad(d)}>{d}</button>
              <button className="btn-sm" style={{ border: 'none', borderRadius: 0, borderLeft: '1px solid var(--border)', padding: '0 8px' }}
                title="Duplikat draft ini" onClick={() => doCopy(d)}>⧉</button>
              <button className="btn-sm" style={{ border: 'none', borderRadius: 0, borderLeft: '1px solid var(--border)', padding: '0 8px' }}
                title="Ganti nama draft ini" onClick={() => doRename(d)}>✎</button>
            </div>
          ))}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {html && (
        <iframe srcDoc={html} allow="autoplay; encrypted-media; picture-in-picture; clipboard-write" style={{ width: '100%', height: '80vh', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }} />
      )}
    </div>
  );
}
