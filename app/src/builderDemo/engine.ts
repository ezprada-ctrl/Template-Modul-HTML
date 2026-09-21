/* Mesin Demo Booth sisi PENYUSUN.
 *
 * Saudara kembar mesin demo di server/api/shell-template.html, tapi yang
 * dikendarai UI aplikasi ini, bukan modul hasil export. Semantiknya sengaja
 * dibikin sama persis - abort lewat runId, jeda begitu manusia menyentuh
 * layar, idle yang di-rearm tiap sentuhan, melanjutkan dari langkah yang
 * terpotong - karena dua booth yang berdiri berdampingan tapi berperilaku
 * beda bikin penunggu booth harus menjelaskan dua kali.
 *
 * Yang TIDAK dibagi dengan kembarannya: kodenya. Modul hasil export adalah
 * satu berkas HTML tanpa bundler yang harus tetap jalan sendirian di dalam
 * LMS, jadi tidak bisa mengimpor apa pun dari sini.
 */

import { setDemoBoothJalan } from './status';

export const DEMO_ABORT = { abort: true };

/* Ambang "sudah selesai mencoba" -> demo jalan lagi sendiri. Diturunkan dari
   45 detik: jeda sepanjang itu sesudah orang berhenti mengklik terbaca
   sebagai demonya MATI, bukan sedang menunggu. Yang dijaga dengan
   memendekkannya - direbut kursornya di tengah mencoba - tetap aman karena
   hitungannya disetel ulang di TIAP sentuhan (lihat pasangIdle), dan yang
   tidak mau menunggu sama sekali tinggal mengklik lencananya. Sama dengan
   kembarannya di shell-template.html; kalau yang satu diubah, ubah dua-duanya
   - dua booth berdampingan yang menunggu beda lama terbaca sebagai rusak. */
export const DEMO_IDLE_RESUME_MS = 20000;
const HOLD = 3400;  // caption dibaca sekitar segini
const MOVE = 600;   // sejalan dengan transition .bdemo-cursor
const AFTER = 900;  // jeda sesudah satu klik

export interface DemoCtx {
  chk: () => void;
  sleep: (ms: number) => Promise<void>;
  say: (teks: string, hold?: number) => Promise<void>;
  hide: () => void;
  cursorTo: (el: Element | null) => Promise<void>;
  click: (el: Element | null) => Promise<boolean>;
  type: (el: Element | null, teks: string) => Promise<void>;
  sapu: (els: Element[], jeda?: number) => Promise<void>;
  tunggu: (cari: () => HTMLElement | null, batas?: number) => Promise<HTMLElement | null>;
  /* Menyuntik perubahan langsung ke state modul, buat yang MUSTAHIL dilakukan
     lewat UI di booth: memilih berkas. Klik tombol unggah membuka dialog file
     milik sistem operasi - dialog itu di luar halaman, tidak bisa ditutup
     lagi oleh demo, dan booth-nya berhenti di situ sampai ada yang menekan
     Escape. Jadi tombolnya tetap disorot dan captionnya tetap menjelaskan
     "pilih gambar dari komputer", tapi gambarnya dipasang lewat sini. */
  patch: (bagian: Record<string, unknown>) => void;
  /* Memasang bentuk AKHIR blok yang barusan dibuat (blok terakhir di slide
     terakhir - panggung tur blok). Yang diketik tetap diketik; ini mengisi
     sisa strukturnya - panel accordion kedua-ketiga, baris tabel, anak grid -
     yang kalau harus diketik satu per satu bikin satu blok makan semenit,
     padahal yang mau ditunjukkan bentuk jadinya. */
  patchBlok: (data: Record<string, unknown>) => void;
  /* Kursor palsu cuma gambar - menggesernya ke atas sesuatu TIDAK memicu
     :hover maupun onMouseEnter React. Yang pratinjaunya baru muncul saat
     disorot (daftar tipe blok, daftar gaya grafis) butuh event ini dikirim
     betulan, kalau tidak yang tampil di booth cuma daftar yang diam. */
  hover: (el: Element | null) => Promise<void>;
  /* Kebalikan hover, dan tidak opsional di tempat yang memakainya. Kursor
     palsu tidak pernah MENINGGALKAN apa pun: dia cuma pindah gambar, jadi
     mouseleave tidak pernah terkirim dan sorotannya nyangkut di elemen
     terakhir yang disapu - selamanya, sampai ada manusia yang menggerakkan
     tetikus sungguhan. Kejadian di kisi tampilan dashboard: sesudah sepuluh
     kartunya disapu, pratinjaunya tetap menampilkan kartu terakhir yang
     disorot dan bukan yang benar-benar dipilih, lalu langkah berikutnya
     mencari isi tampilan yang memang tidak sedang dirender. */
  lepas: (el: Element | null) => Promise<void>;
  /* Kursor mengelilingi tepi sebuah elemen. Dipakai buat "lihat, ini hasil
     jadinya": menunjuk diam ke tengah panel tidak terbaca sebagai menunjuk
     apa pun, sedangkan gerak melingkar menarik mata ke daerahnya. */
  kelilingi: (el: Element | null, putaran?: number) => Promise<void>;

  /* ---------- panggung DI DALAM iframe ----------
   *
   * Pratinjau slide dan pratinjau dashboard paket dua-duanya iframe srcDoc -
   * satu origin, jadi isinya bisa disentuh dari sini. Ini yang bikin booth
   * bisa memamerkan blok interaktif SEBAGAI interaksi: accordion yang
   * benar-benar terbuka, tab yang benar-benar berganti, gerbang Knowledge
   * Check yang benar-benar menghadang - bukan cuma bentuk diamnya yang
   * dikelilingi kursor.
   *
   * Kenapa perlu primitif sendiri, tidak cukup click() biasa: kursor palsu
   * hidup di dokumen INDUK, sedangkan sasarannya di dokumen lain yang
   * digambar dengan transform:scale(). Koordinat mentah dari dalam iframe
   * menaruh kursor di tempat yang salah - kadang di luar kotak pratinjaunya
   * sama sekali - dan yang ditonton jadi kursor menunjuk ruang kosong sambil
   * sesuatu bergerak sendiri di sebelahnya. fklik() yang menerjemahkannya.
   */
  /** dokumen di dalam iframe pratinjau; null kalau belum ada/masih dimuat */
  fdoc: (panggung?: Panggung) => Document | null;
  /** menunggu selektor muncul DI DALAM iframe - tiap ketikan memuat ulang
      iframe-nya, jadi elemennya memang sering belum ada waktu ditanya */
  ftunggu: (sel: string, batas?: number, panggung?: Panggung) => Promise<HTMLElement | null>;
  /** klik elemen di dalam iframe, kursor palsu diposisikan ke tempat yang benar */
  fklik: (sel: string, panggung?: Panggung) => Promise<boolean>;
  /** ketik ke kolom di dalam iframe, huruf demi huruf - yang dipamerkan
      biasanya daftar yang MENYEMPIT sambil diketik, bukan hasil akhirnya */
  fketik: (sel: string, teks: string, panggung?: Panggung) => Promise<boolean>;
  /** teks sebuah elemen di dalam iframe. Ada supaya langkah demo bisa
      mengambil kata pencariannya DARI isi yang sedang tampil, bukan
      memancangkan kata mati di katalog - kata mati yang kebetulan tidak ada
      di sana membuat langkahnya memamerkan "tidak ditemukan", persis
      kebalikan dari yang mau ditunjukkan. */
  fteks: (sel: string, panggung?: Panggung) => string;
}

/** Iframe mana yang jadi panggung: pratinjau slide di samping editor
    (bawaan), atau pratinjau dashboard di dialog Export Paket. */
export type Panggung = 'slide' | 'paket';

/* ---------- pencari sasaran ----------
 * SEMUA sasaran dicari lewat kait data-demo yang sengaja ditanam di
 * komponennya - tidak ada yang dicari lewat teks yang tampil. Teks tombol itu
 * kalimat buat manusia: boleh diganti kapan saja, dan waktu diganti langkah
 * demo yang mengandalkannya mati TANPA SUARA. Sudah pernah kejadian, dan
 * pemeriksa app/scripts/cek-demo.mjs sekarang menolak build yang mencoba
 * kembali ke pola itu.
 */
export function qDemo(nama: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-demo="${nama}"]`);
}

/* Iframe panggung. Dicari lewat kait pembungkusnya, bukan lewat iframe
   pertama di halaman: dialog Export Paket punya iframe sendiri dan dua-duanya
   bisa terbuka bersamaan. */
const KAIT_PANGGUNG: Record<Panggung, string> = {
  slide: 'pratinjau-slide',
  paket: 'paket-pratinjau',
};

function frameEl(panggung: Panggung = 'slide'): HTMLIFrameElement | null {
  return qDemo(KAIT_PANGGUNG[panggung])?.querySelector('iframe') || null;
}

/* Titik LAYAR (koordinat dokumen induk) dari sebuah elemen di dalam iframe.
   Dua penyesuaian, dan dua-duanya wajib: geser sejauh posisi iframe-nya, lalu
   kalikan skala - iframe-nya dirender pada lebar desktop penuh lalu
   diperkecil pakai transform, jadi satu piksel di dalamnya bukan satu piksel
   di layar. Skalanya DIHITUNG (lebar tampak / lebar layout), tidak disalin
   dari komponennya: angkanya berubah mengikuti lebar panel. */
function titikFrame(el: Element, panggung: Panggung = 'slide'): { x: number; y: number } | null {
  const ifr = frameEl(panggung);
  if (!ifr) return null;
  const ir = ifr.getBoundingClientRect();
  const s = ifr.offsetWidth ? ir.width / ifr.offsetWidth : 1;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;   // elemennya sudah lepas dari dokumen
  return { x: ir.left + (r.left + r.width / 2) * s, y: ir.top + (r.top + r.height / 2) * s };
}

/* React memasang setter-nya sendiri di properti `value`, jadi `el.value = x`
 * mengubah tampilan TANPA state React ikut berubah - lalu render berikutnya
 * mengembalikannya ke nilai lama. Nilai harus ditulis lewat setter asli
 * prototipe-nya supaya event input yang menyusul dibaca React sebagai
 * ketikan sungguhan. Ini bagian yang paling mudah terlewat waktu mesin demo
 * dipindah dari halaman biasa ke React. */
function setNilaiReact(el: HTMLInputElement | HTMLTextAreaElement, nilai: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, nilai);
  else el.value = nilai;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ---------- chrome: kursor palsu, caption, lencana ---------- */
const CHROME_CSS = `
.bdemo-cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-4px 0 0 -4px;
  border-radius:50%;border:2px solid var(--ink,#1b1b1b);background:rgba(255,255,255,.45);
  box-shadow:0 2px 10px rgba(0,0,0,.25);pointer-events:none;z-index:9999;
  transition:transform .6s cubic-bezier(.4,.1,.2,1);}
.bdemo-cursor.is-click{animation:bdemoPing .46s ease-out;}
@keyframes bdemoPing{0%{box-shadow:0 0 0 0 rgba(0,0,0,.35);}100%{box-shadow:0 0 0 22px rgba(0,0,0,0);}}
.bdemo-caption{position:fixed;left:50%;bottom:34px;transform:translateX(-50%) translateY(10px);
  max-width:min(760px,86vw);padding:14px 22px;border-radius:14px;
  background:rgba(20,20,20,.92);color:#fff;font-size:16px;line-height:1.5;font-weight:600;
  text-align:center;opacity:0;pointer-events:none;z-index:9999;transition:opacity .3s,transform .3s;}
.bdemo-caption.show{opacity:1;transform:translateX(-50%) translateY(0);}
.bdemo-badge{position:fixed;right:18px;top:14px;z-index:9999;display:flex;align-items:center;gap:8px;
  padding:7px 14px;border-radius:999px;background:rgba(20,20,20,.92);color:#fff;
  font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}
.bdemo-badge .jeda{display:none;}
body.bdemo-paused .bdemo-badge .jalan{display:none;}
body.bdemo-paused .bdemo-badge .jeda{display:inline;}
body.bdemo-paused .bdemo-badge{cursor:pointer;}
.bdemo-badge .dot{width:8px;height:8px;border-radius:50%;background:#37d67a;animation:bdemoBlink 1.6s infinite;}
.bdemo-badge .hint{font-weight:600;letter-spacing:0;text-transform:none;opacity:.75;}
@keyframes bdemoBlink{50%{opacity:.25;}}
body.bdemo-paused .bdemo-cursor{opacity:0;}
`;

function pasangChrome() {
  if (document.getElementById('bdemo-style')) return;
  const st = document.createElement('style');
  st.id = 'bdemo-style';
  st.textContent = CHROME_CSS;
  document.head.appendChild(st);

  const cur = document.createElement('div');
  cur.className = 'bdemo-cursor';
  cur.id = 'bdemo-cursor';
  document.body.appendChild(cur);

  const cap = document.createElement('div');
  cap.className = 'bdemo-caption';
  cap.id = 'bdemo-caption';
  document.body.appendChild(cap);

  /* Dua wajah: keterangan waktu demo jalan, TOMBOL waktu dijeda - jalan
     satu-satunya buat melanjutkan seketika tanpa menunggu hitungan idle.
     Pemanggilnya dipasang di mulai(), karena yang bisa melanjutkan cuma
     instance yang lagi hidup. */
  const badge = document.createElement('div');
  badge.className = 'bdemo-badge';
  badge.id = 'bdemo-badge';
  badge.innerHTML = '<span class="dot"></span>' +
    '<span class="jalan">DEMO OTOMATIS<span class="hint">· sentuh layar untuk mencoba sendiri</span></span>' +
    '<span class="jeda">DEMO DIJEDA<span class="hint">· klik di sini untuk melanjutkan</span></span>';
  document.body.appendChild(badge);
}

function bersihkanChrome() {
  ['bdemo-style', 'bdemo-cursor', 'bdemo-caption', 'bdemo-badge'].forEach(id => document.getElementById(id)?.remove());
  document.querySelector('.bdemo-badge')?.remove();
}

/* ---------- satu putaran ---------- */
export interface DemoStep {
  id: string;
  /** nama langkah buat manusia yang menyunting katalog - tidak tampil ke penonton */
  label: string;
  /** Kalimat yang tampil di layar. Ditulis SEKALI di sini dan dioper ke run()
      sebagai `cap` - jangan tulis ulang literalnya di dalam run, karena dua
      salinan satu kalimat pasti pelan-pelan menyimpang dan yang disunting
      orang belum tentu yang tampil. */
  caption: string;
  /** false = sasarannya tidak ketemu di layar; langkahnya dilewati. */
  run: (D: DemoCtx, cap: string) => Promise<boolean | void>;
}

export class BuilderDemo {
  private runId = 0;
  private stepIdx = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private mulaiTimer: ReturnType<typeof setTimeout> | null = null;
  private jalan = false;
  private lepasListener: (() => void) | null = null;

  private steps: DemoStep[];
  private onSebelumPutaran?: () => void;
  private onPatch?: (bagian: Record<string, unknown>) => void;
  private onPatchBlok?: (data: Record<string, unknown>) => void;

  constructor(
    steps: DemoStep[],
    onSebelumPutaran?: () => void,
    onPatch?: (bagian: Record<string, unknown>) => void,
    onPatchBlok?: (data: Record<string, unknown>) => void,
  ) {
    this.steps = steps;
    this.onSebelumPutaran = onSebelumPutaran;
    this.onPatch = onPatch;
    this.onPatchBlok = onPatchBlok;
  }

  mulai() {
    setDemoBoothJalan(true);
    pasangChrome();
    const badge = document.getElementById('bdemo-badge');
    if (badge) badge.onclick = () => { if (!this.jalan) this.jalankan(); };
    const jeda = (e: Event) => {
      // Klik yang dikirim mesin demo sendiri juga sampai ke sini; yang
      // membedakan cuma isTrusted. Tanpa penjaga ini demo menjeda dirinya
      // sendiri di klik pertama.
      if (!e.isTrusted) return;
      if (this.jalan) this.jeda();
      else this.pasangIdle();  // sudah dijeda: tiap sentuhan menunda demo lagi
    };
    const nama = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    nama.forEach(n => window.addEventListener(n, jeda, { passive: true, capture: true }));
    this.lepasListener = () => nama.forEach(n => window.removeEventListener(n, jeda, { capture: true } as EventListenerOptions));
    /* Timernya DIPEGANG, bukan ditembak lalu dilupakan. React StrictMode di
       mode dev memasang lalu membongkar efek sekali sebelum yang sungguhan -
       instance pertama sudah dihentikan tapi timer mulainya tetap menyala,
       lalu menjalankan satu putaran hantu di atas chrome yang sudah dicabut:
       langkah-langkahnya gagal satu per satu dan mengotori console dengan
       peringatan yang tidak ada hubungannya dengan booth sungguhan. */
    this.mulaiTimer = setTimeout(() => this.jalankan(), 1400);
  }

  hentikan() {
    setDemoBoothJalan(false);
    this.runId++;
    this.jalan = false;
    if (this.mulaiTimer) clearTimeout(this.mulaiTimer);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.lepasListener?.();
    this.bersih();
    bersihkanChrome();
    document.body.classList.remove('bdemo-paused');
  }

  private jeda() {
    this.runId++;
    this.jalan = false;
    document.body.classList.add('bdemo-paused');
    this.bersih();
    this.pasangIdle();
  }

  private pasangIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.jalankan(), DEMO_IDLE_RESUME_MS);
  }

  private bersih() {
    document.getElementById('bdemo-caption')?.classList.remove('show');
  }

  private jalankan() {
    if (this.jalan) return;
    this.jalan = true;
    document.body.classList.remove('bdemo-paused');
    void this.putaran();
  }

  private async putaran() {
    const id = ++this.runId;
    const D = this.ctx(id);
    try {
      while (id === this.runId) {
        // Cuma di awal putaran PENUH: melanjutkan dari tengah tidak boleh
        // menyetel ulang proyek contoh, karena langkah yang tersisa berpijak
        // pada apa yang sudah dikerjakan langkah sebelumnya.
        if (this.stepIdx === 0) this.onSebelumPutaran?.();
        for (let i = this.stepIdx; i < this.steps.length; i++) {
          if (id !== this.runId) return;
          this.stepIdx = i;
          try {
            const hasil = await this.steps[i].run(D, this.steps[i].caption);
            /* Langkah yang melewati dirinya sendiri ikut dicatat. Ini yang
               terjadi kalau label tombol di UI diganti tanpa katalog ini ikut
               disesuaikan: langkahnya hilang dari booth tanpa satu pun tanda,
               dan yang menggantinya tidak punya cara tahu. */
            if (hasil === false) console.warn('[demo booth] langkah "' + this.steps[i].id + '" dilewati: sasarannya tidak ada di layar');
          } catch (err) {
            if (err === DEMO_ABORT) return;
            /* Satu langkah gagal tidak boleh menjatuhkan seluruh booth - tapi
               juga tidak boleh hilang tanpa bekas. Dua kali langkah demo mati
               diam-diam di proyek ini dan baru ketahuan berbulan kemudian;
               satu baris di console jauh lebih murah daripada mengulang itu. */
            console.warn('[demo booth] langkah "' + this.steps[i].id + '" gagal:', err);
          }
          D.hide();
          await D.sleep(800);
        }
        this.stepIdx = 0;
        await D.sleep(1200);
      }
    } catch (err) {
      if (err !== DEMO_ABORT) throw err;
    }
  }

  private ctx(id: number): DemoCtx {
    const chk = () => { if (id !== this.runId) throw DEMO_ABORT; };
    const sleep = (ms: number) => new Promise<void>((res, rej) => {
      setTimeout(() => (id === this.runId ? res() : rej(DEMO_ABORT)), ms);
    });

    const cursorKe = async (x: number, y: number) => {
      const cur = document.getElementById('bdemo-cursor');
      if (!cur) return;
      cur.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
      await sleep(MOVE);
    };

    const cursorTo = async (el: Element | null) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      await cursorKe(r.left + r.width / 2, r.top + r.height / 2);
    };

    const ping = async () => {
      const cur = document.getElementById('bdemo-cursor');
      if (cur) { cur.classList.add('is-click'); setTimeout(() => cur.classList.remove('is-click'), 460); }
      await sleep(220);
    };

    return {
      chk, sleep, cursorTo,

      say: async (teks, hold) => {
        chk();
        const el = document.getElementById('bdemo-caption');
        if (el) { el.textContent = teks; el.classList.add('show'); }
        await sleep(hold == null ? HOLD : hold);
      },
      hide: () => { document.getElementById('bdemo-caption')?.classList.remove('show'); },

      click: async (el) => {
        chk();
        if (!el) return false;
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* jsdom / browser lama */ }
        await sleep(320);
        await cursorTo(el);
        await ping();
        (el as HTMLElement).click();
        await sleep(AFTER);
        return true;
      },

      type: async (el, teks) => {
        chk();
        if (!el) return;
        const f = el as HTMLInputElement | HTMLTextAreaElement;
        f.focus();
        await cursorTo(el);
        setNilaiReact(f, '');
        /* Diketik per POTONGAN, bukan per huruf. Tiap pembaruan nilai memicu
           setModule -> render ulang kanvas DAN pratinjau slide; pada isian
           seratus huruf, render-render itu menumpuk sampai satu blok butuh
           ~100 detik (terukur), padahal yang sama tanpa pratinjau cuma ~20.
           Panjang berapa pun sekarang selesai dalam <= LANGKAH_KETIK
           pembaruan, dan dari kursi penonton tetap terbaca "sedang diketik".

           Angkanya kecil (8) bukan karena ragu-ragu: DIUKUR di build produksi,
           satu pembaruan nilai memakan ~1,8 detik karena kanvas dan pratinjau
           slide ikut dirender ulang. Dengan 28 pembaruan, mengisi SATU kartu
           butuh 53 detik dan satu putaran demo lewat 20 menit. Dengan 8,
           ketikannya masih terbaca sebagai ketikan. */
        const LANGKAH_KETIK = 8;
        const lompat = Math.max(1, Math.ceil(teks.length / LANGKAH_KETIK));
        for (let i = 0; i < teks.length; i += lompat) {
          chk();
          setNilaiReact(f, teks.slice(0, Math.min(teks.length, i + lompat)));
          await sleep(90);
        }
        f.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(500);
      },

      patch: (bagian) => { chk(); this.onPatch?.(bagian); },
      patchBlok: (data) => { chk(); this.onPatchBlok?.(data); },

      kelilingi: async (el, putaran) => {
        chk();
        if (!el) return;
        const cur = document.getElementById('bdemo-cursor');
        const r = el.getBoundingClientRect();
        if (!cur || (!r.width && !r.height)) return;
        /* Elips di dalam tepinya, bukan persis di tepinya: kursor yang
           menyusur garis batas terbaca seperti mau menyeret panelnya. */
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const rx = r.width * 0.36, ry = r.height * 0.36;
        const titik = 12, n = (putaran == null ? 1 : putaran) * titik;
        for (let i = 0; i <= n; i++) {
          chk();
          const t = (i / titik) * Math.PI * 2 - Math.PI / 2;
          cur.style.transform = `translate(${Math.round(cx + rx * Math.cos(t))}px,${Math.round(cy + ry * Math.sin(t))}px)`;
          await sleep(120);
        }
      },

      hover: async (el) => {
        chk();
        if (!el) return;
        await cursorTo(el);
        for (const nama of ['pointerover', 'mouseover', 'mouseenter']) {
          el.dispatchEvent(new MouseEvent(nama, { bubbles: nama !== 'mouseenter', cancelable: true }));
        }
        await sleep(120);
      },

      lepas: async (el) => {
        chk();
        if (!el) return;
        /* mouseout ikut dikirim, bukan cuma mouseleave: React menyulap
           onMouseLeave DARI mouseout yang menggelembung ke akarnya -
           mouseleave saja (yang tidak menggelembung) tidak pernah sampai. */
        for (const nama of ['pointerout', 'mouseout', 'mouseleave']) {
          el.dispatchEvent(new MouseEvent(nama, { bubbles: nama !== 'mouseleave', cancelable: true }));
        }
        await sleep(160);
      },

      sapu: async (els, jeda) => {
        for (const el of els) {
          chk();
          await cursorTo(el);
          for (const nama of ['pointerover', 'mouseover', 'mouseenter']) {
            el.dispatchEvent(new MouseEvent(nama, { bubbles: nama !== 'mouseenter', cancelable: true }));
          }
          await sleep(jeda == null ? 260 : jeda);
        }
      },

      fdoc: (panggung) => {
        /* try: iframe yang BARU mengganti srcDoc sempat memegang dokumen
           yang sudah tidak boleh dibaca lagi di sebagian browser. Itu
           keadaan sesaat, bukan kesalahan - pemanggilnya memang menanyakan
           ulang beberapa ratus milidetik lagi. */
        try { return frameEl(panggung)?.contentDocument || null; } catch { return null; }
      },

      ftunggu: async (sel, batas, panggung) => {
        const habis = Date.now() + (batas == null ? 4000 : batas);
        for (;;) {
          chk();
          let el: HTMLElement | null = null;
          try { el = frameEl(panggung)?.contentDocument?.querySelector<HTMLElement>(sel) || null; } catch { /* dokumen sedang berganti */ }
          if (el) return el;
          if (Date.now() > habis) return null;
          await sleep(140);
        }
      },

      fklik: async (sel, panggung) => {
        chk();
        /* Dicari ULANG di sini, tidak menerima elemen jadi: tiap suntingan
           mengganti srcDoc iframe-nya, dan elemen yang dipegang pemanggil
           bisa saja sudah milik dokumen yang barusan dibuang - kliknya
           "berhasil" tapi tidak ada yang bergerak di layar. */
        let el: HTMLElement | null = null;
        try { el = frameEl(panggung)?.contentDocument?.querySelector<HTMLElement>(sel) || null; } catch { /* dokumen sedang berganti */ }
        if (!el) return false;
        /* Digulirkan DI DALAM iframe dulu, lalu diukur: elemen yang berada di
           luar jendela iframe menghasilkan koordinat di luar kotak
           pratinjaunya, dan kursor palsunya mendarat entah di mana. */
        try { el.scrollIntoView({ block: 'center' }); } catch { /* jsdom / browser lama */ }
        await sleep(360);
        const p = titikFrame(el, panggung);
        if (p) await cursorKe(p.x, p.y);
        await ping();
        el.click();
        await sleep(AFTER);
        return true;
      },

      fteks: (sel, panggung) => {
        try { return frameEl(panggung)?.contentDocument?.querySelector(sel)?.textContent?.trim() || ''; }
        catch { return ''; }
      },

      fketik: async (sel, teks, panggung) => {
        chk();
        let el: HTMLInputElement | null = null;
        try { el = frameEl(panggung)?.contentDocument?.querySelector<HTMLInputElement>(sel) || null; } catch { /* dokumen sedang berganti */ }
        if (!el) return false;
        const p = titikFrame(el, panggung);
        if (p) await cursorKe(p.x, p.y);
        try { el.focus(); } catch { /* iframe belum boleh menerima fokus */ }
        /* Setter polos + event 'input' sudah cukup DI SINI, tidak perlu akal
           setter-prototipe seperti setNilaiReact di atas: yang di dalam
           iframe ini DOM biasa dengan addEventListener('input'), bukan React
           yang memasang setternya sendiri di atas properti value. */
        /* Dikosongkan DENGAN event-nya, bukan diam-diam: fketik(sel, '')
           adalah cara langkah demo membereskan kolom carinya, dan tanpa
           event ini daftar hasilnya tetap tersaring oleh kata yang sudah
           tidak ada lagi di kolomnya. */
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        for (const c of teks) {
          chk();
          el.value += c;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          await sleep(115);
        }
        await sleep(400);
        return true;
      },

      /* Menunggu React selesai merender sesuatu yang baru muncul akibat klik
         barusan. Tanpa ini langkah berikutnya mencari elemen yang belum ada
         dan langkahnya gugur padahal fiturnya baik-baik saja. */
      tunggu: async (cari, batas): Promise<HTMLElement | null> => {
        const habis = Date.now() + (batas == null ? 2500 : batas);
        for (;;) {
          chk();
          const el = cari();
          if (el) return el;
          if (Date.now() > habis) return null;
          await sleep(120);
        }
      },
    };
  }
}
