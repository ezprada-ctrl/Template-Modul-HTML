/* Pemeriksa dua mesin demo. Jalan di `npm run build` (lihat "prebuild"),
 * jadi ketidakcocokan menggagalkan BUILD - bukan cuma menulis pesan yang
 * mungkin tidak pernah ada yang baca.
 *
 * KENAPA ADA. Dua mesin demo ini mengendarai barang yang bisa berubah tanpa
 * mereka ikut disesuaikan, dan tiap kali itu terjadi langkahnya HILANG DIAM-
 * DIAM - bukan error, bukan layar merah, cuma satu fitur yang tidak pernah
 * dipamerkan lagi. Sudah dua kali kejadian di proyek ini (co-creation & rekap
 * mati berbulan-bulan). Peringatan di console sudah ditambahkan, tapi console
 * cuma ketahuan kalau ada yang kebetulan membukanya waktu demonya jalan.
 * Berkas ini yang menutup celah itu.
 *
 * SENGAJA STATIS, tanpa browser headless. Playwright dkk berarti satu
 * dependensi besar plus waktu build yang panjang, dan yang mau dijaga di sini
 * semuanya bisa dijawab dari teks sumbernya: cocok/tidaknya katalog dengan
 * kenyataan. Yang cuma bisa dijawab dengan benar-benar menjalankan demo
 * (temponya enak ditonton atau tidak) memang tidak dijaga di sini.
 *
 * MENAMBAH PEMERIKSAAN: satu fungsi yang memanggil gagal(...) kalau ada yang
 * tidak cocok, lalu daftarkan di PEMERIKSAAN paling bawah.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(AKAR, '..');

const masalah = [];
const gagal = (judul, rincian) => masalah.push({ judul, rincian });
const baca = p => readFileSync(p, 'utf8');

const F = {
  katalogModul: resolve(AKAR, 'src/demoSteps.ts'),
  langkahBooth: resolve(AKAR, 'src/builderDemo/steps.ts'),
  mesinBooth: resolve(AKAR, 'src/builderDemo/engine.ts'),
  blokLabel: resolve(AKAR, 'src/components/BlockAddMenu.tsx'),
  tema: resolve(AKAR, 'src/themes.ts'),
  app: resolve(AKAR, 'src/App.tsx'),
  shell: resolve(REPO, 'server/api/shell-template.html'),
};

// ---------------------------------------------------------------- pemeriksaan

/* 1. Tiap langkah di katalog demo modul HARUS punya aksi di shell, dan
      sebaliknya. Ini pasangan yang paling gampang menyimpang karena
      keduanya hidup di berkas berbeda, bahasa berbeda, dan project deploy
      yang berbeda pula - satu sisi ter-deploy, satunya belum, dan booth
      diam-diam kehilangan satu langkah. */
function katalogModulCocokDenganAksi() {
  if (!existsSync(F.shell)) {
    console.warn('[cek-demo] shell-template.html tidak ada di checkout ini - pemeriksaan katalog modul dilewati');
    return;
  }
  const katalog = [...baca(F.katalogModul).matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map(m => m[1]);
  const aksi = [...baca(F.shell).matchAll(/^\s{2}'([a-z0-9-]+)': async \(D/gm)].map(m => m[1]);

  const tanpaAksi = katalog.filter(id => !aksi.includes(id));
  const tanpaKatalog = aksi.filter(id => !katalog.includes(id));
  if (tanpaAksi.length) {
    gagal('Langkah demo modul tanpa aksi di shell-template.html',
      tanpaAksi.map(id => `  '${id}' ada di demoSteps.ts tapi tidak ada di DEMO_ACTIONS`));
  }
  if (tanpaKatalog.length) {
    gagal('Aksi demo modul tanpa entri katalog',
      tanpaKatalog.map(id => `  '${id}' ada di DEMO_ACTIONS tapi tidak ada di demoSteps.ts`));
  }
}

/* 2. Dua mesin, satu perilaku. Ambang idle yang beda bikin dua booth
      berdampingan menunggu beda lama - dan yang lebih lama terbaca sebagai
      rusak. Komentar saling-mengingatkan sudah ada di kedua berkas; ini yang
      menegakkannya. */
function ambangIdleSamaDiDuaMesin() {
  if (!existsSync(F.shell)) return;
  const ambil = (teks) => {
    const m = teks.match(/DEMO_IDLE_RESUME_MS\s*=\s*(\d+)/);
    return m ? Number(m[1]) : null;
  };
  const booth = ambil(baca(F.mesinBooth));
  const modul = ambil(baca(F.shell));
  if (booth == null || modul == null) {
    gagal('DEMO_IDLE_RESUME_MS tidak ketemu', [`  booth: ${booth}, modul: ${modul}`]);
    return;
  }
  if (booth !== modul) {
    gagal('Ambang idle dua mesin demo berbeda',
      [`  engine.ts = ${booth} ms, shell-template.html = ${modul} ms`,
       '  Dua booth berdampingan yang menunggu beda lama terbaca sebagai salah satunya rusak.']);
  }
}

/* 3. Sasaran langkah TIDAK BOLEH dicari lewat teks yang tampil. Teks tombol
      itu kalimat buat manusia - boleh diganti kapan saja, dan dulu memang
      pernah: satu label berubah, satu langkah demo mati tanpa suara. Lebih
      buruk lagi, mencarinya di seluruh sumber terlalu longgar; "Edit blok"
      yang hilang dari tombol tapi masih ada di kalimat bantuan lolos begitu
      saja. Sekarang semua sasaran pakai kait data-demo yang diperiksa di
      bawah, dan pemeriksaan ini menjaga supaya pola lamanya tidak balik. */
function tidakAdaSasaranBerbasisTeks() {
  const langkah = baca(F.langkahBooth);
  const pakai = [...langkah.matchAll(/qTeks\(/g)].length;
  if (pakai) {
    gagal('Langkah demo booth mencari sasaran lewat teks yang tampil',
      [`  ${pakai} pemakaian qTeks() di builderDemo/steps.ts.`,
       '  Pasang kait data-demo di komponennya lalu pakai qDemo() - teks tombol',
       '  boleh diganti kapan saja dan langkahnya akan mati tanpa suara.']);
  }
}

/* 4. Nama data-demo yang dipakai langkah harus benar-benar terpasang di
      komponennya. Ini kait yang sengaja ditanam buat demo, jadi paling
      gampang ikut terhapus waktu komponennya dirapikan. */
function kaitDataDemoTerpasang() {
  const langkah = baca(F.langkahBooth);
  const sumber = kumpulkanSumber();

  /* Kait bernama, dipanggil langsung: qDemo('cover-title') dsb. */
  const bernama = [
    ...[...langkah.matchAll(/qDemo\('([a-z0-9-]+)'\)/g)].map(m => m[1]),
    /* Selektor yang ditulis langsung, mis. [data-demo="blok-opsi"] - dipakai
       waktu satu kait menandai banyak elemen sekaligus. */
    ...[...langkah.matchAll(/\[data-demo="([a-z0-9-]+)"\]/g)].map(m => m[1]),
  ];
  const terpasang = (n) => sumber.includes(`data-demo="${n}"`) || sumber.includes(`demoHook="${n}"`);
  const hilang = bernama.filter(n => !terpasang(n));

  /* Kait TAB dirakit di runtime - T('quiz') jadi [data-demo="tab-quiz"] - jadi
     namanya tidak pernah muncul utuh di sumber dan tidak bisa dicari apa
     adanya. Diperiksa dua sisi: atributnya masih dipasang di baris tab, dan
     tiap id tab yang dituju langkah memang ada di daftar TABS. Tanpa ini,
     menghapus atribut itu dari App.tsx melumpuhkan SEMUA langkah demo booth
     tanpa satu pun pemeriksaan yang berbunyi. */
  const idTab = new Set([
    ...[...langkah.matchAll(/bukaTab\(D, '([a-z]+)'\)/g)].map(m => m[1]),
    ...[...langkah.matchAll(/T\('([a-z]+)'\)/g)].map(m => m[1]),
  ]);
  if (idTab.size) {
    if (!sumber.includes('data-demo={`tab-${t.id}`}')) {
      hilang.push('tab-* (atribut data-demo di baris tab App.tsx sudah tidak ada - ' +
                  idTab.size + ' langkah demo ikut mati)');
    }
    const tabAda = [...baca(F.app).matchAll(/\{ id: '([a-z]+)', label:/g)].map(m => m[1]);
    for (const id of idTab) {
      if (!tabAda.includes(id)) hilang.push(`tab-${id} (tab '${id}' sudah tidak ada di TABS)`);
    }
  }

  if (hilang.length) {
    gagal('Kait data-demo yang dipakai demo booth tidak terpasang di komponen',
      hilang.map(n => `  ${n}`));
  }
}

/* 5. Tiap tipe blok harus habis terbagi antara daftar "bintang" dan "ragam".
      Tipe blok BARU yang ditambahkan ke aplikasi otomatis bikin pemeriksaan
      ini gagal - itulah maksudnya: blok baru tidak boleh diam-diam absen dari
      booth yang justru memamerkan keragaman blok. Dibandingkan lewat ID TIPE
      (BlockType), bukan label, karena itu yang sekarang dipakai demo. */
function semuaTipeBlokDipamerkan() {
  const tipe = [...baca(F.blokLabel).matchAll(/^\s{2}([a-z]+): '/gm)].map(m => m[1]);
  const langkah = baca(F.langkahBooth);
  const daftar = (nama) => [...(langkah.split('const ' + nama + ' = [')[1] || '').split(']')[0]
    .matchAll(/'([a-z]+)'/g)].map(m => m[1]);
  const disebut = [...daftar('BLOK_BINTANG'), ...daftar('BLOK_RAGAM')];
  const DIKECUALIKAN = ['articulate'];   // minta paket ZIP; tanpa berkasnya cuma blok kosong
  const absen = tipe.filter(t => !DIKECUALIKAN.includes(t) && !disebut.includes(t));
  const asing = disebut.filter(t => !tipe.includes(t));
  if (absen.length || asing.length) {
    gagal('Daftar blok demo booth tidak cocok dengan BLOCK_LABELS', [
      ...absen.map(t => `  '${t}' ada di aplikasi tapi tidak pernah dipamerkan - tambahkan ke BLOK_BINTANG/BLOK_RAGAM`),
      ...asing.map(t => `  '${t}' dipamerkan demo tapi bukan tipe blok yang ada`),
    ]);
  }
}

/* 6. Langkah tema menyapu tombol preset LANGSUNG DARI LAYAR, jadi tidak ada
      daftar kedua yang bisa ketinggalan waktu tema baru ditambahkan. Yang
      tersisa buat dijaga cuma kaitnya masih terpasang. */
function kaitTemaTerpasang() {
  const sumber = kumpulkanSumber();
  if (!sumber.includes('data-demo="tema-preset"')) {
    gagal('Kait tombol preset tema hilang',
      ['  data-demo="tema-preset" tidak ada di app/src - langkah keliling tema mati.']);
  }
  if (baca(F.langkahBooth).includes('TEMA_PRESET')) {
    gagal('Daftar tema disalin lagi ke katalog demo',
      ['  Sapu tombolnya dari layar ([data-demo="tema-preset"]), jangan menyalin daftarnya:',
       '  salinan kedua pasti ketinggalan waktu ada tema baru.']);
  }
}

/* 7. Caption tidak boleh ditulis ulang sebagai literal di dalam run(): dua
      salinan satu kalimat pasti menyimpang, dan yang tampil di booth belum
      tentu yang disunting orang. */
function captionTidakDitulisDuaKali() {
  const langkah = baca(F.langkahBooth);
  const literal = [...langkah.matchAll(/D\.say\('/g)].length;
  if (literal) {
    gagal('Caption ditulis ulang di dalam run()',
      [`  ${literal} panggilan D.say('...') dengan teks literal.`,
       "  Pakai argumen `cap` - caption cukup ditulis sekali di field caption."]);
  }
}

// ------------------------------------------------------------------- penolong

/* Seluruh sumber app/src disatukan jadi satu teks, dibaca sekali. Dipakai
   buat menjawab satu pertanyaan saja: "teks/kait ini masih ada di UI atau
   tidak". Ditelusuri manual, bukan pakai glob, supaya jalan di versi Node
   mana pun yang kebetulan dipakai mesin build. */
let _sumber = null;
function kumpulkanSumber() {
  if (_sumber) return _sumber;
  const potongan = [];
  const telusuri = (dir) => {
    for (const isi of readdirSync(dir, { withFileTypes: true })) {
      const jalur = resolve(dir, isi.name);
      /* builderDemo/ DIKECUALIKAN dengan sengaja. Yang ditanyakan pemeriksaan
         ini: "kaitnya masih terpasang di KOMPONEN?" - dan berkas demo sendiri
         menyebut nama kait itu di selektornya. Kalau ikut dibaca, kait yang
         sudah dicabut dari komponennya tetap 'ketemu' di berkas yang
         mencarinya, dan pemeriksaannya jadi selalu lolos. */
      if (isi.isDirectory()) { if (isi.name !== 'builderDemo') telusuri(jalur); }
      else if (isi.name.endsWith('.ts') || isi.name.endsWith('.tsx')) potongan.push(baca(jalur));
    }
  };
  telusuri(resolve(AKAR, 'src'));
  _sumber = potongan.join('\n');
  return _sumber;
}

// ---------------------------------------------------------------------- jalan

const PEMERIKSAAN = [
  katalogModulCocokDenganAksi,
  ambangIdleSamaDiDuaMesin,
  tidakAdaSasaranBerbasisTeks,
  kaitDataDemoTerpasang,
  semuaTipeBlokDipamerkan,
  kaitTemaTerpasang,
  captionTidakDitulisDuaKali,
];

for (const p of PEMERIKSAAN) p();

if (masalah.length) {
  console.error('\n[cek-demo] ' + masalah.length + ' masalah ditemukan:\n');
  for (const m of masalah) {
    console.error('  ✗ ' + m.judul);
    for (const b of m.rincian) console.error('  ' + b);
    console.error('');
  }
  console.error('Build dihentikan. Lihat app/scripts/cek-demo.mjs buat penjelasan tiap pemeriksaan.\n');
  process.exit(1);
}

console.log(`[cek-demo] ${PEMERIKSAAN.length} pemeriksaan lolos - dua mesin demo masih cocok dengan UI-nya.`);
