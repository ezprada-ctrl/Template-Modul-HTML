import { useMemo, useRef, useState } from 'react';
import type { ModuleData } from '../types';
import { normalizeModule, moduleFromJson, slugify } from '../types';
import { generateHtml, listDrafts, loadDraft, saveDraft, renameDraft, copyDraft, deleteDraft } from '../api';
import { articulateBlocks, exportScormZip, type ZipProgress } from '../scormZip';
import { sematkanGambarDataUri } from '../assetEmbed';

/** Menyorot bagian nama draft yang cocok dengan ketikan, supaya alasan sebuah
 *  baris ikut tampil kelihatan langsung — bukan cuma "percaya saja". */
function SorotCocok({ teks, cari }: { teks: string; cari: string }) {
  const q = cari.trim().toLowerCase();
  const i = q ? teks.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{teks}</>;
  return (
    <>
      {teks.slice(0, i)}
      <mark style={{ background: 'var(--ink-soft)', color: 'var(--text)', fontWeight: 700, borderRadius: 3 }}>
        {teks.slice(i, i + q.length)}
      </mark>
      {teks.slice(i + q.length)}
    </>
  );
}

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
  // Import Project JSON dari tab ini = GANTI project yang lagi terbuka. Ditangani
  // di App.tsx (handleImportJson): reset undo history + arahkan autosave ke slug
  // baru — sama persis dengan jalur "Import dari file JSON" di modal Project.
  onImportJson: (data: ModuleData) => void;
}

export default function PreviewExport({ module, setModule, onImportJson }: Props) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [zip, setZip] = useState<ZipProgress | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Mode kelola daftar draft: hapus + atur urutan (drag). Digembok password
  // karena hapus itu permanen DAN daftar draft dipakai bareng semua orang.
  const [manage, setManage] = useState(false);
  // Urutan tampilan draft — SIMPANAN LOKAL per-peramban (localStorage), bukan
  // di server: ini "rak" pribadi si pengguna, gak boleh ngubah urutan yang
  // dilihat orang lain. Draft yang gak ada di daftar ini nyusul di belakang,
  // urut abjad.
  const [draftOrder, setDraftOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pe:draft-order') || '[]'); } catch { return []; }
  });
  const dragFrom = useRef<string | null>(null);
  // Kotak cari daftar draft. Menyaring sejak huruf PERTAMA diketik — daftarnya
  // sudah puluhan nama yang berpola mirip (`nama_topik-mtxxxxx-n`), jadi
  // menunggu 2-3 huruf cuma bikin orang mengetik nama lengkap.
  const [cariDraft, setCariDraft] = useState('');

  const MANAGE_PASSWORD = 'PasswordPE100%';

  function sortByOrder(list: string[]): string[] {
    return [...list].sort((a, b) => {
      const ia = draftOrder.indexOf(a);
      const ib = draftOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }
  // Daftar yang benar-benar dirender: urutan rak pribadi, lalu disaring &
  // diperingkat ulang oleh ketikan. Nama yang DIAWALI ketikan naik ke atas,
  // sisanya (cocok di tengah nama) menyusul dengan urutan aslinya utuh —
  // makin panjang yang diketik, makin sedikit yang lolos saringan.
  const draftTampil = useMemo(() => {
    const urut = sortByOrder(drafts);
    const q = cariDraft.trim().toLowerCase();
    if (!q) return urut;
    const cocok = urut.filter(d => d.toLowerCase().includes(q));
    return cocok.sort((a, b) =>
      Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, draftOrder, cariDraft]);

  // Seret-atur-urutan dimatikan selama menyaring: yang kelihatan cuma sebagian
  // daftar, jadi menjatuhkan satu baris ke baris lain menghasilkan urutan yang
  // gak bisa ditebak dari layar.
  const bisaSeret = manage && !cariDraft.trim();

  function persistOrder(next: string[]) {
    setDraftOrder(next);
    try { localStorage.setItem('pe:draft-order', JSON.stringify(next)); } catch { /* kuota penuh — urutan gak kesimpen, fitur tetap jalan */ }
  }
  function toggleManage() {
    if (manage) { setManage(false); setStatus('Mode kelola draft dimatikan.'); return; }
    setError('');
    const p = window.prompt('Password mode kelola draft:');
    if (p === null) return;
    if (p === MANAGE_PASSWORD) {
      setManage(true);
      setStatus('Mode kelola draft aktif — seret ⠿ buat atur urutan, 🗑 buat hapus.');
    } else {
      setError('Password salah.');
    }
  }
  function reorder(from: string, target: string) {
    if (!from || from === target) return;
    const vis = sortByOrder(drafts).filter(x => x !== from);
    const ti = vis.indexOf(target);
    vis.splice(ti < 0 ? vis.length : ti, 0, from);
    persistOrder(vis);
  }
  async function doDelete(name: string) {
    if (!window.confirm(`Hapus draft "${name}" PERMANEN?\nIni ngefek ke daftar draft yang dipakai bareng semua orang, dan gak bisa dibatalkan.`)) return;
    setError('');
    try {
      await deleteDraft(name);
      persistOrder(draftOrder.filter(o => o !== name));
      setStatus(`Draft "${name}" dihapus`);
      refreshDrafts();
    } catch (e: any) {
      setError(e.message);
    }
  }

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
    setStatus('');
    try {
      const mentah = await generateHtml(module);
      // Gambar disematkan jadi data URI dulu. Tanpa ini file HTML-nya cuma
      // MENUNJUK ke Supabase Storage: kelihatan normal waktu dibuka di laptop
      // sendiri, tapi gambarnya hilang begitu diupload ke KLC (halamannya
      // disajikan dari server LMS yang gak menjangkau host luar).
      setStatus('Menyematkan gambar…');
      const { html: out, gagal, jumlah } = await sematkanGambarDataUri(
        mentah,
        (i, total) => setStatus(`Menyematkan gambar (${i}/${total})…`),
      );
      // Baris status di bawah tombol warnanya hijau (sukses), jadi kabar
      // "ada yang gagal" gak boleh nebeng di situ - itu masuk baris error.
      setStatus(jumlah ? `${jumlah} gambar ikut tersemat di file HTML.` : '');
      if (gagal.length) {
        setError(
          `${gagal.length} gambar gagal ditarik dan cuma jadi tautan — gambar itu bakal kosong di LMS. ` +
          `Coba export ulang; kalau tetap gagal, upload ulang gambarnya di modul.`,
        );
      }
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

  // Export "mentah": simpan seluruh ModuleData sebagai file .json. Bentuknya
  // IDENTIK dengan yang dibolak-balik saveDraft/loadDraft ke server — jadi ini
  // salinan portabel buat backup, commit ke git, atau nyerahin modul ke orang
  // di mesin lain. Dibaca balik lewat "Import dari file JSON" di modal Project.
  function doExportJson() {
    setError('');
    const blob = new Blob([JSON.stringify(module, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.slug || 'modul'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Project JSON diunduh (${module.slug || 'modul'}.json)`);
  }

  // Kebalikan doExportJson: muat file .json (ModuleData) dari disk jadi project
  // yang dibuka. moduleFromJson yang memvalidasi bentuk + menormalkan + menomori
  // ulang slide; kalau formatnya salah dia melempar pesan yang aman ditampilkan.
  async function doImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // biar file yang sama bisa dipilih ulang setelah error
    if (!file) return;
    setError('');
    setStatus('');
    let data: ModuleData;
    try {
      data = moduleFromJson(await file.text());
    } catch (err: any) {
      setError(err?.message || 'Gagal membaca file.');
      return;
    }
    // Namai draft-nya sendiri. Tanpa ini modul mewarisi slug yang kebetulan ada
    // di file, dan autosave berikutnya bisa menimpa draft server yang namanya
    // kebetulan sama. Prompt sekaligus jadi titik konfirmasi (batal = urung).
    const jawab = window.prompt(
      `Impor "${data.title}" (${data.sections.length} section, ${data.slides.length} slide) sebagai draft.\n` +
      `Project yang terbuka sekarang ("${module.slug}") tetap tersimpan.\n\n` +
      `Nama draft untuk modul yang diimpor:`,
      data.slug,
    );
    if (jawab === null) return; // batal
    const slug = slugify(jawab) || data.slug;
    // Nama itu sudah dipakai draft lain di server? Autosave bakal menimpanya
    // diam-diam kalau diteruskan. (Tidak dipersoalkan kalau namanya = project
    // yang sedang terbuka — itu memang "muat ulang versi terbaru".)
    try {
      const adaDrafts = await listDrafts();
      if (adaDrafts.includes(slug) && slug !== module.slug &&
          !window.confirm(`Draft "${slug}" sudah ada di server. Timpa dengan modul yang diimpor?`)) {
        return;
      }
    } catch { /* daftar draft gak kebaca — lanjut, autosave yang jadi penentu */ }
    onImportJson({ ...data, slug });
    setStatus(`Modul diimpor sebagai draft "${slug}" — ${data.sections.length} section, ${data.slides.length} slide.`);
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
        <button onClick={doExportJson}>Export JSON</button>
        <button onClick={() => importRef.current?.click()}>Import JSON</button>
        <button onClick={doSave}>Simpan Draft</button>
        <button className="btn-ghost" onClick={refreshDrafts}>Muat daftar draft</button>
        <button className="btn-ghost" onClick={toggleManage} title="Mode kelola daftar draft (hapus & atur urutan)">
          {manage ? '🔓 Dev' : '🔒 Dev'}
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          onChange={doImportJson}
          style={{ display: 'none' }}
        />
      </div>
      {status && <p style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 500 }}>{status}</p>}
      {jumlahArt > 0 && (
        <p className="hint" style={{ fontSize: 11.5, lineHeight: 1.6, margin: '0 0 10px' }}>
          <strong>{jumlahArt} blok Articulate</strong> ({totalArtMb.toFixed(0)}MB) cuma ikut di Export SCORM.
        </p>
      )}
      {zip && (
        <p style={{ fontSize: 12.5, color: zip.fase === 'selesai' ? 'var(--success)' : 'var(--text-dim)', fontWeight: 500 }}>
          {zip.pesan}{zip.persen !== null && zip.fase !== 'selesai' ? ` ${zip.persen}%` : ''}
        </p>
      )}
      {manage && (
        <p className="hint" style={{ fontSize: 11.5, margin: '0 0 8px', color: 'var(--text-dim)' }}>
          Seret <strong>⠿</strong> buat atur urutan, <strong>🗑</strong> buat hapus permanen.
        </p>
      )}
      {/* Dulu semua draft ditumpuk sebagai chip yang membungkus ke bawah. Dengan
          puluhan nama berpola mirip, hasilnya dinding teks tanpa titik pijak:
          gak ada kolom yang lurus buat dipindai, dan nama yang dicari cuma bisa
          ditemukan dengan menyapu mata baris demi baris. Sekarang daftar satu
          kolom yang bisa disaring sambil mengetik. */}
      {drafts.length > 0 && (
        <div style={{ marginBottom: 14, maxWidth: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input
              value={cariDraft}
              onChange={e => setCariDraft(e.target.value)}
              placeholder="Cari draft…"
              aria-label="Cari draft"
              style={{ flex: 1, minWidth: 0 }}
            />
            {cariDraft && (
              <button className="btn-sm btn-ghost" onClick={() => setCariDraft('')} title="Hapus pencarian">✕</button>
            )}
            <span className="hint" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
              {cariDraft.trim() ? `${draftTampil.length} dari ${drafts.length}` : `${drafts.length} draft`}
            </span>
          </div>

          {draftTampil.length === 0 ? (
            <p className="hint" style={{ fontSize: 12, margin: '8px 0 0' }}>
              Gak ada draft yang namanya mengandung “{cariDraft.trim()}”.
            </p>
          ) : (
            <div className="draft-list">
              {draftTampil.map(d => (
                <div
                  key={d}
                  className="draft-row"
                  onDragOver={bisaSeret ? (e) => e.preventDefault() : undefined}
                  onDrop={bisaSeret ? (e) => { e.preventDefault(); reorder(e.dataTransfer.getData('text/plain'), d); dragFrom.current = null; } : undefined}
                >
                  {manage && (
                    <span
                      draggable={bisaSeret}
                      onDragStart={bisaSeret ? (e) => { dragFrom.current = d; e.dataTransfer.setData('text/plain', d); e.dataTransfer.effectAllowed = 'move'; } : undefined}
                      onDragEnd={() => { dragFrom.current = null; }}
                      className="draft-grip"
                      style={{ cursor: bisaSeret ? 'grab' : 'not-allowed', opacity: bisaSeret ? 1 : 0.35 }}
                      title={bisaSeret ? 'Seret buat atur urutan' : 'Kosongkan kotak cari dulu buat atur urutan'}
                    >⠿</span>
                  )}
                  <button className="draft-name" onClick={() => doLoad(d)} title={`Muat draft "${d}"`}>
                    <SorotCocok teks={d} cari={cariDraft} />
                  </button>
                  <span className="draft-actions">
                    <button className="btn-icon btn-sm btn-ghost" title="Duplikat draft ini" onClick={() => doCopy(d)}>⧉</button>
                    <button className="btn-icon btn-sm btn-ghost" title="Ganti nama draft ini" onClick={() => doRename(d)}>✎</button>
                    {manage && (
                      <button className="btn-icon btn-sm btn-ghost" style={{ color: 'var(--danger)' }}
                        title="Hapus draft ini (permanen)" onClick={() => doDelete(d)}>🗑</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {html && (
        <iframe srcDoc={html} allow="autoplay; encrypted-media; picture-in-picture; clipboard-write" style={{ width: '100%', height: '80vh', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }} />
      )}
    </div>
  );
}
