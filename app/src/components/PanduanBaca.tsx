import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PanduanCC, PanduanKolom, PanduanKeputusan } from '../api';
import { panduanLoad, panduanVerify, panduanSave } from '../api';
import PanduanTabel from './PanduanTabel';

/* Panduan cara baca tabel Command Center.
   Tampilan bacanya = replika tabel berisi data karangan yang bisa diklik
   (PanduanTabel.tsx); isi di bawah ini yang dipakai sebagai penjelasannya.
   Sengaja di LACI TERPISAH, bukan di dalam tabel asli: tabelnya sudah 12-14 kolom, dan
   tooltip per sel cuma menjawab "ini angka apa" - bukan "kenapa dihitung
   begini" dan "kapan harus curiga". Dua pertanyaan terakhir itu yang bikin
   pembaca salah menyimpulkan (mis. Ditinggal dibaca sebagai "gak niat").
   Isinya WAJIB ikut berubah kalau cara hitung di activity_store.py atau
   shell-template.html berubah - kalau tidak, panduan ini jadi sumber salah
   baca yang paling meyakinkan. Isi di bawah ini cuma BAWAAN: begitu Ikram
   menyunting lewat tombol Edit, versi yang tersimpan di server yang dipakai. */

const KOLOM: PanduanKolom[] = [
  {
    nama: 'Peserta',
    arti: 'Nama dan NIP. Satu orang = satu NIP, bukan satu nama.',
    kenapa: 'Nama ketikan manual gampang berantakan ("Budi Santoso" / "budi santoso" / "Budi S."). NIP dinormalkan ke angka saja lalu dipakai sebagai kunci penggabung lintas modul.',
    curiga: 'Tanda ⚠ di samping nama = satu NIP muncul dengan beberapa nama. Biasanya NIP salah ketik atau dipakai berdua.',
  },
  {
    nama: 'Modul',
    arti: '(Tab Per Peserta) Berapa modul yang pernah dibuka peserta ini, dan judulnya.',
    kenapa: 'Dua judul pertama saja yang tampil; sisanya dibuka lewat "+n lagi" supaya satu peserta dengan 8 modul tidak membuat barisnya setinggi layar.',
  },
  {
    nama: 'Mulai',
    arti: '(Tab Per Modul) Kapan sesi ini dibuka. Tanpa detik - tabel ini dibaca setelah pelatihan selesai.',
  },
  {
    nama: 'Sesi',
    arti: '(Tab Per Peserta) Berapa kali peserta membuka modul, dijumlah dari semua modulnya. Tiap buka ulang = sesi baru.',
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
    curiga: '⚠ muncul kalau lebih dari 10 menit. Tanda "—" BUKAN nol: artinya tab ditutup paksa sehingga selisihnya tidak bisa dihitung. Tanda * (tab Per Peserta) = sebagian sesinya tidak ikut terhitung, jadi angkanya kemungkinan lebih kecil dari kenyataan.',
  },
  {
    nama: 'Slide',
    arti: 'Angka besar "31/40" = slide BERBEDA yang pernah dibuka dari total slide modul. Angka kecil di bawahnya = jumlah kunjungan, termasuk balik lagi ke slide yang sama.',
    kenapa: 'Angka kunjungan saja tidak bisa dibandingkan - penyusun jarang ingat modulnya berapa slide. Pecahan langsung menjawab "ada yang kelewat atau tidak".',
    curiga: 'Pecahan kurang dari penuh = ada slide yang tidak pernah dibuka. Kunjungan jauh di atas total = banyak bolak-balik (bingung, atau mencari jawaban kuis).',
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

const KEPUTUSAN: PanduanKeputusan[] = [
  {
    judul: 'Kenapa ada kotak "Perlu ditindaklanjuti"',
    isi: 'Tabelnya belasan kolom dengan bobot sama, jadi tidak ada yang menuntun mata. Seorang peserta masuk hitungan kalau punya MINIMAL SATU sinyal yang bisa ditindaklanjuti di kelas: mengabaikan peringatan baca-cepat, Ditinggal > 10 menit, gagal kuis, video rata-rata < 20%, atau ada video yang dilompati/dipercepat. Ambangnya sama persis dengan tanda ⚠ di baris, supaya ringkasan dan tabel tidak pernah bercerita beda.',
  },
  {
    judul: 'Per Modul vs Per Peserta',
    isi: 'Datanya sama, cara bacanya beda. Per Modul: satu baris = satu SESI (orang yang membuka modul dua kali muncul dua baris). Per Peserta: satu baris = satu ORANG, dijumlah lintas semua modul - karena satu pelatihan sering dipecah jadi beberapa SCORM.',
  },
  {
    judul: 'Arti "—" tergantung kolomnya',
    isi: 'Di Ditinggal, "—" berarti TIDAK BISA DIHITUNG (tab ditutup paksa, penutup sesi tidak sempat terkirim) - bukan nol, jangan dibaca "tidak pernah ditinggal". Di Video dan Articulate, "—" berarti modulnya memang tidak punya video/paket. Di Kuis, Knowledge Check, Catatan, dan Peringatan, "—" berarti nol/belum ada - sengaja dikosongkan supaya sel yang tidak bermasalah tidak ikut menarik mata.',
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

const BAWAAN: PanduanCC = { keputusan: KEPUTUSAN, kolom: KOLOM };
const salin = (p: PanduanCC): PanduanCC => JSON.parse(JSON.stringify(p));

const LABEL: CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)', marginTop: 8 };
const INPUT: CSSProperties = { width: '100%', fontSize: 13, marginTop: 4, fontFamily: 'inherit' };
const KARTU: CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px 10px', marginBottom: 10 };

function Isian({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label style={LABEL}>
      {label}
      {rows
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={INPUT} />}
    </label>
  );
}

function geser<T>(arr: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= arr.length) return arr;
  const b = [...arr]; [b[i], b[j]] = [b[j], b[i]]; return b;
}

function AksiButir({ onNaik, onTurun, onHapus }: { onNaik: () => void; onTurun: () => void; onHapus: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
      <button className="btn-ghost btn-sm" onClick={onNaik} title="Naikkan">↑</button>
      <button className="btn-ghost btn-sm" onClick={onTurun} title="Turunkan">↓</button>
      <button className="btn-ghost btn-sm" onClick={onHapus} style={{ color: 'var(--danger)' }}>Hapus</button>
    </div>
  );
}

export default function PanduanBaca() {
  const [buka, setBuka] = useState(false);
  const [isi, setIsi] = useState<PanduanCC>(BAWAAN);
  // 'baca' -> 'sandi' (minta password) -> 'sunting'. Password DICEK di
  // backend; di sini cuma disimpan sementara buat dikirim ulang saat Simpan.
  const [tahap, setTahap] = useState<'baca' | 'sandi' | 'sunting'>('baca');
  const [sandi, setSandi] = useState('');
  const [draf, setDraf] = useState<PanduanCC>(BAWAAN);
  const [pesan, setPesan] = useState('');
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (!buka) return;
    // Gagal memuat = tetap tampil isi bawaan; panduan tidak boleh hilang
    // cuma karena server lambat.
    panduanLoad().then(p => { if (p) setIsi(p); }).catch(() => {});
  }, [buka]);

  useEffect(() => {
    if (!buka || tahap === 'sunting') return;   // Esc tidak boleh membuang suntingan
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [buka, tahap]);

  function batal() { setTahap('baca'); setSandi(''); setPesan(''); }
  function tutup() { batal(); setBuka(false); }

  async function cekSandi() {
    setSibuk(true); setPesan('');
    try {
      await panduanVerify(sandi);
      setDraf(salin(isi));
      setTahap('sunting');
    } catch (e) { setPesan((e as Error).message); }
    setSibuk(false);
  }

  async function simpan() {
    setSibuk(true); setPesan('');
    const bersih: PanduanCC = {
      keputusan: draf.keputusan.filter(k => k.judul.trim() || k.isi.trim()),
      kolom: draf.kolom.filter(k => k.nama.trim() || k.arti.trim()),
    };
    try {
      await panduanSave(sandi, bersih);
      setIsi(bersih); setTahap('baca'); setSandi('');
    } catch (e) { setPesan((e as Error).message); }
    setSibuk(false);
  }

  const ubahKep = (i: number, f: keyof PanduanKeputusan, v: string) =>
    setDraf(d => ({ ...d, keputusan: d.keputusan.map((k, j) => j === i ? { ...k, [f]: v } : k) }));
  const ubahKol = (i: number, f: keyof PanduanKolom, v: string) =>
    setDraf(d => ({ ...d, kolom: d.kolom.map((k, j) => j === i ? { ...k, [f]: v } : k) }));

  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setBuka(true)} data-demo="cc-panduan"
              title="Arti tiap kolom, kenapa dihitung begitu, dan kapan harus curiga">
        📖 Cara baca tabel
      </button>
      {buka && (
        <div onClick={() => { if (tahap !== 'sunting') tutup(); }} style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.35)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <aside onClick={e => e.stopPropagation()} role="dialog" aria-label="Cara baca tabel" style={{
            width: tahap === 'sunting' ? 'min(560px, 100%)' : 'min(1180px, 100%)', height: '100%', overflowY: 'auto', background: 'var(--surface)',
            borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: '20px 22px 40px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>{tahap === 'sunting' ? 'Sunting panduan' : 'Cara baca tabel'}</h3>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {tahap === 'baca' && (
                  <button className="btn-ghost btn-sm" onClick={() => setTahap('sandi')} data-demo="cc-panduan-edit">✎ Edit</button>
                )}
                {tahap === 'sunting' ? <>
                  <button className="btn-ghost btn-sm" onClick={batal} disabled={sibuk}>Batal</button>
                  <button className="btn-primary btn-sm" onClick={simpan} disabled={sibuk}>{sibuk ? 'Menyimpan…' : 'Simpan'}</button>
                </> : (
                  <button className="btn-ghost btn-sm" onClick={tutup}>Tutup ✕</button>
                )}
              </span>
            </div>

            {tahap === 'sandi' && (
              <div style={{ ...KARTU, marginTop: 12 }}>
                <p className="hint" style={{ margin: '0 0 8px' }}>Masukkan password penyunting panduan.</p>
                <input type="password" autoFocus value={sandi} placeholder="Password"
                       onChange={e => setSandi(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter' && sandi) cekSandi(); }}
                       style={{ width: '100%', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-primary btn-sm" onClick={cekSandi} disabled={sibuk || !sandi}>{sibuk ? 'Memeriksa…' : 'Masuk'}</button>
                  <button className="btn-ghost btn-sm" onClick={batal}>Batal</button>
                </div>
              </div>
            )}
            {pesan && <p style={{ color: 'var(--danger)', fontSize: 12.5, margin: '8px 0' }}>{pesan}</p>}

            {tahap === 'sunting' ? (
              <>
                <h4 style={{ margin: '16px 0 8px' }}>Keputusan cara baca</h4>
                {draf.keputusan.map((k, i) => (
                  <div key={i} style={KARTU}>
                    <AksiButir
                      onNaik={() => setDraf(d => ({ ...d, keputusan: geser(d.keputusan, i, -1) }))}
                      onTurun={() => setDraf(d => ({ ...d, keputusan: geser(d.keputusan, i, 1) }))}
                      onHapus={() => setDraf(d => ({ ...d, keputusan: d.keputusan.filter((_, j) => j !== i) }))} />
                    <Isian label="Judul" value={k.judul} onChange={v => ubahKep(i, 'judul', v)} />
                    <Isian label="Isi" value={k.isi} onChange={v => ubahKep(i, 'isi', v)} rows={4} />
                  </div>
                ))}
                <button className="btn-sm" onClick={() => setDraf(d => ({ ...d, keputusan: [...d.keputusan, { judul: '', isi: '' }] }))}>
                  + Tambah keputusan
                </button>

                <h4 style={{ margin: '22px 0 8px' }}>Kolom demi kolom</h4>
                {draf.kolom.map((k, i) => (
                  <div key={i} style={KARTU}>
                    <AksiButir
                      onNaik={() => setDraf(d => ({ ...d, kolom: geser(d.kolom, i, -1) }))}
                      onTurun={() => setDraf(d => ({ ...d, kolom: geser(d.kolom, i, 1) }))}
                      onHapus={() => setDraf(d => ({ ...d, kolom: d.kolom.filter((_, j) => j !== i) }))} />
                    <Isian label="Nama kolom" value={k.nama} onChange={v => ubahKol(i, 'nama', v)} />
                    <Isian label="Arti" value={k.arti} onChange={v => ubahKol(i, 'arti', v)} rows={2} />
                    <Isian label="Kenapa begini (boleh kosong)" value={k.kenapa || ''} onChange={v => ubahKol(i, 'kenapa', v)} rows={3} />
                    <Isian label="Kapan curiga (boleh kosong)" value={k.curiga || ''} onChange={v => ubahKol(i, 'curiga', v)} rows={2} />
                  </div>
                ))}
                <button className="btn-sm" onClick={() => setDraf(d => ({ ...d, kolom: [...d.kolom, { nama: '', arti: '' }] }))}>
                  + Tambah kolom
                </button>

                <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn-ghost btn-sm" onClick={() => setDraf(salin(BAWAAN))}
                          title="Form diisi ulang dengan isi bawaan aplikasi. Belum tersimpan sampai Simpan ditekan.">
                    ↺ Kembalikan ke isi bawaan
                  </button>
                </div>
              </>
            ) : (
              <>
                <PanduanTabel isi={isi} bawaan={BAWAAN} />

                {/* Daftar lengkap tetap ada buat yang mau membaca urut atau
                    mencari kata (Ctrl+F) - tapi dilipat, karena pintu masuk
                    utamanya sekarang tabel di atas. */}
                <details style={{ marginTop: 22 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Semua penjelasan sebagai daftar</summary>
                <h4 style={{ margin: '18px 0 8px' }}>Keputusan cara baca</h4>
                {isi.keputusan.map((k, i) => (
                  <details key={i} style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>{k.judul}</summary>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: '6px 0 2px', whiteSpace: 'pre-line' }}>{k.isi}</p>
                  </details>
                ))}

                <h4 style={{ margin: '22px 0 8px' }}>Kolom demi kolom</h4>
                {isi.kolom.map((k, i) => (
                  <div key={i} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{k.nama}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: '3px 0 0', whiteSpace: 'pre-line' }}>{k.arti}</p>
                    {k.kenapa && (
                      <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: '5px 0 0', color: 'var(--text-faint)', whiteSpace: 'pre-line' }}>
                        <b>Kenapa begini:</b> {k.kenapa}
                      </p>
                    )}
                    {k.curiga && (
                      <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: '5px 0 0', color: 'var(--danger)', whiteSpace: 'pre-line' }}>
                        <b>Kapan curiga:</b> {k.curiga}
                      </p>
                    )}
                  </div>
                ))}
                </details>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
