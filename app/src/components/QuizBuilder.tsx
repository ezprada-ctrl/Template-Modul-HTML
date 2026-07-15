import { useState } from 'react';
import type { ModuleData, QuizQuestion } from '../types';

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
            Progress belajar aktif (gak dicentang "Sembunyikan progress belajar" di tab Sampul), tapi{' '}
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
      <button className="btn-sm" onClick={autoDistribute}>Sebar jawaban benar merata A/B/C/D</button>
      <p className="hint" style={{ margin: '6px 0 16px' }}>
        Cuma pindahin POSISI jawaban benar (biar gak numpuk di huruf yang sama terus), isi/teks tiap opsi tetap sama persis — gak ngubah jawaban.
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
