// Perakit paket SCORM (.zip) — dijalankan SEPENUHNYA DI BROWSER.
//
// Kenapa di browser, bukan di backend: paket Articulate gampang 50–150MB.
// Fungsi serverless Vercel punya batas body request ~4.5MB dan batas memori
// yang jauh di bawah itu, jadi merakit ZIP di sana bukan cuma mahal — memang
// gak mungkin. Di browser, byte-nya cuma lewat sekali: ZIP asal dibaca
// per-entri, langsung ditulis ke ZIP tujuan, gak pernah ada satu momen di mana
// seluruh isi paket nongkrong bareng di memori.
//
// Kalau browser-nya dukung File System Access API (Chrome/Edge), hasilnya
// DITULIS LANGSUNG KE FILE yang dipilih pengguna — pemakaian memori jadi rata
// berapa pun besar paketnya. Firefox/Safari gak punya itu, jadi di sana ZIP-nya
// dirakit sebagai Blob dulu (browser yang mutusin ditaruh di RAM atau disk).

import type { Block, ModuleData } from './types';
import { fetchArticulateZip, generateHtmlForZip } from './api';
// Kenapa gambar harus ikut dibungkus & bukan tetap nunjuk Storage: lihat
// komentar pembuka assetEmbed.ts.
import { namaAset, urlGambar } from './assetEmbed';

// Ekstensi yang isinya SUDAH terkompresi. Mendeflate ulang cuma bakar CPU
// (dan waktu tunggu penyusun modul) buat hasil yang praktis gak menyusut.
const SUDAH_TERKOMPRESI = /\.(mp4|m4a|m4v|mp3|ogg|oga|ogv|webm|webp|jpe?g|png|gif|woff2?|zip|swf|avif)$/i;

// Tanpa ini, tiap entri ditulis pakai "data descriptor" (ukuran & CRC ditaruh
// SESUDAH datanya, karena penulis stream belum tau ukurannya waktu header
// dibuat). Formatnya sah, tapi itu bentuk yang paling sering bikin unzip lawas
// di sisi server rewel — dan LMS membongkar paketnya di server, bukan di
// browser. Kita gak butuh itu: tiap entri sudah utuh di memori sebelum
// ditulis, jadi ukuran & CRC-nya memang sudah diketahui di muka. Diuji: dengan
// opsi ini, 0 dari sekian entri pakai data descriptor, dan hasilnya sedikit
// lebih kecil.
const OPSI_ENTRI = {
  dataDescriptor: false,
  // Tanpa ini, tiap entri bawa extra field Unix ("UT" timestamp + UID/GID) -
  // sesuatu yang gak pernah ada di ZIP buatan Windows/Articulate biasa.
  // Dicurigai jadi biang KLC menolak paket dengan pesan "Zip file doesn't
  // contain index.html" padahal index.html ada persis di posisi pertama:
  // kalau pengurai ZIP di sisi KLC itu bikinan sendiri (bukan pustaka ZIP
  // standar) dan gak menangani extra field asing dengan benar, dia bisa
  // salah hitung offset lalu gagal membaca entri berikutnya sama sekali.
  // Dimatikan biar hasilnya sedekat mungkin ke ZIP paling polos.
  extendedTimestamp: false,
} as const;

export interface ZipProgress {
  fase: 'html' | 'aset' | 'articulate' | 'manifest' | 'selesai';
  pesan: string;
  /** 0–100, atau null kalau fase ini gak bisa diukur. */
  persen: number | null;
}

/** Semua blok articulate di modul, termasuk yang bersarang di dalam Grid. */
export function articulateBlocks(module: ModuleData): Block[] {
  const out: Block[] = [];
  const walk = (blocks?: Block[]) => {
    for (const b of blocks || []) {
      if (b.type === 'articulate' && (b.artUrl || b.artPath)) out.push(b);
      else if (b.type === 'grid') walk(b.blocks);
    }
  };
  for (const s of module.slides || []) walk(s.blocks);
  return out;
}

// Turunkan (root, entry) dari blok. Blok yang diupload SEBELUM artRoot ada
// menyimpan path lengkap di artEntry (termasuk folder induk); di situ root
// diturunkan dari path itu sendiri, supaya draft lama tetap terakit benar
// tanpa perlu upload ulang.
function artPaths(b: Block): { root: string; entry: string } {
  const raw = (b.artEntry || 'index_lms.html').replace(/^\/+/, '');
  if (b.artRoot !== undefined) return { root: b.artRoot, entry: raw };
  const i = raw.lastIndexOf('/');
  return i < 0 ? { root: '', entry: raw } : { root: raw.slice(0, i + 1), entry: raw.slice(i + 1) };
}

function xmlEsc(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Path di manifest harus URL-encoded per segmen (nama file Articulate sering
// mengandung spasi/karakter non-ASCII). Slash-nya sendiri jangan ikut di-encode.
function hrefEsc(path: string) {
  return xmlEsc(path.split('/').map(encodeURIComponent).join('/'));
}

function buildManifest(slug: string, title: string, files: string[]) {
  const id = `MANIFEST-${slug || 'modul'}`;
  const fileTags = files.map(f => `      <file href="${hrefEsc(f)}"/>`).join('\n');
  // SCORM 1.2, satu SCO. Sengaja bukan 2004: KLC menerima keduanya, dan 1.2
  // punya dukungan paling luas di LMS lain kalau modulnya dipakai ulang.
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${xmlEsc(id)}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>${xmlEsc(title)}</title>
      <item identifier="ITEM-1" identifierref="RES-1" isvisible="true">
        <title>${xmlEsc(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileTags}
    </resource>
  </resources>
</manifest>
`;
}

async function bukaTujuan(namaFile: string) {
  const anyWin = window as any;
  if (anyWin.showSaveFilePicker) {
    try {
      const handle = await anyWin.showSaveFilePicker({
        suggestedName: namaFile,
        types: [{ description: 'Paket SCORM', accept: { 'application/zip': ['.zip'] } }],
      });
      const stream: WritableStream = await handle.createWritable();
      return { stream, unduhSendiri: false as const };
    } catch (e: any) {
      // Pengguna menutup dialognya = batal beneran, bukan alasan buat
      // diam-diam pindah ke jalur Blob yang boros memori.
      if (e?.name === 'AbortError') throw e;
    }
  }
  return { stream: null, unduhSendiri: true as const };
}

/**
 * Rakit seluruh modul jadi satu paket SCORM .zip siap upload ke LMS:
 *
 *   <slug>/                     <- SATU folder induk membungkus semuanya
 *   <slug>/index.html           <- modul hasil generator (iframe-nya nunjuk ke bawah)
 *   <slug>/articulate/<idBlok>/ <- isi paket Articulate, apa adanya
 *   <slug>/imsmanifest.xml
 *
 * Kenapa dibungkus folder induk, bukan ditaruh rata di akar ZIP: validator
 * SCORM di KLC MENOLAK paket yang isinya langsung di akar, dengan pesan
 * "Zip file doesn't contain `index.html` or `story[?].html`" - padahal
 * index.html ADA persis di akar sebagai entri pertama. Dibuktikan langsung
 * lewat uji upload ke KLC: paket yang sama, satu-satunya beda dibungkus
 * folder induk + entri direktori eksplisit, langsung diterima ("Data
 * pelatihan berhasil disimpan"). Pola ini juga persis yang dipakai paket
 * hasil publish Articulate sendiri - yang memang selama ini selalu lolos.
 */
export async function exportScormZip(
  module: ModuleData,
  onProgress: (p: ZipProgress) => void,
): Promise<void> {
  const zipjs = await import('@zip.js/zip.js');
  const { ZipWriter, ZipReader, BlobReader, BlobWriter, TextReader } = zipjs;

  onProgress({ fase: 'html', pesan: 'Menyusun HTML modul…', persen: null });
  const html = await generateHtmlForZip(module);

  const blocks = articulateBlocks(module);
  const slug = module.slug || 'modul';
  const namaFile = `${slug}-scorm.zip`;

  const tujuan = await bukaTujuan(namaFile);
  const blobWriter = tujuan.unduhSendiri ? new BlobWriter('application/zip') : null;
  const writer = new ZipWriter(tujuan.stream ?? blobWriter!, { bufferedWrite: false });

  // Folder induk pembungkus. SENGAJA nama tetap yang pendek, BUKAN slug modul:
  // slug bisa 45+ karakter ("ikram-betatester_testing-modul-a-1-mru5ljtd-5"),
  // dan itu mendorong path terdalam melewati batas panjang yang diterima KLC.
  // Dibuktikan lewat uji upload berpasangan - paket yang sama persis, cuma beda
  // nama folder induk: 46 char (path terdalam 137) DITOLAK, 12 char (path
  // terdalam 103) DITERIMA. Nama pendek ini memangkas ~40 karakter dari SEMUA
  // path sekaligus.
  const AKAR = 'modul/';

  // Ambang konservatif. Bukti yang kita punya: 103 lolos, 137 ditolak - jadi
  // batas asli KLC ada di antaranya (kemungkinan 128). Dijaga di 120 supaya
  // masih ada ruang. Paket Articulate dengan struktur folder yang sangat dalam
  // masih bisa menembusnya, dan kalau itu terjadi kita mau ketahuan DI SINI -
  // bukan setelah penyusun modul menunggu paket jadi lalu ditolak LMS dengan
  // pesan menyesatkan ("Zip file doesn't contain index.html").
  const BATAS_PATH = 120;
  const pathKepanjangan: string[] = [];

  // Entri direktori eksplisit. Paket Articulate yang diterima KLC punya ini
  // (17 entri direktori), paket kita dulu nol - dan pembongkar ZIP yang naif
  // memang ada yang mengandalkan entri direktori untuk membentuk pohon folder,
  // bukan menyimpulkannya dari path file.
  const folderDitulis = new Set<string>();
  async function pastikanFolder(pathFile: string) {
    const bagian = pathFile.split('/').slice(0, -1);
    for (let i = 1; i <= bagian.length; i++) {
      const dir = bagian.slice(0, i).join('/') + '/';
      if (folderDitulis.has(dir)) continue;
      folderDitulis.add(dir);
      await writer.add(dir, undefined, { ...OPSI_ENTRI, directory: true });
    }
  }

  // Path di imsmanifest.xml RELATIF terhadap folder induk (manifest ikut
  // tinggal di dalamnya), jadi daftarnya tetap tanpa awalan AKAR.
  // Gambar dulu, baru index.html: HTML-nya ikut berubah (URL absolut ditukar
  // path relatif), jadi harus final sebelum ditulis.
  const daftarFile: string[] = ['index.html'];
  const gambar = urlGambar(html);
  let htmlFinal = html;
  const gagalGambar: string[] = [];
  for (let i = 0; i < gambar.length; i++) {
    const url = gambar[i];
    onProgress({
      fase: 'aset',
      pesan: `Menyematkan gambar (${i + 1}/${gambar.length})…`,
      persen: Math.round(((i + 1) / gambar.length) * 100),
    });
    let data: Blob;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      data = await res.blob();
    } catch {
      // Satu gambar gagal ditarik bukan alasan membatalkan seluruh paket -
      // URL-nya dibiarkan apa adanya (paling buruk: sama seperti sebelum ini)
      // dan penyusun modul diberi tahu di akhir, saat masih bisa memperbaiki.
      gagalGambar.push(url);
      continue;
    }
    const target = namaAset(url, i);
    await pastikanFolder(AKAR + target);
    await writer.add(AKAR + target, new BlobReader(data), { ...OPSI_ENTRI, level: 0 });
    daftarFile.push(target);
    // Ganti SEMUA kemunculan: satu gambar bisa dipakai di beberapa slide.
    htmlFinal = htmlFinal.split(url).join(target);
  }
  if (gagalGambar.length) {
    console.warn('[scorm] gambar gagal disematkan:', gagalGambar);
  }

  await pastikanFolder(`${AKAR}index.html`);
  await writer.add(`${AKAR}index.html`, new TextReader(htmlFinal), OPSI_ENTRI);

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const label = b.artName || `paket ${i + 1}`;
    onProgress({
      fase: 'articulate',
      pesan: `Mengambil ${label} (${i + 1}/${blocks.length})…`,
      persen: null,
    });
    const zipBlob = await fetchArticulateZip(b.artUrl || '', {
      storage: b.artStorage,
      key: b.artPath,
    });
    const reader = new ZipReader(new BlobReader(zipBlob));
    let entryKetemu = false;
    try {
      const entries = await reader.getEntries();
      // Kalau paketnya dibungkus satu folder induk, folder itu DIBUANG dari
      // path tujuan — biar `articulate/<id>/<entry>` selalu cocok sama yang
      // ditulis generator, gak peduli cara publish-nya.
      const { root, entry } = artPaths(b);
      // Penyebutnya file yang benar-benar bakal disalin - kalau pakai
      // entries.length mentah, entri direktori & file di luar root ikut
      // kehitung dan persennya gak pernah nyampe 100.
      const totalSalin = entries.filter(e => !e.directory && (!root || e.filename.startsWith(root))).length;
      let n = 0;
      for (const e of entries) {
        if (e.directory) continue;
        if (root && !e.filename.startsWith(root)) continue;
        const rel = root ? e.filename.slice(root.length) : e.filename;
        if (!rel) continue;
        const target = `articulate/${b.id}/${rel}`;
        if ((AKAR + target).length > BATAS_PATH) pathKepanjangan.push(AKAR + target);
        await pastikanFolder(AKAR + target);
        // Satu entri pada satu waktu — inilah yang bikin paket 150MB tetap
        // muat: yang ada di memori cuma file terbesar di dalamnya, bukan
        // seluruh paket.
        const data: Blob = await e.getData!(new BlobWriter());
        await writer.add(AKAR + target, new BlobReader(data), {
          ...OPSI_ENTRI,
          level: SUDAH_TERKOMPRESI.test(rel) ? 0 : 1,
        });
        daftarFile.push(target);
        if (rel === entry) entryKetemu = true;
        n++;
        if (n % 25 === 0) {
          onProgress({
            fase: 'articulate',
            pesan: `Membungkus ${label}…`,
            persen: Math.round((n / totalSalin) * 100),
          });
        }
      }
    } finally {
      await reader.close();
    }
    // Sabuk pengaman: kalau file pembukanya gak ikut kesalin, paketnya bakal
    // keluar "sukses" tapi iframe-nya 404 di dalam LMS — kegagalan yang baru
    // ketahuan setelah diupload. Lebih baik gagal keras di sini.
    if (!entryKetemu) {
      throw new Error(
        `File pembuka "${artPaths(b).entry}" gak ketemu di dalam ${label}. ` +
        'Upload ulang ZIP-nya di blok Articulate itu (paket lama disimpan dengan struktur path yang berbeda).'
      );
    }
  }

  if (pathKepanjangan.length) {
    const contoh = pathKepanjangan.sort((a, b2) => b2.length - a.length)[0];
    throw new Error(
      `${pathKepanjangan.length} file di dalam paket punya path lebih dari ${BATAS_PATH} karakter, ` +
      `dan KLC menolak paket seperti itu dengan pesan yang menyesatkan ("Zip file doesn't contain index.html"). ` +
      `Terpanjang (${contoh.length} karakter): ${contoh}. ` +
      `Perpendek nama file/folder di dalam paket Articulate-nya, lalu publish & upload ulang.`
    );
  }

  onProgress({ fase: 'manifest', pesan: 'Menulis imsmanifest.xml…', persen: null });
  const manifest = buildManifest(slug, module.title || 'Modul E-Learning', daftarFile);
  await writer.add(`${AKAR}imsmanifest.xml`, new TextReader(manifest), OPSI_ENTRI);

  const hasil = await writer.close();

  if (tujuan.unduhSendiri) {
    const url = URL.createObjectURL(hasil as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = namaFile;
    a.click();
    URL.revokeObjectURL(url);
  }
  onProgress({ fase: 'selesai', pesan: `Paket SCORM siap: ${namaFile}`, persen: 100 });
}
