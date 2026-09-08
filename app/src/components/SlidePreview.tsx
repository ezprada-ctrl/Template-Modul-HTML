import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ModuleData } from '../types';
import { generateHtml } from '../api';
import { langgananBlokAktif } from './BlockEditor';

interface Props {
  module: ModuleData;
  slideNumber?: number;
  target?: 'slide' | 'hero' | 'summary';
  label?: string;
  // Dipanggil waktu penyusun klik-dua-kali sebuah slide DI DALAM preview:
  // editor di panel kiri lompat ke slide itu. Nomor slide, bukan id, karena
  // yang diketahui shell modul cuma nomor (NAV[currentIdx].num) - id blok &
  // slide gak ikut dibawa ke HTML jadinya.
  onPilihSlide?: (nomorSlide: number) => void;
}

// Lebar "layar" yang disimulasikan preview. Modulnya responsif: .grid3 jatuh
// ke 1 kolom di bawah 900px dan .grid2 di bawah 760px (lihat shell-template.html).
// Panel preview di samping editor jauh lebih sempit dari itu, jadi kalau iframe-nya
// dibiarkan selebar panel, blok Grid tampil BERJEJER KE BAWAH - penyusun modul
// mengira gridnya rusak, padahal hasil akhirnya di layar penuh baik-baik saja.
// Solusinya: iframe tetap dirender pada lebar desktop tetap ini, lalu SELURUH
// isinya diperkecil pakai transform:scale() supaya muat di panel. Yang dilihat
// jadi bentuk asli modul, cuma lebih kecil - bukan versi mobile-nya.
const LEBAR_LOGIS = 1280;

// Tinggi "layar" yang disimulasikan. DIPATOK, bukan ngikut tinggi panel:
// modulnya pakai layout setinggi layar dengan area isi yang scroll sendiri,
// jadi kalau tinggi logisnya ikut berubah tiap panel di-resize, proporsi
// sampul & kartu ikut goyang dan preview berhenti mewakili layar beneran.
const TINGGI_LOGIS = 800;

// Lebar sidebar modul dalam satuan layar logis di atas - #sidebar di
// shell-template.html. Dipakai buat menaruh & mengukur petunjuk klik-dua-kali
// tepat di atas sidebar itu; kalau angka di sana berubah, angka ini ikut.
const LEBAR_SIDEBAR = 314;

// Batas zoom manual. Di bawah 25% teks modulnya udah gak kebaca sama sekali;
// di atas 300% yang kelihatan cuma piksel yang direntang - dua-duanya bukan
// sesuatu yang berguna buat ngecek tata letak.
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
// Kelipatan per klik. 1.25 cukup kecil buat ngintip detail tanpa kelewat,
// tapi tetap kerasa gerak dalam sekali klik.
const LANGKAH = 1.25;

// Apakah penyusun modul MENYALAKAN SENDIRI Dev Mode di dalam preview.
//
// Sengaja di luar komponen, bukan useRef: tiap slide punya panel preview
// sendiri, jadi pindah slide/section bikin komponennya di-mount ulang dan
// state di dalamnya hangus. Yang diminta justru sebaliknya - Dev Mode nyala
// sekali, lalu bertahan ke manapun penyusunnya menggeser, sampai dia sendiri
// yang mematikannya. Nilai bersama satu tab ini yang bikin itu mungkin.
//
// TIDAK disimpan ke localStorage: Dev Mode dijaga password, dan menyimpannya
// bakal bikin sesi berikutnya masuk tanpa pernah ditanya. Muat ulang halaman
// = mulai bersih, dan itu memang disengaja.
//
// Dev Mode yang dinyalakan sekejap oleh jumpToSlide() (buat nembus gerbang
// section waktu lompat slide) TIDAK dihitung di sini - lihat pemasangan
// pengamat di jumpToSlide().
let devModeDipilihPenyusun = false;

// Live preview of a single slide (or the cover/hero screen), rendered by
// generating the full module HTML and jumping the embedded page straight to
// that slide (bypassing section gating via devMode) — so editors see the
// real output next to the fields they're editing, instead of hopping to the
// far-away Preview & Export tab.
export default function SlidePreview({ module, slideNumber, target = 'slide', label, onPilihSlide }: Props) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Penomor permintaan - bukan cuma debounce timer. Debounce cuma nahan timer
  // BARU nyala pas masih ngetik; begitu 500ms lewat, generateHtml() jalan di
  // background dan permintaan BERIKUTNYA (dari ketikan setelahnya) bisa lolos
  // ke server juga sebelum yang pertama balik. Kalau jaringan gak stabil,
  // yang pertama bisa balik BELAKANGAN dan nimpa preview dengan konten lama.
  // Nomor ini dicek sebelum setHtml/setError - hasil yang bukan permintaan
  // TERAKHIR dibuang, gak peduli urutan baliknya.
  const requestIdRef = useRef(0);
  // Latest known scroll offset of the iframe's #viewport - kept alive across
  // reloads. Every edit swaps srcDoc, which is a full iframe navigation (a
  // fresh document, scrollTop 0), and jumpToSlide()'s goTo() call explicitly
  // resets scroll to 0 too (correct for a REAL slide change) - so without
  // this, someone scrolled down to see a block they just added gets yanked
  // back to the top on every single keystroke-triggered re-render.
  const scrollTopRef = useRef(0);
  // Keadaan "lagi kebuka" di dalam preview - popup mana yang lagi tampil,
  // accordion mana yang lagi mekar, tab & langkah alur mana yang lagi aktif.
  // Alasannya sama persis dengan scrollTopRef di atas: tiap edit mengganti
  // srcDoc, dan itu navigasi iframe penuh yang bikin dokumen baru dengan
  // semuanya balik tertutup. Tanpa ini, penyusun yang lagi menyusun ISI
  // sebuah popup harus buka popup itu lagi tiap nambah satu item cuma buat
  // lihat hasilnya.
  //
  // Bentuk isinya ditentukan snapshotUI() di shell-template.html - sengaja
  // dianggap kotak hitam di sini: yang tahu bentuk DOM tiap blok berkas itu,
  // bukan komponen ini. Sebagai useRef (bukan nilai bersama satu tab seperti
  // devModeDipilihPenyusun) supaya pindah slide = mulai bersih; keadaan
  // kebuka itu milik slide yang lagi disunting, bukan milik sesi.
  const bukaanRef = useRef<unknown>(null);
  // Blok yang lagi diedit di panel kiri, dikabarkan BlockEditor. Disimpan di
  // ref, bukan state: nilainya cuma dipakai buat menggulir, gak ada yang perlu
  // dirender ulang gara-gara ini.
  const blokAktifRef = useRef<string | null>(null);
  // Blok yang TERAKHIR sudah digulirin. Ini yang bikin preview cuma ikut
  // pindah waktu blok yang diedit BERGANTI - bukan tiap kali halaman dibangun
  // ulang. Tanpa pembeda ini, tiap ketikan bakal menyeret preview balik ke
  // blok itu terus, dan panelnya gak bisa digulir manual sama sekali karena
  // setengah detik kemudian ditarik lagi.
  const blokTergulirRef = useRef<string | null>(null);

  // Menggulir isi preview ke blok yang lagi diedit. Dipanggil dua tempat:
  // waktu bloknya berganti (iframe-nya masih itu-itu juga), dan sesudah
  // iframe dimuat ulang (dokumennya baru, elemennya baru).
  function gulirKeBlokAktif() {
    const id = blokAktifRef.current;
    if (!id || id === blokTergulirRef.current) return;
    const doc = iframeRef.current?.contentDocument;
    const viewport = doc?.getElementById('viewport');
    if (!doc || !viewport) return;
    const el = doc.querySelector(`[data-blok="${CSS.escape(id)}"]`) as HTMLElement | null;
    // Blok yang belum ada di slide ini (baru ditambah, HTML-nya belum dibangun
    // ulang) dibiarkan - jangan tandai sudah tergulir, biar dicoba lagi sesudah
    // pembangunan berikutnya.
    if (!el) return;
    blokTergulirRef.current = id;
    // Dihitung dari selisih posisi, bukan scrollIntoView(): scrollIntoView
    // ikut menggulirkan HALAMAN EDITOR di luar iframe supaya iframe-nya
    // kelihatan, dan itu bikin panel kiri ikut melompat tiap ganti blok.
    const selisih = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    // Disisakan sepertiga layar di atasnya: blok yang mepet ke tepi atas
    // kelihatan seperti terpotong, dan judul yang menaunginya sering justru
    // ada di atas blok itu.
    viewport.scrollTop += selisih - viewport.clientHeight / 3;
    scrollTopRef.current = viewport.scrollTop;
  }

  // Menyorot blok yang lagi diedit - dan MEMBIARKANNYA menyala selama blok itu
  // masih yang digarap. Dulu cuma sekejap 1,2 detik, jadi begitu penyusunnya
  // selesai mengetik satu kalimat, penanda di kanan sudah padam sementara
  // penanda "sedang diedit" di kiri masih menyala: dua panel jadi bilang hal
  // yang beda. Sekarang keduanya nyala bareng sampai pindah blok.
  //
  // Dipisah dari gulirKeBlokAktif() karena syaratnya beda: guliran cuma waktu
  // bloknya BERGANTI (biar gak menyeret panel tiap ketikan), sorotan tiap
  // dokumen baru dibangun (karena dokumennya baru, class-nya ikut hilang).
  function sorotBlokAktif() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const id = blokAktifRef.current;
    // Yang lama dipadamkan dulu - tanpa ini bekas sorotan menumpuk dan
    // beberapa blok menyala sekaligus, yang justru menghapus maknanya.
    doc.querySelectorAll('.blok-disorot').forEach(el => el.classList.remove('blok-disorot'));
    if (!id) return;
    doc.querySelector(`[data-blok="${CSS.escape(id)}"]`)?.classList.add('blok-disorot');
  }

  useEffect(() => langgananBlokAktif(id => {
    blokAktifRef.current = id;
    gulirKeBlokAktif();
    sorotBlokAktif();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  // Panel preview ikut melar/menyusut (layout editor, jendela di-resize), jadi
  // ukurannya diukur ulang - bukan konstanta.
  const wadahRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState({ w: 0, h: 0 });
  // null = ikut "Pas" (otomatis muat panel). Angka = zoom yang dipilih sendiri,
  // dan sengaja BERTAHAN waktu panelnya di-resize: kalau ikut dihitung ulang,
  // zoom yang barusan dipilih bakal hilang sendiri tiap layout editor bergeser.
  const [zoom, setZoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    const ukur = () => setPanel({ w: el.clientWidth, h: el.clientHeight });
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Skala yang bikin seluruh "layar" simulasi muat di panel. Gak pernah
  // DIPERBESAR lewat 1: kalau panelnya kebetulan lebih lebar dari LEBAR_LOGIS,
  // membesarkan cuma bikin teks buram tanpa nunjukin apa pun yang baru.
  const skalaPas = panel.w && panel.h
    ? Math.min(1, panel.w / LEBAR_LOGIS, panel.h / TINGGI_LOGIS)
    : 1;
  const skala = zoom ?? skalaPas;

  function ubahZoom(kali: number) {
    setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (z ?? skalaPas) * kali)));
  }

  // Skala dibaca juga dari dalam listener yang dipasang ke dokumen iframe.
  // Listener itu dipasang sekali per pemuatan iframe, jadi kalau dia menutup
  // nilai `skala` langsung, yang kebaca bakal nilai LAMA setiap kali zoom
  // berubah tanpa iframe dimuat ulang. Ref-nya selalu mutakhir.
  const skalaRef = useRef(skala);
  skalaRef.current = skala;

  // Popup blok itu overlay position:fixed - dia menutupi SELURUH layar
  // simulasi (1280x800), bukan cuma bagian yang lagi kelihatan di panel.
  // Waktu preview di-zoom melewati lebar panel, sebagian layar simulasi ada di
  // luar pandangan, dan popup yang muncul di sana kelihatan cuma separuh -
  // persis keluhan "popupnya setengah". Begitu popup kebuka, panelnya digeser
  // supaya kotak popup-nya ketengah; kalau semuanya udah kelihatan, gak ada
  // yang digeser.
  function bawaPopupKeLayar() {
    const wadah = wadahRef.current;
    const doc = iframeRef.current?.contentDocument;
    if (!wadah || !doc) return;
    const box = doc.querySelector('.modal-overlay.open .modal-box') as HTMLElement | null;
    if (!box) return;
    const s = skalaRef.current;
    const r = box.getBoundingClientRect();
    const tengahX = (r.left + r.width / 2) * s;
    const tengahY = (r.top + r.height / 2) * s;
    wadah.scrollTo({
      left: tengahX - wadah.clientWidth / 2,
      top: tengahY - wadah.clientHeight / 2,
      // Langsung, bukan smooth: popup itu muncul seketika, dan menggeser panel
      // pelan-pelan bikin sekejap pertama tetap nampak popup separuh - keluhan
      // yang justru mau dihilangkan.
      behavior: 'auto',
    });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    const myRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const out = await generateHtml(module);
        if (myRequestId !== requestIdRef.current) return; // sudah kesalip permintaan lebih baru
        setHtml(out);
        setError('');
      } catch (e: any) {
        if (myRequestId !== requestIdRef.current) return;
        setError(e.message || 'Gagal generate preview');
      } finally {
        if (myRequestId === requestIdRef.current) setLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(module)]);

  function jumpToSlide() {
    const win = iframeRef.current?.contentWindow as any;
    if (!win) return;
    const findExpr = target === 'hero' ? `it.kind === 'hero'`
      : target === 'summary' ? `it.kind === 'summary'`
      : `it.kind === 'slide' && it.num === ${slideNumber}`;
    // Lompat-ke-slide sengaja punya try SENDIRI. Dulu satu try membungkus
    // seluruh fungsi ini, jadi kalau eval di bawah gagal - shell modulnya
    // belum siap, atau ada satu galat kecil di modul yang besar - SEMUA yang
    // di bawahnya ikut dilewati diam-diam: pemulihan guliran, pemulihan
    // popup, sorotan blok, sampai pemicu klik-dua-kali. Gagal senyap yang
    // mematikan fitur yang gak ada hubungannya sama sekali.
    // Sekarang tiap urusan berdiri sendiri: yang gagal cuma dirinya.
    try {
      win.eval(`
        devMode = true;
        const idx = NAV.findIndex(it => ${findExpr});
        // Biasanya halaman ini SUDAH mulai di slide yang benar - __PV_START
        // (disuntik di bawah) sudah menaruh currentIdx sebelum render pertama.
        // Kalau begitu, goTo() cuma bikin render ulang percuma yang mereset
        // guliran; dilewati saja.
        if (idx >= 0 && idx !== currentIdx) goTo(idx);
        // Dev Mode was only needed to jump straight here past section/quiz
        // gates that don't matter for "how does this one slide look" - left
        // on, it also silently skips every OTHER gate (Knowledge Check's
        // leave-slide popup, quiz lock, reading-speed nag), making them look
        // broken when someone clicks Next/Prev inside this preview to test
        // them. toggleDevMode() (not a raw "devMode = false") so the sidebar
        // lock icons and Dev Mode button state stay in sync with the real
        // (now non-dev) gating - not just the variable.
        if (devMode) toggleDevMode();
        ${devModeDipilihPenyusun ? 'if (typeof enableDevMode === "function") enableDevMode(false);' : ''}
      `);
    } catch {
      // Shell-nya belum siap menerima perintah lompat slide. Bukan alasan
      // buat membatalkan sisanya.
    }

    try {
      // Kalau penyusun modul sendiri yang menyalakan Dev Mode di dalam preview,
      // pilihan itu miliknya - bukan sesuatu yang boleh dimatikan diam-diam
      // oleh proses generate ulang. Tombolnya dipantau lewat class .active
      // (satu-satunya jejak keadaan Dev Mode yang kelihatan dari luar), dan
      // hasilnya dipakai buat menyalakan ulang di pemuatan berikutnya - lihat
      // enableDevMode() di shell-template.html. Dipasang SESUDAH eval di atas
      // supaya mematikan-sementara buat lompat slide gak kebaca sebagai
      // "penyusunnya mematikan Dev Mode".
      const tombolDev = win.document.getElementById('devmode-btn');
      if (tombolDev) {
        const pantauDev = new win.MutationObserver(() => {
          devModeDipilihPenyusun = tombolDev.classList.contains('active');
        });
        pantauDev.observe(tombolDev, { attributes: true, attributeFilter: ['class'] });
      }
      // Restore the scroll offset the PREVIOUS document had, then keep
      // tracking it live on this fresh one so the next reload has something
      // current to restore. Re-attached every load since srcDoc gives a
      // brand new document (and thus a brand new #viewport) each time.
      const viewport = win.document.getElementById('viewport');
      if (viewport) {
        viewport.scrollTop = scrollTopRef.current;
        viewport.addEventListener('scroll', () => { scrollTopRef.current = viewport.scrollTop; });
      }
      // Pasang balik apa yang tadi kebuka SEBELUM pengamat di bawah dipasang,
      // supaya pemasangan-balik ini sendiri gak kebaca sebagai "penyusunnya
      // barusan membuka sesuatu". bawaPopupKeLayar() dipanggil manual di sini
      // karena alasan yang sama - pengamatnya belum ada waktu popup-nya
      // dipasang balik, jadi gak ada yang memicu penggeseran panelnya.
      if (bukaanRef.current && typeof win.restoreUI === 'function') {
        win.restoreUI(bukaanRef.current);
        bawaPopupKeLayar();
      }
      // Popup dibuka/ditutup lewat class .open, bukan lewat event yang bisa
      // didengarkan - jadi perubahan class-nya yang diamati. Dipasang ulang
      // tiap iframe dimuat karena srcDoc bikin dokumen yang benar-benar baru.
      // Pengamat yang sama sekalian dipakai buat memotret keadaan kebuka:
      // keempat blok itu (popup/accordion/tab/alur) semuanya menandai
      // keadaannya lewat class, jadi mutasi class memang persis sinyal yang
      // dibutuhkan - gak perlu pengamat kedua.
      // Dokumen ini baru, jadi blok yang tadi sudah dituju belum tentu ada
      // lagi di sini - patokannya dilupakan supaya gulirannya diulang.
      // TAPI cuma kalau bloknya memang berganti; kalau penyusunnya cuma
      // mengetik di blok yang sama, blokTergulirRef tetap sama dengan
      // blokAktifRef dan gulirKeBlokAktif() gak melakukan apa-apa - posisi
      // guliran hasil restore di atas yang dipakai.
      gulirKeBlokAktif();
      sorotBlokAktif();

      // Menandai dokumen ini sebagai "lagi dilihat di panel editor". Semua
      // petunjuk khusus editor (termasuk ajakan klik-dua-kali di bawah)
      // digantung ke kelas ini, jadi modul yang diekspor - yang gak pernah
      // dapat kelas ini - bersih dari petunjuk yang cuma berguna waktu
      // menyusun. Pola yang sama dengan pv-restoring.
      win.document.documentElement.classList.add('pv-editor');

      // Klik dua kali DI MANA PUN dalam preview = buka slide yang lagi tampil
      // itu di editor kiri.
      //
      // Dideteksi dari DUA KLIK BERURUTAN, bukan dari event 'dblclick'. Ini
      // bukan selera - event dblclick memang gak bisa dipakai di sini:
      // renderSidebar() di shell menjalankan wrap.innerHTML = '' tiap goTo(),
      // jadi begitu klik pertama menavigasi, tombol sidebar yang lagi diklik
      // DIMUSNAHKAN. Klik kedua mengenai tombol yang baru, dan dblclick-nya
      // berakhir di simpul yang sudah lepas dari dokumen - gak pernah
      // menggelembung ke document, jadi pemicunya gak pernah jalan. Persis
      // itu sebabnya klik-ganda di sidebar kelihatan mati sementara di badan
      // slide jalan.
      //
      // Menghitung klik sendiri kebal terhadap itu: tiap 'click' terjadi pada
      // elemen yang saat itu MASIH nyambung, jadi dua-duanya selalu tercatat.
      // Fase capture, biar tetap kehitung walau ada yang menghentikan
      // penggelembungan di tengah jalan.
      if (onPilihSlide) {
        let klikTerakhir = 0;
        let xTerakhir = -999;
        let yTerakhir = -999;
        win.document.addEventListener('click', (e: Event) => {
          const m = e as MouseEvent;
          const kini = Date.now();
          // Harus cepat DAN di tempat yang sama - dua klik buru-buru di dua
          // tombol berbeda itu bukan klik-ganda, dan gak boleh ikut memicu.
          // 500ms, menyamai bawaan kecepatan klik-ganda Windows. 400ms sempat
          // dipakai dan itu lebih ketat daripada yang dianggap "klik ganda"
          // oleh sistem - klik ganda yang santai sedikit bakal gak kebaca.
          const cepat = kini - klikTerakhir < 500;
          const dekat = Math.abs(m.clientX - xTerakhir) < 24 && Math.abs(m.clientY - yTerakhir) < 24;
          klikTerakhir = kini;
          xTerakhir = m.clientX;
          yTerakhir = m.clientY;
          if (!cepat || !dekat) return;
          // Klik ketiga jangan dianggap pasangan baru dari klik kedua.
          klikTerakhir = 0;
          // Ditunda: kalau yang diklik item sidebar atau tombol
          // Sebelumnya/Selanjutnya, modul BARU pindah slide sesudah
          // handler-nya sendiri jalan. Membaca NAV[currentIdx] seketika bakal
          // dapat slide LAMA - editornya lompat ke slide yang barusan
          // ditinggalkan.
          setTimeout(() => {
            // Lewat eval, BUKAN win.NAV / win.currentIdx: keduanya
            // dideklarasikan let/const di shell, dan binding let/const
            // tingkat-atas TIDAK jadi properti window - dibaca dari luar
            // hasilnya selalu undefined.
            let nomor: number | null = null;
            try {
              nomor = win.eval(
                '(typeof NAV !== "undefined" && NAV[currentIdx] && NAV[currentIdx].kind === "slide")'
                + ' ? NAV[currentIdx].num : null',
              );
            } catch { /* shell belum siap - klik ini diabaikan saja */ }
            if (typeof nomor === 'number') onPilihSlide(nomor);
          }, 80);
        }, true);
      }

      const pengamat = new win.MutationObserver(() => {
        if (typeof win.snapshotUI === 'function') bukaanRef.current = win.snapshotUI();
        bawaPopupKeLayar();
      });
      pengamat.observe(win.document.body, {
        subtree: true, attributes: true, attributeFilter: ['class'],
      });
    } catch {
      // iframe not ready yet, ignore
    }
  }

  // Slide yang mau dituju, dititipkan ke halaman preview SEBELUM skripnya
  // jalan. Tanpa ini halaman mulai dari sampul dan baru dilompatkan sesudah
  // iframe selesai dimuat - dan karena tiap ketikan mengganti srcDoc (navigasi
  // iframe penuh), sampul itu KEDIP dulu tiap kali. Dengan titipan ini render
  // pertama sudah di slide yang benar, jadi yang terlihat cuma isinya berubah.
  const htmlSiap = html
    ? html.replace(
        '<head>',
        '<head><scr' + 'ipt>window.__PV_START='
          + JSON.stringify(target === 'slide' ? { kind: 'slide', num: slideNumber } : { kind: target })
          + ';</scr' + 'ipt>',
      )
    : '';

  // Petunjuk klik-dua-kali diukur & diluruskan ke sidebar di dalam iframe.
  const lebarPetunjuk = LEBAR_SIDEBAR * skala;
  // Jarak tepi kiri iframe dari tepi kiri panel - wadahnya menengahkan isinya
  // (justifyContent:'safe center'), jadi begitu preview lebih kecil dari panel
  // ada sisa di kiri yang harus ikut dihitung. Kalau preview-nya LEBIH LEBAR,
  // sisanya nol dan petunjuknya rata kiri, sama seperti iframe-nya.
  const offsetKiri = Math.max(0, (panel.w - LEBAR_LOGIS * skala) / 2);
  // Kalimatnya ~48 karakter dan gak boleh patah dua baris. Rumusnya bikin
  // hurufnya menciut mengikuti sidebar, tapi DIREM di 8,5px: di bawah itu
  // petunjuknya berhenti terbaca dan mendingan dia meleber sedikit melewati
  // sidebar daripada jadi garis abu-abu tanpa makna. Batas atas 11px supaya
  // waktu preview di-zoom besar dia gak berubah jadi judul.
  const fontPetunjuk = Math.min(11, Math.max(8.5, lebarPetunjuk / 26));

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', height: '100%', minHeight: 420, display: 'flex', flexDirection: 'column', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-faint)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label || (
          target === 'hero' ? 'Preview langsung — sampul'
          : target === 'summary' ? 'Preview langsung — slide penutup'
          : `Preview langsung — slide #${slideNumber}`
        )}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading && <span>memperbarui…</span>}
          {/* Zoom ini SENGAJA cuma nyentuh iframe preview - bukan zoom browser -
              supaya editor di sebelahnya tetap ukuran normal waktu penyusun
              modul lagi ngintip detail satu blok. */}
          <button
            className="btn-icon btn-sm btn-ghost"
            onClick={() => ubahZoom(1 / LANGKAH)}
            disabled={skala <= ZOOM_MIN + 0.001}
            title="Perkecil preview"
          >&minus;</button>
          {/* Persennya sekaligus tombol balik ke "Pas" - tempat yang paling
              gampang dituju setelah kejauhan zoom, tanpa nambah tombol lagi. */}
          <button
            className="btn-sm btn-ghost"
            onClick={() => setZoom(null)}
            disabled={zoom === null}
            title={zoom === null ? 'Sudah pas dengan panel' : 'Kembalikan supaya pas dengan panel'}
            style={{ minWidth: 52, fontVariantNumeric: 'tabular-nums', letterSpacing: 0 }}
          >{Math.round(skala * 100)}%</button>
          <button
            className="btn-icon btn-sm btn-ghost"
            onClick={() => ubahZoom(LANGKAH)}
            disabled={skala >= ZOOM_MAX - 0.001}
            title="Perbesar preview"
          >+</button>
        </span>
      </div>
      {/* Ajakan klik-dua-kali. Ditaruh di kepala panel - DI LUAR iframe -
          karena apa pun yang melayang di dalam halaman preview kelihatan
          seperti bagian dari modul yang lagi disusun, padahal ini perkakas
          editor. Di sini dia juga gak pernah menutupi apa pun.

          Diluruskan PERSIS di atas sidebar: lebarnya selebar sidebar
          (dikalikan skala yang sama dengan iframe-nya) dan digeser sejauh
          jarak iframe dari tepi kiri panel - jadi petunjuknya menunjuk ke
          benda yang dimaksud, bukan mengambang di tengah panel.

          Nadanya sengaja samar (--text-faint di atas --surface-2) dan cuma
          bernapas pelan lewat opacity: cukup kebaca kalau matanya mampir,
          gak menuntut apa-apa kalau lagi fokus ke isinya. */}
      {onPilihSlide && (
        <div style={{ paddingLeft: offsetKiri, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div
            className="pv-petunjuk-strip"
            style={{ width: lebarPetunjuk, fontSize: fontPetunjuk }}
          >
            Klik 2× slide di <i>sidebar</i> — langsung terbuka di editor
          </div>
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, padding: 10 }}>{error}</p>}
      <div
        ref={wadahRef}
        style={{
          flex: 1,
          // Begitu di-zoom melewati ukuran panel, isinya digeser-geser di sini.
          overflow: 'auto',
          // "safe" centering: pas preview lebih kecil dari panel dia ketengah,
          // tapi pas lebih besar dia balik nempel ke kiri-atas - tanpa itu, sisi
          // kiri & atas kepotong dan gak bisa di-scroll balik.
          display: 'grid',
          justifyContent: 'safe center',
          alignContent: 'safe center',
        }}
      >
        {htmlSiap && (
          // transform:scale() gak mengubah ukuran yang DIHITUNG layout, jadi
          // wadah scroll-nya gak bakal tau preview-nya membesar. Kotak ini yang
          // memegang ukuran hasil-perkecilan itu, supaya scrollbar-nya muncul.
          <div style={{ width: LEBAR_LOGIS * skala, height: TINGGI_LOGIS * skala, position: 'relative' }}>
            <iframe
              ref={iframeRef}
              srcDoc={htmlSiap}
              onLoad={jumpToSlide}
              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                // Ukuran dipasang dalam satuan SEBELUM diperkecil - inilah
                // "layar" yang disimulasikan; transform-nya yang mengecilkan.
                width: LEBAR_LOGIS,
                height: TINGGI_LOGIS,
                transform: `scale(${skala})`,
                transformOrigin: '0 0',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
