import { useEffect, useRef, useState } from 'react';
import type { ModuleData, DraftSlide } from './types';
import { emptyModule, normalizeModule } from './types';
import { loadDraft, saveDraft } from './api';
import SlideBank from './components/SlideBank';
import Canvas from './components/Canvas';
import CoverForm from './components/CoverForm';
import QuizBuilder from './components/QuizBuilder';
import PreviewExport from './components/PreviewExport';

type Tab = 'bank' | 'canvas' | 'cover' | 'quiz' | 'preview';

const TABS: { id: Tab; label: string }[] = [
  { id: 'bank', label: '1. Import PPTX' },
  { id: 'canvas', label: '2. Susun Modul' },
  { id: 'cover', label: '3. Sampul' },
  { id: 'quiz', label: '4. Kuis' },
  { id: 'preview', label: '5. Preview & Export' },
];

const LAST_SLUG_KEY = 'modul-builder-last-slug';

function App() {
  const [tab, setTab] = useState<Tab>('bank');
  const [module, setModule] = useState<ModuleData>(emptyModule());
  const [bank, setBank] = useState<DraftSlide[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On first load: try to restore the last-worked-on draft automatically.
  useEffect(() => {
    const lastSlug = localStorage.getItem(LAST_SLUG_KEY);
    if (!lastSlug) {
      setHydrated(true);
      return;
    }
    loadDraft(lastSlug)
      .then(data => setModule(normalizeModule(data)))
      .catch(() => { /* no matching draft on server, start fresh */ })
      .finally(() => setHydrated(true));
  }, []);

  // Debounced autosave: any change to the module gets saved to a local JSON
  // draft (server/../drafts/<slug>.json) ~1.2s after the user stops editing.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setAutosaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await saveDraft(module.slug, module);
        localStorage.setItem(LAST_SLUG_KEY, module.slug);
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('error');
      }
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [module, hydrated]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ marginBottom: 4 }}>Template Modul Ikram</h1>
        <AutosaveIndicator status={autosaveStatus} />
      </div>
      <p style={{ color: '#888', marginTop: 0, fontSize: 13 }}>
        Penyusun modul e-learning drag-and-drop — output identik dengan Modul 1 & Modul 2.
      </p>
      <p style={{ color: '#c99a3d', marginTop: 0, marginBottom: 12, fontSize: 12, fontWeight: 700 }}>
        Project: {module.slug} — {module.title}
        <span style={{ color: '#aaa', fontWeight: 400 }}> (tiap orang otomatis dapet project sendiri; pakai "Muat Draft" di tab 5 kalau mau buka punya orang lain)</span>
      </p>
      <nav style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #c99a3d' : '2px solid transparent',
              background: 'transparent',
              fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'bank' && <SlideBank bank={bank} setBank={setBank} module={module} setModule={setModule} />}
      {tab === 'canvas' && <Canvas module={module} setModule={setModule} />}
      {tab === 'cover' && <CoverForm module={module} setModule={setModule} />}
      {tab === 'quiz' && <QuizBuilder module={module} setModule={setModule} />}
      {tab === 'preview' && <PreviewExport module={module} setModule={setModule} />}
    </div>
  );
}

function AutosaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const map = {
    saving: { text: 'Menyimpan...', color: '#888' },
    saved: { text: '✓ Tersimpan otomatis', color: '#2f9e6a' },
    error: { text: '✗ Gagal menyimpan (cek backend)', color: '#c04a44' },
  } as const;
  const cfg = map[status];
  return <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{cfg.text}</span>;
}

export default App;
