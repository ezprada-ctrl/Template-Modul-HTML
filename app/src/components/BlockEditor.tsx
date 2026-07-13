import { useState } from 'react';
import type { Block, BlockType } from '../types';
import { uid } from '../types';
import EmojiPicker from './EmojiPicker';
import { uploadImageToStorage } from '../api';

const BLOCK_LABELS: Record<BlockType, string> = {
  card: 'Kartu (Card)',
  callout: 'Catatan (Callout)',
  definition: 'Definisi',
  pullquote: 'Kutipan Angka (Pull-quote)',
  ticklist: 'Daftar Bercentang',
  accordion: 'Accordion',
  tabs: 'Tabs',
  timeline: 'Timeline',
  dtable: 'Tabel Data',
  flow: 'Diagram Alur',
  grid: 'Grid (2/3 kolom)',
  image: 'Gambar',
  badgeref: 'Badge Referensi',
  html: 'HTML Bebas',
  modal: 'Modal Popup (info tambahan)',
};

function newBlock(type: BlockType): Block {
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

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockEditor({ blocks, onChange }: Props) {
  function update(i: number, patch: Partial<Block>) {
    const next = [...blocks];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
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
      {blocks.map((b, i) => (
        <div key={b.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <b style={{ fontSize: 12 }}>{BLOCK_LABELS[b.type]}</b>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, 1)}>↓</button>
              <button onClick={() => remove(i)} style={{ color: 'crimson' }}>Hapus</button>
            </div>
          </div>
          <BlockFields block={b} onChange={patch => update(i, patch)} />
        </div>
      ))}
      <select onChange={e => { if (e.target.value) { add(e.target.value as BlockType); e.target.value = ''; } }} defaultValue="">
        <option value="" disabled>+ Tambah blok...</option>
        {Object.entries(BLOCK_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  const ta = { width: '100%', minHeight: 60, fontFamily: 'inherit', fontSize: 13 };
  const inp = { width: '100%', fontSize: 13, marginBottom: 4 };

  switch (block.type) {
    case 'card':
      return <>
        <EmojiPicker value={block.icon || ''} onChange={icon => onChange({ icon })} />
        <p style={{ fontSize: 11, color: '#aaa', margin: '-2px 0 6px' }}>
          Icon cuma tampil kalau "Judul kartu" di bawah ini diisi — nempel di sebelah judul, bukan berdiri sendiri.
        </p>
        <input style={inp} placeholder="Judul kartu" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <textarea style={ta} placeholder="Isi (HTML/teks)" value={block.bodyHtml || ''} onChange={e => onChange({ bodyHtml: e.target.value })} />
      </>;
    case 'callout':
      return <>
        <select style={inp} value={block.variant} onChange={e => onChange({ variant: e.target.value as any })}>
          {['amber', 'rose', 'blue', 'violet', 'teal'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <input style={inp} placeholder="Badge singkat (opsional, mis. angka/huruf)" value={block.badge || ''} onChange={e => onChange({ badge: e.target.value })} />
        <EmojiPicker value={block.icon || ''} onChange={icon => onChange({ icon })} placeholder="Atau pakai icon simbol (opsional, dipakai kalau badge kosong)" />
        <textarea style={ta} placeholder="Isi catatan" value={block.bodyHtml || ''} onChange={e => onChange({ bodyHtml: e.target.value })} />
      </>;
    case 'definition':
      return <>
        <input style={inp} placeholder="Label tag (mis. DEFINISI)" value={block.tag || ''} onChange={e => onChange({ tag: e.target.value })} />
        <textarea style={ta} placeholder="Isi definisi" value={block.bodyHtml || ''} onChange={e => onChange({ bodyHtml: e.target.value })} />
      </>;
    case 'pullquote':
      return <>
        <input style={inp} placeholder="Angka/kata besar" value={block.num || ''} onChange={e => onChange({ num: e.target.value })} />
        <textarea style={ta} placeholder="Teks penjelas" value={block.text || ''} onChange={e => onChange({ text: e.target.value })} />
      </>;
    case 'ticklist':
      return <>
        <label style={{ fontSize: 12 }}><input type="checkbox" checked={!!block.ordered} onChange={e => onChange({ ordered: e.target.checked })} /> bernomor</label>
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
          <div key={i} style={{ border: '1px dashed #ccc', padding: 6, marginBottom: 4 }}>
            <input style={inp} placeholder="a. Judul" value={it.h} onChange={e => {
              const accItems = [...(block.accItems || [])]; accItems[i] = { ...it, h: e.target.value }; onChange({ accItems });
            }} />
            <textarea style={ta} placeholder="Isi" value={it.b} onChange={e => {
              const accItems = [...(block.accItems || [])]; accItems[i] = { ...it, b: e.target.value }; onChange({ accItems });
            }} />
            <button onClick={() => onChange({ accItems: (block.accItems || []).filter((_, x) => x !== i) })}>Hapus item</button>
          </div>
        ))}
        <button onClick={() => onChange({ accItems: [...(block.accItems || []), { h: '', b: '' }] })}>+ item accordion</button>
      </>;
    case 'tabs':
      return <>
        {(block.tabItems || []).map((it, i) => (
          <div key={i} style={{ border: '1px dashed #ccc', padding: 6, marginBottom: 4 }}>
            <input style={inp} placeholder="Label tab" value={it.label} onChange={e => {
              const tabItems = [...(block.tabItems || [])]; tabItems[i] = { ...it, label: e.target.value }; onChange({ tabItems });
            }} />
            <textarea style={ta} placeholder="Isi tab" value={it.content} onChange={e => {
              const tabItems = [...(block.tabItems || [])]; tabItems[i] = { ...it, content: e.target.value }; onChange({ tabItems });
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
      return <>
        <input style={inp} placeholder="Header, pisah dengan |" value={(block.headers || []).join(' | ')}
          onChange={e => onChange({ headers: e.target.value.split('|').map(s => s.trim()) })} />
        {(block.rows || []).map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 4 }}>
            <input style={inp} value={row.join(' | ')} onChange={e => {
              const rows = [...(block.rows || [])]; rows[i] = e.target.value.split('|').map(s => s.trim()); onChange({ rows });
            }} />
            <button onClick={() => onChange({ rows: (block.rows || []).filter((_, x) => x !== i) })}>×</button>
          </div>
        ))}
        <button onClick={() => onChange({ rows: [...(block.rows || []), (block.headers || []).map(() => '')] })}>+ baris</button>
      </>;
    case 'flow':
      return <>
        {(block.steps || []).map((s, i) => (
          <div key={i} style={{ border: '1px dashed #ccc', padding: 6, marginBottom: 4 }}>
            <input style={inp} placeholder="Judul langkah" value={s.title} onChange={e => {
              const steps = [...(block.steps || [])]; steps[i] = { ...s, title: e.target.value }; onChange({ steps });
            }} />
            <textarea style={ta} placeholder="Detail langkah" value={s.detail} onChange={e => {
              const steps = [...(block.steps || [])]; steps[i] = { ...s, detail: e.target.value }; onChange({ steps });
            }} />
            <button onClick={() => onChange({ steps: (block.steps || []).filter((_, x) => x !== i) })}>Hapus langkah</button>
          </div>
        ))}
        <button onClick={() => onChange({ steps: [...(block.steps || []), { n: (block.steps?.length || 0) + 1, title: '', detail: '' }] })}>+ langkah</button>
      </>;
    case 'image':
      return <>
        <ImageUploadField value={block.src || ''} onChange={src => onChange({ src })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
      </>;
    case 'badgeref':
      return <input style={inp} placeholder="Teks badge (mis. Pasal 4 · PMK 15/2025)" value={block.refText || ''} onChange={e => onChange({ refText: e.target.value })} />;
    case 'html':
      return <textarea style={ta} placeholder="HTML bebas" value={block.raw || ''} onChange={e => onChange({ raw: e.target.value })} />;
    case 'modal':
      return <>
        <p style={{ fontSize: 11, color: '#aaa', margin: '-2px 0 6px' }}>
          Cocok buat detail tambahan yang bikin slide penuh/ribet (mis. rincian formula) — muncul jadi tombol,
          isinya baru kelihatan kalau tombolnya diklik (popup).
        </p>
        <EmojiPicker value={block.icon || '📝'} onChange={icon => onChange({ icon })} />
        <input style={inp} placeholder="Judul tombol & popup (mis. Rincian Tambahan)" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <textarea style={{ ...ta, minHeight: 120 }} placeholder="Isi popup (HTML/teks, boleh tabel dtable dll)" value={block.bodyHtml || ''} onChange={e => onChange({ bodyHtml: e.target.value })} />
      </>;
    default:
      return null;
  }
}

function ImageUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ marginBottom: 6 }}>
      {value && <img src={value} style={{ width: 120, display: 'block', marginBottom: 4, borderRadius: 4 }} />}
      <input type="file" accept="image/*" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
          const url = await uploadImageToStorage(file);
          onChange(url);
        } finally {
          setBusy(false);
        }
      }} />
      {busy && <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>mengompres...</span>}
    </div>
  );
}
