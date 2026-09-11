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
  tunggu: (cari: () => Element | null, batas?: number) => Promise<Element | null>;
  /* Menyuntik perubahan langsung ke state modul, buat yang MUSTAHIL dilakukan
     lewat UI di booth: memilih berkas. Klik tombol unggah membuka dialog file
     milik sistem operasi - dialog itu di luar halaman, tidak bisa ditutup
     lagi oleh demo, dan booth-nya berhenti di situ sampai ada yang menekan
     Escape. Jadi tombolnya tetap disorot dan captionnya tetap menjelaskan
     "pilih gambar dari komputer", tapi gambarnya dipasang lewat sini. */
  patch: (bagian: Record<string, unknown>) => void;
  /* Kursor palsu cuma gambar - menggesernya ke atas sesuatu TIDAK memicu
     :hover maupun onMouseEnter React. Yang pratinjaunya baru muncul saat
     disorot (daftar tipe blok, daftar gaya grafis) butuh event ini dikirim
     betulan, kalau tidak yang tampil di booth cuma daftar yang diam. */
  hover: (el: Element | null) => Promise<void>;
}

/* ---------- pencari sasaran ----------
 * Dicari lewat TEKS YANG TERBACA, bukan kelas CSS: aplikasi ini menata
 * gayanya dengan inline style, jadi tidak ada kelas stabil untuk dipegang -
 * dan teks tombol adalah hal yang sama persis dipakai pengunjung untuk
 * menemukannya. Yang tidak punya teks (tab, kanvas) dikasih data-demo.
 */
export function qDemo(nama: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-demo="${nama}"]`);
}

export function qTeks(teks: string, dalam?: Element | null): HTMLElement | null {
  const akar = dalam || document.body;
  const kandidat = Array.from(akar.querySelectorAll<HTMLElement>('button, a, label, summary'));
  const pas = kandidat.filter(el => (el.textContent || '').trim().toLowerCase().includes(teks.toLowerCase()));
  // Yang paling dangkal isinya = yang paling mungkin tombolnya sendiri, bukan
  // pembungkus yang kebetulan memuat teks itu di dalamnya.
  pas.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
  return pas[0] || null;
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
  label: string;
  caption: string;
  /** false = sasarannya tidak ketemu di layar; langkah dilewati diam-diam. */
  run: (D: DemoCtx) => Promise<boolean | void>;
}

export class BuilderDemo {
  private runId = 0;
  private stepIdx = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private jalan = false;
  private lepasListener: (() => void) | null = null;

  private steps: DemoStep[];
  private onSebelumPutaran?: () => void;
  private onPatch?: (bagian: Record<string, unknown>) => void;

  constructor(
    steps: DemoStep[],
    onSebelumPutaran?: () => void,
    onPatch?: (bagian: Record<string, unknown>) => void,
  ) {
    this.steps = steps;
    this.onSebelumPutaran = onSebelumPutaran;
    this.onPatch = onPatch;
  }

  mulai() {
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
    setTimeout(() => this.jalankan(), 1400);
  }

  hentikan() {
    this.runId++;
    this.jalan = false;
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
            await this.steps[i].run(D);
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

    const cursorTo = async (el: Element | null) => {
      const cur = document.getElementById('bdemo-cursor');
      if (!cur || !el) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      cur.style.transform = `translate(${Math.round(r.left + r.width / 2)}px,${Math.round(r.top + r.height / 2)}px)`;
      await sleep(MOVE);
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
        for (let i = 0; i < teks.length; i++) {
          chk();
          setNilaiReact(f, teks.slice(0, i + 1));
          await sleep(34);
        }
        f.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(500);
      },

      patch: (bagian) => { chk(); this.onPatch?.(bagian); },

      hover: async (el) => {
        chk();
        if (!el) return;
        await cursorTo(el);
        for (const nama of ['pointerover', 'mouseover', 'mouseenter']) {
          el.dispatchEvent(new MouseEvent(nama, { bubbles: nama !== 'mouseenter', cancelable: true }));
        }
        await sleep(120);
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

      /* Menunggu React selesai merender sesuatu yang baru muncul akibat klik
         barusan. Tanpa ini langkah berikutnya mencari elemen yang belum ada
         dan langkahnya gugur padahal fiturnya baik-baik saja. */
      tunggu: async (cari, batas) => {
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
