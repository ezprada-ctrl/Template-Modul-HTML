import type { CSSProperties } from 'react';
import { Fragment, useState } from 'react';
import type { ActivityModule, ActivitySession, ActivityLearner, CocreationModule, PeringatanDetail, VideoDetail } from '../api';
import { ccCocreation, ccListModules, ccListSessions, ccListLearners, ccRawRows } from '../api';
import { DEMO_MODULES, DEMO_SESSIONS, DEMO_LEARNERS, DEMO_COCREATION } from '../demoActivityData';

// Ringkasan di atas tabel. Alasannya: tabelnya 13 kolom dengan bobot visual
// sama rata, jadi gak ada apa pun yang menuntun mata ke angka yang paling
// menentukan tindak lanjut. Ini tempat mendarat sebelum masuk ke rinciannya.
// Sengaja cuma 4 angka - kalau lebih, dia berubah jadi tabel kedua dan
// masalahnya balik lagi.
function RingkasanBar({ butir }: { butir: { label: string; nilai: string; catatan?: string; awas?: boolean }[] }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 14,
      background: 'var(--border)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      {butir.map(b => (
        <div key={b.label} style={{ flex: '1 1 130px', background: 'var(--surface)', padding: '10px 13px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            {b.label}
          </div>
          <div style={{
            fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2,
            color: b.awas ? 'var(--danger)' : 'var(--text)',
          }}>
            {b.nilai}
          </div>
          {b.catatan && (
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{b.catatan}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Satu peserta dihitung "perlu ditindaklanjuti" kalau ada MINIMAL SATU sinyal
// yang memang bisa ditindaklanjuti di kelas: mengabaikan peringatan baca-cepat,
// meninggalkan layar lama, gagal kuis, atau membuka video lalu praktis tidak
// menontonnya. Ambangnya sengaja sama persis dengan ambang ⚠ yang sudah dipakai
// di tabel - biar angka ringkasan dan tanda di baris gak pernah bercerita beda.
function perluTindakLanjut(x: {
  peringatan_diabaikan?: number; durasi_ditinggal_menit: number | null;
  kuis_gagal: number; video_dimulai: number; video_rata_persen: number | null;
}): boolean {
  if ((x.peringatan_diabaikan || 0) > 0) return true;
  if ((x.durasi_ditinggal_menit ?? 0) > 10) return true;
  if (x.kuis_gagal > 0) return true;
  if (x.video_dimulai > 0 && (x.video_rata_persen ?? 100) < 20) return true;
  return false;
}

// Kolom pertama (nama peserta) DIKUNCI supaya tetap kelihatan waktu tabel
// digeser ke kanan. Tanpa ini tabelnya praktis gak kebaca menyamping: lebarnya
// ~1400px di wadah ~760px, jadi begitu pembaca geser buat lihat kolom kanan,
// nama pesertanya keluar layar dan dia gak tau lagi itu baris siapa.
// Latarnya WAJIB dipasang eksplisit - sel sticky melayang di atas sel lain,
// kalau tembus pandang teksnya bakal saling tumpuk waktu digeser.
const SEL_NAMA: CSSProperties = {
  padding: '8px 11px',
  position: 'sticky',
  left: 0,
  zIndex: 1,
  background: 'var(--surface)',
  borderRight: '1px solid var(--border)',
};
const TH_NAMA: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  background: 'var(--surface-2)',
  borderRight: '1px solid var(--border)',
};

// NIP: kunci penggabung data, bukan bahan bacaan. Dulu kolom sendiri selebar
// ~140px di tiap baris padahal yang dicari mata itu nama. Sekarang nempel
// sebagai baris kecil di bawah nama - tetap kelihatan & tetap bisa disalin,
// tanpa memakan satu kolom penuh.
function NamaPeserta({ nama, nip, peringatan }: { nama: string | null; nip: string | null; peringatan?: React.ReactNode }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{nama || <span style={{ color: 'var(--text-faint)' }}>—</span>}</span>
        {peringatan}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
        {nip || '—'}
      </div>
    </>
  );
}

// Catatan Co-creation satu modul: Section -> Slide -> catatan.
// Dipakai DUA tempat dengan data yang sama bentuknya - tampilan lintas modul
// dan sub-tab di dalam satu modul - jadi susunannya gak pernah beda antara
// keduanya.
function CocreationModulView({ m, tampilkanJudulModul }: { m: CocreationModule; tampilkanJudulModul: boolean }) {
  return (
    <div style={{ marginBottom: tampilkanJudulModul ? 26 : 0 }}>
      {tampilkanJudulModul && (
        <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 15 }}>{m.judul_modul}</b>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
              {m.jumlah_catatan} catatan · {m.jumlah_peserta} peserta
            </span>
            {m.kemungkinan_bentrok && (
              <span title="Satu slug dipakai beberapa judul modul - datanya kemungkinan bercampur"
                    style={{ fontSize: 11, color: 'var(--danger)' }}>⚠ slug bentrok</span>
            )}
          </div>
          {m.slide_terramai && m.slide_terramai.jumlah_catatan > 1 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>
              Paling banyak dicatat: <b style={{ color: 'var(--text-dim)' }}>{m.slide_terramai.judul}</b>
              {' '}({m.slide_terramai.jumlah_catatan} catatan)
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {m.sections.map(sec => (
          <div key={sec.section || sec.judul_section}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                {sec.judul_section || '(tanpa bagian)'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {sec.jumlah_catatan} catatan · {sec.jumlah_peserta} peserta
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sec.slides.map(sl => (
                <div key={String(sl.slide)} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 13 }}>{sl.judul}</b>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                      {sl.jumlah_catatan} catatan · {sl.jumlah_peserta} peserta
                    </span>
                  </div>
                  {sl.catatan.map((c, i) => (
                    <div key={i} style={{ padding: '9px 12px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.text}</p>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {c.nama || '(tanpa nama)'} · {c.learner_id}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Rincian slide di bawah WPM buat satu kejadian reading_warning - dipakai di
// baris expand kolom Peringatan (Per Modul & Per Peserta sama-sama pakai ini).
function PeringatanRincian({ detail }: { detail: PeringatanDetail[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '9px 13px 11px', fontSize: 12 }}>
      {detail.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          {d.modul && <span className="faint">{d.modul} ·</span>}
          <span style={{ fontWeight: 600 }}>Section {d.section ? d.section.toUpperCase() : '?'}</span>
          <span className="dim">
            slide {d.slides.length ? d.slides.join(', ') : '—'}
          </span>
          <span style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 100,
            color: d.choice === 'yakin' ? 'var(--danger)' : 'var(--success)',
            background: d.choice === 'yakin' ? 'var(--danger-soft, rgba(181,64,47,.08))' : 'transparent',
            border: `1px solid ${d.choice === 'yakin' ? 'var(--danger)' : 'var(--border)'}`,
          }}>
            {d.choice === 'yakin' ? 'diabaikan, tetap lanjut' : 'balik baca ulang'}
          </span>
        </div>
      ))}
    </div>
  );
}

// Rincian PER VIDEO (bukan rata-rata gabungan) - dipakai di baris expand
// kolom Video. Mini-bar biar tinggi/rendahnya kelihatan sekilas tanpa harus
// baca angka satu-satu, sama filosofinya kayak sparkline. Diurutkan dari
// backend (paling rendah duluan, paling perlu ditinjau).
function VideoRincian({ detail }: { detail: VideoDetail[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '9px 13px 11px', fontSize: 12 }}>
      {detail.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          {d.modul && <span className="faint">{d.modul} ·</span>}
          <span className="dim" style={{ minWidth: 62, fontWeight: 600 }}>
            {d.slide != null ? `Slide ${d.slide}` : 'Slide ?'}
          </span>
          <div style={{ width: 110, height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
            <div style={{
              width: `${d.persen}%`, height: '100%',
              background: d.persen < 20 ? 'var(--danger)' : d.persen >= 80 ? 'var(--success)' : 'var(--text-faint)',
            }} />
          </div>
          <span className="num" style={{ minWidth: 34, textAlign: 'right' }}>{d.persen}%</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Command Center — baca & unduh rekaman aktivitas peserta.
 *
 * Password DITAHAN DI MEMORI SAJA (state React), sengaja TIDAK disimpan ke
 * localStorage: isinya data pribadi, dan builder app ini dipakai bergantian
 * di laptop tim. Tutup tab = harus login lagi.
 *
 * Password-nya sendiri divalidasi di backend tiap panggilan (lihat
 * _check_cc_password di server/api/index.py) — pengecekan di sini murni buat
 * pengalaman pakai, bukan pengaman. Kalau cuma ngandelin cek di browser,
 * siapa pun tinggal manggil endpoint-nya langsung.
 */
export default function CommandCenter() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  // true kalau lagi nampilin data KARANGAN (demoActivityData.ts), bukan
  // rekaman peserta sungguhan - dipakai buat coba tampilan/latih baca tabel
  // tanpa password & tanpa modul yang beneran udah dipakai peserta.
  const [demoMode, setDemoMode] = useState(false);
  const [modules, setModules] = useState<ActivityModule[]>([]);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [learners, setLearners] = useState<ActivityLearner[]>([]);
  const [view, setView] = useState<'modul' | 'peserta' | 'cocreation'>('modul');
  // Sub-tampilan di dalam satu modul. Catatan Co-creation dipisah dari tabel
  // sesi karena bentuknya beda total: tabel sesi itu angka per orang, catatan
  // itu teks yang dikelompokkan per SLIDE - dipakai buat menyiapkan bahan
  // diskusi kelas, bukan buat menilai peserta.
  const [modulTab, setModulTab] = useState<'sesi' | 'cocreation'>('sesi');
  const [cocreation, setCocreation] = useState<CocreationModule[]>([]);
  // Terpisah dari `cocreation` (yang isinya satu modul saja): tampilan lintas
  // modul dimuat sekali dan dipakai ulang, jangan saling menimpa dengan
  // tampilan per-modul yang cakupannya beda.
  const [cocreationAll, setCocreationAll] = useState<CocreationModule[]>([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // true kalau backend motong hasil di MAX_ROWS — rekap cuma sebagian.
  const [terpotong, setTerpotong] = useState(false);
  // Baris expand yang lagi kebuka, dipakai bareng kolom Peringatan & Video.
  // Key diprefix per-kolom+view (mis. "peringatan-sesi-x" / "video-sesi-x")
  // biar dua kolom di baris yang sama bisa expand independen.
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  function toggleRow(key: string) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Slug itu identitas project di builder, bukan nama yang dikenal manusia.
  // Dipetakan ke judul modul yang terekam; kalau satu slug punya beberapa
  // judul (project didaur ulang) semuanya disebut, jangan diam-diam pilih satu.
  function judulModul(slug: string): string {
    const m = modules.find(x => x.module_slug === slug);
    return m && m.judul_modul.length ? m.judul_modul.join(' / ') : slug;
  }

  async function unlock() {
    setBusy(true);
    setError('');
    try {
      const r = await ccListModules(password);
      setModules(r.items);
      setTerpotong(r.terpotong);
      setUnlocked(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Buka Command Center dengan data KARANGAN, tanpa password/jaringan sama
  // sekali - bukan cuma password kosong, ini gak pernah manggil ccPost.
  // Dipakai buat coba tampilan/latih tim baca tabel sebelum ada data
  // peserta asli, atau tunjukkin fitur ke orang lain tanpa bagi password.
  function enterDemo() {
    setError('');
    setDemoMode(true);
    setUnlocked(true);
    setModules(DEMO_MODULES);
    setTerpotong(false);
    setView('modul');
    setActiveSlug('');
  }

  async function openModule(slug: string) {
    setActiveSlug(slug);
    setModulTab('sesi');
    setCocreation([]);
    if (demoMode) { setSessions(DEMO_SESSIONS); setTerpotong(false); return; }
    setBusy(true);
    setError('');
    try {
      const r = await ccListSessions(password, slug);
      setSessions(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function bukaCocreation() {
    setModulTab('cocreation');
    if (cocreation.length) return;
    if (demoMode) { setCocreation(DEMO_COCREATION); return; }
    setBusy(true);
    setError('');
    try {
      const r = await ccCocreation(password, activeSlug);
      setCocreation(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function bukaCocreationSemua() {
    setView('cocreation');
    if (cocreationAll.length) return;
    if (demoMode) { setCocreationAll(DEMO_COCREATION); return; }
    setBusy(true);
    setError('');
    try {
      const r = await ccCocreation(password);   // tanpa slug = semua modul
      setCocreationAll(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openPeserta() {
    setView('peserta');
    if (demoMode) { setLearners(DEMO_LEARNERS); setTerpotong(false); return; }
    setBusy(true);
    setError('');
    try {
      const r = await ccListLearners(password);
      setLearners(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function download(filename: string, text: string, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Excel Indonesia sering buka CSV dengan pemisah titik-koma. Tapi yang
  // lebih penting: tiap sel dibungkus kutip & kutip di dalamnya digandakan,
  // supaya nama/teks yang mengandung koma atau kutip gak bikin kolomnya
  // geser diam-diam waktu dibuka.
  function toCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const lines = [cols.map(esc).join(',')];
    for (const r of rows) lines.push(cols.map(c => esc(r[c])).join(','));
    // BOM: tanpa ini Excel salah baca huruf beraksen/emoji jadi karakter aneh.
    return '﻿' + lines.join('\r\n');
  }

  async function unduhRingkasan() {
    if (!sessions.length) return;
    download(`aktivitas-${activeSlug}-ringkasan.csv`, toCsv(sessions as unknown as Record<string, unknown>[]));
  }

  // Kolom modul diratakan jadi satu kolom teks + satu kolom menit per modul,
  // biar hasilnya kebaca langsung di Excel tanpa perlu buka JSON.
  async function unduhPeserta() {
    if (!learners.length) return;
    const semuaSlug = Array.from(new Set(learners.flatMap(l => l.modul_slugs))).sort();
    const rows = learners.map(l => {
      const r: Record<string, unknown> = {
        nip: l.learner_id,
        nama: l.nama || '',
        nama_varian: l.nama_varian.join(' | '),
        nama_bervariasi: l.nama_bervariasi ? 'YA' : '',
        sumber_identitas: l.identity_sources.join(' | '),
        jumlah_modul: l.jumlah_modul,
        jumlah_sesi: l.jumlah_sesi,
        durasi_menit: l.durasi_menit,
        durasi_tatap_layar_menit: l.durasi_tatap_layar_menit,
        durasi_ditinggal_menit: l.durasi_ditinggal_menit,
        sesi_tanpa_end: l.sesi_tanpa_end,
        slide_dilihat: l.jumlah_slide_dilihat,
        interaksi: l.jumlah_interaksi,
        kuis_benar: l.kuis_benar,
        kuis_dijawab: l.kuis_dijawab,
        kuis_gagal: l.kuis_gagal,
        knowledge_check_benar: l.kc_benar,
        knowledge_check_dijawab: l.kc_dijawab,
        video_dimulai: l.video_dimulai,
        video_total: l.total_video_program ?? '',
        video_rata_persen_ditonton: l.video_rata_persen ?? '',
        articulate_selesai: l.articulate_selesai,
        articulate_total: l.total_articulate_program ?? '',
        pertama: l.pertama,
        terakhir: l.terakhir,
      };
      for (const slug of semuaSlug) {
        r[`menit_${slug}`] = l.modul[slug] ? Math.round(l.modul[slug].durasi_ms / 6000) / 10 : '';
      }
      return r;
    });
    download('aktivitas-per-peserta.csv', toCsv(rows));
  }

  async function unduhMentah() {
    if (demoMode) return;
    setBusy(true);
    setError('');
    try {
      const rows = await ccRawRows(password, activeSlug);
      if (!rows.length) { setError('Belum ada data mentah untuk modul ini.'); return; }
      download(`aktivitas-${activeSlug}-mentah.csv`, toCsv(rows));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function kunciLagi() {
    setUnlocked(false); setDemoMode(false); setPassword('');
    setSessions([]); setLearners([]); setModules([]); setActiveSlug('');
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 380 }}>
        <h2 style={{ margin: '0 0 4px' }}>Command Center</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
          Berisi data pribadi peserta; masukkan password.
        </p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') unlock(); }}
          style={{ width: '100%', marginBottom: 8 }}
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, margin: '0 0 10px' }}>{error}</p>}
        <button className="btn-primary" onClick={unlock} disabled={busy || !password}>
          {busy ? 'Membuka…' : 'Buka'}
        </button>
        {/* Nol password, nol jaringan - murni data karangan (demoActivityData.ts)
            biar bisa coba tampilan/latih baca tabel atau tunjukkin fitur ke
            orang lain tanpa perlu bagi password beneran. */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button className="btn-ghost btn-sm" onClick={enterDemo} style={{ width: '100%' }}>
            👁 Lihat contoh tampilan (data karangan, tanpa password)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Command Center</h2>
        <button className="btn-ghost btn-sm" onClick={kunciLagi}>
          Kunci lagi
        </button>
      </div>
      <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Rekaman aktivitas dari modul yang “Rekam aktivitas peserta”-nya dicentang.
      </p>

      {/* Ditandai keras di paling atas - data di bawah ini KARANGAN, bukan
          rekaman peserta sungguhan. Warnanya sengaja beda dari banner
          "terpotong" (itu soal data ASLI yang kurang lengkap, ini soal data
          yang emang bukan asli sama sekali). */}
      {demoMode && (
        <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--border-strong)',
                    background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', margin: '0 0 14px',
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          👁 Mode Contoh — semua nama, NIP, dan angka di bawah ini <b>karangan</b> buat latihan baca tabel, bukan peserta sungguhan.
          <button className="btn-ghost btn-sm" onClick={kunciLagi} style={{ marginLeft: 'auto' }}>Keluar dari Contoh</button>
        </p>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</p>}

      {/* Data kena batas MAX_ROWS: rekap yang ditampilkan cuma sebagian.
          Ditandai keras biar gak dibaca sebagai angka lengkap. */}
      {terpotong && (
        <p style={{ color: 'var(--danger)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', margin: '0 0 14px' }}>
          ⚠ Data terlalu banyak dan kepotong di batas aman server — rekap di bawah <b>cuma sebagian</b>,
          bukan keseluruhan. Data lama numpuk lintas pelatihan; pertimbangkan arsipkan/hapus data pelatihan
          yang sudah selesai di Supabase.
        </p>
      )}

      {modules.length === 0 && !busy && (
        <p className="hint">Belum ada data aktivitas sama sekali.</p>
      )}

      {/* Dua cara baca data yang sama: per modul (satu modul, semua peserta)
          atau per peserta (satu orang, semua modul yang dia buka). Yang kedua
          perlu karena satu pelatihan sering dipecah jadi beberapa SCORM. */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={view === 'modul' ? 'btn-primary btn-sm' : 'btn-sm'}
          onClick={() => setView('modul')}
        >
          Per Modul
        </button>
        <button
          className={view === 'peserta' ? 'btn-primary btn-sm' : 'btn-sm'}
          onClick={openPeserta}
        >
          Per Peserta
        </button>
        <button
          className={view === 'cocreation' ? 'btn-primary btn-sm' : 'btn-sm'}
          onClick={bukaCocreationSemua}
          title="Catatan Co-creation seluruh modul dalam satu layar"
        >
          Co-creation
        </button>
      </div>

      {view === 'modul' && (
      <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {modules.map(m => (
          <button
            key={m.module_slug}
            className={activeSlug === m.module_slug ? 'btn-primary btn-sm' : 'btn-sm'}
            onClick={() => openModule(m.module_slug)}
            title={m.kemungkinan_bentrok
              ? `⚠ ${m.judul_modul.length} modul berbeda berbagi slug ini: ${m.judul_modul.join(' / ')}`
              : `${m.rows} baris · ${m.sessions} sesi · ${m.learners} peserta`}
          >
            {m.module_slug} <span style={{ opacity: 0.7 }}>({m.sessions})</span>
            {m.kemungkinan_bentrok && <span style={{ marginLeft: 5, color: 'var(--danger)' }}>⚠</span>}
          </button>
        ))}
      </div>
      {/* Peringatan bentrok slug: satu slug isinya beberapa judul modul =
          project didaur ulang, data dua modul nyampur. Masih bisa dipisah
          lewat kolom "Modul" di tabel per sesi (tiap sesi bawa judulnya). */}
      {modules.some(m => m.kemungkinan_bentrok) && (
        <p className="hint" style={{ marginTop: -8, marginBottom: 16, color: 'var(--danger)' }}>
          ⚠ Ada slug yang dipakai beberapa modul berbeda (project didaur ulang). Datanya nyampur di bawah satu slug —
          pisahkan lewat kolom “Modul” di tabel sesi. Ke depan: bikin tiap modul lewat “+ Mulai Project Baru”.
        </p>
      )}
      </>
      )}

      {view === 'peserta' && (
        <>
          {learners.length > 0 && (() => {
            const tuntas = learners.filter(l => l.total_slide_program != null && l.jumlah_slide_unik >= l.total_slide_program).length;
            const perlu = learners.filter(perluTindakLanjut).length;
            const menit = Math.round(learners.reduce((a, l) => a + l.durasi_tatap_layar_menit, 0) / learners.length);
            return (
              <RingkasanBar butir={[
                { label: 'Peserta', nilai: String(learners.length), catatan: `${learners.reduce((a, l) => a + l.jumlah_sesi, 0)} sesi` },
                { label: 'Materi tuntas', nilai: `${tuntas}/${learners.length}`, catatan: 'semua slide dibuka' },
                { label: 'Perlu ditindaklanjuti', nilai: String(perlu), catatan: 'abai peringatan · ditinggal · gagal kuis · video', awas: perlu > 0 },
                { label: 'Rata-rata tatap layar', nilai: `${menit} m`, catatan: 'per peserta' },
              ]} />
            );
          })()}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn-sm" onClick={unduhPeserta} disabled={!learners.length}>
              ⬇ CSV rekap per peserta
            </button>
          </div>

          {busy && <p className="hint">Memuat…</p>}
          {!busy && learners.length === 0 && <p className="hint">Belum ada peserta terekam.</p>}

          {learners.length > 0 && (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Peserta', 'Modul', 'Sesi', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Articulate', 'Catatan', 'Peringatan'].map((h, i) => (
                        <th key={h} style={{ textAlign: 'left', padding: '9px 11px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)', ...(i === 0 ? TH_NAMA : {}) }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {learners.map(l => {
                      const pKey = `peringatan-peserta-${l.learner_id}`; const pOpen = expandedRows.has(pKey);
                      const vKey = `video-peserta-${l.learner_id}`; const vOpen = expandedRows.has(vKey);
                      return (
                    <Fragment key={l.learner_id}>
                      <tr style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={SEL_NAMA}>
                          <NamaPeserta nama={l.nama} nip={l.learner_id} peringatan={
                            /* Satu NIP dengan beberapa varian nama = tanda NIP
                               salah ketik / dipakai berdua. Ditandai, bukan
                               didiamkan — kalau disembunyiin, analisisnya keliru
                               tanpa ada yang sadar. */
                            l.nama_bervariasi ? (
                              <span title={`Nama bervariasi untuk NIP ini: ${l.nama_varian.join(' / ')}`}
                                    style={{ color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                            ) : null
                          } />
                        </td>
                        {/* Dulu ini DUA kolom: jumlah modul, dan daftar slug-nya di
                            ujung kanan tabel. Angkanya turunan dari daftarnya, dan
                            slug (`ikram_modul-a-x9f2`) itu identitas internal yang
                            gak dikenal manusia. Digabung jadi satu, menampilkan
                            JUDUL modul; slug cuma jadi cadangan kalau judulnya
                            belum pernah terekam. */}
                        <td style={{ padding: '8px 11px' }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_modul}</span>
                          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1, whiteSpace: 'normal', maxWidth: 190 }}>
                            {l.modul_slugs.map(slug => judulModul(slug)).join(', ')}
                          </div>
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_sesi}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.durasi_tatap_layar_menit} m</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                          {l.durasi_ditinggal_menit === null ? (
                            <span style={{ color: 'var(--text-faint)' }} title="Gak ada sesi yang session_end-nya kekirim — selisihnya gak bisa dihitung">—</span>
                          ) : (
                            <>
                              {l.durasi_ditinggal_menit} m
                              {l.durasi_ditinggal_menit > 10 && (
                                <span title="Total waktu tab dibiarkan kebuka tanpa ditatap, dijumlah lintas semua modul peserta ini"
                                      style={{ marginLeft: 5, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                              )}
                              {l.sesi_tanpa_end > 0 && (
                                <span title={`${l.sesi_tanpa_end} dari ${l.jumlah_sesi} sesi gak kehitung di sini (tab ditutup paksa) — angka ini kemungkinan kurang dari yang sebenarnya`}
                                      style={{ marginLeft: 4, color: 'var(--text-faint)', cursor: 'help' }}>*</span>
                              )}
                            </>
                          )}
                        </td>
                        {/* Angka utama = jumlah KUNJUNGAN (termasuk yang diulang balik ke
                            slide yang sama). Angka kecil di sebelahnya = berapa slide UNIK
                            yang pernah dibuka dari total slide di semua modulnya - penyusun
                            modul sering lupa modulnya ada berapa slide, jadi dikasih
                            pembanding langsung daripada angka telanjang yang gak ada artinya
                            tanpa tau totalnya. null = modul lama, belum ada data totalnya. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                          {l.total_slide_program != null
                            ? <span>{l.jumlah_slide_unik}/{l.total_slide_program}</span>
                            : <span>{l.jumlah_slide_unik}</span>}
                          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}
                               title="Termasuk slide yang dibuka berulang, dijumlah dari semua modulnya">
                            {l.jumlah_slide_dilihat} kunjungan
                          </div>
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_interaksi}</td>
                        {/* Berapa kali submit kuis GAGAL, dijumlah lintas semua modul peserta
                            ini. Bukan skor terakhir/skor gabungan (itu ambigu, gak jelas
                            gagal-lalu-lulus atau masih gagal) - dianalisis SETELAH pelatihan
                            selesai, jadi status lulus/belum sengaja gak ditampilkan. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Jumlah submit kuis yang gagal, dijumlah dari semua modul yang peserta ini kerjakan">
                            {l.kuis_gagal > 0 ? `${l.kuis_gagal}× gagal` : '—'}
                        </td>
                        {/* Knowledge Check = blok cek-paham inline yang TIDAK mengunci apa
                            pun. Benar/dijawab, dijumlah lintas semua modul. Sengaja TERPISAH
                            dari kolom Kuis biar angka gagal-kuis tetap bersih. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Knowledge check (cek paham, tidak mengunci): jawaban benar / total dijawab, dari semua modulnya">
                          {l.kc_dijawab > 0 ? `${l.kc_benar}/${l.kc_dijawab} benar` : '—'}
                        </td>
                        {/* Video (upload + YouTube - Instagram gak mungkin diamati, lihat
                            catatan generator.py): "dimulai" = berapa video yang DIKLIK PLAY
                            minimal sekali (BUKAN "selesai ditonton" - gampang kebaca salah
                            kalau dibaca cepat, mis. "4/4" kelihatan kayak "4 dari 4 kelar"),
                            dari total video di semua modulnya. rata² = rata-rata seberapa
                            jauh video yang dimulai itu ditonton ("titik terjauh dicapai /
                            durasi"). — kalau modulnya emang gak punya video. ⚠ = rata-rata
                            di bawah 20%. Klik buat lihat rincian PER video (rata-rata bisa
                            nyembunyiin satu video yang gak ditonton sama sekali di antara
                            yang lain ditonton penuh). */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Video (upload + YouTube) yang DIKLIK PLAY / total video di semua modulnya, dan rata-rata seberapa jauh ditonton">
                          {!l.total_video_program ? (
                            <span style={{ color: 'var(--text-faint)' }}>—</span>
                          ) : l.video_dimulai > 0 ? (
                            <button onClick={() => toggleRow(vKey)}
                                    style={{ font: 'inherit', fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline dotted' }}
                                    title="Klik untuk lihat persentase tiap video">
                              {l.video_dimulai}/{l.total_video_program} diklik · {l.video_rata_persen}%
                              {(l.video_rata_persen ?? 0) < 20 && (
                                <span title="Rata-rata ditonton di bawah 20% - kemungkinan video dibuka lalu langsung ditinggal"
                                      style={{ marginLeft: 4, color: 'var(--danger)' }}>⚠</span>
                              )}
                              {' '}<span style={{ fontSize: 10 }}>{vOpen ? '▾' : '▸'}</span>
                            </button>
                          ) : (
                            <>0/{l.total_video_program} diklik</>
                          )}
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Paket Articulate 360 yang dilaporkan SELESAI oleh paketnya sendiri / total paket di semua modulnya">
                          {!l.total_articulate_program ? (
                            <span style={{ color: 'var(--text-faint)' }}>—</span>
                          ) : (
                            <>{l.articulate_selesai}/{l.total_articulate_program} selesai</>
                          )}
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Catatan Co-creation yang masih tersimpan (yang sudah dihapus tidak dihitung), digabung dari semua modulnya">
                          {l.catatan ? l.catatan : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                        </td>
                        {/* Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat
                            sebelum kuis, dijumlah lintas semua modul. Angka utama = total
                            peringatan yang MUNCUL (termasuk yang ditindaklanjuti dengan baca
                            ulang) - "(n diabaikan)" adalah SUBSET dari angka itu yang tetap
                            pilih "Yakin, lanjut ke kuis". Ditulis sebagai pecahan eksplisit
                            (bukan cuma ikon ⚠) karena "3× ⚠" ambigu: gak kelihatan apakah
                            3-3nya diabaikan atau cuma 1 dari 3. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat sebelum kuis (dari semua modulnya)">
                          {l.peringatan_baca_cepat > 0 ? (
                            <button onClick={() => toggleRow(pKey)}
                                    style={{ font: 'inherit', fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline dotted' }}
                                    title="Klik untuk lihat slide mana saja yang ketangkap">
                              {l.peringatan_baca_cepat}× <span style={{ fontSize: 10 }}>{pOpen ? '▾' : '▸'}</span>
                            </button>
                          ) : '—'}
                          {l.peringatan_diabaikan > 0 && (
                            <span title={`${l.peringatan_diabaikan} dari ${l.peringatan_baca_cepat} peringatan itu tetap dipilih "lanjut ke kuis" tanpa baca ulang`}
                                  style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>
                              ({l.peringatan_diabaikan} diabaikan)
                            </span>
                          )}
                        </td>

                      </tr>
                      {vOpen && l.video_detail.length > 0 && (
                        <tr style={{ borderTop: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
                          <td colSpan={13}><VideoRincian detail={l.video_detail} /></td>
                        </tr>
                      )}
                      {pOpen && l.peringatan_detail.length > 0 && (
                        <tr style={{ borderTop: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
                          <td colSpan={13}><PeringatanRincian detail={l.peringatan_detail} /></td>
                        </tr>
                      )}
                    </Fragment>
                    ); })}
                  </tbody>
                </table>
              </div>
              {learners.some(l => l.nama_bervariasi) && (
                <p className="hint" style={{ marginTop: 10 }}>
                  ⚠ (Peserta) = satu NIP tercatat dengan beberapa nama berbeda. Biasanya cuma beda cara ngetik,
                  tapi bisa juga tanda NIP salah ketik atau dipakai dua orang — cek dulu sebelum dipakai analisis.
                </p>
              )}
              {learners.some(l => l.sesi_tanpa_end > 0) && (
                <p className="hint" style={{ marginTop: 4 }}>
                  * (Ditinggal) = sebagian sesi peserta ini gak ikut kehitung (tab ditutup paksa, session_end gak sempat kekirim) — angkanya kemungkinan kurang dari yang sebenarnya.
                </p>
              )}
            </>
          )}
        </>
      )}

      {view === 'modul' && activeSlug && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button className={modulTab === 'sesi' ? 'btn-primary btn-sm' : 'btn-sm'}
                    onClick={() => setModulTab('sesi')}>
              Aktivitas per sesi
            </button>
            <button className={modulTab === 'cocreation' ? 'btn-primary btn-sm' : 'btn-sm'}
                    onClick={bukaCocreation}
                    title="Catatan Co-creation peserta, dikelompokkan per slide">
              Catatan Co-creation
            </button>
          </div>

          {modulTab === 'sesi' && (<>
          {sessions.length > 0 && (() => {
            const nip = (x: ActivitySession) => x.learner_id || `?${x.session_id}`;
            const peserta = new Set(sessions.map(nip));
            // Digabung per PESERTA dulu, bukan per baris: satu orang bisa punya
            // beberapa sesi, dan menghitung per baris bikin yang mengulang
            // kelihatan seperti beberapa orang berbeda.
            const tuntas = new Set(sessions.filter(x => x.total_slide != null && x.jumlah_slide_unik >= x.total_slide).map(nip));
            const perlu = new Set(sessions.filter(perluTindakLanjut).map(nip));
            const menit = Math.round(sessions.reduce((a, x) => a + x.durasi_tatap_layar_menit, 0) / peserta.size);
            return (
              <RingkasanBar butir={[
                { label: 'Peserta', nilai: String(peserta.size), catatan: `${sessions.length} sesi` },
                { label: 'Materi tuntas', nilai: `${tuntas.size}/${peserta.size}`, catatan: 'semua slide dibuka' },
                { label: 'Perlu ditindaklanjuti', nilai: String(perlu.size), catatan: 'abai peringatan · ditinggal · gagal kuis · video', awas: perlu.size > 0 },
                { label: 'Rata-rata tatap layar', nilai: `${menit} m`, catatan: 'per peserta' },
              ]} />
            );
          })()}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn-sm" onClick={unduhRingkasan} disabled={!sessions.length}>
              ⬇ CSV ringkasan per sesi
            </button>
            <button className="btn-sm" onClick={unduhMentah} disabled={busy || demoMode}
                    title={demoMode ? 'Gak tersedia di Mode Contoh - data mentah cuma ada di Supabase asli' : undefined}>
              ⬇ CSV mentah (semua event)
            </button>
          </div>

          {busy && <p className="hint">Memuat…</p>}

          {!busy && sessions.length === 0 && <p className="hint">Belum ada sesi terekam di modul ini.</p>}

          {sessions.length > 0 && (() => {
            // Kolom "Modul" cuma muncul kalau slug ini kecampuran beberapa
            // judul modul (project didaur ulang) - buat kasus normal, kolom
            // ini cuma nambah kebisingan.
            const bentrok = !!modules.find(m => m.module_slug === activeSlug)?.kemungkinan_bentrok;
            const kolom = bentrok
              ? ['Peserta', 'Modul', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Articulate', 'Catatan', 'Peringatan']
              : ['Peserta', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Articulate', 'Catatan', 'Peringatan'];
            // Sumber identitas ('scorm' / 'manual') itu keterangan DIAGNOSTIK,
            // bukan angka belajar. Di LMS beneran identitas selalu datang dari
            // SCORM, jadi kolomnya berisi nilai yang sama persis di setiap baris
            // = nol informasi tapi makan tempat permanen. Cuma dimunculkan kalau
            // isinya BERCAMPUR - dan campurnya sendiri yang jadi temuan (sebagian
            // peserta ngetik NIP sendiri, yang belum tentu sama dengan ID LMS).
            // Pola yang sama dipakai kolom "Modul" di atas.
            const sumberBervariasi = new Set(sessions.map(x => x.identity_source || '—')).size > 1;
            if (sumberBervariasi) kolom.splice(bentrok ? 2 : 1, 0, 'Sumber');
            return (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {kolom.map((h, i) => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 11px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)', ...(i === 0 ? TH_NAMA : {}) }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const pKey = `peringatan-sesi-${s.session_id}`; const pOpen = expandedRows.has(pKey);
                    const vKey = `video-sesi-${s.session_id}`; const vOpen = expandedRows.has(vKey);
                    return (
                    <Fragment key={s.session_id}>
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={SEL_NAMA}><NamaPeserta nama={s.learner_name} nip={s.learner_id} /></td>
                      {bentrok && <td style={{ padding: '8px 11px' }}>{s.module_title || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>}
                      {/* Cuma muncul kalau sumbernya bercampur — lihat alasannya
                          di tempat `sumberBervariasi` dihitung. 'scorm' artinya
                          ID dari LMS dan BELUM TENTU NIP; 'manual' artinya NIP
                          diketik peserta sendiri. */}
                      {sumberBervariasi && (
                        <td style={{ padding: '8px 11px' }}>
                          <span style={{ fontSize: 11, color: s.identity_source === 'scorm' ? 'var(--success)' : 'var(--text-faint)' }}>
                            {s.identity_source || '—'}
                          </span>
                        </td>
                      )}
                      {/* Tanpa detik: tabel ini dibaca setelah pelatihan selesai,
                          presisi sampai detik gak pernah punya arti di situ. */}
                      <td style={{ padding: '8px 11px', whiteSpace: 'nowrap' }}>
                        {new Date(s.mulai).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      {/* Tatap layar (durasi_tatap_layar_menit) dipakai sebagai
                          durasi utama, BUKAN durasi_menit total: peserta yang
                          tab-nya dibiarkan kebuka sambil ditinggal lama akan
                          keliatan durasi total-nya besar padahal gak natap
                          sama sekali - itu bikin dia keliatan paling rajin
                          padahal sebaliknya. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.durasi_tatap_layar_menit} m</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                        {s.durasi_ditinggal_menit === null ? (
                          <span style={{ color: 'var(--text-faint)' }} title="session_end gak pernah kekirim (tab ditutup paksa) — selisihnya gak bisa dihitung, BUKAN berarti gak pernah ditinggal">—</span>
                        ) : (
                          <>
                            {s.durasi_ditinggal_menit} m
                            {s.durasi_ditinggal_menit > 10 && (
                              <span title="Tab ini dibiarkan kebuka lama tanpa ditatap — kemungkinan peserta pergi sambil modulnya nyala"
                                    style={{ marginLeft: 5, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                            )}
                          </>
                        )}
                      </td>
                      {/* Angka utama = jumlah KUNJUNGAN (termasuk yang diulang balik ke
                          slide yang sama - itu SENGAJA, tanda bolak-balik/kebingungan).
                          Angka kecil = slide UNIK yang dibuka dari total slide modul ini -
                          penyusun modul sering lupa modulnya ada berapa slide, jadi
                          dikasih pembanding langsung. null = modul lama, export sebelum
                          fitur ini ada. */}
                      {/* Dulu ditulis "96(94/95)" — tiga angka tanpa label sama
                          sekali, pembaca harus hafal posisi mana artinya apa.
                          Sekarang yang jadi angka UTAMA adalah pertanyaan yang
                          sebenarnya dicari ("berapa slide yang dia buka dari
                          total"), dan jumlah kunjungan turun jadi keterangan
                          kecil yang diberi kata. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                        {s.total_slide != null
                          ? <span>{s.jumlah_slide_unik}/{s.total_slide}</span>
                          : <span>{s.jumlah_slide_unik}</span>}
                        <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}
                             title="Termasuk slide yang dibuka berulang — bolak-balik ke slide yang sama ikut dihitung">
                          {s.jumlah_slide_dilihat} kunjungan
                        </div>
                      </td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.jumlah_interaksi}</td>
                      {/* Berapa kali submit kuis GAGAL (lulus:false) di modul ini - BUKAN
                          skor gabungan semua percobaan (mis. "7/10" dari 2 percobaan beda
                          gak jelas artinya apa) dan BUKAN dari klik tombol Ulangi (yang
                          kelewat peserta yang gagal lalu nyerah tanpa pernah klik ulangi).
                          Status lulus/belum sengaja gak ditampilkan - datanya dibaca
                          SETELAH pelatihan selesai, bukan saat masih berjalan. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Jumlah submit kuis yang gagal di modul ini">
                        {s.kuis_gagal > 0 ? `${s.kuis_gagal}× gagal` : '—'}
                      </td>
                      {/* Knowledge check (blok cek-paham inline, TIDAK mengunci): jawaban
                          benar / total dijawab di modul ini. Terpisah dari kolom Kuis. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Knowledge check (cek paham, tidak mengunci): jawaban benar / total dijawab di modul ini">
                        {s.kc_dijawab > 0 ? `${s.kc_benar}/${s.kc_dijawab} benar` : '—'}
                      </td>
                      {/* Video (upload + YouTube - Instagram gak mungkin diamati): "dimulai" =
                          berapa video yang DIKLIK PLAY minimal sekali (BUKAN "selesai
                          ditonton" - "4/4" gampang kebaca salah sebagai "4 dari 4 kelar"),
                          dari total video di modul ini. rata² = rata-rata seberapa jauh yang
                          dimulai itu ditonton (titik terjauh dicapai / durasi). — kalau modul
                          ini emang gak punya video. ⚠ = rata-rata di bawah 20%. Klik buat
                          lihat rincian PER video - rata-rata bisa nyembunyiin satu video yang
                          gak ditonton sama sekali di antara yang lain ditonton penuh. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Video (upload + YouTube) yang DIKLIK PLAY / total video di modul ini, dan rata-rata seberapa jauh ditonton">
                        {!s.total_video ? (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        ) : s.video_dimulai > 0 ? (
                          <button onClick={() => toggleRow(vKey)}
                                  style={{ font: 'inherit', fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline dotted' }}
                                  title="Klik untuk lihat persentase tiap video">
                            {s.video_dimulai}/{s.total_video} diklik · {s.video_rata_persen}%
                            {(s.video_rata_persen ?? 0) < 20 && (
                              <span title="Rata-rata ditonton di bawah 20% - kemungkinan video dibuka lalu langsung ditinggal"
                                    style={{ marginLeft: 4, color: 'var(--danger)' }}>⚠</span>
                            )}
                            {' '}<span style={{ fontSize: 10 }}>{vOpen ? '▾' : '▸'}</span>
                          </button>
                        ) : (
                          <>0/{s.total_video} diklik</>
                        )}
                      </td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Paket Articulate 360 yang dilaporkan SELESAI oleh paketnya sendiri / total paket di modul ini">
                        {!s.total_articulate ? (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        ) : (
                          <>{s.articulate_selesai}/{s.total_articulate} selesai</>
                        )}
                      </td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Catatan Co-creation yang ditulis atau diubah di sesi ini">
                        {s.catatan ? s.catatan : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                      {/* Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat
                          (< 50% waktu baca minimum Brysbaert) sebelum percobaan kuis
                          pertama bagian itu. Angka utama = total peringatan yang MUNCUL
                          (termasuk yang ditindaklanjuti dengan baca ulang) - "(n diabaikan)"
                          adalah SUBSET yang tetap pilih "Yakin, lanjut ke kuis" (bukan
                          "Kembali, pelajari lagi"). Dieja eksplisit karena "3× ⚠" ambigu
                          soal berapa dari 3 itu yang beneran diabaikan. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat sebelum kuis, di modul ini">
                        {s.peringatan_baca_cepat > 0 ? (
                          <button onClick={() => toggleRow(pKey)}
                                  style={{ font: 'inherit', fontVariantNumeric: 'tabular-nums', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline dotted' }}
                                  title="Klik untuk lihat slide mana saja yang ketangkap">
                            {s.peringatan_baca_cepat}× <span style={{ fontSize: 10 }}>{pOpen ? '▾' : '▸'}</span>
                          </button>
                        ) : '—'}
                        {s.peringatan_diabaikan > 0 && (
                          <span title={`${s.peringatan_diabaikan} dari ${s.peringatan_baca_cepat} peringatan itu tetap dipilih "lanjut ke kuis" tanpa baca ulang`}
                                style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>
                            ({s.peringatan_diabaikan} diabaikan)
                          </span>
                        )}
                      </td>
                    </tr>
                    {vOpen && s.video_detail.length > 0 && (
                      <tr style={{ borderTop: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
                        <td colSpan={kolom.length}><VideoRincian detail={s.video_detail} /></td>
                      </tr>
                    )}
                    {pOpen && s.peringatan_detail.length > 0 && (
                      <tr style={{ borderTop: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
                        <td colSpan={kolom.length}><PeringatanRincian detail={s.peringatan_detail} /></td>
                      </tr>
                    )}
                    </Fragment>
                  ); })}
                </tbody>
              </table>
            </div>
            );
          })()}
          </>)}

          {modulTab === 'cocreation' && (
            <>
              {busy && <p className="hint">Memuat…</p>}
              {!busy && cocreation.length === 0 && (
                <p className="hint">
                  Belum ada catatan Co-creation di modul ini. Catatan baru muncul di sini kalau modulnya
                  di-export dengan Co-creation <b>dan</b> “Rekam aktivitas peserta” sama-sama aktif —
                  tanpa perekaman, catatan peserta cuma tersimpan di perangkatnya sendiri.
                </p>
              )}
              {cocreation.length > 0 && (
                <>
                  <p className="hint" style={{ marginBottom: 12 }}>
                    Disusun mengikuti alur materi.
                    {cocreation[0].slide_terramai && cocreation[0].slide_terramai!.jumlah_catatan > 1 && (
                      <> Paling banyak dicatat: <b>{cocreation[0].slide_terramai!.judul}</b>{' '}
                      ({cocreation[0].slide_terramai!.jumlah_catatan} catatan).</>
                    )}
                  </p>
                  {cocreation.map(m => (
                    <CocreationModulView key={m.module_slug} m={m} tampilkanJudulModul={false} />
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}

      {view === 'cocreation' && (
        <>
          {busy && <p className="hint">Memuat…</p>}
          {!busy && cocreationAll.length === 0 && (
            <p className="hint">
              Belum ada catatan Co-creation di modul mana pun. Catatan baru muncul di sini kalau modulnya
              di-export dengan Co-creation <b>dan</b> “Rekam aktivitas peserta” sama-sama aktif — tanpa
              perekaman, catatan peserta cuma tersimpan di perangkatnya sendiri.
            </p>
          )}
          {cocreationAll.length > 0 && (
            <>
              <p className="hint" style={{ marginBottom: 16 }}>
                Seluruh modul dalam satu layar, urut alur pelatihan.
              </p>
              {cocreationAll.map(m => (
                <CocreationModulView key={m.module_slug} m={m} tampilkanJudulModul={true} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
