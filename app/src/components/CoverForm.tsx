import { useState, useEffect } from 'react';
import type { ModuleData } from '../types';
import { uploadImageToStorage, checkTrackingConfig } from '../api';
import { THEME_PRESETS, findThemePresetId } from '../themes';
import SlidePreview from './SlidePreview';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function CoverForm({ module, setModule }: Props) {
  // Status kredensial rekam-aktivitas di backend. Dicek otomatis begitu
  // "Rekam aktivitas" nyala, biar penyusun tau SEBELUM export kalau modulnya
  // bakal bisu gara-gara env var backend kosong. null = belum/masih dicek.
  const [trackReady, setTrackReady] = useState<boolean | null>(null);
  const [trackCheckErr, setTrackCheckErr] = useState(false);

  useEffect(() => {
    if (!module.trackActivity) { setTrackReady(null); setTrackCheckErr(false); return; }
    let alive = true;
    setTrackReady(null);
    setTrackCheckErr(false);
    checkTrackingConfig()
      .then(ok => { if (alive) setTrackReady(ok); })
      .catch(() => { if (alive) setTrackCheckErr(true); });
    return () => { alive = false; };
  }, [module.trackActivity]);

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
          {/* Status kredensial backend — dicek otomatis saat tracking nyala.
              Menangkap kegagalan senyap "env var backend kosong" yang bikin
              modul bisu walau checkbox dicentang, SEBELUM modul di-export. */}
          {module.trackActivity && trackReady === null && !trackCheckErr && (
            <p className="hint" style={{ fontSize: 11, margin: '2px 0 0 26px' }}>Mengecek koneksi rekam…</p>
          )}
          {module.trackActivity && trackReady === true && (
            <p className="hint" style={{ fontSize: 11, margin: '2px 0 0 26px', color: 'var(--success)' }}>
              ✓ Backend siap merekam. <span style={{ color: 'var(--text-faint)' }}>
                (Ini cuma memastikan kredensial ada — buat bukti jaringan LMS beneran tembus,
                pakai tombol “Cek Rekam Aktivitas” di Dev Mode setelah modul diupload.)
              </span>
            </p>
          )}
          {module.trackActivity && trackReady === false && (
            <p className="hint" style={{ fontSize: 11, margin: '2px 0 0 26px', color: 'var(--danger)', lineHeight: 1.5 }}>
              ⚠ Backend belum punya kredensial rekam-aktivitas (SUPABASE_URL / SUPABASE_ANON_KEY kosong).
              Modul yang di-export sekarang <b>gak akan merekam apa pun</b> walau centang ini nyala.
              Hubungi pengelola buat set env var-nya di Vercel dulu.
            </p>
          )}
          {module.trackActivity && trackCheckErr && (
            <p className="hint" style={{ fontSize: 11, margin: '2px 0 0 26px', color: 'var(--text-faint)' }}>
              (Gak bisa cek status koneksi rekam — backend mungkin lagi tidur. Pastikan lewat tombol
              “Cek Rekam Aktivitas” di Dev Mode setelah modul diupload.)
            </p>
          )}
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
          {/* Rekap buat peserta — sengaja nempel di bawah "Rekam aktivitas"
              dan cuma muncul kalau centang itu nyala: tanpa perekaman gak ada
              satu angka pun buat diringkas, jadi centang ini sendirian bakal
              nampilin popup kosong. Nilainya sengaja TIDAK ikut dimatikan
              waktu tracking dimatikan — generator udah maksa mati saat export,
              jadi pilihan penyusun tetap keinget kalau tracking dinyalain lagi. */}
          {module.trackActivity && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-dim)', cursor: 'pointer', margin: '2px 0 0 26px' }}>
              <input type="checkbox" checked={!!module.showRecap} style={{ marginTop: 3 }}
                onChange={e => setModule({ ...module, showRecap: e.target.checked })} />
              <span>
                Tampilkan Rekap Aktivitas ke Peserta
                <span className="hint" style={{ display: 'block', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>
                  Di slide Ringkasan, peserta dikasih popup “Ringkasan Belajarmu” berisi catatan sesinya
                  sendiri (durasi tatap layar, slide yang kelewat cepat, video, Knowledge Check, kuis,
                  menu interaktif) plus ajakan mengulang kalau sesinya kurang maksimal. Yang dilihat
                  cuma datanya sendiri — peserta gak bisa lihat data peserta lain.
                </span>
              </span>
            </label>
          )}
          <label style={{ color: 'var(--text-dim)' }}>
            Judul besar di layar sampul
            <span className="hint" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
              Ketik biasa — tekan Enter buat ganti baris, otomatis jadi baris baru saat di-generate (gak perlu
              ngetik <code>&lt;br&gt;</code> sendiri). Mau ada bagian yang diwarnai emas? Bungkus teksnya pakai{' '}
              <code>&lt;span&gt;...&lt;/span&gt;</code>.
            </span>
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
          <BackgroundImageField
            label="Gambar Sampul (opsional, disimpan di Supabase Storage, kualitas asli)"
            imageUri={module.coverImageDataUri}
            brightness={module.coverImageBrightness}
            defaultBrightness={100}
            brightnessHint='Sampul udah punya gradasi gelap bawaan biar judul putih tetap kebaca — slider ini buat meredamnya LEBIH LANJUT kalau perlu. 100% = gambar asli + gradasi bawaan.'
            onUpload={url => setModule({ ...module, coverImageDataUri: url })}
            onBrightnessChange={n => setModule({ ...module, coverImageBrightness: n })}
            onRemove={() => setModule({ ...module, coverImageDataUri: '', coverImageBrightness: undefined })}
          />
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
          <SlidePreview module={module} target="hero" />
        </div>
      </div>

      {/* Baris terpisah di bawah (bukan digabung ke kolom kiri di atas) -
          biar preview slide penutup punya panel sendiri di sebelahnya,
          gak numpang di panel sampul yang udah sticky mengikuti field-field
          di atas. */}
      <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <label style={{ color: 'var(--text-dim)' }}>
            Judul di slide penutup ("Selesai") saat modul kelar dipelajari
            <span className="hint" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
              Sama seperti judul sampul: ketik biasa, Enter otomatis ganti baris (gak perlu ngetik{' '}
              <code>&lt;br&gt;</code> sendiri). Opsional bungkus sebagian teks pakai{' '}
              <code>&lt;span&gt;...&lt;/span&gt;</code> buat highlight emas. Dikosongkan = otomatis pakai judul
              modul + "Berhasil Diselesaikan" (lihat preview di samping).
            </span>
            <textarea style={{ width: '100%', minHeight: 60, marginTop: 5 }} value={module.endingTitleHtml || ''}
              onChange={e => setModule({ ...module, endingTitleHtml: e.target.value })} />
          </label>
          <BackgroundImageField
            label="Gambar latar slide penutup (opsional, disimpan di Supabase Storage)"
            imageUri={module.endingImageDataUri}
            brightness={module.endingImageBrightness}
            defaultBrightness={50}
            brightnessHint="Makin rendah = makin redup/gelap — biar judul putih di atasnya tetap kebaca jelas."
            onUpload={url => setModule({ ...module, endingImageDataUri: url })}
            onBrightnessChange={n => setModule({ ...module, endingImageBrightness: n })}
            onRemove={() => setModule({ ...module, endingImageDataUri: '', endingImageBrightness: undefined })}
          />
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
          <SlidePreview module={module} target="summary" />
        </div>
      </div>
    </div>
  );
}

// Gambar latar opsional (dipakai Sampul & slide penutup), dengan slider
// kecerahan supaya teks putih di atasnya tetap kebaca (filter:brightness()
// ditanam di LAYER GAMBARNYA SENDIRI di generator.py, bukan di container
// yang sama dengan teks - itu bakal ikut meredupkan teksnya juga). Preview
// thumbnail di sini pakai filter:brightness() langsung di <img> cuma buat
// gambaran cepat sambil geser slider - tampilan FINAL yang benar (gambar +
// teks berlapis) ada di panel "Preview langsung" di sebelah kanan.
// `defaultBrightness` beda-beda per pemanggil: Sampul default 100 (udah
// punya gradasi gelap bawaan, slider ini cuma tambahan), slide penutup
// default 50 (gak ada gradasi bawaan sama sekali).
function BackgroundImageField({ label, imageUri, brightness, defaultBrightness, brightnessHint, onUpload, onBrightnessChange, onRemove }: {
  label: string;
  imageUri: string | undefined;
  brightness: number | undefined;
  defaultBrightness: number;
  brightnessHint: string;
  onUpload: (url: string) => void;
  onBrightnessChange: (n: number) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const b = brightness ?? defaultBrightness;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImageToStorage(file);
      onUpload(url);
    } catch (err: any) {
      setError(err.message || 'Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <label style={{ color: 'var(--text-dim)' }}>{label}</label>
      {imageUri ? (
        <div style={{ marginTop: 6 }}>
          <img src={imageUri} style={{
            width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', filter: `brightness(${b}%)`,
          }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
            Kecerahan
            <input type="range" min={0} max={100} step={5} value={b}
              onChange={e => onBrightnessChange(parseInt(e.target.value, 10))}
              style={{ flex: 1 }} />
            {b}%
          </label>
          <p className="hint" style={{ fontSize: 11, margin: '2px 0 8px' }}>{brightnessHint}</p>
          <button className="btn-danger btn-sm" onClick={onRemove}>Hapus gambar</button>
        </div>
      ) : (
        <input type="file" accept="image/*" onChange={handleUpload} style={{ marginTop: 6, display: 'block' }} />
      )}
      {uploading && <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Mengunggah gambar…</p>}
      {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
