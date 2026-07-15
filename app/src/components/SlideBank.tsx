import { useState } from 'react';
import type { DraftSlide, ModuleData, Slide } from '../types';
import { extractPptx } from '../api';
import { uid as makeId, renumberModule } from '../types';

interface Props {
  bank: DraftSlide[];
  setBank: (b: DraftSlide[]) => void;
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function SlideBank({ bank, setBank, module, setModule }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ slideNo: number; message: string; ok: boolean } | null>(null);

  function countAdded(slideNo: number) {
    return module.slides.filter(sl => sl.sourceSlideNo === slideNo).length;
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const slides = await extractPptx(file);
      setBank(slides);
    } catch (err: any) {
      setError(err.message || 'Gagal upload');
    } finally {
      setLoading(false);
    }
  }

  function toggleReviewed(slideNo: number) {
    setBank(bank.map(s => s.slideNo === slideNo ? { ...s, reviewed: !s.reviewed } : s));
  }

  function addToCanvas(draft: DraftSlide) {
    try {
      if (module.sections.length === 0) {
        throw new Error('Belum ada section. Buat section dulu di tab "Susun Modul".');
      }
      const sectionId = module.sections[0].id;
      const firstLine = draft.texts[0]?.split('\n')[0] || `Slide ${draft.slideNo}`;
      const restText = draft.texts.join('\n\n');
      const blocks = [];
      if (restText) {
        blocks.push({
          id: makeId('block'),
          type: 'card' as const,
          bodyHtml: `<p>${restText.replace(/\n/g, '<br>')}</p>`,
        });
      }
      draft.images.forEach(img => {
        blocks.push({ id: makeId('block'), type: 'image' as const, src: img });
      });
      draft.tables.forEach(rows => {
        blocks.push({
          id: makeId('block'),
          type: 'dtable' as const,
          headers: rows[0] || [],
          rows: rows.slice(1),
        });
      });
      const newSlide: Slide = {
        id: makeId('slide'),
        number: 0,
        sectionId,
        title: firstLine,
        kickerLabel: '',
        blocks,
        sourceSlideNo: draft.slideNo,
      };
      const nextModule = renumberModule({ ...module, slides: [...module.slides, newSlide] });
      setModule(nextModule);
      const assignedNumber = nextModule.slides.find(s => s.id === newSlide.id)!.number;
      setToast({ slideNo: draft.slideNo, ok: true, message: `Berhasil ditambahkan sebagai slide #${assignedNumber} ke section "${module.sections[0].short}".` });
    } catch (err: any) {
      setToast({ slideNo: draft.slideNo, ok: false, message: err.message || 'Gagal menambahkan slide ke canvas.' });
    } finally {
      setTimeout(() => setToast(t => (t && t.slideNo === draft.slideNo ? null : t)), 3500);
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>Import PPTX</h2>
      <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Upload file PPTX asli. Tiap slide otomatis diekstrak jadi draft (nomor slide asli dipertahankan
        biar gampang dicocokkan manual ke file PPTX kamu). Centang "sudah dicek" setelah kamu bandingkan.
      </p>
      <input type="file" accept=".pptx" onChange={onUpload} />
      {loading && <p className="hint" style={{ marginTop: 10 }}>Mengekstrak PPTX…</p>}
      {error && <p style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {bank.map(s => (
          <div className="panel" key={s.slideNo} style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 13.5 }}>Slide asli #{s.slideNo}</b>
              <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!s.reviewed} onChange={() => toggleReviewed(s.slideNo)} /> sudah dicek
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>
                {s.texts.join('\n---\n') || <i style={{ color: 'var(--text-faint)' }}>(tidak ada teks terdeteksi)</i>}
              </div>
              {s.images.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {s.images.map((img, i) => (
                    <img key={i} src={img} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                  ))}
                </div>
              )}
            </div>
            {s.tables.length > 0 && <div className="hint" style={{ marginTop: 6 }}>{s.tables.length} tabel terdeteksi</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <button className="btn-sm" onClick={() => addToCanvas(s)}>+ Tambah ke Canvas</button>
              {countAdded(s.slideNo) > 0 && (
                <span style={{ fontSize: 11.5, color: 'var(--success)', fontWeight: 600 }}>
                  ✓ Sudah ditambahkan ({countAdded(s.slideNo)}×)
                </span>
              )}
            </div>
            {toast && toast.slideNo === s.slideNo && (
              <div style={{
                marginTop: 8, fontSize: 12, padding: '7px 11px', borderRadius: 'var(--radius-sm)',
                background: toast.ok ? 'var(--success-soft)' : 'var(--danger-soft)',
                color: toast.ok ? 'var(--success)' : 'var(--danger)', fontWeight: 500,
              }}>
                {toast.ok ? '✓ ' : '✗ '}{toast.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
