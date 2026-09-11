import { useState } from 'react';
import type { ModuleData, QuizQuestion, QuizPolicy } from '../types';
import { DEFAULT_QUIZ_POLICY } from '../types';
import { modeKuisSection } from '../quizMode';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function QuizBuilder({ module, setModule }: Props) {
  const [activeSection, setActiveSection] = useState(module.sections[0]?.id || '');

  const questions = module.quizzes[activeSection] || [];

  function setQuestions(qs: QuizQuestion[]) {
    setModule({ ...module, quizzes: { ...module.quizzes, [activeSection]: qs } });
  }

  function addQuestion() {
    setQuestions([...questions, { q: '', opts: ['', '', '', ''], correct: 0, explain: '' }]);
  }
  function updateQuestion(i: number, patch: Partial<QuizQuestion>) {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    setQuestions(next);
  }
  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, x) => x !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    setQuestions(next);
  }
  function autoDistribute() {
    // Reposition the correct answer to a target slot (0,1,2,3 cycling) by
    // swapping option TEXT with whatever currently sits in that slot — the
    // answer content moves with it, only its letter position changes.
    setQuestions(questions.map((q, i) => {
      const target = i % 4;
      if (target === q.correct) return q;
      const opts = [...q.opts];
      [opts[q.correct], opts[target]] = [opts[target], opts[q.correct]];
      return { ...q, opts, correct: target };
    }));
  }

  // ---- Aturan kelulusan: bawaan modul + timpaan per section ----
  const dasar: QuizPolicy = { ...DEFAULT_QUIZ_POLICY, ...module.quizPolicy };
  const sec = module.sections.find(x => x.id === activeSection);
  const timpa = sec?.quizPolicy || {};
  // Yang BENAR-BENAR berlaku di section yang lagi dibuka - dipakai buat
  // kalimat ringkasannya, supaya penyusun gak perlu menghitung sendiri
  // gabungan "bawaan modul + timpaan" di kepalanya.
  const berlaku: QuizPolicy = { ...dasar, ...timpa };

  function setDasar(patch: Partial<QuizPolicy>) {
    setModule({ ...module, quizPolicy: { ...dasar, ...patch } });
  }
  // Timpaan yang dikosongkan DIHAPUS dari section-nya, bukan disimpan sebagai
  // nilai yang kebetulan sama dengan bawaan modul: kalau disimpan, mengubah
  // bawaan modul nanti gak akan menular ke section itu, padahal penyusunnya
  // sudah mengosongkannya justru supaya ikut.
  function setTimpa(patch: Partial<QuizPolicy>) {
    setModule({
      ...module,
      sections: module.sections.map(x => {
        if (x.id !== activeSection) return x;
        const gabung = { ...timpa, ...patch };
        for (const k of Object.keys(gabung) as (keyof QuizPolicy)[]) {
          if (gabung[k] === undefined) delete gabung[k];
        }
        return Object.keys(gabung).length ? { ...x, quizPolicy: gabung } : { ...x, quizPolicy: undefined };
      }),
    });
  }
  /* Mode yang berlaku di section yang lagi dibuka. Belum pernah dipilih =
     DISIMPULKAN dari angkanya, bukan dipatok - lihat modeKuisSection(). */
  const mode = sec ? modeKuisSection(module, sec) : 'gerbang';

  /* Mode disimpan EKSPLISIT begitu penyusun memilihnya, walau pilihannya sama
     dengan yang tadi disimpulkan: tanpa itu, mengubah nilai minimal modul
     nanti bisa diam-diam menggeser section ini dari gerbang jadi bernilai.
     Timpaan angka ikut dibersihkan waktu pindah ke gerbang - di mode itu
     angkanya tidak berlaku, dan meninggalkannya bikin nilai lama muncul lagi
     kalau modenya dikembalikan. */
  function setMode(m: 'gerbang' | 'nilai') {
    setModule({
      ...module,
      sections: module.sections.map(x => x.id !== activeSection ? x
        : { ...x, quizMode: m, quizPolicy: m === 'gerbang' ? undefined : x.quizPolicy }),
    });
  }

  // '' di kotak angka = "ikut bawaan modul", bukan nol.
  const angka = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Math.round(Number(v) || 0)));

  const sectionsWithoutQuiz = module.sections.filter(sec => !(module.quizzes[sec.id]?.length));
  const showMissingQuizWarning = !module.hideProgress && sectionsWithoutQuiz.length > 0;

  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Kuis per Section</h2>
      {showMissingQuizWarning && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 16,
          borderRadius: 'var(--radius)', border: '1px solid var(--danger)', background: 'var(--danger-soft)',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1.4 }}>⚠</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
            Progress belajar aktif (gak dicentang "Sembunyikan progress belajar" di tab Tema), tapi{' '}
            <b style={{ color: 'var(--text)' }}>{sectionsWithoutQuiz.map(s => s.short).join(', ')}</b>{' '}
            belum ada kuisnya. Section tanpa kuis otomatis dianggap "lulus", jadi persentase progress bisa
            kelihatan lebih tinggi dari yang sebenarnya udah dipelajari peserta.
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {module.sections.map(sec => {
          const active = activeSection === sec.id;
          return (
            <button key={sec.id} className={active ? 'btn-primary btn-sm' : 'btn-sm'} onClick={() => setActiveSection(sec.id)}>
              {sec.short}
            </button>
          );
        })}
      </div>
      {/* Aturan kelulusan. Ditaruh di ATAS daftar soal karena dia menentukan
          arti seluruh soal di bawahnya: "10 soal" berarti lain kalau lulusnya
          70 dibanding kalau harus benar semua. */}
      <div className="panel" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
          Aturan Kelulusan
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Nilai minimal lulus (%)<br />
            <input type="number" min={0} max={100} style={{ width: 110, marginTop: 4 }}
              value={dasar.passPercent}
              onChange={e => setDasar({ passPercent: Math.min(100, Math.max(0, Math.round(Number(e.target.value) || 0))) })} />
          </label>
          <label style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Jatah mengerjakan<br />
            <input type="number" min={0} style={{ width: 110, marginTop: 4 }}
              value={dasar.maxAttempts}
              onChange={e => setDasar({ maxAttempts: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
          </label>
          <p className="hint" style={{ margin: 0, flex: '1 1 240px', minWidth: 200 }}>
            Jatah dihitung termasuk percobaan pertama. <b>0 = tak terbatas.</b> Peserta yang sudah lulus
            tetap boleh memakai sisa jatahnya — yang dipakai selalu <b>nilai tertinggi</b>, jadi mencoba
            lagi tidak pernah merugikan.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0 10px' }} />
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>
          Khusus <b style={{ color: 'var(--text)' }}>{sec?.short || activeSection}</b> — mode kuisnya:
        </div>
        {/* Mode dipilih PER SECTION: pola yang lumrah adalah section awal
            sekadar gerbang checkpoint sementara section terakhir ujian
            bernilai sungguhan. */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <button className={mode === 'gerbang' ? 'btn-primary btn-sm' : 'btn-sm'}
                  onClick={() => setMode('gerbang')}
                  title="Kuis cuma palang untuk lanjut: wajib benar semua, boleh diulang tanpa batas, nilainya tidak dikirim ke rapor LMS">
            Gerbang
          </button>
          <button className={mode === 'nilai' ? 'btn-primary btn-sm' : 'btn-sm'}
                  onClick={() => setMode('nilai')}
                  title="Kuis dinilai sungguhan: nilai minimal & jatah mengerjakan berlaku, dan nilainya masuk rapor LMS">
            Kuis bernilai
          </button>
        </div>
        {mode === 'gerbang' ? (
          <p className="hint" style={{ margin: 0 }}>
            Peserta <b>wajib menjawab benar semua</b> untuk lanjut, dan <b>boleh mengulang tanpa batas</b>.
            Nilainya <b>tidak dikirim ke rapor LMS</b> — semua yang lolos pasti 100, jadi angka itu
            akan terbaca seperti prestasi padahal cuma tanda “sudah lewat”.
            {questions.length > 0 && <> Section ini: <b>{questions.length} dari {questions.length} soal</b> harus benar.</>}
            <br />
            Jatah sengaja tidak bisa dibatasi di mode ini: peserta yang kehabisan jatah akan
            terkunci permanen dan tidak bisa menyelesaikan modul sama sekali.
          </p>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>
              Kosongkan kalau ikut aturan modul di atas.
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                Nilai minimal (%)<br />
                <input type="number" min={0} max={100} placeholder={String(dasar.passPercent)} style={{ width: 110, marginTop: 4 }}
                  value={timpa.passPercent ?? ''}
                  onChange={e => setTimpa({ passPercent: angka(e.target.value) })} />
              </label>
              <label style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                Jatah mengerjakan<br />
                <input type="number" min={0} placeholder={String(dasar.maxAttempts)} style={{ width: 110, marginTop: 4 }}
                  value={timpa.maxAttempts ?? ''}
                  onChange={e => setTimpa({ maxAttempts: angka(e.target.value) })} />
              </label>
              <p className="hint" style={{ margin: 0, flex: '1 1 240px', minWidth: 200 }}>
                Berlaku di section ini: lulus mulai <b>{berlaku.passPercent}%</b>
                {questions.length > 0 && ` (${Math.ceil(questions.length * berlaku.passPercent / 100)} dari ${questions.length} soal)`}
                , {berlaku.maxAttempts === 0 ? 'boleh diulang tanpa batas' : `jatah ${berlaku.maxAttempts}× mengerjakan`}.
                Nilainya <b>masuk rapor LMS</b>.
              </p>
            </div>
          </>
        )}
      </div>
      <button className="btn-sm" onClick={autoDistribute}>Sebar jawaban benar merata A/B/C/D</button>
      <p className="hint" style={{ margin: '6px 0 16px' }}>
        Cuma mengacak posisi jawaban benar; isi opsi tetap.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q, i) => (
          <div className="panel" key={i} style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-faint)', marginRight: 'auto' }}>Soal {i + 1}</span>
              <button className="btn-icon btn-sm" title="Naik" onClick={() => move(i, -1)}>↑</button>
              <button className="btn-icon btn-sm" title="Turun" onClick={() => move(i, 1)}>↓</button>
              <button className="btn-danger btn-sm" onClick={() => removeQuestion(i)}>Hapus</button>
            </div>
            <textarea style={{ width: '100%', marginBottom: 8 }} placeholder="Pertanyaan"
              value={q.q} onChange={e => updateQuestion(i, { q: e.target.value })} />
            {q.opts.map((opt, oi) => {
              const isCorrect = q.correct === oi;
              return (
                <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="radio" checked={isCorrect} onChange={() => updateQuestion(i, { correct: oi })} title="Tandai sebagai jawaban benar" />
                  <span style={{ fontSize: 12, fontWeight: 700, width: 16, color: isCorrect ? 'var(--success)' : 'var(--text-faint)' }}>{String.fromCharCode(65 + oi)}</span>
                  <input style={{ flex: 1, borderColor: isCorrect ? 'var(--success)' : undefined }} placeholder={`Opsi ${String.fromCharCode(65 + oi)}`} value={opt}
                    onChange={e => {
                      const opts = [...q.opts]; opts[oi] = e.target.value; updateQuestion(i, { opts });
                    }} />
                </div>
              );
            })}
            <textarea style={{ width: '100%', marginTop: 2 }} placeholder="Penjelasan jawaban"
              value={q.explain} onChange={e => updateQuestion(i, { explain: e.target.value })} />
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={addQuestion}>+ Soal</button>
    </div>
  );
}
