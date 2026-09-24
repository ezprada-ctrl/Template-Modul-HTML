import type { CSSProperties, ReactNode } from 'react';
import type { PeringatanDetail, VideoDetail } from '../api';

/* Potongan tampilan tabel Command Center yang dipakai DUA tempat: tabel
   aslinya (CommandCenter.tsx) dan replika data karangan di panduan cara baca
   (PanduanBaca.tsx). Sengaja satu sumber - kalau replikanya punya salinan
   gaya sendiri, lambat laun panduan menunjukkan tabel yang sudah tidak ada. */

// Ringkasan di atas tabel. Alasannya: tabelnya 13 kolom dengan bobot visual
// sama rata, jadi gak ada apa pun yang menuntun mata ke angka yang paling
// menentukan tindak lanjut. Ini tempat mendarat sebelum masuk ke rinciannya.
// Sengaja cuma 4 angka - kalau lebih, dia berubah jadi tabel kedua dan
// masalahnya balik lagi.
// `bungkus` cuma dipakai panduan: tiap kotak dijadikan bagian yang bisa
// diklik. Tabel aslinya tidak mengisinya.
export function RingkasanBar({ butir, bungkus }: {
  butir: { label: string; nilai: string; catatan?: string; awas?: boolean }[];
  bungkus?: (label: string, isi: ReactNode) => ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 14,
      background: 'var(--border)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      {butir.map(b => {
        const isi = <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            {b.label}
          </div>
          <div style={{
            fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2,
            color: b.awas ? 'var(--danger)' : 'var(--text)',
          }}>
            {b.nilai}
          </div>
          {b.catatan && (
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{b.catatan}</div>
          )}
        </>;
        return (
          <div key={b.label} style={{ flex: '1 1 130px', background: 'var(--surface)', padding: bungkus ? 0 : '10px 13px' }}>
            {bungkus ? bungkus(b.label, <div style={{ padding: '10px 13px' }}>{isi}</div>) : isi}
          </div>
        );
      })}
    </div>
  );
}

// Satu peserta dihitung "perlu ditindaklanjuti" kalau ada MINIMAL SATU sinyal
// yang memang bisa ditindaklanjuti di kelas: mengabaikan peringatan baca-cepat,
// meninggalkan layar lama, gagal kuis, atau membuka video lalu praktis tidak
// menontonnya. Ambangnya sengaja sama persis dengan ambang ⚠ yang sudah dipakai
// di tabel - biar angka ringkasan dan tanda di baris gak pernah bercerita beda.
export function perluTindakLanjut(x: {
  peringatan_diabaikan?: number; durasi_ditinggal_menit: number | null;
  kuis_gagal: number; video_dimulai: number; video_rata_persen: number | null;
  video_detail?: VideoDetail[];
}): boolean {
  if ((x.peringatan_diabaikan || 0) > 0) return true;
  if ((x.durasi_ditinggal_menit ?? 0) > 10) return true;
  if (x.kuis_gagal > 0) return true;
  if (x.video_dimulai > 0 && (x.video_rata_persen ?? 100) < 20) return true;
  // Video kelihatan "ditonton" (persennya tinggi) tapi sebagian dipercepat
  // atau dilompatin di putaran pertama - beda kasus dari baris di atas
  // (yang nangkep video yang persennya RENDAH). Satu video begini di
  // antara video lain yang wajar tetap harus bikin peserta ini kepilih
  // buat ditinjau, walau video_rata_persen gabungannya kelihatan bagus.
  if ((x.video_detail || []).some(v => v.skip || (v.rate ?? 0) > 1.01)) return true;
  return false;
}

// Kolom pertama (nama peserta) DIKUNCI supaya tetap kelihatan waktu tabel
// digeser ke kanan. Tanpa ini tabelnya praktis gak kebaca menyamping: lebarnya
// ~1400px di wadah ~760px, jadi begitu pembaca geser buat lihat kolom kanan,
// nama pesertanya keluar layar dan dia gak tau lagi itu baris siapa.
// Latarnya WAJIB dipasang eksplisit - sel sticky melayang di atas sel lain,
// kalau tembus pandang teksnya bakal saling tumpuk waktu digeser.
// Tabelnya 13-14 kolom DAN puluhan baris - dua-duanya perlu digulir. Wadahnya
// dibikin menggulir sendiri (bukan halamannya) dan dibatasi tingginya, karena
// itu satu-satunya cara `position: sticky` di header punya arti: sticky nempel
// ke leluhur yang menggulir, jadi kalau yang menggulir halamannya, header
// tabel gak punya apa pun buat dinempeli dan tetap kabur ke atas.
// Tingginya relatif viewport (bukan px tetap) supaya di layar pendek tabelnya
// gak menghabiskan halaman, dan di layar tinggi barisnya yang kelihatan makin
// banyak.
export const WADAH_TABEL: CSSProperties = {
  overflow: 'auto',
  maxHeight: 'calc(100vh - 230px)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
};

// Header baris atas. Latarnya WAJIB pekat: sel sticky melayang di atas baris
// yang lewat di bawahnya, kalau tembus pandang angkanya saling tumpuk.
export const TH_ATAS: CSSProperties = {
  textAlign: 'left',
  padding: '9px 11px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-faint)',
  position: 'sticky',
  top: 0,
  zIndex: 3,
  background: 'var(--surface-2)',
  // <thead> gak ikut kebawa waktu <th>-nya sticky, jadi garis bawah header
  // dipasang sebagai bayangan - `border` di sel sticky gak ikut melayang.
  boxShadow: 'inset 0 -1px 0 var(--border)',
};

export const SEL_NAMA: CSSProperties = {
  padding: '8px 11px',
  position: 'sticky',
  left: 0,
  zIndex: 1,
  background: 'var(--surface)',
  borderRight: '1px solid var(--border)',
};
// Pojok kiri-atas: beku DUA arah sekaligus (ikut TH_ATAS buat atas, ini buat
// kiri). z-index-nya paling tinggi - dia satu-satunya sel yang harus menang
// lawan header baris atas DAN kolom nama yang sama-sama melayang.
export const TH_NAMA: CSSProperties = {
  position: 'sticky',
  left: 0,
  top: 0,
  zIndex: 5,
  background: 'var(--surface-2)',
  borderRight: '1px solid var(--border)',
};

// NIP: kunci penggabung data, bukan bahan bacaan. Dulu kolom sendiri selebar
// ~140px di tiap baris padahal yang dicari mata itu nama. Sekarang nempel
// sebagai baris kecil di bawah nama - tetap kelihatan & tetap bisa disalin,
// tanpa memakan satu kolom penuh.
export function NamaPeserta({ nama, nip, peringatan }: { nama: string | null; nip: string | null; peringatan?: ReactNode }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{nama || <span style={{ color: 'var(--text-faint)' }}>—</span>}</span>
        {peringatan}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
        {nip || '—'}
      </div>
    </>
  );
}

// Rincian slide di bawah WPM buat satu kejadian reading_warning - dipakai di
// baris expand kolom Peringatan (Per Modul & Per Peserta sama-sama pakai ini).
export function PeringatanRincian({ detail }: { detail: PeringatanDetail[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '9px 13px 11px', fontSize: 12 }}>
      {detail.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          {d.modul && <span className="faint">{d.modul} ·</span>}
          <span style={{ fontWeight: 600 }}>Section {d.section ? d.section.toUpperCase() : '?'}</span>
          <span className="dim">
            slide {d.slides.length ? d.slides.join(', ') : '—'}
          </span>
          <span style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 100,
            color: d.choice === 'yakin' ? 'var(--danger)' : 'var(--success)',
            background: d.choice === 'yakin' ? 'var(--danger-soft, rgba(181,64,47,.08))' : 'transparent',
            border: `1px solid ${d.choice === 'yakin' ? 'var(--danger)' : 'var(--border)'}`,
          }}>
            {d.choice === 'yakin' ? 'diabaikan, tetap lanjut' : 'balik baca ulang'}
          </span>
        </div>
      ))}
    </div>
  );
}

// Rincian PER VIDEO (bukan rata-rata gabungan) - dipakai di baris expand
// kolom Video. Mini-bar biar tinggi/rendahnya kelihatan sekilas tanpa harus
// baca angka satu-satu, sama filosofinya kayak sparkline. Diurutkan dari
// backend (paling rendah duluan, paling perlu ditinjau).
export function VideoRincian({ detail }: { detail: VideoDetail[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '9px 13px 11px', fontSize: 12 }}>
      {detail.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          {d.modul && <span className="faint">{d.modul} ·</span>}
          <span className="dim" style={{ minWidth: 62, fontWeight: 600 }}>
            {d.slide != null ? `Slide ${d.slide}` : 'Slide ?'}
          </span>
          <div style={{ width: 110, height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
            <div style={{
              width: `${d.persen}%`, height: '100%',
              background: d.persen < 20 ? 'var(--danger)' : d.persen >= 80 ? 'var(--success)' : 'var(--text-faint)',
            }} />
          </div>
          <span className="num" style={{ minWidth: 34, textAlign: 'right' }}>{d.persen}%</span>
          {/* Dua penanda ini soal BAGAIMANA persen di atas dicapai, bukan
              seberapa jauh - satu video bisa kelihatan "100% ditonton" tapi
              sebagian dilompatin atau dipercepat di putaran pertamanya, dan
              itu gak kelihatan dari bar/persen doang. "dilewat" menang atas
              "dipercepat" kalau dua-duanya kejadian di video yang sama -
              dilompatin itu tandanya lebih serius (bukan ditonton sama
              sekali, bukan cuma ditonton buru-buru). */}
          {d.skip ? (
            <span title="Ada bagian yang belum pernah dilihat, langsung dilompatin - bukan ditonton"
                  style={{ color: 'var(--danger)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ⏭ dilewat
            </span>
          ) : (d.rate ?? 0) > 1.01 ? (
            <span title={`Ditonton sampai ${d.rate}× kecepatan normal pas pertama kali dilihat`}
                  style={{ color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
              ⚡ dipercepat
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
