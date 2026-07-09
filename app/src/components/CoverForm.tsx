import type { ModuleData } from '../types';
import { fileToDataUri } from '../api';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function CoverForm({ module, setModule }: Props) {
  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUri = await fileToDataUri(file);
    setModule({ ...module, coverImageDataUri: dataUri });
  }

  return (
    <div>
      <h2>Sampul & Pengaturan Modul</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
        <label>
          Judul Modul
          <input style={{ width: '100%' }} value={module.title} onChange={e => setModule({ ...module, title: e.target.value })} />
        </label>
        <label>
          Slug (untuk nama file & penyimpanan progres, huruf kecil - tanpa spasi)
          <input style={{ width: '100%' }} value={module.slug}
            onChange={e => setModule({ ...module, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} />
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
          Gambar Sampul
          <input type="file" accept="image/*" onChange={onCoverUpload} />
        </label>
        {module.coverImageDataUri && (
          <img src={module.coverImageDataUri} style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8 }} />
        )}
      </div>
    </div>
  );
}
