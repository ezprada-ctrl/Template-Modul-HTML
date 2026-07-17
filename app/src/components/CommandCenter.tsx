import { useState } from 'react';
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

  function download(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
          </div>

          {busy && <p className="hint">Memuat…</p>}
          {!busy && learners.length === 0 && <p className="hint">Belum ada peserta terekam.</p>}

          {learners.length > 0 && (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Peserta', 'NIP', 'Modul', 'Sesi', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis', 'Modul yang dibuka'].map(h => (
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
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_slide_dilihat}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{l.jumlah_interaksi}</td>
                        <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                          {l.kuis_dijawab ? `${l.kuis_benar}/${l.kuis_dijawab}` : '—'}
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
          </div>

          {busy && <p className="hint">Memuat…</p>}

          {!busy && sessions.length === 0 && <p className="hint">Belum ada sesi terekam di modul ini.</p>}

          {sessions.length > 0 && (() => {
            // Kolom "Modul" cuma muncul kalau slug ini kecampuran beberapa
            // judul modul (project didaur ulang) - buat kasus normal, kolom
            // ini cuma nambah kebisingan.
            const bentrok = !!modules.find(m => m.module_slug === activeSlug)?.kemungkinan_bentrok;
            const kolom = bentrok
              ? ['Peserta', 'NIP', 'Modul', 'Sumber', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis']
              : ['Peserta', 'NIP', 'Sumber', 'Mulai', 'Tatap Layar', 'Ditinggal', 'Slide', 'Interaksi', 'Kuis'];
            return (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
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
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.jumlah_slide_dilihat}</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.jumlah_interaksi}</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>
                        {s.kuis_dijawab ? `${s.kuis_benar}/${s.kuis_dijawab}` : '—'}
                        {s.kuis_diulang > 0 && <span style={{ color: 'var(--text-faint)' }}> · ulang {s.kuis_diulang}×</span>}
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
