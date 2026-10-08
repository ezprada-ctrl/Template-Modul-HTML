import { useEffect, useState } from 'react';
import { ccRefleksi } from '../api';
import type { RefleksiKiriman, RefleksiJawaban } from '../api';
import { buatXlsx } from '../xlsx';

/* Tab "Refleksi" di Command Center: jawaban blok Refleksi satu modul, per
   peserta (NIP + nama), plus unduhan Excel tiga sheet:
     1. Per Peserta    - satu baris per orang, satu kolom per poin refleksi
     2. Per Pertanyaan - satu baris per jawaban, enak difilter pengajar
                         (mis. semua "pertanyaan untuk sesi klasikal")
     3. Rekap Pilihan  - berapa peserta memilih tiap opsi */

function jawabanTeks(a: RefleksiJawaban | undefined): string {
  if (!a) return '';
  if (a.tipe === 'isian') return a.teks || '';
  const bagian = [...(a.pilihan || [])];
  if (a.lainnya) bagian.push(`Lainnya: ${a.lainnya}`);
  return bagian.join('; ');
}

function waktu(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

interface Kolom { kunci: string; slide: number | null; no: number; q: string; tipe: string }

/** Daftar poin unik, urut slide lalu nomor poin. Kuncinya blok+id poin, jadi
 *  dua blok Refleksi dalam satu modul tidak saling menimpa. */
function kolomPoin(items: RefleksiKiriman[]): Kolom[] {
  const peta = new Map<string, Kolom>();
  for (const k of items) for (const a of k.jawaban) {
    const kunci = `${k.block}::${a.id}`;
    if (!peta.has(kunci)) peta.set(kunci, { kunci, slide: k.slide, no: a.no, q: a.q, tipe: a.tipe });
  }
  return [...peta.values()].sort((x, y) => (x.slide ?? 0) - (y.slide ?? 0) || x.no - y.no);
}

export default function RefleksiPanel({ password, slug, judul, demo }: { password: string; slug: string; judul: string; demo: boolean }) {
  const [items, setItems] = useState<RefleksiKiriman[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [terpotong, setTerpotong] = useState(false);

  useEffect(() => {
    if (demo) { setItems([]); return; }
    let batal = false;
    setBusy(true); setError('');
    ccRefleksi(password, slug)
      .then(r => { if (!batal) { setItems(r.items); setTerpotong(r.terpotong); } })
      .catch(e => { if (!batal) setError(e.message); })
      .finally(() => { if (!batal) setBusy(false); });
    return () => { batal = true; };
  }, [password, slug, demo]);

  const poin = kolomPoin(items);
  const banyakSlide = new Set(poin.map(p => p.slide)).size > 1;
  const labelPoin = (p: Kolom) => `${banyakSlide && p.slide != null ? `Slide ${p.slide} · ` : ''}R${p.no}. ${p.q}`;

  // Satu baris per peserta: kiriman beberapa blok digabung ke baris yang sama.
  const perPeserta = new Map<string, { nip: string; nama: string; dikirim: string; jawab: Map<string, RefleksiJawaban> }>();
  for (const k of items) {
    const id = k.learner_id || `(tanpa NIP) ${k.learner_name}`;
    const r = perPeserta.get(id) || { nip: k.learner_id, nama: k.learner_name, dikirim: k.dikirim, jawab: new Map() };
    if (k.dikirim && (!r.dikirim || k.dikirim > r.dikirim)) r.dikirim = k.dikirim;
    for (const a of k.jawaban) r.jawab.set(`${k.block}::${a.id}`, a);
    perPeserta.set(id, r);
  }
  const peserta = [...perPeserta.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  async function unduh() {
    const sheet1 = [
      ['No', 'NIP', 'Nama', 'Waktu kirim', ...poin.map(labelPoin)],
      ...peserta.map((p, i) => [String(i + 1), p.nip, p.nama, waktu(p.dikirim), ...poin.map(k => jawabanTeks(p.jawab.get(k.kunci)))]),
    ];
    const sheet2: string[][] = [['Slide', 'No poin', 'Pertanyaan', 'NIP', 'Nama', 'Jawaban', 'Waktu kirim']];
    for (const k of poin) for (const p of peserta) {
      const a = p.jawab.get(k.kunci);
      sheet2.push([k.slide == null ? '' : String(k.slide), `R${k.no}`, k.q, p.nip, p.nama,
                   a ? (jawabanTeks(a) || '(tidak dijawab)') : '(tidak dijawab)', waktu(p.dikirim)]);
    }
    const sheet3: string[][] = [['Slide', 'No poin', 'Pertanyaan', 'Pilihan', 'Jumlah peserta', 'Persen']];
    for (const k of poin.filter(x => x.tipe === 'pilihan')) {
      const hitung = new Map<string, number>();
      let penjawab = 0;
      for (const p of peserta) {
        const a = p.jawab.get(k.kunci);
        if (!a || (!a.pilihan.length && !a.lainnya)) continue;
        penjawab++;
        for (const o of a.pilihan) hitung.set(o, (hitung.get(o) || 0) + 1);
        if (a.lainnya) hitung.set('Lainnya', (hitung.get('Lainnya') || 0) + 1);
      }
      [...hitung.entries()].sort((x, y) => y[1] - x[1]).forEach(([o, n]) => {
        sheet3.push([k.slide == null ? '' : String(k.slide), `R${k.no}`, k.q, o, String(n),
                     penjawab ? `${Math.round(n / penjawab * 100)}%` : '']);
      });
    }
    const blob = await buatXlsx([
      { name: 'Per Peserta', rows: sheet1, widths: [5, 22, 28, 20, ...poin.map(() => 45)] },
      { name: 'Per Pertanyaan', rows: sheet2, widths: [7, 8, 50, 22, 28, 60, 20] },
      { name: 'Rekap Pilihan', rows: sheet3, widths: [7, 8, 50, 45, 14, 10] },
    ]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Refleksi - ${(judul || slug).replace(/[\\/:*?"<>|]/g, ' ').trim()}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  if (demo) return <p className="hint">Mode Contoh: data refleksi tidak tersedia.</p>;
  if (busy) return <p className="hint">Memuat…</p>;
  if (error) return <p className="hint" style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!items.length) return <p className="hint">Belum ada peserta yang mengirim refleksi di modul ini.</p>;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="hint" style={{ margin: 0 }}>
          <b>{peserta.length}</b> peserta mengirim refleksi · <b>{poin.length}</b> poin
        </span>
        <button className="btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={unduh}
                title="Tiga sheet: Per Peserta, Per Pertanyaan, Rekap Pilihan">
          ⬇ Unduh Excel
        </button>
      </div>
      {terpotong && <p className="hint" style={{ color: 'var(--danger)' }}>⚠ Data kena batas tarikan, yang tampil baru sebagian.</p>}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12.5, minWidth: '100%' }}>
          <thead>
            <tr>
              {['NIP', 'Nama', 'Waktu kirim', ...poin.map(labelPoin)].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)',
                                     background: 'var(--surface-2)', minWidth: i > 2 ? 220 : undefined, verticalAlign: 'bottom' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {peserta.map((p, i) => (
              <tr key={i}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.nip || '—'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{p.nama || '—'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{waktu(p.dikirim)}</td>
                {poin.map(k => {
                  const t = jawabanTeks(p.jawab.get(k.kunci));
                  return <td key={k.kunci} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top',
                                                    color: t ? undefined : 'var(--text-faint)' }}>{t || 'tidak dijawab'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
