import { useState, useRef, useEffect } from 'react';
import { EMOJI_CATEGORIES } from '../emojiData';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function EmojiPicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filteredCategories = search.trim()
    ? EMOJI_CATEGORIES.map(c => ({ ...c, emojis: c.emojis })).filter(c =>
        c.label.toLowerCase().includes(search.trim().toLowerCase()))
    : EMOJI_CATEGORIES;

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ fontSize: 18, width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Pilih ikon"
        >
          {value || '➕'}
        </button>
        <input
          style={{ flex: 1 }}
          placeholder={placeholder || 'Icon (simbol, opsional)'}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, top: 42, left: 0, width: 340,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', padding: 8,
        }}>
          <input
            autoFocus
            placeholder="Cari kategori (mis. panah, bintang, dokumen)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          />
          {!search.trim() && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {EMOJI_CATEGORIES.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  className={activeCategory === i ? 'btn-primary btn-sm' : 'btn-sm'}
                  onClick={() => setActiveCategory(i)}
                  style={{ fontSize: 11 }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {(search.trim() ? filteredCategories.flatMap(c => c.emojis) : EMOJI_CATEGORIES[activeCategory].emojis)
              .map((e, i) => (
                <button
                  key={e + i}
                  type="button"
                  onClick={() => pick(e)}
                  style={{ fontSize: 20, width: 34, height: 34, padding: 0, border: 'none', background: 'transparent', borderRadius: 6 }}
                >
                  {e}
                </button>
              ))}
          </div>
          {value && (
            <button type="button" className="btn-danger btn-sm" style={{ marginTop: 8, fontSize: 11 }} onClick={() => pick('')}>
              Hapus icon
            </button>
          )}
        </div>
      )}
    </div>
  );
}
