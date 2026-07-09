// Curated set of monochrome/line-style Unicode symbols for the icon picker.
// Deliberately avoids full-color "chat" emoji (faces, food, animals) — these
// are meant as flat aesthetic accents inside a professional navy/gold
// e-learning design (module cards, callouts), not conversational emoji.

export const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Panah & Alur',
    emojis: '→ ← ↑ ↓ ↔ ↕ ↗ ↘ ↙ ↖ ⇒ ⇐ ⇔ ⇑ ⇓ ➜ ➔ ➤ ➢ ➣ ➥ ➦ ⤴ ⤵ ↩ ↪ ⟲ ⟳ ↻ ↺ ⇄ ⇆ ⇌ ⤳'.split(' '),
  },
  {
    label: 'Bentuk & Bullet',
    emojis: '● ○ ◐ ◑ ◒ ◓ ◆ ◇ ◈ ■ □ ▪ ▫ ▲ △ ▶ ▷ ◀ ◁ ▼ ▽ ⬟ ⬠ ⬡ ⬢ ⬣ ◉ ◎ ⊙ ⬤ ▰ ▱ ◼ ◻ ◾ ◽'.split(' '),
  },
  {
    label: 'Bintang & Aksen',
    emojis: '★ ☆ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ⁂ ❋ ❁ ❀ ✿ ✽ ✾ ⚝ ✺ ✹ ✸ ❃ ❊ ❉ ⭑ ⭒'.split(' '),
  },
  {
    label: 'Centang, Silang & Matematika',
    emojis: '✓ ✔ ✗ ✘ ☑ ☒ ➕ ➖ ➗ ✕ ✖ ⊘ ⊗ ⊕ ∴ ∵ ∞ ≈ ≠ ≤ ≥ ± × ÷ % # ✱ ✲ ‼ ⁇ ⁈ ⁉'.split(' '),
  },
  {
    label: 'Dokumen & Alat Tulis',
    emojis: '✎ ✏ ✐ ✑ ✒ ✂ ✃ ✄ ✉ ☏ ⌨ ⌚ ⏱ ⏰ ⌛ ⏳ ⌘ ⌥ ⎋ ⚙ ⚖ ⚗ ⚒ ⛏ ⚔ 🖇︎'.split(' '),
  },
  {
    label: 'Alam & Cuaca (line)',
    emojis: '☀ ☁ ☂ ☔ ☃ ❄ ☾ ☽ ⚡ ☄ ☘ ❦ ❧ ⚘ ⚜ ☙'.split(' '),
  },
  {
    label: 'Info, Peringatan & Rujukan',
    emojis: 'ℹ ⚠ Ⓘ ⓘ № § ¶ † ‡ ※ ◊ • ‣ ◦ « » " " \' \' ⟨ ⟩'.split(' '),
  },
  {
    label: 'Lingkaran Angka & Huruf',
    emojis: '① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ ⒜ ⒝ ⒞'.split(' '),
  },
  {
    label: 'Musik, Kartu & Lainnya',
    emojis: '♩ ♪ ♫ ♬ ♠ ♣ ♥ ♦ ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ ⚭ ⚮ ⚑ ⚐ ⛳ ⚲'.split(' '),
  },
];
