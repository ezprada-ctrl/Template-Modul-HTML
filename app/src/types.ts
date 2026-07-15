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

let idCounter = 0;
export function uid(prefix = 'id') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
