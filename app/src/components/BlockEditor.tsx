import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Block, BlockType } from '../types';
import { newBlock, changeBlockType, isBlockEmpty } from '../types';
import type { KcQuestion } from '../types';
import EmojiPicker from './EmojiPicker';
import BlockAddMenu, { BLOCK_LABELS } from './BlockAddMenu';
import { uploadImageToStorage, uploadMediaToStorage } from '../api';

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_CARD_STYLES = `
.block-card{position:relative;}

/* Whenever a field ANYWHERE in the currently-open slide is focused (kicker,
   subjudul, or any block - including ones added after this ran, since
   they're all inside the same container), the WHOLE workspace gets framed
   as one unit. This is the whole point: every block in this slide is
   something the user will look at and edit while working on it, not just
   whichever single field happens to have the cursor right now - so the
   entire area is what should read as "active", not just one block. */
.slide-workspace{transition: box-shadow var(--ease), background var(--ease); border-radius: var(--radius-sm);}
.slide-workspace.has-focused-block{box-shadow: 0 0 0 2px var(--ink); background: var(--surface-2);}
`;

export default function BlockEditor({ blocks, onChange }: Props) {
  function update(i: number, patch: Partial<Block>) {
    const next = [...blocks];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    if (!isBlockEmpty(blocks[i]) && !confirm('Blok ini masih ada isinya, yakin mau dihapus?')) return;
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
      {blocks.map((b, i) => (
        <div key={b.id} className="block-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 11, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <select
              className="block-card-label"
              value={b.type}
              onChange={e => changeType(i, e.target.value as BlockType)}
              title="Ganti tipe blok ini - isi teksnya dipindahkan otomatis ke tipe baru, gak hilang"
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                color: 'var(--text-faint)', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
              }}
            >
              {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-icon btn-sm" title="Naik" onClick={() => move(i, -1)}>↑</button>
              <button className="btn-icon btn-sm" title="Turun" onClick={() => move(i, 1)}>↓</button>
              <button className="btn-danger btn-sm" onClick={() => remove(i)}>Hapus</button>
            </div>
          </div>
          <BlockFields block={b} onChange={patch => update(i, patch)} />
        </div>
      ))}
      <BlockAddMenu onAdd={add} />
    </div>
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
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
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
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
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
          <div key={i} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
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
    case 'media':
      return <MediaFields block={block} onChange={onChange} inp={inp} />;
    case 'knowledge':
      return <KnowledgeFields block={block} onChange={onChange} inp={inp} ta={ta} />;
    case 'modal':
      return <>
        <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
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
      {busy && <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>mengunggah…</span>}
    </div>
  );
}

type FieldStyle = CSSProperties;

// --------------------------------------------------------------- Media block
function MediaFields({ block, onChange, inp }: { block: Block; onChange: (p: Partial<Block>) => void; inp: FieldStyle }) {
  const source = block.mediaSource || 'video';
  return (
    <>
      <select style={inp} value={source} onChange={e => onChange({ mediaSource: e.target.value as any })}>
        <option value="video">Upload Video (dari file)</option>
        <option value="youtube">Embed YouTube (URL)</option>
        <option value="instagram">Embed Instagram (URL)</option>
      </select>

      {source === 'video' && <>
        <VideoUploadField value={block.src || ''} onChange={src => onChange({ src })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Suara video ikut otomatis (tidak di-mute). Peserta punya kontrol play/pause/volume bawaan.
        </p>
      </>}

      {source === 'youtube' && <>
        <input style={inp} placeholder="URL YouTube (mis. https://youtu.be/xxxx atau .../watch?v=xxxx)" value={block.embedUrl || ''} onChange={e => onChange({ embedUrl: e.target.value })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Ditampilkan 16:9 responsif (mengikuti lebar kolom, setara 1280×720).
        </p>
      </>}

      {source === 'instagram' && <>
        <input style={inp} placeholder="URL postingan/Reels Instagram (mis. https://www.instagram.com/reel/xxxx/)" value={block.embedUrl || ''} onChange={e => onChange({ embedUrl: e.target.value })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Ukuran widget IG responsif otomatis (portrait untuk Reels). Catatan: embed IG butuh koneksi ke instagram.com — belum diuji tembus dari jaringan LMS.
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
        Cek pemahaman ringan — muncul sebagai <b>popup begitu peserta mau pindah dari slide ini</b> (klik Selanjutnya/Sebelumnya/menu sidebar).
        Peserta wajib jawab semua soal dulu (benar atau salah, dua-duanya boleh) baru boleh lanjut — sekali dijawab, popup-nya tidak muncul lagi
        kalau peserta balik ke slide ini. Boleh 1 soal, boleh benar-salah. Setiap jawaban direkam ke Command Center (kolom "Knowledge Check") dan diberi feedback.
      </p>
      {items.map((it, qi) => (
        <div key={qi} style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: 8, marginBottom: 6 }}>
          <input style={inp} placeholder={`Pertanyaan ${qi + 1}`} value={it.q} onChange={e => patchItem(qi, { q: e.target.value })} />
          {(it.opts || []).map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
              <label title="Tandai sebagai jawaban benar" style={{ display: 'flex', alignItems: 'center' }}>
                <input type="radio" name={`kc-${block.id}-${qi}`} checked={it.correct === oi} onChange={() => patchItem(qi, { correct: oi })} />
              </label>
              <input style={{ ...inp, marginBottom: 0 }} placeholder={`Pilihan ${oi + 1}`} value={opt} onChange={e => {
                const opts = [...(it.opts || [])]; opts[oi] = e.target.value; patchItem(qi, { opts });
              }} />
              {(it.opts || []).length > 2 && (
                <button title="Hapus pilihan" onClick={() => {
                  const opts = (it.opts || []).filter((_, x) => x !== oi);
                  // Keep `correct` pointing at a valid option after removal.
                  const correct = it.correct >= opts.length ? opts.length - 1 : (it.correct > oi ? it.correct - 1 : it.correct);
                  patchItem(qi, { opts, correct });
                }}>×</button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, margin: '4px 0 6px' }}>
            <button onClick={() => patchItem(qi, { opts: [...(it.opts || []), ''] })}>+ pilihan</button>
            <span className="hint" style={{ fontSize: 11, alignSelf: 'center' }}>● = jawaban benar</span>
          </div>
          <textarea style={ta} placeholder="Feedback (muncul setelah dijawab, baik benar maupun salah)" value={it.feedback || ''} onChange={e => patchItem(qi, { feedback: e.target.value })} />
          {items.length > 1 && (
            <button className="btn-danger btn-sm" style={{ marginTop: 4 }} onClick={() => onChange({ kcItems: items.filter((_, x) => x !== qi) })}>Hapus soal</button>
          )}
        </div>
      ))}
      <button onClick={() => onChange({ kcItems: [...items, { q: '', opts: ['', ''], correct: 0, feedback: '' }] })}>+ soal</button>
    </>
  );
}
