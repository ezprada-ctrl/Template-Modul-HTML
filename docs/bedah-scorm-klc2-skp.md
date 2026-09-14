# Bedah: SCORM "Penyusunan Sasaran Kinerja Pegawai" (KLC2)

Sumber: `https://klc2.kemenkeu.go.id/scorm/2026/9/14/1789346419366ugx/dist/index.html`
Dibedah dari bundel produksi: `index-77kLUD8J.js` (1,45 MB) + `index-BdqWs_AI.css` (138 KB).
Tanggal bedah: 2026-09-14.

## 1. Ringkas teknologi

| Hal | Temuan |
|---|---|
| Build | Vite, output `dist/` + `assets/` (hash), `<script type="module">`, judul `scorm-course` |
| UI | React (createRoot, StrictMode), JSX runtime otomatis |
| Styling | Tailwind (utility di JSX, `dark` class-based) |
| Animasi | framer-motion (variants + AnimatePresence + spring) |
| PDF | pdf.js lengkap (TextLayer, AnnotationLayer, AnnotationEditor) — viewer PDF di dalam slide |
| Efek | canvas-confetti, audio WAV (`win/lose/correct/wrong/mouse-click/background`) |
| Ikon | react-icons (path SVG di-inline) |
| **SCORM** | **Tidak ada.** Nol panggilan `API_1484_11` / `LMSInitialize` / `cmi.*`. Dibungkus sebagai paket SCORM, tapi pelaporan lewat xAPI ke server luar. |

## 2. Arsitektur aplikasi

### 2.1 Mesin layar (state machine di root)

```
loading -> intro -> opening -> tutorial -> slide <-> quiz -> end
```

Satu `useState` bernama `screen` + tiga indeks (`groupIndex`, `slideIndex`, `quizIndex`).
Tidak ada router. Semua transisi lewat callback (`onEnter`, `onStart`, `onUnderstand`,
`onCompleteTopic`, `onQuizComplete`, `onGoOpening`).

### 2.2 Resume otomatis via localStorage ber-stempel build

```js
const KEY = `app_state_build_1789346186863`;   // stempel build ikut di nama key
// simpan {screen, groupIndex, slideIndex, quizIndex} tiap kali berubah
// saat mount: baca, validasi screen ada di whitelist, pulihkan
```

Trik penting: **nama key memuat ID build**. Begitu modul di-build ulang, key berubah, progres
lama otomatis dibuang — tidak ada state basi yang menabrak struktur slide baru. Whitelist nilai
`screen` mencegah state korup bikin layar kosong.

### 2.3 Struktur konten: slide = komponen React, bukan data

```js
const GROUPS = [
  { slides: [{ component: Slide1, groupIndex:0, slideIndex:0, searchText: "...", topicIndex:0 }, ...],
    quizComponent: QuizGroup1 },
  { slides: [...], quizComponent: QuizGroup2 },
];
```

- 41 slide dibagi 2 grup (25 + 16), tiap grup ditutup satu kuis.
- Tiap slide punya kembaran teks polos `searchText`, dipakai fitur "Cari konten dalam E-Learning"
  tanpa perlu mem-parse DOM. **Builder-mu bisa meng-generate `searchText` otomatis dari blok teks.**
- `slideIndex` global lintas grup (grup 2 mulai dari 25), dipakai memetakan aset per slide:
  `./slides-data/group-{g+1}/{slideIndex+1}/opener.mp3`.

### 2.4 Preloader yang mengukur progres nyata

```js
const assets = import.meta.glob('/public/**/*');
const urls = Object.keys(assets).map(p => p.replace('/public/','./'));
urls.map(async u => { await fetch(u); done++; setPercent(Math.round(done/urls.length*100)); });
Promise.all(...).then(onLoaded);
```

Layar "Memuat aset..." menampilkan persentase asli **dan nama file yang sedang diambil**.
`import.meta.glob` bikin daftarnya otomatis — tidak ada manifest yang perlu dipelihara.

## 3. Layar-layar

### intro — video personal
- `screens-data/intro/video.mp4` autoplay muted fullscreen.
- Listener `timeupdate`: **4 detik sebelum video habis**, overlay identitas peserta muncul
  (foto + "Selamat Pagi/Siang/Sore/Malam, Sobat Pembelajar!" sesuai jam lokal).
- Foto gagal / URL mengandung `upload` -> fallback avatar inisial (huruf depan nama pertama + terakhir).
- Efek `shimmer` ditulis sebagai `<style>` inline di dalam komponen (keyframes lokal).

### opening / tutorial
- Latar `background-light.png` / `background-dark.png` per layar dan per grup.
- Tutorial = video + tombol **"OKE SAYA MENGERTI"** (`shimmer-btn`), kontrol bisa disembunyikan.

### slide (SlideContainer)
Kerangka tetap yang membungkus komponen slide:
- Latar per grup mengikuti tema: `./slides-data/group-{g+1}/background-{dark|light}.png`.
- Header: judul modul, kotak cari, tombol home, tombol layar Pengembang.
- **Narasi per slide**: tiap pindah slide, `new Audio('./slides-data/group-N/M/opener.mp3')`
  diputar; audio sebelumnya di-`pause()` + reset. Volume dan mute dikontrol context global.
- Panah kiri/kanan mengambang, muncul kondisional (`visible`, `forceVisible`).
- Panel setelan: dark mode, fullscreen, slider volume narasi, mute musik latar, home.
- Modal hasil pencarian -> lompat ke `slideIndex`.
- Slide terakhir -> `onCompleteTopic()` -> masuk kuis grup.

### quiz
- Data soal ringkas: `{ type, instruction, statements[], options[], correctAnswers[] }`.
  Tipe terdeteksi: `singleChoice`, `matching`, `ordering`.
- Satu mesin kuis generik dipakai ulang: `Quiz(props) => <QuizEngine {...props} quizData={DATA}/>`.
- **Batas lulus 70%.** Gagal -> "Ulangi Kuis" atau "Pelajari Ulang Materi" (balik ke slide 1 grup).
- Papan nomor soal berwarna: abu (belum), biru (terisi), kuning+ring (aktif), merah/hijau (setelah
  dikoreksi), plus badge `!` untuk soal kosong. Tombol kirim terkunci sampai semua terisi
  ("Lengkapi Semua Soal" <-> "Kirim Jawaban").
- Layout adaptif: 1 soal -> kolom aksi lebar; >1 soal -> kolom papan nomor.

### end
- Latar sesuai tema, tombol "Kembali ke Materi" dan **"Unduh PDF"**
  (`./screens-data/end/materi.pdf`, lewat `<a download>` sintetis).

## 4. Anatomi satu slide (pola paling layak dijiplak)

```jsx
<div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
  <Watermark/>
  <i className="absolute top-0 right-6 ...">#1</i>   {/* nomor slide besar di pojok */}
  <motion.div variants={container} initial="hidden" animate="visible"
       className="w-full max-w-5xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg
                  rounded-[clamp(...)] shadow-2xl p-[clamp(...)] border border-white/20">
    <header/> <grid kartu/>     {/* data slide = array lokal di file yang sama */}
  </motion.div>
  <AnimatePresence>{selected && <ModalDetail/>}</AnimatePresence>
</div>
```

Empat hal yang layak diadopsi:

1. **Tipografi & spasi fluid dengan `clamp(min, min(Xvw,Xvh), max)`.**
   Contoh nyata: `text-[clamp(2rem,min(6vw,6vh),4rem)]`, `p-[clamp(1.5rem,min(4vw,4vh),3rem)]`,
   `rounded-[clamp(0.75rem,min(3vw,3vh),1.5rem)]`.
   Kuncinya `min(vw,vh)`: ukuran mengikuti **sisi terpendek viewport**, jadi satu slide muat tanpa
   scroll baik di layar lebar-pendek (proyektor) maupun tinggi-sempit. Ini jawaban paling rapi untuk
   "slide harus pas satu layar" — jauh lebih sederhana daripada auto-scale JS.
2. **Kartu kaca**: `bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg` di atas background PNG per grup,
   sehingga satu set gambar latar dipakai semua slide dan teks tetap terbaca.
3. **Dark mode di semua level**: `dark:` di tiap utility, dua PNG latar, ikon ikut berubah.
4. **Pola "kartu -> modal detail"**: ringkasan pendek di kartu (`shortSummary`), detail panjang
   (`detailGroups: [{heading, items[]}]`) baru muncul di overlay. Memecah teks padat regulasi jadi
   interaksi. Tiap klik memanggil `playClick()`.

Ada helper warna bertema: `colorClasses('indigo'|'teal'|'purple'|'orange'|'emerald'|'rose')`
mengembalikan `{card, iconBg, icon, checkIcon}` (gradien + border + warna ikon, light & dark sekaligus).
**Ini persis bentuk "token warna blok" yang cocok untuk builder**: penulis konten memilih nama warna,
bukan menulis delapan kelas Tailwind.

## 5. Slide viewer PDF (fitur paling berat, paling menarik)

Salah satu slide menanam pdf.js untuk membaca `slides-data/kmk.pdf`:
- Mode "halaman contoh" (dibatasi halaman 152-154) vs "seluruh dokumen".
- Pencarian teks lintas halaman, maksimum 50 hasil, debounce ~450 ms, hasil bisa diklik untuk
  melompat; placeholder input menjelaskan batasannya.
- Overlay spinner saat render halaman, skala mengikuti `--total-scale-factor`.

Artinya dokumen regulasi tidak jadi lampiran terpisah, tapi bisa ditelusuri di dalam modul.

## 6. Audio & tema (context global)

Satu context menyediakan `playClick()`, `startBackground()`, `volumeNarasi/setVolumeNarasi`,
`isOpenerMuted/toggleOpenerMute` (narasi), `isBackgroundMuted/toggleBackgroundMute` (musik);
context tema menyediakan `isDark/toggleTheme` (menambah/menghapus class `dark` di `<html>`).
Tiga jalur audio dipisah tegas: **narasi per slide, musik latar, SFX (klik/benar/salah/menang/kalah)**.

## 7. Pelaporan: xAPI ke server pihak ketiga (bukan SCORM)

```
POST https://ptp.hafidhi.com/api/xapi/statements
{ verb, name, actor_mbox, statement: { actor:{objectType:"Peserta", mbox, name, photo}, object, context } }
```

Verb yang dipakai: `initialized` (aset selesai dimuat), `experienced` (opening, tutorial, tiap slide
dengan `context.extensions {slideNumber,totalSlides,screen}`), `interacted` (layar pengembang),
`mastered` (layar akhir).

### Cara modul mengenali peserta (paling patut dicatat)

```js
const html = await fetch('/', { credentials:'include' });          // homepage KLC2
const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const user = JSON.parse(m[1]).props.pageProps.session.user;         // {name, email, image_url}
localStorage.setItem('user_data', JSON.stringify(user));
```

Modul **mengorek `__NEXT_DATA__` dari halaman depan KLC2** memakai cookie sesi peserta, karena iframe
SCORM tidak diberi identitas. Ada fallback data dummy untuk `localhost` dan untuk origin selain
`klc2.kemenkeu.go.id`.

Catatan sebelum meniru:
- Nama, email, dan URL foto peserta dikirim ke **domain pribadi pihak ketiga** (`ptp.hafidhi.com`),
  bukan infrastruktur Kemenkeu. Untuk produksi ini isu tata kelola data.
- Data dummy di dalam bundel berisi nama, email, dan URL foto seorang pegawai — ikut ter-publish.
- Scraping `__NEXT_DATA__` rapuh: begitu KLC2 ganti versi Next.js atau bentuk sesi, identitas hilang
  dan xAPI diam-diam berhenti (`return null`, cuma `console.warn`).
- Kalau tujuannya pelaporan ke LMS, SCORM API asli (`cmi.core.lesson_status`, `cmi.core.score.raw`,
  `cmi.suspend_data`) lebih tepat dan tidak butuh izin jaringan keluar.

## 8. Struktur folder aset (konvensi rapi, langsung bisa ditiru)

```
public/
  audios/{background,mouse-click,correct,wrong,win,lose}.wav
  icons.svg  favicon.svg
  screens-data/
    intro/video.mp4
    opening/{background-light.png,background-dark.png,opener.mp3}
    tutorial/video.mp4
    end/{background-light.png,background-dark.png,materi.pdf}
  slides-data/
    kmk.pdf
    group-1/{background-light.png,background-dark.png}
    group-1/{1..25}/opener.mp3        # narasi per slide
    group-1/21/img.png                # gambar hanya bila slide butuh
    group-1/quiz/opener.mp3
    group-2/{26..41}/...
```

Konvensi "nomor slide = nama folder" membuat pemetaan aset bebas konfigurasi.

## 9. Daftar ambil-untuk-builder (prioritas)

| Prioritas | Yang diambil | Kenapa |
|---|---|---|
| Tinggi | `clamp(min, min(vw,vh), max)` untuk font/padding/radius | menyelesaikan "muat satu layar" tanpa JS |
| Tinggi | `searchText` per slide + modal pencarian | cari lintas modul, murah, bisa di-generate otomatis |
| Tinggi | resume localStorage ber-stempel build | progres pulih tanpa risiko state basi |
| Tinggi | preloader `import.meta.glob` + progres nyata | tak ada slide tampil sebelum aset siap |
| Tinggi | token warna blok (`colorClasses(name)`) | penulis konten pilih nama warna, bukan kelas Tailwind |
| Sedang | narasi `opener.mp3` per slide + 3 jalur audio terpisah | pola aset per-slide yang mudah diotomasi |
| Sedang | kuis: papan nomor berwarna, badge soal kosong, kunci tombol kirim, ambang 70%, "Pelajari Ulang Materi" | UX kuis yang sudah matang |
| Sedang | pola kartu -> modal detail (`shortSummary` + `detailGroups`) | memecah teks regulasi jadi interaksi |
| Sedang | konvensi folder `group-N/slideNo/` | pemetaan aset tanpa manifest |
| Rendah | intro video + sapaan personal berbasis jam & avatar inisial | efek "wah", butuh identitas peserta |
| Rendah | viewer PDF pdf.js dengan pencarian & batas halaman | berat (~1 MB bundel), hanya bila regulasi wajib inline |
| Hindari | xAPI ke domain pihak ketiga + scraping `__NEXT_DATA__` | isu data pribadi dan rapuh; pakai SCORM API asli |

## 10. Cara memverifikasi ulang temuan ini

```bash
curl -sL <url>/dist/index.html                      # cari nama bundel
curl -sL <url>/dist/assets/index-*.js -o app.js     # 1,45 MB, 264 baris
```

Bundel diminifikasi tapi **string tidak diobfuskasi**, dan esbuild memakai backtick untuk semua
literal string — jadi cari dengan pola `` `teks` ``, bukan `"teks"`. Kode aplikasi ada di ekor
berkas; ~200 baris pertama adalah vendor (pdf.js, framer-motion, confetti).
