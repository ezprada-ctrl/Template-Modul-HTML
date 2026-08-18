import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Block, BlockType } from '../types';
import { newBlock, changeBlockType, isBlockEmpty, extractBlockText } from '../types';
import type { KcQuestion } from '../types';
import EmojiPicker from './EmojiPicker';
import BlockAddMenu, { BLOCK_LABELS } from './BlockAddMenu';
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
.block-card{position:relative;}

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
      {blocks.map((b, i) => {
        const isCollapsed = collapsed.has(b.id);
        const summary = isCollapsed ? blockSummary(b) : '';
        return (
          <div key={b.id} className="block-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 11, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: isCollapsed ? 0 : 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <button
                  className="btn-icon btn-sm"
                  title={isCollapsed ? 'Buka blok ini' : 'Tutup blok ini'}
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
                  title="Ganti tipe blok ini - isi teksnya dipindahkan otomatis ke tipe baru, gak hilang"
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
        <input style={inp} placeholder="Judul daftar (opsional)" value={block.heading || ''} onChange={e => onChange({ heading: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '-2px 0 8px' }}>
          Kosongkan kalau daftarnya gak perlu judul — nanti cuma daftarnya sendiri yang tampil.
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
    case 'grid':
      return <GridFields block={block} onChange={onChange} />;
    case 'image':
      return <ImageFields block={block} onChange={onChange} inp={inp} />;
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
        PNG transparan otomatis jadi mode "bersih" saat diupload. "Dampingi teks" bikin gambar berdiri di satu sisi &amp; materi mengalir di sebelahnya (di HP otomatis jadi atas-bawah).
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
        Susunan di bawah ini nunjukin persis posisi tiap sel — begitu kotak terakhir mentok ke kanan, sisanya otomatis pindah baris & ke tengah, sama persis kayak hasil akhirnya nanti.
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
        Belum ada sel — klik "+ Tambah blok…" di bawah buat isi sel pertama.
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

// --------------------------------------------------------------- Media block
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
          Suara video ikut otomatis (tidak di-mute). Peserta punya kontrol play/pause/volume bawaan.
          {block.videoRatio && ' Kalau video aslinya beda rasio dari pilihan di atas, ditampilkan utuh dengan bar hitam di sisi yang kelebihan (gak dipotong).'}
        </p>
      </>}

      {source === 'youtube' && <>
        <input style={inp} placeholder="URL YouTube (mis. https://youtu.be/xxxx atau .../watch?v=xxxx)" value={block.embedUrl || ''} onChange={e => onChange({ embedUrl: e.target.value })} />
        <input style={inp} placeholder="Caption (opsional)" value={block.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
        <p className="hint" style={{ fontSize: 11, margin: '2px 0 0' }}>
          Tampil sebagai thumbnail asli video + tombol play (16:9, atau 9:16 untuk Shorts) — video baru main saat diklik. Boleh link watch?v=, youtu.be/, atau /shorts/.
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
        Mode <b>"Feedback benar/salah"</b>: peserta dikunci begitu menjawab sekali (langsung boleh lanjut, benar atau salah), tapi
        teks feedback-nya beda buat masing-masing hasil — supaya kamu gak salah tulis feedback yang cuma cocok buat satu hasil
        tapi ketampil buat hasil satunya juga.
        Mode <b>"Feedback per pilihan"</b>: kalau salah, peserta dikasih tau + boleh coba opsi lain berkali-kali sampai benar — baru
        setelah itu boleh lanjut (jawab benar langsung di percobaan pertama juga boleh lanjut). Boleh 1 soal. Setiap percobaan
        direkam ke Command Center (kolom "Knowledge Check").
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
              <textarea style={ta} placeholder="Feedback (opsional)" value={it.feedbackCorrect || ''} onChange={e => patchItem(qi, { feedbackCorrect: e.target.value })} />
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, margin: '4px 0 3px', color: 'var(--danger, #c0392b)' }}>
                ✕ Feedback kalau jawaban SALAH
              </span>
              <textarea style={ta} placeholder="Feedback (opsional)" value={it.feedbackWrong || ''} onChange={e => patchItem(qi, { feedbackWrong: e.target.value })} />
            </>
          ) : (
            <p className="hint" style={{ fontSize: 11, margin: '0 0 4px' }}>
              Isi feedback langsung di bawah tiap pilihan di atas — boleh sebagian pilihan aja yang diisi, sisanya cukup tampil ✓/✕ tanpa penjelasan.
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
