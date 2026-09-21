import { GAMBAR_SAMPUL_CONTOH } from './sampleAssets';

/* Isian contoh tiap tipe blok buat Demo Booth Penyusun.
 *
 * Satu entri = satu blok yang dirakit UTUH di depan penonton: ditambah,
 * diketik isinya, hasil jadinya dikelilingi kursor sambil dijelaskan caption,
 * lalu dihapus supaya blok berikutnya dapat panggung bersih.
 *
 * DUA BAGIAN, dan ini inti berkas ini:
 *
 *   `isi`     - teks yang DIKETIK ke field editor, berurutan posisi. Ini
 *               bagian yang ditonton: memperlihatkan bahwa mengisi blok itu
 *               ya mengetik biasa, bukan ritual.
 *   `lengkap` - bentuk AKHIR bloknya, dipasang sekaligus sesudah ketikan.
 *
 * Kenapa `lengkap` ada: mengetik dua field pertama saja menghasilkan blok
 * SETENGAH JADI - accordion satu panel, tabel dengan kepala kolom tapi baris
 * kosong, grid melompong, timeline satu titik. Di pratinjau itu terlihat
 * seperti hasil yang jelek, dan pengunjung booth menilai PRODUKNYA dari situ,
 * bukan menilai demonya. Yang dipamerkan harus bentuk yang memang akan dia
 * dapat kalau memakai alat ini dengan benar.
 *
 * Isi `lengkap` SELALU memuat teks yang barusan diketik, jadi tidak ada
 * kejanggalan "yang diketik A, yang muncul B".
 *
 * `lewati: true` = blok yang cuma DIJELASKAN, tidak dirakit - yang mustahil
 * dirakit meyakinkan di booth: Articulate minta paket ZIP sungguhan, audio
 * minta berkas suara yang tidak ada gunanya diputar di keramaian.
 *
 * MENAMBAH TIPE BLOK BARU: satu entri di sini. app/scripts/cek-demo.mjs
 * menolak build kalau ada tipe blok di aplikasi yang belum punya entri.
 */
export interface EntriBlok {
  tipe: string;
  /** dijelaskan ke penonton saat hasil jadinya dikelilingi kursor */
  caption: string;
  /** teks yang diketik ke field editor, berurutan posisi */
  isi?: string[];
  /** bentuk akhir bloknya, dipasang sesudah ketikan - lihat catatan di atas */
  lengkap?: Record<string, unknown>;
  /** true = tidak dirakit, cuma dijelaskan */
  lewati?: boolean;
  /** Blok yang INTERAKTIF: apa saja yang diklik DI DALAM pratinjau supaya
      penonton melihat efeknya sungguhan - accordion terbuka, tab berganti,
      gerbang menghadang. Tanpa ini booth cuma memamerkan bentuk diamnya, dan
      "interaktif" tinggal jadi kata di caption: pengunjung melihat sesuatu
      yang mirip gambar, lalu menyimpulkan modulnya juga gambar.

      Selektornya dijalankan berurutan di dokumen iframe pratinjau, dan
      dicari ULANG tiap klik - sebagian sasaran (tombol tutup popup, pilihan
      jawaban sesudah umpan balik) memang baru lahir akibat klik sebelumnya.
      Yang tidak ketemu dilewati diam-diam; satu sasaran meleset tidak boleh
      menjatuhkan sisa bloknya. */
  coba?: { sel: string; jeda?: number }[];
  /** Kalimat yang menemani `coba`. Dipisah dari `caption` karena tugasnya
      beda: caption menjelaskan blok APA ini, yang ini menjelaskan apa yang
      barusan terjadi di layar. */
  cobaCaption?: string;
  /** 'editor' = hasil bloknya TIDAK tampil di pratinjau slide, jadi yang
      dikelilingi kursor kertas kerjanya, bukan pratinjaunya. Knowledge Check
      begitu: generator sengaja tidak merendernya inline (render_knowledge
      mengembalikan string kosong) - dia muncul sebagai gerbang popup waktu
      peserta mencoba pindah slide. Menyorot pratinjau yang kosong untuk blok
      ini justru memamerkan "hasilnya tidak ada". */
  sorot?: 'editor';
}

/* Video contoh. Tautan sungguhan, bukan karangan: pengunjung booth melihat
   pemutarnya benar-benar hidup. Kalau wifi venue mati, yang muncul kotak
   pemutar kosong - tidak menjatuhkan langkah lain. */
export const VIDEO_CONTOH = 'https://youtu.be/_g4l7YkDQwA?si=2YdajVketsZmwPVN';

export const TUR_BLOK: EntriBlok[] = [
  {
    tipe: 'card',
    caption: 'Kartu — wadah paling umum. Judul, isi, dan bullet cukup diawali tanda minus.',
    isi: ['Tiga Pilar Perbendaharaan'],
    lengkap: {
      icon: '🏛️',
      heading: 'Tiga Pilar Perbendaharaan',
      bodyHtml: '<ul><li><b>Perencanaan</b> yang terukur dan berbasis kebutuhan nyata satuan kerja.</li>'
        + '<li><b>Pelaksanaan</b> yang tertib administrasi dan tepat waktu.</li>'
        + '<li><b>Pertanggungjawaban</b> yang terbuka dan dapat diaudit.</li></ul>',
    },
  },
  {
    tipe: 'callout',
    caption: 'Catatan — untuk hal yang tidak boleh terlewat. Warnanya menandai seberapa penting.',
    isi: ['!'],
    lengkap: {
      variant: 'amber',
      badge: '!',
      bodyHtml: '<b>Perhatikan tenggat.</b> Keterlambatan pertanggungjawaban menahan pencairan '
        + 'termin berikutnya — bukan cuma menunda laporan.',
    },
  },
  {
    tipe: 'definition',
    caption: 'Definisi — istilah teknis diberi tempatnya sendiri, tidak tenggelam di paragraf.',
    isi: ['DEFINISI'],
    lengkap: {
      tag: 'DEFINISI',
      bodyHtml: '<b>Perbendaharaan negara</b> adalah pengelolaan dan pertanggungjawaban keuangan '
        + 'negara, termasuk investasi dan kekayaan yang dipisahkan, yang ditetapkan dalam APBN dan APBD.',
    },
  },
  {
    tipe: 'pullquote',
    caption: 'Kutipan Angka — satu angka yang ingin diingat peserta, dibesarkan.',
    isi: ['3'],
    lengkap: {
      num: '3',
      text: 'pilar yang menopang seluruh siklus perbendaharaan — dari perencanaan sampai pertanggungjawaban.',
    },
  },
  {
    tipe: 'ticklist',
    caption: 'Daftar Bercentang — langkah yang harus dilalui, bernomor atau bercentang.',
    isi: ['Susun rencana penarikan dana bersama unit teknis'],
    lengkap: {
      ordered: true,
      items: [
        'Susun rencana penarikan dana bersama unit teknis',
        'Ajukan SPP lengkap dengan dokumen pendukung',
        'Terbitkan SPM setelah pengujian tagihan selesai',
        'Arsipkan bukti pertanggungjawaban maksimal 5 hari kerja',
      ],
    },
  },
  {
    tipe: 'accordion',
    caption: 'Accordion — rincian disembunyikan sampai peserta memang membutuhkannya.',
    cobaCaption: 'Dan begini rasanya dipakai: tiap kepala panel diklik, jawabannya terbuka — yang lain tetap rapi tertutup.',
    coba: [
      { sel: '.acc-item:nth-of-type(1) .acc-head' },
      { sel: '.acc-item:nth-of-type(2) .acc-head' },
      { sel: '.acc-item:nth-of-type(3) .acc-head', jeda: 1500 },
    ],
    isi: ['a. Siapa yang bertanggung jawab?'],
    lengkap: {
      accBadge: 'nomor',
      accItems: [
        { h: 'a. Siapa yang bertanggung jawab?',
          b: 'Kuasa Pengguna Anggaran di masing-masing satuan kerja, dibantu Pejabat Pembuat Komitmen.' },
        { h: 'b. Kapan SPP harus diajukan?',
          b: 'Paling lambat 5 hari kerja setelah barang atau jasa diterima dan diperiksa.' },
        { h: 'c. Apa akibat keterlambatan?',
          b: 'Pencairan termin berikutnya tertahan, dan satuan kerja masuk pemantauan khusus.' },
      ],
    },
  },
  {
    tipe: 'tabs',
    caption: 'Tabs — beberapa sudut pandang dipadatkan ke satu ruang layar.',
    cobaCaption: 'Diklik, isinya berganti di tempat — tiga sudut pandang tanpa peserta berpindah slide sama sekali.',
    coba: [
      { sel: '.tabs .tab-btn:nth-of-type(2)' },
      { sel: '.tabs .tab-btn:nth-of-type(3)' },
      { sel: '.tabs .tab-btn:nth-of-type(1)', jeda: 1300 },
    ],
    isi: ['Pusat'],
    lengkap: {
      tabItems: [
        { label: 'Pusat', content: 'Kewenangan penetapan kebijakan ada pada Kementerian Keuangan selaku Bendahara Umum Negara.' },
        { label: 'Daerah', content: 'Pemerintah daerah mengelola APBD dengan pola yang sama, diawasi Inspektorat Daerah.' },
        { label: 'Satuan Kerja', content: 'Pelaksana harian: mengajukan, mempertanggungjawabkan, dan mengarsipkan seluruh transaksi.' },
      ],
    },
  },
  {
    tipe: 'timeline',
    caption: 'Timeline — urutan waktu yang perlu dilihat sebagai alur, bukan daftar.',
    isi: ['Januari'],
    lengkap: {
      tlItems: [
        { time: 'Januari', title: 'Penetapan DIPA', desc: 'Dokumen anggaran diterima satuan kerja dan mulai berlaku.' },
        { time: 'Maret', title: 'Penarikan Termin I', desc: 'Pengajuan SPP pertama setelah kontrak ditandatangani.' },
        { time: 'Desember', title: 'Tutup Buku', desc: 'Seluruh pertanggungjawaban diselesaikan sebelum akhir tahun anggaran.' },
      ],
    },
  },
  {
    tipe: 'dtable',
    caption: 'Tabel Data — angka dan perbandingan, lengkap dengan kepala kolomnya.',
    isi: ['Tahap'],
    lengkap: {
      headers: ['Tahap', 'Penanggung Jawab', 'Tenggat'],
      rows: [
        ['Pengajuan SPP', 'Pejabat Pembuat Komitmen', '5 hari kerja'],
        ['Pengujian tagihan', 'Pejabat Penguji', '2 hari kerja'],
        ['Penerbitan SPM', 'Pejabat Penandatangan SPM', '1 hari kerja'],
      ],
    },
  },
  {
    tipe: 'flow',
    caption: 'Diagram Alur — proses bertahap yang bernomor otomatis.',
    cobaCaption: 'Tiap tahap bisa diklik: penjelasan rincinya muncul di bawah, tanpa bagan ini jadi penuh tulisan.',
    coba: [
      { sel: '.flow-step[data-idx="1"]' },
      { sel: '.flow-step[data-idx="2"]' },
      { sel: '.flow-step[data-idx="0"]', jeda: 1300 },
    ],
    isi: ['Pengajuan SPP'],
    lengkap: {
      steps: [
        { n: 1, title: 'Pengajuan SPP', detail: 'Diajukan Pejabat Pembuat Komitmen beserta dokumen pendukung.' },
        { n: 2, title: 'Pengujian Tagihan', detail: 'Kelengkapan dan kebenaran material tagihan diperiksa.' },
        { n: 3, title: 'Penerbitan SPM', detail: 'Surat Perintah Membayar diterbitkan dan diteruskan ke KPPN.' },
      ],
    },
  },
  {
    tipe: 'grid',
    caption: 'Grid — dua atau tiga kolom, untuk hal-hal yang memang setara.',
    lengkap: {
      columns: 2,
      blocks: [
        { id: 'demo-grid-1', type: 'card', icon: '📋', heading: 'Dokumen Wajib',
          bodyHtml: '<ul><li>Kontrak &amp; adendum</li><li>Berita acara serah terima</li><li>Faktur pajak</li></ul>' },
        { id: 'demo-grid-2', type: 'card', icon: '⏱️', heading: 'Batas Waktu',
          bodyHtml: '<ul><li>SPP: 5 hari kerja</li><li>Pengujian: 2 hari kerja</li><li>SPM: 1 hari kerja</li></ul>' },
      ],
    },
  },
  {
    tipe: 'image',
    caption: 'Gambar — diunggah sekali, tersimpan di server, dan ikut terbawa ke berkas hasil.',
    isi: ['Alur kewenangan perbendaharaan negara'],
    lengkap: {
      src: GAMBAR_SAMPUL_CONTOH,
      caption: 'Alur kewenangan perbendaharaan negara',
      imgWidth: 80,
      imgAlign: 'center',
    },
  },
  {
    tipe: 'badgeref',
    caption: 'Badge Referensi — dasar hukum ditempelkan rapi di dekat materinya.',
    isi: ['Pasal 4 ayat (2)'],
    lengkap: { refText: 'Pasal 4 ayat (2) · PMK 15/2025 tentang Pelaksanaan Anggaran' },
  },
  {
    tipe: 'html',
    caption: 'HTML Bebas — pintu darurat untuk yang belum tersedia sebagai blok. Jarang dipakai, tapi ada.',
    isi: ['<p style="text-align:center">'],
    lengkap: {
      raw: '<p style="text-align:center;font-size:15px;opacity:.85">'
        + '<b>Selamat, bagian ini selesai.</b><br>Lanjutkan ke kuis untuk menguji pemahamanmu.</p>',
    },
  },
  {
    tipe: 'modal',
    caption: 'Modal Popup — penjelasan tambahan dibuka sebagai popup, peserta tidak kehilangan tempatnya.',
    cobaCaption: 'Sekali klik, popupnya terbuka di atas materi; ditutup, peserta kembali persis ke tempat tadi.',
    coba: [
      { sel: '.modal-trigger', jeda: 2400 },
      /* Sasaran yang baru LAHIR akibat klik di atas - inilah kenapa tiap
         langkah coba dicari ulang, bukan dikumpulkan sekali di depan. */
      { sel: '.modal-overlay.open .modal-close', jeda: 900 },
    ],
    isi: ['Rincian Dokumen Pendukung'],
    lengkap: {
      icon: '📝',
      heading: 'Rincian Dokumen Pendukung',
      modalMode: 'teks',
      bodyHtml: '<p>Dokumen yang wajib dilampirkan pada setiap pengajuan SPP:</p>'
        + '<ul><li>Salinan kontrak dan adendumnya</li><li>Berita acara serah terima pekerjaan</li>'
        + '<li>Faktur pajak dan bukti setor</li><li>Jaminan pelaksanaan bila dipersyaratkan</li></ul>',
    },
  },
  {
    tipe: 'media',
    caption: 'Media — video YouTube ditempel lewat tautannya saja, dan seberapa jauh ditonton ikut terekam.',
    isi: [VIDEO_CONTOH],
    lengkap: {
      mediaSource: 'youtube',
      embedUrl: VIDEO_CONTOH,
      caption: 'Pengantar singkat perbendaharaan negara',
      videoRatio: '16:9',
    },
  },
  {
    tipe: 'knowledge',
    sorot: 'editor',
    caption: 'Knowledge Check — cek paham yang menghadang saat peserta pindah slide, dengan umpan balik per pilihan.',
    /* Satu-satunya blok yang hasilnya cuma bisa dilihat dengan MENCOBA
       pindah slide: inline-nya memang tidak dirender apa-apa (lihat `sorot`
       di bawah). Jadi di sini "Selanjutnya" benar-benar ditekan di dalam
       pratinjau, gerbangnya benar-benar menghadang, dan jawaban salah
       sengaja dipilih dulu - yang mau dipamerkan justru penjelasannya.

       Tombol "Lanjut" di popup SENGAJA tidak ditekan: menekannya membawa
       pratinjau pindah slide, meninggalkan panggung tur blok. Popup yang
       tertinggal terbuka tidak jadi masalah - menghapus bloknya di ujung
       langkah membangun ulang iframe-nya dari nol. */
    cobaCaption: 'Peserta menekan "Selanjutnya" — dan ditahan di sini. Jawaban salah pun dijelaskan, bukan sekadar ditandai merah.',
    coba: [
      { sel: '#btn-next', jeda: 1400 },
      { sel: '#kc-popup-overlay .kc-opt[data-oi="1"]', jeda: 2600 },
      { sel: '#kc-popup-overlay .kc-opt[data-oi="0"]', jeda: 2600 },
    ],
    isi: ['Siapa yang menerbitkan SPM?'],
    lengkap: {
      kcItems: [{
        q: 'Siapa yang menerbitkan Surat Perintah Membayar (SPM)?',
        opts: ['Pejabat Penandatangan SPM di satuan kerja', 'KPPN', 'Inspektorat'],
        correct: 0,
        feedbackMode: 'perOption',
        optFeedback: [
          'Tepat. SPM diterbitkan di satuan kerja, lalu diteruskan ke KPPN untuk dicairkan.',
          'Bukan. KPPN yang MENCAIRKAN dananya, bukan yang menerbitkan SPM.',
          'Bukan. Inspektorat mengawasi, tidak terlibat dalam penerbitan SPM.',
        ],
      }],
    },
  },
  {
    tipe: 'articulate',
    lewati: true,
    caption: 'Paket Articulate 360 juga bisa ditanam utuh — cukup unggah berkas ZIP hasil publish-nya.',
  },
];
