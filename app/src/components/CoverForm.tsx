import { useState } from 'react';
import type { ModuleData } from '../types';
import { uploadImageToStorage } from '../api';
import { THEME_PRESETS, findThemePresetId } from '../themes';
import SlidePreview from './SlidePreview';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function CoverForm({ module, setModule }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImageToStorage(file);
      setModule({ ...module, coverImageDataUri: url });
    } catch (err: any) {
      setError(err.message || 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px' }}>Sampul &amp; Pengaturan Modul</h2>
      <div style={{ display: 'flex', gap: 28 }}>
        <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ color: 'var(--text-dim)' }}>
            Nama Tab Browser <span className="hint" style={{ fontSize: 11 }}>(opsional, gak kepakai kalau modul dijalankan lewat Web Object Storyline)</span>
            <input style={{ width: '100%', marginTop: 5 }} value={module.title} onChange={e => setModule({ ...module, title: e.target.value })} />
          </label>
          <label style={{ color: 'var(--text-dim)' }}>
            Tema Warna Modul <span className="hint" style={{ fontSize: 11 }}>(cuma ganti 2 warna brand - emas/aksen &amp; navy; warna benar/salah/info tetap sama)</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: -6 }}>
            {THEME_PRESETS.map(preset => {
              const selected = findThemePresetId(module.theme) === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setModule({ ...module, theme: { accent: preset.accent, accent2: preset.accent2, onAccent: preset.onAccent, navy: preset.navy } })}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: selected ? '1px solid var(--ink)' : '1px solid var(--border)',
                    background: selected ? 'var(--surface-2)' : 'var(--surface)',
                    boxShadow: selected ? '0 0 0 3px var(--ring)' : 'none',
                  }}
                >
                  <span style={{
                    display: 'flex', width: 34, height: 20, borderRadius: 6, overflow: 'hidden',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.12)',
                  }}>
                    <span style={{ flex: 1, background: preset.accent }} />
                    <span style={{ flex: 1, background: preset.navy }} />
                  </span>
                  <span style={{ fontSize: 11, color: selected ? 'var(--text)' : 'var(--text-faint)', fontWeight: selected ? 700 : 500 }}>{preset.label}</span>
                </button>
              );
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!module.hideProgress}
              onChange={e => setModule({ ...module, hideProgress: e.target.checked })} />
            <span>Sembunyikan progress belajar</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-dim)', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!module.trackActivity} style={{ marginTop: 3 }}
              onChange={e => setModule({ ...module, trackActivity: e.target.checked })} />
            <span>
              Rekam aktivitas peserta
              <span className="hint" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
                Peserta diminta isi Nama &amp; NIP di awal, lalu durasi per slide, kuis, dan interaksinya
                direkam buat bahan riset. Modul tanpa centang ini gak ngirim data apa pun.
              </span>
            </span>
          </label>
          {/* Peringatan bentrok slug: data aktivitas ditandai pakai slug
              project ini. Kalau project didaur ulang jadi modul lain, dua
              modul bakal berbagi slug dan datanya nyampur di Command Center.
              Cuma relevan kalau tracking nyala. */}
          {module.trackActivity && (
            <p className="hint" style={{ fontSize: 11, margin: '2px 0 0 26px', color: 'var(--danger)', lineHeight: 1.5 }}>
              ⚠ Data direkam pakai slug <code>{module.slug}</code>. Buat <b>tiap modul baru</b>, mulai dari
              tombol “+ Mulai Project Baru” di header — jangan daur ulang project ini jadi modul lain,
              nanti datanya nyampur di Command Center.
            </p>
          )}
          <label style={{ color: 'var(--text-dim)' }}>
            Judul besar di layar sampul (boleh HTML sederhana, mis. pakai <code>&lt;br&gt;</code> untuk ganti baris
            atau <code>&lt;span&gt;...&lt;/span&gt;</code> untuk bagian yang diwarnai emas)
            <textarea style={{ width: '100%', minHeight: 60, marginTop: 5 }} value={module.heroTitleHtml}
              onChange={e => setModule({ ...module, heroTitleHtml: e.target.value })} />
          </label>
          <label style={{ color: 'var(--text-dim)' }}>
            Deskripsi singkat di bawah judul sampul
            <textarea style={{ width: '100%', minHeight: 50, marginTop: 5 }} value={module.heroDesc}
              onChange={e => setModule({ ...module, heroDesc: e.target.value })} />
          </label>
          <label style={{ color: 'var(--text-dim)' }}>
            Label kecil di atas nama modul pada sidebar (mis. "Open Access")
            <input style={{ width: '100%', marginTop: 5 }} value={module.sidebarEyebrow}
              onChange={e => setModule({ ...module, sidebarEyebrow: e.target.value })} />
          </label>
          <label style={{ color: 'var(--text-dim)' }}>
            Nama modul yang tampil di sidebar (biasanya versi singkat dari judul)
            <input style={{ width: '100%', marginTop: 5 }} value={module.sidebarTitle}
              onChange={e => setModule({ ...module, sidebarTitle: e.target.value })} />
          </label>
          <label style={{ color: 'var(--text-dim)' }}>
            Gambar Sampul <span className="hint" style={{ fontSize: 11 }}>(disimpan di Supabase Storage, kualitas asli)</span>
            <input type="file" accept="image/*" onChange={onCoverUpload} style={{ marginTop: 5, display: 'block' }} />
          </label>
          {uploading && <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Mengunggah gambar…</p>}
          {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
          {module.coverImageDataUri && (
            <img src={module.coverImageDataUri} style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
          )}
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
          <SlidePreview module={module} target="hero" />
        </div>
      </div>
    </div>
  );
}
