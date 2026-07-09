import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ModuleData, Slide, Section } from '../types';
import { uid } from '../types';
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
    setModule({ ...module, slides: module.slides.map(s => s.id === id ? { ...s, ...patch } : s) });
  }
  function removeSlide(id: string) {
    setModule({ ...module, slides: module.slides.filter(s => s.id !== id) });
  }
  function addBlankSlide(sectionId: string) {
    const nextNumber = module.slides.length ? Math.max(...module.slides.map(s => s.number)) + 1 : 2;
    setModule({
      ...module,
      slides: [...module.slides, { id: uid('slide'), number: nextNumber, sectionId, title: 'Slide Baru', kickerLabel: '', blocks: [] }],
    });
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
      // renumber this section's slides sequentially based on new order, keep other sections' numbers
      const others = module.slides.filter(s => s.sectionId !== sectionId);
      const maxOther = others.length ? Math.max(...others.map(s => s.number), 1) : 1;
      let n = maxOther + 1;
      const renumbered = reordered.map(s => ({ ...s, number: n++ }));
      setModule({ ...module, slides: [...others, ...renumbered] });
    };
  }

  return (
    <div>
      <h2>Susun Modul</h2>
      <p style={{ color: '#888', fontSize: 13 }}>
        Drag slide untuk atur urutan dalam satu section. Klik judul slide untuk buka editor blok kontennya.
      </p>
      {module.sections.map(sec => (
        <div key={sec.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={sec.title} onChange={e => updateSection(sec.id, { title: e.target.value })} style={{ flex: 1, fontWeight: 700 }} />
            <input value={sec.icon} onChange={e => updateSection(sec.id, { icon: e.target.value })} style={{ width: 40 }} />
            <input type="color" value={sec.color} onChange={e => updateSection(sec.id, { color: e.target.value })} />
            <button onClick={() => removeSection(sec.id)} style={{ color: 'crimson' }}>Hapus section</button>
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
          <button style={{ marginTop: 8 }} onClick={() => addBlankSlide(sec.id)}>+ Slide kosong</button>

          <BundlePanel
            slides={slidesFor(sec.id)}
            bundles={bundlesFor(sec.id)}
            onAdd={() => addBundle(sec.id)}
            onUpdateLabel={(idx, label) => updateBundle(sec.id, idx, { label })}
            onToggleSlide={(idx, n) => toggleBundleSlide(sec.id, idx, n)}
            onRemove={idx => removeBundle(sec.id, idx)}
          />
        </div>
      ))}
      <button onClick={addSection}>+ Tambah section</button>
    </div>
  );
}

function BundlePanel({ slides, bundles, onAdd, onUpdateLabel, onToggleSlide, onRemove }: {
  slides: Slide[];
  bundles: { label: string; slides: number[] }[];
  onAdd: () => void;
  onUpdateLabel: (idx: number, label: string) => void;
  onToggleSlide: (idx: number, slideNumber: number) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 13 }}>Bundle sidebar (opsional)</b>
        <button onClick={onAdd}>+ Bundle</button>
      </div>
      <p style={{ color: '#888', fontSize: 12, margin: '4px 0 8px' }}>
        Gabungkan beberapa slide berurutan jadi 1 poin expandable di sidebar (mis. "Kriteria Pemeriksaan" untuk slide 7-8),
        alih-alih tiap slide berdiri sendiri.
      </p>
      {bundles.length === 0 && <p style={{ fontSize: 12, color: '#aaa' }}>Belum ada bundle di section ini.</p>}
      {bundles.map((b, idx) => (
        <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input placeholder="Label bundle (mis. Kriteria Pemeriksaan)" value={b.label}
              onChange={e => onUpdateLabel(idx, e.target.value)} style={{ flex: 1 }} />
            <button onClick={() => onRemove(idx)} style={{ color: 'crimson' }}>Hapus bundle</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {slides.map(s => (
              <label key={s.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={b.slides.includes(s.number)} onChange={() => onToggleSlide(idx, s.number)} />
                #{s.number} {s.title}
              </label>
            ))}
          </div>
          {b.slides.length > 0 && b.slides.length < 2 && (
            <p style={{ fontSize: 11, color: '#c04a44', margin: '4px 0 0' }}>Pilih minimal 2 slide biar jadi bundle expandable.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SlideRow({ slide, module, open, onToggle, onUpdate, onRemove }: {
  slide: Slide; module: ModuleData; open: boolean; onToggle: () => void;
  onUpdate: (p: Partial<Slide>) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={{ ...style, border: '1px solid #eee', borderRadius: 6, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab' }}>⠿</span>
        <span style={{ fontSize: 11, color: '#999' }}>#{slide.number}{slide.sourceSlideNo ? ` (PPTX #${slide.sourceSlideNo})` : ''}</span>
        <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })} style={{ flex: 1 }} />
        <button onClick={onToggle}>{open ? 'Tutup' : 'Edit blok'}</button>
        <button onClick={onRemove} style={{ color: 'crimson' }}>Hapus</button>
      </div>
      {open && (
        <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 12 }}>
          <div style={{ flex: '1 1 50%', minWidth: 0 }}>
            <input placeholder="Kicker label (mis. A.1 JUDUL)" value={slide.kickerLabel}
              onChange={e => onUpdate({ kickerLabel: e.target.value })} style={{ width: '100%', marginBottom: 4 }} />
            <textarea placeholder="Subjudul (opsional)" value={slide.subtitle || ''}
              onChange={e => onUpdate({ subtitle: e.target.value })} style={{ width: '100%', marginBottom: 8, minHeight: 40 }} />
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
