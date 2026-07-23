import { useEffect, useRef, useState } from 'react';
import type { ModuleData } from '../types';
import { generateHtml } from '../api';

interface Props {
  module: ModuleData;
  slideNumber?: number;
  target?: 'slide' | 'hero';
  label?: string;
}

// Live preview of a single slide (or the cover/hero screen), rendered by
// generating the full module HTML and jumping the embedded page straight to
// that slide (bypassing section gating via devMode) — so editors see the
// real output next to the fields they're editing, instead of hopping to the
// far-away Preview & Export tab.
export default function SlidePreview({ module, slideNumber, target = 'slide', label }: Props) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const out = await generateHtml(module);
        setHtml(out);
        setError('');
      } catch (e: any) {
        setError(e.message || 'Gagal generate preview');
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(module)]);

  function jumpToSlide() {
    const win = iframeRef.current?.contentWindow as any;
    if (!win) return;
    const findExpr = target === 'hero'
      ? `it.kind === 'hero'`
      : `it.kind === 'slide' && it.num === ${slideNumber}`;
    try {
      win.eval(`
        devMode = true;
        const idx = NAV.findIndex(it => ${findExpr});
        if (idx >= 0) goTo(idx);
        // Dev Mode was only needed to jump straight here past section/quiz
        // gates that don't matter for "how does this one slide look" - left
        // on, it also silently skips every OTHER gate (Knowledge Check's
        // leave-slide popup, quiz lock, reading-speed nag), making them look
        // broken when someone clicks Next/Prev inside this preview to test
        // them. toggleDevMode() (not a raw "devMode = false") so the sidebar
        // lock icons and Dev Mode button state stay in sync with the real
        // (now non-dev) gating - not just the variable.
        if (devMode) toggleDevMode();
      `);
    } catch {
      // iframe not ready yet, ignore
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', height: '100%', minHeight: 420, display: 'flex', flexDirection: 'column', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-faint)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label || (target === 'hero' ? 'Preview langsung — sampul' : `Preview langsung — slide #${slideNumber}`)}</span>
        {loading && <span>memperbarui…</span>}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, padding: 10 }}>{error}</p>}
      {html && (
        <iframe
          ref={iframeRef}
          srcDoc={html}
          onLoad={jumpToSlide}
          style={{ border: 'none', flex: 1, width: '100%' }}
        />
      )}
    </div>
  );
}
