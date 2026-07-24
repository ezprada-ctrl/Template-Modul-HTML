import type { ActivityModule, ActivitySession, ActivityLearner } from './api';

/**
 * Data KARANGAN buat "Lihat Contoh" di Command Center — dipakai waktu belum
 * ada data peserta asli (atau buat latih tim baca tabelnya) tanpa perlu
 * password atau modul beneran. Nol jaringan, murni konstanta.
 *
 * Sengaja mencakup KOMBINASI kasus (bukan 1 fitur = 1 baris terpisah), biar
 * yang latihan baca kelihatan gimana bentrokan sinyal beneran terjadi:
 * - Rahmat: video RENDAH + peringatan sekaligus di baris yang sama.
 * - Dewi: nama bervariasi + peringatan multi-section (1 diabaikan, 2 ditindaklanjuti).
 * - Fajar: 2 sesi, DUA-DUANYA tanpa session_end -> Ditinggal "—" total.
 * - Budi: 2 sesi, SEBAGIAN tanpa session_end -> Ditinggal parsial + tanda *,
 *   video rendah+peringatan+kuis gagal sekaligus (persona "paling bermasalah").
 * - Siti & Yulianti: kontras peserta rapi (video tinggi, nol peringatan).
 */

const SLUG = 'demo-modul-contoh';
const TITLE = 'Modul Contoh (Data Demo)';
const TOTAL_SLIDE = 95;
const TOTAL_VIDEO = 4;

export const DEMO_MODULES: ActivityModule[] = [
  {
    module_slug: SLUG,
    rows: 260,
    sessions: 8,
    learners: 6,
    first_seen: '2026-07-20T01:00:00.000Z',
    last_seen: '2026-07-20T09:40:00.000Z',
    judul_modul: [TITLE],
    kemungkinan_bentrok: false,
  },
];

export const DEMO_SESSIONS: ActivitySession[] = [
  {
    session_id: 'demo-siti', module_slug: SLUG, learner_name: 'Siti Amara', learner_id: '198801052012052411',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 94,
    total_video: TOTAL_VIDEO, video_dimulai: 4, video_rata_persen: 88,
    video_detail: [{ slide: 6, persen: 80 }, { slide: 19, persen: 85 }, { slide: 27, persen: 90 }, { slide: 33, persen: 97 }],
    mulai: '2026-07-20T01:00:00.000Z', selesai: '2026-07-20T01:56:00.000Z',
    durasi_total_ms: 56 * 60000, durasi_menit: 56, durasi_tatap_layar_menit: 54, durasi_ditinggal_menit: 2,
    jumlah_slide_dilihat: 96, jumlah_interaksi: 21,
    kuis_dijawab: 8, kuis_benar: 8, kuis_diulang: 0, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 0, kc_benar: 0, perangkat: 'desktop',
  },
  {
    session_id: 'demo-rahmat', module_slug: SLUG, learner_name: 'Rahmat Wijaya', learner_id: '199203152015031005',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 80,
    total_video: TOTAL_VIDEO, video_dimulai: 4, video_rata_persen: 14,
    video_detail: [{ slide: 5, persen: 6 }, { slide: 19, persen: 8 }, { slide: 27, persen: 12 }, { slide: 33, persen: 30 }],
    mulai: '2026-07-20T02:00:00.000Z', selesai: '2026-07-20T03:15:00.000Z',
    durasi_total_ms: 75 * 60000, durasi_menit: 75, durasi_tatap_layar_menit: 61, durasi_ditinggal_menit: 14,
    jumlah_slide_dilihat: 88, jumlah_interaksi: 17,
    kuis_dijawab: 9, kuis_benar: 7, kuis_diulang: 1, kuis_gagal: 1,
    peringatan_baca_cepat: 1, peringatan_diabaikan: 0,
    peringatan_detail: [{ section: 'b', slides: [14], choice: 'kembali' }],
    kc_dijawab: 12, kc_benar: 7, perangkat: 'desktop',
  },
  {
    session_id: 'demo-dewi', module_slug: SLUG, learner_name: 'Dewi Anggraini', learner_id: '198611202010012002',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 60,
    total_video: TOTAL_VIDEO, video_dimulai: 0, video_rata_persen: null, video_detail: [],
    mulai: '2026-07-20T03:00:00.000Z', selesai: '2026-07-20T03:39:00.000Z',
    durasi_total_ms: 39 * 60000, durasi_menit: 39, durasi_tatap_layar_menit: 39, durasi_ditinggal_menit: 0,
    jumlah_slide_dilihat: 61, jumlah_interaksi: 9,
    kuis_dijawab: 6, kuis_benar: 4, kuis_diulang: 2, kuis_gagal: 2,
    peringatan_baca_cepat: 3, peringatan_diabaikan: 1,
    peringatan_detail: [
      { section: 'a', slides: [3], choice: 'kembali' },
      { section: 'b', slides: [9, 11], choice: 'kembali' },
      { section: 'c', slides: [21], choice: 'yakin' },
    ],
    kc_dijawab: 9, kc_benar: 9, perangkat: 'mobile',
  },
  {
    session_id: 'demo-fajar-1', module_slug: SLUG, learner_name: 'Fajar Nugroho', learner_id: '199507112019031103',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 14,
    total_video: TOTAL_VIDEO, video_dimulai: 0, video_rata_persen: null, video_detail: [],
    mulai: '2026-07-20T04:00:00.000Z', selesai: '2026-07-20T04:10:00.000Z',
    durasi_total_ms: 10 * 60000, durasi_menit: 10, durasi_tatap_layar_menit: 10, durasi_ditinggal_menit: null,
    jumlah_slide_dilihat: 15, jumlah_interaksi: 2,
    kuis_dijawab: 3, kuis_benar: 2, kuis_diulang: 1, kuis_gagal: 1,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 1, kc_benar: 1, perangkat: 'desktop',
  },
  {
    // Sesi KEDUA Fajar, tab-nya ditutup paksa (HP) - session_end gak pernah
    // kekirim. Dua-duanya begini -> di tabel Peserta, Ditinggal jadi "—"
    // TOTAL (bukan cuma sebagian), karena TIDAK ADA satu pun sesi lengkap.
    session_id: 'demo-fajar-2', module_slug: SLUG, learner_name: 'Fajar Nugroho', learner_id: '199507112019031103',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 6,
    total_video: TOTAL_VIDEO, video_dimulai: 0, video_rata_persen: null, video_detail: [],
    mulai: '2026-07-20T05:00:00.000Z', selesai: '2026-07-20T05:07:00.000Z',
    durasi_total_ms: 7 * 60000, durasi_menit: 7, durasi_tatap_layar_menit: 7, durasi_ditinggal_menit: null,
    jumlah_slide_dilihat: 7, jumlah_interaksi: 1,
    kuis_dijawab: 0, kuis_benar: 0, kuis_diulang: 0, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 2, kc_benar: 1, perangkat: 'mobile',
  },
  {
    session_id: 'demo-yulianti', module_slug: SLUG, learner_name: 'Yulianti Putri', learner_id: '199009222014032207',
    identity_source: 'scorm', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 95,
    total_video: TOTAL_VIDEO, video_dimulai: 4, video_rata_persen: 96,
    video_detail: [{ slide: 11, persen: 92 }, { slide: 24, persen: 95 }, { slide: 30, persen: 98 }, { slide: 41, persen: 99 }],
    mulai: '2026-07-20T06:00:00.000Z', selesai: '2026-07-20T07:18:00.000Z',
    durasi_total_ms: 78 * 60000, durasi_menit: 78, durasi_tatap_layar_menit: 72, durasi_ditinggal_menit: 6,
    jumlah_slide_dilihat: 95, jumlah_interaksi: 26,
    kuis_dijawab: 10, kuis_benar: 10, kuis_diulang: 0, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 0, kc_benar: 0, perangkat: 'desktop',
  },
  {
    session_id: 'demo-budi-1', module_slug: SLUG, learner_name: 'Budi Santoso', learner_id: '198501012001011001',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 65,
    total_video: TOTAL_VIDEO, video_dimulai: 4, video_rata_persen: 9,
    video_detail: [{ slide: 15, persen: 2 }, { slide: 28, persen: 5 }, { slide: 40, persen: 10 }, { slide: 55, persen: 19 }],
    mulai: '2026-07-20T08:00:00.000Z', selesai: '2026-07-20T08:45:00.000Z',
    durasi_total_ms: 68 * 60000, durasi_menit: 68, durasi_tatap_layar_menit: 45, durasi_ditinggal_menit: 23,
    jumlah_slide_dilihat: 70, jumlah_interaksi: 12,
    kuis_dijawab: 10, kuis_benar: 8, kuis_diulang: 2, kuis_gagal: 2,
    peringatan_baca_cepat: 2, peringatan_diabaikan: 1,
    peringatan_detail: [
      { section: 'a', slides: [8], choice: 'yakin' },
      { section: 'c', slides: [44], choice: 'kembali' },
    ],
    kc_dijawab: 6, kc_benar: 3, perangkat: 'desktop',
  },
  {
    // Sesi KEDUA Budi, tab-nya ditutup paksa juga - tapi sesi PERTAMA-nya
    // lengkap. Ini contoh kasus PARSIAL: sesi_tanpa_end > 0 tapi Ditinggal
    // TETAP tampil angka (dari sesi yang lengkap), ditandai * bukan "—".
    session_id: 'demo-budi-2', module_slug: SLUG, learner_name: 'Budi Santoso', learner_id: '198501012001011001',
    identity_source: 'manual', module_title: TITLE, total_slide: TOTAL_SLIDE, jumlah_slide_unik: 8,
    total_video: TOTAL_VIDEO, video_dimulai: 0, video_rata_persen: null, video_detail: [],
    mulai: '2026-07-20T09:30:00.000Z', selesai: '2026-07-20T09:42:00.000Z',
    durasi_total_ms: 12 * 60000, durasi_menit: 12, durasi_tatap_layar_menit: 12, durasi_ditinggal_menit: null,
    jumlah_slide_dilihat: 10, jumlah_interaksi: 3,
    kuis_dijawab: 0, kuis_benar: 0, kuis_diulang: 0, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 0, kc_benar: 0, perangkat: 'mobile',
  },
];

export const DEMO_LEARNERS: ActivityLearner[] = [
  {
    learner_id: '198801052012052411', nama: 'Siti Amara', nama_varian: ['Siti Amara'], nama_bervariasi: false,
    identity_sources: ['manual'],
    modul: { [SLUG]: { sesi: 1, durasi_ms: 56 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 1,
    jumlah_slide_unik: 94, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 4, video_rata_persen: 88,
    video_detail: [
      { modul: SLUG, slide: 6, persen: 80 }, { modul: SLUG, slide: 19, persen: 85 },
      { modul: SLUG, slide: 27, persen: 90 }, { modul: SLUG, slide: 33, persen: 97 },
    ],
    durasi_total_ms: 56 * 60000, durasi_menit: 56, durasi_tatap_layar_menit: 54, durasi_ditinggal_menit: 2, sesi_tanpa_end: 0,
    jumlah_slide_dilihat: 96, jumlah_interaksi: 21,
    kuis_dijawab: 8, kuis_benar: 8, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 0, kc_benar: 0,
    pertama: '2026-07-20T01:00:00.000Z', terakhir: '2026-07-20T01:56:00.000Z',
  },
  {
    learner_id: '199203152015031005', nama: 'Rahmat Wijaya', nama_varian: ['Rahmat Wijaya'], nama_bervariasi: false,
    identity_sources: ['manual'],
    modul: { [SLUG]: { sesi: 1, durasi_ms: 75 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 1,
    jumlah_slide_unik: 80, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 4, video_rata_persen: 14,
    video_detail: [
      { modul: SLUG, slide: 5, persen: 6 }, { modul: SLUG, slide: 19, persen: 8 },
      { modul: SLUG, slide: 27, persen: 12 }, { modul: SLUG, slide: 33, persen: 30 },
    ],
    durasi_total_ms: 75 * 60000, durasi_menit: 75, durasi_tatap_layar_menit: 61, durasi_ditinggal_menit: 14, sesi_tanpa_end: 0,
    jumlah_slide_dilihat: 88, jumlah_interaksi: 17,
    kuis_dijawab: 9, kuis_benar: 7, kuis_gagal: 1,
    peringatan_baca_cepat: 1, peringatan_diabaikan: 0,
    peringatan_detail: [{ modul: SLUG, section: 'b', slides: [14], choice: 'kembali' }],
    kc_dijawab: 12, kc_benar: 7,
    pertama: '2026-07-20T02:00:00.000Z', terakhir: '2026-07-20T03:15:00.000Z',
  },
  {
    learner_id: '198611202010012002', nama: 'Dewi Anggraini',
    nama_varian: ['Dewi Anggraini', 'dewi anggraeni', 'Dewi A.'], nama_bervariasi: true,
    identity_sources: ['manual'],
    modul: { [SLUG]: { sesi: 1, durasi_ms: 39 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 1,
    jumlah_slide_unik: 60, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 0, video_rata_persen: null, video_detail: [],
    durasi_total_ms: 39 * 60000, durasi_menit: 39, durasi_tatap_layar_menit: 39, durasi_ditinggal_menit: 0, sesi_tanpa_end: 0,
    jumlah_slide_dilihat: 61, jumlah_interaksi: 9,
    kuis_dijawab: 6, kuis_benar: 4, kuis_gagal: 2,
    peringatan_baca_cepat: 3, peringatan_diabaikan: 1,
    peringatan_detail: [
      { modul: SLUG, section: 'a', slides: [3], choice: 'kembali' },
      { modul: SLUG, section: 'b', slides: [9, 11], choice: 'kembali' },
      { modul: SLUG, section: 'c', slides: [21], choice: 'yakin' },
    ],
    kc_dijawab: 9, kc_benar: 9,
    pertama: '2026-07-20T03:00:00.000Z', terakhir: '2026-07-20T03:39:00.000Z',
  },
  {
    // sesi_tanpa_end = 2 (KEDUA sesinya gak ngirim session_end) -> Ditinggal
    // learner-level null TOTAL, bukan cuma sebagian.
    learner_id: '199507112019031103', nama: 'Fajar Nugroho', nama_varian: ['Fajar Nugroho'], nama_bervariasi: false,
    identity_sources: ['manual'],
    modul: { [SLUG]: { sesi: 2, durasi_ms: 17 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 2,
    jumlah_slide_unik: 20, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 0, video_rata_persen: null, video_detail: [],
    durasi_total_ms: 17 * 60000, durasi_menit: 17, durasi_tatap_layar_menit: 17, durasi_ditinggal_menit: null, sesi_tanpa_end: 2,
    jumlah_slide_dilihat: 22, jumlah_interaksi: 3,
    kuis_dijawab: 3, kuis_benar: 2, kuis_gagal: 1,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 5, kc_benar: 2,
    pertama: '2026-07-20T04:00:00.000Z', terakhir: '2026-07-20T05:07:00.000Z',
  },
  {
    learner_id: '199009222014032207', nama: 'Yulianti Putri', nama_varian: ['Yulianti Putri'], nama_bervariasi: false,
    identity_sources: ['scorm'],
    modul: { [SLUG]: { sesi: 1, durasi_ms: 78 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 1,
    jumlah_slide_unik: 95, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 4, video_rata_persen: 96,
    video_detail: [
      { modul: SLUG, slide: 11, persen: 92 }, { modul: SLUG, slide: 24, persen: 95 },
      { modul: SLUG, slide: 30, persen: 98 }, { modul: SLUG, slide: 41, persen: 99 },
    ],
    durasi_total_ms: 78 * 60000, durasi_menit: 78, durasi_tatap_layar_menit: 72, durasi_ditinggal_menit: 6, sesi_tanpa_end: 0,
    jumlah_slide_dilihat: 95, jumlah_interaksi: 26,
    kuis_dijawab: 10, kuis_benar: 10, kuis_gagal: 0,
    peringatan_baca_cepat: 0, peringatan_diabaikan: 0, peringatan_detail: [],
    kc_dijawab: 0, kc_benar: 0,
    pertama: '2026-07-20T06:00:00.000Z', terakhir: '2026-07-20T07:18:00.000Z',
  },
  {
    // Persona "paling bermasalah": video rendah + peringatan (1 diabaikan) +
    // kuis gagal + ditinggal lama SEKALIGUS, plus sesi_tanpa_end PARSIAL
    // (beda dari Fajar yang totalnya null - ini masih ada angka, ditandai *).
    learner_id: '198501012001011001', nama: 'Budi Santoso', nama_varian: ['Budi Santoso'], nama_bervariasi: false,
    identity_sources: ['manual'],
    modul: { [SLUG]: { sesi: 2, durasi_ms: 80 * 60000, total_slide: TOTAL_SLIDE, total_video: TOTAL_VIDEO } },
    modul_slugs: [SLUG], jumlah_modul: 1, jumlah_sesi: 2,
    jumlah_slide_unik: 70, total_slide_program: TOTAL_SLIDE, total_video_program: TOTAL_VIDEO,
    video_dimulai: 4, video_rata_persen: 9,
    video_detail: [
      { modul: SLUG, slide: 15, persen: 2 }, { modul: SLUG, slide: 28, persen: 5 },
      { modul: SLUG, slide: 40, persen: 10 }, { modul: SLUG, slide: 55, persen: 19 },
    ],
    durasi_total_ms: 80 * 60000, durasi_menit: 80, durasi_tatap_layar_menit: 57, durasi_ditinggal_menit: 23, sesi_tanpa_end: 1,
    jumlah_slide_dilihat: 80, jumlah_interaksi: 15,
    kuis_dijawab: 10, kuis_benar: 8, kuis_gagal: 2,
    peringatan_baca_cepat: 2, peringatan_diabaikan: 1,
    peringatan_detail: [
      { modul: SLUG, section: 'a', slides: [8], choice: 'yakin' },
      { modul: SLUG, section: 'c', slides: [44], choice: 'kembali' },
    ],
    kc_dijawab: 6, kc_benar: 3,
    pertama: '2026-07-20T08:00:00.000Z', terakhir: '2026-07-20T09:42:00.000Z',
  },
];
