import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ModuleData } from '../types';
import { generateHtml } from '../api';

interface Props {
  module: ModuleData;
  slideNumber?: number;
  target?: 'slide' | 'hero' | 'summary';
  label?: string;
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

// Batas zoom manual. Di bawah 25% teks modulnya udah gak kebaca sama sekali;
// di atas 300% yang kelihatan cuma piksel yang direntang - dua-duanya bukan
// sesuatu yang berguna buat ngecek tata letak.
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
// Kelipatan per klik. 1.25 cukup kecil buat ngintip detail tanpa kelewat,
// tapi tetap kerasa gerak dalam sekali klik.
const LANGKAH = 1.25;

// Live preview of a single slide (or the cover/hero screen), rendered by
// generating the full module HTML and jumping the embedded page straight to
// that slide (bypassing section gating via devMode) — so editors see the
// real output next to the fields they're editing, instead of hopping to the
// far-away Preview & Export tab.
export default function SlidePreview({ module, slideNumber, target = 'slide', label }: Props) {
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
    try {
      win.eval(`
        devMode = true;
        const idx = NAV.findIndex(it => ${findExpr});
        if (idx >= 0) goTo(idx);
        // Dev Mode was only needed to jump straight here past section/quiz
        // gates that don't matter for "how does this one slide look" - left
        // on, it also silently skips every OTHER gate (Knowledge Check's
        // leave-slide popup, quiz lock, reading-speed nag), making them look
        // broken when someone clicks Next/Prev inside this preview to test
        // them. toggleDevMode() (not a raw "devMode = false") so the sidebar
        // lock icons and Dev Mode button state stay in sync with the real
        // (now non-dev) gating - not just the variable.
        if (devMode) toggleDevMode();
      `);
      // Restore the scroll offset the PREVIOUS document had, then keep
      // tracking it live on this fresh one so the next reload has something
      // current to restore. Re-attached every load since srcDoc gives a
      // brand new document (and thus a brand new #viewport) each time.
      const viewport = win.document.getElementById('viewport');
      if (viewport) {
        viewport.scrollTop = scrollTopRef.current;
        viewport.addEventListener('scroll', () => { scrollTopRef.current = viewport.scrollTop; });
      }
      // Popup dibuka/ditutup lewat class .open, bukan lewat event yang bisa
      // didengarkan - jadi perubahan class-nya yang diamati. Dipasang ulang
      // tiap iframe dimuat karena srcDoc bikin dokumen yang benar-benar baru.
      const pengamat = new win.MutationObserver(() => bawaPopupKeLayar());
      pengamat.observe(win.document.body, {
        subtree: true, attributes: true, attributeFilter: ['class'],
      });
    } catch {
      // iframe not ready yet, ignore
    }
  }

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
        {html && (
          // transform:scale() gak mengubah ukuran yang DIHITUNG layout, jadi
          // wadah scroll-nya gak bakal tau preview-nya membesar. Kotak ini yang
          // memegang ukuran hasil-perkecilan itu, supaya scrollbar-nya muncul.
          <div style={{ width: LEBAR_LOGIS * skala, height: TINGGI_LOGIS * skala, position: 'relative' }}>
            <iframe
              ref={iframeRef}
              srcDoc={html}
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
