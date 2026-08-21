import { DEFAULT_THEME } from './themes';

export type BlockType =
  | 'card' | 'callout' | 'definition' | 'pullquote' | 'ticklist'
  | 'accordion' | 'tabs' | 'timeline' | 'dtable' | 'flow' | 'grid' | 'image' | 'badgeref' | 'html' | 'modal'
  | 'media' | 'knowledge' | 'articulate';

// One question inside a Knowledge Check block. Same shape idea as
// QuizQuestion but no requirement of exactly 4 options — 2 options
// (benar/salah) is valid. Two feedback modes, chosen per question by
// whoever authors it:
// - 'single' (default, feedbackMode unset): locks immediately after one
//   pick, right or wrong (no retry). `feedbackCorrect`/`feedbackWrong` are
//   shown depending on the outcome — split so authors can't accidentally
//   write a verdict-specific text ("Kamu benar!") that then displays under
//   the opposite verdict. Legacy `feedback` (pre-split, one shared text for
//   both outcomes) is kept only as a fallback for data authored before this
//   split existed — never written by the editor anymore.
// - 'perOption': `optFeedback[i]` (parallel to opts[i]) shown instead, keyed
//   to whichever option the learner actually picked — so a wrong pick can
//   explain specifically why THAT option is wrong. Each entry is optional;
//   an unfilled one just shows the ✓/✕ verdict with no extra text.
export interface KcQuestion {
  q: string;
  opts: string[];
  correct: number;
  /** @deprecated pre-split shared feedback text — kept only as a read fallback, see feedbackCorrect/feedbackWrong */
  feedback?: string;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  feedbackMode?: 'single' | 'perOption';
  optFeedback?: string[];
}

export interface Block {
  id: string;
  type: BlockType;
  // card
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  heading?: string;
  bodyHtml?: string;
  // callout
  variant?: 'amber' | 'rose' | 'blue' | 'violet' | 'teal';
  badge?: string;
  pill?: string;
  // definition
  tag?: string;
  // pullquote
  num?: string;
  text?: string;
  // ticklist — `heading` (reuses card's field above) is optional: kosong =
  // cuma daftarnya tampil sendiri (perilaku lama, draft lama gak berubah).
  ordered?: boolean;
  stacked?: boolean;
  items?: string[];
  // accordion
  accItems?: { h: string; b: string }[];
  // tabs
  tabItems?: { label: string; content: string }[];
  // timeline
  tlItems?: { time: string; title: string; desc: string }[];
  // dtable
  headers?: string[];
  // Each row's cell count may be LESS than headers.length - the last cell in
  // that row then spans the remaining columns (colspan), so a row can be one
  // cell per column OR a single cell stretching across all of them, mixed
  // freely row by row. Omitted/full-length rows render exactly as before
  // this existed (colspan 1 everywhere) - purely additive.
  rows?: string[][];
  // Optional group-header row rendered ABOVE `headers` (e.g. "Mitra
  // Transaksi" spanning 3 sub-columns beneath it, like a merged super-header).
  // Undefined/empty = no group row at all, table looks exactly like before
  // this field existed.
  dtableGroups?: { label: string; span: number }[];
  // flow
  steps?: { n: number; title: string; detail: string; badge?: string }[];
  // grid
  columns?: 2 | 3;
  blocks?: Block[];
  // image
  src?: string;
  caption?: string;
  // Layout controls (all optional; unset = current behaviour: boxed, 100%,
  // centered, no float — so old drafts render exactly as before).
  imgClean?: boolean;                        // true = tanpa kotak/bg/border/bayangan (mode karakter); auto-nyala kalau PNG transparan
  imgWidth?: number;                         // lebar % (10–100), default 100
  imgAlign?: 'left' | 'center' | 'right';    // posisi horizontal saat blok berdiri sendiri (default center)
  imgFloat?: 'none' | 'left' | 'right';      // 'left'/'right' = dampingi teks (karakter di sisi itu, blok setelahnya mengalir di sebelahnya)
  // badgeref
  refText?: string;
  // html
  raw?: string;
  // media (single block, source picked via mediaSource)
  // - 'video': uploaded file, URL in `src` (reuses image's src field)
  // - 'youtube' / 'instagram': raw page URL pasted by author, in `embedUrl`
  mediaSource?: 'video' | 'youtube' | 'instagram';
  embedUrl?: string;
  // Rasio tampilan kotak video — cuma berlaku untuk 'video' (upload); YouTube
  // sudah punya rasio sendiri (16:9/9:16 Shorts otomatis dari URL), Instagram
  // responsif lewat embed.js. Unset = "asli" = ikut rasio asli file videonya
  // (perilaku lama, draft lama tetap render sama). Kalau video aslinya beda
  // rasio dari yang dipilih, ditampilkan utuh dengan letterbox (bar hitam),
  // BUKAN dipotong — lihat render_media() di generator.py.
  videoRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  // knowledge check (inline, non-gating quiz-like block)
  kcItems?: KcQuestion[];
  // articulate — paket Articulate 360 (Storyline/Rise) yang dibungkus jadi
  // bagian modul. ZIP-nya SENGAJA disimpan utuh di Supabase Storage (artUrl),
  // bukan diekstrak ke sana per-file: file Articulate bisa ratusan-ribuan,
  // dan yang butuh file lepas cuma satu saat — waktu paket SCORM dirakit di
  // browser (Export SCORM). Menyimpan utuh = 1 objek storage, bukan ribuan.
  // Tempat paket ini disimpan. Blok yang diupload SEBELUM Cloudflare R2 dipakai
  // tidak punya field ini — dianggap 'supabase', jadi draft lama tetap jalan
  // tanpa perlu upload ulang.
  artStorage?: 'r2' | 'supabase';
  // URL publik ZIP-nya. Hanya terisi untuk penyimpanan Supabase; bucket R2
  // tertutup, jadi paket R2 dibaca lewat URL bertanda tangan yang diminta
  // saat perlu (URL yang disimpan pasti sudah kedaluwarsa waktu dipakai lagi).
  artUrl?: string;
  artPath?: string;     // path storage-nya (buat hapus kalau bloknya dibuang)
  // Folder akar paket DI DALAM ZIP (tempat imsmanifest.xml duduk). Dibuang
  // perakit waktu menyalin, jadi isi paket selalu mendarat rata di
  // `articulate/<idBlok>/`. Kosong = isinya memang langsung di akar ZIP.
  artRoot?: string;
  // File pembuka RELATIF terhadap artRoot (mis. index_lms.html) — ini yang
  // jadi src iframe. Blok yang diupload sebelum artRoot ada menyimpan path
  // lengkap termasuk folder induk di sini; generator & perakit sama-sama
  // menurunkannya kembali jadi root+relatif, jadi draft lama tetap jalan.
  artEntry?: string;
  artName?: string;     // nama file asli, buat ditampilkan di builder & modul
  artSize?: number;     // byte, buat peringatan ukuran paket akhir
  artRatio?: '16:9' | '4:3' | 'tinggi';  // 'tinggi' = kotak 80vh, buat Rise yang isinya panjang ke bawah
  // Default true (dikunci). Kalau false, peserta boleh lanjut walau kontennya
  // belum kelar — statusnya tetap direkam.
  artLock?: boolean;
}

export interface Section {
  id: string;
  title: string;
  short: string;
  icon: string;
  color: string;
}

export interface Slide {
  id: string;
  number: number;
  sectionId: string;
  title: string;
  kickerLabel: string;
  subtitle?: string;
  blocks: Block[];
  sourceSlideNo?: number;
  // Optional per-slide voiceover. `audioMode` picks the learner experience:
  // 'auto' plays on slide open (with a fallback control if the browser
  // blocks autoplay), 'manual' just shows a player the learner may use.
  audioSrc?: string;
  audioMode?: 'auto' | 'manual';
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
  explain: string;
}

export interface ModuleData {
  title: string;
  slug: string;
  heroTitleHtml: string;
  heroDesc: string;
  // Judul di slide penutup ("Selesai") di akhir modul. Kosong = generator
  // pakai default otomatis dari `title` module ini - jadi modul lama yang
  // dibuat sebelum field ini ada tetap dapet judul penutup yang masuk akal
  // (bukan sisa teks modul lain) tanpa penyusunnya perlu isi apa-apa.
  endingTitleHtml?: string;
  // Deskripsi singkat di bawah judul penutup - pasangan `heroDesc` milik
  // Sampul. Kosong = seluruh <p>-nya gak dikeluarkan sama sekali (bukan <p>
  // kosong), jadi modul lama render persis seperti sebelum field ini ada.
  endingDesc?: string;
  // Gambar latar opsional khusus slide penutup (beda dari coverImageDataUri,
  // itu punya Sampul). Kosong = slide penutup polos seperti sebelum field ini
  // ada. `endingImageBrightness` (0-100, default 50 = redup) ngatur
  // filter:brightness() di layer gambarnya SAJA (teks judul tetap putih
  // penuh, gak ikut meredup) - lihat render_summary_bg di generator.py.
  endingImageDataUri?: string;
  endingImageBrightness?: number;
  sidebarEyebrow: string;
  sidebarTitle: string;
  coverImageDataUri: string;
  // Kecerahan gambar sampul (0-100). BEDA DEFAULT dari endingImageBrightness:
  // sampul dari dulu udah punya gradient gelap bawaan (lihat .cover-bg di
  // shell-template.html) buat jamin judul putih tetap kebaca - jadi default
  // di sini 100 (= gambar asli, gradient bawaan aja) supaya modul lama yang
  // udah punya coverImageDataUri render IDENTIK kayak sebelum field ini ada.
  // Geser slider di bawah 100 = REDAM LEBIH LANJUT di atas gradient itu.
  coverImageBrightness?: number;
  // When true, the "Progres Belajar" card (percentage + bar) never shows to
  // learners in the exported HTML — for modules that are just one part of a
  // larger series, where "100%" on this module alone would be misleading.
  hideProgress?: boolean;
  // When true, the exported module records learner activity (slide durations,
  // quiz attempts, interactions) to Supabase for study-habit research, and
  // asks the learner for Nama + NIP up front. Opt-in per module so ordinary
  // modules don't send anything at all.
  trackActivity?: boolean;
  // When true, the learner sees their OWN activity recap as an infographic
  // popup at the end of the module (screen time, videos watched, rushed
  // slides, knowledge-check first-attempt score, weakest quiz section,
  // unopened interactive menus) with narrative tuned to how they did.
  // Requires trackActivity — without it there is no data to show at all.
  showRecap?: boolean;
  theme: { accent: string; accent2: string; onAccent: string; navy: string };
  // Gaya dekorasi grafis (blob/cincin/dll) - INDEPENDEN dari `theme` di atas
  // (theme cuma warna, ini cuma bentuk - lihat GRAPHIC_STYLES di
  // graphicStyles.ts). 'none' = polos seperti sebelum fitur ini ada (default,
  // jadi modul lama tanpa field ini render identik). Kalau diisi, berlaku ke
  // SELURUH modul: Sampul, tiap slide konten, dan slide penutup sekaligus -
  // masing-masing komposisi beda (lihat render_graphic_deco di generator.py),
  // bukan bentuk yang sama ditempel ulang.
  graphicStyle?: string;
  sections: Section[];
  slides: Slide[];
  quizzes: Record<string, QuizQuestion[]>;
  multiGroups: Record<string, { label: string; slides: number[] }[]>;
}

export interface DraftSlide {
  slideNo: number;
  texts: string[];
  tables: string[][][];
  images: string[];
  reviewed?: boolean;
}

// Turns free-text (person name, project name) into a URL/filename-safe
// fragment: lowercase, non-alphanumerics collapsed to single dashes.
export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Combines person name + project name into a slug prefix, e.g.
// "Budi Santoso" + "Modul Etika" -> "budi-santoso_modul-etika". The random
// suffix from `uid()` still gets appended after this, so two people (or
// the same person starting a second project) never collide.
export function buildProjectSlugPrefix(nama: string, namaProject: string): string {
  const namaPart = slugify(nama) || 'anon';
  const projPart = slugify(namaProject);
  return projPart ? `${namaPart}_${projPart}` : namaPart;
}

export function emptyModule(slugPrefix = 'modul-html'): ModuleData {
  // Unique per call (not a fixed "modul-baru") so two people opening the
  // app for the first time land on separate drafts instead of silently
  // sharing/overwriting the same one. Caller can pass a prefix built from
  // the user's name + project name (see buildProjectSlugPrefix) so the
  // slug stays identifiable even after localStorage is cleared.
  const slug = uid(slugPrefix);
  return {
    title: 'Modul Baru',
    slug,
    heroTitleHtml: 'Modul Baru',
    heroDesc: '',
    endingTitleHtml: '',
    endingDesc: '',
    sidebarEyebrow: 'Open Access',
    sidebarTitle: 'Modul Baru',
    coverImageDataUri: '',
    hideProgress: false,
    trackActivity: false,
    showRecap: false,
    theme: { ...DEFAULT_THEME },
    graphicStyle: 'none',
    sections: [{ id: 'a', title: 'A. Bagian Satu', short: 'Bagian Satu', icon: 'A', color: '#c99a3d' }],
    slides: [],
    quizzes: {},
    multiGroups: {},
  };
}

// Merges a loaded draft with current defaults so fields added after the
// draft was saved (e.g. `theme`) don't come back as `undefined`.
export function normalizeModule(data: Partial<ModuleData>): ModuleData {
  return { ...emptyModule(), ...data, theme: { ...DEFAULT_THEME, ...data.theme } };
}

// Recomputes every slide's `number` from scratch, purely from (a) the order
// of `sections` and (b) each slide's relative position within its own
// section (as reflected by `slides` array order). This is the single source
// of truth for numbering — call it after ANY operation that could change
// order (reorder within a section, move a slide to another section, add,
// remove) instead of hand-rolling incremental math at each call site, which
// is what let numbers drift/collide previously (e.g. reordering a
// non-last section pushed its numbers past later sections' numbers, and
// moving a slide to another section didn't renumber it at all).
//
// Bundles (`multiGroups`) reference slides by NUMBER, not id, so any
// renumber has to remap them too or a bundle silently starts pointing at
// the wrong slide.
export function renumberModule(module: ModuleData): ModuleData {
  const bySection = new Map<string, Slide[]>(module.sections.map(sec => [sec.id, []]));
  const orphans: Slide[] = [];
  for (const s of module.slides) {
    const bucket = bySection.get(s.sectionId);
    if (bucket) bucket.push(s); else orphans.push(s);
  }

  const oldToNew = new Map<number, number>();
  let n = 1;
  const slides: Slide[] = [];
  for (const sec of module.sections) {
    for (const s of bySection.get(sec.id)!) {
      oldToNew.set(s.number, n);
      slides.push({ ...s, number: n });
      n++;
    }
  }
  for (const s of orphans) {
    oldToNew.set(s.number, n);
    slides.push({ ...s, number: n });
    n++;
  }

  const multiGroups: ModuleData['multiGroups'] = {};
  for (const [sectionId, bundles] of Object.entries(module.multiGroups)) {
    multiGroups[sectionId] = bundles.map(b => ({
      ...b,
      slides: b.slides.map(num => oldToNew.get(num)).filter((num): num is number => num !== undefined),
    }));
  }

  return { ...module, slides, multiGroups };
}

let idCounter = 0;
export function uid(prefix = 'id') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

// Fresh default content for a given block type - single source of truth so
// both "+ Tambah blok" and "ganti tipe blok" build the same shape.
export function newBlock(type: BlockType): Block {
  const id = uid('block');
  switch (type) {
    case 'ticklist': return { id, type, ordered: false, items: [''] };
    case 'accordion': return { id, type, accItems: [{ h: 'a. Judul', b: 'Isi' }] };
    case 'tabs': return { id, type, tabItems: [{ label: 'Tab 1', content: 'Isi tab' }] };
    case 'timeline': return { id, type, tlItems: [{ time: '', title: '', desc: '' }] };
    case 'dtable': return { id, type, headers: ['Kolom 1', 'Kolom 2'], rows: [['', '']] };
    case 'flow': return { id, type, steps: [{ n: 1, title: '', detail: '' }] };
    case 'grid': return { id, type, columns: 2, blocks: [] };
    case 'callout': return { id, type, variant: 'amber', bodyHtml: '' };
    case 'definition': return { id, type, tag: 'DEFINISI', bodyHtml: '' };
    case 'pullquote': return { id, type, num: '', text: '' };
    case 'image': return { id, type, src: '', caption: '' };
    case 'badgeref': return { id, type, refText: '' };
    case 'html': return { id, type, raw: '' };
    case 'media': return { id, type, mediaSource: 'video', src: '', embedUrl: '', caption: '' };
    case 'knowledge': return { id, type, kcItems: [{ q: '', opts: ['', ''], correct: 0, feedback: '' }] };
    case 'modal': return { id, type, heading: 'Info Tambahan', bodyHtml: '', icon: '📝' };
    case 'articulate': return { id, type, artRatio: '16:9', artLock: true, caption: '' };
    default: return { id, type: 'card', heading: '', bodyHtml: '' };
  }
}

// Pulls whatever counts as "the substance" out of a block, as plain text -
// used both to decide if a block is empty (safe to delete without asking)
// and to carry content across a type change instead of losing it.
export function extractBlockText(block: Block): string {
  switch (block.type) {
    case 'card': case 'callout': case 'definition': case 'modal':
      return block.bodyHtml || '';
    case 'pullquote':
      return block.text || '';
    case 'html':
      return block.raw || '';
    case 'badgeref':
      return block.refText || '';
    case 'image':
      return block.caption || '';
    case 'media': case 'articulate':
      return block.caption || '';
    case 'knowledge':
      return (block.kcItems || [])
        .map(it => [it.q, ...(it.opts || [])].filter(Boolean).join(' | '))
        .filter(Boolean)
        .join('\n');
    case 'ticklist':
      return (block.items || []).filter(Boolean).join('\n');
    case 'accordion':
      return (block.accItems || []).map(it => [it.h, it.b].filter(Boolean).join(': ')).filter(Boolean).join('\n');
    case 'tabs':
      return (block.tabItems || []).map(it => [it.label, it.content].filter(Boolean).join(': ')).filter(Boolean).join('\n');
    case 'timeline':
      return (block.tlItems || []).map(it => [it.title, it.desc].filter(Boolean).join(': ')).filter(Boolean).join('\n');
    case 'flow':
      return (block.steps || []).map(s => [s.title, s.detail].filter(Boolean).join(': ')).filter(Boolean).join('\n');
    case 'dtable':
      return (block.rows || []).map(r => r.join(' | ')).filter(Boolean).join('\n');
    case 'grid':
      return (block.blocks || []).map(extractBlockText).filter(Boolean).join('\n');
    default:
      return '';
  }
}

// A block with no meaningful content in it - safe to delete without asking.
export function isBlockEmpty(block: Block): boolean {
  if (block.type === 'image') return !block.src;
  if (block.type === 'grid') return !(block.blocks && block.blocks.length);
  // Media has no free text — it's "empty" only when neither an uploaded
  // video nor an embed URL has been provided.
  if (block.type === 'media') return !block.src && !block.embedUrl;
  // Sama seperti media: gak ada teks yang bisa dibaca sebagai "isi". Yang
  // bikin blok ini berarti cuma paket ZIP-nya. Tanpa cabang ini, blok yang
  // ZIP-nya UDAH keupload tetap kebaca kosong (extractBlockText balikin '')
  // dan bakal kehapus tanpa konfirmasi.
  if (block.type === 'articulate') return !block.artUrl;
  return !extractBlockText(block).trim();
}

// Drops the extracted text into whichever field is the new type's natural
// "main content" slot.
function applyBlockText(block: Block, text: string): Block {
  if (!text) return block;
  switch (block.type) {
    case 'card': case 'callout': case 'definition': case 'modal':
      return { ...block, bodyHtml: text };
    case 'pullquote':
      return { ...block, text };
    case 'html':
      return { ...block, raw: text };
    case 'badgeref':
      return { ...block, refText: text.split('\n')[0] };
    case 'image':
      return { ...block, caption: text };
    case 'media': case 'articulate':
      return { ...block, caption: text };
    case 'knowledge':
      // Carry migrated text into the first question's prompt, keeping the
      // default two empty options so it's a valid (answerable) question.
      return { ...block, kcItems: [{ q: text.split('\n')[0], opts: ['', ''], correct: 0, feedback: '' }] };
    case 'ticklist':
      return { ...block, items: text.split('\n').filter(Boolean) };
    case 'accordion':
      return { ...block, accItems: [{ h: 'a. Judul', b: text }] };
    case 'tabs':
      return { ...block, tabItems: [{ label: 'Tab 1', content: text }] };
    case 'timeline':
      return { ...block, tlItems: [{ time: '', title: '', desc: text }] };
    case 'flow':
      return { ...block, steps: [{ n: 1, title: '', detail: text }] };
    case 'dtable': {
      // Each line becomes its own row in a single column - nothing gets
      // crammed into one <input> (dtable cells are single-line fields, not
      // textareas), and it's a reasonable starting point to split into
      // real columns manually afterward.
      const lines = text.split('\n').filter(Boolean);
      return { ...block, headers: ['Kolom 1'], rows: (lines.length ? lines : ['']).map(l => [l]) };
    }
    case 'grid':
      // Grid holds nested blocks, not text - wrap the migrated text in a
      // plain Card sub-block so it isn't silently dropped; the grid still
      // starts otherwise empty for the user to add a second column to.
      return { ...block, blocks: [{ id: uid('block'), type: 'card', heading: '', bodyHtml: text }] };
    default:
      return block;
  }
}

// Switches a block's type IN PLACE (same id, same position) instead of the
// old "delete the old one, add an empty new one" workflow that silently
// threw away raw PPTX substance the user still needed to edit. Whatever
// text content the old block had gets carried into the new type's main
// content field via applyBlockText.
export function changeBlockType(block: Block, newType: BlockType): Block {
  if (block.type === newType) return block;
  const text = extractBlockText(block);
  const fresh = applyBlockText(newBlock(newType), text);
  return { ...fresh, id: block.id };
}
