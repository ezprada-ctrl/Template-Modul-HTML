import type { ModuleData, DraftSlide } from './types';

// In production (Vercel), the backend lives on a different host (Render),
// so it's supplied via VITE_API_BASE at build time. In local dev, fall back
// to whatever hostname the page was loaded from (not a hardcoded
// "localhost") so this still works when a teammate on the same LAN opens
// the app via the dev machine's IP instead of "localhost".
const BASE = import.meta.env.VITE_API_BASE
  || `${window.location.protocol}//${window.location.hostname}:5800`;

export async function extractPptx(file: File): Promise<DraftSlide[]> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/extract-pptx`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Gagal ekstrak PPTX');
  const data = await res.json();
  return data.slides.map((s: any) => ({ ...s, reviewed: false }));
}

// Apakah backend punya kredensial rekam-aktivitas (SUPABASE_URL + ANON_KEY)?
// Cuma balikin boolean, gak pernah bawa nilai key-nya. Dipakai buat
// memperingatkan di builder kalau modul yang dicentang "Rekam aktivitas"
// bakal bisu gara-gara env var backend kosong.
export async function checkTrackingConfig(): Promise<boolean> {
  const res = await fetch(`${BASE}/api/tracking-config`);
  if (!res.ok) throw new Error(`Gagal cek konfigurasi (${res.status})`);
  const data = await res.json();
  return !!data.configured;
}

export async function generateHtml(module: ModuleData): Promise<string> {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module),
  });
  if (!res.ok) throw new Error('Gagal generate HTML');
  return res.text();
}

export async function listDrafts(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/drafts`);
  const data = await res.json();
  return data.drafts;
}

export async function loadDraft(name: string): Promise<ModuleData> {
  const res = await fetch(`${BASE}/api/drafts/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Draft tidak ditemukan');
  return res.json();
}

export async function saveDraft(name: string, module: ModuleData): Promise<void> {
  await fetch(`${BASE}/api/drafts/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module),
  });
}

// ---------------------------------------------------------- Command Center
// Semua panggilan di bawah lewat BACKEND, bukan langsung ke Supabase: data
// aktivitas cuma bisa dibaca pakai service_role key, dan key itu wajib tetap
// di server (kalau dibawa ke browser, siapa pun bisa baca/hapus seluruh DB).
// Password ikut di body tiap panggilan — backend yang mutusin, bukan sini.

export interface ActivityModule {
  module_slug: string;
  rows: number;
  sessions: number;
  learners: number;
  first_seen: string;
  last_seen: string;
  // Daftar judul modul yang pernah muncul di bawah slug ini. Normalnya 1.
  judul_modul: string[];
  // true kalau >1 judul modul berbagi slug ini = project didaur ulang,
  // datanya nyampur. Perlu dipisah per judul modul saat analisis.
  kemungkinan_bentrok: boolean;
}

export interface ActivitySession {
  session_id: string;
  module_slug: string;
  learner_name: string | null;
  learner_id: string | null;
  identity_source: string | null;
  // Judul modul saat sesi ini direkam. Dipakai buat misahin sesi kalau satu
  // slug ternyata berisi beberapa modul (project didaur ulang).
  module_title: string | null;
  mulai: string;
  selesai: string;
  durasi_total_ms: number;
  durasi_menit: number;
  // Waktu tab beneran kelihatan aktif (berhenti dihitung saat peserta
  // pindah tab/minimize). Lebih jujur dipakai sebagai durasi utama
  // ketimbang durasi_menit total.
  durasi_tatap_layar_menit: number;
  // Selisih total - tatap layar. null = session_end gak pernah kekirim,
  // jadi selisihnya gak bisa dihitung (BUKAN berarti "gak pernah ditinggal").
  durasi_ditinggal_menit: number | null;
  jumlah_slide_dilihat: number;
  jumlah_interaksi: number;
  kuis_dijawab: number;
  kuis_benar: number;
  kuis_diulang: number;
  // Jumlah submit kuis yang GAGAL (lulus:false), dijumlah semua bagian di
  // modul ini. Sumbernya BUKAN kuis_diulang (klik tombol Ulangi) — itu
  // kelewat peserta yang gagal lalu nyerah tanpa pernah klik ulangi.
  kuis_gagal: number;
  perangkat: string | null;
}

// Rekap lintas modul. Digabung pakai NIP (learner_id), bukan nama — satu
// pelatihan biasanya dipecah jadi beberapa modul/SCORM terpisah, dan tanpa
// ini rekapnya harus dijoin manual di Excel.
export interface ActivityLearner {
  learner_id: string;
  nama: string | null;
  nama_varian: string[];
  nama_bervariasi: boolean;
  identity_sources: string[];
  modul: Record<string, { sesi: number; durasi_ms: number }>;
  modul_slugs: string[];
  jumlah_modul: number;
  jumlah_sesi: number;
  durasi_total_ms: number;
  durasi_menit: number;
  // Sama seperti ActivitySession: tatap layar dipakai sebagai durasi utama
  // (bukan durasi_menit total, yang bisa digelembungkan tab yang dibiarkan
  // kebuka sambil ditinggal).
  durasi_tatap_layar_menit: number;
  // null = SEMUA sesi peserta ini gak pernah kirim session_end (gak ada
  // angka yang bisa dipercaya). Kalau cuma sebagian, tetap terisi tapi
  // sesi_tanpa_end > 0 menandakan datanya parsial.
  durasi_ditinggal_menit: number | null;
  sesi_tanpa_end: number;
  jumlah_slide_dilihat: number;
  jumlah_interaksi: number;
  kuis_dijawab: number;
  kuis_benar: number;
  // Total gagal kuis, dijumlah lintas SEMUA modul yang peserta ini kerjakan.
  kuis_gagal: number;
  pertama: string;
  terakhir: string;
}

async function ccPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/activity/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Gagal memuat data (${res.status})`);
  return data;
}

// terpotong=true artinya data kena batas MAX_ROWS di backend, jadi rekap yang
// ditampilkan CUMA SEBAGIAN. Disurface biar gak dibaca sebagai data lengkap.
export async function ccListModules(password: string): Promise<{ items: ActivityModule[]; terpotong: boolean }> {
  const d = await ccPost('modules', { password });
  return { items: d.modules, terpotong: !!d.terpotong };
}

export async function ccListSessions(password: string, moduleSlug: string): Promise<{ items: ActivitySession[]; terpotong: boolean }> {
  const d = await ccPost('sessions', { password, module_slug: moduleSlug });
  return { items: d.sessions, terpotong: !!d.terpotong };
}

export async function ccListLearners(password: string): Promise<{ items: ActivityLearner[]; terpotong: boolean }> {
  const d = await ccPost('learners', { password });
  return { items: d.learners, terpotong: !!d.terpotong };
}

export async function ccRawRows(password: string, moduleSlug: string): Promise<any[]> {
  return (await ccPost('rows', { password, module_slug: moduleSlug })).rows;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const IMAGE_BUCKET = 'modul-images';

// Uploads the original file (no compression, no quality loss) straight to
// Supabase Storage from the browser — never touches our Vercel function, so
// it's not subject to the ~4.5MB request-body limit that broke base64-in-JSON
// uploads. Returns a public URL that gets embedded directly in the module
// JSON (tiny) and in the generated HTML's <img src="..."> / background-image.
export async function uploadImageToStorage(file: File): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase Storage belum dikonfigurasi (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY belum diset)');
  }
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Gagal upload gambar (${res.status})`);
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Downscale + re-encode as JPEG before embedding as base64. Raw photos (from
// a phone or Unsplash-style stock photos) are often several MB — embedded
// as-is in the module JSON, that pushes requests to /api/generate and
// /api/drafts past Vercel's ~4.5MB request body limit (Hobby plan), causing
// silent "Failed to fetch" / "Gagal menyimpan" errors. Capping the longest
// side keeps typical images down to a few hundred KB.
export function compressImageToDataUri(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);
      if (!ctx) {
        reject(new Error('Canvas tidak didukung di browser ini'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar'));
    };
    img.src = objectUrl;
  });
}
