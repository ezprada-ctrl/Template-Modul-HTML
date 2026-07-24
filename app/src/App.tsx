import { useCallback, useEffect, useRef, useState } from 'react';
import type { ModuleData, DraftSlide } from './types';
import { emptyModule, normalizeModule, buildProjectSlugPrefix } from './types';
import { listDrafts, loadDraft, saveDraft } from './api';
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

const HISTORY_CAP = 50;
// Edits landing within this window (e.g. typing) collapse into one undo step
// so a single Ctrl+Z doesn't rewind character-by-character.
const COALESCE_MS = 600;

interface History { past: ModuleData[]; present: ModuleData; future: ModuleData[]; }

// Undo/redo wrapper around the module state. All edits funnel through
// setModule (value OR updater form, matching the old useState setter), so this
// is the single choke point where history is recorded. undo/redo/resetHistory
// never record new history themselves. resetHistory is used when switching to
// a different project (load draft / new project / auto-restore) so undo can't
// jump across projects.
function useModuleHistory(initial: ModuleData) {
  const [hist, setHist] = useState<History>({ past: [], present: initial, future: [] });
  const lastEditRef = useRef(0);

  const setModule = useCallback((updater: ModuleData | ((m: ModuleData) => ModuleData)) => {
    setHist(h => {
      const next = typeof updater === 'function' ? (updater as (m: ModuleData) => ModuleData)(h.present) : updater;
      if (next === h.present) return h;
      const now = Date.now();
      // Coalesce rapid successive edits into the existing top-of-history
      // snapshot instead of pushing a new one.
      const coalesce = h.past.length > 0 && now - lastEditRef.current < COALESCE_MS;
      lastEditRef.current = now;
      const past = coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_CAP);
      return { past, present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHist(h => {
      if (!h.past.length) return h;
      lastEditRef.current = 0; // never coalesce across an undo boundary
      return {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future].slice(0, HISTORY_CAP),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHist(h => {
      if (!h.future.length) return h;
      lastEditRef.current = 0;
      return {
        past: [...h.past, h.present].slice(-HISTORY_CAP),
        present: h.future[0],
        future: h.future.slice(1),
      };
    });
  }, []);

  const resetHistory = useCallback((m: ModuleData) => {
    lastEditRef.current = 0;
    setHist({ past: [], present: m, future: [] });
  }, []);

  return {
    module: hist.present, setModule, undo, redo, resetHistory,
    canUndo: hist.past.length > 0, canRedo: hist.future.length > 0,
  };
}

function App() {
  const [tab, setTab] = useState<Tab>('bank');
  const { module, setModule, undo, redo, resetHistory, canUndo, canRedo } = useModuleHistory(emptyModule());
  const [bank, setBank] = useState<DraftSlide[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Separate from `hydrated`: whether the user has actually settled on a
  // project to work on (named-new, skip-anonymous-new, or opened an existing
  // draft). Autosave is gated on this too — without it, the very first
  // `emptyModule()` this component boots with (before the user has even
  // looked at the "Project baru" modal) gets silently written to Supabase as
  // an orphaned blank draft ~1.2s after mount, on EVERY first-time visit,
  // regardless of what the user ends up choosing. That's what was flooding
  // "Muat daftar draft" with junk.
  const [projectReady, setProjectReady] = useState(false);
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
      // Deliberately does NOT set projectReady here — the placeholder
      // emptyModule() this component booted with must not get autosaved
      // until the user actually picks something in the modal below.
      setShowNewProjectModal(true);
      setHydrated(true);
      return;
    }
    loadDraft(lastSlug)
      .then(data => resetHistory(normalizeModule(data)))
      .catch(() => { /* no matching draft on server, start fresh */ })
      .finally(() => { setHydrated(true); setProjectReady(true); });
  }, [resetHistory]);

  function handleCreateProject(nama: string, namaProject: string) {
    const prefix = buildProjectSlugPrefix(nama, namaProject);
    resetHistory(emptyModule(prefix));
    setProjectReady(true);
    setShowNewProjectModal(false);
  }

  function handleSkipNewProject() {
    // "Lewati" = deliberately start blank & anonymous — that's a real choice
    // (unlike just having the modal open with nothing clicked yet), so it's
    // fine for the current blank module to get autosaved from here on.
    setProjectReady(true);
    setShowNewProjectModal(false);
  }

  function handleOpenExistingDraft(slug: string, data: ModuleData) {
    resetHistory(normalizeModule(data));
    localStorage.setItem(LAST_SLUG_KEY, slug);
    setProjectReady(true);
    setShowNewProjectModal(false);
  }

  // Leaving "Import PPTX" with unreviewed draft slides still sitting in `bank`
  // asks for confirmation first — the extracted deck (every image as base64)
  // lives purely in this tab's memory and is never saved to the draft, so
  // walking away silently would otherwise nuke it with no warning. Slides the
  // user already clicked "+ Tambah ke Canvas" for are safe regardless (that
  // already copied them into `module.slides`); this only ever discards what
  // was never added.
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  function handleTabClick(id: Tab) {
    if (tab === 'bank' && id !== 'bank' && bank.length > 0) {
      setPendingTab(id);
      return;
    }
    setTab(id);
  }
  function confirmLeaveImport() {
    setBank([]);
    if (pendingTab) setTab(pendingTab);
    setPendingTab(null);
  }
  function cancelLeaveImport() {
    setPendingTab(null);
  }

  // Global undo/redo shortcuts. Kept at document level (not per-field) so it
  // covers every kind of builder edit — deleting a block, reordering slides,
  // changing a block type — not just text fields. Coalescing (above) keeps a
  // burst of typing from rewinding one character at a time.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return;
      const redoCombo = (e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y';
      e.preventDefault();
      if (redoCombo) redo(); else undo();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Debounced autosave: any change to the module gets saved to the server
  // draft (Supabase) ~1.2s after the user stops editing. Gated on
  // projectReady too (not just hydrated) — see its declaration above for why.
  useEffect(() => {
    if (!hydrated || !projectReady) return;
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
  }, [module, hydrated, projectReady]);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 28px 80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>Ekosistem Modul Interaktif</h1>
          <p className="hint" style={{ margin: 0 }}>
            Muhamad Ikram · Pengembang Teknologi Pembelajaran
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <AutosaveIndicator status={autosaveStatus} />
          <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
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
          onSkip={handleSkipNewProject}
          onOpenExisting={handleOpenExistingDraft}
        />
      )}

      {pendingTab && (
        <LeaveImportWarningModal
          unaddedCount={bank.filter(s => !module.slides.some(sl => sl.sourceSlideNo === s.slideNo)).length}
          onConfirm={confirmLeaveImport}
          onCancel={cancelLeaveImport}
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
              onClick={() => handleTabClick(t.id)}
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

function UndoRedo({ canUndo, canRedo, onUndo, onRedo }: {
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl';
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        className="btn-icon"
        onClick={onUndo}
        disabled={!canUndo}
        title={`Undo (${mod}+Z)`}
        style={{ fontSize: 15, opacity: canUndo ? 1 : 0.4 }}
      >↶</button>
      <button
        className="btn-icon"
        onClick={onRedo}
        disabled={!canRedo}
        title={`Redo (${mod}+Shift+Z)`}
        style={{ fontSize: 15, opacity: canRedo ? 1 : 0.4 }}
      >↷</button>
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

function NewProjectModal({ onCreate, onSkip, onOpenExisting }: {
  onCreate: (nama: string, namaProject: string) => void;
  onSkip: () => void;
  onOpenExisting: (slug: string, data: ModuleData) => void;
}) {
  const [nama, setNama] = useState('');
  const [namaProject, setNamaProject] = useState('');
  // Toggles this modal into "pick an existing draft" mode. Kept inline
  // (rather than sending the user off to the Preview tab first) so nothing
  // ever gets autosaved in between - the placeholder blank module this app
  // boots with only becomes "real" once one of onCreate/onSkip/onOpenExisting
  // actually fires, never just from opening this panel to look around.
  const [mode, setMode] = useState<'create' | 'existing'>('create');
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [draftsError, setDraftsError] = useState('');
  const [loadingSlug, setLoadingSlug] = useState('');

  async function openExistingMode() {
    setMode('existing');
    if (drafts !== null) return; // already fetched once
    try {
      setDrafts(await listDrafts());
    } catch (e: any) {
      setDraftsError(e.message || 'Gagal mengambil daftar draft.');
    }
  }

  async function pickDraft(slug: string) {
    setLoadingSlug(slug);
    try {
      const data = await loadDraft(slug);
      onOpenExisting(slug, normalizeModule(data));
    } catch (e: any) {
      setDraftsError(e.message || `Gagal memuat draft "${slug}".`);
      setLoadingSlug('');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div className="panel" style={{ width: 380, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        {mode === 'create' ? (
          <>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Project baru</h3>
            <p className="hint" style={{ marginTop: 0, marginBottom: 18 }}>
              Isi nama kamu &amp; nama project biar gampang dikenali di daftar draft — walau localStorage kehapus, kamu masih ingat slug-nya.
              Sudah punya project? <button className="btn-ghost btn-sm" style={{ padding: '1px 6px' }} onClick={openExistingMode}>Buka draft yang sudah ada</button>
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
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Buka draft yang sudah ada</h3>
            <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
              Pilih project yang mau dilanjutkan.
            </p>
            {draftsError && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{draftsError}</p>}
            {drafts === null && !draftsError && <p className="hint">Memuat daftar draft…</p>}
            {drafts !== null && drafts.length === 0 && <p className="hint">Belum ada draft tersimpan.</p>}
            {drafts !== null && drafts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
                {drafts.map(slug => (
                  <button
                    key={slug}
                    className="btn-sm"
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    disabled={loadingSlug !== ''}
                    onClick={() => pickDraft(slug)}
                  >
                    {loadingSlug === slug ? 'Memuat…' : slug}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button className="btn-ghost btn-sm" onClick={() => setMode('create')} disabled={loadingSlug !== ''}>← Kembali</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LeaveImportWarningModal({ unaddedCount, onConfirm, onCancel }: {
  unaddedCount: number; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div className="panel" style={{ width: 380, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Tinggalkan Import PPTX?</h3>
        <p className="hint" style={{ marginTop: 0, marginBottom: 18 }}>
          Slide yang tidak Anda pilih akan otomatis dihapus oleh sistem dari menu Import PPTX
          {unaddedCount > 0 ? ` (${unaddedCount} slide belum ditambahkan ke Canvas)` : ''}. Slide yang sudah
          diklik "+ Tambah ke Canvas" aman, tidak ikut terhapus.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-ghost btn-sm" onClick={onCancel}>Batal</button>
          <button className="btn-primary" onClick={onConfirm}>Lanjut</button>
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
