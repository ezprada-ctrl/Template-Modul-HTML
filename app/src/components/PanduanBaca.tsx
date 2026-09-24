import { useEffect, useState } from 'react';

/* Panduan cara baca tabel Command Center.
   Sengaja di HALAMAN, bukan di dalam tabel: tabelnya sudah 12-14 kolom, dan
   tooltip per sel cuma menjawab "ini angka apa" - bukan "kenapa dihitung
   begini" dan "kapan harus curiga". Dua pertanyaan terakhir itu yang bikin
   pembaca salah menyimpulkan (mis. Ditinggal dibaca sebagai "gak niat").
   Isinya WAJIB ikut berubah kalau cara hitung di activity_store.py atau
   shell-template.html berubah - kalau tidak, panduan ini jadi sumber salah
   baca yang paling meyakinkan. */

type Kolom = { nama: string; arti: string; kenapa?: string; curiga?: string };

const KOLOM: Kolom[] = [
  {
    nama: 'Peserta',
    arti: 'Nama dan NIP. Satu orang = satu NIP, bukan satu nama.',
    kenapa: 'Nama ketikan manual gampang berantakan ("Budi Santoso" / "budi santoso" / "Budi S."). NIP dinormalkan ke angka saja lalu dipakai sebagai kunci penggabung lintas modul.',
    curiga: 'Tanda ⚠ di samping nama = satu NIP muncul dengan beberapa nama. Biasanya NIP salah ketik atau dipakai berdua.',
  },
  {
    nama: 'Tatap Layar',
    arti: 'Menit modul benar-benar ada di depan mata peserta. Ini durasi utama yang dibaca.',
    kenapa: 'Durasi total menyesatkan: tab yang dibiarkan terbuka saat makan siang membuat peserta terlihat paling rajin. Waktu berhenti dihitung saat tab disembunyikan/diminimize, dan saat tidak ada gerakan (mouse, ketik, gulir, sentuh) melewati ambang diam.',
  },
  {
    nama: 'Ditinggal',
    arti: 'Selisih durasi total dikurangi Tatap Layar: berapa lama modul terbuka tanpa ditatap.',
    kenapa: 'Ambang diam per slide = waktu baca minimum slide itu + 4 menit. Angka 4 menit dari riset ambang idle (toleransi sebelum orang dicurigai meninggalkan perangkat); waktu baca ditambahkan supaya pembaca yang diam khusyuk di slide panjang tidak ikut dianggap pergi.',
    curiga: '⚠ muncul kalau lebih dari 10 menit. Tanda "—" BUKAN nol: artinya tab ditutup paksa sehingga selisihnya tidak bisa dihitung.',
  },
  {
    nama: 'Slide',
    arti: 'Format "52 (50/50)": 52 kunjungan, 50 slide berbeda dari total 50 slide modul.',
    kenapa: 'Angka kunjungan saja tidak bisa dibandingkan - penyusun jarang ingat modulnya berapa slide. Pecahan di dalam kurung langsung menjawab "ada yang kelewat atau tidak".',
    curiga: 'Angka di dalam kurung kurang dari totalnya = ada slide yang tidak pernah dibuka. Kunjungan jauh di atas total = banyak bolak-balik.',
  },
  {
    nama: 'Interaksi',
    arti: 'Berapa kali peserta membuka isi tersembunyi: accordion, tab, tahap diagram alur, tombol modal.',
    kenapa: 'Accordion dihitung saat DIBUKA saja, bukan tiap buka-tutup - yang mau diukur "seberapa banyak yang digali", bukan "berapa kali mengeklik". Tombol Selanjutnya/Sebelumnya tidak dihitung.',
    curiga: 'Modul tanpa blok interaktif memang wajar 0.',
  },
  {
    nama: 'Kuis',
    arti: 'Berapa kali peserta GAGAL submit kuis. Bukan skor.',
    kenapa: 'Skor gabungan lintas percobaan menghasilkan angka yang tidak pernah terjadi (gagal 2/5 lalu lulus 5/5 terbaca "7/10"). Dihitung dari submit yang gagal, bukan dari klik tombol Ulangi, supaya peserta yang gagal lalu menyerah tetap tercatat.',
  },
  {
    nama: 'Nilai per Modul',
    arti: '(Tab Per Peserta) Nilai kuis terakhir tiap modul beserta status lulus. Arahkan kursor untuk rincian per section.',
    kenapa: 'Modul yang semua kuisnya mode gerbang ditandai ✓, bukan 100 - yang lolos gerbang pasti 100, jadi angkanya akan terbaca sebagai nilai ujian padahal cuma tanda "sudah lewat".',
  },
  {
    nama: 'Knowledge Check',
    arti: 'Jawaban benar / total dijawab pada cek paham di tengah materi.',
    kenapa: 'Dipisah dari kolom Kuis karena tidak mengunci apa pun - gunanya mengukur pemahaman, bukan kelulusan.',
  },
  {
    nama: 'Video',
    arti: 'Video yang diklik play / total video, plus rata-rata seberapa jauh ditonton. Klik untuk rincian per video.',
    curiga: '⚠ kalau rata-rata di bawah 20% (dibuka lalu ditinggal). Rincian juga menandai bagian yang dilompati atau ditonton dipercepat.',
  },
  {
    nama: 'Articulate',
    arti: 'Paket Articulate 360 yang dilaporkan SELESAI oleh paketnya sendiri / total paket.',
    kenapa: 'Status selesai diambil dari laporan paket itu, bukan ditebak dari lamanya dibuka.',
  },
  {
    nama: 'Catatan',
    arti: 'Jumlah catatan Co-creation yang masih tersimpan. Yang sudah dihapus peserta tidak dihitung.',
  },
  {
    nama: 'Peringatan',
    arti: 'Berapa kali peserta ketahuan mengeklik-lewat slide terlalu cepat sebelum masuk kuis, dan berapa yang tetap dipilih "lanjut".',
    kenapa: 'Terlalu cepat = kurang dari 50% waktu baca minimum slide, dengan kecepatan baca 238 kata/menit (Brysbaert, 2019) - bukan 300 yang sering dikutip. Peringatan cuma muncul sekali per section.',
    curiga: 'Peringatan yang diabaikan = sinyal paling kuat bahwa materi tidak dibaca.',
  },
];

const KEPUTUSAN: { judul: string; isi: string }[] = [
  {
    judul: 'Kenapa ada kotak "Perlu ditindaklanjuti"',
    isi: 'Tabelnya belasan kolom dengan bobot sama, jadi tidak ada yang menuntun mata. Seorang peserta masuk hitungan kalau punya MINIMAL SATU sinyal yang bisa ditindaklanjuti di kelas: mengabaikan peringatan baca-cepat, Ditinggal > 10 menit, gagal kuis, video rata-rata < 20%, atau ada video yang dilompati/dipercepat. Ambangnya sama persis dengan tanda ⚠ di baris, supaya ringkasan dan tabel tidak pernah bercerita beda.',
  },
  {
    judul: 'Per Modul vs Per Peserta',
    isi: 'Datanya sama, cara bacanya beda. Per Modul: satu baris = satu SESI (orang yang membuka modul dua kali muncul dua baris). Per Peserta: satu baris = satu ORANG, dijumlah lintas semua modul - karena satu pelatihan sering dipecah jadi beberapa SCORM.',
  },
  {
    judul: 'Kenapa "—" tidak sama dengan 0',
    isi: 'Di seluruh tabel, "—" berarti "tidak bisa dihitung" (tab ditutup paksa, modul di-export sebelum fitur itu ada, dsb). 0 berarti "dihitung, hasilnya nol". Keduanya sengaja dibedakan supaya yang tidak ketahuan tidak terbaca sebagai "tidak pernah".',
  },
  {
    judul: 'Batas cara ukur yang perlu diingat',
    isi: 'Tatap Layar mendeteksi tab tersembunyi dan ketiadaan gerakan, BUKAN kehadiran fisik. Peserta yang menatap layar sambil melamun tetap terhitung menatap. Angka ini bukti perilaku di layar, bukan bukti pemahaman - itu tugas kolom Kuis dan Knowledge Check.',
  },
  {
    judul: 'Sesi uji',
    isi: 'Sesi yang ditandai "uji" (percobaan penyusun) dan cek rekam dari Dev Mode dikeluarkan dari semua rekap, supaya tidak menjadi peserta palsu berdurasi nol.',
  },
];

export default function PanduanBaca() {
  const [buka, setBuka] = useState(false);
  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [buka]);

  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setBuka(true)} data-demo="cc-panduan"
              title="Arti tiap kolom, kenapa dihitung begitu, dan kapan harus curiga">
        📖 Cara baca tabel
      </button>
      {buka && (
        <div onClick={() => setBuka(false)} style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.35)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <aside onClick={e => e.stopPropagation()} role="dialog" aria-label="Cara baca tabel" style={{
            width: 'min(560px, 100%)', height: '100%', overflowY: 'auto', background: 'var(--surface)',
            borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: '20px 22px 40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Cara baca tabel</h3>
              <button className="btn-ghost btn-sm" onClick={() => setBuka(false)} style={{ marginLeft: 'auto' }}>Tutup ✕</button>
            </div>
            <p className="hint" style={{ marginTop: 0 }}>
              Arti tiap kolom, kenapa dihitung dengan cara itu, dan kapan angkanya perlu dicurigai.
            </p>

            <h4 style={{ margin: '18px 0 8px' }}>Keputusan cara baca</h4>
            {KEPUTUSAN.map(k => (
              <details key={k.judul} style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>{k.judul}</summary>
                <p style={{ fontSize: 13, lineHeight: 1.55, margin: '6px 0 2px', color: 'var(--text-muted, var(--text))' }}>{k.isi}</p>
              </details>
            ))}

            <h4 style={{ margin: '22px 0 8px' }}>Kolom demi kolom</h4>
            {KOLOM.map(k => (
              <div key={k.nama} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{k.nama}</div>
                <p style={{ fontSize: 13, lineHeight: 1.55, margin: '3px 0 0' }}>{k.arti}</p>
                {k.kenapa && (
                  <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: '5px 0 0', color: 'var(--text-faint)' }}>
                    <b>Kenapa begini:</b> {k.kenapa}
                  </p>
                )}
                {k.curiga && (
                  <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: '5px 0 0', color: 'var(--danger)' }}>
                    <b>Kapan curiga:</b> {k.curiga}
                  </p>
                )}
              </div>
            ))}
          </aside>
        </div>
      )}
    </>
  );
}
