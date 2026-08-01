import { useEffect, useRef, useState } from 'react';
import { GRAPHIC_STYLES } from '../graphicStyles';
import { GRAPHIC_STYLE_PREVIEWS } from '../graphicStylePreviews';

interface Props {
  value: string;
  onChange: (id: string) => void;
  theme: { accent: string; accent2: string; onAccent: string; navy: string };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const KINDS = ['cover', 'content', 'ending'] as const;
const KIND_LABEL: Record<(typeof KINDS)[number], string> = {
  cover: 'Sampul', content: 'Slide Konten', ending: 'Slide Penutup',
};

// Panel "kertas" (mockup ilustratif, sama gayanya kayak Artifact spesimen
// yang dulu dipakai buat approval) - SENGAJA fixed terang (bukan ngikutin
// dark mode builder), karena ini preview OUTPUT modul yang emang selalu
// terang, bukan bagian dari UI builder itu sendiri.
const PANEL_STYLE: React.CSSProperties = {
  width: 158, aspectRatio: '4 / 3', borderRadius: 12, position: 'relative', overflow: 'hidden',
  border: '1px solid rgba(22,33,62,.10)', boxShadow: '0 8px 18px -10px rgba(22,33,62,.18)',
  background:
    'radial-gradient(circle at 15% 0%, rgba(201,154,61,.07), transparent 45%),' +
    'radial-gradient(circle at 90% 100%, rgba(27,42,74,.05), transparent 40%),' +
    '#ffffff',
  padding: '10px 11px', display: 'flex', flexDirection: 'column',
};

function MockContent({ kind }: { kind: (typeof KINDS)[number] }) {
  if (kind === 'cover') {
    return (
      <div style={{ position: 'relative', zIndex: 1, margin: 'auto', textAlign: 'center' }}>
        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.11em', textTransform: 'uppercase', color: 'var(--accent-2)', marginBottom: 6 }}>Modul Pembelajaran</div>
        <div style={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1.18, color: 'var(--navy)' }}>
          Manajemen Risiko<br />
          <span style={{ background: 'linear-gradient(90deg,var(--accent-2),var(--accent))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Kepatuhan Pajak</span>
        </div>
        <div style={{ marginTop: 8, display: 'inline-block', padding: '5px 10px', borderRadius: 20, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: 'var(--on-accent)', fontSize: 7.5, fontWeight: 800 }}>Mulai Belajar →</div>
      </div>
    );
  }
  if (kind === 'content') {
    return (
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 6.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent-2)', marginBottom: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800 }}>2</span>
          Prinsip Dasar
        </div>
        <div style={{ fontWeight: 800, fontSize: 10, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 4 }}>Memahami Kerangka Kepatuhan</div>
        <div style={{ fontSize: 7, color: '#4d5876', lineHeight: 1.4, marginBottom: 6 }}>Tiga pilar sistem kepatuhan pajak modern.</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
          <div style={{ flex: 1, height: 26, borderRadius: 5, background: '#fff', border: '1px solid rgba(22,33,62,.09)', borderTop: '2px solid var(--accent)', padding: '3px 5px', fontSize: 5.5, fontWeight: 700, color: 'var(--navy)' }}>Prinsip 1</div>
          <div style={{ flex: 1, height: 26, borderRadius: 5, background: '#fff', border: '1px solid rgba(22,33,62,.09)', borderTop: '2px solid var(--accent)', padding: '3px 5px', fontSize: 5.5, fontWeight: 700, color: 'var(--navy)' }}>Prinsip 2</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', zIndex: 1, margin: 'auto', textAlign: 'center' }}>
      <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.11em', textTransform: 'uppercase', color: 'var(--accent-2)', marginBottom: 6 }}>Selesai</div>
      <div style={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1.18, color: 'var(--navy)' }}>Modul Berhasil<br />Diselesaikan</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'center' }}>
        {[['12', 'Slide'], ['3', 'Kuis'], ['48', 'Menit']].map(([n, l]) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <b style={{ fontSize: 10.5, color: 'var(--accent-2)', fontWeight: 800 }}>{n}</b>
            <span style={{ fontSize: 5.5, color: '#8891a8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dropdown custom (bukan <select> native) - HARUS custom karena browser gak
// ngizinin render konten kaya (preview 3 panel) di dalam popup <option>
// native. Hover salah satu gaya di daftar kiri -> preview 3 panel (Sampul/
// Konten/Penutup) muncul di kanan, pakai markup dari graphicStylePreviews.ts
// (skala ilustratif, BUKAN generate_html() beneran - dipilih biar responnya
// instan pas hover, gak nunggu round-trip ke backend tiap gerak mouse).
export default function GraphicStyleSelect({ value, onChange, theme }: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Guard against a spurious click landing back on the trigger button right
  // after picking a row: closing the dropdown removes the row (and its
  // whole popover) from the DOM as a direct side effect of that same click,
  // and browsers/React can retarget/replay the tail end of that click onto
  // whatever now sits underneath - which is the trigger button, since the
  // popover was positioned right below it. Reproduced consistently (prod
  // build too, not just dev/StrictMode) via a single real click. Set
  // synchronously in the row's own handler so the button's handler - which
  // runs microtasks-to-a-frame later - can see and swallow it.
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setHovered(null);
  }, [open]);

  const selected = GRAPHIC_STYLES.find(g => g.id === value) || GRAPHIC_STYLES[0];
  const previewId = hovered ?? (value !== 'none' ? value : null);
  const previewSet = previewId ? GRAPHIC_STYLE_PREVIEWS[previewId] : null;

  const themeVars = {
    '--accent': theme.accent,
    '--accent-2': theme.accent2,
    '--on-accent': theme.onAccent,
    '--navy': theme.navy,
    '--accent-soft': hexToRgba(theme.accent, 0.14),
    '--accent-glow': hexToRgba(theme.accent, 0.45),
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => {
          if (justSelectedRef.current) return;
          setOpen(o => !o);
        }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', background: 'var(--surface)',
          padding: '8px 10px', border: `1px solid ${open ? 'var(--ink)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', boxShadow: open ? '0 0 0 3px var(--ring)' : 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span>{selected.label}</span>
        <span style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            display: 'flex', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', padding: 10,
          }}
        >
          <div style={{ width: 168, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {GRAPHIC_STYLES.map(g => (
              <div
                key={g.id}
                onMouseEnter={() => setHovered(g.id)}
                onClick={() => {
                  justSelectedRef.current = true;
                  onChange(g.id);
                  setOpen(false);
                  // setTimeout, not requestAnimationFrame: rAF is suspended
                  // whenever the tab isn't actively compositing (backgrounded,
                  // minimized, or - as hit during testing - a browser-automation
                  // pane that isn't visually displayed), which would leave this
                  // guard stuck true forever and silently break every future
                  // open. setTimeout still fires in that case.
                  setTimeout(() => { justSelectedRef.current = false; }, 50);
                }}
                style={{
                  padding: '7px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  background: g.id === value ? 'var(--surface-2)' : 'transparent',
                  fontWeight: g.id === value ? 700 : 500, color: 'var(--text)',
                }}
              >
                {g.label}
              </div>
            ))}
          </div>

          <div style={{ width: 3 * 158 + 2 * 10, display: 'flex', gap: 10, alignItems: 'flex-start', ...themeVars }}>
            {previewSet ? (
              KINDS.map(kind => (
                <div key={kind}>
                  <div style={PANEL_STYLE}>
                    <div
                      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
                      dangerouslySetInnerHTML={{ __html: previewSet[kind] }}
                    />
                    <MockContent kind={kind} />
                  </div>
                  <p style={{ fontSize: 10, textAlign: 'center', marginTop: 5, color: 'var(--text-faint)' }}>{KIND_LABEL[kind]}</p>
                </div>
              ))
            ) : (
              <div style={{ width: '100%', minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', padding: 16 }}>
                Arahkan kursor ke salah satu gaya buat lihat preview
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
