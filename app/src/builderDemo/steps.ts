import type { DemoCtx, DemoStep } from './engine';
import { qDemo, qTeks } from './engine';

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
    run: async (D) => {
      await D.say('Menyusun modul jalannya berurut: ambil bahan, tata, percantik, uji, lalu ekspor.', 0);
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
    run: async (D) => {
      if (!await bukaTab(D, 'bank')) return false;
      await D.say('Bahan tidak diketik ulang: satu file PPTX diurai jadi slide siap tata, lengkap dengan gambarnya.');
      await D.sleep(900);
    },
  },
  {
    id: 'canvas',
    label: 'Susun modul',
    caption: 'Slide disusun per bagian. Yang di kiri urutan materinya, yang di kanan pratinjaunya — tanpa perlu ekspor dulu.',
    run: async (D) => {
      if (!await bukaTab(D, 'canvas')) return false;
      await D.say('Slide disusun per bagian. Yang di kiri urutan materinya, yang di kanan pratinjaunya — tanpa perlu ekspor dulu.');
      await D.sleep(900);
    },
  },
  {
    id: 'judul-slide',
    label: 'Mengetik judul slide',
    caption: 'Setiap suntingan langsung terlihat hasilnya. Tidak ada tombol "render" yang harus ditunggu.',
    run: async (D) => {
      /* Kertas kerja slide baru muncul setelah "Edit blok" ditekan - daftar
         slide sendiri cuma urutan. Langkah ini yang MEMBUKANYA, dan langkah
         'blok' di bawah menumpang editor yang sama; keduanya ditutup di ujung
         'blok'. Dipisah begini karena captionnya memang dua hal berbeda. */
      const edit = qTeks('Edit blok');
      if (!edit) return false;
      await D.say('Setiap suntingan langsung terlihat hasilnya. Tidak ada tombol "render" yang harus ditunggu.', 0);
      await D.click(edit);
      const judul = await D.tunggu(() => inp('Judul slide'));
      if (!judul) return false;
      await D.type(judul, 'Tiga Pilar yang Harus Dipegang Setiap Hari');
      await D.sleep(1100);
    },
  },
  {
    id: 'blok',
    label: 'Ragam blok konten',
    caption: 'Isi slide dirakit dari blok siap pakai — kartu, accordion, tabel, timeline, kuis sisipan. Tidak ada satu pun HTML yang perlu diketik.',
    run: async (D) => {
      const pemicu = qTeks('Tambah blok');
      if (!pemicu) return false;
      await D.say('Isi slide dirakit dari blok siap pakai — kartu, accordion, tabel, timeline, kuis sisipan. Tidak ada satu pun HTML yang perlu diketik.', 0);
      await D.click(pemicu);
      /* Daftarnya dirender sesudah klik; menunggunya, bukan menebak jeda,
         karena mesin booth yang lambat bikin tebakan jeda meleset. */
      const daftar = await D.tunggu(() => qTeks('Accordion'));
      if (!daftar) return false;
      const pilihan = ['Kartu', 'Accordion', 'Tabel', 'Timeline', 'Knowledge Check']
        .map(t => qTeks(t)).filter((el): el is HTMLElement => !!el);
      await D.sapu(pilihan, 520);   // hover = tooltip penjelasnya ikut muncul
      const kartu = qTeks('Kartu');
      if (kartu) await D.click(kartu);
      await D.sleep(1400);
      const tutup = qTeks('Tutup');
      if (tutup) await D.click(tutup);   // kertas kerja yang dibuka langkah sebelumnya
    },
  },
  {
    id: 'undo',
    label: 'Undo / autosave',
    caption: 'Salah tekan tidak pernah fatal: semua langkah bisa dibatalkan, dan pekerjaan tersimpan sendiri tanpa diminta.',
    run: async (D) => {
      const undo = document.querySelector<HTMLElement>('[title^="Undo"]');
      const redo = document.querySelector<HTMLElement>('[title^="Redo"]');
      if (!undo) return false;
      await D.say('Salah tekan tidak pernah fatal: semua langkah bisa dibatalkan, dan pekerjaan tersimpan sendiri tanpa diminta.', 0);
      await D.click(undo);
      await D.sleep(900);
      if (redo) await D.click(redo);
      await D.sleep(800);
    },
  },
  {
    id: 'tema',
    label: 'Tema & sampul',
    caption: 'Satu tab mengatur wajah seluruh modul: judul, warna, gambar sampul, sampai mode presentasi kelas.',
    run: async (D) => {
      if (!await bukaTab(D, 'cover')) return false;
      await D.say('Satu tab mengatur wajah seluruh modul: judul, warna, gambar sampul, sampai mode presentasi kelas.', 0);
      const judul = qDemo('cover-title');
      if (judul) await D.type(judul, 'Dasar-Dasar Perbendaharaan Negara');
      await D.sleep(1200);
    },
  },
  {
    id: 'kuis',
    label: 'Kuis per bagian',
    caption: 'Kuis dibuat per bagian, kunci jawabannya ditandai di tempat — dan bisa dijadikan gerbang: belum benar, belum boleh lanjut.',
    run: async (D) => {
      if (!await bukaTab(D, 'quiz')) return false;
      await D.say('Kuis dibuat per bagian, kunci jawabannya ditandai di tempat — dan bisa dijadikan gerbang: belum benar, belum boleh lanjut.', 0);
      const tambah = qTeks('+ Soal');
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
    run: async (D) => {
      if (!await bukaTab(D, 'preview')) return false;
      await D.say('Sebelum diserahkan, modulnya bisa dijalankan utuh persis seperti yang akan dibuka peserta.');
      await D.sleep(600);
    },
  },
  {
    id: 'export',
    label: 'Hasil akhir',
    caption: 'Hasilnya satu berkas HTML yang berdiri sendiri — atau paket SCORM siap unggah ke LMS. Tidak butuh server sendiri.',
    run: async (D) => {
      /* Sengaja HANYA disorot, tidak diklik: satu klik = satu unduhan
         sungguhan di mesin booth, berulang tiap putaran sepanjang hari. */
      const tombol = ['Export HTML', 'Export SCORM', 'Export JSON']
        .map(t => qTeks(t)).filter((el): el is HTMLElement => !!el);
      if (!tombol.length) return false;
      await D.say('Hasilnya satu berkas HTML yang berdiri sendiri — atau paket SCORM siap unggah ke LMS. Tidak butuh server sendiri.', 0);
      await D.sapu(tombol, 900);
      await D.sleep(900);
    },
  },
  {
    id: 'command',
    label: 'Command Center',
    caption: 'Sesudah modulnya dipakai, rekaman belajar peserta masuk ke sini — per orang, per slide. Terkunci password, isinya data sungguhan.',
    run: async (D) => {
      const t = T('command');
      if (!t) return false;
      await D.say('Sesudah modulnya dipakai, rekaman belajar peserta masuk ke sini — per orang, per slide. Terkunci password, isinya data sungguhan.', 0);
      await D.cursorTo(t);   // ditunjuk, tidak dibuka
      await D.sleep(2600);
    },
  },
  {
    id: 'tema-app',
    label: 'Tema aplikasi',
    caption: 'Aplikasinya sendiri punya mode gelap — menyusun modul sering berlangsung sampai malam.',
    run: async (D) => {
      const tombol = document.querySelector<HTMLElement>('[title^="Ganti ke mode"]');
      if (!tombol) return false;
      await D.say('Aplikasinya sendiri punya mode gelap — menyusun modul sering berlangsung sampai malam.', 0);
      await D.click(tombol);
      await D.sleep(2400);
      const balik = document.querySelector<HTMLElement>('[title^="Ganti ke mode"]');
      if (balik) await D.click(balik);   // putaran berikutnya harus mulai dari tampilan yang sama
      await D.sleep(600);
    },
  },
];
