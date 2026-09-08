// Kumpulan ikon buat pemilih icon (EmojiPicker).
//
// Dulu berkas ini SENGAJA cuma berisi simbol garis monokrom dan menolak emoji
// berwarna, dengan alasan modulnya bergaya navy/emas yang formal. Alasan itu
// gak salah, tapi ternyata terlalu sempit di praktiknya: penyusun modul minta
// pilihan yang jauh lebih banyak DAN yang berwarna, karena satu ikon berwarna
// yang tepat (🏨 buat pajak hotel, 🎪 buat pajak hiburan, ⛏️ buat MBLB) lebih
// cepat dikenali peserta daripada bentuk geometris netral.
//
// Jadi sekarang keduanya disediakan dan DIPISAH per kategori: yang butuh
// aksen kalem tinggal ambil dari kategori garis di atas, yang butuh penanda
// mencolok ambil dari kategori berwarna di bawah. Pilihannya di tangan
// penyusun, bukan dikunci berkas ini.
//
// Kategori berwarna sengaja disusun mengikuti bahan yang memang sering
// digarap di sini - pajak & retribusi daerah: uang, gedung, hukum,
// transportasi, hotel/restoran, hiburan/reklame, tambang & energi.

export const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Panah & Alur',
    emojis: '→ ← ↑ ↓ ↔ ↕ ↗ ↘ ↙ ↖ ⇒ ⇐ ⇔ ⇑ ⇓ ➜ ➔ ➤ ➢ ➣ ➥ ➦ ⤴ ⤵ ↩ ↪ ⟲ ⟳ ↻ ↺ ⇄ ⇆ ⇌ ⤳ ⟶ ⟵ ⟷ ⇉ ⇇ ⇅ ⇵ ↰ ↱ ↲ ↳ ↴ ↵ ⤶ ⤷ ⇱ ⇲ ➙ ➛ ➝ ➞ ➟ ➠ ➡ ⬅ ⬆ ⬇ ↝ ↭ ⇜ ⇝ ⤺ ⤻'.split(' '),
  },
  {
    label: 'Bentuk & Bullet',
    emojis: '● ○ ◐ ◑ ◒ ◓ ◆ ◇ ◈ ■ □ ▪ ▫ ▲ △ ▶ ▷ ◀ ◁ ▼ ▽ ⬟ ⬠ ⬡ ⬢ ⬣ ◉ ◎ ⊙ ⬤ ▰ ▱ ◼ ◻ ◾ ◽ ▣ ▤ ▥ ▦ ▧ ▨ ▩ ◘ ◙ ◚ ◛ ◜ ◝ ◞ ◟ ⬥ ⬦ ⬧ ⬨ ⬩ ⏢ ⌬ ⎔ ▬ ▭ ◧ ◨ ◩ ◪'.split(' '),
  },
  {
    label: 'Bintang & Aksen',
    emojis: '★ ☆ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ⁂ ❋ ❁ ❀ ✿ ✽ ✾ ⚝ ✺ ✹ ✸ ❃ ❊ ❉ ⭑ ⭒ ✵ ✷ ✶ ✴ ✳ ❂ ❈ ❅ ❆ ✢ ✣ ✤ ✥ ❄ ⋆ ∗ ⁕ ⚹ ✻ ✼'.split(' '),
  },
  {
    label: 'Centang, Silang & Matematika',
    emojis: '✓ ✔ ✗ ✘ ☑ ☒ ➕ ➖ ➗ ✕ ✖ ⊘ ⊗ ⊕ ∴ ∵ ∞ ≈ ≠ ≤ ≥ ± × ÷ % # ✱ ✲ ‼ ⁇ ⁈ ⁉ √ ∛ ∑ ∏ ∫ ∆ ∇ ∈ ∉ ⊂ ⊃ ∪ ∩ ∅ ⌀ ≡ ≢ ≪ ≫ ⇢ ∠ ⊥ ∥ ‰ ‱ ℅ №'.split(' '),
  },
  {
    label: 'Alat Tulis & Simbol (garis)',
    emojis: '✎ ✏ ✐ ✑ ✒ ✂ ✃ ✄ ✉ ☏ ⌨ ⌚ ⏱ ⏰ ⌛ ⏳ ⌘ ⌥ ⎋ ⚙ ⚖ ⚗ ⚒ ⛏ ⚔ ⇧ ⏎ ⌫ ⌦ ⏏ ⎙ ⌂ ⌗ ⌖ ⍟ ⎈ ⏻ ⏼ ⏽ ⭘ ⚿'.split(' '),
  },
  {
    label: 'Alam & Cuaca (garis)',
    emojis: '☀ ☁ ☂ ☔ ☃ ❄ ☾ ☽ ⚡ ☄ ☘ ❦ ❧ ⚘ ⚜ ☙ ☼ ♁ ⚚ ⚛ ☯ ⚕ ⛆ ⛇ ⛄ ⛅ ⛈ ☈ ☊ ☋'.split(' '),
  },
  {
    label: 'Info, Peringatan & Rujukan',
    emojis: 'ℹ ⚠ Ⓘ ⓘ № § ¶ † ‡ ※ ◊ • ‣ ◦ « » " \' ⟨ ⟩'.split(' '),
  },
  {
    label: 'Lingkaran Angka & Huruf',
    emojis: '① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩ ⑪ ⑫ ⑬ ⑭ ⑮ ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ ⓐ ⓑ ⓒ ⓓ ⓔ ⒜ ⒝ ⒞ ⒈ ⒉ ⒊'.split(' '),
  },
  {
    label: 'Musik, Kartu & Lainnya',
    emojis: '♩ ♪ ♫ ♬ ♭ ♮ ♯ ♠ ♣ ♥ ♦ ♤ ♧ ♡ ♢ ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ ⚭ ⚮ ⚑ ⚐ ⛳ ⚲ ⌸ ⌹ ⚓ ⚒ ⚔ ⚖ ⚙ ☎ ☑'.split(' '),
  },
  {
    label: 'Uang, Pajak & Keuangan',
    emojis: '💰 💵 💴 💶 💷 🪙 💳 🧾 🏦 💸 📉 📈 💹 🧮 🪪 💲 🤑 🏧 💱 📊 🗃️ 📇 ⚖️ 🧑‍💼 🕴️'.split(' '),
  },
  {
    label: 'Dokumen & Berkas (warna)',
    emojis: '📄 📃 📑 📋 📁 📂 🗂️ 🗃️ 🗄️ 📊 📈 📉 📌 📍 📎 🖇️ 📝 ✏️ 🖊️ 🖋️ 🖍️ 📐 📏 ✂️ 🗒️ 📔 📕 📗 📘 📙 📓 📒 🔖 🏷️ 📜 📰 🗞️ 🖨️ 📤 📥 🗳️'.split(' '),
  },
  {
    label: 'Gedung, Tempat & Wilayah',
    emojis: '🏛️ 🏢 🏬 🏦 🏫 🏥 🏭 🏗️ 🏘️ 🏠 🏡 🏚️ 🏟️ ⛲ 🗺️ 🌆 🌇 🏙️ 🏞️ 🛣️ 🛤️ 🧱 🚏 🏪 🏨 🏩 ⛪ 🕌 🛕 🏝️ 🗻 🌋'.split(' '),
  },
  {
    label: 'Orang & Peran',
    emojis: '👤 👥 🧑‍💼 👨‍💼 👩‍💼 🧑‍⚖️ 👮 🧑‍🏫 👨‍🏫 👩‍🏫 🧑‍💻 🧑‍🌾 👷 🧑‍🔧 🧑‍🍳 🤝 🙋 🙌 👏 💪 🫱 🧑‍🎓 👨‍🎓 👩‍🎓 🗣️ 👀 🧍 🧑‍🤝‍🧑'.split(' '),
  },
  {
    label: 'Hukum & Pemerintahan',
    emojis: '⚖️ 🏛️ 📜 🗳️ 🔨 🪧 🛡️ 🎖️ 🏅 🥇 📛 🔏 🔐 🔒 🔓 🗝️ 🔑 ⛓️ 🚨 👮‍♂️ 👮‍♀️ 📢 🧑‍⚖️'.split(' '),
  },
  {
    label: 'Pendidikan & Ide',
    emojis: '📚 📖 🎓 🧑‍🎓 🔬 🔭 🧪 💡 🧠 ❓ ❔ ❗ ❕ 💭 🗨️ 🧩 🎯 🔎 🔍 ✍️ 🧑‍🏫 🅰️ 🆎 🆕 🆗 🆙 🆒 🔤 🔡 🔠'.split(' '),
  },
  {
    label: 'Waktu & Kalender',
    emojis: '⏰ ⏱️ ⏲️ ⌛ ⏳ 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛 📅 📆 🗓️ 🕰️ ⌚ 📴 🔄 🔁 🔂 ⏩ ⏪ ⏭️ ⏮️ ⏸️ ⏹️ ▶️'.split(' '),
  },
  {
    label: 'Teknologi & Data',
    emojis: '💻 🖥️ ⌨️ 🖱️ 📱 📲 💾 💿 📀 🖨️ 🌐 🔗 📡 🛰️ 🔌 🔋 🪫 🖲️ 💽 🧲 ⚙️ 🛠️ 🔧 🔩 🧰 📶 🛜 🔦'.split(' '),
  },
  {
    label: 'Komunikasi & Pemberitahuan',
    emojis: '📢 📣 🔔 🔕 📞 ☎️ 📠 ✉️ 📧 📨 📩 📬 📭 📮 💬 💭 🗨️ 🗯️ 📤 📥 📪 📫 🔊 🔉 🔈 🔇 📳 📯'.split(' '),
  },
  {
    label: 'Transportasi & Kendaraan',
    emojis: '🚗 🚕 🚙 🚌 🚐 🚚 🚛 🚜 🏍️ 🛵 🚲 🛴 🚂 🚆 🚇 🚊 ✈️ 🛫 🛬 🚢 ⛴️ 🛶 ⛽ 🛣️ 🚦 🚧 🅿️ 🚏 🛻 🚑 🚒'.split(' '),
  },
  {
    label: 'Alam & Cuaca (warna)',
    emojis: '☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ⛄ 🌊 💧 💦 🔥 🌈 🌙 ⭐ 🌟 💫 ✨ 🌱 🌿 🍀 🌳 🌲 🌴 🌵 🍃 🌺 🌻 🌸 🌼 🪨 ⛰️ 🏔️'.split(' '),
  },
  {
    label: 'Tanda, Status & Warna',
    emojis: '✅ ❌ ⭕ 🚫 ⚠️ ❗ ❓ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔶 🔷 🔸 🔹 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 ☑️ ✔️ ✖️ ➕ ➖ 💯 🆓 🔝 🔜'.split(' '),
  },
  {
    label: 'Tangan & Isyarat',
    emojis: '👍 👎 👌 ✌️ 🤝 👉 👈 👆 👇 ✋ 🤚 🖐️ 🖖 🤙 🤞 🫰 🫵 👊 ✊ 🙏 💪 🫸 🫷'.split(' '),
  },
  {
    label: 'Usaha, Hotel & Restoran',
    emojis: '🍽️ 🍴 🥄 ☕ 🍵 🥤 🧋 🍚 🍜 🍲 🏪 🏨 🛏️ 🛎️ 🧳 🛒 🛍️ 🧺 🪑 🚿 🛁 🧴 💈 🎂 🍰'.split(' '),
  },
  {
    label: 'Hiburan & Reklame',
    emojis: '🎬 🎤 🎵 🎶 🎼 🎪 🎨 🖼️ 📺 📻 🎮 🕹️ 🎯 🎫 🎟️ 🪧 🎠 🎡 🎢 🎳 🎲 🃏 🎰 🕺 💃 🎧 📸 📷 📹 🎥'.split(' '),
  },
  {
    label: 'Energi, Tambang & Industri',
    emojis: '⚡ 🔌 💡 🔋 ⛏️ 🪨 🛢️ 🏭 ⚙️ 🔩 🧱 🪵 🪚 🔨 🛠️ ⚒️ 🧰 🚰 💧 ♻️ 🌡️ 🧯 ⛽ 🔥'.split(' '),
  },
];
