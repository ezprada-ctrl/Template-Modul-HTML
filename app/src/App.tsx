import { useEffect, useRef, useState } from 'react';
import type { ModuleData, DraftSlide } from './types';
import { emptyModule, normalizeModule, buildProjectSlugPrefix } from './types';
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
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On first load: try to restore the last-worked-on draft automatically.
  // If there's no local record of a previous project, ask for a name so
  // the freshly-generated slug stays identifiable even if localStorage
  // gets cleared later (see "Mulai Project Baru" below for the manual path).
  useEffect(() => {
    const lastSlug = localStorage.getItem(LAST_SLUG_KEY);
    if (!lastSlug) {
      setShowNewProjectModal(true);
      setHydrated(true);
      return;
    }
    loadDraft(lastSlug)
      .then(data => setModule(normalizeModule(data)))
      .catch(() => { /* no matching draft on server, start fresh */ })
      .finally(() => setHydrated(true));
  }, []);

  function handleCreateProject(nama: string, namaProject: string) {
    const prefix = buildProjectSlugPrefix(nama, namaProject);
    setModule(emptyModule(prefix));
    setShowNewProjectModal(false);
  }

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
      <p style={{ color: '#888', marginTop: 0, marginBottom: 12, fontSize: 13 }}>
        Penyusun modul e-learning drag-and-drop — output identik dengan Modul 1 & Modul 2.
      </p>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        background: '#fdf6e8', border: '1px solid #eadcb3', borderRadius: 6,
        padding: '8px 12px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          <span style={{ color: '#c99a3d', fontWeight: 700 }}>Project: {module.slug} — {module.title}</span>
          <br />
          <span style={{ color: '#aaa' }}>Tiap orang otomatis dapet project sendiri; pakai "Muat Draft" di tab 5 kalau mau buka punya orang lain.</span>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          style={{
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff',
            background: '#c99a3d', border: 'none', borderRadius: 4, padding: '6px 12px',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          + Mulai Project Baru
        </button>
      </div>
      {showNewProjectModal && (
        <NewProjectModal
          onCreate={handleCreateProject}
          onSkip={() => setShowNewProjectModal(false)}
        />
      )}
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

function NewProjectModal({ onCreate, onSkip }: { onCreate: (nama: string, namaProject: string) => void; onSkip: () => void }) {
  const [nama, setNama] = useState('');
  const [namaProject, setNamaProject] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, width: 360, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Project baru</h3>
        <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
          Isi nama kamu & nama project biar gampang dikenali di daftar draft — walau localStorage kehapus, kamu masih ingat slug-nya.
        </p>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nama kamu</label>
        <input
          value={nama}
          onChange={e => setNama(e.target.value)}
          placeholder="mis. Budi Santoso"
          style={{ width: '100%', padding: '6px 8px', marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nama project (opsional)</label>
        <input
          value={namaProject}
          onChange={e => setNamaProject(e.target.value)}
          placeholder="mis. Modul Etika Profesi"
          style={{ width: '100%', padding: '6px 8px', marginBottom: 16, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button onClick={onSkip} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#888', fontSize: 12 }}>
            Lewati
          </button>
          <button
            onClick={() => onCreate(nama, namaProject)}
            disabled={!nama.trim()}
            style={{
              cursor: nama.trim() ? 'pointer' : 'not-allowed',
              background: nama.trim() ? '#c99a3d' : '#ddd',
              color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 700,
            }}
          >
            Mulai
          </button>
        </div>
      </div>
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
