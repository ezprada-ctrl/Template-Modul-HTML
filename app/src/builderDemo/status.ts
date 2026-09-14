/* Penanda "Demo Booth sedang jalan", dibaca komponen biasa.
 *
 * ADA untuk satu alasan sempit: beberapa tempat di aplikasi memanggil
 * window.confirm() sebagai pagar buat MANUSIA yang mungkin salah klik. Di
 * booth tidak ada manusia itu - yang ada kursor palsu, dan confirm() menahan
 * seluruh demo sampai ada orang sungguhan menekan OK. Satu dialog yatim di
 * layar pameran sama saja dengan booth mati.
 *
 * Berkas terpisah (bukan di engine.ts) supaya komponen yang cuma butuh
 * penandanya tidak ikut menyeret seluruh mesin demo ke dalam bundel-nya.
 *
 * Yang boleh dilewati cuma pagar yang menanyakan "yakin?" atas tindakan yang
 * memang sengaja dilakukan demo. Pagar yang melindungi DATA ORANG LAIN -
 * hapus draft di server, timpa draft - tidak boleh ikut dilewati, dan demo
 * memang tidak pernah menyentuhnya.
 */
let jalan = false;

export function setDemoBoothJalan(nyala: boolean) { jalan = nyala; }
export function demoBoothJalan() { return jalan; }
