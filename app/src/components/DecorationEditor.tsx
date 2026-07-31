import { useState } from 'react';
import type { Decoration, DecorAnchor } from '../types';
import { uid } from '../types';
import { uploadImageToStorage } from '../api';

const ANCHOR_LABELS: Record<DecorAnchor, string> = {
  'top-left': 'Kiri atas',
  'top-center': 'Tengah atas',
  'top-right': 'Kanan atas',
  'right-center': 'Tengah kanan',
  'bottom-right': 'Kanan bawah',
  'bottom-center': 'Tengah bawah',
  'bottom-left': 'Kiri bawah',
  'left-center': 'Tengah kiri',
};
const ANCHOR_ORDER: DecorAnchor[] = [
  'top-left', 'top-center', 'top-right', 'right-center',
  'bottom-right', 'bottom-center', 'bottom-left', 'left-center',
];

interface Props {
  decorations: Decoration[];
  onChange: (d: Decoration[]) => void;
}

// Dekorasi grafis murni (PNG dari Canva dst) di salah satu dari 8 titik
// jangkar - BUKAN blok konten, gak ikut alur BlockEditor. Dipakai sama
// persis di Canvas.tsx (per slide) dan CoverForm.tsx (sampul).
export default function DecorationEditor({ decorations, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function addDecoration(file: File) {
    setBusy(true); setErr('');
    try {
      const src = await uploadImageToStorage(file);
      onChange([...decorations, { id: uid('decor'), src, anchor: 'top-right', size: 110 }]);
    } catch (ex: any) {
      setErr(ex?.message || 'Gagal upload gambar dekorasi');
    } finally {
      setBusy(false);
    }
  }

  function update(i: number, patch: Partial<Decoration>) {
    onChange(decorations.map((d, x) => x === i ? { ...d, ...patch } : d));
  }
  function remove(i: number) {
    onChange(decorations.filter((_, x) => x !== i));
  }

  return (
    <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 10, background: 'var(--surface-2)' }}>
      <b style={{ fontSize: 12.5 }}>🎨 Dekorasi <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>(opsional — gambar hiasan, mis. dari Canva, bukan bagian dari isi materi)</span></b>
      <p className="hint" style={{ fontSize: 11, margin: '4px 0 8px' }}>
        Nempel di salah satu titik jangkar di sekitar konten (bukan ikut alur blok), buat isi ruang kosong biar gak polos.
        PNG dengan latar transparan paling pas. Otomatis hilang di layar HP biar gak nutupin isi.
      </p>
      {decorations.map((d, i) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: 6, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <img src={d.src} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, background: 'var(--surface-3)', flexShrink: 0 }} />
          <select value={d.anchor} onChange={e => update(i, { anchor: e.target.value as DecorAnchor })} style={{ fontSize: 12 }}>
            {ANCHOR_ORDER.map(a => <option key={a} value={a}>{ANCHOR_LABELS[a]}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-faint)' }}>
            Ukuran
            <input type="range" min={40} max={260} step={10} value={d.size ?? 110}
              onChange={e => update(i, { size: parseInt(e.target.value, 10) })} style={{ width: 80 }} />
            {d.size ?? 110}px
          </label>
          <button className="btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => remove(i)}>Hapus</button>
        </div>
      ))}
      <input type="file" accept="image/*" disabled={busy} onChange={e => {
        const file = e.target.files?.[0];
        if (file) addDecoration(file);
        e.target.value = '';
      }} />
      {busy && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>mengunggah…</span>}
      {err && <p style={{ fontSize: 11, color: 'var(--danger, #c0392b)', margin: '4px 0 0' }}>{err}</p>}
    </div>
  );
}
