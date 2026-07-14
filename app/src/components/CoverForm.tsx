import { useState } from 'react';
import type { ModuleData } from '../types';
import { uploadImageToStorage } from '../api';
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
      <h2>Sampul & Pengaturan Modul</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ opacity: 0.6 }}>
            Nama Tab Browser <span style={{ fontSize: 11, fontWeight: 400 }}>(opsional, gak kepakai kalau modul dijalankan lewat Web Object Storyline)</span>
            <input style={{ width: '100%' }} value={module.title} onChange={e => setModule({ ...module, title: e.target.value })} />
          </label>
          <label>
            Judul besar di layar sampul (boleh HTML sederhana, mis. pakai <code>&lt;br&gt;</code> untuk ganti baris
            atau <code>&lt;span&gt;...&lt;/span&gt;</code> untuk bagian yang diwarnai emas)
            <textarea style={{ width: '100%', minHeight: 60 }} value={module.heroTitleHtml}
              onChange={e => setModule({ ...module, heroTitleHtml: e.target.value })} />
          </label>
          <label>
            Deskripsi singkat di bawah judul sampul
            <textarea style={{ width: '100%', minHeight: 50 }} value={module.heroDesc}
              onChange={e => setModule({ ...module, heroDesc: e.target.value })} />
          </label>
          <label>
            Label kecil di atas nama modul pada sidebar (mis. "Open Access")
            <input style={{ width: '100%' }} value={module.sidebarEyebrow}
              onChange={e => setModule({ ...module, sidebarEyebrow: e.target.value })} />
          </label>
          <label>
            Nama modul yang tampil di sidebar (biasanya versi singkat dari judul)
            <input style={{ width: '100%' }} value={module.sidebarTitle}
              onChange={e => setModule({ ...module, sidebarTitle: e.target.value })} />
          </label>
          <label>
            Gambar Sampul <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(disimpan di Supabase Storage, kualitas asli)</span>
            <input type="file" accept="image/*" onChange={onCoverUpload} />
          </label>
          {uploading && <p style={{ fontSize: 12, color: '#888' }}>Mengunggah gambar...</p>}
          {error && <p style={{ fontSize: 12, color: 'crimson' }}>{error}</p>}
          {module.coverImageDataUri && (
            <img src={module.coverImageDataUri} style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8 }} />
          )}
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
          <SlidePreview module={module} target="hero" />
        </div>
      </div>
    </div>
  );
}
