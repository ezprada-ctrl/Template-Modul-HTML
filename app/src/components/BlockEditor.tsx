import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Block, BlockType, RataTeks } from '../types';
import { newBlock, changeBlockType, isBlockEmpty, extractBlockText, POPUP_BLOCK_TYPES } from '../types';
import type { KcQuestion } from '../types';
import EmojiPicker from './EmojiPicker';
import BlockAddMenu, { BLOCK_LABELS } from './BlockAddMenu';
import { uploadArticulate, deleteArticulate } from '../api';
import { uploadImageToStorage, uploadMediaToStorage } from '../api';

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  // Kalau diisi (dipakai GridFields buat ngedit sel Grid), tiap blok dikasih
  // label "Kolom N" di header-nya berdasar urutan (i % columns) - INI YANG
  // dulu pernah dicoba dijawab dengan maksa form-nya jadi CSS grid literal
  // berdampingan, tapi form blok (dropdown tipe + 3 tombol + macam-macam
  // field) didesain buat lebar penuh; dipaksa ke kolom sempit bikin header-nya
  // numpuk/kepotong. Label teks jauh lebih aman - form tetap lebar penuh
  // (mudah diisi), tapi "bakal jadi sel kolom keberapa" tetap kejawab jelas.
  columns?: 2 | 3;
  // Batasi tipe blok yang boleh ditambahkan di level ini. Dipakai isi popup
  // (Modal mode 'blok') dengan POPUP_BLOCK_TYPES. Tidak diisi = semua tipe.
  allow?: BlockType[];
  // Kata "blok" di tombol tambah & konfirmasi hapus. Grid memakai "sub-blok",
  // isi popup memakai "blok isi popup" - beda level, beda sebutan, tapi
  // konsepnya sama supaya tidak terasa seperti fitur baru.
  nounLabel?: string;
}

const BLOCK_CARD_STYLES = `
/* Tampilan dasar kartu blok ditaruh di sini, BUKAN di style inline: aturan
   .is-active di bawah perlu menimpa latar & tepinya, dan style inline selalu
   menang atas kelas CSS. */
.block-card{
  position:relative;
  border:1px solid var(--border);
  border-radius:var(--radius-sm);
  padding:11px;
  background:var(--surface-2);
  transition:background var(--ease),border-color var(--ease),box-shadow var(--ease);
}

/* Blok yang lagi digarap.

   Kotak besar .slide-workspace sudah membingkai SELURUH slide, tapi di
   dalamnya bisa ada belasan blok yang bentuknya sama persis. Begitu banyak,
   batas antar blok jadi kabur: waktu mengetik di satu field, gak ada yang
   memberi tahu sampai mana blok itu dan dari mana blok tetangganya mulai.

   Blok yang barusan disentuh diangkat: latarnya jadi terang (lawan
   --surface-2 milik blok diam), tepinya menguat, plus pita tegak di sisi
   kiri yang memberi batas atas-bawah blok itu dalam satu tarikan mata.
   Yang lain sengaja TIDAK diredupkan — masih sering dibaca sebagai rujukan
   waktu mengedit blok sebelahnya. */
.block-card.is-active{
  background:var(--surface);
  border-color:var(--edit);
  box-shadow:0 0 0 3px var(--edit-soft);
}
.block-card.is-active::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  border-radius:var(--radius-sm) 0 0 var(--radius-sm);
  background:var(--edit);
}
.block-card-aktif{
  font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  color:#fff;background:var(--edit);
  padding:1px 7px;border-radius:999px;white-space:nowrap;flex-shrink:0;
}

/* The whole workspace (kicker, subjudul, every block - including ones added
   later, since they're all inside this same container) is framed as one
   unit the moment the slide is expanded, not just whichever single field
   happens to have the cursor. Unconditional (not gated behind a focus
   listener) because Canvas.tsx only ever has ONE slide expanded at a time
   (openSlideId) - this div only exists in the DOM while that slide is open,
   so there's no other open workspace it could be confused with. */
.slide-workspace{box-shadow: 0 0 0 2px var(--ink); background: var(--surface-2); border-radius: var(--radius-sm);}
`;

// Ringkasan satu baris buat header blok pas lagi collapsed - biar keliatan
// "blok mana ini" tanpa harus buka. heading (card/modal) didahulukan karena
// paling identik ketimbang isi body; sisanya pakai extractBlockText yang
// sudah generik per tipe (dipakai juga buat isBlockEmpty & migrasi tipe).
function blockSummary(block: Block): string {
  const raw = [block.heading, extractBlockText(block)].filter(Boolean).join(' — ');
  const flat = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  return flat.length > 70 ? flat.slice(0, 70) + '…' : flat;
}

// Blok yang lagi disentuh, diumumkan ke panel preview supaya preview-nya ikut
// menggulir ke blok itu (lihat SlidePreview.tsx).
//
// Nilai bersama satu tab, BUKAN prop yang dioper: editor blok bersarang
// sedalam apa pun - sub-blok di Grid, blok di dalam popup - sama-sama perlu
// mengumumkan hal ini, dan mengoper callback lewat GridFields & ModalFields
// cuma buat diteruskan lagi bikin dua komponen itu ikut tahu soal panel
// preview, padahal mereka gak ada urusannya. Aman dipakai bersama karena yang
// "lagi diedit" memang cuma pernah ada satu di seluruh aplikasi.
// Pola yang sama sudah dipakai devModeDipilihPenyusun di SlidePreview.tsx.
const pendengarBlokAktif = new Set<(id: string) => void>();
export function langgananBlokAktif(fn: (id: string) => void) {
  pendengarBlokAktif.add(fn);
  return () => { pendengarBlokAktif.delete(fn); };
}

export default function BlockEditor({ blocks, onChange, columns, allow, nounLabel }: Props) {
  // `columns` is ONLY ever passed by GridFields (top-level callers in
  // Canvas.tsx/CoverForm.tsx never set it) - reused here as the "am I
  // nested inside a Grid" signal instead of adding a second prop that
  // would just duplicate it. Nested blocks get called "sub-blok" in the
  // UI so they read as distinct from top-level blocks, not a new concept -
  // same data shape, same editor, just which level you're adding to.
  // `nested` sekarang juga menyala buat isi popup (yang tidak punya
  // `columns`), jadi patokannya bukan lagi cuma Grid. `noun` yang dipakai
  // di semua teks UI supaya sebutannya cocok dengan levelnya.
  const nested = columns !== undefined || nounLabel !== undefined;
  const noun = nounLabel ?? (columns !== undefined ? 'sub-blok' : 'blok');
  const nounCap = noun.charAt(0).toUpperCase() + noun.slice(1);
  // Blok yang terakhir disentuh — penanda "kamu lagi di sini". Sengaja gak
  // dikosongkan waktu fokus keluar: kalau dihapus tiap blur, penandanya
  // berkedip-kedip waktu pindah antar field DI DALAM blok yang sama, dan
  // hilang persis waktu orangnya menoleh ke panel preview. Yang berpindah
  // cuma kalau blok LAIN disentuh.
  const [blokAktif, setBlokAktif] = useState<string | null>(null);
  // Satu pintu buat menandai blok aktif: state lokal (buat penanda "sedang
  // diedit" di kartu) DAN pengumuman ke panel preview selalu jalan bareng,
  // jadi gak mungkin salah satunya kelupaan waktu ada pemicu baru.
  function tandaiAktif(id: string) {
    setBlokAktif(id);
    pendengarBlokAktif.forEach(fn => fn(id));
  }
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function update(i: number, patch: Partial<Block>) {
    const next = [...blocks];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    if (!isBlockEmpty(blocks[i]) && !confirm(`${nounCap} ini masih ada isinya, yakin mau dihapus?`)) return;
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function changeType(i: number, newType: BlockType) {
    const next = [...blocks];
    next[i] = changeBlockType(next[i], newType);
    onChange(next);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add(type: BlockType) {
    onChange([...blocks, newBlock(type)]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{BLOCK_CARD_STYLES}</style>
      {blocks.map((b, i) => {
        const isCollapsed = collapsed.has(b.id);
        const summary = isCollapsed ? blockSummary(b) : '';
        return (
          <div
            key={b.id}
            className={`block-card${blokAktif === b.id ? ' is-active' : ''}`}
            // Capture, bukan bubble biasa: fokus di elemen sedalam apa pun di
            // dalam blok (termasuk sub-blok Grid) tetap terbaca sebagai
            // "blok ini yang lagi digarap". onMouseDown melengkapi buat area
            // yang gak bisa difokus, mis. mengklik latar kartunya sendiri.
            onFocusCapture={() => tandaiAktif(b.id)}
            onMouseDown={() => tandaiAktif(b.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: isCollapsed ? 0 : 8, flexWrap: 'wrap' }}>
              {/* flexWrap: label "sedang diedit" dan nama tipe blok sama-sama
                  gak boleh menyusut (keduanya flex-shrink:0), jadi di kartu
                  sempit barisnya meluap keluar tepi kartu kalau gak boleh
                  turun ke baris berikutnya. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
                <button
                  className="btn-icon btn-sm"
                  title={isCollapsed ? `Buka ${noun} ini` : `Tutup ${noun} ini`}
                  onClick={() => toggleCollapse(b.id)}
                  style={{ flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform var(--ease)' }}
                >▾</button>
                {columns && (
                  <span title="Sel ini nempatin kolom keberapa di grid - urutan blok di bawah = urutan ngisi kolom dari kiri ke kanan"
                    style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', border: '1px solid var(--border-strong)',
                      borderRadius: 999, padding: '1px 7px', flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                    Kolom {(i % columns) + 1}
                  </span>
                )}
                {/* Dulu <select> bawaan. Diganti picker yang SAMA PERSIS
                    dengan "+ Tambah blok…" supaya pratinjau tiap jenis blok
                    ikut muncul di sini: memilih tipe pengganti tanpa lihat
                    bentuknya itu justru saat pratinjau paling dibutuhkan -
                    orangnya lagi menimbang bentuk lain, bukan sekadar
                    menambah blok kosong.
                    <select> bawaan gak bisa dipakai buat ini: isi <option>
                    cuma boleh teks, gak bisa memuat kartu pratinjau. */}
                <BlockAddMenu
                  onAdd={type => changeType(i, type)}
                  label={BLOCK_LABELS[b.type]}
                  active={b.type}
                  title={`Ganti tipe ${noun} ini - isi teksnya dipindahkan otomatis ke tipe baru, gak hilang`}
                  triggerClass="pemicu-tipe-blok"
                  triggerStyle={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                />
                {blokAktif === b.id && (
                  <span className="block-card-aktif" title="Blok inilah yang lagi kamu kerjakan">
                    sedang diedit
                  </span>
                )}
                {summary && (
                  <span style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {summary}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn-icon btn-sm" title="Naik" onClick={() => move(i, -1)}>↑</button>
                <button className="btn-icon btn-sm" title="Turun" onClick={() => move(i, 1)}>↓</button>
                <button className="btn-danger btn-sm" onClick={() => remove(i)}>Hapus</button>
              </div>
            </div>
            {!isCollapsed && <BlockFields block={b} onChange={patch => update(i, patch)} />}
          </div>
        );
      })}
      <BlockAddMenu onAdd={add} allow={allow} label={nested ? `+ Tambah ${noun}…` : undefined} />
    </div>
  );
}

// <textarea> untuk field yang isinya HTML mentah (bodyHtml, pullquote.text, isi
// accordion/tab, detail flow, feedback KC, dll — semua dirender lewat nl2br
// TANPA escape di generator.py). Ctrl/Cmd+B membungkus teks terpilih dengan
// <strong>…</strong>, Ctrl/Cmd+I dengan <em>…</em> — toggle: kalau yang terpilih
// PERSIS sudah terbungkus tag itu, tag-nya dilepas. Biar user gak perlu ngetik
// tag sendiri. Selain shortcut, ini textarea biasa.
// Pembungkus tag dipakai bareng <textarea> dan <input>: keduanya sama-sama
// punya selectionStart/End, jadi logikanya identik - yang beda cuma elemennya.
// Dipisah ke sini supaya field satu baris yang isinya JUGA dirender mentah
// (mis. item Daftar Bercentang: render_ticklist bikin <li>{item}</li> tanpa
// escape) ikut kebagian shortcut, bukan cuma textarea.
function pembungkusTag(value: string, onChange: (v: string) => void) {
  function toggleWrap(el: HTMLTextAreaElement | HTMLInputElement, tag: 'strong' | 'em') {
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const sel = value.slice(s, e);
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    let next: string;
    let a: number;
    let b: number;
    if (sel.length >= open.length + close.length && sel.startsWith(open) && sel.endsWith(close)) {
      const inner = sel.slice(open.length, sel.length - close.length);
      next = value.slice(0, s) + inner + value.slice(e);
      a = s;
      b = s + inner.length;
    } else {
      next = value.slice(0, s) + open + sel + close + value.slice(e);
      a = s + open.length;
      b = a + sel.length;
    }
    onChange(next);
    // Kembalikan seleksi ke potongan teks yang sama setelah React re-render.
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a, b); });
  }
  return (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.altKey || !(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); toggleWrap(e.currentTarget, 'strong'); }
    else if (k === 'i') { e.preventDefault(); toggleWrap(e.currentTarget, 'em'); }
  };
}

// Enter di baris berpenanda melanjutkan daftarnya; Enter lagi di item yang
// masih kosong membuang penandanya (itu cara keluar dari daftar). Perilaku yang
// sama seperti Notion/Word.
//
// Nol elemen UI baru - dan itu memang inti permintaannya: bikin bullet TANPA
// harus melihat kode. Tombol yang menyisipkan <ul><li> ke textarea tidak
// menyelesaikan itu, karena kodenya tetap terpampang di kotak edit.
//
// Penanda & pemisahnya ditangkap terpisah supaya baris baru mewarisi indent,
// jenis penanda, dan lebar spasi yang persis sama - daftar bernomor lanjut ke
// angka berikutnya.
const PENANDA_DAFTAR = /^([ \t]*)([-*\u2022]|(\d+)([.)]))([ \t]+)(.*)$/;

function lanjutkanDaftar(value: string, onChange: (v: string) => void) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.currentTarget;
    const s = el.selectionStart ?? 0;
    const t = el.selectionEnd ?? 0;
    // Ada teks terpilih = penyusun sedang mengganti sesuatu, bukan menambah
    // item. Biarkan Enter berperilaku biasa.
    if (s !== t) return;
    const awal = value.lastIndexOf('\n', s - 1) + 1;
    const m = PENANDA_DAFTAR.exec(value.slice(awal, s));
    if (!m) return;
    const [, indent, penanda, angka, titik, spasi, isi] = m;
    e.preventDefault();
    let next: string;
    let pos: number;
    if (!isi.trim()) {
      // Item kosong: buang seluruh penandanya, jangan tambah baris baru.
      next = value.slice(0, awal) + value.slice(s);
      pos = awal;
    } else {
      const berikut = angka ? `${Number(angka) + 1}${titik}` : penanda;
      const sisip = `\n${indent}${berikut}${spasi}`;
      next = value.slice(0, s) + sisip + value.slice(t);
      pos = s + sisip.length;
    }
    onChange(next);
    // Setelah React re-render, caret harus kembali ke tempat yang benar -
    // kalau tidak, dia melompat ke ujung teks tiap kali Enter ditekan.
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  };
}

const JUDUL_SHORTCUT = 'Ctrl+B: tebal (<strong>) · Ctrl+I: miring (<em>)';

function RichTextarea({ value, onChange, style, placeholder, daftar }: {
  value: string;
  onChange: (v: string) => void;
  style?: CSSProperties;
  placeholder?: string;
  // Nyalakan Enter-lanjut-daftar. Opt-in, bukan bawaan: field yang isinya
  // BUKAN alinea bebas (mis. satu item Accordion) gak boleh tiba-tiba
  // menambah penanda sendiri waktu penyusun menekan Enter.
  daftar?: boolean;
}) {
  const bungkus = pembungkusTag(value, onChange);
  const lanjut = lanjutkanDaftar(value, onChange);
  return (
    <textarea
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (daftar) { lanjut(e); if (e.defaultPrevented) return; }
        bungkus(e);
      }}
      title={daftar ? JUDUL_SHORTCUT + ' · awali baris dengan "- " untuk bullet, "1. " untuk bernomor' : JUDUL_SHORTCUT}
    />
  );
}

// Versi satu baris. HANYA buat field yang isinya dirender MENTAH di
// generator.py - kalau field-nya lewat esc() (mis. judul daftar, judul kartu),
// tag hasil shortcut malah muncul sebagai teks apa adanya di modul.
function RichInput({ value, onChange, style, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  style?: CSSProperties;
  placeholder?: string;
}) {
  return (
    <input
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={pembungkusTag(value, onChange)}
      title={JUDUL_SHORTCUT}
    />
  );
}

// Sakelar pilihan-berjejer. Dipakai bareng mode isi Modal Popup ("Tulis
// bebas"/"Pakai blok lain") dan penanda item Accordion (nomor/simbol/polos),
// jadi satu tempat - alasan yang sama dengan JudulOpsional di bawah: dua
// sakelar yang kelihatannya sama gak boleh pelan-pelan beda sendiri.
const segBtn = (aktif: boolean): CSSProperties => ({
  flex: 1, padding: '7px 10px', fontSize: 12, fontWeight: aktif ? 700 : 500,
  border: '1px solid ' + (aktif ? 'var(--ink)' : 'var(--border)'),
  background: aktif ? 'var(--surface)' : 'transparent',
  color: aktif ? 'var(--text)' : 'var(--text-dim)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
});

// Judul opsional + simbol opsional, dipakai bareng Daftar Bercentang & Tabs
// (dirender _blok_heading di generator.py). Satu komponen buat dua blok
// supaya formnya gak pelan-pelan beda sendiri - persis alasan .tick-heading
// dan .tabs-heading digabung jadi satu aturan CSS.
//
// Judulnya <input> polos, BUKAN RichInput: generator meng-esc field ini
// (sama seperti judul Kartu), jadi kalau dikasih shortcut Ctrl+B tag
// <strong>-nya malah nongol mentah sebagai teks di modul.
//
// Simbolnya sengaja cuma tampil kalau judulnya sudah diisi - di render,
// simbol nempel pada judul, jadi simbol tanpa judul gak akan kelihatan
// di modul dan cuma bikin bingung kalau dibiarkan bisa dipilih.
function JudulOpsional({ block, onChange, inp, label }: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
  inp: CSSProperties;
  label: string;
}) {
  return (
    <>
      <input
        style={inp}
        placeholder={label}
        value={block.heading || ''}
        onChange={e => onChange({ heading: e.target.value })}
      />
      {block.heading ? (
        <EmojiPicker
          value={block.icon || ''}
          onChange={icon => onChange({ icon })}
          placeholder="Simbol di depan judul (opsional)"
        />
      ) : null}
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
        Kosongkan kalau gak perlu judul.
      </p>
    </>
  );
}

function BlockFields({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  const ta = { width: '100%', minHeight: 60, fontFamily: 'inherit', fontSize: 13, resize: 'vertical' as const };
  const inp = { width: '100%', fontSize: 13, marginBottom: 4 };

  switch (block.type) {
    case 'card':
      return <>
        <EmojiPicker value={block.icon || ''} onChange={icon => onChange({ icon })} />
        <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
          Icon cuma muncul kalau Judul kartu diisi.
        </p>
        <input style={inp} placeholder="Judul kartu" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <RichTextarea style={ta} daftar
                      placeholder={'Isi kartu\n\nAwali baris dengan "- " untuk bullet, "1. " untuk bernomor'}
                      value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
      </>;
    case 'callout':
      return <>
        <select style={inp} value={block.variant} onChange={e => onChange({ variant: e.target.value as any })}>
          {['amber', 'rose', 'blue', 'violet', 'teal'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <input style={inp} placeholder="Badge singkat (opsional, mis. angka/huruf)" value={block.badge || ''} onChange={e => onChange({ badge: e.target.value })} />
        <EmojiPicker value={block.icon || ''} onChange={icon => onChange({ icon })} placeholder="Atau pakai icon simbol (opsional, dipakai kalau badge kosong)" />
        <RichTextarea style={ta} placeholder="Isi catatan" value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
      </>;
    case 'definition':
      return <>
        <input style={inp} placeholder="Label singkat (mis. DEFINISI) - bukan tempat isi definisinya" value={block.tag || ''} onChange={e => onChange({ tag: e.target.value })} />
        <RichTextarea style={ta} placeholder="Isi definisi (kalimat lengkapnya taruh di sini)" value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
      </>;
    case 'pullquote':
      return <>
        <input style={inp} placeholder="Angka/kata besar" value={block.num || ''} onChange={e => onChange({ num: e.target.value })} />
        <RichTextarea style={ta} placeholder="Teks penjelas" value={block.text || ''} onChange={v => onChange({ text: v })} />
      </>;
    case 'ticklist':
      return <>
        <JudulOpsional block={block} onChange={onChange} inp={inp} label="Judul daftar (opsional)" />

        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!block.ordered} onChange={e => onChange({ ordered: e.target.checked })} />
          bernomor
        </label>
        {(block.items || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 4 }}>
            <RichInput style={inp} value={item} onChange={v => {
              const items = [...(block.items || [])]; items[i] = v; onChange({ items });
            }} />
            <button onClick={() => onChange({ items: (block.items || []).filter((_, x) => x !== i) })}>×</button>
          </div>
        ))}
        <button onClick={() => onChange({ items: [...(block.items || []), ''] })}>+ item</button>
      </>;
    case 'accordion': {
      // Kosong = 'nomor', sama seperti yang dibaca render_accordion - jadi
      // blok lama yang belum punya field ini kebaca sebagai mode lamanya.
      const badge = block.accBadge || 'nomor';
      return <>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '0 0 4px' }}>
          Penanda tiap item
        </label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <button type="button" style={segBtn(badge === 'nomor')} onClick={() => onChange({ accBadge: 'nomor' })}>
            Nomor urut
          </button>
          <button type="button" style={segBtn(badge === 'simbol')} onClick={() => onChange({ accBadge: 'simbol' })}>
            Simbol
          </button>
          <button type="button" style={segBtn(badge === 'polos')} onClick={() => onChange({ accBadge: 'polos' })}>
            Polos
          </button>
        </div>
        <p className="hint" style={{ fontSize: 11, margin: '0 0 8px' }}>
          {badge === 'nomor'
            ? 'Dinomori otomatis. Kalau judulnya diketik berawalan “a. ”, huruf itu yang dipakai dan dibuang dari judulnya.'
            : badge === 'simbol'
              ? 'Pilih simbol sendiri tiap item. Item yang simbolnya dikosongkan tampil polos.'
              : 'Tanpa penanda — langsung judulnya saja.'}
        </p>
        {(block.accItems || []).map((it, i) => (
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
            {badge === 'simbol' && (
              <EmojiPicker
                value={it.icon || ''}
                onChange={icon => {
                  const accItems = [...(block.accItems || [])]; accItems[i] = { ...it, icon }; onChange({ accItems });
                }}
                placeholder="Simbol item ini (opsional)"
              />
            )}
            {/* Contoh di placeholder ikut mode: awalan "a. " cuma berarti di
                mode nomor - di mode lain dia gak dibuang, jadi menyarankannya
                cuma bikin penyusun ngetik huruf yang gak dia maksud. */}
            <input style={inp} placeholder={badge === 'nomor' ? 'a. Judul' : 'Judul'} value={it.h} onChange={e => {
              const accItems = [...(block.accItems || [])]; accItems[i] = { ...it, h: e.target.value }; onChange({ accItems });
            }} />
            <RichTextarea style={ta} placeholder="Isi" value={it.b} onChange={v => {
              const accItems = [...(block.accItems || [])]; accItems[i] = { ...it, b: v }; onChange({ accItems });
            }} />
            <button onClick={() => onChange({ accItems: (block.accItems || []).filter((_, x) => x !== i) })}>Hapus item</button>
          </div>
        ))}
        <button onClick={() => onChange({ accItems: [...(block.accItems || []), { h: '', b: '' }] })}>+ item accordion</button>
      </>;
    }
    case 'tabs':
      return <>
        <JudulOpsional block={block} onChange={onChange} inp={inp} label="Judul tabs (opsional)" />
        {(block.tabItems || []).map((it, i) => (
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
            <input style={inp} placeholder="Label tab" value={it.label} onChange={e => {
              const tabItems = [...(block.tabItems || [])]; tabItems[i] = { ...it, label: e.target.value }; onChange({ tabItems });
            }} />
            <RichTextarea style={ta} placeholder="Isi tab" value={it.content} onChange={v => {
              const tabItems = [...(block.tabItems || [])]; tabItems[i] = { ...it, content: v }; onChange({ tabItems });
            }} />
            <button onClick={() => onChange({ tabItems: (block.tabItems || []).filter((_, x) => x !== i) })}>Hapus tab</button>
          </div>
        ))}
        <button onClick={() => onChange({ tabItems: [...(block.tabItems || []), { label: '', content: '' }] })}>+ tab</button>
      </>;
    case 'timeline':
      return <>
        {(block.tlItems || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <input style={{ ...inp, width: 90 }} placeholder="Waktu" value={it.time} onChange={e => {
              const tlItems = [...(block.tlItems || [])]; tlItems[i] = { ...it, time: e.target.value }; onChange({ tlItems });
            }} />
            <input style={inp} placeholder="Judul" value={it.title} onChange={e => {
              const tlItems = [...(block.tlItems || [])]; tlItems[i] = { ...it, title: e.target.value }; onChange({ tlItems });
            }} />
            <input style={inp} placeholder="Deskripsi" value={it.desc} onChange={e => {
              const tlItems = [...(block.tlItems || [])]; tlItems[i] = { ...it, desc: e.target.value }; onChange({ tlItems });
            }} />
            <button onClick={() => onChange({ tlItems: (block.tlItems || []).filter((_, x) => x !== i) })}>×</button>
          </div>
        ))}
        <button onClick={() => onChange({ tlItems: [...(block.tlItems || []), { time: '', title: '', desc: '' }] })}>+ tahap</button>
      </>;
    case 'dtable':
      return <DtableFields block={block} onChange={onChange} inp={inp} />;
    case 'flow':
      return <>
        {(block.steps || []).map((s, i) => (
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
            <input style={inp} placeholder="Judul langkah" value={s.title} onChange={e => {
              const steps = [...(block.steps || [])]; steps[i] = { ...s, title: e.target.value }; onChange({ steps });
            }} />
            <RichTextarea style={ta} placeholder="Detail langkah" value={s.detail} onChange={v => {
              const steps = [...(block.steps || [])]; steps[i] = { ...s, detail: v }; onChange({ steps });
            }} />
            <button onClick={() => onChange({ steps: (block.steps || []).filter((_, x) => x !== i) })}>Hapus langkah</button>
          </div>
        ))}
        <button onClick={() => onChange({ steps: [...(block.steps || []), { n: (block.steps?.length || 0) + 1, title: '', detail: '' }] })}>+ langkah</button>
      </>;
    case 'grid':
      return <GridFields block={block} onChange={onChange} />;
    case 'image':
      return <ImageFields block={block} onChange={onChange} inp={inp} />;
    case 'badgeref':
      return <input style={inp} placeholder="Teks badge (mis. Pasal 4 · PMK 15/2025)" value={block.refText || ''} onChange={e => onChange({ refText: e.target.value })} />;
    case 'html':
      return <RichTextarea style={ta} placeholder="HTML bebas" value={block.raw || ''} onChange={v => onChange({ raw: v })} />;
    case 'media':
      return <MediaFields block={block} onChange={onChange} inp={inp} />;
    case 'knowledge':
      return <KnowledgeFields block={block} onChange={onChange} inp={inp} ta={ta} />;
    case 'articulate':
      return <ArticulateFields block={block} onChange={onChange} inp={inp} />;
    case 'modal':
      return <ModalFields block={block} onChange={onChange} inp={inp} ta={ta} />;
    default:
      return null;
  }
}

// Deteksi apakah PNG punya area transparan cukup luas (bukan cuma anti-alias
// tepi) - dipakai buat auto-nyalain mode "bersih/karakter". Gambar diperkecil
// ke <=120px dulu biar scan-nya ringan; JPEG/gambar non-PNG langsung false
// (gak mungkin transparan). Kalau canvas gagal (mis. ketaint), aman -> false.
//
// Satu-satunya jalur kode yang beda antara PNG dan JPEG - JPEG selalu resolve
// instan di baris pertama, PNG lewat decode+canvas penuh. Dibungkus timeout
// 5 detik: kalau img.onload/onerror gak pernah kepanggil (PNG aneh/besar yang
// bikin decode-nya nyangkut di browser tertentu), pemanggil (ImageUploadField)
// gak boleh ikut nyangkut selamanya nunggu janji yang gak pernah selesai.
async function detectPngTransparency(file: File): Promise<boolean> {
  if (file.type !== 'image/png') return false;
  const detect = new Promise<boolean>(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve(false); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let transparent = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] < 240) transparent++;
        resolve(transparent > w * h * 0.03);
      } catch {
        resolve(false);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
  const timeout = new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000));
  return Promise.race([detect, timeout]);
}

function ImageUploadField({ value, onUploaded }: { value: string; onUploaded: (url: string, transparent: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div style={{ marginBottom: 6 }}>
      {value && <img src={value} style={{ width: 120, display: 'block', marginBottom: 4, borderRadius: 4 }} />}
      <input type="file" accept="image/*" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true); setErr('');
        try {
          // Upload + deteksi transparansi, BARU panggil onUploaded SEKALI di
          // akhir dengan keduanya sekaligus. Dulu ini dua panggilan onChange
          // terpisah (onChange(url) lalu onDetect(bool) belakangan) - berarti
          // dua-duanya numpang di closure `update()` milik BlockEditor yang
          // SAMA dari render yang SAMA (async function yang lagi jalan gak
          // "nyegerin" closure-nya sendiri di tengah jalan walau React
          // sempat re-render di antaranya). Panggilan KEDUA nge-merge patch-
          // nya ke snapshot block versi LAMA (dari sebelum src ke-set oleh
          // panggilan pertama) dan nimpa balik src jadi kosong lagi - PERSIS
          // bug "PNG transparan gagal total tanpa notif, JPEG selalu jalan"
          // (JPEG gak pernah punya panggilan kedua sama sekali; deteksi
          // transparansinya langsung false di baris pertama detectPngTransparency,
          // jadi jalur ini gak pernah kesentuh). Satu panggilan onUploaded,
          // satu patch gabungan, satu update() - gak ada lagi race-nya.
          const [url, transparent] = await Promise.all([
            uploadImageToStorage(file),
            detectPngTransparency(file),
          ]);
          onUploaded(url, transparent);
        } catch (ex: any) {
          setErr(ex?.message || 'Gagal upload gambar');
        } finally {
          setBusy(false);
        }
      }} />
      {busy && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>mengunggah…</span>}
      {err && <p style={{ fontSize: 11, color: 'var(--danger, #c0392b)', margin: '4px 0 0' }}>{err}</p>}
    </div>
  );
}

function ImageFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  const clean = !!block.imgClean;
  const width = block.imgWidth ?? 100;
  const floatSide = block.imgFloat && block.imgFloat !== 'none' ? block.imgFloat : 'none';
  const align = block.imgAlign || 'center';
  const layout = floatSide === 'none' ? 'block' : `float-${floatSide}`;
  return (
    <>
      <ImageUploadField
        value={block.src || ''}
        // PNG transparan -> auto mode bersih. Sengaja cuma nge-SET true (gak
        // nge-unset): kalau tim override manual, upload ulang gambar opaque
        // gak nabrak pilihannya. Satu patch gabungan, satu onChange - lihat
        // catatan di ImageUploadField soal kenapa ini gak boleh dipecah jadi
        // dua panggilan onChange terpisah.
        onUploaded={(src, transparent) => onChange(transparent ? { src, imgClean: true } : { src })}
      />
      <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />

      <label style={lbl}>Tampilan</label>
      <select style={inp} value={clean ? 'clean' : 'card'} onChange={e => onChange({ imgClean: e.target.value === 'clean' })}>
        <option value="card">Dengan kotak (gambar biasa)</option>
        <option value="clean">Bersih / karakter (tanpa kotak) — buat PNG transparan</option>
      </select>

      <label style={lbl}>Ukuran ({width}%)</label>
      <input type="range" min={10} max={100} step={5} value={width}
        onChange={e => onChange({ imgWidth: parseInt(e.target.value, 10) })}
        style={{ width: '100%', marginBottom: 4 }} />

      <label style={lbl}>Tata letak</label>
      <select style={inp} value={layout} onChange={e => {
        const v = e.target.value;
        onChange({ imgFloat: v === 'block' ? 'none' : (v === 'float-left' ? 'left' : 'right') });
      }}>
        <option value="block">Sendiri (di atas/bawah teks)</option>
        <option value="float-left">Dampingi teks — karakter di KIRI</option>
        <option value="float-right">Dampingi teks — karakter di KANAN</option>
      </select>

      {layout === 'block' && (
        <>
          <label style={lbl}>Posisi horizontal</label>
          <select style={inp} value={align} onChange={e => onChange({ imgAlign: e.target.value as 'left' | 'center' | 'right' })}>
            <option value="left">Kiri</option>
            <option value="center">Tengah</option>
            <option value="right">Kanan</option>
          </select>
        </>
      )}

      <p className="hint" style={{ fontSize: 11, margin: '4px 0 0' }}>
        "Dampingi teks" bikin gambar dan materi berdampingan.
      </p>
    </>
  );
}

// Grid cuma wadah - selnya sendiri adalah blok biasa (Kartu dkk) yang mengalir
// otomatis ke N kolom (lihat render_grid di generator.py). Pakai lagi
// BlockEditor secara rekursif buat ngedit isinya, bukan bikin UI field baru -
// setiap tipe blok yang udah ada (termasuk Grid lagi, kalau mau) otomatis
// bisa ditaruh di dalam sel tanpa kerja tambahan.
// Blok Modal punya DUA cara mengisi popup, dipilih lewat sakelar di bawah:
//   'teks' - judul + isi bebas + gambar opsional (perilaku lama, tetap bawaan)
//   'blok' - isi popup disusun dari blok lain, dirender dengan gaya blok itu
//            sendiri. Yang boleh dipakai dibatasi POPUP_BLOCK_TYPES; alasan
//            tiap pengecualian ada di konstanta itu (types.ts).
// Judul & ikon SELALU tampil di form karena keduanya milik TOMBOL pemicunya,
// bukan isi popup - tombol tetap butuh label di mode mana pun.
function ModalFields({ block, onChange, inp, ta }: {
  block: Block; onChange: (p: Partial<Block>) => void; inp: CSSProperties; ta: CSSProperties;
}) {
  const mode = block.modalMode === 'blok' ? 'blok' : 'teks';
  return (
    <>
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 6px' }}>
        Detail tambahan; muncul jadi tombol, isinya kelihatan setelah diklik.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <button type="button" style={segBtn(mode === 'teks')} onClick={() => onChange({ modalMode: 'teks' })}>
          Tulis bebas
        </button>
        <button type="button" style={segBtn(mode === 'blok')} onClick={() => onChange({ modalMode: 'blok' })}>
          Pakai blok lain
        </button>
      </div>
      <p className="hint" style={{ fontSize: 11, margin: '0 0 8px' }}>
        {mode === 'teks'
          ? 'Isi popup diketik sendiri di sini, boleh HTML.'
          : 'Isi popup disusun dari blok yang sudah ada — tampil dengan gaya blok itu sendiri.'}
      </p>
      <EmojiPicker value={block.icon || '📝'} onChange={icon => onChange({ icon })} />
      <input style={inp} placeholder="Judul tombol & popup (mis. Rincian Tambahan)" value={block.heading || ''}
        onChange={e => onChange({ heading: e.target.value })} />

      {mode === 'teks' ? (
        <>
          <RichTextarea style={{ ...ta, minHeight: 120 }} placeholder="Isi popup (HTML/teks, boleh tabel dtable dll)"
            value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
          {/* Gambar OPSIONAL di dalam popup. Dua-duanya boleh diisi sekaligus:
              gambar tampil di atas, teks di bawahnya — pola yang biasa dipakai
              buat bagan/diagram plus penjelasannya. Isi salah satu saja juga
              sah: popup teks saja, atau popup gambar saja. */}
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' }}>
            Gambar di dalam popup (opsional)
          </label>
          <ImageUploadField value={block.src || ''} onUploaded={src => onChange({ src })} />
          {block.src && (
            <button className="btn-sm btn-danger" style={{ marginBottom: 6 }}
              onClick={() => onChange({ src: '' })}>Hapus gambar</button>
          )}
        </>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-dim)', margin: '8px 0 6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!block.modalHideTitle}
              onChange={e => onChange({ modalHideTitle: !e.target.checked })} />
            <span>Tampilkan judul di dalam popup</span>
          </label>
          <p className="hint" style={{ fontSize: 11, margin: '0 0 8px' }}>
            Dimatikan = popup langsung menampilkan bloknya saja; judul tetap ada di tombol pemicunya.
          </p>
          <BlockEditor
            blocks={block.blocks || []}
            onChange={blocks => onChange({ blocks })}
            allow={POPUP_BLOCK_TYPES}
            nounLabel="blok isi popup"
          />
        </>
      )}
    </>
  );
}

function GridFields({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  const columns = (block.columns as 2 | 3) || 2;
  return (
    <>
      <label style={lbl}>Jumlah kolom</label>
      <select style={{ width: '100%', fontSize: 13, marginBottom: 8 }} value={columns}
        onChange={e => onChange({ columns: parseInt(e.target.value, 10) as 2 | 3 })}>
        <option value={2}>2 kolom</option>
        <option value={3}>3 kolom</option>
      </select>
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
        Susunan di bawah persis seperti hasil akhirnya.
      </p>
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
        Tiap sel bisa diisi blok apa pun, boleh dicampur.
      </p>
      <GridCellPreview blocks={block.blocks || []} columns={columns} />
      <BlockEditor blocks={block.blocks || []} onChange={blocks => onChange({ blocks })} columns={columns} />
    </>
  );
}

// Mini-canvas visual - dipasang LANGSUNG di panel Susun Modul (bukan cuma
// keliatan pas buka tab Preview & Export), dan pakai rumus lebar+wrap PERSIS
// sama kayak .grid2/.grid3 di shell-template.html (flex-wrap + justify-
// content:center) - biar begitu diketik di form di bawah, kotaknya di sini
// LANGSUNG kelihatan tersusun menyamping & baris sisa otomatis center, sama
// persis perilaku modul jadinya, bukan cuma direpresentasikan lewat teks.
function GridCellPreview({ blocks, columns }: { blocks: Block[]; columns: 2 | 3 }) {
  const gap = columns === 3 ? 16 : 18;
  if (!blocks.length) {
    return (
      <p className="hint" style={{ fontSize: 12, margin: '0 0 8px' }}>
        Belum ada sel — klik "+ Tambah sub-blok…" di bawah buat isi sel pertama.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap, marginBottom: 10 }}>
      {blocks.map(b => {
        const title = b.heading || extractBlockText(b) || '';
        return (
          <div key={b.id} style={{
            flex: `1 1 calc((100% - ${(columns - 1) * gap}px) / ${columns})`,
            maxWidth: `calc((100% - ${(columns - 1) * gap}px) / ${columns})`,
            minWidth: 0, minHeight: 56, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '9px 11px', background: 'var(--surface)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 3 }}>
              {BLOCK_LABELS[b.type]}
            </div>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: title ? 'var(--text)' : 'var(--text-faint)',
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            }}>
              {title || '(kosong)'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type FieldStyle = CSSProperties;

// ------------------------------------------------------------------ Tabel Data
// `rows` stays `string[][]` (unchanged from before this redesign) - only the
// EDITING surface changed. It used to be one <input> per row holding every
// cell joined by " | ", re-split on every keystroke; `.trim()` on that split
// ate the trailing space the user had JUST typed before they could type the
// next character, so words silently ran together. Real per-cell inputs below
// fix that at the root (nothing gets joined/split while typing) and, as a
// side effect of switching to a grid, made "some rows have fewer/merged
// cells" a natural thing to expose instead of a bug to work around.
//
// A row's cell count may be LESS than headers.length - render_dtable()
// (generator.py) then gives that row's LAST cell a colspan covering however
// many columns are missing. "− gabung" merges the last two cells (joining
// their text with a space) to shrink toward that; "+ pisah" appends one
// blank cell to grow back out. Repeat "− gabung" to merge more than two -
// e.g. on a 4-column row, two clicks turns [a,b,c,d] into [a, "b c d"],
// matching a label column (a) next to one cell spanning the other 3.
// Pemilih rata teks. <select> yang ringkas, bukan empat tombol berjejer:
// pilihannya saling meniadakan dan jarang diutak-atik, jadi tombol cuma makan
// lebar di form yang sudah paling padat di antara semua blok.
// Nilai kosong = "Kiri" - itu memang tampilan bawaannya, dan menuliskannya
// begitu lebih jujur daripada label "Bawaan" yang gak bilang bawaannya apa.
const PILIHAN_RATA: { v: RataTeks; t: string }[] = [
  { v: 'kiri', t: 'Kiri' },
  { v: 'tengah', t: 'Tengah' },
  { v: 'kanan', t: 'Kanan' },
  { v: 'rata', t: 'Rata kanan-kiri' },
];
function PilihRata({ label, nilai, onPilih }: {
  label: string; nilai?: RataTeks; onPilih: (v: RataTeks) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-dim)' }}>
      {label}
      <select style={{ fontSize: 12, padding: '2px 4px' }} value={nilai || 'kiri'}
        onChange={e => onPilih(e.target.value as RataTeks)}>
        {PILIHAN_RATA.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </label>
  );
}

function DtableFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const headers = block.headers || [];
  const rows = block.rows || [];
  const groups = block.dtableGroups || [];
  const rowGroups = block.dtableRowGroups || [];
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  const cellInp: FieldStyle = { ...inp, flex: 1, minWidth: 0, marginBottom: 0 };

  // Bobot lebar tiap kolom. Disimpan sebagai perbandingan, bukan persen -
  // generator yang menghitung persennya, jadi jumlahnya selalu pas 100%
  // berapa pun yang diketik di sini (lihat dtableWidths di render_dtable).
  const bobot = (i: number) => block.dtableWidths?.[i] ?? 1;
  const totalBobot = headers.reduce((n, _, i) => n + bobot(i), 0) || 1;
  function setLebar(i: number, val: number) {
    // Selalu ditulis utuh sepanjang headers: array setengah jadi bikin
    // generator menolaknya (panjangnya harus sama dengan jumlah kolom) dan
    // lebarnya diam-diam gak kepakai.
    const next = headers.map((_, x) => (x === i ? val : bobot(x)));
    onChange({ dtableWidths: next });
  }

  function setHeader(i: number, val: string) {
    onChange({ headers: headers.map((h, x) => (x === i ? val : h)) });
  }
  function addColumn() {
    // Only pad rows that were FULLY expanded (one cell per column already) -
    // an already-merged row just ends up spanning one more column, which is
    // the whole point of being merged, not something to silently undo.
    const nextRows = rows.map(r => (r.length >= headers.length ? [...r, ''] : r));
    onChange({
      headers: [...headers, `Kolom ${headers.length + 1}`],
      rows: nextRows,
      // Bobot ikut tumbuh HANYA kalau penyusunnya memang sudah mengatur lebar.
      // Kalau belum, dibiarkan undefined supaya tabelnya tetap lebar otomatis.
      ...(block.dtableWidths ? { dtableWidths: [...block.dtableWidths, 1] } : null),
    });
  }
  function removeColumn(i: number) {
    // A merged row (row.length < headers.length) only loses a real cell if
    // the removed column falls among its still-separate leading cells (i <
    // row.length) - otherwise the column being removed was already inside
    // that row's spanning cell, so there's nothing of ITS to delete; the
    // colspan just covers one column fewer automatically once headers.length
    // drops.
    const nextRows = rows.map(r => (i < r.length ? r.filter((_, x) => x !== i) : r));
    onChange({
      headers: headers.filter((_, x) => x !== i),
      rows: nextRows,
      // Bobotnya wajib ikut menyusut. Kalau enggak, panjangnya gak lagi sama
      // dengan jumlah kolom, generator menolak seluruh pengaturan lebarnya,
      // dan tabel yang tadinya rapi mendadak balik ke lebar otomatis.
      ...(block.dtableWidths ? { dtableWidths: block.dtableWidths.filter((_, x) => x !== i) } : null),
    });
  }
  function setCell(ri: number, ci: number, val: string) {
    onChange({ rows: rows.map((r, x) => (x === ri ? r.map((c, y) => (y === ci ? val : c)) : r)) });
  }
  function addRow() {
    onChange({ rows: [...rows, headers.map(() => '')] });
  }
  function removeRow(ri: number) {
    onChange({ rows: rows.filter((_, x) => x !== ri) });
  }
  function growRow(ri: number) {
    onChange({ rows: rows.map((r, x) => (x === ri ? [...r, ''] : r)) });
  }
  function shrinkRow(ri: number) {
    onChange({
      rows: rows.map((r, x) => {
        if (x !== ri || r.length <= 1) return r;
        const merged = r.slice(-2).filter(Boolean).join(' ');
        return [...r.slice(0, -2), merged];
      }),
    });
  }

  // Satu penyunting buat DUA arah grup (mendatar di atas kolom, tegak di kiri
  // baris). Bentuk datanya identik, jadi menyalin-tempel dua blok JSX yang
  // sama cuma bikin keduanya pelan-pelan beda sendiri - persis alasan segBtn
  // dan JudulOpsional dijadikan satu.
  function DaftarGrup({ arah, daftar, batas, judul, petunjukSpan }: {
    arah: 'dtableGroups' | 'dtableRowGroups';
    daftar: { label: string; span: number }[];
    batas: number;
    judul: string;
    petunjukSpan: string;
  }) {
    const ubah = (i: number, patch: Partial<{ label: string; span: number }>) =>
      onChange({ [arah]: daftar.map((g, x) => (x === i ? { ...g, ...patch } : g)) } as Partial<Block>);
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', margin: '0 0 3px' }}>{judul}</div>
        {daftar.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <input
              style={{ ...inp, flex: 1, marginBottom: 0 }}
              placeholder="Label (boleh kosong)"
              title="Kosongkan buat sel kosong — biasanya pojok kiri tabel"
              value={g.label}
              onChange={e => ubah(i, { label: e.target.value })}
            />
            <input
              type="number" min={1} max={batas || 1} style={{ width: 50, fontSize: 13 }} value={g.span}
              title={petunjukSpan}
              onChange={e => ubah(i, { span: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
            <button title="Hapus grup ini"
              onClick={() => onChange({ [arah]: daftar.filter((_, x) => x !== i) } as Partial<Block>)}>×</button>
          </div>
        ))}
        <button style={{ fontSize: 11 }}
          onClick={() => onChange({ [arah]: [...daftar, { label: '', span: 1 }] } as Partial<Block>)}>+ grup</button>
      </div>
    );
  }

  return (
    <>
      <label style={lbl}>Kolom</label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
        {headers.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 2, flex: '1 1 100px', minWidth: 90 }}>
            <input style={cellInp} placeholder={`Kolom ${i + 1}`} value={h} onChange={e => setHeader(i, e.target.value)} />
            {/* Kotak lebar nempel di judul kolomnya - itu tempat yang paling
                gak bikin bingung, dan gak perlu bagian baru di form yang
                sudah padat. Isinya PERBANDINGAN (1-20), bukan persen:
                persennya dihitung generator, jadi lebar total gak mungkin
                meleset. Persen hasilnya ditaruh di tooltip biar tetap
                kebaca tanpa menambah tulisan di layar. */}
            <input
              type="number" min={1} max={20}
              style={{ width: 42, fontSize: 12, padding: '2px 4px' }}
              value={bobot(i)}
              title={`Lebar kolom (perbandingan 1-20) — sekarang ${(bobot(i) / totalBobot * 100).toFixed(0)}%`}
              onChange={e => setLebar(i, Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
            />
            {headers.length > 1 && <button title="Hapus kolom ini" onClick={() => removeColumn(i)}>×</button>}
          </div>
        ))}
      </div>
      <button onClick={addColumn} style={{ marginBottom: 10 }}>+ kolom</button>

      {/* Rata teks: satu baris, dua pilihan. Sengaja gak dikasih paragraf
          penjelas - label "Judul"/"Isi" plus isi pilihannya sudah menjelaskan
          dirinya sendiri, dan form tabel ini sudah paling padat di antara
          semua blok. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', flexWrap: 'wrap' }}>
        <span style={{ ...lbl, margin: 0 }}>Rata teks</span>
        <PilihRata label="Judul" nilai={block.dtableAlignHead} onPilih={v => onChange({ dtableAlignHead: v })} />
        <PilihRata label="Isi" nilai={block.dtableAlignBody} onPilih={v => onChange({ dtableAlignBody: v })} />
      </div>

      <label style={lbl}>
        Header grup (opsional)
        <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-faint)', marginTop: 2 }}>
          Menaungi beberapa kolom atau baris.
        </span>
      </label>
      <DaftarGrup arah="dtableGroups" daftar={groups} batas={headers.length}
        judul="↔ Mendatar, di atas kolom" petunjukSpan="Jumlah kolom yang dinaungi label ini" />
      <DaftarGrup arah="dtableRowGroups" daftar={rowGroups} batas={rows.length}
        judul="↕ Tegak, di kiri baris" petunjukSpan="Jumlah baris yang dinaungi label ini" />

      <label style={lbl}>Baris</label>
      {rows.map((row, ri) => {
        const isMerged = row.length < headers.length;
        return (
          <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* RichInput, bukan <input> polos: sel tabel dirender MENTAH di
                generator (lihat render_dtable), jadi Ctrl+B/Ctrl+I di sini
                menghasilkan tebal/miring sungguhan - bukan tulisan
                "<strong>" seperti kalau field-nya lewat esc(). Judul kolom
                sengaja TETAP <input> polos di atas, karena dia label dan
                masih di-esc, sama seperti judul kartu & label accordion. */}
            {row.map((cell, ci) => (
              <RichInput
                key={ci}
                style={{
                  ...cellInp,
                  flex: isMerged && ci === row.length - 1 ? headers.length - row.length + 1 : 1,
                  background: isMerged && ci === row.length - 1 ? 'var(--surface-2)' : undefined,
                }}
                placeholder={isMerged && ci === row.length - 1 ? `Melebar ${headers.length - row.length + 1} kolom` : `Kolom ${ci + 1}`}
                value={cell}
                onChange={v => setCell(ri, ci, v)}
              />
            ))}
            {headers.length > 1 && (
              <div style={{ display: 'flex', gap: 2 }}>
                {row.length > 1 && <button title="Gabung 2 sel terakhir jadi 1 (melebar)" style={{ fontSize: 11 }} onClick={() => shrinkRow(ri)}>− gabung</button>}
                {row.length < headers.length && <button title="Pisah lagi jadi kolom sendiri" style={{ fontSize: 11 }} onClick={() => growRow(ri)}>+ pisah</button>}
              </div>
            )}
            <button title="Hapus baris" onClick={() => removeRow(ri)}>×</button>
          </div>
        );
      })}
      <button onClick={addRow}>+ baris</button>
    </>
  );
}

// --------------------------------------------------------------- Media block
function ArticulateFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const [busy, setBusy] = useState(false);
  const [persen, setPersen] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  const terkunci = block.artLock !== false;

  async function pilihFile(f: File | undefined) {
    if (!f) return;
    setErr('');
    setBusy(true);
    try {
      const info = await uploadArticulate(f, setPersen);
      // Paket lama dibuang setelah yang baru berhasil naik — bukan sebelumnya,
      // biar blok ini gak pernah ada di keadaan "paket lama sudah hilang tapi
      // yang baru gagal upload".
      const lama = block.artPath;
      const lamaStorage = block.artStorage;
      onChange({
        artStorage: info.storage,
        artUrl: info.url, artPath: info.path, artRoot: info.root, artEntry: info.entry,
        artName: info.name, artSize: info.size,
        // Output Web (tanpa imsmanifest) gak akan pernah lapor selesai, jadi
        // menguncinya = peserta terjebak. Dimatikan otomatis, bukan dibiarkan
        // jadi jebakan yang baru ketahuan pas modulnya dipakai.
        artLock: info.scorm ? block.artLock !== false : false,
      });
      if (lama) deleteArticulate(lama, lamaStorage);
      if (!info.scorm) {
        setErr('Paket ini gak punya imsmanifest.xml (kemungkinan hasil publish "Web", bukan SCORM/LMS). Kontennya tetap jalan penuh, tapi gak bisa lapor selesai — jadi opsi kunci dimatikan. Publish ulang sebagai LMS/SCORM 1.2 kalau mau dikunci.');
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
      setPersen(null);
    }
  }

  return (
    <>
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
        Upload ZIP <strong>Publish &rarr; LMS &rarr; SCORM 1.2</strong> dari Articulate 360.
      </p>

      <input type="file" accept=".zip" disabled={busy}
        onChange={e => pilihFile(e.target.files?.[0])} />
      {busy && (
        <p className="hint" style={{ fontSize: 11 }}>
          {persen === null
            ? 'Membaca paket…'
            : `Mengunggah… ${persen}%`}
          {persen !== null && (
            <span style={{ display: 'block', height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 5 }}>
              <span style={{ display: 'block', height: '100%', width: `${persen}%`, background: 'var(--success, #16a34a)', borderRadius: 2 }} />
            </span>
          )}
        </p>
      )}
      {err && <p style={{ color: 'var(--danger, #c0392b)', fontSize: 11.5, lineHeight: 1.5 }}>{err}</p>}

      {block.artUrl && (
        <div style={{ fontSize: 11.5, background: 'var(--surface-2, #f4f4f5)', borderRadius: 8, padding: '8px 10px', margin: '8px 0' }}>
          <div>
            <strong>{block.artName}</strong> · {((block.artSize || 0) / 1024 / 1024).toFixed(1)}MB
            <span style={{ color: 'var(--text-dim)' }}>
              {' · '}{block.artStorage === 'r2' ? 'Cloudflare R2' : 'Supabase'}
            </span>
          </div>
          <div style={{ color: 'var(--text-dim)' }}>File pembuka: <code>{block.artEntry}</code></div>
        </div>
      )}

      <label style={lbl}>Tinggi kotak</label>
      <select style={inp} value={block.artRatio || '16:9'}
        onChange={e => onChange({ artRatio: e.target.value as any })}>
        <option value="16:9">16:9 — Storyline (paling umum)</option>
        <option value="4:3">4:3 — Storyline lama</option>
        <option value="tinggi">Tinggi (80% layar) — Rise, isinya panjang ke bawah</option>
      </select>

      <label style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, margin: '10px 0 0', cursor: 'pointer' }}>
        <input type="checkbox" checked={terkunci}
          onChange={e => onChange({ artLock: e.target.checked })} style={{ marginTop: 2 }} />
        <span>
          Kunci sampai selesai
          <span className="hint" style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
            Peserta gak bisa lanjut sebelum konten ini selesai.
          </span>
        </span>
      </label>

      <input style={{ ...inp, marginTop: 8 }} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
    </>
  );
}

function MediaFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const source = block.mediaSource || 'video';
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  return (
    <>
      <select style={inp} value={source} onChange={e => onChange({ mediaSource: e.target.value as any })}>
        <option value="video">Upload Video (dari file)</option>
        <option value="youtube">Embed YouTube (URL)</option>
        <option value="instagram">Embed Instagram (URL)</option>
      </select>

      {source === 'video' && <>
        <VideoUploadField value={block.src || ''} onChange={src => onChange({ src })} />

        <label style={lbl}>Rasio tampilan</label>
        <select style={inp} value={block.videoRatio || 'asli'}
          onChange={e => onChange({ videoRatio: e.target.value === 'asli' ? undefined : e.target.value as any })}>
          <option value="asli">Asli (ikut rasio file video)</option>
          <option value="16:9">16:9 — horizontal</option>
          <option value="4:3">4:3 — klasik</option>
          <option value="1:1">1:1 — persegi</option>
          <option value="9:16">9:16 — vertikal</option>
        </select>

        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Suara ikut otomatis; kontrol play/pause bawaan.
          {block.videoRatio && ' Kalau video aslinya beda rasio dari pilihan di atas, ditampilkan utuh dengan bar hitam di sisi yang kelebihan (gak dipotong).'}
        </p>
      </>}

      {source === 'youtube' && <>
        <input style={inp} placeholder="URL YouTube (mis. https://youtu.be/xxxx atau .../watch?v=xxxx)" value={block.embedUrl || ''} onChange={e => onChange({ embedUrl: e.target.value })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Tampil sebagai thumbnail; video main saat diklik.
        </p>
      </>}

      {source === 'instagram' && <>
        <input style={inp} placeholder="URL postingan/Reels Instagram (mis. https://www.instagram.com/reel/xxxx/)" value={block.embedUrl || ''} onChange={e => onChange({ embedUrl: e.target.value })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Ukuran widget responsif otomatis, portrait untuk Reels.
        </p>
      </>}
    </>
  );
}

function VideoUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div style={{ marginBottom: 6 }}>
      {value && <video src={value} controls style={{ width: 200, display: 'block', marginBottom: 4, borderRadius: 6 }} />}
      <input type="file" accept="video/*" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true); setErr('');
        try {
          const url = await uploadMediaToStorage(file);
          onChange(url);
        } catch (ex: any) {
          setErr(ex?.message || 'Gagal upload video');
        } finally {
          setBusy(false);
        }
      }} />
      {busy && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>mengunggah…</span>}
      {err && <p style={{ fontSize: 11, color: 'var(--danger, #c0392b)', margin: '4px 0 0' }}>{err}</p>}
    </div>
  );
}

// ----------------------------------------------------------- Knowledge Check
function KnowledgeFields({ block, onChange, inp, ta }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle; ta: FieldStyle }) {
  const items = block.kcItems || [];
  function patchItem(qi: number, patch: Partial<KcQuestion>) {
    const next = items.map((it, x) => (x === qi ? { ...it, ...patch } : it));
    onChange({ kcItems: next });
  }
  return (
    <>
      <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
        Cek pemahaman ringan; muncul jadi popup saat pindah slide.
      </p>
      {items.map((it, qi) => {
        const mode = it.feedbackMode || 'single';
        return (
        <div key={qi} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
          <input style={inp} placeholder={`Pertanyaan ${qi + 1}`} value={it.q} onChange={e => patchItem(qi, { q: e.target.value })} />
          {(it.opts || []).map((opt, oi) => (
            <div key={oi} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <label title="Tandai sebagai jawaban benar" style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="radio" name={`kc-${block.id}-${qi}`} checked={it.correct === oi} onChange={() => patchItem(qi, { correct: oi })} />
                </label>
                <input style={{ ...inp, marginBottom: 0 }} placeholder={`Pilihan ${oi + 1}`} value={opt} onChange={e => {
                  const opts = [...(it.opts || [])]; opts[oi] = e.target.value; patchItem(qi, { opts });
                }} />
                {(it.opts || []).length > 2 && (
                  <button title="Hapus pilihan" onClick={() => {
                    const opts = (it.opts || []).filter((_, x) => x !== oi);
                    const optFeedback = (it.optFeedback || []).filter((_, x) => x !== oi);
                    // Keep `correct` pointing at a valid option after removal.
                    const correct = it.correct >= opts.length ? opts.length - 1 : (it.correct > oi ? it.correct - 1 : it.correct);
                    patchItem(qi, { opts, optFeedback, correct });
                  }}>×</button>
                )}
              </div>
              {mode === 'perOption' && (
                <div style={{ marginTop: 3, marginLeft: 24 }}>
                  {/* Penanda benar/salah ditaruh NEMPEL di field feedback-nya sendiri
                      (bukan cuma di radio button di atas) — supaya pas nulis feedback
                      opsi mana pun, jelas keliatan lagi ngisi feedback buat jawaban
                      benar atau salah, gak ketuker kalau nanti "jawaban benar"-nya
                      dipindah ke opsi lain (feedback nempel ke POSISI opsi, bukan ke
                      status benarnya — jadi harus jelas terlihat tiap saat). */}
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700, marginBottom: 3,
                    color: it.correct === oi ? 'var(--success, #2f9e6a)' : 'var(--danger, #c0392b)',
                  }}>
                    {it.correct === oi ? '✓ Feedback kalau peserta pilih JAWABAN BENAR ini' : '✕ Feedback kalau peserta pilih jawaban SALAH ini'}
                  </span>
                  <input
                    style={{ ...inp, marginBottom: 0 }}
                    placeholder={`Feedback untuk pilihan ${oi + 1} (opsional)`}
                    value={(it.optFeedback || [])[oi] || ''}
                    onChange={e => {
                      const optFeedback = [...(it.optFeedback || [])];
                      optFeedback[oi] = e.target.value;
                      patchItem(qi, { optFeedback });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, margin: '4px 0 6px' }}>
            <button onClick={() => patchItem(qi, { opts: [...(it.opts || []), ''] })}>+ pilihan</button>
            <span className="hint" style={{ fontSize: 11, alignSelf: 'center' }}>● = jawaban benar</span>
          </div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '6px 0 3px' }}>Model feedback</label>
          <select style={inp} value={mode} onChange={e => patchItem(qi, { feedbackMode: e.target.value as 'single' | 'perOption' })}>
            <option value="single">Feedback benar/salah (1x kesempatan, langsung lanjut)</option>
            <option value="perOption">Feedback di setiap opsi (peserta terus menjawab sampai benar)</option>
          </select>
          {mode === 'single' ? (
            <>
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, marginBottom: 3, color: 'var(--success, #2f9e6a)' }}>
                ✓ Feedback kalau jawaban BENAR
              </span>
              <RichTextarea style={ta} placeholder="Feedback (opsional)" value={it.feedbackCorrect || ''} onChange={v => patchItem(qi, { feedbackCorrect: v })} />
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, margin: '4px 0 3px', color: 'var(--danger, #c0392b)' }}>
                ✕ Feedback kalau jawaban SALAH
              </span>
              <RichTextarea style={ta} placeholder="Feedback (opsional)" value={it.feedbackWrong || ''} onChange={v => patchItem(qi, { feedbackWrong: v })} />
            </>
          ) : (
            <p className="hint" style={{ fontSize: 11, margin: '0 0 4px' }}>
              Isi feedback di bawah tiap pilihan; boleh sebagian.
            </p>
          )}
          {items.length > 1 && (
            <button className="btn-danger btn-sm" style={{ marginTop: 4 }} onClick={() => onChange({ kcItems: items.filter((_, x) => x !== qi) })}>Hapus soal</button>
          )}
        </div>
        );
      })}
      <button onClick={() => onChange({ kcItems: [...items, { q: '', opts: ['', ''], correct: 0, feedback: '' }] })}>+ soal</button>
    </>
  );
}
