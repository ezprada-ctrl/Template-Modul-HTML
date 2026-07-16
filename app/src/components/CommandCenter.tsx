import { useState } from 'react';
import type { ActivityModule, ActivitySession } from '../api';
import { ccListModules, ccListSessions, ccRawRows } from '../api';

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
  const [activeSlug, setActiveSlug] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    setError('');
    try {
      setModules(await ccListModules(password));
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
      setSessions(await ccListSessions(password, slug));
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

      {modules.length === 0 && !busy && (
        <p className="hint">Belum ada data aktivitas sama sekali.</p>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {modules.map(m => (
          <button
            key={m.module_slug}
            className={activeSlug === m.module_slug ? 'btn-primary btn-sm' : 'btn-sm'}
            onClick={() => openModule(m.module_slug)}
            title={`${m.rows} baris · ${m.sessions} sesi · ${m.learners} peserta`}
          >
            {m.module_slug} <span style={{ opacity: 0.7 }}>({m.sessions})</span>
          </button>
        ))}
      </div>

      {activeSlug && (
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

          {sessions.length > 0 && (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Peserta', 'NIP', 'Sumber', 'Mulai', 'Durasi', 'Slide', 'Interaksi', 'Kuis'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 11px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-faint)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.session_id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 11px' }}>{s.learner_name || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.learner_id || '—'}</td>
                      <td style={{ padding: '8px 11px' }}>
                        {/* Penting buat analisis: 'scorm' artinya ID-nya dari LMS
                            dan BELUM TENTU NIP; 'manual' artinya NIP diketik peserta. */}
                        <span style={{ fontSize: 11, color: s.identity_source === 'scorm' ? 'var(--success)' : 'var(--text-faint)' }}>
                          {s.identity_source || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 11px' }}>{new Date(s.mulai).toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px 11px', fontVariantNumeric: 'tabular-nums' }}>{s.durasi_menit} m</td>
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
          )}
        </>
      )}
    </div>
  );
}
