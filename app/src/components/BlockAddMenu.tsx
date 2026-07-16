import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BlockType } from '../types';
import BlockPreviewCard, { BLOCK_PREVIEW_STYLES } from './BlockPreview';

export const BLOCK_LABELS: Record<BlockType, string> = {
  card: 'Kartu (Card)',
  callout: 'Catatan (Callout)',
  definition: 'Definisi',
  pullquote: 'Kutipan Angka (Pull-quote)',
  ticklist: 'Daftar Bercentang',
  accordion: 'Accordion',
  tabs: 'Tabs',
  timeline: 'Timeline',
  dtable: 'Tabel Data',
  flow: 'Diagram Alur',
  grid: 'Grid (2/3 kolom)',
  image: 'Gambar',
  badgeref: 'Badge Referensi',
  html: 'HTML Bebas',
  modal: 'Modal Popup (info tambahan)',
};

const BLOCK_TYPES = Object.keys(BLOCK_LABELS) as BlockType[];
const HOVER_DELAY_MS = 250;

interface Props {
  onAdd: (type: BlockType) => void;
}

export default function BlockAddMenu({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<BlockType | null>(null);
  const [tooltipTop, setTooltipTop] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHovered(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  }, []);

  // Clamp the tooltip to the viewport so it never gets cut off when the
  // hovered item sits near the bottom (or top) of the screen.
  useLayoutEffect(() => {
    if (!hovered) return;
    const wrapRect = wrapRef.current?.getBoundingClientRect();
    const tip = tooltipRef.current;
    if (!wrapRect || !tip) return;
    const tipHeight = tip.getBoundingClientRect().height;
    const margin = 8;
    const viewportSpaceTop = wrapRect.top + tooltipTop;
    let clamped = viewportSpaceTop;
    if (clamped + tipHeight > window.innerHeight - margin) {
      clamped = window.innerHeight - margin - tipHeight;
    }
    if (clamped < margin) clamped = margin;
    const relative = clamped - wrapRect.top;
    if (Math.abs(relative - tooltipTop) > 0.5) setTooltipTop(relative);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered]);

  function scheduleHover(type: BlockType, el: HTMLButtonElement) {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      // tooltip is positioned absolute relative to wrapRef, so its offset
      // must be measured from wrapRef's top, not listRef's.
      const wrapRect = wrapRef.current?.getBoundingClientRect();
      const itemRect = el.getBoundingClientRect();
      if (wrapRect) setTooltipTop(itemRect.top - wrapRect.top);
      setHovered(type);
    }, HOVER_DELAY_MS);
  }

  function cancelHover() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(null);
  }

  function pick(type: BlockType) {
    onAdd(type);
    setOpen(false);
    setHovered(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setHovered(null); }
  }

  return (
    <div ref={wrapRef} className="slide-add-block" style={{ position: 'relative' }} onKeyDown={onKeyDown}>
      <style>{BLOCK_PREVIEW_STYLES}</style>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontWeight: 600, color: 'var(--text-dim)' }}
      >
        + Tambah blok…
      </button>
      {open && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 6, width: 240,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)', padding: 5, maxHeight: 320, overflowY: 'auto',
          }}
        >
          {BLOCK_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => pick(type)}
              onMouseEnter={e => scheduleHover(type, e.currentTarget)}
              onMouseLeave={cancelHover}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                fontSize: 13, borderRadius: 'var(--radius-sm)',
                color: hovered === type ? 'var(--text)' : 'var(--text-dim)',
                fontWeight: hovered === type ? 600 : 500,
                background: hovered === type ? 'var(--surface-3)' : 'transparent', border: 'none',
              }}
            >
              {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      )}
      {open && hovered && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute', zIndex: 60, left: 248, top: tooltipTop,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)', padding: 5,
          }}
        >
          <BlockPreviewCard type={hovered} />
        </div>
      )}
    </div>
  );
}
