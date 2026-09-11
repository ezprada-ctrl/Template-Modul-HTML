/* Isian contoh tiap tipe blok buat Demo Booth Penyusun.
 *
 * Satu entri = satu blok yang akan DIRAKIT UTUH di depan penonton: ditambah,
 * diketik isinya, hasil jadinya dikelilingi kursor sambil dijelaskan caption,
 * lalu dihapus supaya blok berikutnya dapat panggung yang bersih.
 *
 * `isi` diketik ke field editor blok itu BERURUTAN POSISI, bukan dicari lewat
 * placeholder-nya. Placeholder itu kalimat buat manusia dan boleh diganti
 * kapan saja; urutan field bagian dari struktur editornya. Entri yang lebih
 * pendek dari jumlah field cukup mengisi yang depan - sisanya dibiarkan,
 * karena blok yang setengah terisi memang tampilan yang jujur soal "isi
 * seperlunya".
 *
 * `lewati: true` = blok yang cuma DIJELASKAN, tidak dirakit. Dipakai buat yang
 * mustahil dirakit meyakinkan di booth: Articulate minta paket ZIP sungguhan,
 * audio minta berkas suara yang tidak ada gunanya diputar di keramaian.
 *
 * MENAMBAH TIPE BLOK BARU: satu entri di sini. app/scripts/cek-demo.mjs
 * menolak build kalau ada tipe blok di aplikasi yang belum punya entri, jadi
 * blok baru tidak bisa diam-diam absen dari booth.
 */
export interface EntriBlok {
  tipe: string;
  /** dijelaskan ke penonton saat hasil jadinya dikelilingi kursor */
  caption: string;
  /** teks yang diketik ke field editor, berurutan posisi */
  isi?: string[];
  /** true = tidak dirakit, cuma dijelaskan */
  lewati?: boolean;
}

/* Video contoh. Ditanam sebagai tautan sungguhan, bukan tautan karangan:
   pengunjung booth melihat pemutarnya benar-benar hidup dengan video yang
   memang ada. Kalau wifi venue mati, yang muncul kotak pemutar kosong -
   tidak menjatuhkan langkah lain, dan captionnya tetap menjelaskan. */
export const VIDEO_CONTOH = 'https://youtu.be/_g4l7YkDQwA?si=2YdajVketsZmwPVN';

export const TUR_BLOK: EntriBlok[] = [
  {
    tipe: 'card',
    caption: 'Kartu — wadah paling umum. Judul, isi, dan bullet cukup diawali tanda minus.',
    isi: ['Tiga Pilar Perbendaharaan', '- Perencanaan yang terukur\n- Pelaksanaan yang tertib\n- Pertanggungjawaban yang terbuka'],
  },
  {
    tipe: 'callout',
    caption: 'Catatan — untuk hal yang tidak boleh terlewat. Warnanya menandai seberapa penting.',
    isi: ['!', 'Keterlambatan pertanggungjawaban berdampak pada pencairan berikutnya.'],
  },
  {
    tipe: 'definition',
    caption: 'Definisi — istilah teknis diberi tempatnya sendiri, tidak tenggelam di paragraf.',
    isi: ['DEFINISI', 'Perbendaharaan adalah pengelolaan dan pertanggungjawaban keuangan negara.'],
  },
  {
    tipe: 'pullquote',
    caption: 'Kutipan Angka — satu angka yang ingin diingat peserta, dibesarkan.',
    isi: ['3', 'pilar yang menopang seluruh siklus perbendaharaan.'],
  },
  {
    tipe: 'ticklist',
    caption: 'Daftar Bercentang — langkah yang harus dilalui, bisa bernomor atau bercentang.',
    isi: ['Susun rencana penarikan dana'],
  },
  {
    tipe: 'accordion',
    caption: 'Accordion — rincian disembunyikan sampai peserta memang membutuhkannya.',
    isi: ['a. Siapa yang bertanggung jawab?', 'Kuasa Pengguna Anggaran di masing-masing satuan kerja.'],
  },
  {
    tipe: 'tabs',
    caption: 'Tabs — beberapa sudut pandang dipadatkan ke satu ruang layar.',
    isi: ['Pusat', 'Di tingkat pusat, kewenangan ada pada Kementerian Keuangan.'],
  },
  {
    tipe: 'timeline',
    caption: 'Timeline — urutan waktu yang perlu dilihat sebagai alur, bukan daftar.',
    isi: ['Januari', 'Penetapan DIPA', 'Dokumen anggaran diterima satuan kerja.'],
  },
  {
    tipe: 'dtable',
    caption: 'Tabel Data — angka dan perbandingan, lengkap dengan kepala kolomnya.',
    isi: ['Tahap', 'Penanggung Jawab'],
  },
  {
    tipe: 'flow',
    caption: 'Diagram Alur — proses bertahap yang bernomor otomatis.',
    isi: ['Pengajuan SPP', 'Diajukan oleh pejabat pembuat komitmen.'],
  },
  {
    tipe: 'grid',
    caption: 'Grid — dua atau tiga kolom, untuk hal-hal yang memang setara.',
  },
  {
    tipe: 'image',
    caption: 'Gambar — diunggah sekali, tersimpan di server, dan ikut terbawa ke berkas hasil.',
    isi: ['Struktur organisasi perbendaharaan negara'],
  },
  {
    tipe: 'badgeref',
    caption: 'Badge Referensi — dasar hukum ditempelkan rapi di dekat materinya.',
    isi: ['Pasal 4 · PMK 15/2025'],
  },
  {
    tipe: 'html',
    caption: 'HTML Bebas — pintu darurat untuk yang belum tersedia sebagai blok. Jarang dipakai, tapi ada.',
    isi: ['<p style="text-align:center"><b>Selamat, bagian ini selesai.</b></p>'],
  },
  {
    tipe: 'modal',
    caption: 'Modal Popup — penjelasan tambahan dibuka sebagai popup, peserta tidak kehilangan tempatnya.',
    isi: ['Rincian Tambahan', 'Isi lengkap ketentuannya dibuka di sini, tanpa memenuhi slide utama.'],
  },
  {
    tipe: 'media',
    caption: 'Media — video YouTube ditempel lewat tautannya saja, dan seberapa jauh ditonton ikut terekam.',
    isi: [VIDEO_CONTOH, 'Pengantar singkat perbendaharaan negara'],
  },
  {
    tipe: 'knowledge',
    caption: 'Knowledge Check — cek paham di tengah materi, dengan umpan balik per pilihan.',
    isi: ['Siapa yang menetapkan DIPA?', 'Kementerian Keuangan', 'Satuan kerja'],
  },
  {
    tipe: 'articulate',
    lewati: true,
    caption: 'Paket Articulate 360 juga bisa ditanam utuh — cukup unggah berkas ZIP hasil publish-nya.',
  },
];
