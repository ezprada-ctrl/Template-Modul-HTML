import { useState } from 'react';
import type { ModuleData } from '../types';
import { DEMO_STEPS, moduleFacts } from '../demoSteps';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

/* Editor caption Mode Demo.

   Daftar langkahnya BUKAN daftar tetap - dia hasil saringan katalog di
   demoSteps.ts terhadap isi modul ini. Modul tanpa blok Tabs gak akan
   menampilkan baris "Tabs" buat disunting, karena demonya juga gak akan
   pernah menayangkannya. Jadi yang dilihat penyusun di sini persis yang
   bakal jalan di booth, bukan daftar kemungkinan.

   Yang disimpan cuma caption yang DIUBAH (lihat demoCaptions di types.ts):
   mengosongkan kotaknya = balik ke kalimat bawaan, bukan caption kosong. */
export default function DemoCaptionEditor({ module, setModule }: Props) {
  const [open, setOpen] = useState(false);

  const facts = moduleFacts(module);
  const aktif = DEMO_STEPS.filter(s => s.applies(module, facts));
  const custom = module.demoCaptions || {};
  const diubah = aktif.filter(s => (custom[s.id] || '').trim()).length;

  const setCaption = (id: string, teks: string) => {
    const next = { ...custom };
    // Kotak kosong berarti "pakai bawaan", jadi entri-nya DIBUANG, bukan
    // disimpan sebagai string kosong - biar perbaikan kalimat bawaan di
    // rilis berikutnya tetap sampai ke modul ini.
    if (teks.trim()) next[id] = teks;
    else delete next[id];
    setModule({ ...module, demoCaptions: next });
  };

  return (
    <div className="opt-note" style={{ display: 'block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: 8, width: '100%', fontWeight: 700, fontSize: 13,
        }}
      >
        <span style={{ opacity: .6 }}>{open ? '▾' : '▸'}</span>
        <span>Caption demo — {aktif.length} langkah akan ditayangkan</span>
        {diubah > 0 && (
          <span style={{ fontWeight: 600, fontSize: 11, opacity: .7 }}>({diubah} diubah)</span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, opacity: .75 }}>
            Kalimat yang tampil di layar saat demo menunjuk tiap fitur. Kosongkan untuk
            memakai kalimat bawaan. Daftar ini mengikuti isi modul — fitur yang tidak ada
            di modul tidak muncul di sini dan tidak akan ditayangkan.
          </p>
          {aktif.map((s, i) => (
            <label key={s.id} style={{ display: 'block', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, opacity: .5,
                  fontVariantNumeric: 'tabular-nums',
                }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontWeight: 700 }}>{s.label}</span>
              </span>
              <textarea
                rows={2}
                value={custom[s.id] || ''}
                placeholder={s.defaultCaption}
                onChange={e => setCaption(s.id, e.target.value)}
                style={{ width: '100%', fontSize: 12, lineHeight: 1.45, resize: 'vertical' }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
