// Perakit "Paket Modul": satu berkas HTML berisi dashboard + SEMUA modul
// yang dipilih, ditanam utuh di dalamnya.
//
// Dirakit SEPENUHNYA DI BROWSER, alasannya sama persis dengan scormZip.ts:
// fungsi serverless Vercel punya batas body ~4,5MB dan batas memori yang jauh
// di bawah itu. Delapan modul yang sudah disematkan gambarnya gampang tembus
// puluhan MB — merakitnya di sana bukan cuma mahal, memang tidak mungkin.
//
// Kalau browser-nya dukung File System Access API (Chrome/Edge), isinya
// DITULIS LANGSUNG ke berkas yang dipilih pengguna, modul demi modul. Ini yang
// bikin paket 100MB tetap aman: tidak pernah ada satu momen di mana seluruh
// paket nongkrong bareng di memori sebagai satu string raksasa. Firefox/Safari
// tidak punya API itu, jadi di sana terpaksa lewat Blob — dan justru di situ
// batas praktisnya menggigit.

import cangkang from './paket-shell.html?raw';

export type Konsep =
  | 'panel' | 'indeks' | 'orbit' | 'terminal' | 'kartu'
  | 'linimasa' | 'metro' | 'majalah' | 'rak' | 'fokus';

export interface ModulPaket {
  nama: string;
  desc?: string;
  /** HTML modul yang SUDAH mandiri (gambar tersemat). */
  html: string;
}

export interface PaketMeta {
  judul: string;
  sambutan: string;
  konsep: Konsep;
  namaFile: string;
}

export interface LaporRakit {
  fase: 'siap' | 'tulis' | 'selesai';
  pesan: string;
  /** 0..1, null kalau belum diketahui */
  persen: number | null;
  /** byte yang sudah ditulis */
  byte: number;
}

const escHtml = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

// JSON.stringify sudah mengurus kutip, backslash, dan baris baru. Yang TIDAK
// diurusnya: urutan yang bisa menutup blok <script> induknya lebih awal —
// sebuah modul jelas berisi "</script>" karena dia dokumen HTML utuh. Dua
// pola inilah yang wajib dilumpuhkan; meng-escape SEMUA "<" juga aman tapi
// menggelembungkan berkas (satu "<" jadi enam karakter) di berkas yang
// memang sudah puluhan MB.
function jsString(nilai: unknown): string {
  return JSON.stringify(nilai)
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--');
}

/** Cangkang dengan semua penanda terisi KECUALI isi modulnya. */
function isiCangkang(
  meta: Pick<PaketMeta, 'judul' | 'sambutan' | 'konsep'>,
  modul: { nama: string; desc?: string }[],
  pratinjau = false,
  paksaSentuh = false,
) {
  return cangkang
    .replace(/__PAKET_JUDUL__/g, escHtml(meta.judul))
    .replace(/__PAKET_SAMBUTAN__/g, escHtml(meta.sambutan))
    .replace('__PAKET_KONSEP__', meta.konsep)
    .replace('__PAKET_PRATINJAU__', pratinjau ? 'true' : 'false')
    .replace('__PAKET_SENTUH__', paksaSentuh ? 'true' : 'false')
    .replace('__PAKET_MODUL__', jsString(modul.map((m) => ({ nama: m.nama, desc: m.desc || '' }))));
}

/** Pisahkan cangkang di penanda, supaya bagian berat bisa ditulis mengalir. */
function belahCangkang(meta: PaketMeta, modul: ModulPaket[]) {
  const isi = isiCangkang(meta, modul);
  const potong = isi.indexOf('__PAKET_ISI__');
  if (potong < 0) throw new Error('Cangkang paket rusak: penanda __PAKET_ISI__ tidak ditemukan.');
  return { awal: isi.slice(0, potong), akhir: isi.slice(potong + '__PAKET_ISI__'.length) };
}

/** Nama contoh, dipakai pratinjau kalau penyusun belum memilih modul apa pun. */
export const MODUL_CONTOH: { nama: string; desc?: string }[] = [
  { nama: 'Lorem Ipsum Dolor Sit', desc: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.' },
  { nama: 'Consectetur Adipiscing' },
  { nama: 'Tempor Incididunt Labore', desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
  { nama: 'Magna Aliqua Ut Enim' },
  { nama: 'Quis Nostrud Exercitation', desc: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.' },
  { nama: 'Ullamco Laboris Nisi Aliquip' },
];

/**
 * HTML pratinjau: cangkang SUNGGUHAN dengan isi modul dikosongkan.
 *
 * Sengaja memakai cangkang yang sama persis dengan hasil export, bukan
 * gambar atau tiruan mini - begitu tata letaknya diubah nanti, pratinjaunya
 * ikut berubah sendiri dan tidak akan pernah berbohong. Karena cangkangnya
 * asli, pratinjaunya juga bisa DIPAKAI: dicari, disorot, diklik. Satu-satunya
 * yang dipalsukan adalah membuka modul - lihat penanda PRATINJAU di cangkang.
 *
 * `sentuh` dinyalakan waktu pratinjaunya disetel ke ukuran HP: lebar 390px saja
 * tidak cukup, karena perangkat penyusunnya tetap punya kursor dan cangkang
 * memutuskan beberapa hal dari situ (lihat PAKSA_SENTUH di cangkang).
 */
export function bangunPratinjau(
  konsep: Konsep,
  judul: string,
  sambutan: string,
  modul: { nama: string; desc?: string }[],
  sentuh = false,
): string {
  const daftar = modul.length ? modul : MODUL_CONTOH;
  const isi = isiCangkang(
    {
      konsep,
      judul: judul.trim() || 'Nama Pelatihan',
      sambutan: sambutan.trim() || 'Sambutan singkat untuk peserta muncul di sini.',
    },
    daftar,
    true,
    sentuh,
  );
  // ISI diisi string kosong sebanyak modulnya supaya panjangnya tetap sepadan
  // dengan MODUL; pratinjau tidak bisa diklik (pointer-events dimatikan di
  // sisi dialog), jadi isinya memang tidak pernah dipakai.
  return isi.replace('__PAKET_ISI__', daftar.map(() => '""').join(','));
}

async function bukaTujuan(namaFile: string) {
  const anyWin = window as any;
  if (anyWin.showSaveFilePicker) {
    try {
      const handle = await anyWin.showSaveFilePicker({
        suggestedName: namaFile,
        types: [{ description: 'Paket modul (HTML)', accept: { 'text/html': ['.html'] } }],
      });
      const stream: WritableStream = await handle.createWritable();
      return { stream, unduhSendiri: false as const };
    } catch (e: any) {
      // Pengguna menutup dialognya = batal beneran, bukan alasan diam-diam
      // pindah ke jalur Blob yang boros memori.
      if (e?.name === 'AbortError') throw e;
    }
  }
  return { stream: null, unduhSendiri: true as const };
}

/**
 * Rakit & simpan paketnya. `lapor` dipanggil tiap modul selesai ditulis,
 * membawa jumlah byte yang sudah mendarat — dipakai UI buat menampilkan
 * ukuran yang TUMBUH, bukan tebakan di muka (ukuran HTML jadi tidak bisa
 * ditaksir dari ukuran draft: gambar yang di JSON cuma URL berubah jadi
 * base64 yang jauh lebih besar).
 */
export async function exportPaket(
  meta: PaketMeta,
  modul: ModulPaket[],
  lapor: (l: LaporRakit) => void,
): Promise<{ byte: number; lewatBlob: boolean }> {
  if (!modul.length) throw new Error('Belum ada modul yang dipilih.');

  const { awal, akhir } = belahCangkang(meta, modul);
  const tujuan = await bukaTujuan(meta.namaFile);
  const enc = new TextEncoder();

  let byte = 0;
  const potongan: string[] = []; // cuma kepakai di jalur Blob
  const tulis = async (teks: string) => {
    byte += enc.encode(teks).length;
    if (tujuan.stream) {
      const w = tujuan.stream.getWriter();
      await w.write(teks as any);
      w.releaseLock();
    } else {
      potongan.push(teks);
    }
  };

  lapor({ fase: 'tulis', pesan: 'Menulis kerangka…', persen: 0, byte: 0 });
  await tulis(awal);

  for (let i = 0; i < modul.length; i++) {
    const m = modul[i];
    lapor({
      fase: 'tulis',
      pesan: `Menanam modul ${i + 1}/${modul.length} — ${m.nama}`,
      persen: i / modul.length,
      byte,
    });
    await tulis((i ? ',\n' : '') + jsString(m.html));
  }

  await tulis(akhir);

  if (tujuan.stream) {
    await tujuan.stream.close();
  } else {
    // Jalur cadangan: seluruh paket terpaksa disatukan di memori dulu.
    const blob = new Blob(potongan, { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  lapor({ fase: 'selesai', pesan: 'Paket tersimpan.', persen: 1, byte });
  return { byte, lewatBlob: tujuan.unduhSendiri };
}

/** Judul modul dari berkas HTML hasil export lama (buat modul yang diseret masuk). */
export function judulDariHtml(html: string, namaBerkas: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t && t[1].trim()) {
    const teks = t[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    return teks.trim();
  }
  return namaBerkas.replace(/\.html?$/i, '');
}

/** Deskripsi usulan dari `heroDesc` modul: tag dibuang, dipadatkan jadi satu baris. */
export function ringkasDeskripsi(heroDesc: string | undefined): string {
  if (!heroDesc) return '';
  return heroDesc
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function ukuranBaca(byte: number): string {
  if (byte < 1024) return byte + ' B';
  if (byte < 1024 * 1024) return (byte / 1024).toFixed(0) + ' KB';
  return (byte / 1024 / 1024).toFixed(1) + ' MB';
}
