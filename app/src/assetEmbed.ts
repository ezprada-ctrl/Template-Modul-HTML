// Penyematan gambar ke dalam hasil export.
//
// Gambar (sampul & blok gambar) disimpan di Supabase Storage, jadi HTML hasil
// generator menunjuk ke URL absolut https://<proyek>.supabase.co/... Itu jalan
// selama modulnya dibuka dari browser penyusun — dan itulah kenapa masalahnya
// gak kelihatan waktu file HTML-nya dicoba di laptop sendiri. Begitu diupload
// ke KLC, halamannya disajikan dari server LMS di jaringan yang gak menjangkau
// host luar: sampul jadi polos abu-abu dan blok gambar jadi kotak kosong.
//
// Jadi hasil export apa pun harus MANDIRI soal gambar. Dua bentuk export butuh
// cara yang beda:
//   - paket SCORM .zip  -> gambar jadi file `assets/imgN.<ext>` di dalam ZIP,
//                          URL-nya ditukar path relatif (lihat scormZip.ts)
//   - HTML tunggal      -> gambar disematkan sebagai data URI di dalam file
//                          itu sendiri, karena gak ada folder pendamping
//
// Cuma gambar. Video/audio sengaja dibiarkan menunjuk ke Storage: ukurannya
// bisa ratusan MB, dan menyematkannya bakal mendorong hasil export lewat batas
// upload LMS.

const EKSTENSI_GAMBAR = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;

/** Semua URL gambar absolut yang dipakai HTML, unik, urut kemunculan. */
export function urlGambar(html: string): string[] {
  const out = new Set<string>();
  // Ditangkap dari src="..." maupun background-image:url('...') sekaligus -
  // keduanya berhenti di kutip/kurung/spasi, jadi satu pola cukup.
  const re = /https?:\/\/[^"'()\s\\]+/g;
  for (const m of html.match(re) || []) {
    if (EKSTENSI_GAMBAR.test(m)) out.add(m);
  }
  return [...out];
}

export function namaAset(url: string, i: number): string {
  const bersih = url.split(/[?#]/)[0];
  const ext = (bersih.match(/\.([a-z0-9]+)$/i)?.[1] || 'jpg').toLowerCase();
  // Nama sengaja diseragamkan (bukan nama asli file): nama unggahan pengguna
  // sering panjang & mengandung spasi/karakter non-ASCII, dan panjang path
  // adalah hal yang justru bikin KLC menolak paket (lihat BATAS_PATH).
  return `assets/img${i + 1}.${ext}`;
}

function blobKeDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Gagal membaca gambar'));
    r.readAsDataURL(blob);
  });
}

export interface HasilSemat {
  html: string;
  /** URL yang gagal ditarik — dibiarkan apa adanya di HTML. */
  gagal: string[];
  jumlah: number;
}

/**
 * Tukar setiap URL gambar absolut di HTML dengan data URI-nya. Dipakai export
 * HTML tunggal.
 */
export async function sematkanGambarDataUri(
  html: string,
  onProgress?: (i: number, total: number) => void,
): Promise<HasilSemat> {
  const daftar = urlGambar(html);
  const gagal: string[] = [];
  let out = html;
  for (let i = 0; i < daftar.length; i++) {
    const url = daftar[i];
    onProgress?.(i + 1, daftar.length);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const dataUri = await blobKeDataUri(await res.blob());
      // Ganti SEMUA kemunculan: satu gambar bisa dipakai di beberapa slide.
      out = out.split(url).join(dataUri);
    } catch {
      // Satu gambar gagal ditarik bukan alasan membatalkan seluruh export -
      // URL-nya dibiarkan apa adanya (paling buruk: sama seperti sebelum ini)
      // dan penyusun modul diberi tahu, saat masih bisa memperbaiki.
      gagal.push(url);
    }
  }
  return { html: out, gagal, jumlah: daftar.length - gagal.length };
}
