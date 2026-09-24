import { Fragment, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PanduanCC, PeringatanDetail, VideoDetail } from '../api';
import { RingkasanBar, perluTindakLanjut, WADAH_TABEL, TH_ATAS, TH_NAMA, SEL_NAMA, NamaPeserta, PeringatanRincian, VideoRincian } from './ccTabel';

/* Panduan cara baca dalam bentuk TABELNYA SENDIRI: tabel Command Center
   dengan data karangan, dan tiap bagian yang perlu dipelajari bisa diklik.
   Alasannya: penjelasan kolom yang dibaca terpisah dari tabelnya harus
   diterjemahkan dulu ke "yang mana itu di layar" - dan di situ salah bacanya
   terjadi. Di sini penjelasan menempel langsung ke angka yang dijelaskan.

   Pembagian isi:
   - Arti / kenapa / kapan curiga diambil dari isi panduan (bisa disunting).
   - Kalimat "Di contoh ini" milik kode, karena menjelaskan angka karangan di
     bawah - kalau datanya diubah, kalimatnya WAJIB ikut diubah.
   Gaya sel diambil dari ccTabel.tsx yang juga dipakai tabel aslinya, supaya
   replika ini tidak diam-diam tertinggal bentuknya. */

type Tampilan = 'modul' | 'peserta';

interface Titik {
  label: string;
  contoh?: string;
  kolom?: string;        // nama kolom di isi panduan
  keputusan?: string;    // potongan judul keputusan di isi panduan
}

// ---------- Data karangan: Per Modul (satu baris = satu sesi) ----------

interface SesiContoh {
  id: string; nama: string; nip: string; mulai: string;
  tatap: number; durasi_ditinggal_menit: number | null;
  unik: number; kunjungan: number; interaksi: number;
  kuis_gagal: number; kc_benar: number; kc_dijawab: number;
  video_dimulai: number; video_rata_persen: number | null; video_detail: VideoDetail[];
  art: number; catatan: number;
  peringatan: number; peringatan_diabaikan: number; peringatan_detail: PeringatanDetail[];
}

const TOTAL_SLIDE = 40, TOTAL_VIDEO = 2, TOTAL_ART = 1;

const SESI: SesiContoh[] = [
  {
    id: 'siti', nama: 'Siti Amara', nip: '198801052012052411', mulai: '2026-07-20T02:00:00Z',
    tatap: 54, durasi_ditinggal_menit: 2, unik: 40, kunjungan: 43, interaksi: 21,
    kuis_gagal: 0, kc_benar: 5, kc_dijawab: 6,
    video_dimulai: 2, video_rata_persen: 91, video_detail: [{ slide: 6, persen: 88 }, { slide: 19, persen: 94 }],
    art: 1, catatan: 3, peringatan: 0, peringatan_diabaikan: 0, peringatan_detail: [],
  },
  {
    id: 'rahmat', nama: 'Rahmat Wijaya', nip: '199203152015031005', mulai: '2026-07-20T03:10:00Z',
    tatap: 38, durasi_ditinggal_menit: 14, unik: 31, kunjungan: 58, interaksi: 4,
    kuis_gagal: 2, kc_benar: 3, kc_dijawab: 6,
    video_dimulai: 2, video_rata_persen: 12,
    video_detail: [{ slide: 6, persen: 5, skip: true }, { slide: 19, persen: 19, rate: 2 }],
    art: 0, catatan: 0, peringatan: 2, peringatan_diabaikan: 1,
    peringatan_detail: [{ section: 'a', slides: [3, 4, 5], choice: 'kembali' }, { section: 'b', slides: [17, 18], choice: 'yakin' }],
  },
  {
    id: 'fajar', nama: 'Fajar Nugroho', nip: '199507212019021003', mulai: '2026-07-20T06:45:00Z',
    tatap: 22, durasi_ditinggal_menit: null, unik: 18, kunjungan: 18, interaksi: 2,
    kuis_gagal: 0, kc_benar: 0, kc_dijawab: 0,
    video_dimulai: 0, video_rata_persen: null, video_detail: [],
    art: 0, catatan: 0, peringatan: 0, peringatan_diabaikan: 0, peringatan_detail: [],
  },
];

// ---------- Data karangan: Per Peserta (satu baris = satu orang) ----------

interface NilaiContoh { judul: string; nilai: number | null; lulus: boolean }   // nilai null = semua kuisnya gerbang

interface PesertaContoh extends Omit<SesiContoh, 'mulai' | 'unik' | 'kunjungan'> {
  varian: string[]; modul: string[]; nilai: NilaiContoh[]; sesi: number; sesi_tanpa_end: number;
  unik: number; total_slide: number; kunjungan: number; total_video: number; total_art: number;
}

const MODUL_A = 'Dasar Penganggaran', MODUL_B = 'Pelaporan Keuangan';

const PESERTA: PesertaContoh[] = [
  {
    id: 'siti', nama: 'Siti Amara', nip: '198801052012052411', varian: [],
    modul: [MODUL_A, MODUL_B], nilai: [{ judul: MODUL_A, nilai: 90, lulus: true }, { judul: MODUL_B, nilai: null, lulus: true }],
    sesi: 2, sesi_tanpa_end: 0, tatap: 97, durasi_ditinggal_menit: 3,
    unik: 70, total_slide: 70, kunjungan: 76, interaksi: 34, kuis_gagal: 0, kc_benar: 9, kc_dijawab: 10,
    video_dimulai: 3, total_video: 3, video_rata_persen: 90,
    video_detail: [{ modul: MODUL_A, slide: 6, persen: 88 }, { modul: MODUL_A, slide: 19, persen: 90 }, { modul: MODUL_B, slide: 4, persen: 92 }],
    art: 1, total_art: 1, catatan: 5, peringatan: 0, peringatan_diabaikan: 0, peringatan_detail: [],
  },
  {
    id: 'dewi', nama: 'Dewi Anggraini', nip: '198611202010012002', varian: ['Dewi Anggraini', 'dewi anggraeni'],
    modul: [MODUL_A, MODUL_B], nilai: [{ judul: MODUL_A, nilai: 60, lulus: false }, { judul: MODUL_B, nilai: null, lulus: true }],
    sesi: 3, sesi_tanpa_end: 1, tatap: 71, durasi_ditinggal_menit: 6,
    unik: 64, total_slide: 70, kunjungan: 80, interaksi: 12, kuis_gagal: 1, kc_benar: 6, kc_dijawab: 10,
    video_dimulai: 3, total_video: 3, video_rata_persen: 72,
    video_detail: [{ modul: MODUL_A, slide: 6, persen: 35 }, { modul: MODUL_A, slide: 19, persen: 80, rate: 2 }, { modul: MODUL_B, slide: 4, persen: 100 }],
    art: 1, total_art: 1, catatan: 1, peringatan: 1, peringatan_diabaikan: 0,
    peringatan_detail: [{ modul: MODUL_A, section: 'a', slides: [3, 4], choice: 'kembali' }],
  },
  {
    id: 'rahmat', nama: 'Rahmat Wijaya', nip: '199203152015031005', varian: [],
    modul: [MODUL_A], nilai: [{ judul: MODUL_A, nilai: 40, lulus: false }],
    sesi: 2, sesi_tanpa_end: 0, tatap: 45, durasi_ditinggal_menit: 19,
    unik: 31, total_slide: 40, kunjungan: 58, interaksi: 4, kuis_gagal: 2, kc_benar: 3, kc_dijawab: 6,
    video_dimulai: 2, total_video: 2, video_rata_persen: 12,
    video_detail: [{ modul: MODUL_A, slide: 6, persen: 5, skip: true }, { modul: MODUL_A, slide: 19, persen: 19, rate: 2 }],
    art: 0, total_art: 1, catatan: 0, peringatan: 2, peringatan_diabaikan: 1,
    peringatan_detail: [{ modul: MODUL_A, section: 'a', slides: [3, 4, 5], choice: 'kembali' }, { modul: MODUL_A, section: 'b', slides: [17, 18], choice: 'yakin' }],
  },
];

// ---------- Bagian yang bisa diklik, berurutan sesuai tur ----------

const H = (kolom: string): Titik => ({ label: `Kolom ${kolom}`, kolom });

const TITIK_MODUL: [string, Titik][] = [
  ['tampilan', { label: 'Per Modul / Per Peserta', keputusan: 'Per Modul',
    contoh: 'Sekarang terbuka Per Modul: satu baris = satu SESI di satu modul. Coba klik "Per Peserta" untuk melihat data yang sama digabung per orang.' }],
  ['rk-peserta', { label: 'Kotak "Peserta"', kolom: 'Peserta',
    contoh: '3 peserta dari 3 sesi. Dihitung per NIP, bukan per baris: orang yang membuka modul dua kali muncul dua baris di tabel, tapi tetap 1 peserta di sini.' }],
  ['rk-tuntas', { label: 'Kotak "Materi tuntas"', kolom: 'Slide',
    contoh: '1/3 - hanya Siti yang pernah membuka ke-40 slide. Rahmat 31/40, Fajar 18/40.' }],
  ['rk-perlu', { label: 'Kotak "Perlu ditindaklanjuti"', keputusan: 'ditindaklanjuti',
    contoh: '1 = Rahmat (Ditinggal 14 m, 2× gagal kuis, video 12%, 1 peringatan diabaikan). Fajar TIDAK terhitung: Ditinggal-nya "—" (tidak bisa dihitung), bukan angka di atas 10.' }],
  ['rk-tatap', { label: 'Kotak "Rata-rata tatap layar"', kolom: 'Tatap Layar',
    contoh: '(54 + 38 + 22) ÷ 3 peserta = 38 m. Rata-rata per PESERTA, bukan per sesi.' }],
  ['h-Peserta', H('Peserta')],
  ['c-nip', { label: 'Angka kecil di bawah nama', kolom: 'Peserta',
    contoh: '198801052012052411 adalah NIP Siti. Kolom nama ini dikunci: tetap kelihatan waktu tabel digeser ke kanan.' }],
  ['h-Mulai', H('Mulai')],
  ['h-Tatap Layar', H('Tatap Layar')],
  ['c-tatap-siti', { label: 'Tatap Layar Siti: 54 m', keputusan: 'Batas',
    contoh: '54 menit modul ada di depan mata Siti dengan gerakan mouse/gulir. Itu bukti perilaku di layar, belum bukti paham.' }],
  ['h-Ditinggal', H('Ditinggal')],
  ['c-ditinggal-rahmat', { label: 'Ditinggal Rahmat: 14 m ⚠', kolom: 'Ditinggal',
    contoh: 'Tab Rahmat terbuka 14 menit tanpa ditatap - lewat ambang 10 menit, jadi diberi ⚠.' }],
  ['c-ditinggal-fajar', { label: 'Ditinggal Fajar: "—"', keputusan: '—',
    contoh: 'Fajar menutup tab paksa, penutup sesinya tidak terkirim. "—" di sini artinya TIDAK TAHU, bukan "tidak pernah ditinggal".' }],
  ['h-Slide', H('Slide')],
  ['c-slide-siti', { label: 'Slide Siti: 40/40 · 43 kunjungan', kolom: 'Slide',
    contoh: 'Semua 40 slide pernah dibuka; 3 kunjungan tambahan = sesekali kembali ke slide yang sama. Pola wajar.' }],
  ['c-slide-rahmat', { label: 'Slide Rahmat: 31/40 · 58 kunjungan', kolom: 'Slide',
    contoh: '9 slide tidak pernah dibuka, tapi kunjungannya 58 - hampir dua kali slide yang dibuka. Banyak bolak-balik: bingung, atau mencari jawaban kuis.' }],
  ['h-Interaksi', H('Interaksi')],
  ['c-interaksi-rahmat', { label: 'Interaksi Rahmat: 4', kolom: 'Interaksi',
    contoh: 'Bandingkan dengan Siti (21) di modul yang sama: isi tersembunyi (accordion, tab, alur) hampir tidak dibuka.' }],
  ['h-Kuis', H('Kuis')],
  ['c-kuis-rahmat', { label: 'Kuis Rahmat: 2× gagal', kolom: 'Kuis',
    contoh: 'Dua kali submit kuis dan gagal. Kolom ini tidak menunjukkan apakah akhirnya lulus - lihat Nilai per Modul di tab Per Peserta.' }],
  ['c-kuis-siti', { label: 'Kuis Siti: "—"', keputusan: '—',
    contoh: 'Di kolom Kuis, "—" berarti tidak pernah gagal. Beda arti dengan "—" di kolom Ditinggal.' }],
  ['h-Knowledge Check', H('Knowledge Check')],
  ['h-Video', H('Video')],
  ['c-video-rahmat', { label: 'Video Rahmat: 2/2 diklik · 12% ⚠', kolom: 'Video',
    contoh: '"2/2 diklik" artinya kedua video pernah di-PLAY, BUKAN selesai ditonton. Rata-rata cuma sampai 12%. Klik angkanya di tabel asli untuk rincian per video.' }],
  ['r-video-rahmat', { label: 'Rincian video Rahmat', kolom: 'Video',
    contoh: '⏭ dilewat = bagian yang belum pernah dilihat langsung dilompati. ⚡ dipercepat = ditonton di atas kecepatan normal (di sini 2×) saat pertama kali. Keduanya membuat peserta masuk "Perlu ditindaklanjuti" walau persennya tinggi.' }],
  ['c-video-fajar', { label: 'Video Fajar: 0/2 diklik', kolom: 'Video',
    contoh: 'Modul punya 2 video, Fajar tidak membuka satu pun. Beda dengan "—" yang berarti modulnya memang tidak punya video.' }],
  ['h-Articulate', H('Articulate')],
  ['h-Catatan', H('Catatan')],
  ['h-Peringatan', H('Peringatan')],
  ['c-peringatan-rahmat', { label: 'Peringatan Rahmat: 2× (1 diabaikan)', kolom: 'Peringatan',
    contoh: '2 kali ketahuan membalik slide terlalu cepat. 1 kali ia kembali membaca, 1 kali tetap memilih lanjut ke kuis. Yang merah hanya yang diabaikan.' }],
  ['r-peringatan-rahmat', { label: 'Rincian peringatan Rahmat', kolom: 'Peringatan',
    contoh: 'Section A slide 3-5: kembali membaca (hijau, tidak masalah). Section B slide 17-18: diabaikan, tetap lanjut (merah).' }],
  ['c-uji', { label: 'Tombol "tandai uji"', keputusan: 'uji',
    contoh: 'Di tabel asli tiap baris punya tombol ini. Dipakai untuk sesi coba-coba penyusun supaya tidak ikut direkap. Bisa dibatalkan.' }],
];

const TITIK_PESERTA: [string, Titik][] = [
  ['tampilan', { label: 'Per Modul / Per Peserta', keputusan: 'Per Modul',
    contoh: 'Sekarang terbuka Per Peserta: satu baris = satu ORANG, angkanya dijumlah dari semua modul yang ia buka.' }],
  ['rk-peserta', { label: 'Kotak "Peserta"', kolom: 'Peserta', contoh: '3 orang, 7 sesi di antara mereka.' }],
  ['rk-tuntas', { label: 'Kotak "Materi tuntas"', kolom: 'Slide',
    contoh: '1/3 - hanya Siti yang membuka semua slide di semua modulnya (70/70).' }],
  ['rk-perlu', { label: 'Kotak "Perlu ditindaklanjuti"', keputusan: 'ditindaklanjuti',
    contoh: '2 = Dewi (1× gagal kuis, 1 video dipercepat) dan Rahmat (Ditinggal 19 m, gagal kuis, video 12%, peringatan diabaikan). Dewi terhitung walau rata-rata videonya 72%: satu video dipercepat sudah cukup.' }],
  ['rk-tatap', { label: 'Kotak "Rata-rata tatap layar"', kolom: 'Tatap Layar', contoh: '(97 + 71 + 45) ÷ 3 = 71 m.' }],
  ['h-Peserta', H('Peserta')],
  ['c-nama-dewi', { label: 'Tanda ⚠ di samping Dewi', kolom: 'Peserta',
    contoh: 'NIP Dewi tercatat dengan dua nama: "Dewi Anggraini" dan "dewi anggraeni". Kemungkinan cuma beda ketik - tapi cek dulu sebelum dipakai analisis.' }],
  ['h-Modul', H('Modul')],
  ['h-Nilai per Modul', H('Nilai per Modul')],
  ['c-nilai-dewi', { label: 'Nilai Dewi', kolom: 'Nilai per Modul',
    contoh: `${MODUL_A}: 60, BELUM lulus. ${MODUL_B}: ✓ LEWAT - kuis modul itu semuanya gerbang, jadi tidak ada angka nilai.` }],
  ['h-Sesi', H('Sesi')],
  ['h-Tatap Layar', H('Tatap Layar')],
  ['h-Ditinggal', H('Ditinggal')],
  ['c-ditinggal-dewi', { label: 'Ditinggal Dewi: 6 m *', kolom: 'Ditinggal',
    contoh: '1 dari 3 sesi Dewi ditutup paksa dan tidak bisa dihitung. 6 m adalah jumlah dari 2 sesi sisanya - nilai sebenarnya bisa lebih besar.' }],
  ['c-ditinggal-rahmat', { label: 'Ditinggal Rahmat: 19 m ⚠', kolom: 'Ditinggal',
    contoh: 'Dijumlah dari 2 sesinya. Lewat 10 menit, jadi ⚠.' }],
  ['h-Slide', H('Slide')],
  ['h-Interaksi', H('Interaksi')],
  ['h-Kuis', H('Kuis')],
  ['h-Knowledge Check', H('Knowledge Check')],
  ['h-Video', H('Video')],
  ['c-video-dewi', { label: 'Video Dewi: 3/3 · 72%', kolom: 'Video',
    contoh: 'Rata-rata 72% kelihatan aman, tanpa ⚠. Buka rinciannya: satu video cuma 35%, satu lagi dipercepat 2×. Rata-rata bisa menyembunyikan video yang bermasalah.' }],
  ['r-video-dewi', { label: 'Rincian video Dewi', kolom: 'Video',
    contoh: 'Diurutkan per video, lengkap dengan modul asalnya. Bar merah < 20%, hijau ≥ 80%.' }],
  ['h-Articulate', H('Articulate')],
  ['h-Catatan', H('Catatan')],
  ['h-Peringatan', H('Peringatan')],
  ['c-peringatan-dewi', { label: 'Peringatan Dewi: 1×', kolom: 'Peringatan',
    contoh: 'Dewi pernah diperingatkan sekali, lalu kembali membaca. Tanpa "(diabaikan)" berarti peringatannya berhasil - bukan sinyal masalah.' }],
];

export default function PanduanTabel({ isi, bawaan }: { isi: PanduanCC; bawaan: PanduanCC }) {
  const [tampilan, setTampilan] = useState<Tampilan>('modul');
  const [pilih, setPilih] = useState<string | null>(null);
  const [dilihat, setDilihat] = useState<Set<string>>(new Set());
  const [buka, setBuka] = useState<Set<string>>(new Set());

  const daftar = tampilan === 'modul' ? TITIK_MODUL : TITIK_PESERTA;
  const peta = new Map(daftar);
  const idx = pilih ? daftar.findIndex(([id]) => id === pilih) : -1;

  // Lewat tombol tur, baris rinciannya ikut dibuka supaya yang dijelaskan
  // selalu kelihatan. Lewat klik langsung tidak: sel video/peringatan sudah
  // membuka-tutup rinciannya sendiri seperti di tabel asli.
  function pilihTitik(id: string, dariTur = false) {
    setPilih(id);
    setDilihat(d => new Set(d).add(`${tampilan}:${id}`));
    const baris = id.match(/^[cr]-(video|peringatan)-(\w+)$/);
    if (dariTur && baris) setBuka(b => new Set(b).add(`${baris[1]}-${baris[2]}`));
  }

  useEffect(() => {
    if (!pilih) return;
    document.querySelector(`[data-titik="${CSS.escape(pilih)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [pilih, tampilan]);

  function gantiTampilan(t: Tampilan) {
    // Kunci rincian memakai id peserta, dan nama yang sama ada di dua
    // tampilan - tanpa dikosongkan, rincian Rahmat ikut terbuka di sebelah.
    setTampilan(t); setPilih('tampilan'); setBuka(new Set());
    setDilihat(d => new Set(d).add(`${t}:tampilan`));
  }

  // Bungkus satu bagian jadi bisa diklik. Belum dibuka = berwarna (mengundang
  // diklik), sudah dibuka = garis putus samar, sedang dibaca = garis tegas.
  function tt(id: string, node: ReactNode, blok = false) {
    const aktif = pilih === id;
    const sudah = dilihat.has(`${tampilan}:${id}`);
    const gaya: CSSProperties = {
      cursor: 'pointer', borderRadius: 4,
      display: blok ? 'block' : 'inline-block',
      padding: blok ? 0 : '1px 4px', margin: blok ? 0 : '-1px -4px',
      background: aktif || !sudah ? 'var(--edit-soft)' : 'transparent',
      outline: aktif ? '2px solid var(--edit)' : `1px dashed ${sudah ? 'var(--border-strong)' : 'var(--edit)'}`,
      outlineOffset: blok ? -2 : 1,
    };
    return (
      <span data-titik={id} role="button" tabIndex={0} style={gaya}
            onClick={() => pilihTitik(id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilihTitik(id); } }}>
        {node}
      </span>
    );
  }
  const th = (h: string, i: number) => (
    <th key={h || 'aksi'} style={{ ...TH_ATAS, ...(i === 0 ? TH_NAMA : {}) }}>
      {h ? coba(`h-${h}`, h) : null}
    </th>
  );
  const TD: CSSProperties = { padding: '8px 11px', fontVariantNumeric: 'tabular-nums' };
  const faint = (t = '—') => <span style={{ color: 'var(--text-faint)' }}>{t}</span>;
  const coba = (id: string, node: ReactNode) => peta.has(id) ? tt(id, node) : node;

  const ringkasan = tampilan === 'modul'
    ? [
        { label: 'Peserta', nilai: String(SESI.length), catatan: `${SESI.length} sesi` },
        { label: 'Materi tuntas', nilai: `${SESI.filter(s => s.unik >= TOTAL_SLIDE).length}/${SESI.length}`, catatan: 'semua slide dibuka' },
        { label: 'Perlu ditindaklanjuti', nilai: String(SESI.filter(s => perluTindakLanjut(s)).length),
          catatan: 'abai peringatan · ditinggal · gagal kuis · video', awas: true },
        { label: 'Rata-rata tatap layar', nilai: `${Math.round(SESI.reduce((a, s) => a + s.tatap, 0) / SESI.length)} m`, catatan: 'per peserta' },
      ]
    : [
        { label: 'Peserta', nilai: String(PESERTA.length), catatan: `${PESERTA.reduce((a, p) => a + p.sesi, 0)} sesi` },
        { label: 'Materi tuntas', nilai: `${PESERTA.filter(p => p.unik >= p.total_slide).length}/${PESERTA.length}`, catatan: 'semua slide dibuka' },
        { label: 'Perlu ditindaklanjuti', nilai: String(PESERTA.filter(p => perluTindakLanjut(p)).length),
          catatan: 'abai peringatan · ditinggal · gagal kuis · video', awas: true },
        { label: 'Rata-rata tatap layar', nilai: `${Math.round(PESERTA.reduce((a, p) => a + p.tatap, 0) / PESERTA.length)} m`, catatan: 'per peserta' },
      ];
  const idKotak: Record<string, string> = {
    'Peserta': 'rk-peserta', 'Materi tuntas': 'rk-tuntas', 'Perlu ditindaklanjuti': 'rk-perlu', 'Rata-rata tatap layar': 'rk-tatap',
  };

  const selVideo = (id: string, dimulai: number, total: number, rata: number | null) => {
    if (!total) return faint();
    if (!dimulai) return coba(`c-video-${id}`, <>0/{total} diklik</>);
    const kunci = `video-${id}`;
    const isi = (
      <span style={{ textDecoration: 'underline dotted' }}>
        {dimulai}/{total} diklik · {rata}%
        {(rata ?? 0) < 20 && <span style={{ marginLeft: 4, color: 'var(--danger)' }}>⚠</span>}
        {' '}<span style={{ fontSize: 10 }}>{buka.has(kunci) ? '▾' : '▸'}</span>
      </span>
    );
    const bolak = () => setBuka(b => { const n = new Set(b); if (n.has(kunci)) n.delete(kunci); else n.add(kunci); return n; });
    return peta.has(`c-video-${id}`)
      ? <span onClick={bolak}>{tt(`c-video-${id}`, isi)}</span>
      : <span onClick={bolak} style={{ cursor: 'pointer' }}>{isi}</span>;
  };
  const selPeringatan = (id: string, n: number, abai: number) => {
    const kunci = `peringatan-${id}`;
    if (!n) return '—';
    const isi = <>
      <span style={{ textDecoration: 'underline dotted' }}>{n}× <span style={{ fontSize: 10 }}>{buka.has(kunci) ? '▾' : '▸'}</span></span>
      {abai > 0 && <span style={{ marginLeft: 4, color: 'var(--danger)' }}>({abai} diabaikan)</span>}
    </>;
    const bolak = () => setBuka(b => { const s = new Set(b); if (s.has(kunci)) s.delete(kunci); else s.add(kunci); return s; });
    return peta.has(`c-peringatan-${id}`)
      ? <span onClick={bolak}>{tt(`c-peringatan-${id}`, isi)}</span>
      : <span onClick={bolak} style={{ cursor: 'pointer' }}>{isi}</span>;
  };
  const barisRincian = (id: string, jenis: 'video' | 'peringatan', kolom: number, node: ReactNode) => {
    if (!buka.has(`${jenis}-${id}`)) return null;
    const tid = `r-${jenis}-${id}`;
    return (
      <tr style={{ borderTop: '1px dashed var(--border)', background: 'var(--surface-2)' }}>
        <td colSpan={kolom}>{peta.has(tid) ? tt(tid, node, true) : node}</td>
      </tr>
    );
  };

  const kolomModul = ['Peserta', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Articulate', 'Catatan', 'Peringatan', ''];
  const kolomPeserta = ['Peserta', 'Modul', 'Nilai per Modul', 'Sesi', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Articulate', 'Catatan', 'Peringatan'];

  // ---- Isi panel penjelasan ----
  const t = pilih ? peta.get(pilih) : undefined;
  const norm = (x: string) => x.trim().toLowerCase();
  const kol = t?.kolom
    ? (isi.kolom.find(k => norm(k.nama) === norm(t.kolom!)) || bawaan.kolom.find(k => norm(k.nama) === norm(t.kolom!)))
    : undefined;
  const kep = t?.keputusan
    ? (isi.keputusan.find(k => norm(k.judul).includes(norm(t.keputusan!))) || bawaan.keputusan.find(k => norm(k.judul).includes(norm(t.keputusan!))))
    : undefined;
  const jumlahDilihat = daftar.filter(([id]) => dilihat.has(`${tampilan}:${id}`)).length;
  const P: CSSProperties = { fontSize: 13, lineHeight: 1.55, margin: '6px 0 0', whiteSpace: 'pre-line' };

  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        Ini tabel Command Center dengan <b>data karangan</b>. Klik bagian yang berwarna — judul kolom, angka, tanda ⚠,
        tanda "—", kotak ringkasan — penjelasannya muncul di bawah tabel.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {tt('tampilan', <span style={{ display: 'inline-flex', gap: 6 }}>
          <button className={tampilan === 'modul' ? 'btn-primary btn-sm' : 'btn-sm'}
                  onClick={e => { e.stopPropagation(); gantiTampilan('modul'); }}>Per Modul</button>
          <button className={tampilan === 'peserta' ? 'btn-primary btn-sm' : 'btn-sm'}
                  onClick={e => { e.stopPropagation(); gantiTampilan('peserta'); }}>Per Peserta</button>
        </span>)}
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
          {jumlahDilihat}/{daftar.length} bagian sudah dibuka
        </span>
      </div>

      <RingkasanBar butir={ringkasan} bungkus={(label, node) => tt(idKotak[label], node, true)} />

      <div style={{ ...WADAH_TABEL, maxHeight: 'none' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {(tampilan === 'modul' ? kolomModul : kolomPeserta).map(th)}
            </tr>
          </thead>
          <tbody>
            {tampilan === 'modul' ? SESI.map(s => (
              <Fragment key={s.id}>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={SEL_NAMA}>
                    {s.id === 'siti'
                      ? <><div>{s.nama}</div>{tt('c-nip', <span style={{ fontSize: 10.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{s.nip}</span>)}</>
                      : <NamaPeserta nama={s.nama} nip={s.nip} />}
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    {new Date(s.mulai).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={TD}>{coba(`c-tatap-${s.id}`, <>{s.tatap} m</>)}</td>
                  <td style={TD}>{coba(`c-ditinggal-${s.id}`, s.durasi_ditinggal_menit === null ? faint() : <>
                    {s.durasi_ditinggal_menit} m
                    {s.durasi_ditinggal_menit > 10 && <span style={{ marginLeft: 5, color: 'var(--danger)' }}>⚠</span>}
                  </>)}</td>
                  <td style={TD}>{coba(`c-slide-${s.id}`, <>
                    <span>{s.unik}/{TOTAL_SLIDE}</span>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{s.kunjungan} kunjungan</div>
                  </>)}</td>
                  <td style={TD}>{coba(`c-interaksi-${s.id}`, <>{s.interaksi}</>)}</td>
                  <td style={TD}>{coba(`c-kuis-${s.id}`, <>{s.kuis_gagal > 0 ? `${s.kuis_gagal}× gagal` : '—'}</>)}</td>
                  <td style={TD}>{s.kc_dijawab > 0 ? `${s.kc_benar}/${s.kc_dijawab} benar` : '—'}</td>
                  <td style={TD}>{selVideo(s.id, s.video_dimulai, TOTAL_VIDEO, s.video_rata_persen)}</td>
                  <td style={TD}>{s.art}/{TOTAL_ART} selesai</td>
                  <td style={TD}>{s.catatan ? s.catatan : faint()}</td>
                  <td style={TD}>{selPeringatan(s.id, s.peringatan, s.peringatan_diabaikan)}</td>
                  <td style={{ padding: '8px 11px', textAlign: 'right' }}>
                    {s.id === 'siti'
                      ? tt('c-uji', <button className="btn-sm" tabIndex={-1}>tandai uji</button>)
                      : <button className="btn-sm" tabIndex={-1} style={{ pointerEvents: 'none' }}>tandai uji</button>}
                  </td>
                </tr>
                {barisRincian(s.id, 'video', kolomModul.length, <VideoRincian detail={s.video_detail} />)}
                {barisRincian(s.id, 'peringatan', kolomModul.length, <PeringatanRincian detail={s.peringatan_detail} />)}
              </Fragment>
            )) : PESERTA.map(p => (
              <Fragment key={p.id}>
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={SEL_NAMA}>
                    <NamaPeserta nama={p.nama} nip={p.nip} peringatan={p.varian.length
                      ? coba(`c-nama-${p.id}`, <span style={{ color: 'var(--danger)' }}>⚠</span>) : null} />
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p.modul.length}</span>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1, whiteSpace: 'normal', maxWidth: 190 }}>
                      {p.modul.join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '8px 11px', whiteSpace: 'normal', minWidth: 190 }}>
                    {coba(`c-nilai-${p.id}`, <>{p.nilai.map(n => (
                      <div key={n.judul} style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: n.lulus ? 'var(--success)' : 'var(--danger)' }}>
                          {n.nilai === null ? '✓' : n.nilai}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: n.lulus ? 'var(--success)' : 'var(--danger)' }}>
                          {n.nilai === null ? (n.lulus ? 'LEWAT' : 'BELUM') : (n.lulus ? 'LULUS' : 'BELUM')}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{n.judul}</span>
                      </div>
                    ))}</>)}
                  </td>
                  <td style={TD}>{p.sesi}</td>
                  <td style={TD}>{p.tatap} m</td>
                  <td style={TD}>{coba(`c-ditinggal-${p.id}`, <>
                    {p.durasi_ditinggal_menit} m
                    {(p.durasi_ditinggal_menit ?? 0) > 10 && <span style={{ marginLeft: 5, color: 'var(--danger)' }}>⚠</span>}
                    {p.sesi_tanpa_end > 0 && <span style={{ marginLeft: 4, color: 'var(--text-faint)' }}>*</span>}
                  </>)}</td>
                  <td style={TD}>
                    <span>{p.unik}/{p.total_slide}</span>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{p.kunjungan} kunjungan</div>
                  </td>
                  <td style={TD}>{p.interaksi}</td>
                  <td style={TD}>{p.kuis_gagal > 0 ? `${p.kuis_gagal}× gagal` : '—'}</td>
                  <td style={TD}>{p.kc_dijawab > 0 ? `${p.kc_benar}/${p.kc_dijawab} benar` : '—'}</td>
                  <td style={TD}>{selVideo(p.id, p.video_dimulai, p.total_video, p.video_rata_persen)}</td>
                  <td style={TD}>{p.art}/{p.total_art} selesai</td>
                  <td style={TD}>{p.catatan ? p.catatan : faint()}</td>
                  <td style={TD}>{selPeringatan(p.id, p.peringatan, p.peringatan_diabaikan)}</td>
                </tr>
                {barisRincian(p.id, 'video', kolomPeserta.length, <VideoRincian detail={p.video_detail} />)}
                {barisRincian(p.id, 'peringatan', kolomPeserta.length, <PeringatanRincian detail={p.peringatan_detail} />)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {tampilan === 'peserta' && (
        <p className="hint" style={{ marginTop: 8, marginBottom: 0, fontSize: 11.5 }}>
          ⚠ (Peserta) = satu NIP tercatat dengan beberapa nama. * (Ditinggal) = sebagian sesi tidak ikut terhitung.
        </p>
      )}

      {/* Menempel di bawah layar selama tabelnya terlihat - penjelasan tidak
          boleh memaksa pembaca menggulir menjauh dari angka yang dijelaskan. */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 6, marginTop: 12,
        background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow)', padding: '12px 14px 14px', minHeight: 96,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <b style={{ fontSize: 14 }}>{t ? t.label : 'Pilih bagian tabel'}</b>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            {idx >= 0 && <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums', marginRight: 4 }}>{idx + 1}/{daftar.length}</span>}
            <button className="btn-ghost btn-sm" disabled={idx <= 0} onClick={() => pilihTitik(daftar[idx - 1][0], true)}>‹ Sebelumnya</button>
            <button className="btn-sm" disabled={idx >= daftar.length - 1}
                    onClick={() => pilihTitik(daftar[idx + 1][0], true)}>{idx < 0 ? 'Mulai tur ›' : 'Berikutnya ›'}</button>
          </span>
        </div>
        {!t ? (
          <p style={{ ...P, color: 'var(--text-faint)' }}>
            Klik bagian yang berwarna di tabel, atau tekan <b>Mulai tur</b> untuk dijelaskan satu per satu dari kiri ke kanan.
          </p>
        ) : <>
          {t.contoh && <p style={P}><b>Di contoh ini:</b> {t.contoh}</p>}
          {kol && <>
            <p style={P}><b>Arti kolom {kol.nama}:</b> {kol.arti}</p>
            {kol.kenapa && <p style={{ ...P, fontSize: 12.5, color: 'var(--text-faint)' }}><b>Kenapa begini:</b> {kol.kenapa}</p>}
            {kol.curiga && <p style={{ ...P, fontSize: 12.5, color: 'var(--danger)' }}><b>Kapan curiga:</b> {kol.curiga}</p>}
          </>}
          {kep && <p style={{ ...P, fontSize: 12.5, color: 'var(--text-dim)' }}><b>{kep.judul}:</b> {kep.isi}</p>}
        </>}
      </div>
    </>
  );
}
