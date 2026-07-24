import type { ModuleData, DraftSlide } from './types';

// In production (Vercel), the backend lives on a different host (Render),
// so it's supplied via VITE_API_BASE at build time. In local dev, fall back
// to whatever hostname the page was loaded from (not a hardcoded
// "localhost") so this still works when a teammate on the same LAN opens
// the app via the dev machine's IP instead of "localhost".
const BASE = import.meta.env.VITE_API_BASE
  || `${window.location.protocol}//${window.location.hostname}:5800`;

// 20MB — the actual upload no longer goes through Vercel (which is where the
// old ~4.5MB body-size ceiling lived), so this is a soft UX guard, not a
// platform limit. Kept well short of that ceiling anyway because every image
// in the deck gets converted to base64 and handed back to the browser in one
// go (see pptx_extract.py) — a huge deck means a huge amount of that sitting
// in the builder's live memory (the "Import PPTX" bank), not just a slow
// upload.
const MAX_PPTX_BYTES = 20 * 1024 * 1024;

// Uploads straight to Supabase Storage (bypasses the Vercel function and its
// body-size limit entirely — same reasoning as uploadImageToStorage), then
// asks the backend to pull it back down server-side (via service_role, so no
// anon SELECT policy is needed) and extract it there. The blob in Storage is
// deleted by the backend right after extraction — unlike images/video it has
// no further use once the slides are back in the browser, so there's no
// reason to let it linger and eat into Storage quota.
export async function extractPptx(file: File): Promise<DraftSlide[]> {
  if (file.size > MAX_PPTX_BYTES) {
    throw new Error(`File PPTX maksimal 20MB (file ini ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
  }
  const path = await uploadPptxToStorage(file);
  const res = await fetch(`${BASE}/api/extract-pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Gagal ekstrak PPTX');
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

// Satu kejadian popup peringatan kecepatan baca (reading_warning). Ditembak
// SEKALI per section (gerbang quizWarnShown di shell-template.html) - jadi
// satu entri di sini sudah otomatis "percobaan pertama saja", gak ada
// duplikat dari peserta ngulang kuis section yang sama.
export interface PeringatanDetail {
  section: string; // id section, mis. 'a' -> tampilkan sebagai "Section A"
  slides: number[]; // nomor slide KONTEN yang ketangkap di bawah 50% waktu baca minimum Brysbaert
  choice: string; // 'yakin' (tetap lanjut ke kuis) | 'kembali' (baca ulang)
  modul?: string; // cuma ada di ActivityLearner (lintas modul) - slug modul asalnya
}

// Rincian SATU video (blok media video/YouTube) - bukan cuma rata-rata
// gabungan (video_rata_persen), yang bisa menyamarkan satu video yang gak
// ditonton di antara yang lain ditonton penuh.
export interface VideoDetail {
  slide: number | null; // nomor slide rumah video ini. null = data lama sebelum field ini ada
  persen: number; // titik terjauh yang dicapai / durasi, 0-100
  modul?: string; // cuma ada di ActivityLearner (lintas modul) - slug modul asalnya
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
  // Total slide KONTEN modul ini (ditanam saat export). null = modul
  // di-export sebelum fitur ini ada - penyusun modul sering lupa
  // angka ini, jadi ditampilkan sebagai pembanding, bukan diasumsikan.
  total_slide: number | null;
  // Nomor slide unik yang pernah dibuka (BEDA dari jumlah_slide_dilihat
  // yang menghitung kunjungan termasuk yang diulang). unik < total_slide
  // artinya ada slide yang SAMA SEKALI belum pernah disentuh.
  jumlah_slide_unik: number;
  // Total blok video/YouTube di modul ini (Instagram TIDAK termasuk — itu
  // gak mungkin diamati sama sekali, lihat catatan di generator.py). null
  // kalau modulnya di-export sebelum fitur ini ada.
  total_video: number | null;
  // Berapa video yang DIMULAI (persen tercatat > 0), dan rata-rata seberapa
  // jauh video yang dimulai itu ditonton — "titik terjauh yang pernah
  // dicapai / durasi", bukan cuma "pernah dibuka". Video yang gak pernah
  // disentuh TIDAK ikut dihitung di rata-rata (biar gak bikin angkanya
  // keliatan jelek gara-gara video yang emang gak dibuka). null kalau belum
  // ada satu video pun yang dimulai.
  video_dimulai: number;
  video_rata_persen: number | null;
  // Rincian per video (slide + persen masing-masing), diurutkan dari yang
  // paling rendah duluan — dipakai buat lihat video MANA yang jarang
  // ditonton, bukan cuma rata-rata gabungan semuanya.
  video_detail: VideoDetail[];
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
  // Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat (< 50%
  // waktu baca minimum Brysbaert) sebelum percobaan kuis pertama sebuah
  // bagian, dan berapa dari situ yang dia pilih "Yakin, lanjut ke kuis"
  // (mengabaikan peringatan) alih-alih "Kembali, pelajari lagi".
  peringatan_baca_cepat: number;
  peringatan_diabaikan: number;
  // Rincian tiap kejadian di atas: section mana + nomor slide persis yang
  // ketangkap + pilihan peserta. Dipakai buat tampilan "lihat slide mana
  // aja" di Command Center, terpisah dari angka agregat di atas.
  peringatan_detail: PeringatanDetail[];
  // Knowledge Check (blok cek-paham inline, TIDAK mengunci navigasi). Dihitung
  // TERPISAH dari kuis section: kc_dijawab = jumlah soal knowledge-check yang
  // dijawab, kc_benar = yang benar. Boleh diulang bebas, jadi ini murni
  // "berapa banyak dicoba & berapa yang tepat", bukan skor kelulusan.
  kc_dijawab: number;
  kc_benar: number;
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
  modul: Record<string, { sesi: number; durasi_ms: number; total_slide: number | null; total_video: number | null }>;
  modul_slugs: string[];
  jumlah_modul: number;
  jumlah_sesi: number;
  // Jumlah slide konten unik yang pernah dibuka, digabung lintas semua
  // modul (nomor slide yang sama di modul BEDA gak ketuker jadi satu).
  jumlah_slide_unik: number;
  // Jumlah slide konten di SELURUH modul yang dia kerjakan, dijumlah sekali
  // per modul. null kalau semua modulnya di-export sebelum fitur ini ada.
  total_slide_program: number | null;
  // Sama seperti ActivitySession, dijumlah/digabung lintas semua modul.
  total_video_program: number | null;
  video_dimulai: number;
  video_rata_persen: number | null;
  // Rincian per video (slide + persen masing-masing), diurutkan dari yang
  // paling rendah duluan — dipakai buat lihat video MANA yang jarang
  // ditonton, bukan cuma rata-rata gabungan semuanya.
  video_detail: VideoDetail[];
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
  // Sama seperti ActivitySession, dijumlah lintas semua modul.
  peringatan_baca_cepat: number;
  peringatan_diabaikan: number;
  // Sama seperti ActivitySession, digabung lintas semua modul - tiap entri
  // bawa field `modul` (slug) karena peserta ini bisa punya beberapa modul.
  peringatan_detail: PeringatanDetail[];
  // Knowledge Check dijumlah lintas semua modul peserta ini (lihat catatan
  // di ActivitySession). Terpisah total dari kolom Kuis.
  kc_dijawab: number;
  kc_benar: number;
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
// Separate bucket for video/audio so heavy media files don't mix with the
// image bucket. Must be created once in Supabase (public, anon-insert),
// mirroring modul-images. If it's missing, uploads 404 with a clear message.
const MEDIA_BUCKET = 'modul-media';

// Uploads the original file (no compression, no quality loss) straight to a
// Supabase Storage bucket from the browser — never touches our Vercel
// function, so it's not subject to the ~4.5MB request-body limit that broke
// base64-in-JSON uploads. Returns both the public URL (what images/video/audio
// embed in the generated HTML) and the raw storage path (what the backend
// needs to fetch/delete the object itself server-side, e.g. for PPTX extraction).
async function uploadFileToStorage(file: File, bucket: string, prefix = ''): Promise<{ url: string; path: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase Storage belum dikonfigurasi (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY belum diset)');
  }
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) {
    // Surface Supabase's actual reason. Note: the Storage API often returns
    // HTTP 400 even for "Bucket not found" (the semantic 404 lives in the JSON
    // body), so keying a hint off res.status alone misses it — check the body.
    let detail = '';
    try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
    const bucketMissing = res.status === 404 || /bucket not found/i.test(detail);
    const mimeBlocked = /mime type|not supported|content type/i.test(detail);
    let hint = '';
    if (bucketMissing) hint = ` — bucket "${bucket}" belum ada. Buat dulu di Supabase Storage (public).`;
    else if (mimeBlocked) hint = ` — tipe file ini ditolak bucket "${bucket}". Di Supabase, set "Allowed MIME types" bucket ke kosong (semua) atau tambahkan audio/*, video/*.`;
    throw new Error(`Gagal upload file (${res.status})${hint}${detail ? ` · ${detail}` : ''}`);
  }
  return { url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`, path };
}

// Thin caller kept for existing image-upload call sites (cover, image block).
export async function uploadImageToStorage(file: File): Promise<string> {
  return (await uploadFileToStorage(file, IMAGE_BUCKET)).url;
}

// For video/audio blocks — same flow, different bucket.
export async function uploadMediaToStorage(file: File): Promise<string> {
  return (await uploadFileToStorage(file, MEDIA_BUCKET)).url;
}

// PPTX uploads go in the same bucket under a pptx/ prefix. Unlike
// images/video, nothing keeps referencing this blob after extraction, so
// callers only need the PATH (to hand to the backend, which downloads it via
// service_role and deletes it right after) — never the public URL.
async function uploadPptxToStorage(file: File): Promise<string> {
  return (await uploadFileToStorage(file, MEDIA_BUCKET, 'pptx/')).path;
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
