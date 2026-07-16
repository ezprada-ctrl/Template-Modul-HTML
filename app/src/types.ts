import { DEFAULT_THEME } from './themes';

export type BlockType =
  | 'card' | 'callout' | 'definition' | 'pullquote' | 'ticklist'
  | 'accordion' | 'tabs' | 'timeline' | 'dtable' | 'flow' | 'grid' | 'image' | 'badgeref' | 'html' | 'modal';

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
  // ticklist
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
  rows?: string[][];
  // flow
  steps?: { n: number; title: string; detail: string; badge?: string }[];
  // grid
  columns?: 2 | 3;
  blocks?: Block[];
  // image
  src?: string;
  caption?: string;
  // badgeref
  refText?: string;
  // html
  raw?: string;
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
  sidebarEyebrow: string;
  sidebarTitle: string;
  coverImageDataUri: string;
  // When true, the "Progres Belajar" card (percentage + bar) never shows to
  // learners in the exported HTML — for modules that are just one part of a
  // larger series, where "100%" on this module alone would be misleading.
  hideProgress?: boolean;
  theme: { accent: string; accent2: string; onAccent: string; navy: string };
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
    sidebarEyebrow: 'Open Access',
    sidebarTitle: 'Modul Baru',
    coverImageDataUri: '',
    hideProgress: false,
    theme: { ...DEFAULT_THEME },
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
    case 'modal': return { id, type, heading: 'Info Tambahan', bodyHtml: '', icon: '📝' };
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
      return '';
    default:
      return '';
  }
}

// A block with no meaningful content in it - safe to delete without asking.
export function isBlockEmpty(block: Block): boolean {
  if (block.type === 'image') return !block.src;
  if (block.type === 'grid') return !(block.blocks && block.blocks.length);
  return !extractBlockText(block).trim();
}

// Drops the extracted text into whichever field is the new type's natural
// "main content" slot. Structural types (dtable/grid) have no reasonable
// auto-mapping and are left at their fresh default instead of guessing.
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
