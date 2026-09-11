import type { Block, ModuleData } from './types';

/* ============================================================================
   KATALOG LANGKAH MODE DEMO OTOMATIS

   Ini SATU-SATUNYA tempat daftar langkah demo hidup. Urutan array = urutan
   tayang. Tiap entri cuma menjawab tiga hal:
     - id       : dipakai generator & shell buat mencocokkan aksi. JANGAN
                  diubah setelah dipakai - penyusun yang sudah menyunting
                  caption-nya menyimpan hasil suntingan itu per-id, dan id
                  yang berubah bikin suntingannya yatim (jatuh balik ke
                  caption bawaan tanpa peringatan).
     - caption  : kalimat bawaan yang tampil di layar. Penyusun boleh
                  menimpanya lewat editor di tab Tema; yang disimpan cuma
                  yang DIUBAH (lihat resolveDemoSteps).
     - applies  : fitur ini ada nggak di modulnya. Langkah yang gak berlaku
                  dibuang sebelum ditanam, jadi demo gak pernah menunjuk
                  fitur yang modulnya gak punya.

   MENAMBAH LANGKAH BARU (mis. ada fitur baru, atau materi video menyusul):
     1. Tambahkan satu objek di array ini.
     2. Tambahkan satu entri dengan id yang sama di DEMO_ACTIONS pada
        server/api/shell-template.html.
   Itu saja - mesin demonya (presDemoRun) gak perlu disentuh sama sekali.
   Shell mengabaikan id yang gak punya aksi, jadi urutan mengerjakan dua
   langkah di atas pun gak bikin rusak di tengah jalan.
   ========================================================================== */

/** Fakta modul yang sudah dihitung sekali, biar tiap `applies` jadi satu baris. */
export interface ModuleFacts {
  blockTypes: Set<string>;
  slideCount: number;
  sectionCount: number;
  /** ada slide yang blok tingkat atasnya lebih dari satu - syarat reveal bertahap */
  hasMultiBlockSlide: boolean;
  hasQuiz: boolean;
  hasAudio: boolean;
}

/** Kumpulkan tipe blok dari SELURUH kedalaman: Grid dan Modal menyimpan
    anak-anaknya di `blocks`, dan fitur yang dipamerkan demo sering justru
    ada di dalam sana (mis. Tabs di dalam Grid dua kolom). */
function collectTypes(blocks: Block[] | undefined, into: Set<string>): void {
  for (const b of blocks || []) {
    into.add(b.type);
    collectTypes((b as Block & { blocks?: Block[] }).blocks, into);
  }
}

export function moduleFacts(m: ModuleData): ModuleFacts {
  const blockTypes = new Set<string>();
  let hasMultiBlockSlide = false;
  let hasAudio = false;
  for (const s of m.slides || []) {
    collectTypes(s.blocks, blockTypes);
    if ((s.blocks || []).length > 1) hasMultiBlockSlide = true;
    if (s.audioSrc) hasAudio = true;
  }
  const quizzes = m.quizzes || {};
  return {
    blockTypes,
    slideCount: (m.slides || []).length,
    sectionCount: (m.sections || []).length,
    hasMultiBlockSlide,
    hasAudio,
    hasQuiz: Object.keys(quizzes).some(k => (quizzes[k] || []).length > 0),
  };
}

export interface DemoStep {
  id: string;
  /** nama langkah di editor caption - bukan yang tampil ke penonton */
  label: string;
  defaultCaption: string;
  applies: (m: ModuleData, f: ModuleFacts) => boolean;
}

const always = () => true;

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 'cover',
    label: 'Sampul',
    defaultCaption: 'Modul dibuka dari layar sampul — identitas dan judul materinya.',
    applies: m => !m.hideCover,
  },
  {
    id: 'sidebar',
    label: 'Daftar isi & struktur',
    defaultCaption: 'Seluruh materi tersusun per bagian, bisa dilompati dari daftar isi.',
    applies: always,
  },
  {
    id: 'static-tour',
    label: 'Ragam blok statis',
    defaultCaption: 'Materi dirakit dari blok siap pakai — kartu, catatan, timeline, tabel, diagram alur.',
    applies: (_m, f) =>
      ['card', 'callout', 'definition', 'pullquote', 'ticklist', 'timeline', 'dtable', 'flow', 'grid', 'image']
        .some(t => f.blockTypes.has(t)),
  },
  {
    id: 'reveal',
    label: 'Isi muncul bertahap',
    defaultCaption: 'Saat dipaparkan di kelas, isi slide muncul bertahap — peserta tidak membaca mendahului penjelasan.',
    applies: (_m, f) => f.hasMultiBlockSlide,
  },
  {
    id: 'accordion',
    label: 'Accordion',
    defaultCaption: 'Accordion menyembunyikan rincian sampai peserta memang membutuhkannya.',
    applies: (_m, f) => f.blockTypes.has('accordion'),
  },
  {
    id: 'tabs',
    label: 'Tabs',
    defaultCaption: 'Tabs memadatkan beberapa sudut pandang ke satu ruang layar.',
    applies: (_m, f) => f.blockTypes.has('tabs'),
  },
  {
    id: 'modal',
    label: 'Modal popup',
    defaultCaption: 'Penjelasan tambahan dibuka sebagai popup, tanpa peserta kehilangan tempatnya.',
    applies: (_m, f) => f.blockTypes.has('modal'),
  },
  {
    id: 'media',
    label: 'Video / media',
    defaultCaption: 'Video tertanam langsung di materi — dan seberapa jauh ditonton ikut terekam.',
    applies: (_m, f) => f.blockTypes.has('media'),
  },
  {
    id: 'audio',
    label: 'Voiceover slide',
    defaultCaption: 'Tiap slide bisa punya suara pengantar sendiri.',
    applies: (_m, f) => f.hasAudio,
  },
  {
    id: 'articulate',
    label: 'Konten Articulate 360',
    defaultCaption: 'Paket Articulate 360 berjalan di dalam modul, lengkap dengan pelaporan penyelesaiannya.',
    applies: (_m, f) => f.blockTypes.has('articulate'),
  },
  {
    id: 'knowledge',
    label: 'Knowledge Check',
    defaultCaption: 'Knowledge Check menahan peserta di slide sampai ia benar-benar menjawab.',
    applies: (_m, f) => f.blockTypes.has('knowledge'),
  },
  {
    id: 'cocreation',
    label: 'Co-creation (catatan peserta)',
    defaultCaption: 'Peserta mencatat apa pun yang terbesit di tiap slide, lalu meninjaunya dari satu tempat.',
    applies: m => !!m.showCocreation,
  },
  {
    id: 'quiz',
    label: 'Kuis & umpan balik',
    defaultCaption: 'Kuis memberi umpan balik per soal — jawaban salah dijelaskan, bukan sekadar ditandai.',
    applies: (_m, f) => f.hasQuiz,
  },
  {
    id: 'gating',
    label: 'Penguncian antar-bagian',
    defaultCaption: 'Bagian berikutnya baru terbuka setelah kuis sebelumnya dilewati.',
    applies: (_m, f) => f.hasQuiz && f.sectionCount > 1,
  },
  {
    id: 'activity',
    label: 'Rekam aktivitas peserta',
    defaultCaption: 'Semua yang barusan terjadi tertangkap sebagai data: lama baca, jawaban, tontonan, slide yang dilewati terburu-buru.',
    applies: always,
  },
  {
    id: 'recap',
    label: 'Rekap belajar',
    defaultCaption: 'Peserta melihat ringkasan sesi belajarnya sendiri di akhir.',
    applies: m => !!m.showRecap,
  },
  {
    id: 'pres-reveal-grid',
    label: 'Kisi semua slide',
    defaultCaption: 'Saat peserta bertanya soal materi yang tadi, instruktur melompat lewat kisi slide.',
    applies: always,
  },
  {
    id: 'pres-timer',
    label: 'Timer diskusi',
    defaultCaption: 'Timer diskusi kelompok, terbaca dari bangku paling belakang.',
    applies: always,
  },
  {
    id: 'pres-blank',
    label: 'Layar hitam',
    defaultCaption: 'Layar dihitamkan sejenak — perhatian kembali ke instruktur.',
    applies: always,
  },
  {
    id: 'pres-zoom',
    label: 'Skala untuk proyektor',
    defaultCaption: 'Ukuran teks dinaikkan agar terbaca dari belakang ruang kelas.',
    applies: always,
  },
  // Ditaruh PALING AKHIR dengan sengaja: menukar tema di tengah putaran bikin
  // booth berkedip gelap-terang di sela fitur materi. Di ujung, dia terbaca
  // sebagai penutup - dan aksinya mengembalikan tema ke terang sebelum
  // putaran berikutnya, jadi tiap putaran mulai dari tampilan yang sama.
  {
    id: 'theme',
    label: 'Tema terang / gelap',
    // Tombolnya ada di topbar tiap modul, bukan fitur opsional - jadi tidak
    // ada syarat isi yang perlu diperiksa.
    // Arah tukarnya tergantung tema perangkat booth (tanpa pilihan eksplisit
    // modul ikut OS), jadi captionnya sengaja tidak menyebut "ke gelap" -
    // di layar yang sudah gelap kalimat itu berlawanan dengan yang terlihat.
    defaultCaption: 'Satu klik menukar tema terang ↔ gelap — nyaman dibaca di ruang redup maupun ruang terang.',
    applies: always,
  },
];

/** Langkah yang BERLAKU buat modul ini, urut, caption sudah final
    (suntingan penyusun menimpa bawaan). Dipakai editor di aplikasi maupun
    generator — satu fungsi, jadi yang dipratinjau penyusun persis yang
    ditanam ke berkas hasil. */
export function resolveDemoSteps(m: ModuleData): { id: string; label: string; caption: string }[] {
  const f = moduleFacts(m);
  const custom = m.demoCaptions || {};
  return DEMO_STEPS.filter(s => s.applies(m, f)).map(s => ({
    id: s.id,
    label: s.label,
    // string kosong dianggap "belum diisi", bukan "sengaja dikosongkan":
    // caption kosong cuma menyisakan kotak hitam melayang tanpa teks.
    caption: (custom[s.id] || '').trim() || s.defaultCaption,
  }));
}
