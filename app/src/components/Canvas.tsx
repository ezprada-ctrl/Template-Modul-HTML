import { useEffect, useRef, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ModuleData, Slide, Section } from '../types';
import { uid, renumberModule } from '../types';
import BlockEditor from './BlockEditor';
import SlidePreview from './SlidePreview';

interface Props {
  module: ModuleData;
  setModule: (m: ModuleData) => void;
}

export default function Canvas({ module, setModule }: Props) {
  const [openSlideId, setOpenSlideId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  function addSection() {
    const letter = String.fromCharCode(65 + module.sections.length);
    setModule({
      ...module,
      sections: [...module.sections, {
        id: uid('sec'), title: `${letter}. Bagian Baru`, short: 'Bagian Baru', icon: letter, color: '#c99a3d',
      }],
    });
  }
  function updateSection(id: string, patch: Partial<Section>) {
    setModule({ ...module, sections: module.sections.map(s => s.id === id ? { ...s, ...patch } : s) });
  }
  function removeSection(id: string) {
    if (module.slides.some(s => s.sectionId === id)) {
      alert('Pindahkan/hapus dulu semua slide di section ini sebelum menghapusnya.');
      return;
    }
    setModule({ ...module, sections: module.sections.filter(s => s.id !== id) });
  }

  function slidesFor(sectionId: string) {
    return module.slides.filter(s => s.sectionId === sectionId);
  }

  function updateSlide(id: string, patch: Partial<Slide>) {
    if (patch.sectionId !== undefined) {
      // Moving to a different section: drop it to the end of the flat
      // slide list (so it lands after that section's existing slides),
      // then renumber everything so numbering follows section order again.
      const moved = module.slides.find(s => s.id === id);
      if (!moved) return;
      const rest = module.slides.filter(s => s.id !== id);
      setModule(renumberModule({ ...module, slides: [...rest, { ...moved, ...patch }] }));
      return;
    }
    setModule({ ...module, slides: module.slides.map(s => s.id === id ? { ...s, ...patch } : s) });
  }
  function removeSlide(id: string) {
    setModule(renumberModule({ ...module, slides: module.slides.filter(s => s.id !== id) }));
  }
  function addBlankSlide(sectionId: string) {
    const newSlide: Slide = { id: uid('slide'), number: 0, sectionId, title: 'Slide Baru', kickerLabel: '', blocks: [] };
    setModule(renumberModule({ ...module, slides: [...module.slides, newSlide] }));
  }

  function bundlesFor(sectionId: string) {
    return module.multiGroups[sectionId] || [];
  }
  function setBundles(sectionId: string, bundles: { label: string; slides: number[] }[]) {
    setModule({ ...module, multiGroups: { ...module.multiGroups, [sectionId]: bundles } });
  }
  function addBundle(sectionId: string) {
    setBundles(sectionId, [...bundlesFor(sectionId), { label: '', slides: [] }]);
  }
  function updateBundle(sectionId: string, idx: number, patch: Partial<{ label: string; slides: number[] }>) {
    const next = bundlesFor(sectionId).map((b, i) => i === idx ? { ...b, ...patch } : b);
    setBundles(sectionId, next);
  }
  function removeBundle(sectionId: string, idx: number) {
    setBundles(sectionId, bundlesFor(sectionId).filter((_, i) => i !== idx));
  }
  function toggleBundleSlide(sectionId: string, idx: number, slideNumber: number) {
    const bundle = bundlesFor(sectionId)[idx];
    const has = bundle.slides.includes(slideNumber);
    const slides = has ? bundle.slides.filter(n => n !== slideNumber) : [...bundle.slides, slideNumber].sort((a, b) => a - b);
    updateBundle(sectionId, idx, { slides });
  }

  function onDragEnd(sectionId: string) {
    return (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const list = slidesFor(sectionId);
      const oldIndex = list.findIndex(s => s.id === active.id);
      const newIndex = list.findIndex(s => s.id === over.id);
      const reordered = arrayMove(list, oldIndex, newIndex);
      const others = module.slides.filter(s => s.sectionId !== sectionId);
      setModule(renumberModule({ ...module, slides: [...others, ...reordered] }));
    };
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 4px' }}>Susun Modul</h2>
      <p className="hint" style={{ marginTop: 0, marginBottom: 18 }}>
        Drag slide untuk atur urutan dalam satu section. Klik “Edit blok” untuk buka editor konten slide-nya.
      </p>
      {module.sections.map(sec => (
        <div className="panel" key={sec.id} style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input value={sec.title} onChange={e => {
              const title = e.target.value;
              // Keep the compact label (used in the Kuis tab + sidebar nav) in
              // sync with the full title, stripping a leading "A. " prefix so
              // it doesn't duplicate the section-letter badge shown next to it.
              const short = title.replace(/^[A-Za-z0-9]+\.\s*/, '') || title;
              updateSection(sec.id, { title, short });
            }} style={{ flex: 1, fontWeight: 700 }} />
            <input value={sec.icon} onChange={e => updateSection(sec.id, { icon: e.target.value })} style={{ width: 44, textAlign: 'center' }} />
            <button className="btn-danger btn-sm" onClick={() => removeSection(sec.id)}>Hapus section</button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(sec.id)}>
            <SortableContext items={slidesFor(sec.id).map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slidesFor(sec.id).map(slide => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    module={module}
                    open={openSlideId === slide.id}
                    onToggle={() => setOpenSlideId(openSlideId === slide.id ? null : slide.id)}
                    onUpdate={patch => updateSlide(slide.id, patch)}
                    onRemove={() => removeSlide(slide.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button className="btn-sm" style={{ marginTop: 10 }} onClick={() => addBlankSlide(sec.id)}>+ Slide kosong</button>

          <BundlePanel
            slides={slidesFor(sec.id)}
            bundles={bundlesFor(sec.id)}
            theme={module.theme}
            onAdd={() => addBundle(sec.id)}
            onUpdateLabel={(idx, label) => updateBundle(sec.id, idx, { label })}
            onToggleSlide={(idx, n) => toggleBundleSlide(sec.id, idx, n)}
            onRemove={idx => removeBundle(sec.id, idx)}
          />
        </div>
      ))}
      <button className="btn-primary" onClick={addSection}>+ Tambah section</button>
    </div>
  );
}

function BundlePanel({ slides, bundles, theme, onAdd, onUpdateLabel, onToggleSlide, onRemove }: {
  slides: Slide[];
  bundles: { label: string; slides: number[] }[];
  theme: { accent: string; navy: string };
  onAdd: () => void;
  onUpdateLabel: (idx: number, label: string) => void;
  onToggleSlide: (idx: number, slideNumber: number) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border-strong)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 13 }}>Bundle sidebar <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>(opsional)</span></b>
        <button className="btn-sm" onClick={onAdd}>+ Bundle</button>
      </div>
      <p className="hint" style={{ margin: '6px 0 10px' }}>
        Gabungkan beberapa slide berurutan jadi 1 poin expandable di sidebar (mis. "Kriteria Pemeriksaan" untuk slide 7-8),
        alih-alih tiap slide berdiri sendiri.
      </p>
      {bundles.length === 0 && <p className="hint" style={{ margin: 0 }}>Belum ada bundle di section ini.</p>}
      {bundles.map((b, idx) => (
        <div key={idx} style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input placeholder="Label bundle (mis. Kriteria Pemeriksaan)" value={b.label}
              onChange={e => onUpdateLabel(idx, e.target.value)} style={{ flex: 1 }} />
            <button className="btn-danger btn-sm" onClick={() => onRemove(idx)}>Hapus bundle</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {slides.map(s => (
              <label key={s.id} style={{ fontSize: 12.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={b.slides.includes(s.number)} onChange={() => onToggleSlide(idx, s.number)} />
                #{s.number} {s.title}
              </label>
            ))}
          </div>
          {b.slides.length > 0 && b.slides.length < 2 && (
            <p style={{ fontSize: 11.5, color: 'var(--danger)', margin: '6px 0 0' }}>Pilih minimal 2 slide biar jadi bundle expandable.</p>
          )}
          {b.slides.length >= 2 && (
            <BundleAnimatedDemo
              label={b.label || 'Nama bundle'}
              slideTitles={b.slides.map(n => slides.find(s => s.number === n)?.title || `Slide #${n}`)}
              theme={theme}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Auto-looping mini mockup of the sidebar bundle behaviour (collapsed -> a
// fake cursor "clicks" the chevron -> expands to reveal the grouped slides ->
// collapses again), so users can see what "bundle" means without hopping to
// the Preview tab. Mirrors the real sidebar bundle markup/classes in
// shell-template.html (nav-bundle-head / bundle-chevron / nav-bundle-body).
function BundleAnimatedDemo({ label, slideTitles, theme }: {
  label: string;
  slideTitles: string[];
  theme: { accent: string; navy: string };
}) {
  const [open, setOpen] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setClicking(true);
      setTimeout(() => {
        setOpen(o => !o);
        setClicking(false);
      }, 260);
    };
    const id = setInterval(cycle, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ marginTop: 10 }}>
      <p className="hint" style={{ margin: '0 0 5px' }}>Contoh tampilan di sidebar peserta:</p>
      <div style={{
        maxWidth: 280, border: '1px solid #e3e6ee', borderRadius: 10, background: '#fff',
        padding: 6, fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', borderRadius: 8, background: open ? '#f1f3f7' : 'transparent',
          transition: 'background .2s ease',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.navy }}>{label}</span>
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: '#8891a8',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s ease',
          }}>
            ⌄
          </span>
          <span style={{
            position: 'absolute', right: 6, top: clicking ? 6 : -18,
            transition: 'top .25s ease, transform .25s ease',
            transform: clicking ? 'scale(0.85)' : 'scale(1)',
            fontSize: 15, pointerEvents: 'none',
          }}>
            👆
          </span>
        </div>
        <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height .35s ease' }}>
          <div style={{ padding: '4px 10px 6px 26px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {slideTitles.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#5b6478' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c7cbd2', flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideRow({ slide, module, open, onToggle, onUpdate, onRemove }: {
  slide: Slide; module: ModuleData; open: boolean; onToggle: () => void;
  onUpdate: (p: Partial<Slide>) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Toggles a class on the whole workspace container whenever focus is
  // anywhere inside it (kicker, subjudul, or any block - including ones
  // added later, since they're all inside this same container) - the
  // entire slide being edited gets framed as one unit, not just whichever
  // single field currently has the cursor. Plain focusin/focusout listeners
  // instead of a CSS :has() selector because :has()-based style invalidation
  // turned out to be unreliable here (the selector matched via querySelector
  // but computed style didn't update).
  useEffect(() => {
    if (!open) return;
    const el = workspaceRef.current;
    if (!el) return;
    function updateFocusState() {
      const focused = document.activeElement;
      const within = !!(focused && el!.contains(focused));
      el!.classList.toggle('has-focused-block', within);
    }
    function onFocusOut() { setTimeout(updateFocusState, 0); }
    el.addEventListener('focusin', updateFocusState);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      el.removeEventListener('focusin', updateFocusState);
      el.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  return (
    <div ref={setNodeRef} style={{ ...style, border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', boxShadow: open ? 'var(--shadow-sm)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-faint)', fontSize: 15, padding: '0 2px' }} title="Geser untuk atur urutan">⠿</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, whiteSpace: 'nowrap' }}>#{slide.number}{slide.sourceSlideNo ? ` · PPTX ${slide.sourceSlideNo}` : ''}</span>
        <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })} style={{ flex: 1 }} />
        <select value={slide.sectionId} onChange={e => onUpdate({ sectionId: e.target.value })} title="Pindah ke section lain">
          {module.sections.map(sec => <option key={sec.id} value={sec.id}>{sec.icon}. {sec.short}</option>)}
        </select>
        <button className={open ? 'btn-primary btn-sm' : 'btn-sm'} onClick={onToggle}>{open ? 'Tutup' : 'Edit blok'}</button>
        <button className="btn-danger btn-sm" onClick={onRemove}>Hapus</button>
      </div>
      {open && (
        <div className="slide-workspace" ref={workspaceRef} style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 28 }}>
          <div style={{ flex: '1 1 50%', minWidth: 0 }}>
            <div>
              <input placeholder="Kicker label (mis. A.1 JUDUL)" value={slide.kickerLabel}
                onChange={e => onUpdate({ kickerLabel: e.target.value })} style={{ width: '100%', marginBottom: 4 }} />
              <textarea placeholder="Subjudul (opsional)" value={slide.subtitle || ''}
                onChange={e => onUpdate({ subtitle: e.target.value })}
                style={{ width: '100%', marginBottom: 8, minHeight: 40, resize: 'vertical' }} />
            </div>
            <BlockEditor blocks={slide.blocks} onChange={blocks => onUpdate({ blocks })} />
          </div>
          <div style={{ flex: '1 1 50%', minWidth: 0, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
            <SlidePreview module={module} slideNumber={slide.number} />
          </div>
        </div>
      )}
    </div>
  );
}
