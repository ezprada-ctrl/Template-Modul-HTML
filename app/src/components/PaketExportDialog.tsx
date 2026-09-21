import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { listDraftsRingkas, loadDraft, generateHtml, type DraftRingkas } from '../api';
import { normalizeModule } from '../types';
import { sematkanGambarDataUri } from '../assetEmbed';
import {
  exportPaket, judulDariHtml, ringkasDeskripsi, ukuranBaca, bangunPratinjau,
  type Konsep, type ModulPaket,
} from '../paket/paketExport';

/* Dua sumber modul, sengaja berdampingan:
   - DRAFT  : jalur utama. Sekali centang, isinya selalu versi terbaru.
   - BERKAS : pintu buat modul yang TIDAK ada di daftar draft sendiri —
              buatan rekan, atau hasil export lama. Di pelatihan yang
              materinya digarap beberapa orang, ini pasti kejadian. */
type Sumber = 'draft' | 'berkas';

interface Pilihan {
  key: string;
  sumber: Sumber;
  /** slug draft, atau nama berkas */
  id: string;
  nama: string;
  desc: string;
  /** cuma terisi buat sumber 'berkas' (sudah mandiri sejak awal) */
  html?: string;
  byte?: number;
}

const KONSEP_INFO: { id: Konsep; nama: string; ket: string }[] = [
  { id: 'panel', nama: 'Panel', ket: 'Grid padat. Paling kuat kalau modulnya banyak.' },
  { id: 'indeks', nama: 'Indeks', ket: 'Daftar tipografis + pratinjau. Tenang, latar terang.' },
  { id: 'orbit', nama: 'Orbit', ket: 'Peta melingkar. Paling pas untuk ≤ 12 modul.' },
  { id: 'terminal', nama: 'Terminal', ket: 'Jendela konsol. Rapat, teknis, semua modul kelihatan sekaligus.' },
  { id: 'kartu', nama: 'Kartu', ket: 'Kartu warna-warni bernomor. Ramai dan gampang dibedakan.' },
  { id: 'linimasa', nama: 'Linimasa', ket: 'Urutan bertahap di satu garis. Untuk materi yang berjenjang.' },
  { id: 'metro', nama: 'Metro', ket: 'Peta jalur. Menegaskan alur dari modul awal ke akhir.' },
  { id: 'majalah', nama: 'Majalah', ket: 'Tata letak cetak. Modul teratas jadi headline.' },
  { id: 'rak', nama: 'Rak', ket: 'Punggung buku berjajar. Terasa seperti koleksi, bukan daftar.' },
  { id: 'fokus', nama: 'Fokus', ket: 'Satu modul selayar, maju-mundur. Paling tenang.' },
];

/* Ukuran "layar lebar" tempat pratinjau dirender sebelum diperkecil.
   Tingginya harus cukup buat konsep yang paling jangkung — Orbit: cincinnya
   persegi selebar 620px, plus kicker dan catatan di bawahnya. Kalau kurang,
   yang kepotong justru titik-titik modul paling bawah. */
const PRA_W = 1160;
const PRA_H = 812;

/* Ukuran HP. 390px itu lebar iPhone 12–16 dan patokan yang paling sering
   dipakai; yang di bawahnya (360px Android, 320px SE) tata letaknya sama,
   cuma lebih sempit — tidak ada aturan cangkang yang baru muncul di situ.
   Tingginya TIDAK dipatok 844: kotak pratinjau di dialog tidak setinggi itu,
   dan lebih baik menampilkan layar HP yang lebih pendek pada ukuran 1:1
   daripada layar penuh yang diperkecil sampai hurufnya tidak terbaca. Waktu
   pratinjaunya dibesarkan ke seluruh layar, tingginya naik sampai 844. */
const PRA_HP_W = 390;
const PRA_HP_H = 844;
const PRA_HP_H_KOTAK = 470;

const LOGO_MAKS = 3;
/* Empat kali tinggi tampilnya (36px), jadi tetap tajam di layar retina tanpa
   membawa berkas aslinya. Logo instansi sering PNG 2000px hasil ekspor desain:
   tiga di antaranya, tertanam sebagai base64, bisa menambah puluhan MB ke
   sebuah paket yang justru sudah berat oleh modulnya. */
const LOGO_TINGGI_MAKS = 144;

interface LogoBaca {
  uri: string;
  byte: number;
  adaTembusPandang: boolean;
  dikecilkan: boolean;
}

/**
 * Baca satu PNG jadi data URI siap tanam, sekalian periksa apakah latarnya
 * memang tembus pandang.
 *
 * Pemeriksaannya sungguhan — piksel kanvasnya dibaca, bukan sekadar percaya
 * ekstensi .png. PNG berlatar putih pekat terlihat baik-baik saja di dialog
 * ini (latarnya juga terang) lalu jadi kotak putih mencolok begitu paketnya
 * dibuka di tampilan gelap seperti Terminal atau Orbit. Lebih baik dikabari
 * sekarang daripada ketahuan setelah dibagikan ke peserta.
 */
function bacaLogoPng(f: File): Promise<LogoBaca> {
  return new Promise((selesai, gagal) => {
    const baca = new FileReader();
    baca.onerror = () => gagal(new Error(`"${f.name}" gagal dibaca.`));
    baca.onload = () => {
      const asli = String(baca.result);
      const img = new Image();
      img.onerror = () => gagal(new Error(`"${f.name}" tidak bisa dibuka sebagai gambar.`));
      img.onload = () => {
        const skala = Math.min(1, LOGO_TINGGI_MAKS / (img.naturalHeight || 1));
        const w = Math.max(1, Math.round(img.naturalWidth * skala));
        const h = Math.max(1, Math.round(img.naturalHeight * skala));
        const kanvas = document.createElement('canvas');
        kanvas.width = w; kanvas.height = h;
        const ctx = kanvas.getContext('2d');
        if (!ctx) { selesai({ uri: asli, byte: f.size, adaTembusPandang: true, dikecilkan: false }); return; }
        ctx.drawImage(img, 0, 0, w, h);
        let tembus = false;
        try {
          const d = ctx.getImageData(0, 0, w, h).data;
          // Ambangnya 250, bukan 255: tepi PNG yang dihaluskan menyisakan alfa
          // 254 di sana-sini, dan itu bukan tanda latarnya tembus pandang.
          for (let i = 3; i < d.length; i += 4) { if (d[i] < 250) { tembus = true; break; } }
        } catch {
          // Kanvas ternoda — tidak bisa memeriksa, jadi jangan menuduh.
          tembus = true;
        }
        const uri = skala < 1 ? kanvas.toDataURL('image/png') : asli;
        const isi = uri.slice(uri.indexOf(',') + 1);
        selesai({
          uri,
          byte: Math.round(isi.length * 0.75),
          adaTembusPandang: tembus,
          dikecilkan: skala < 1,
        });
      };
      img.src = asli;
    };
    baca.readAsDataURL(f);
  });
}

const inp: CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', font: 'inherit', fontSize: 13,
};

export default function PaketExportDialog({ onClose }: { onClose: () => void }) {
  const [drafts, setDrafts] = useState<DraftRingkas[]>([]);
  const [pilihan, setPilihan] = useState<Pilihan[]>([]);
  const [judul, setJudul] = useState('');
  const [sambutan, setSambutan] = useState('');
  const [konsep, setKonsep] = useState<Konsep>('panel');
  const [busy, setBusy] = useState(false);
  const [progres, setProgres] = useState('');
  const [byte, setByte] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [seret, setSeret] = useState(false);
  const [cariDraft, setCariDraft] = useState('');
  /* Konsep yang sedang DISOROT kursor. Pratinjau menampilkan ini kalau ada,
     kalau tidak ya yang sedang terpilih - jadi kotaknya tidak pernah kosong
     dan tingginya tidak melompat waktu kursor masuk-keluar. */
  const [sorot, setSorot] = useState<Konsep | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  /* Logo penyelenggara. Urutan dalam larik ini = urutan tampil di dashboard,
     jadi menukar posisi cukup menukar isinya. */
  const [logo, setLogo] = useState<{ key: string; nama: string; uri: string; byte: number; polos: boolean }[]>([]);
  const [logoPesan, setLogoPesan] = useState('');
  const logoRef = useRef<HTMLInputElement>(null);
  /* Skala pratinjau dihitung dari lebar kotaknya yang SEBENARNYA, bukan
     angka mati: dialognya menyusut di layar sempit, dan skala mati bikin
     pratinjaunya meleber keluar atau menyisakan pias kosong. */
  const kotakRef = useRef<HTMLDivElement>(null);
  /* Yang disimpan ukuran KOTAKNYA, bukan skalanya: skala dan tinggi viewport
     pratinjau dua-duanya turun dari sini, dan aturannya beda antara mode HP
     dan Desktop. Menyimpan hasil jadinya berarti dua state yang harus terus
     dijaga sinkron. */
  const [kotak, setKotak] = useState({ w: 672, h: 0 });
  const [mode, setMode] = useState<'desktop' | 'hp'>('desktop');
  /* Diperbesar ke seluruh layar. Wadahnya yang berubah gaya, elemen
     iframe-nya TETAP yang itu-itu juga di posisi yang sama pada pohon React —
     kalau dipindah, dia dimuat ulang dan apa pun yang sedang dicoba
     (kata pencarian, modul yang sedang disorot) hilang di tengah jalan. */
  const [besar, setBesar] = useState(false);

  useEffect(() => {
    listDraftsRingkas().then(setDrafts).catch((e) => setError(e.message || 'Gagal memuat daftar draft.'));
  }, []);

  useEffect(() => {
    const el = kotakRef.current;
    if (!el) return;
    const ukur = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w <= 0) return;
      setKotak({ w, h });
    };
    ukur();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', ukur);
      return () => window.removeEventListener('resize', ukur);
    }
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [besar]);

  useEffect(() => {
    if (!besar) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setBesar(false); } };
    window.addEventListener('keydown', esc, true);
    return () => window.removeEventListener('keydown', esc, true);
  }, [besar]);

  /* Draft yang judulnya sudah pernah ditarik, disimpan per slug. Bukan sekadar
     penghemat permintaan — ini yang menghentikan putaran tak berujung. Penanda
     "belum ditarik" dulu adalah `nama === id`, padahal draft yang judulnya
     kosong memang jatuh kembali ke slug-nya sendiri (Nama Tab Browser di tab
     Tema boleh dikosongkan). Draft begitu selamanya terlihat "belum", dan
     karena efeknya menulis ke state yang jadi pemicunya sendiri, loadDraft
     dipanggil berulang tanpa henti. Dicatat per SLUG, bukan per baris terpilih,
     supaya draft yang dicentang lagi setelah dilepas langsung tampil judulnya. */
  const judulDraft = useRef(new Map<string, { nama: string; desc: string }>());

  const adaDraft = (slug: string) => pilihan.some((p) => p.sumber === 'draft' && p.id === slug);

  function toggleDraft(slug: string) {
    const tahu = judulDraft.current.get(slug);
    /* Judul dari daftar dipakai sebagai isian awal, jadi baris "Urutan &
       keterangan" langsung menyebut nama yang benar begitu dicentang — tidak
       sempat berkedip sebagai slug dulu sambil menunggu draft-nya dibaca. */
    const dariDaftar = drafts.find((d) => d.slug === slug)?.judul;
    setPilihan((lama) =>
      adaDraft(slug)
        ? lama.filter((p) => !(p.sumber === 'draft' && p.id === slug))
        : [...lama, {
            key: 'd:' + slug, sumber: 'draft', id: slug,
            nama: tahu?.nama || dariDaftar || slug, desc: tahu?.desc || '',
          }]);
  }

  /* Deskripsi draft baru diketahui setelah JSON-nya dibaca (dari heroDesc
     modul itu), dan judulnya ikut disegarkan di sini kalau daftarnya sudah
     basi. Daftar sudah memberi judul di muka, jadi tarikan ini bukan lagi
     satu-satunya jalan nama yang benar muncul — cuma pelengkapnya. */
  useEffect(() => {
    const belum = pilihan.filter((p) => p.sumber === 'draft' && !judulDraft.current.has(p.id));
    if (!belum.length) return;
    /* Ditandai SEKARANG, sebelum satu pun await — bukan setelah jawabannya
       datang. Efek ini dipicu oleh `pilihan`, dan mencentang draft berikutnya
       mengubah `pilihan` selagi tarikan yang ini masih di jalan; kalau
       penandanya menunggu jawaban, putaran berikutnya melihat draft yang sama
       masih "belum" dan menariknya lagi. */
    for (const p of belum) judulDraft.current.set(p.id, { nama: p.id, desc: '' });
    let batal = false;
    (async () => {
      for (const p of belum) {
        try {
          const m = normalizeModule(await loadDraft(p.id));
          const nama = m.title?.trim() || p.id;
          const desc = ringkasDeskripsi(m.heroDesc);
          judulDraft.current.set(p.id, { nama, desc });
          if (batal) return;
          setPilihan((lama) => lama.map((x) => x.key === p.key
            ? { ...x, nama, desc: x.desc || desc }
            : x));
        } catch { /* biarkan slug-nya yang tampil; catatannya sudah terpasang */ }
      }
    })();
    return () => { batal = true; };
  }, [pilihan]);

  async function tambahBerkas(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const baru: Pilihan[] = [];
    for (const f of Array.from(files)) {
      if (!/\.html?$/i.test(f.name)) continue;
      const html = await f.text();
      baru.push({
        key: 'f:' + f.name + ':' + f.size,
        sumber: 'berkas', id: f.name,
        nama: judulDariHtml(html, f.name), desc: '', html, byte: f.size,
      });
    }
    if (!baru.length) { setError('Tidak ada berkas .html yang bisa dipakai.'); return; }
    setPilihan((lama) => [...lama, ...baru.filter((b) => !lama.some((l) => l.key === b.key))]);
  }

  async function tambahLogo(files: FileList | null) {
    if (!files?.length) return;
    const catatan: string[] = [];
    const diterima: typeof logo = [];
    let sisa = LOGO_MAKS - logo.length;

    for (const f of Array.from(files)) {
      // PNG-nya diperiksa dari ISI berkas, bukan namanya. JPG yang di-rename
      // jadi .png tetap JPG — dan JPG tidak punya kanal alfa sama sekali,
      // jadi pasti muncul sebagai kotak di tampilan gelap.
      const png = f.type === 'image/png' || (!f.type && /\.png$/i.test(f.name));
      if (!png) { catatan.push(`"${f.name}" dilewati — harus PNG.`); continue; }
      if (sisa <= 0) { catatan.push(`"${f.name}" dilewati — sudah ${LOGO_MAKS} logo.`); continue; }
      try {
        const hasil = await bacaLogoPng(f);
        if (!hasil.adaTembusPandang) {
          catatan.push(`"${f.name}" latarnya tidak tembus pandang — akan terlihat sebagai kotak di tampilan gelap.`);
        }
        diterima.push({
          key: `${f.name}:${f.size}:${Date.now()}`,
          nama: f.name, uri: hasil.uri, byte: hasil.byte,
          polos: !hasil.adaTembusPandang,
        });
        sisa--;
      } catch (e: any) {
        catatan.push(e?.message || `"${f.name}" gagal dibaca.`);
      }
    }

    if (diterima.length) setLogo((lama) => [...lama, ...diterima]);
    setLogoPesan(catatan.join(' '));
  }

  const buangLogo = (key: string) => {
    setLogo((lama) => lama.filter((l) => l.key !== key));
    setLogoPesan('');
  };
  const geserLogo = (i: number, arah: -1 | 1) =>
    setLogo((lama) => {
      const j = i + arah;
      if (j < 0 || j >= lama.length) return lama;
      const baru = [...lama];
      [baru[i], baru[j]] = [baru[j], baru[i]];
      return baru;
    });

  const ubah = (key: string, patch: Partial<Pilihan>) =>
    setPilihan((lama) => lama.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const buang = (key: string) => setPilihan((lama) => lama.filter((p) => p.key !== key));
  const geser = (i: number, arah: -1 | 1) =>
    setPilihan((lama) => {
      const j = i + arah;
      if (j < 0 || j >= lama.length) return lama;
      const baru = [...lama];
      [baru[i], baru[j]] = [baru[j], baru[i]];
      return baru;
    });

  async function jalankan() {
    setError(''); setStatus(''); setByte(0);
    if (!pilihan.length) { setError('Pilih dulu minimal satu modul.'); return; }
    if (!judul.trim()) { setError('Nama pelatihan belum diisi.'); return; }
    setBusy(true);
    try {
      const siap: ModulPaket[] = [];
      for (let i = 0; i < pilihan.length; i++) {
        const p = pilihan[i];
        if (p.html) {
          siap.push({ nama: p.nama, desc: p.desc, html: p.html });
          continue;
        }
        setProgres(`Menyiapkan modul ${i + 1}/${pilihan.length} — ${p.nama}`);
        const m = normalizeModule(await loadDraft(p.id));
        const mentah = await generateHtml(m);
        // Gambar WAJIB disematkan di sini. Tanpa ini modulnya cuma menunjuk
        // Supabase Storage: kelihatan normal di laptop penyusun, tapi kosong
        // begitu paketnya dibuka peserta tanpa akses ke host itu.
        const { html } = await sematkanGambarDataUri(mentah, (n, total) =>
          setProgres(`Modul ${i + 1}/${pilihan.length} — menyematkan gambar (${n}/${total})…`));
        siap.push({ nama: p.nama, desc: p.desc, html });
      }

      const slug = (judul.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'paket');
      const hasil = await exportPaket(
        {
          judul: judul.trim(), sambutan: sambutan.trim(), konsep,
          namaFile: `${slug}.html`, logo: logo.map((l) => l.uri),
        },
        siap,
        (l) => { setProgres(l.pesan); setByte(l.byte); },
      );

      setProgres('');
      const besar = hasil.byte > 60 * 1024 * 1024;
      setStatus(
        `Paket tersimpan — ${ukuranBaca(hasil.byte)}, ${siap.length} modul.` +
        (besar ? ' Ukuran segini berat dibagikan lewat email/WA; pertimbangkan taruh di Storage lalu bagikan tautannya.' : ''),
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') { setProgres(''); }
      else setError(e?.message || 'Gagal merakit paket.');
    } finally {
      setBusy(false);
      setProgres('');
    }
  }

  const perkiraan = pilihan.reduce((a, p) => a + (p.byte || 0), 0);

  /* Syarat yang belum terpenuhi. Dulu tombolnya mati kalau belum ada modul —
     tanpa memberi tahu apa yang kurang — sementara nama pelatihan yang kosong
     justru baru ketahuan SETELAH diklik, lewat pesan merah. Dua syarat setara,
     dua perlakuan berbeda, dan yang satu lagi diam-diam. Sekarang keduanya
     disebutkan di muka, tepat di sebelah tombolnya. */
  const kurang: string[] = [];
  if (!pilihan.length) kurang.push('pilih minimal satu modul');
  if (!judul.trim()) kurang.push('isi nama pelatihan');

  /* Desktop: layar 1160px selalu diperkecil supaya muat selebar kotaknya.
     HP: justru TIDAK diperkecil selama muat — 390px yang ditampilkan 1:1 itu
     yang bikin pratinjaunya bisa dinilai; baru kalau dialognya lebih sempit
     dari 390px dia ikut menyusut. */
  const praW = mode === 'hp' ? PRA_HP_W : PRA_W;
  const skala = mode === 'hp'
    ? Math.min(1, kotak.w / PRA_HP_W)
    : (besar && kotak.h > 0 ? Math.min(kotak.w / PRA_W, kotak.h / PRA_H) : kotak.w / PRA_W);
  /* Tinggi viewport HP mengikuti ruang yang ada, dibagi skala supaya yang
     "dirasakan" halaman di dalamnya tetap tinggi layar sungguhan. Dibatasi
     844 (HP tertinggi yang lazim) dan 420 (di bawah itu bukan HP lagi). */
  const praH = mode === 'desktop' ? PRA_H : Math.max(420, Math.min(
    PRA_HP_H,
    Math.round((besar && kotak.h > 0 ? kotak.h : PRA_HP_H_KOTAK) / (skala || 1)),
  ));

  /* Slug draft memisahkan kata pakai "-" dan "_" (cindi_materi-3-cindi-mt16an8y-3).
     Kalau dicocokkan mentah-mentah, mengetik "cindi 3" tidak menemukan apa-apa
     padahal justru itu yang diingat orang - nama sendiri dan nomor materinya,
     bukan urutan persisnya apalagi kode acak di belakang. Jadi pemisahnya
     disamakan jadi spasi dulu, lalu SETIAP kata harus ada (bukan salah satu):
     "cindi 3" menyaring jauh lebih tajam daripada "cindi" saja. */
  const draftTampil = useMemo(() => {
    const kata = cariDraft.toLowerCase().replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!kata.length) return drafts;
    return drafts.filter((d) => {
      /* Judul ikut dicocokkan, bukan slug saja: begitu judulnya yang tampil
         besar di tiap baris, itulah yang diketik orang untuk mencarinya —
         mencari "pengendalian" lalu tidak menemukan apa-apa padahal tulisan
         itu terpampang di layar adalah cara tercepat bikin orang tidak
         percaya pada kotak carinya. */
      const nama = `${d.judul} ${d.slug}`.toLowerCase().replace(/[_-]+/g, ' ');
      return kata.every((k) => nama.includes(k));
    });
  }, [drafts, cariDraft]);

  /* Draft yang sudah dicentang lalu tersaring keluar tidak hilang dari paket -
     dia tetap ada di daftar "Urutan & keterangan" di bawah. Tapi dari sini
     kelihatannya seperti batal tercentang, jadi dihitung dan dikabari. */
  const tercentangTersembunyi = pilihan.filter(
    (p) => p.sumber === 'draft' && !draftTampil.some((d) => d.slug === p.id),
  ).length;

  /* Pratinjau memakai modul yang SUDAH dipilih kalau ada — jauh lebih berguna
     daripada nama contoh, karena penyusun langsung lihat judulnya sendiri
     dalam tata letak yang dipilih. Nama contoh cuma dipakai selagi belum ada
     yang dicentang. */
  const konsepTampil = sorot ?? konsep;
  /* Larik data URI-nya dibuat stabil terhadap identitas: tanpa ini setiap
     render menghasilkan larik baru, useMemo di bawah ikut batal, dan iframe
     pratinjau dimuat ulang terus-menerus — mahal sekali untuk isi sebesar
     base64 logo. */
  const logoUri = useMemo(() => logo.map((l) => l.uri), [logo]);
  const pratinjau = useMemo(
    () => bangunPratinjau(
      konsepTampil, judul, sambutan,
      pilihan.map((p) => ({ nama: p.nama, desc: p.desc })),
      mode === 'hp',
      logoUri,
    ),
    [konsepTampil, judul, sambutan, pilihan, mode, logoUri],
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.55)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div className="panel" style={{
        width: 720, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        padding: 24, boxShadow: 'var(--shadow-lg)',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Export Paket Modul</h3>
        <p className="hint" style={{ marginTop: 0 }}>
          Satu berkas HTML berisi dashboard + semua modul yang dipilih, ditanam di dalamnya.
          Peserta cukup membuka satu berkas; tiap modul terbuka di tab baru.
        </p>

        {/* ---------- sumber modul ---------- */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
          fontWeight: 600, fontSize: 13, margin: '18px 0 7px',
        }}>
          <span>Modul dari draft</span>
          {cariDraft.trim() && (
            <span className="hint" style={{ fontWeight: 400, fontSize: 11.5 }}>
              {draftTampil.length} dari {drafts.length}
            </span>
          )}
        </div>
        {/* Kotak cari baru muncul kalau daftarnya memang sudah panjang. Di
            atas empat-lima draft, menyaring lebih lambat daripada membaca. */}
        {drafts.length > 5 && (
          <input
            type="search" style={{ ...inp, marginBottom: 6 }} value={cariDraft} disabled={busy}
            onChange={(e) => setCariDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && cariDraft) { e.stopPropagation(); setCariDraft(''); } }}
            placeholder="Cari draft… (mis. cindi 3)" aria-label="Cari draft"
          />
        )}
        <div style={{
          maxHeight: 148, overflowY: 'auto', border: '1px solid var(--border)',
          borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {!drafts.length && <span className="hint">Belum ada draft tersimpan.</span>}
          {drafts.length > 0 && !draftTampil.length && (
            <span className="hint">Tidak ada draft yang cocok. Coba kata lain, atau kosongkan pencarian.</span>
          )}
          {/* Judul modulnya yang dibaca duluan — itu yang nanti muncul di
              dashboard peserta, dan slug seperti "dika_apkdintermediate-case-
              study-2" tidak memberi tahu apa pun soal isinya. Tapi slug TIDAK
              dibuang: judul sama sekali tidak unik (belasan draft bisa
              sama-sama "Modul Baru"), jadi menyembunyikannya justru menukar
              daftar yang membingungkan dengan daftar yang mustahil dibedakan.
              Keduanya sebaris: judul di kiri, slug meredup di kanan sebagai
              pembeda. Draft tanpa judul tampil persis seperti dulu. */}
          {draftTampil.map((d) => (
            <label key={d.slug} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '3px 4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={adaDraft(d.slug)} onChange={() => toggleDraft(d.slug)} disabled={busy} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.judul || d.slug}
              </span>
              {d.judul && (
                <span className="hint" style={{
                  flex: 'none', maxWidth: '45%', fontSize: 11,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{d.slug}</span>
              )}
            </label>
          ))}
        </div>
        {tercentangTersembunyi > 0 && (
          <p className="hint" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            {tercentangTersembunyi} draft yang sudah dicentang sedang disembunyikan pencarian —
            semuanya tetap ikut ter-export.
          </p>
        )}

        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '16px 0 7px' }}>
          Atau tambahkan berkas HTML yang sudah jadi
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => { e.preventDefault(); setSeret(false); tambahBerkas(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1px dashed ${seret ? 'var(--ink)' : 'var(--border-strong)'}`,
            background: seret ? 'var(--ink-soft)' : 'transparent',
            borderRadius: 8, padding: '16px 14px', textAlign: 'center', cursor: 'pointer',
            fontSize: 12.5, color: 'var(--text-dim)',
          }}
        >
          Seret berkas <b>.html</b> ke sini, atau klik untuk memilih —
          untuk modul buatan rekan atau hasil export lama.
        </div>
        <input ref={fileRef} type="file" accept=".html,text/html" multiple style={{ display: 'none' }}
               onChange={(e) => { tambahBerkas(e.target.files); e.target.value = ''; }} />

        {/* ---------- daftar terpilih ---------- */}
        {pilihan.length > 0 && (
          <>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '18px 0 7px' }}>
              Urutan &amp; keterangan ({pilihan.length} modul{perkiraan ? ` · ${ukuranBaca(perkiraan)} dari berkas` : ''})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pilihan.map((p, i) => (
                <div key={p.key} style={{
                  border: '1px solid var(--border)', borderRadius: 8, padding: 10,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button className="btn-ghost btn-sm" type="button" disabled={busy || i === 0}
                            onClick={() => geser(i, -1)} title="Naikkan" style={{ padding: '0 6px' }}>↑</button>
                    <button className="btn-ghost btn-sm" type="button" disabled={busy || i === pilihan.length - 1}
                            onClick={() => geser(i, 1)} title="Turunkan" style={{ padding: '0 6px' }}>↓</button>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input style={inp} value={p.nama} disabled={busy}
                           onChange={(e) => ubah(p.key, { nama: e.target.value })}
                           placeholder="Nama modul" aria-label="Nama modul" />
                    <input style={{ ...inp, fontSize: 12.5 }} value={p.desc} disabled={busy}
                           onChange={(e) => ubah(p.key, { desc: e.target.value })}
                           placeholder="Deskripsi singkat (opsional)" aria-label="Deskripsi modul" />
                    <span className="hint" style={{ fontSize: 11 }}>
                      {p.sumber === 'draft' ? `draft · ${p.id}` : `berkas · ${p.id}`}
                    </span>
                  </div>
                  <button className="btn-ghost btn-sm" type="button" disabled={busy}
                          onClick={() => buang(p.key)} title="Keluarkan dari paket">✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- identitas paket ---------- */}
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '18px 0 7px' }}>
          Nama pelatihan <span className="hint" style={{ fontWeight: 400 }}>· wajib, jadi judul dashboard &amp; nama berkasnya</span>
        </label>
        <input style={inp} value={judul} disabled={busy} onChange={(e) => setJudul(e.target.value)}
               placeholder="mis. Analisis Pengelolaan Keuangan Daerah" />

        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '14px 0 7px' }}>Sambutan singkat</label>
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={sambutan} disabled={busy}
                  onChange={(e) => setSambutan(e.target.value)}
                  placeholder="Kalimat pengantar yang dibaca peserta sebelum memilih modul." />

        {/* ---------- logo penyelenggara ---------- */}
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '18px 0 7px' }}>
          Logo penyelenggara <span className="hint" style={{ fontWeight: 400 }}>
            · opsional, maksimal {LOGO_MAKS} · PNG berlatar tembus pandang
          </span>
        </label>
        <div data-demo="paket-logo" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'stretch' }}>
          {logo.map((l, i) => (
            <div key={l.key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              border: `1px solid ${l.polos ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="btn-ghost btn-sm" type="button" disabled={busy || i === 0}
                        onClick={() => geserLogo(i, -1)} title="Geser ke kiri"
                        style={{ padding: '0 6px' }}>←</button>
                <button className="btn-ghost btn-sm" type="button" disabled={busy || i === logo.length - 1}
                        onClick={() => geserLogo(i, 1)} title="Geser ke kanan"
                        style={{ padding: '0 6px' }}>→</button>
              </div>
              {/* Papan catur di belakang thumbnail: tanpa itu, PNG berlatar
                  putih dan PNG tembus pandang terlihat sama persis di sini. */}
              <span style={{
                display: 'grid', placeItems: 'center', width: 64, height: 40, borderRadius: 6,
                backgroundColor: '#fff',
                backgroundImage:
                  'linear-gradient(45deg,#d8d8de 25%,transparent 25%,transparent 75%,#d8d8de 75%),' +
                  'linear-gradient(45deg,#d8d8de 25%,transparent 25%,transparent 75%,#d8d8de 75%)',
                backgroundSize: '12px 12px', backgroundPosition: '0 0,6px 6px',
              }}>
                <img src={l.uri} alt="" style={{ maxWidth: 58, maxHeight: 34, objectFit: 'contain' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 150 }}>
                <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.nama}
                </span>
                <span className="hint" style={{ fontSize: 11 }}>
                  {ukuranBaca(l.byte)}{l.polos ? ' · latar tidak tembus' : ''}
                </span>
              </span>
              <button className="btn-ghost btn-sm" type="button" disabled={busy}
                      onClick={() => buangLogo(l.key)} title="Keluarkan logo ini">✕</button>
            </div>
          ))}
          {logo.length < LOGO_MAKS && (
            <button type="button" disabled={busy} onClick={() => logoRef.current?.click()}
                    style={{
                      border: '1px dashed var(--border-strong)', background: 'transparent',
                      color: 'var(--text-dim)', borderRadius: 8, padding: '16px 18px',
                      cursor: 'pointer', font: 'inherit', fontSize: 12.5, minHeight: 58,
                    }}>
              + Tambah logo <span className="hint">({logo.length}/{LOGO_MAKS})</span>
            </button>
          )}
        </div>
        <input ref={logoRef} type="file" accept="image/png" multiple style={{ display: 'none' }}
               onChange={(e) => { tambahLogo(e.target.files); e.target.value = ''; }} />
        {logoPesan && (
          <p style={{ color: 'var(--danger)', fontSize: 11.5, margin: '7px 0 0' }}>{logoPesan}</p>
        )}
        {logo.length > 1 && (
          <p className="hint" style={{ fontSize: 11.5, margin: '7px 0 0' }}>
            Urutan kiri-ke-kanan di sini = urutan tampil di dashboard. Tiap logo melayang
            dengan gerak dan iramanya sendiri.
          </p>
        )}

        {/* ---------- konsep ---------- */}
        <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '18px 0 7px' }}>Tampilan dashboard</label>
        {/* Sorot itu INTIP SEKILAS, bukan pilihan. Aturannya satu kalimat:
            pratinjau menampilkan kartu yang sedang DITUNJUK kursor, dan begitu
            kursor tidak menunjuk kartu mana pun lagi, dia balik ke konsep yang
            benar-benar TERPILIH.

            Kuncinya ada di mana pelepasannya dipasang, dan dua percobaan
            sebelumnya salah tempat:

            - Di pembungkus yang memuat kartu DAN kotak pratinjau sekaligus.
              Maksudnya supaya konsep yang barusan diintip masih bisa dicoba,
              tapi hasilnya kebalikannya: kartu tersusun berbaris, jadi kursor
              yang turun menuju pratinjau pasti melintasi kartu lain dulu, dan
              sorotan nyasar itu ikut terbawa masuk lalu mengendap di sana.
            - Di grid-nya saja. Lebih baik, tapi grid itu lebih luas daripada
              kartu-kartunya: ada jarak 8px antar kartu, dan baris terakhir
              menyisakan sel kosong di samping "Fokus". Kursor yang berhenti di
              situ sudah tidak menunjuk kartu apa pun, tapi belum keluar dari
              grid — sorotnya nyangkut, persis keluhan yang dilaporkan.

            Jadi dipasang di KARTUNYA. Meninggalkan kartu selalu melepas sorot,
            ke mana pun kursornya pergi — sela, sel kosong, atau keluar sama
            sekali. Pindah antar kartu tidak berkedip: lepas-lalu-pasang terjadi
            di satu putaran event yang sama dan React menggabungkannya jadi
            satu render. */}
        <div data-demo="paket-konsep"
             style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}
             onMouseLeave={() => setSorot(null)}>
          {KONSEP_INFO.map((k) => (
            <label key={k.id}
                   onMouseEnter={() => setSorot(k.id)}
                   onMouseLeave={() => setSorot(null)}
                   onFocus={() => setSorot(k.id)}
                   onBlur={() => setSorot(null)}
                   style={{
                     border: `1px solid ${konsepTampil === k.id ? 'var(--ink)' : 'var(--border)'}`,
                     background: konsep === k.id ? 'var(--ink-soft)' : 'transparent',
                     borderRadius: 8, padding: 10, cursor: 'pointer', display: 'flex', gap: 8,
                     alignItems: 'flex-start', transition: 'border-color .15s',
                   }}>
              <input type="radio" name="konsep" checked={konsep === k.id} disabled={busy}
                     onChange={() => setKonsep(k.id)} />
              <span>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{k.nama}</span>
                <span className="hint" style={{ fontSize: 11.5 }}>{k.ket}</span>
              </span>
            </label>
          ))}
        </div>

        {/* Pratinjau hidup: cangkang dashboard yang SUNGGUHAN, dirender kecil.
            Bukan gambar contoh — jadi begitu tata letaknya diubah nanti,
            kotak ini ikut berubah sendiri dan tidak akan pernah berbohong.
            Dan karena cangkangnya asli, kotak ini BISA DIPAKAI: dicari,
            disorot, diklik. Yang dipalsukan cuma membuka modulnya (isinya
            memang dikosongkan di pratinjau) — di situ muncul pesan, bukan
            tab putih. Satu-satunya cara tahu rasanya memakai dashboard ini
            sebelum paketnya dirakit adalah dengan benar-benar memakainya. */}
        {/* Sorot juga dilepas begitu kursor MASUK ke kotak ini, tidak cuma
            mengandalkan mouseleave di deretan kartu. Dua jalan membuat
            mouseleave itu tidak terkirim: kursor yang diam sementara halaman
            di-scroll (kartu yang melintas di bawahnya sempat menyalakan sorot,
            lalu penunjuknya berakhir di sini), dan penunjuk yang menyeberang ke
            iframe — dokumen lain, dan induknya tidak selalu dikabari. Keduanya
            bermuara ke sini, jadi di sinilah paling murah dipagari. */}
        <div data-demo="paket-pratinjau"
             onMouseEnter={() => setSorot(null)}
             style={besar ? {
          position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(8,9,12,0.94)',
          display: 'flex', flexDirection: 'column', padding: 14,
        } : {
          marginTop: 10, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
          background: 'var(--surface-2)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            padding: besar ? '0 2px 10px' : '7px 11px',
            borderBottom: besar ? 'none' : '1px solid var(--border)', fontSize: 11.5,
            flex: 'none', color: besar ? '#e9edf5' : undefined,
          }}>
            <span style={{ fontWeight: 600 }}>
              Pratinjau — {KONSEP_INFO.find((k) => k.id === konsepTampil)?.nama}
              {sorot && sorot !== konsep && <span className="hint" style={{ fontWeight: 400 }}> (disorot)</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span className="hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mode === 'hp' ? `${praW}×${praH} · ` : ''}
                {pilihan.length ? `${pilihan.length} modul pilihanmu` : 'nama contoh — centang modul untuk lihat punyamu'}
              </span>
              <span style={{
                display: 'inline-flex', flex: 'none', borderRadius: 7, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {([['desktop', 'Desktop'], ['hp', 'HP']] as const).map(([m, label]) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                          aria-pressed={mode === m}
                          title={m === 'hp'
                            ? 'Lihat seperti di HP: lebar 390px, dan berperilaku seperti layar sentuh'
                            : 'Lihat seperti di layar lebar: 1160px'}
                          /* --ink / --on-ink, BUKAN --accent: token accent tidak
                             pernah ada di root builder (cuma di dalam .pbp-scope
                             dan di dalam cangkang paket), jadi var(--accent) di
                             sini tidak menghasilkan apa-apa. Latarnya batal dan
                             yang tersisa cuma tulisan putih mati di atas panel
                             terang — tombol aktifnya hilang sama sekali di tema
                             terang. Di tema gelap kebetulan masih terbaca, itu
                             sebabnya lama tidak ketahuan. */
                          style={{
                            border: 0, padding: '4px 11px', cursor: 'pointer', font: 'inherit', fontSize: 11.5,
                            background: mode === m ? 'var(--ink)' : 'transparent',
                            color: mode === m ? 'var(--on-ink)' : 'var(--text-dim)',
                          }}>
                    {label}
                  </button>
                ))}
              </span>
              <button className="btn-ghost btn-sm" type="button" onClick={() => setBesar(!besar)}
                      style={{ flex: 'none', fontSize: 11.5 }}
                      title={besar ? 'Kembalikan ke ukuran kotak (Esc)' : 'Perbesar ke seluruh layar supaya enak dicoba'}>
                {besar ? 'Perkecil ⤡' : 'Coba ukuran penuh ⤢'}
              </button>
            </span>
          </div>
          {/* Dirender di lebar desktop lalu diperkecil, supaya tata letak yang
              tampil memang tata letak layar lebar (Indeks butuh ≥900px buat
              memunculkan kolom pratinjaunya, Orbit ≥780px buat cincinnya). */}
          <div ref={kotakRef}
               style={besar ? { flex: 1, minHeight: 0, overflow: 'hidden' } : { overflow: 'hidden' }}>
            <div style={{
              width: Math.round(praW * skala), height: Math.round(praH * skala),
              position: 'relative', margin: '0 auto', overflow: 'hidden',
              /* Bingkai tipis cuma di mode HP: tanpa itu, layar HP yang sempit
                 di tengah kotak gelap tidak kelihatan batasnya sampai mana. */
              outline: mode === 'hp' ? '1px solid var(--border-strong)' : undefined,
              borderRadius: mode === 'hp' ? 10 : undefined,
            }}>
              <iframe
                title="Pratinjau tampilan dashboard"
                srcDoc={pratinjau}
                style={{
                  width: praW, height: praH, border: 0,
                  transform: `scale(${skala})`, transformOrigin: 'top left',
                  position: 'absolute', top: 0, left: 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* ---------- aksi ---------- */}
        {progres && (
          <p className="hint" style={{ marginTop: 16, marginBottom: 0 }}>
            {progres}{byte ? ` · ${ukuranBaca(byte)} tertulis` : ''}
          </p>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 14, marginBottom: 0 }}>{error}</p>}
        {status && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 14, marginBottom: 0 }}>{status}</p>}

        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center',
          flexWrap: 'wrap', marginTop: 20,
        }}>
          {!busy && kurang.length > 0 && (
            <span className="hint" style={{ fontSize: 11.5, marginRight: 'auto' }}>
              Tinggal {kurang.join(' dan ')}.
            </span>
          )}
          <button className="btn-ghost" type="button" data-demo="paket-tutup"
                  onClick={onClose} disabled={busy}>Tutup</button>
          <button className="btn" type="button" onClick={jalankan} disabled={busy || kurang.length > 0}>
            {busy ? 'Merakit…' : `Export paket (${pilihan.length} modul)`}
          </button>
        </div>
      </div>
    </div>
  );
}
