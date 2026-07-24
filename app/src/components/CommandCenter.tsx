import { useRef, useState } from 'react';
import type { ActivityModule, ActivitySession, ActivityLearner } from '../api';
import { ccListModules, ccListSessions, ccListLearners, ccRawRows } from '../api';

/**
 * Command Center — baca & unduh rekaman aktivitas peserta.
 *
 * Password DITAHAN DI MEMORI SAJA (state React), sengaja TIDAK disimpan ke
 * localStorage: isinya data pribadi, dan builder app ini dipakai bergantian
 * di laptop tim. Tutup tab = harus login lagi.
 *
 * Password-nya sendiri divalidasi di backend tiap panggilan (lihat
 * _check_cc_password di server/api/index.py) — pengecekan di sini murni buat
 * pengalaman pakai, bukan pengaman. Kalau cuma ngandelin cek di browser,
 * siapa pun tinggal manggil endpoint-nya langsung.
 */
export default function CommandCenter() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [modules, setModules] = useState<ActivityModule[]>([]);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [learners, setLearners] = useState<ActivityLearner[]>([]);
  const [view, setView] = useState<'modul' | 'peserta'>('modul');
  const [activeSlug, setActiveSlug] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // true kalau backend motong hasil di MAX_ROWS — rekap cuma sebagian.
  const [terpotong, setTerpotong] = useState(false);
  // Nempel ke wrapper tabel yang lagi tampil, dipakai buat "Unduh tampilan
  // (HTML)" - beda dari CSV, ini nyimpen tabelnya UTUH persis kayak yang
  // kelihatan di layar (warna, badge ⚠, dst ikut), bukan angka mentah per
  // kolom terpisah.
  const sessionsTableRef = useRef<HTMLDivElement>(null);
  const learnersTableRef = useRef<HTMLDivElement>(null);

  async function unlock() {
    setBusy(true);
    setError('');
    try {
      const r = await ccListModules(password);
      setModules(r.items);
      setTerpotong(r.terpotong);
      setUnlocked(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openModule(slug: string) {
    setBusy(true);
    setError('');
    setActiveSlug(slug);
    try {
      const r = await ccListSessions(password, slug);
      setSessions(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openPeserta() {
    setView('peserta');
    setBusy(true);
    setError('');
    try {
      const r = await ccListLearners(password);
      setLearners(r.items);
      setTerpotong(r.terpotong);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function download(filename: string, text: string, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Design tokens dipakai ulang di sini (bukan cuma dilink) karena file
  // hasil unduhan ini BERDIRI SENDIRI - dibuka nanti tanpa app.css sama
  // sekali, jadi var(--border)/var(--danger)/dst di style inline tabel
  // (React nulis literal string "var(--danger)" ke atribut style) gak akan
  // ke-resolve tanpa definisinya ditanam ulang di sini. Nilai disalin dari
  // index.css (tema terang saja - file statis, gak ada toggle tema).
  const EXPORT_TOKENS_CSS = `
    :root{
      --bg:#ffffff; --bg-2:#f6f6f7; --surface:#ffffff; --surface-2:#f3f3f5; --surface-3:#e9e9ec;
      --border:#e4e4e7; --border-strong:#d1d1d6;
      --text:#18181b; --text-dim:#565660; --text-faint:#9a9aa4;
      --danger:#c0392c; --danger-soft:rgba(192,57,44,.09);
      --success:#2f8f57; --success-soft:rgba(47,143,87,.12);
      --radius-sm:7px; --radius:10px;
    }
    body{font-family:-apple-system,'Segoe UI',sans-serif;background:var(--bg-2);color:var(--text);padding:24px;margin:0;}
    h1{font-size:16px;margin:0 0 4px;}
    .exp-meta{font-size:12.5px;color:var(--text-dim);margin:0 0 18px;}
    table{border-collapse:collapse;font-size:12.5px;white-space:nowrap;}
  `;

  // Unduh tabel yang lagi TAMPIL di layar UTUH apa adanya (warna, badge ⚠,
  // dst ikut) - beda dari CSV yang sengaja isinya angka mentah per kolom.
  // Cuma nyalin markup (outerHTML) tabel yang udah dirender React, bukan
  // nge-render ulang - jadi PASTI persis sama kayak yang keliatan.
  function unduhTampilan(ref: React.RefObject<HTMLDivElement | null>, filename: string, judul: string) {
    if (!ref.current) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${judul}</title>
<style>${EXPORT_TOKENS_CSS}</style></head><body>
<h1>${judul}</h1>
<p class="exp-meta">Diunduh ${new Date().toLocaleString('id-ID')} — tampilan persis seperti di Command Center saat diunduh.</p>
${ref.current.outerHTML}
</body></html>`;
    download(filename, html, 'text/html;charset=utf-8;');
  }

  // Excel Indonesia sering buka CSV dengan pemisah titik-koma. Tapi yang
  // lebih penting: tiap sel dibungkus kutip & kutip di dalamnya digandakan,
  // supaya nama/teks yang mengandung koma atau kutip gak bikin kolomnya
  // geser diam-diam waktu dibuka.
  function toCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const lines = [cols.map(esc).join(',')];
    for (const r of rows) lines.push(cols.map(c => esc(r[c])).join(','));
    // BOM: tanpa ini Excel salah baca huruf beraksen/emoji jadi karakter aneh.
    return '﻿' + lines.join('\r\n');
  }

  async function unduhRingkasan() {
    if (!sessions.length) return;
    download(`aktivitas-${activeSlug}-ringkasan.csv`, toCsv(sessions as unknown as Record<string, unknown>[]));
  }

  // Kolom modul diratakan jadi satu kolom teks + satu kolom menit per modul,
  // biar hasilnya kebaca langsung di Excel tanpa perlu buka JSON.
  async function unduhPeserta() {
    if (!learners.length) return;
    const semuaSlug = Array.from(new Set(learners.flatMap(l => l.modul_slugs))).sort();
    const rows = learners.map(l => {
      const r: Record<string, unknown> = {
        nip: l.learner_id,
        nama: l.nama || '',
        nama_varian: l.nama_varian.join(' | '),
        nama_bervariasi: l.nama_bervariasi ? 'YA' : '',
        sumber_identitas: l.identity_sources.join(' | '),
        jumlah_modul: l.jumlah_modul,
        jumlah_sesi: l.jumlah_sesi,
        durasi_menit: l.durasi_menit,
        durasi_tatap_layar_menit: l.durasi_tatap_layar_menit,
        durasi_ditinggal_menit: l.durasi_ditinggal_menit,
        sesi_tanpa_end: l.sesi_tanpa_end,
        slide_dilihat: l.jumlah_slide_dilihat,
        interaksi: l.jumlah_interaksi,
        kuis_benar: l.kuis_benar,
        kuis_dijawab: l.kuis_dijawab,
        kuis_gagal: l.kuis_gagal,
        knowledge_check_benar: l.kc_benar,
        knowledge_check_dijawab: l.kc_dijawab,
        video_dimulai: l.video_dimulai,
        video_total: l.total_video_program ?? '',
        video_rata_persen_ditonton: l.video_rata_persen ?? '',
        pertama: l.pertama,
        terakhir: l.terakhir,
      };
      for (const slug of semuaSlug) {
        r[`menit_${slug}`] = l.modul[slug] ? Math.round(l.modul[slug].durasi_ms / 6000) / 10 : '';
      }
      return r;
    });
    download('aktivitas-per-peserta.csv', toCsv(rows));
  }

  async function unduhMentah() {
    setBusy(true);
    setError('');
    try {
      const rows = await ccRawRows(password, activeSlug);
      if (!rows.length) { setError('Belum ada data mentah untuk modul ini.'); return; }
      download(`aktivitas-${activeSlug}-mentah.csv`, toCsv(rows));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 380 }}>
        <h2 style={{ margin: '0 0 4px' }}>Command Center</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
          Berisi data pribadi peserta (nama, NIP, rekam jejak belajar). Masukkan password untuk membuka.
        </p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') unlock(); }}
          style={{ width: '100%', marginBottom: 8 }}
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, margin: '0 0 10px' }}>{error}</p>}
        <button className="btn-primary" onClick={unlock} disabled={busy || !password}>
          {busy ? 'Membuka…' : 'Buka'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Command Center</h2>
        <button className="btn-ghost btn-sm" onClick={() => { setUnlocked(false); setPassword(''); setSessions([]); setActiveSlug(''); }}>
          Kunci lagi
        </button>
      </div>
      <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
        Rekaman aktivitas dari modul yang “Rekam aktivitas peserta”-nya dicentang.
      </p>

      {error && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</p>}

      {/* Data kena batas MAX_ROWS: rekap yang ditampilkan cuma sebagian.
          Ditandai keras biar gak dibaca sebagai angka lengkap. */}
      {terpotong && (
        <p style={{ color: 'var(--danger)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', margin: '0 0 14px' }}>
          ⚠ Data terlalu banyak dan kepotong di batas aman server — rekap di bawah <b>cuma sebagian</b>,
          bukan keseluruhan. Data lama numpuk lintas pelatihan; pertimbangkan arsipkan/hapus data pelatihan
          yang sudah selesai di Supabase.
        </p>
      )}

      {modules.length === 0 && !busy && (
        <p className="hint">Belum ada data aktivitas sama sekali.</p>
      )}

      {/* Dua cara baca data yang sama: per modul (satu modul, semua peserta)
          atau per peserta (satu orang, semua modul yang dia buka). Yang kedua
          perlu karena satu pelatihan sering dipecah jadi beberapa SCORM. */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={view === 'modul' ? 'btn-primary btn-sm' : 'btn-sm'}
          onClick={() => setView('modul')}
        >
          Per Modul
        </button>
        <button
          className={view === 'peserta' ? 'btn-primary btn-sm' : 'btn-sm'}
          onClick={openPeserta}
        >
          Per Peserta
        </button>
      </div>

      {view === 'modul' && (
      <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {modules.map(m => (
          <button
            key={m.module_slug}
            className={activeSlug === m.module_slug ? 'btn-primary btn-sm' : 'btn-sm'}
            onClick={() => openModule(m.module_slug)}
            title={m.kemungkinan_bentrok
              ? `⚠ ${m.judul_modul.length} modul berbeda berbagi slug ini: ${m.judul_modul.join(' / ')}`
              : `${m.rows} baris · ${m.sessions} sesi · ${m.learners} peserta`}
          >
            {m.module_slug} <span style={{ opacity: 0.7 }}>({m.sessions})</span>
            {m.kemungkinan_bentrok && <span style={{ marginLeft: 5, color: 'var(--danger)' }}>⚠</span>}
          </button>
        ))}
      </div>
      {/* Peringatan bentrok slug: satu slug isinya beberapa judul modul =
          project didaur ulang, data dua modul nyampur. Masih bisa dipisah
          lewat kolom "Modul" di tabel per sesi (tiap sesi bawa judulnya). */}
      {modules.some(m => m.kemungkinan_bentrok) && (
        <p className="hint" style={{ marginTop: -8, marginBottom: 16, color: 'var(--danger)' }}>
          ⚠ Ada slug yang dipakai beberapa modul berbeda (project didaur ulang). Datanya nyampur di bawah satu slug —
          pisahkan lewat kolom “Modul” di tabel sesi. Ke depan: bikin tiap modul lewat “+ Mulai Project Baru”.
        </p>
      )}
      </>
      )}

      {view === 'peserta' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn-sm" onClick={unduhPeserta} disabled={!learners.length}>
              ⬇ CSV rekap per peserta
            </button>
            <button className="btn-sm" onClick={() => unduhTampilan(learnersTableRef, 'aktivitas-per-peserta-tampilan.html', 'Command Center — Per Peserta')} disabled={!learners.length}>
              ⬇ Unduh tampilan (HTML)
            </button>
          </div>

          {busy && <p className="hint">Memuat…</p>}
          {!busy && learners.length === 0 && <p className="hint">Belum ada peserta terekam.</p>}

          {learners.length > 0 && (
            <>
              <div ref={learnersTableRef} style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Peserta', 'NIP', 'Modul', 'Sesi', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Peringatan', 'Modul yang dibuka'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '9px 11px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {learners.map(l => (
                      <tr key={l.learner_id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 11px' }}>
                          {l.nama || <span style={{ color: 'var(--text-faint)' }}>—</span>}
                          {/* Satu NIP dengan beberapa varian nama = tanda NIP
                              salah ketik / dipakai berdua. Ditandai, bukan
                              didiamkan — kalau disembunyiin, analisisnya keliru
                              tanpa ada yang sadar. */}
                          {l.nama_bervariasi && (
                            <span title={`Nama bervariasi untuk NIP ini: ${l.nama_varian.join(' / ')}`}
                                  style={{ marginLeft: 6, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.learner_id}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_modul}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_sesi}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.durasi_tatap_layar_menit} m</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                          {l.durasi_ditinggal_menit === null ? (
                            <span style={{ color: 'var(--text-faint)' }} title="Gak ada sesi yang session_end-nya kekirim — selisihnya gak bisa dihitung">—</span>
                          ) : (
                            <>
                              {l.durasi_ditinggal_menit} m
                              {l.durasi_ditinggal_menit > 10 && (
                                <span title="Total waktu tab dibiarkan kebuka tanpa ditatap, dijumlah lintas semua modul peserta ini"
                                      style={{ marginLeft: 5, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                              )}
                              {l.sesi_tanpa_end > 0 && (
                                <span title={`${l.sesi_tanpa_end} dari ${l.jumlah_sesi} sesi gak kehitung di sini (tab ditutup paksa) — angka ini kemungkinan kurang dari yang sebenarnya`}
                                      style={{ marginLeft: 4, color: 'var(--text-faint)', cursor: 'help' }}>*</span>
                              )}
                            </>
                          )}
                        </td>
                        {/* Angka utama = jumlah KUNJUNGAN (termasuk yang diulang balik ke
                            slide yang sama). Angka kecil di sebelahnya = berapa slide UNIK
                            yang pernah dibuka dari total slide di semua modulnya - penyusun
                            modul sering lupa modulnya ada berapa slide, jadi dikasih
                            pembanding langsung daripada angka telanjang yang gak ada artinya
                            tanpa tau totalnya. null = modul lama, belum ada data totalnya. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                          {l.jumlah_slide_dilihat}
                          {l.total_slide_program != null && (
                            <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}
                                  title="kunjungan (slide unik dibuka / total slide di semua modulnya)">
                              ({l.jumlah_slide_unik}/{l.total_slide_program})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_interaksi}</td>
                        {/* Berapa kali submit kuis GAGAL, dijumlah lintas semua modul peserta
                            ini. Bukan skor terakhir/skor gabungan (itu ambigu, gak jelas
                            gagal-lalu-lulus atau masih gagal) - dianalisis SETELAH pelatihan
                            selesai, jadi status lulus/belum sengaja gak ditampilkan. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Jumlah submit kuis yang gagal, dijumlah dari semua modul yang peserta ini kerjakan">
                          {l.kuis_gagal > 0 ? `${l.kuis_gagal}×` : '—'}
                        </td>
                        {/* Knowledge Check = blok cek-paham inline yang TIDAK mengunci apa
                            pun. Benar/dijawab, dijumlah lintas semua modul. Sengaja TERPISAH
                            dari kolom Kuis biar angka gagal-kuis tetap bersih. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Knowledge check (cek paham, tidak mengunci): jawaban benar / total dijawab, dari semua modulnya">
                          {l.kc_dijawab > 0 ? `${l.kc_benar}/${l.kc_dijawab}` : '—'}
                        </td>
                        {/* Video (upload + YouTube - Instagram gak mungkin diamati, lihat
                            catatan generator.py): berapa video yang DIMULAI dari total video
                            di semua modulnya, + rata-rata seberapa jauh video yang dimulai itu
                            ditonton ("titik terjauh dicapai / durasi", bukan cuma "dibuka").
                            — kalau modulnya emang gak punya video (atau di-export sebelum
                            fitur ini ada). ⚠ = rata-rata ditonton di bawah 20% - nanda video
                            yang dibuka tapi langsung ditinggal. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Video (upload + YouTube) yang dimulai / total video di semua modulnya, dan rata-rata seberapa jauh ditonton">
                          {!l.total_video_program ? (
                            <span style={{ color: 'var(--text-faint)' }}>—</span>
                          ) : (
                            <>
                              {l.video_dimulai}/{l.total_video_program}
                              {l.video_dimulai > 0 && <> · {l.video_rata_persen}%</>}
                              {l.video_dimulai > 0 && (l.video_rata_persen ?? 0) < 20 && (
                                <span title="Rata-rata ditonton di bawah 20% - kemungkinan video dibuka lalu langsung ditinggal"
                                      style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                              )}
                            </>
                          )}
                        </td>
                        {/* Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat
                            sebelum kuis, dijumlah lintas semua modul. ⚠ = ada yang tetap
                            "Yakin, lanjut ke kuis" walau udah diperingatkan. */}
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                            title="Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat sebelum kuis (dari semua modulnya)">
                          {l.peringatan_baca_cepat > 0 ? `${l.peringatan_baca_cepat}×` : '—'}
                          {l.peringatan_diabaikan > 0 && (
                            <span title={`${l.peringatan_diabaikan}× tetap pilih lanjut ke kuis meski diperingatkan`}
                                  style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 11px', color: 'var(--text-faint)' }}>{l.modul_slugs.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {learners.some(l => l.nama_bervariasi) && (
                <p className="hint" style={{ marginTop: 10 }}>
                  ⚠ (Peserta) = satu NIP tercatat dengan beberapa nama berbeda. Biasanya cuma beda cara ngetik,
                  tapi bisa juga tanda NIP salah ketik atau dipakai dua orang — cek dulu sebelum dipakai analisis.
                </p>
              )}
              {learners.some(l => l.sesi_tanpa_end > 0) && (
                <p className="hint" style={{ marginTop: 4 }}>
                  * (Ditinggal) = sebagian sesi peserta ini gak ikut kehitung (tab ditutup paksa, session_end gak sempat kekirim) — angkanya kemungkinan kurang dari yang sebenarnya.
                </p>
              )}
            </>
          )}
        </>
      )}

      {view === 'modul' && activeSlug && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn-sm" onClick={unduhRingkasan} disabled={!sessions.length}>
              ⬇ CSV ringkasan per sesi
            </button>
            <button className="btn-sm" onClick={unduhMentah} disabled={busy}>
              ⬇ CSV mentah (semua event)
            </button>
            <button className="btn-sm" onClick={() => unduhTampilan(sessionsTableRef, `aktivitas-${activeSlug}-tampilan.html`, `Command Center — ${activeSlug}`)} disabled={!sessions.length}>
              ⬇ Unduh tampilan (HTML)
            </button>
          </div>

          {busy && <p className="hint">Memuat…</p>}

          {!busy && sessions.length === 0 && <p className="hint">Belum ada sesi terekam di modul ini.</p>}

          {sessions.length > 0 && (() => {
            // Kolom "Modul" cuma muncul kalau slug ini kecampuran beberapa
            // judul modul (project didaur ulang) - buat kasus normal, kolom
            // ini cuma nambah kebisingan.
            const bentrok = !!modules.find(m => m.module_slug === activeSlug)?.kemungkinan_bentrok;
            const kolom = bentrok
              ? ['Peserta', 'NIP', 'Modul', 'Sumber', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Peringatan']
              : ['Peserta', 'NIP', 'Sumber', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Knowledge Check', 'Video', 'Peringatan'];
            return (
            <div ref={sessionsTableRef} style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {kolom.map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 11px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.session_id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 11px' }}>{s.learner_name || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.learner_id || '—'}</td>
                      {bentrok && <td style={{ padding: '8px 11px' }}>{s.module_title || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>}
                      <td style={{ padding: '8px 11px' }}>
                        {/* Penting buat analisis: 'scorm' artinya ID-nya dari LMS
                            dan BELUM TENTU NIP; 'manual' artinya NIP diketik peserta. */}
                        <span style={{ fontSize: 11, color: s.identity_source === 'scorm' ? 'var(--success)' : 'var(--text-faint)' }}>
                          {s.identity_source || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 11px' }}>{new Date(s.mulai).toLocaleString('id-ID')}</td>
                      {/* Tatap layar (durasi_tatap_layar_menit) dipakai sebagai
                          durasi utama, BUKAN durasi_menit total: peserta yang
                          tab-nya dibiarkan kebuka sambil ditinggal lama akan
                          keliatan durasi total-nya besar padahal gak natap
                          sama sekali - itu bikin dia keliatan paling rajin
                          padahal sebaliknya. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.durasi_tatap_layar_menit} m</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                        {s.durasi_ditinggal_menit === null ? (
                          <span style={{ color: 'var(--text-faint)' }} title="session_end gak pernah kekirim (tab ditutup paksa) — selisihnya gak bisa dihitung, BUKAN berarti gak pernah ditinggal">—</span>
                        ) : (
                          <>
                            {s.durasi_ditinggal_menit} m
                            {s.durasi_ditinggal_menit > 10 && (
                              <span title="Tab ini dibiarkan kebuka lama tanpa ditatap — kemungkinan peserta pergi sambil modulnya nyala"
                                    style={{ marginLeft: 5, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                            )}
                          </>
                        )}
                      </td>
                      {/* Angka utama = jumlah KUNJUNGAN (termasuk yang diulang balik ke
                          slide yang sama - itu SENGAJA, tanda bolak-balik/kebingungan).
                          Angka kecil = slide UNIK yang dibuka dari total slide modul ini -
                          penyusun modul sering lupa modulnya ada berapa slide, jadi
                          dikasih pembanding langsung. null = modul lama, export sebelum
                          fitur ini ada. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                        {s.jumlah_slide_dilihat}
                        {s.total_slide != null && (
                          <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}
                                title="kunjungan (slide unik dibuka / total slide modul ini)">
                            ({s.jumlah_slide_unik}/{s.total_slide})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.jumlah_interaksi}</td>
                      {/* Berapa kali submit kuis GAGAL (lulus:false) di modul ini - BUKAN
                          skor gabungan semua percobaan (mis. "7/10" dari 2 percobaan beda
                          gak jelas artinya apa) dan BUKAN dari klik tombol Ulangi (yang
                          kelewat peserta yang gagal lalu nyerah tanpa pernah klik ulangi).
                          Status lulus/belum sengaja gak ditampilkan - datanya dibaca
                          SETELAH pelatihan selesai, bukan saat masih berjalan. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Jumlah submit kuis yang gagal di modul ini">
                        {s.kuis_gagal > 0 ? `${s.kuis_gagal}×` : '—'}
                      </td>
                      {/* Knowledge check (blok cek-paham inline, TIDAK mengunci): jawaban
                          benar / total dijawab di modul ini. Terpisah dari kolom Kuis. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Knowledge check (cek paham, tidak mengunci): jawaban benar / total dijawab di modul ini">
                        {s.kc_dijawab > 0 ? `${s.kc_benar}/${s.kc_dijawab}` : '—'}
                      </td>
                      {/* Video (upload + YouTube - Instagram gak mungkin diamati): berapa
                          video yang DIMULAI dari total video di modul ini, + rata-rata
                          seberapa jauh yang dimulai itu ditonton (titik terjauh dicapai /
                          durasi). — kalau modul ini emang gak punya video. ⚠ = rata-rata
                          di bawah 20%, tanda video dibuka lalu langsung ditinggal. */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Video (upload + YouTube) yang dimulai / total video di modul ini, dan rata-rata seberapa jauh ditonton">
                        {!s.total_video ? (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        ) : (
                          <>
                            {s.video_dimulai}/{s.total_video}
                            {s.video_dimulai > 0 && <> · {s.video_rata_persen}%</>}
                            {s.video_dimulai > 0 && (s.video_rata_persen ?? 0) < 20 && (
                              <span title="Rata-rata ditonton di bawah 20% - kemungkinan video dibuka lalu langsung ditinggal"
                                    style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                            )}
                          </>
                        )}
                      </td>
                      {/* Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat
                          (< 50% waktu baca minimum Brysbaert) sebelum percobaan kuis
                          pertama bagian itu. ⚠ = tetap pilih "Yakin, lanjut ke kuis"
                          meski udah diperingatkan (bukan "Kembali, pelajari lagi"). */}
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}
                          title="Berapa kali peserta ketangkap ngeklik-lewat slide terlalu cepat sebelum kuis, di modul ini">
                        {s.peringatan_baca_cepat > 0 ? `${s.peringatan_baca_cepat}×` : '—'}
                        {s.peringatan_diabaikan > 0 && (
                          <span title={`${s.peringatan_diabaikan}× tetap pilih lanjut ke kuis meski diperingatkan`}
                                style={{ marginLeft: 4, color: 'var(--danger)', cursor: 'help' }}>⚠</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
