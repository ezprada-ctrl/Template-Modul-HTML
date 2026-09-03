import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Block, BlockType } from '../types';
import { newBlock, changeBlockType, isBlockEmpty, extractBlockText } from '../types';
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

export default function BlockEditor({ blocks, onChange, columns }: Props) {
  // `columns` is ONLY ever passed by GridFields (top-level callers in
  // Canvas.tsx/CoverForm.tsx never set it) - reused here as the "am I
  // nested inside a Grid" signal instead of adding a second prop that
  // would just duplicate it. Nested blocks get called "sub-blok" in the
  // UI so they read as distinct from top-level blocks, not a new concept -
  // same data shape, same editor, just which level you're adding to.
  const nested = columns !== undefined;
  // Blok yang terakhir disentuh — penanda "kamu lagi di sini". Sengaja gak
  // dikosongkan waktu fokus keluar: kalau dihapus tiap blur, penandanya
  // berkedip-kedip waktu pindah antar field DI DALAM blok yang sama, dan
  // hilang persis waktu orangnya menoleh ke panel preview. Yang berpindah
  // cuma kalau blok LAIN disentuh.
  const [blokAktif, setBlokAktif] = useState<string | null>(null);
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
    if (!isBlockEmpty(blocks[i]) && !confirm(nested ? 'Sub-blok ini masih ada isinya, yakin mau dihapus?' : 'Blok ini masih ada isinya, yakin mau dihapus?')) return;
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
            onFocusCapture={() => setBlokAktif(b.id)}
            onMouseDown={() => setBlokAktif(b.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: isCollapsed ? 0 : 8, flexWrap: 'wrap' }}>
              {/* flexWrap: label "sedang diedit" dan nama tipe blok sama-sama
                  gak boleh menyusut (keduanya flex-shrink:0), jadi di kartu
                  sempit barisnya meluap keluar tepi kartu kalau gak boleh
                  turun ke baris berikutnya. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
                <button
                  className="btn-icon btn-sm"
                  title={nested ? (isCollapsed ? 'Buka sub-blok ini' : 'Tutup sub-blok ini') : (isCollapsed ? 'Buka blok ini' : 'Tutup blok ini')}
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
                <select
                  className="block-card-label"
                  value={b.type}
                  onChange={e => changeType(i, e.target.value as BlockType)}
                  title={nested ? 'Ganti tipe sub-blok ini - isi teksnya dipindahkan otomatis ke tipe baru, gak hilang' : 'Ganti tipe blok ini - isi teksnya dipindahkan otomatis ke tipe baru, gak hilang'}
                  style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: 'var(--text-faint)', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flexShrink: 0,
                    maxWidth: '100%',
                  }}
                >
                  {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
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
      <BlockAddMenu onAdd={add} label={nested ? '+ Tambah sub-blok…' : undefined} />
    </div>
  );
}

// <textarea> untuk field yang isinya HTML mentah (bodyHtml, pullquote.text, isi
// accordion/tab, detail flow, feedback KC, dll — semua dirender lewat nl2br
// TANPA escape di generator.py). Ctrl/Cmd+B membungkus teks terpilih dengan
// <strong>…</strong>, Ctrl/Cmd+I dengan <em>…</em> — toggle: kalau yang terpilih
// PERSIS sudah terbungkus tag itu, tag-nya dilepas. Biar user gak perlu ngetik
// tag sendiri. Selain shortcut, ini textarea biasa.
function RichTextarea({ value, onChange, style, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  style?: CSSProperties;
  placeholder?: string;
}) {
  function toggleWrap(el: HTMLTextAreaElement, tag: 'strong' | 'em') {
    const s = el.selectionStart;
    const e = el.selectionEnd;
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
  return (
    <textarea
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.altKey || !(e.ctrlKey || e.metaKey)) return;
        const k = e.key.toLowerCase();
        if (k === 'b') { e.preventDefault(); toggleWrap(e.currentTarget, 'strong'); }
        else if (k === 'i') { e.preventDefault(); toggleWrap(e.currentTarget, 'em'); }
      }}
      title="Ctrl+B: tebal (&lt;strong&gt;) · Ctrl+I: miring (&lt;em&gt;)"
    />
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
        <RichTextarea style={ta} placeholder="Isi (HTML/teks)" value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
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
        <input style={inp} placeholder="Judul daftar (opsional)" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
          Kosongkan kalau daftarnya gak perlu judul.
        </p>
        <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!block.ordered} onChange={e => onChange({ ordered: e.target.checked })} />
          bernomor
        </label>
        {(block.items || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 4 }}>
            <input style={inp} value={item} onChange={e => {
              const items = [...(block.items || [])]; items[i] = e.target.value; onChange({ items });
            }} />
            <button onClick={() => onChange({ items: (block.items || []).filter((_, x) => x !== i) })}>×</button>
          </div>
        ))}
        <button onClick={() => onChange({ items: [...(block.items || []), ''] })}>+ item</button>
      </>;
    case 'accordion':
      return <>
        {(block.accItems || []).map((it, i) => (
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
            <input style={inp} placeholder="a. Judul" value={it.h} onChange={e => {
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
    case 'tabs':
      return <>
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
      return <>
        <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
          Detail tambahan; muncul jadi tombol, isinya kelihatan setelah diklik.
        </p>
        <EmojiPicker value={block.icon || '📝'} onChange={icon => onChange({ icon })} />
        <input style={inp} placeholder="Judul tombol & popup (mis. Rincian Tambahan)" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <RichTextarea style={{ ...ta, minHeight: 120 }} placeholder="Isi popup (HTML/teks, boleh tabel dtable dll)" value={block.bodyHtml || ''} onChange={v => onChange({ bodyHtml: v })} />
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
      </>;
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
function DtableFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const headers = block.headers || [];
  const rows = block.rows || [];
  const groups = block.dtableGroups || [];
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '8px 0 3px' };
  const cellInp: FieldStyle = { ...inp, flex: 1, minWidth: 0, marginBottom: 0 };

  function setHeader(i: number, val: string) {
    onChange({ headers: headers.map((h, x) => (x === i ? val : h)) });
  }
  function addColumn() {
    // Only pad rows that were FULLY expanded (one cell per column already) -
    // an already-merged row just ends up spanning one more column, which is
    // the whole point of being merged, not something to silently undo.
    const nextRows = rows.map(r => (r.length >= headers.length ? [...r, ''] : r));
    onChange({ headers: [...headers, `Kolom ${headers.length + 1}`], rows: nextRows });
  }
  function removeColumn(i: number) {
    // A merged row (row.length < headers.length) only loses a real cell if
    // the removed column falls among its still-separate leading cells (i <
    // row.length) - otherwise the column being removed was already inside
    // that row's spanning cell, so there's nothing of ITS to delete; the
    // colspan just covers one column fewer automatically once headers.length
    // drops.
    const nextRows = rows.map(r => (i < r.length ? r.filter((_, x) => x !== i) : r));
    onChange({ headers: headers.filter((_, x) => x !== i), rows: nextRows });
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

  function setGroup(i: number, patch: Partial<{ label: string; span: number }>) {
    onChange({ dtableGroups: groups.map((g, x) => (x === i ? { ...g, ...patch } : g)) });
  }
  function addGroup() {
    onChange({ dtableGroups: [...groups, { label: '', span: 1 }] });
  }
  function removeGroup(i: number) {
    onChange({ dtableGroups: groups.filter((_, x) => x !== i) });
  }

  return (
    <>
      <label style={lbl}>Kolom</label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
        {headers.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 2, flex: '1 1 100px', minWidth: 90 }}>
            <input style={cellInp} placeholder={`Kolom ${i + 1}`} value={h} onChange={e => setHeader(i, e.target.value)} />
            {headers.length > 1 && <button title="Hapus kolom ini" onClick={() => removeColumn(i)}>×</button>}
          </div>
        ))}
      </div>
      <button onClick={addColumn} style={{ marginBottom: 10 }}>+ kolom</button>

      <label style={lbl}>
        Header grup (opsional)
        <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-faint)', marginTop: 2 }}>
          Baris judul tambahan DI ATAS baris kolom di atas — buat menaungi beberapa kolom sekaligus (mis. "Mitra Transaksi" menaungi 3 kolom SPDN/SPLN di bawahnya). Kosongkan label + span 1 buat sel kosong (biasanya kolom paling kiri, yang isinya label baris).
        </span>
      </label>
      {groups.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input style={{ ...inp, flex: 1, marginBottom: 0 }} placeholder="Label grup (boleh kosong)" value={g.label}
            onChange={e => setGroup(i, { label: e.target.value })} />
          <input type="number" min={1} max={headers.length || 1} style={{ width: 50, fontSize: 13 }} value={g.span}
            title="Jumlah kolom yang dinaungi label ini"
            onChange={e => setGroup(i, { span: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
          <button title="Hapus grup ini" onClick={() => removeGroup(i)}>×</button>
        </div>
      ))}
      <button onClick={addGroup} style={{ marginBottom: 10 }}>+ grup header</button>

      <label style={lbl}>Baris</label>
      {rows.map((row, ri) => {
        const isMerged = row.length < headers.length;
        return (
          <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {row.map((cell, ci) => (
              <input
                key={ci}
                style={{
                  ...cellInp,
                  flex: isMerged && ci === row.length - 1 ? headers.length - row.length + 1 : 1,
                  background: isMerged && ci === row.length - 1 ? 'var(--surface-2)' : undefined,
                }}
                placeholder={isMerged && ci === row.length - 1 ? `Melebar ${headers.length - row.length + 1} kolom` : `Kolom ${ci + 1}`}
                value={cell}
                onChange={e => setCell(ri, ci, e.target.value)}
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
            <option value="perOption">Feedback per pilihan jawaban (opsional per pilihan)</option>
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
