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
    setQuestions(questions.map((q, i) => ({ ...q, correct: i % 4 })));
  }

  return (
    <div>
      <h2>Kuis per Section</h2>
      <div style={{ marginBottom: 12 }}>
        {module.sections.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            style={{ fontWeight: activeSection === sec.id ? 700 : 400, marginRight: 8 }}>
            {sec.short}
          </button>
        ))}
      </div>
      <button onClick={autoDistribute} style={{ marginBottom: 10 }}>Sebar jawaban benar merata A/B/C/D</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q, i) => (
          <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#999' }}>Soal {i + 1}</span>
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, 1)}>↓</button>
              <button onClick={() => removeQuestion(i)} style={{ color: 'crimson' }}>Hapus</button>
            </div>
            <textarea style={{ width: '100%', marginBottom: 6 }} placeholder="Pertanyaan"
              value={q.q} onChange={e => updateQuestion(i, { q: e.target.value })} />
            {q.opts.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <input type="radio" checked={q.correct === oi} onChange={() => updateQuestion(i, { correct: oi })} />
                <input style={{ flex: 1 }} placeholder={`Opsi ${String.fromCharCode(65 + oi)}`} value={opt}
                  onChange={e => {
                    const opts = [...q.opts]; opts[oi] = e.target.value; updateQuestion(i, { opts });
                  }} />
              </div>
            ))}
            <textarea style={{ width: '100%' }} placeholder="Penjelasan jawaban"
              value={q.explain} onChange={e => updateQuestion(i, { explain: e.target.value })} />
          </div>
        ))}
      </div>
      <button style={{ marginTop: 10 }} onClick={addQuestion}>+ Soal</button>
    </div>
  );
}
