import { useEffect, useRef, useState } from 'react';
import type { ModuleData, DraftSlide } from './types';
import { emptyModule, normalizeModule, buildProjectSlugPrefix } from './types';
import { loadDraft, saveDraft } from './api';
import SlideBank from './components/SlideBank';
import Canvas from './components/Canvas';
import CoverForm from './components/CoverForm';
import QuizBuilder from './components/QuizBuilder';
import PreviewExport from './components/PreviewExport';
import CommandCenter from './components/CommandCenter';

type Tab = 'bank' | 'canvas' | 'cover' | 'quiz' | 'preview' | 'command';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'bank', label: 'Import PPTX', hint: 'Ekstrak slide dari file PPTX' },
  { id: 'canvas', label: 'Susun Modul', hint: 'Tata slide & isi blok konten' },
  { id: 'cover', label: 'Sampul', hint: 'Judul, tema, gambar sampul' },
  { id: 'quiz', label: 'Kuis', hint: 'Soal per section' },
  { id: 'preview', label: 'Preview & Export', hint: 'Lihat hasil & unduh HTML' },
  { id: 'command', label: 'Command Center', hint: 'Rekaman aktivitas peserta (butuh password)' },
];

const LAST_SLUG_KEY = 'modul-builder-last-slug';
const THEME_KEY = 'modul-builder-theme';

function App() {
  const [tab, setTab] = useState<Tab>('bank');
  const [module, setModule] = useState<ModuleData>(emptyModule());
  const [bank, setBank] = useState<DraftSlide[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light',
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply + persist theme by stamping data-theme on <html> so every token cascades.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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

  // Debounced autosave: any change to the module gets saved to the server
  // draft (Supabase) ~1.2s after the user stops editing.
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
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 28px 80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>Template Modul Ikram</h1>
          <p className="hint" style={{ margin: 0 }}>
            Penyusun modul e-learning drag-and-drop — output identik dengan Modul 1 &amp; Modul 2.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <AutosaveIndicator status={autosaveStatus} />
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))} />
        </div>
      </header>

      <ProjectBar
        module={module}
        onNewProject={() => setShowNewProjectModal(true)}
      />

      {showNewProjectModal && (
        <NewProjectModal
          onCreate={handleCreateProject}
          onSkip={() => setShowNewProjectModal(false)}
        />
      )}

      <nav style={{
        display: 'flex', gap: 4, marginBottom: 22,
        borderBottom: '1px solid var(--border)',
      }}>
        {TABS.map((t, i) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.hint}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                border: 'none', borderRadius: 0,
                background: 'transparent',
                color: active ? 'var(--text)' : 'var(--text-dim)',
                fontWeight: active ? 700 : 500,
                borderBottom: active ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: active ? 'var(--ink)' : 'var(--surface-2)',
                color: active ? 'var(--on-ink)' : 'var(--text-faint)',
                transition: 'background var(--ease), color var(--ease)',
              }}>{i + 1}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === 'bank' && <SlideBank bank={bank} setBank={setBank} module={module} setModule={setModule} />}
      {tab === 'canvas' && <Canvas module={module} setModule={setModule} />}
      {tab === 'cover' && <CoverForm module={module} setModule={setModule} />}
      {tab === 'quiz' && <QuizBuilder module={module} setModule={setModule} />}
      {tab === 'preview' && <PreviewExport module={module} setModule={setModule} />}
      {tab === 'command' && <CommandCenter />}
    </div>
  );
}

function ProjectBar({ module, onNewProject }: { module: ModuleData; onNewProject: () => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 20,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            Project
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{module.title}</span>
          <code style={{
            fontSize: 11.5, color: 'var(--text-dim)', background: 'var(--surface-3)',
            padding: '1px 7px', borderRadius: 5,
          }}>{module.slug}</code>
        </div>
        <p className="hint" style={{ margin: '3px 0 0' }}>
          Tiap orang otomatis dapet project sendiri; pakai “Muat Draft” di tab Preview kalau mau buka punya orang lain.
        </p>
      </div>
      <button className="btn-sm" onClick={onNewProject} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
        + Mulai Project Baru
      </button>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      className="btn-icon"
      onClick={onToggle}
      title={theme === 'light' ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}
      style={{ fontSize: 15 }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

function NewProjectModal({ onCreate, onSkip }: { onCreate: (nama: string, namaProject: string) => void; onSkip: () => void }) {
  const [nama, setNama] = useState('');
  const [namaProject, setNamaProject] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div className="panel" style={{ width: 380, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Project baru</h3>
        <p className="hint" style={{ marginTop: 0, marginBottom: 18 }}>
          Isi nama kamu &amp; nama project biar gampang dikenali di daftar draft — walau localStorage kehapus, kamu masih ingat slug-nya.
        </p>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 5 }}>Nama kamu</label>
        <input
          value={nama}
          onChange={e => setNama(e.target.value)}
          placeholder="mis. Budi Santoso"
          style={{ width: '100%', marginBottom: 14 }}
        />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 5 }}>Nama project (opsional)</label>
        <input
          value={namaProject}
          onChange={e => setNamaProject(e.target.value)}
          placeholder="mis. Modul Etika Profesi"
          style={{ width: '100%', marginBottom: 20 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button className="btn-ghost btn-sm" onClick={onSkip}>Lewati</button>
          <button className="btn-primary" onClick={() => onCreate(nama, namaProject)} disabled={!nama.trim()}>
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
    saving: { text: 'Menyimpan…', color: 'var(--text-faint)' },
    saved: { text: '✓ Tersimpan otomatis', color: 'var(--success)' },
    error: { text: '✗ Gagal menyimpan (cek backend)', color: 'var(--danger)' },
  } as const;
  const cfg = map[status];
  return <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{cfg.text}</span>;
}

export default App;
