#!/usr/bin/env node
// Converter SEKALI JALAN: modul-ikram/1.0 (skema JSON modul e-learning HKPD
// yang disusun di luar app ini) -> ModuleData (skema native builder "Template
// Modul Ikram", lihat app/src/types.ts).
//
// Hasilnya diimpor lewat menu "Import dari file JSON" di modal Project. Setelah
// masuk, modul jadi draft biasa — edit bloknya di editor visual, lalu Export
// HTML/SCORM pakai generator app.
//
// Pakai:
//   node tools/hkpd_to_moduledata.mjs <in.modul-ikram.json> <out.moduledata.json>
//
// Pemetaan yang LOSSY (substansi utuh, bentuk visual menyesuaikan blok app):
//   - blok `rumus`  -> pullquote (ekspresi) + dtable (daftar simbol)
//   - blok `contoh` -> card (skenario + langkah) + callout teal (hasil)
//   - blok `list` style "warn" -> callout amber
//   - blok `angka`  -> pullquote
//   - blok `catatan`-> callout violet berlabel "Catatan"
//   - Knowledge Check per-slide -> blok `knowledge` di akhir slide itu
//   - `quiz` per-section -> module.quizzes[sectionId]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error('pakai: node tools/hkpd_to_moduledata.mjs <in.json> <out.json>');
  process.exit(1);
}

const src = JSON.parse(readFileSync(inFile, 'utf8'));
if (src.schemaVersion !== 'modul-ikram/1.0') {
  console.error(`schemaVersion tak dikenal: ${src.schemaVersion} (butuh "modul-ikram/1.0")`);
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
//
// Dua konteks render di generator app (server/api/generator.py):
//  - HTML mentah (lewat nl2br, TANPA escape): bodyHtml, pullquote.text,
//    ticklist.items[], subtitle slide, KC feedbackCorrect/feedbackWrong.
//    -> pertahankan entitas (&rarr; dll), ubah **tebal** jadi <strong>.
//  - Teks polos (lewat html.escape): card.heading, definition.tag,
//    pullquote.num, dtable headers+cell, badgeref.refText, KC q & opts,
//    quiz q/opts/explain, judul & kicker slide.
//    -> decode entitas jadi karakter asli, buang penanda **.

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rarr: '→', larr: '←', harr: '↔', hellip: '…', mdash: '—', ndash: '–',
  middot: '·', bull: '•', times: '×', deg: '°', le: '≤', ge: '≥', ne: '≠',
  plusmn: '±', frac12: '½', frac14: '¼', frac34: '¾', sup2: '²', sup3: '³',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™', euro: '€',
};
function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => (name in NAMED ? NAMED[name] : m));
}

// field HTML: **x** -> <strong>x</strong>, entitas dibiarkan
const htmlField = (s) => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
// field teks polos: buang penanda **, decode entitas
const textField = (s) => decodeEntities(String(s ?? '').replace(/\*\*(.+?)\*\*/g, '$1'));

const ul = (items) => `<ul>${items.map((i) => `<li>${htmlField(i)}</li>`).join('')}</ul>`;
const ol = (items) => `<ol>${items.map((i) => `<li>${htmlField(i)}</li>`).join('')}</ol>`;

const THEME = {
  'Biru Kemenkeu': { accent: '#2e6da4', accent2: '#234f7d', onAccent: '#ffffff', navy: '#16233d' },
  'Emas Klasik': { accent: '#c99a3d', accent2: '#b3822a', onAccent: '#2a1c04', navy: '#1b2a4a' },
};
const CALLOUT_VARIANT = { info: 'blue', warn: 'amber', success: 'teal' };

function shortTitle(t) {
  const beforeParen = t.split(' (')[0].trim();
  return beforeParen.length <= 28 ? beforeParen : beforeParen.split(/\s+/).slice(0, 3).join(' ');
}
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// ---- block mapping -------------------------------------------------------

// Satu blok sumber bisa jadi 1 ATAU 2 blok app (rumus, contoh). Selalu balikin
// array. Setiap blok app wajib punya id unik.
function mapBlock(b, mkId) {
  switch (b.type) {
    case 'cover':
      return []; // ditangani di level project

    case 'p':
      return [{ id: mkId(), type: 'card', heading: '', bodyHtml: htmlField(b.text) }];

    case 'h':
      return [{ id: mkId(), type: 'card', heading: textField(b.text), bodyHtml: '' }];

    case 'def':
      return [{
        id: mkId(), type: 'definition', tag: 'DEFINISI',
        bodyHtml: `<p><strong>${htmlField(b.term)}</strong></p>${ul(b.points || [])}`,
      }];

    case 'card': {
      const body = b.body ? `<p>${htmlField(b.body)}</p>` : '';
      const list = b.items && b.items.length ? ul(b.items) : '';
      return [{ id: mkId(), type: 'card', heading: textField(b.title || ''), bodyHtml: body + list }];
    }

    case 'list':
      if (b.style === 'warn') {
        return [{ id: mkId(), type: 'callout', variant: 'amber', bodyHtml: ul(b.items || []) }];
      }
      // 'bullet' & 'check' sama-sama jadi ticklist (app merender centang).
      return [{ id: mkId(), type: 'ticklist', ordered: false, items: (b.items || []).map(htmlField) }];

    case 'callout': {
      const lead = b.title ? `<p><strong>${htmlField(b.title)}</strong></p>` : '';
      return [{
        id: mkId(), type: 'callout',
        variant: CALLOUT_VARIANT[b.variant] || 'blue',
        bodyHtml: `${lead}<p>${htmlField(b.text)}</p>`,
      }];
    }

    case 'angka':
      return [{
        id: mkId(), type: 'pullquote',
        num: textField(b.value),
        text: htmlField(b.label) + (b.note ? ` &mdash; ${htmlField(b.note)}` : ''),
      }];

    case 'rumus': {
      const out = [{ id: mkId(), type: 'pullquote', num: '', text: `<strong>${htmlField(b.expr)}</strong>` }];
      if (b.where && b.where.length) {
        out.push({
          id: mkId(), type: 'dtable',
          headers: ['Komponen', 'Keterangan'],
          rows: b.where.map(([sym, desc]) => [textField(sym), textField(desc)]),
        });
      }
      return out;
    }

    case 'tabel':
      return [{
        id: mkId(), type: 'dtable',
        headers: (b.headers || []).map(textField),
        rows: (b.rows || []).map((r) => r.map(textField)),
      }];

    case 'ref':
      return [{ id: mkId(), type: 'badgeref', refText: textField(b.text) }];

    case 'contoh': {
      const label = 'Contoh Kasus' + (b.sme ? ' — perlu verifikasi ahli materi' : '');
      const steps = b.steps && b.steps.length ? ol(b.steps) : '';
      const out = [{
        id: mkId(), type: 'card', heading: label,
        bodyHtml: `<p>${htmlField(b.scenario)}</p>${steps}`,
      }];
      if (b.hasil && b.hasil.length === 2) {
        out.push({
          id: mkId(), type: 'callout', variant: 'teal',
          bodyHtml: `<p><strong>${htmlField(b.hasil[0])}:</strong> ${htmlField(b.hasil[1])}</p>`,
        });
      }
      return out;
    }

    case 'catatan':
      return [{
        id: mkId(), type: 'callout', variant: 'violet', pill: 'Catatan',
        bodyHtml: `<p>${htmlField(b.text)}</p>`,
      }];

    default:
      // tipe tak dikenal -> simpan mentah biar tidak hilang diam-diam
      return [{ id: mkId(), type: 'html', raw: `<!-- blok tak terpetakan: ${b.type} -->\n${JSON.stringify(b, null, 2)}` }];
  }
}

function mapKnowledgeCheck(kc, mkId) {
  const correct = Math.max(0, kc.options.findIndex((o) => o.correct));
  return {
    id: mkId(), type: 'knowledge',
    kcItems: [{
      // q & opts di-escape generator (teks polos); feedback di-nl2br (HTML).
      q: textField(kc.question),
      opts: kc.options.map((o) => textField(o.text)),
      correct,
      feedbackCorrect: htmlField(kc.feedback || ''),
      feedbackWrong: htmlField(kc.feedback || ''),
      feedbackMode: 'single',
    }],
  };
}

// ---- build ModuleData -------------------------------------------------------

const theme = THEME[src.project?.theme?.colorPreset] || THEME['Biru Kemenkeu'];

let cover = null;
for (const sec of src.sections) {
  for (const sl of sec.slides || []) {
    const c = (sl.blocks || []).find((b) => b.type === 'cover');
    if (c) cover = c;
  }
}

const p = src.project || {};

// --- restrukturisasi sidebar ---------------------------------------------
// Model app: Section -> slide/bundle -> 1 kuis per section. Ketimbang 1 pajak
// = 1 section (jadi 9-11 section datar), semua pajak dimasukkan ke SATU
// section dan tiap pajak jadi BUNDLE expandable di sidebar (multiGroups).
//   Pendahuluan  |  Pajak Daerah <X> (bundle per pajak + 1 kuis)  |  Penutup
// Kuis section = ringkasan `QUIZ_PER_PAJAK` soal per pajak (default 2). KC
// per-pajak yang embedded di slide tetap jalan sebagai cek formatif.

const PER_PAJAK = Math.max(1, Number(process.env.QUIZ_PER_PAJAK) || 2);
const INTRO_SEC_ID = 'sec-intro';
const PAJAK_SEC_ID = 'sec-pajak';
const OUTRO_SEC_ID = 'sec-penutup';

const outSections = [];
const outSlides = [];
const quizzes = {};
const multiGroups = {};
let slideNo = 0; // nomor placeholder unik; renumberModule remap saat import

function emitSlide(sl, sectionId, kicker) {
  slideNo += 1;
  let n = 0;
  const mkId = () => `${sl.id}-b${++n}`;
  const blocks = (sl.blocks || []).flatMap((b) => mapBlock(b, mkId));
  if (sl.knowledgeCheck) blocks.push(mapKnowledgeCheck(sl.knowledgeCheck, mkId));
  outSlides.push({
    id: sl.id,
    number: slideNo,
    sectionId,
    title: textField(sl.title),
    kickerLabel: textField(kicker),
    ...(sl.lead ? { subtitle: htmlField(sl.lead) } : {}), // slide-sub dirender raw
    blocks,
  });
  return slideNo;
}
const contentSlides = (sec) =>
  (sec?.slides || []).filter((sl) => !(sl.blocks || []).some((b) => b.type === 'cover'));

const introSec = src.sections.find((s) => s.type === 'intro');
const pajakSecs = src.sections.filter((s) => s.type === 'pajak');
const outroSec = src.sections.find((s) => s.type === 'outro');

const pajakTitle =
  /kabupaten|kab\.?\s*\/?\s*kota/i.test(p.title || '') ? 'Pajak Daerah Kabupaten/Kota'
    : /provinsi/i.test(p.title || '') ? 'Pajak Daerah Provinsi'
      : 'Pajak Daerah';

// 1) Pendahuluan
const introSlides = contentSlides(introSec);
if (introSlides.length) {
  outSections.push({ id: INTRO_SEC_ID, title: 'Pendahuluan', short: 'Pendahuluan', icon: 'A', color: theme.navy });
  for (const sl of introSlides) emitSlide(sl, INTRO_SEC_ID, 'Pendahuluan');
}

// 2) Pajak Daerah <X> — satu section, tiap pajak jadi bundle
outSections.push({ id: PAJAK_SEC_ID, title: pajakTitle, short: shortTitle(pajakTitle), icon: 'B', color: theme.accent });
const bundles = [];
const quizPajak = [];
for (const sec of pajakSecs) {
  const label = textField(sec.title);
  const nums = contentSlides(sec).map((sl) => emitSlide(sl, PAJAK_SEC_ID, label));
  if (nums.length > 1) bundles.push({ label, slides: nums }); // bundle 1-item gak berguna
  if (sec.quiz) {
    for (const q of sec.quiz.questions.slice(0, PER_PAJAK)) {
      quizPajak.push({
        q: textField(q.question),
        opts: q.options.map((o) => textField(o.text)),
        correct: Math.max(0, q.options.findIndex((o) => o.correct)),
        explain: '',
      });
    }
  }
}
if (bundles.length) multiGroups[PAJAK_SEC_ID] = bundles;
if (quizPajak.length) quizzes[PAJAK_SEC_ID] = quizPajak;

// 3) Penutup
const outroSlides = contentSlides(outroSec);
if (outroSlides.length) {
  const t = textField(outroSec.title || 'Rangkuman');
  outSections.push({ id: OUTRO_SEC_ID, title: t, short: shortTitle(t), icon: 'C', color: theme.navy });
  for (const sl of outroSlides) emitSlide(sl, OUTRO_SEC_ID, t);
}

// ikon section = A, B, C ... sesuai urutan akhir
outSections.forEach((s, i) => { s.icon = LETTERS[i % 26]; });

const moduleData = {
  title: p.title || 'Modul',
  slug: p.slug || 'modul',
  heroTitleHtml: cover ? htmlField(cover.title) : (p.title || 'Modul'),   // __HERO_TITLE_HTML__ dirender raw
  heroDesc: cover ? htmlField(cover.desc) : (p.subtitle || ''),           // __HERO_DESC__ dirender raw
  endingTitleHtml: '',
  endingDesc: '',
  sidebarEyebrow: 'UU HKPD 2022',
  sidebarTitle: cover ? textField(cover.title) : (p.title || 'Modul'),    // di-escape generator
  coverImageDataUri: '',
  hideProgress: false,
  // Sumber menandai trackingEnabled: true — modul memang dirancang buat
  // dipantau di Command Center. Kalau env kredensial backend kosong, builder
  // akan memperingatkan sendiri (checkTrackingConfig).
  trackActivity: !!(p.metadata && p.metadata.trackingEnabled),
  showRecap: false,
  showCocreation: false,
  theme,
  graphicStyle: 'none',
  sections: outSections,
  slides: outSlides,
  quizzes,
  multiGroups,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(moduleData, null, 2) + '\n', 'utf8');

// ---- ringkasan -----------------------------------------------------------
const blockTypes = {};
for (const s of outSlides) for (const b of s.blocks) blockTypes[b.type] = (blockTypes[b.type] || 0) + 1;
console.log(JSON.stringify({
  outFile,
  slug: moduleData.slug,
  sections: outSections.length,
  slides: outSlides.length,
  quizSections: Object.keys(quizzes).length,
  quizQuestions: Object.values(quizzes).reduce((a, q) => a + q.length, 0),
  knowledgeBlocks: blockTypes.knowledge || 0,
  blockTypes,
  trackActivity: moduleData.trackActivity,
}, null, 2));
