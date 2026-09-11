import type { DemoCtx, DemoStep } from './engine';
import { qDemo } from './engine';
import { GAMBAR_SAMPUL_CONTOH, GAMBAR_PENUTUP_CONTOH } from './sampleAssets';

/* Katalog langkah Demo Booth Penyusun - satu tempat, seperti demoSteps.ts
 * untuk sisi peserta.
 *
 * Yang dipamerkan: PEKERJAAN MENYUSUN, bukan daftar fitur. Urutannya
 * mengikuti alur orang sungguhan - impor bahan, tata slide, isi blok, atur
 * tema, buat kuis, lalu export - karena itulah pertanyaan yang dibawa
 * pengunjung ke booth ("kalau saya pakai ini, kerjanya kayak apa?"), bukan
 * "ada fitur apa saja".
 *
 * MENAMBAH LANGKAH: satu entri di sini, selesai. Mesin tidak perlu disentuh,
 * dan langkah yang sasarannya tidak ketemu di layar (mengembalikan false)
 * dilewati diam-diam tanpa menjatuhkan putaran.
 *
 * Yang SENGAJA tidak ada di sini:
 *   - Export HTML / SCORM: tombolnya diperlihatkan, tidak diklik. Satu klik
 *     berarti satu unduhan sungguhan di mesin booth, tiap putaran, seharian.
 *   - Command Center: berpassword, dan isinya rekaman peserta sungguhan.
 *     Pintunya ditunjukkan, isinya tidak dibuka.
 */

/* Dua kecepatan, dua daftar.
   BINTANG: yang paling menjawab "modulnya bisa apa" - dirakit pelan-pelan.
   RAGAM: sisanya, disisipkan cepat berturut-turut.
   Isinya ID TIPE BLOK (BlockType di types.ts), bukan label yang tampil.
   'articulate' sengaja TIDAK ikut: dia minta paket ZIP, dan tanpa berkasnya
   yang muncul cuma blok kosong. cek-demo.mjs menegakkan bahwa tipe blok baru
   wajib masuk salah satu daftar ini. */
const BLOK_BINTANG = ['card', 'accordion', 'tabs', 'dtable', 'knowledge', 'modal'];
const BLOK_RAGAM = [
  'callout', 'definition', 'pullquote', 'ticklist', 'timeline',
  'flow', 'grid', 'image', 'badgeref', 'html', 'media',
];

/* Opsi di menu "+ Tambah blok" dicari lewat id TIPE-nya (data-blok), bukan
   lewat teks labelnya. Labelnya teks yang dibaca orang dan boleh diganti
   kapan saja; id tipenya bagian dari struktur data dan tidak berubah tanpa
   migrasi. Dulu dicari lewat teks - satu label diganti, satu langkah demo
   mati tanpa suara. */
const blokOpsi = (tipe: string) => document.querySelector<HTMLElement>(`[data-demo="blok-opsi"][data-blok="${tipe}"]`);

const T = (n: string) => qDemo('tab-' + n);
const inp = (ph: string) => document.querySelector<HTMLElement>(`[placeholder="${ph}"]`);

async function bukaTab(D: DemoCtx, id: string) {
  const t = T(id);
  if (!t) return false;
  await D.click(t);
  return true;
}

export const BUILDER_DEMO_STEPS: DemoStep[] = [
  {
    id: 'alur',
    label: 'Alur enam tab',
    caption: 'Menyusun modul jalannya berurut: ambil bahan, tata, percantik, uji, lalu ekspor.',
    run: async (D, cap) => {
      await D.say(cap, 0);
      const tabs = Array.from(document.querySelectorAll<HTMLElement>('[data-demo^="tab-"]'));
      if (!tabs.length) return false;
      await D.sapu(tabs, 420);
      await D.sleep(700);
    },
  },
  {
    id: 'import',
    label: 'Import PPTX',
    caption: 'Bahan tidak diketik ulang: satu file PPTX diurai jadi slide siap tata, lengkap dengan gambarnya.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'bank')) return false;
      await D.say(cap);
      await D.sleep(900);
    },
  },
  {
    id: 'canvas',
    label: 'Susun modul',
    caption: 'Slide disusun per bagian. Yang di kiri urutan materinya, yang di kanan pratinjaunya — tanpa perlu ekspor dulu.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'canvas')) return false;
      await D.say(cap);
      await D.sleep(900);
    },
  },
  {
    id: 'judul-slide',
    label: 'Mengetik judul slide',
    caption: 'Setiap suntingan langsung terlihat hasilnya. Tidak ada tombol "render" yang harus ditunggu.',
    run: async (D, cap) => {
      /* Kertas kerja slide baru muncul setelah "Edit blok" ditekan - daftar
         slide sendiri cuma urutan. Langkah ini yang MEMBUKANYA, dan langkah
         'blok' di bawah menumpang editor yang sama; keduanya ditutup di ujung
         'blok'. Dipisah begini karena captionnya memang dua hal berbeda. */
      /* MEMPOSISIKAN DIRI SENDIRI, sama seperti tiap langkah di sisi modul:
         membuka tabnya sendiri, lalu MENUNGGU barisnya dirender - bukan
         mengandalkan langkah sebelumnya sudah menaruh layar di tempat yang
         benar. Sebelum ini langkah ini sesekali terlewat (peringatan console
         menangkapnya, ~sekali tiap beberapa putaran, di build produksi juga):
         proyek contoh dipasang ulang tiap awal putaran, dan barisnya baru ada
         satu-dua render sesudahnya. Menunggu saja tidak cukup kalau layarnya
         ternyata sedang di tab lain. */
      if (!await bukaTab(D, 'canvas')) return false;
      const edit = await D.tunggu(() => qDemo('edit-blok'), 4000);
      if (!edit) return false;
      await D.say(cap, 0);
      /* Tombolnya SAKLAR, bukan tombol buka. Kalau kertas kerjanya sudah
         terbuka - dan dia memang tertinggal terbuka dari putaran sebelumnya -
         mengkliknya justru MENUTUP, lalu langkah ini mencari kolom judul yang
         barusan dia hilangkan sendiri. Inilah kenapa putaran pertama selalu
         lolos dan putaran berikutnya tidak. */
      if (edit.dataset.buka === '0') await D.click(edit);
      const judul = await D.tunggu(() => inp('Judul slide'));
      if (!judul) return false;
      await D.type(judul, 'Tiga Pilar yang Harus Dipegang Setiap Hari');
      await D.sleep(1100);
    },
  },
  {
    id: 'blok-bintang',
    label: 'Blok andalan, dirakit',
    caption: 'Isi slide dirakit dari blok siap pakai. Tidak ada satu pun HTML yang perlu diketik.',
    run: async (D, cap) => {
      /* Menu "+ Tambah blok" cuma ada kalau kertas kerja slide-nya terbuka.
         Kalau langkah sebelumnya terlewat, langkah ini membukanya sendiri -
         satu langkah yang gagal tidak boleh menyeret langkah berikutnya. */
      const buka = qDemo('edit-blok');
      if (buka?.dataset.buka === '0') await D.click(buka);
      const pemicu = await D.tunggu(() => qDemo('tambah-blok'), 4000);
      if (!pemicu) return false;
      await D.say(cap, 0);
      await D.click(pemicu);
      /* Daftarnya dirender sesudah klik; ditunggu, bukan ditebak jedanya,
         karena mesin booth yang lambat bikin tebakan jeda meleset. */
      const daftar = await D.tunggu(() => blokOpsi('accordion'));
      if (!daftar) return false;
      const pilihan = BLOK_BINTANG.map(blokOpsi).filter((el): el is HTMLElement => !!el);
      await D.sapu(pilihan, 480);   // hover = tooltip penjelas tiap blok ikut muncul
      const kartu = blokOpsi('card');
      if (kartu) await D.click(kartu);
      await D.sleep(1100);
    },
  },
  {
    id: 'blok-ragam',
    label: 'Ke-18 tipe blok',
    caption: 'Delapan belas tipe blok — dan tiap blok yang ditambahkan langsung terlihat hasilnya di pratinjau sebelah.',
    run: async (D, cap) => {
      /* KECEPATAN KEDUA. Blok bintang di langkah sebelumnya dirakit pelan
         supaya cara kerjanya kelihatan; sisanya lewat cepat supaya RAGAMNYA
         yang kelihatan. Kalau ke-18 tipe dirakit dengan kecepatan yang sama,
         satu putaran jadi sepuluh menit dan pengunjung yang datang di tengah
         cuma melihat blok ke-13 tanpa konteks. */
      await D.say(cap, 0);
      for (const tipe of BLOK_RAGAM) {
        D.chk();
        const pemicu = qDemo('tambah-blok');
        if (!pemicu) break;
        pemicu.click();                       // tanpa animasi kursor: ini bagian cepatnya
        const item = (await D.tunggu(() => blokOpsi(tipe), 1200)) as HTMLElement | null;
        if (!item) { pemicu.click(); continue; }   // menu terlanjur tertutup - tutup lagi, lewati
        await D.cursorTo(item);
        item.click();
        await D.sleep(620);
      }
      await D.sleep(1400);
      /* Ditutup supaya putaran berikutnya mulai dari keadaan yang sama
         persis - kertas kerja yang tertinggal terbuka bikin langkah
         'judul-slide' di putaran depan menghadapi layar yang berbeda. */
      const tutup = qDemo('edit-blok');
      if (tutup?.dataset.buka === '1') await D.click(tutup);
    },
  },
  {
    id: 'undo',
    label: 'Undo / autosave',
    caption: 'Salah tekan tidak pernah fatal: semua langkah bisa dibatalkan, dan pekerjaan tersimpan sendiri tanpa diminta.',
    run: async (D, cap) => {
      const undo = document.querySelector<HTMLElement>('[title^="Undo"]');
      const redo = document.querySelector<HTMLElement>('[title^="Redo"]');
      if (!undo) return false;
      await D.say(cap, 0);
      await D.click(undo);
      await D.sleep(900);
      if (redo) await D.click(redo);
      await D.sleep(800);
    },
  },
  {
    id: 'tema-warna',
    label: 'Enam tema warna',
    caption: 'Satu klik mengganti warna seluruh modul — dan pratinjau di sebelah ikut berubah saat itu juga.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'cover')) return false;
      await D.say(cap, 0);
      /* Diambil dari LAYAR, bukan dari daftar tema yang disalin ke sini.
         Tema baru yang ditambahkan ke themes.ts otomatis ikut dikelilingi,
         dan tidak ada daftar kedua yang bisa ketinggalan. */
      const preset = Array.from(document.querySelectorAll<HTMLElement>('[data-demo="tema-preset"]'));
      if (!preset.length) return false;
      for (const b of preset) {
        D.chk();
        await D.cursorTo(b);
        b.click();
        await D.sleep(820);   // cukup buat mata menangkap preview-nya berganti
      }
      /* Ditutup dengan kembali ke tema bawaan (preset pertama): putaran
         berikutnya harus mulai dari tampilan yang sama, dan pengunjung yang
         mengambil alih tepat di sini tidak mewarisi warna acak. */
      await D.click(preset[0]);
      await D.sleep(700);
    },
  },
  {
    id: 'tema-grafis',
    label: 'Gaya grafis',
    caption: 'Di atas warna ada gaya grafis — dekorasi yang dipakai sampul dan tiap slide.',
    run: async (D, cap) => {
      const pemicu = qDemo('graphic-style');
      if (!pemicu) return false;
      await D.say(cap, 0);
      await D.click(pemicu);
      const daftar = await D.tunggu(() => document.querySelector('[data-demo="graphic-style-list"]'), 1500);
      if (daftar) {
        const opsi = Array.from(daftar.querySelectorAll<HTMLElement>('[data-demo="graphic-style-opt"]')).slice(0, 6);
        await D.sapu(opsi, 620);       // sapu mengirim mouseover betulan -> pratinjau tiap gaya ikut muncul
        if (opsi[1]) await D.click(opsi[1]);
      }
      await D.sleep(1100);
    },
  },
  {
    id: 'sampul',
    label: 'Gambar sampul',
    caption: 'Gambar sampul tinggal dipilih dari komputer — judulnya tetap terbaca karena gradasi gelapnya sudah bawaan.',
    run: async (D, cap) => {
      const unggah = qDemo('unggah-sampul');
      if (!unggah) return false;
      await D.say(cap, 0);
      await D.cursorTo(unggah);
      await D.sleep(700);
      /* TIDAK diklik. Klik betulan membuka dialog berkas milik sistem operasi:
         dialog itu di luar halaman, demo tidak bisa menutupnya lagi, dan booth
         berhenti di situ sampai ada orang yang menekan Escape. Gambarnya
         dipasang lewat jalur data. */
      D.patch({ coverImageDataUri: GAMBAR_SAMPUL_CONTOH, coverImageBrightness: 100 });
      await D.sleep(2600);   // biar pratinjau sampulnya sempat ditonton
    },
  },
  {
    id: 'penutup',
    label: 'Slide penutup',
    caption: 'Modul juga punya layar penutup sendiri — kalimat terakhir yang dibaca peserta, bukan sekadar slide habis.',
    run: async (D, cap) => {
      const judul = await D.tunggu(() => qDemo('ending-title'), 1500);
      if (!judul) return false;
      await D.say(cap, 0);
      await D.type(judul, 'Sampai Jumpa di<br><span>Modul Lanjutan</span>');
      const desc = qDemo('ending-desc');
      if (desc) await D.type(desc, 'Terima kasih sudah menuntaskan materi ini.');
      D.patch({ endingImageDataUri: GAMBAR_PENUTUP_CONTOH, endingImageBrightness: 45 });
      await D.sleep(2600);
    },
  },
  {
    id: 'kuis',
    label: 'Kuis per bagian',
    caption: 'Kuis dibuat per bagian, kunci jawabannya ditandai di tempat — dan bisa dijadikan gerbang: belum benar, belum boleh lanjut.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'quiz')) return false;
      await D.say(cap, 0);
      const tambah = qDemo('tambah-soal');
      if (!tambah) return false;
      await D.click(tambah);
      const tanya = await D.tunggu(() => inp('Pertanyaan'));
      if (tanya) await D.type(tanya, 'Mana yang BUKAN pilar perbendaharaan?');
      const opsiA = inp('Opsi A');
      if (opsiA) await D.type(opsiA, 'Perencanaan yang terukur');
      await D.sleep(1200);
    },
  },
  {
    id: 'preview',
    label: 'Pratinjau utuh',
    caption: 'Sebelum diserahkan, modulnya bisa dijalankan utuh persis seperti yang akan dibuka peserta.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'preview')) return false;
      await D.say(cap);
      await D.sleep(600);
    },
  },
  {
    id: 'export',
    label: 'Hasil akhir',
    caption: 'Hasilnya satu berkas HTML yang berdiri sendiri — atau paket SCORM siap unggah ke LMS. Tidak butuh server sendiri.',
    run: async (D, cap) => {
      /* Sengaja HANYA disorot, tidak diklik: satu klik = satu unduhan
         sungguhan di mesin booth, berulang tiap putaran sepanjang hari. */
      const tombol = ['export-html', 'export-scorm', 'export-json']
        .map(qDemo).filter((el): el is HTMLElement => !!el);
      if (!tombol.length) return false;
      await D.say(cap, 0);
      await D.sapu(tombol, 900);
      await D.sleep(900);
    },
  },
  {
    id: 'command',
    label: 'Command Center',
    caption: 'Sesudah modulnya dipakai, rekaman belajar peserta masuk ke sini — per orang, per slide. Terkunci password, isinya data sungguhan.',
    run: async (D, cap) => {
      const t = T('command');
      if (!t) return false;
      await D.say(cap, 0);
      await D.cursorTo(t);   // ditunjuk, tidak dibuka
      await D.sleep(2600);
    },
  },
  {
    id: 'tema-app',
    label: 'Tema aplikasi',
    caption: 'Aplikasinya sendiri punya mode gelap — menyusun modul sering berlangsung sampai malam.',
    run: async (D, cap) => {
      const tombol = document.querySelector<HTMLElement>('[title^="Ganti ke mode"]');
      if (!tombol) return false;
      await D.say(cap, 0);
      await D.click(tombol);
      await D.sleep(2400);
      const balik = document.querySelector<HTMLElement>('[title^="Ganti ke mode"]');
      if (balik) await D.click(balik);   // putaran berikutnya harus mulai dari tampilan yang sama
      await D.sleep(600);
    },
  },
];
