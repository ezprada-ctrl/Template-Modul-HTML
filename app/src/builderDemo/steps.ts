import type { DemoCtx, DemoStep } from './engine';
import { qDemo } from './engine';
import { GAMBAR_SAMPUL_CONTOH, GAMBAR_PENUTUP_CONTOH } from './sampleAssets';
import { TUR_BLOK } from './blokTur';

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

/* Panggung tur blok: slide KOSONG terakhir di proyek contoh (lihat
   sampleProject.ts). Dibuka sendiri oleh tiap entri tur - satu blok yang
   gagal tidak boleh menyeret sisanya, dan tiap langkah di katalog ini memang
   memposisikan dirinya sendiri. */
async function bukaPanggungBlok(D: DemoCtx) {
  /* Tab cuma diklik kalau memang belum di sana. Tur blok memanggil ini 15
     kali; klik yang sudah tidak perlu tetap memakan animasi kursor + jeda
     sesudah klik, dan lima belas kali dua detik itu setengah menit. */
  if (!qDemo('edit-blok')) {
    if (!await bukaTab(D, 'canvas')) return false;
  }
  const semua = await D.tunggu(() => {
    const daftar = document.querySelectorAll<HTMLElement>('[data-demo="edit-blok"]');
    return daftar.length ? daftar[daftar.length - 1] : null;
  }, 4000);
  if (!semua) return false;
  if (semua.dataset.buka === '0') await D.click(semua);
  /* Panggung dikosongkan DI AWAL tiap blok, bukan cuma dibereskan di akhir.
     Penghapusan di ujung langkah tetap ada karena itu bagian yang ditonton -
     tapi mengandalkannya saja ternyata tidak cukup: sekali satu penghapusan
     meleset, blok itu tinggal di panggung, lalu langkah berikutnya bisa
     menyunting sisa blok lama alih-alih yang baru dia buat. Sepuluh dari
     lima belas blok pernah tertinggal seperti itu dalam satu putaran.
     Dibereskan tanpa animasi: ini kerapian, bukan bagian pertunjukan. */
  for (let i = 0; i < 30; i++) {
    D.chk();
    const sisa = document.querySelectorAll<HTMLElement>('[data-demo="blok-baris"] [data-demo="hapus-blok"]');
    if (!sisa.length) break;
    sisa[0].click();
    await D.sleep(120);
  }
  return true;
}

/* Opsi di menu "+ Tambah blok" dicari lewat id TIPE-nya (data-blok), bukan
   lewat teks labelnya: label boleh diganti kapan saja, id tipe bagian dari
   struktur data. */
const blokOpsi = (tipe: string) => document.querySelector<HTMLElement>(`[data-demo="blok-opsi"][data-blok="${tipe}"]`);

const barisBlok = (tipe: string) => document.querySelector<HTMLElement>(`[data-demo="blok-baris"][data-blok="${tipe}"]`);

/* Tipe blok yang disorot di langkah 'blok-pratinjau', beserta lama diamnya.
   Bukan semuanya: delapan belas tipe kali beberapa detik bikin satu langkah
   makan semenit lebih, padahal tur blok di bawah toh merakit semuanya satu
   per satu. Yang dipilih di sini mewakili DUA hal yang mau ditunjukkan -
   bahwa contohnya muncul sama sekali, dan bahwa yang interaktif contohnya
   pun ikut bergerak.

   Lama diamnya beda-beda dengan sengaja. Pratinjau accordion, tabs, diagram
   alur, dan modal punya kursor kecil yang mengklik contohnya sendiri
   (lihat useCycleWithClick di BlockPreview.tsx); disorot sekejap, yang
   tertangkap mata cuma satu bingkai diam - persis kesan yang justru mau
   dibantah. Angkanya disetel satu putaran penuh animasi masing-masing. */
const SOROT_OPSI: { tipe: string; diam: number }[] = [
  { tipe: 'card', diam: 1000 },
  { tipe: 'timeline', diam: 1000 },
  { tipe: 'accordion', diam: 3600 },
  { tipe: 'tabs', diam: 4000 },
  { tipe: 'flow', diam: 4200 },
  { tipe: 'modal', diam: 3000 },
];

const T = (n: string) => qDemo('tab-' + n);
const inp = (ph: string) => document.querySelector<HTMLElement>(`[placeholder="${ph}"]`);

async function bukaTab(D: DemoCtx, id: string) {
  const t = T(id);
  if (!t) return false;
  await D.click(t);
  return true;
}

/* Dialog Export Paket dipakai DUA langkah berturut-turut, jadi yang kedua
   tidak boleh mengandalkan yang pertama meninggalkannya terbuka: demo bisa
   dijeda tepat di antara keduanya (pengunjung menyentuh layar), dan yang
   melanjutkan adalah langkah kedua. Sama seperti tiap langkah di katalog
   ini, dia memposisikan dirinya sendiri. */
async function bukaDialogPaket(D: DemoCtx) {
  if (qDemo('paket-konsep')) return true;
  if (!await bukaTab(D, 'preview')) return false;
  const pemicu = qDemo('export-paket');
  if (!pemicu) return false;
  await D.click(pemicu);
  return !!await D.tunggu(() => qDemo('paket-konsep'));
}

/* Dialognya WAJIB ditutup di ujung. Booth jalan berjam-jam tanpa penjaga,
   dan dialog yang tertinggal terbuka menyandera seluruh putaran
   berikutnya - tiap langkah sesudahnya mencari sasaran yang tertutup
   olehnya. */
async function tutupDialogPaket(D: DemoCtx) {
  const tutup = qDemo('paket-tutup');
  if (tutup) await D.click(tutup);
  await D.sleep(400);
}

export const BUILDER_DEMO_STEPS: DemoStep[] = [
  {
    id: 'alur',
    label: 'Alur enam tab',
    caption: 'Menyusun modul jalannya berurut: ambil bahan, tata, percantik, uji, lalu ekspor.',
    run: async (D, cap) => {
      /* Langkah PERTAMA putaran, jadi di sinilah sisa putaran sebelumnya
         dibereskan. Yang dijaga satu hal: dialog Export Paket dibuka satu
         langkah dan ditutup langkah berikutnya, dan di antara keduanya demo
         bisa dijeda lalu ditinggal pengunjung. Putaran baru yang mulai di
         belakang dialog itu gagal di hampir tiap langkahnya. Ditutup tanpa
         animasi: ini kerapian, bukan bagian pertunjukan. */
      qDemo('paket-tutup')?.click();

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
    id: 'blok-pratinjau',
    label: 'Intip contoh tiap tipe blok',
    caption: 'Tidak perlu menebak-nebak: tiap tipe blok cukup disorot, contohnya langsung muncul di samping — dan yang interaktif, contohnya pun ikut bergerak sendiri.',
    run: async (D, cap) => {
      if (!await bukaPanggungBlok(D)) return false;
      const pemicu = await D.tunggu(() => qDemo('tambah-blok'), 4000);
      if (!pemicu) return false;
      await D.say(cap, 0);
      await D.click(pemicu);
      if (!await D.tunggu(() => blokOpsi('card'), 2000)) return false;
      for (const s of SOROT_OPSI) {
        D.chk();
        const opsi = blokOpsi(s.tipe);
        if (!opsi) continue;          // tipe dihapus dari aplikasi: lewati, jangan jatuhkan langkahnya
        /* hover(), bukan cursorTo(): kursor palsu cuma gambar, dan
           pratinjaunya digantung di onMouseEnter. Tanpa event yang dikirim
           betulan, yang tampil di booth cuma daftar yang diam - keluhan yang
           persis bikin langkah ini ada. */
        await D.hover(opsi);
        await D.sleep(s.diam);
      }
      /* Ditutup lewat pemicunya sendiri - tombolnya saklar. Escape tidak
         dipakai: penangkapnya menuntut fokus ada di dalam menu, dan kursor
         demo tidak pernah memindahkan fokus ke sana. Menu yang tertinggal
         terbuka menutupi kertas kerja sepanjang tur blok di bawah. */
      await D.click(qDemo('tambah-blok'));
      await D.sleep(500);
    },
  },
  ...TUR_BLOK.map(entri => ({
    id: 'blok-' + entri.tipe,
    label: 'Blok: ' + entri.tipe,
    caption: entri.caption,
    run: async (D: DemoCtx, cap: string) => {
      if (entri.lewati) {
        /* Cuma dijelaskan. Tidak ada yang dirakit, tapi captionnya tetap
           tampil selama yang lain - jadi dari kursi penonton dia terbaca
           sebagai satu fitur lagi, bukan sebagai jeda kosong. */
        await D.say(cap);
        return;
      }
      if (!await bukaPanggungBlok(D)) return false;

      /* 1. Tambah bloknya */
      const pemicu = await D.tunggu(() => qDemo('tambah-blok'), 4000);
      if (!pemicu) return false;
      await D.click(pemicu);
      const opsi = await D.tunggu(() => blokOpsi(entri.tipe), 2000);
      if (!opsi) return false;
      await D.click(opsi);

      /* 2. Isi field-nya, berurutan posisi. Lihat catatan di blokTur.ts soal
            kenapa posisi dan bukan placeholder. */
      const baris = await D.tunggu(() => barisBlok(entri.tipe), 2500);
      if (!baris) return false;
      const field = Array.from(baris.querySelectorAll<HTMLElement>('input[type="text"], input:not([type]), textarea'));
      for (let i = 0; i < (entri.isi || []).length && i < field.length; i++) {
        D.chk();
        await D.type(field[i], entri.isi![i]);
      }

      /* 2b. Bentuk akhirnya dipasang sekaligus. Lihat catatan panjang di
             blokTur.ts: mengetik dua field pertama saja meninggalkan blok
             setengah jadi, dan pengunjung booth menilai PRODUKNYA dari
             pratinjau itu - bukan menilai demonya. */
      if (entri.lengkap) {
        D.patchBlok(entri.lengkap);
        await D.sleep(600);
      }

      /* 3. Hasil jadinya: kursor mengelilingi pratinjau sambil captionnya
            menjelaskan. Ini bagian yang paling menjawab "jadinya kayak apa" -
            mengisi field saja cuma memperlihatkan pekerjaannya, bukan
            hasilnya. */
      await D.sleep(700);   // pratinjau dirender ulang sesudah ketikan terakhir
      await D.say(cap, 0);
      /* Yang dikelilingi biasanya PRATINJAU - itu hasil jadinya. Kecuali buat
         blok yang memang tidak tampil inline (lihat `sorot` di blokTur.ts);
         di situ yang disorot kertas kerjanya, karena di sanalah isinya
         terlihat. */
      await D.kelilingi(entri.sorot === 'editor' ? baris : qDemo('pratinjau-slide'), 1);
      await D.sleep(700);

      /* 3b. DICOBA, bukan cuma dilihat. Buat blok interaktif, mengelilingi
             bentuk diamnya justru menyesatkan: yang tampil di pratinjau mirip
             gambar, dan pengunjung pulang mengira modulnya memang gambar.
             Di sini accordion-nya benar-benar dibuka, tab-nya benar-benar
             diganti, gerbangnya benar-benar menghadang - lihat `coba` di
             blokTur.ts. */
      if (entri.coba?.length) {
        /* Sasaran pertama DITUNGGU, dengan batas yang longgar: pratinjau
           dirender di server (debounce 500ms + satu perjalanan jaringan),
           jadi sesudah patchBlok bloknya memang belum tentu sudah ada di
           dalam iframe. Kalau sampai batas tetap tidak ada - jaringan booth
           sedang buruk - seluruh bagian ini dilewati, dan yang sudah
           ditonton penonton (perakitan + bentuk jadinya) tetap utuh. */
        const siap = await D.ftunggu(entri.coba[0].sel, 9000);
        if (siap) {
          if (entri.cobaCaption) await D.say(entri.cobaCaption, 0);
          for (const c of entri.coba) {
            D.chk();
            await D.fklik(c.sel);
            await D.sleep(c.jeda == null ? 1100 : c.jeda);
          }
        }
      }

      /* 4. Dihapus: blok berikutnya harus dapat panggung yang bersih. */
      const hapus = baris.querySelector<HTMLElement>('[data-demo="hapus-blok"]');
      if (hapus) await D.click(hapus);
      await D.sleep(400);
    },
  })),
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
    caption: 'Di atas warna ada gaya grafis — dan tiap gaya cukup disorot untuk melihat contohnya: sampul, slide, dan penutup sekaligus, sebelum satu pun dipilih.',
    run: async (D, cap) => {
      const pemicu = qDemo('graphic-style');
      if (!pemicu) return false;
      await D.say(cap, 0);
      await D.click(pemicu);
      const daftar = await D.tunggu(() => document.querySelector('[data-demo="graphic-style-list"]'), 1500);
      if (daftar) {
        /* SEMUANYA disapu, tidak dipotong enam. Yang dipamerkan di sini
           bukan "ada beberapa gaya" tapi "pilihannya sebanyak ini, dan
           semuanya bisa diintip dulu" - daftar yang dipotong justru
           mengecilkan angkanya. Diambil dari layar, jadi gaya baru di
           graphicStyles.ts otomatis ikut tersapu. */
        const opsi = Array.from(daftar.querySelectorAll<HTMLElement>('[data-demo="graphic-style-opt"]'));
        await D.sapu(opsi, 780);       // sapu mengirim mouseover betulan -> pratinjau tiap gaya ikut muncul
        if (opsi[1]) await D.click(opsi[1]);
      }
      await D.sleep(1400);
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
      /* Soalnya diisi SAMPAI UTUH, bukan berhenti di opsi A. Alasannya sama
         dengan `lengkap` di blokTur.ts: satu opsi terisi dari empat terbaca
         sebagai pekerjaan setengah jadi, dan pengunjung menilai produknya
         dari apa yang dia lihat di layar. */
      const opsi = ['Perencanaan yang terukur', 'Pelaksanaan yang tertib',
                    'Pertanggungjawaban yang terbuka', 'Penghapusan arsip tahunan'];
      for (let i = 0; i < opsi.length; i++) {
        D.chk();
        const kolom = inp('Opsi ' + String.fromCharCode(65 + i));
        if (kolom) await D.type(kolom, opsi[i]);
      }
      /* Kunci jawabannya BENAR-BENAR ditandai - itu yang dijanjikan caption
         ("ditandai di tempat"), dan tandanya kelihatan: kolomnya berubah
         hijau. Dicari lewat title, bukan teks yang tampil: radio-nya memang
         tidak punya label sendiri. */
      const kunci = document.querySelectorAll<HTMLElement>('input[title="Tandai sebagai jawaban benar"]');
      if (kunci[3]) await D.click(kunci[3]);
      const jelas = inp('Penjelasan jawaban');
      if (jelas) await D.type(jelas, 'Penghapusan arsip bukan pilar — justru arsipnya yang wajib disimpan.');
      await D.sleep(900);

      /* Dua mode kelulusan. Ini beda BESAR yang paling sering ditanya di
         booth, dan sebelumnya tidak pernah dipamerkan sama sekali: tiap
         tombol ditekan, penjelasan di bawahnya berganti mengikutinya. */
      const nilai = qDemo('kuis-mode-nilai');
      if (nilai) { await D.click(nilai); await D.sleep(2200); }
      const gerbang = qDemo('kuis-mode-gerbang');
      if (gerbang) { await D.click(gerbang); await D.sleep(2000); }
    },
  },
  {
    id: 'preview',
    label: 'Pratinjau utuh',
    caption: 'Sebelum diserahkan, modulnya bisa dijalankan utuh persis seperti yang akan dibuka peserta.',
    run: async (D, cap) => {
      if (!await bukaTab(D, 'preview')) return false;
      await D.say(cap, 0);
      /* Ditunjuk, tidak diklik: Live Preview membuka TAB BARU, dan tab baru
         di mesin booth berarti demo yang kehilangan halamannya sendiri -
         tidak ada yang mengembalikannya sampai ada orang yang menutup tab
         itu. Yang dijanjikan caption toh sudah terbukti sepanjang tur blok:
         pratinjau di sebelah editor itu modul yang sungguhan jalan. */
      await D.cursorTo(qDemo('live-preview'));
      await D.sleep(1600);
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
    id: 'paket',
    label: 'Banyak modul jadi satu',
    caption: 'Beberapa modul bisa dirakit jadi SATU berkas: dashboard di depan, seluruh modulnya tertanam di dalamnya. Sepuluh tampilan dashboard — dan semuanya bisa diintip dulu, satu per satu, sebelum satu pun dipilih.',
    run: async (D, cap) => {
      if (!await bukaDialogPaket(D)) return false;
      const kisi = qDemo('paket-konsep');
      if (!kisi) return false;
      await D.say(cap, 0);
      /* Nama pelatihannya diketik dulu. Kelihatan sepele, tapi inilah yang
         membedakan sepuluh pratinjau yang berkepala "Nama Pelatihan" dari
         sepuluh dashboard yang terlihat seperti barang jadi - dan kepala itu
         yang paling besar di layar. Dua-duanya toh berubah seketika, jadi
         sekalian memperlihatkan bahwa dashboard-nya mengikuti isian. */
      const namaPelatihan = inp('mis. Analisis Pengelolaan Keuangan Daerah');
      if (namaPelatihan) await D.type(namaPelatihan, 'Dasar-Dasar Perbendaharaan Negara');

      /* Digulirkan dulu, dan ini BUKAN kerapian - tanpa ini langkahnya nyaris
         tidak memperlihatkan apa pun. Dialognya panjang: kisi tampilan mulai
         di sekitar 820px dari atas dan pratinjaunya di bawahnya lagi, jadi
         pada jendela tinggi 950px dua-duanya di luar layar waktu dialog baru
         dibuka. Kursor demo menyorot kartu yang tidak kelihatan, pratinjaunya
         berganti di tempat yang tidak kelihatan juga. 'start', bukan
         'center': kisi (±380px) dan kotak pratinjau (±460px) baru muat
         berdua kalau kisinya ditempel ke atas. */
      kisi.scrollIntoView({ block: 'start', behavior: 'smooth' });
      await D.sleep(900);

      /* SEPULUH-SEPULUHNYA disorot, tidak lima. Kalimatnya menjanjikan
         sepuluh tampilan; memperlihatkan separuhnya lalu menutup dialog
         membuat janji itu tidak pernah dibuktikan, dan yang enam sisanya
         justru beberapa yang paling beda (Metro, Majalah, Rak, Fokus).
         Diambil dari layar, jadi tampilan ke-sebelas nanti ikut sendiri. */
      const kartu = Array.from(kisi.querySelectorAll('label'));
      for (const k of kartu) {
        D.chk();
        /* Disorot, bukan diklik: yang mau ditunjukkan justru pratinjau yang
           berganti mengikuti kursor - dan hover memang harus dikirim
           betulan, karena kursor palsu cuma gambar. */
        await D.hover(k);
        await D.sleep(900);   // pratinjaunya dibangun ulang tiap kartu; di bawah ini kedipannya kebaca
      }
      /* Ditutup dengan benar-benar MEMILIH satu, lalu sorotnya DILEPAS.
         Dua-duanya perlu, dan yang kedua baru ketahuan waktu ditonton:
         pratinjau menampilkan `sorot ?? konsep`, sedangkan kursor palsu
         tidak pernah mengirim mouseleave - jadi tanpa lepas() sorotan
         nyangkut di kartu terakhir (Fokus) dan yang tampil bukan yang
         barusan dipilih. Langkah berikutnya lalu mencari isi tampilan Panel
         di dalam dashboard yang sedang merender Fokus, dan tidak menemukan
         apa-apa. */
      if (kartu[0]) await D.click(kartu[0]);
      await D.lepas(kartu[kartu.length - 1]);
      await D.sleep(1200);
    },
  },
  {
    id: 'paket-coba',
    label: 'Dashboard paket dicoba sungguhan',
    caption: 'Pratinjaunya bukan gambar contoh — dashboard yang sungguhan, dan bisa dipakai di tempat: dibesarkan, dicek tampilan HP-nya, dicari modulnya, diklik.',
    run: async (D, cap) => {
      if (!await bukaDialogPaket(D)) return false;
      await D.say(cap, 0);

      /* 1. Tampilan HP. Satu tombol, dan seluruh dashboard-nya dirender
            ulang pada lebar 390px - pertanyaan "di HP jadinya gimana?" itu
            pertanyaan pertama hampir tiap pengunjung booth. */
      await D.click(qDemo('paket-mode-hp'));
      await D.sleep(2200);
      await D.click(qDemo('paket-mode-desktop'));
      await D.sleep(1200);

      /* 2. Dibesarkan ke seluruh layar - di kotak kecil, dashboard yang
            diperkecil 40% memang cuma terbaca sebagai gambar. */
      await D.click(qDemo('paket-besar'));
      await D.sleep(1400);

      /* 3. DIPAKAI, bukan ditonton. Ini bagian yang menjawab "ini beneran
            jalan atau cuma gambar": kolom carinya diketik dan daftarnya
            menyempit, lalu satu modul diklik dan dashboard-nya menjawab.
            Selektornya milik konsep Panel - konsep yang dipilih langkah
            sebelumnya; kalau pengunjung terlanjur memindahkannya ke konsep
            lain, dua baris ini tidak ketemu sasaran dan dilewati diam-diam. */
      if (await D.ftunggu('#qPanel', 3000, 'paket')) {
        /* Kata pencariannya DIAMBIL dari kartu yang sedang tampil, tidak
           dipancangkan di sini. Nama modul di pratinjau ini nama contoh
           (tidak ada draft yang dicentang di booth), jadi kata apa pun yang
           ditulis mati - "perbendaharaan" sekalipun, senyata apa pun
           kedengarannya - akan menghasilkan "0 dari 6 modul": layar yang
           memamerkan pencarian yang tidak menemukan apa-apa. Diambil dari
           layar, hasilnya selalu menyempit ke sesuatu. */
        const kata = D.fteks('.p-card .nm', 'paket').split(/\s+/)[0];
        if (kata) {
          await D.fketik('#qPanel', kata.toLowerCase(), 'paket');
          await D.sleep(1400);
          await D.fketik('#qPanel', '', 'paket');
          await D.sleep(800);
        }
      }
      await D.fklik('.p-card', 'paket');
      await D.sleep(2600);   // toast-nya menjelaskan kenapa tab barunya tidak benar-benar terbuka di pratinjau

      await D.click(qDemo('paket-besar'));   // kembali ke ukuran kotak
      await D.sleep(700);
      await tutupDialogPaket(D);
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
