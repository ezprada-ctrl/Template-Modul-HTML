export interface GraphicStylePreviewSet {
  cover: string;
  content: string;
  ending: string;
}

// Markup dekorasi buat preview hover di GraphicStyleSelect.tsx, ditulis dalam
// skala panel mockup (panel 158px lebar, rasio 4:3).
//
// Angka-angka di sini adalah ANGKA YANG SAMA PERSIS dengan GRAPHIC_DECO di
// server/api/generator.py - generator mengonversinya ke unit relatif kontainer
// (cqmin/cqw) pas export, jadi modul asli tampil dengan proporsi identik sama
// preview ini di ukuran render apa pun. Kalau komposisi sebuah gaya diubah,
// UBAH DI KEDUA FILE dengan angka yang sama; begitu angkanya beda, preview
// hover berhenti mewakili hasil aslinya - itu persis bug yang pernah kejadian
// (dulu generator pakai px tetap hasil skala 3.3x, hasilnya dekorasi kelihatan
// raksasa di panel preview builder tapi kekecilan di layar penuh).
//
// Sengaja diduplikasi (bukan ambil dari satu sumber) supaya hover langsung
// nampil tanpa round-trip ke backend tiap gerak mouse.
// Every div is fully self-contained (position/shape/color all inline) - no
// dependency on a shared CSS class - so this file has zero risk of colliding
// with any existing builder-app styling.
export const GRAPHIC_STYLE_PREVIEWS: Record<string, GraphicStylePreviewSet> = {
  blob: {
    cover:
      '<div style="position:absolute;width:150px;height:138px;right:-46px;bottom:-40px;opacity:.35;background:var(--accent);border-radius:42% 58% 65% 35% / 45% 40% 60% 55%;"></div>' +
      '<div style="position:absolute;width:78px;height:70px;left:-22px;top:-20px;opacity:.16;background:var(--navy);border-radius:58% 42% 35% 65% / 55% 60% 40% 45%;"></div>',
    content:
      '<div style="position:absolute;width:62px;height:56px;right:-16px;top:-14px;opacity:.10;background:var(--accent);border-radius:40% 60% 55% 45% / 55% 45% 60% 40%;"></div>',
    ending:
      '<div style="position:absolute;width:96px;height:88px;left:-28px;top:-24px;opacity:.22;background:var(--accent);border-radius:48% 52% 40% 60% / 50% 45% 55% 50%;"></div>' +
      '<div style="position:absolute;width:96px;height:88px;right:-28px;bottom:-24px;opacity:.22;background:var(--navy);border-radius:52% 48% 60% 40% / 50% 55% 45% 50%;"></div>',
  },
  'gradient-orb': {
    cover: '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:190px;height:190px;right:-64px;top:-70px;"></div>',
    content: '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:44px;height:44px;right:10px;top:6px;"></div>',
    ending:
      '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:70px;height:70px;left:-18px;bottom:-26px;"></div>' +
      '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:42px;height:42px;left:56px;bottom:-14px;"></div>' +
      '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:54px;height:54px;right:14px;bottom:-20px;"></div>' +
      '<div style="position:absolute;border-radius:50%;background:radial-gradient(circle, var(--accent-glow), transparent 72%);filter:blur(1px);width:30px;height:30px;right:96px;bottom:4px;"></div>',
  },
  'dot-grid': {
    cover:
      '<div style="position:absolute;background-image:radial-gradient(var(--accent) 1.2px, transparent 1.5px);background-size:12px 12px;width:150px;height:150px;right:-10px;bottom:-10px;opacity:.55;' +
      '-webkit-mask-image:radial-gradient(circle at 100% 100%, black 0%, black 25%, transparent 72%);mask-image:radial-gradient(circle at 100% 100%, black 0%, black 25%, transparent 72%);"></div>',
    content:
      '<div style="position:absolute;background-image:radial-gradient(var(--accent) 1.2px, transparent 1.5px);background-size:12px 12px;width:64px;height:64px;right:0;top:0;opacity:.35;' +
      '-webkit-mask-image:radial-gradient(circle at 100% 0%, black 0%, black 15%, transparent 75%);mask-image:radial-gradient(circle at 100% 0%, black 0%, black 15%, transparent 75%);"></div>',
    ending:
      '<div style="position:absolute;background-image:radial-gradient(var(--accent) 1.2px, transparent 1.5px);background-size:12px 12px;left:0;right:0;bottom:0;height:54px;opacity:.4;' +
      '-webkit-mask-image:linear-gradient(to top, black 0%, transparent 100%);mask-image:linear-gradient(to top, black 0%, transparent 100%);"></div>',
  },
  'corner-bracket': {
    // Angka harus SAMA PERSIS dengan GRAPHIC_DECO di generator.py (lihat
    // catatan di atas file). cover/ending dikecilin 2x (46px->20px->12px,
    // 30px->16px->10px) - reach-nya ke tengah Sampul/Penutup tetap kena
    // titik kritis di kontainer PENDEK BANGET (matematisnya gak bisa 100%
    // dihindari lewat scaling doang, garis dikonten pendek dan posisi judul
    // sama-sama menyusut seiring tinggi kontainer) - makanya generator.py
    // juga nyembunyiin bracket total di kontainer di bawah 420px lewat
    // @container query, bukan diperkecil selamanya.
    cover:
      '<div style="position:absolute;width:12px;height:12px;left:10px;top:10px;border-top:2px solid var(--accent);border-left:2px solid var(--accent);opacity:.5;"></div>' +
      '<div style="position:absolute;width:12px;height:12px;right:10px;bottom:10px;border-bottom:2px solid var(--accent);border-right:2px solid var(--accent);opacity:.5;"></div>',
    content: '<div style="position:absolute;width:22px;height:22px;right:10px;top:10px;border-top:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.3;"></div>',
    ending:
      '<div style="position:absolute;width:10px;height:10px;left:8px;top:8px;border-top:1.6px solid var(--accent);border-left:1.6px solid var(--accent);opacity:.45;"></div>' +
      '<div style="position:absolute;width:10px;height:10px;right:8px;top:8px;border-top:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.45;"></div>' +
      '<div style="position:absolute;width:10px;height:10px;left:8px;bottom:8px;border-bottom:1.6px solid var(--accent);border-left:1.6px solid var(--accent);opacity:.45;"></div>' +
      '<div style="position:absolute;width:10px;height:10px;right:8px;bottom:8px;border-bottom:1.6px solid var(--accent);border-right:1.6px solid var(--accent);opacity:.45;"></div>',
  },
  'diagonal-block': {
    cover: '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:72px;height:64px;right:-12px;bottom:-10px;opacity:.26;background:var(--accent);"></div>',
    content: '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:52px;height:22px;right:-8px;top:-8px;background:var(--accent);opacity:.65;transform:rotate(8deg);"></div>',
    ending:
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:70px;height:64px;left:-14px;top:-12px;background:var(--navy);opacity:.4;transform:rotate(180deg);"></div>' +
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:70px;height:64px;right:-14px;bottom:-12px;background:var(--accent);opacity:.7;"></div>',
  },
  ring: {
    cover: '<div style="position:absolute;border-radius:50%;background:transparent;width:200px;height:200px;border:2px solid var(--accent);right:-70px;top:-84px;opacity:.4;"></div>',
    content: '<div style="position:absolute;border-radius:50%;background:transparent;width:40px;height:40px;border:1.5px solid var(--accent);right:8px;top:6px;opacity:.28;"></div>',
    ending:
      '<div style="position:absolute;border-radius:50%;background:transparent;width:64px;height:64px;border:1.6px solid var(--accent);left:-20px;bottom:-24px;opacity:.4;"></div>' +
      '<div style="position:absolute;border-radius:50%;background:transparent;width:40px;height:40px;border:1.6px solid var(--navy);left:30px;bottom:-10px;opacity:.35;"></div>' +
      '<div style="position:absolute;border-radius:50%;background:transparent;width:50px;height:50px;border:1.6px solid var(--accent);right:-6px;bottom:-18px;opacity:.3;"></div>',
  },
  'layered-triangle': {
    cover:
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:110px;height:100px;right:-18px;bottom:-16px;background:var(--accent);opacity:.24;transform:rotate(-6deg);"></div>' +
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:80px;height:74px;right:6px;bottom:-10px;background:var(--navy);opacity:.2;transform:rotate(10deg);"></div>',
    content: '<svg viewBox="0 0 40 40" style="position:absolute;right:4px;top:4px;width:26px;height:26px;"><polygon points="20,4 4,34 36,34" style="stroke:var(--accent);" stroke-width="1.6" fill="none" opacity="0.4"/></svg>',
    ending:
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:34px;height:30px;left:20px;bottom:6px;background:var(--accent);opacity:.3;transform:rotate(-14deg);"></div>' +
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:26px;height:24px;left:80px;bottom:26px;background:var(--navy);opacity:.25;transform:rotate(20deg);"></div>' +
      '<div style="position:absolute;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);width:30px;height:28px;right:24px;bottom:2px;background:var(--accent);opacity:.28;transform:rotate(8deg);"></div>',
  },
  confetti: {
    cover:
      '<div style="position:absolute;border-radius:50%;width:8px;height:8px;background:var(--accent);right:20px;bottom:60px;opacity:.6;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:5px;height:5px;background:var(--navy);right:56px;bottom:30px;opacity:.4;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:6px;height:6px;background:var(--accent);right:90px;bottom:70px;opacity:.5;"></div>' +
      '<div style="position:absolute;border-radius:2px;width:12px;height:3px;background:var(--accent-2);right:40px;bottom:44px;opacity:.55;transform:rotate(-24deg);"></div>' +
      '<div style="position:absolute;border-radius:50%;width:4px;height:4px;background:var(--navy);right:14px;bottom:20px;opacity:.45;"></div>' +
      '<div style="position:absolute;border-radius:2px;width:10px;height:3px;background:var(--accent);right:110px;bottom:36px;opacity:.4;transform:rotate(18deg);"></div>' +
      '<div style="position:absolute;border-radius:50%;width:6px;height:6px;background:var(--accent-2);right:70px;bottom:14px;opacity:.5;"></div>',
    content:
      '<div style="position:absolute;border-radius:50%;width:5px;height:5px;background:var(--accent);right:12px;top:8px;opacity:.5;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:3.5px;height:3.5px;background:var(--navy);right:26px;top:18px;opacity:.4;"></div>',
    ending:
      '<div style="position:absolute;border-radius:50%;width:6px;height:6px;background:var(--accent);left:16px;bottom:16px;opacity:.55;"></div>' +
      '<div style="position:absolute;border-radius:2px;width:11px;height:3px;background:var(--navy);left:44px;bottom:10px;opacity:.4;transform:rotate(-16deg);"></div>' +
      '<div style="position:absolute;border-radius:50%;width:4px;height:4px;background:var(--accent-2);left:80px;bottom:20px;opacity:.5;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:7px;height:7px;background:var(--accent);left:130px;bottom:8px;opacity:.5;"></div>' +
      '<div style="position:absolute;border-radius:2px;width:12px;height:3px;background:var(--accent);left:168px;bottom:16px;opacity:.45;transform:rotate(20deg);"></div>' +
      '<div style="position:absolute;border-radius:50%;width:5px;height:5px;background:var(--navy);right:24px;bottom:14px;opacity:.45;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:4px;height:4px;background:var(--accent-2);right:50px;bottom:22px;opacity:.4;"></div>',
  },
  'stacked-arc': {
    cover:
      '<div style="position:absolute;border-radius:50%;width:200px;height:200px;right:-110px;bottom:-120px;background:var(--accent);opacity:.16;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:150px;height:150px;right:-85px;bottom:-95px;background:var(--accent);opacity:.22;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:100px;height:100px;right:-58px;bottom:-68px;background:var(--navy);opacity:.28;"></div>',
    content:
      '<div style="position:absolute;border-radius:50%;width:56px;height:56px;right:-24px;top:-30px;background:var(--accent);opacity:.16;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:34px;height:34px;right:-12px;top:-16px;background:var(--accent);opacity:.22;"></div>',
    ending:
      '<div style="position:absolute;border-radius:50%;width:90px;height:90px;left:-50px;bottom:-56px;background:var(--accent);opacity:.18;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:60px;height:60px;left:-32px;bottom:-38px;background:var(--navy);opacity:.24;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:90px;height:90px;right:-50px;bottom:-56px;background:var(--navy);opacity:.18;"></div>' +
      '<div style="position:absolute;border-radius:50%;width:60px;height:60px;right:-32px;bottom:-38px;background:var(--accent);opacity:.24;"></div>',
  },
  'layered-rect': {
    cover:
      '<div style="position:absolute;border-radius:9px;background:transparent;width:90px;height:70px;border:1.6px solid var(--accent);right:-16px;bottom:-14px;opacity:.3;transform:rotate(-7deg);"></div>' +
      '<div style="position:absolute;border-radius:9px;background:transparent;width:90px;height:70px;border:1.6px solid var(--accent);right:-6px;bottom:-8px;opacity:.45;transform:rotate(2deg);"></div>' +
      '<div style="position:absolute;border-radius:9px;background:transparent;width:90px;height:70px;border:1.6px solid var(--navy);right:2px;bottom:-2px;opacity:.55;transform:rotate(9deg);"></div>',
    content: '<div style="position:absolute;border-radius:9px;background:transparent;width:30px;height:24px;border:1.4px solid var(--accent);right:6px;top:6px;opacity:.32;"></div>',
    ending:
      '<div style="position:absolute;border-radius:9px;background:transparent;width:50px;height:40px;border:1.5px solid var(--accent);left:-10px;top:-8px;opacity:.3;transform:rotate(-6deg);"></div>' +
      '<div style="position:absolute;border-radius:9px;background:transparent;width:50px;height:40px;border:1.5px solid var(--navy);left:-2px;top:-2px;opacity:.45;transform:rotate(4deg);"></div>' +
      '<div style="position:absolute;border-radius:9px;background:transparent;width:50px;height:40px;border:1.5px solid var(--navy);right:-10px;bottom:-8px;opacity:.3;transform:rotate(6deg);"></div>' +
      '<div style="position:absolute;border-radius:9px;background:transparent;width:50px;height:40px;border:1.5px solid var(--accent);right:-2px;bottom:-2px;opacity:.45;transform:rotate(-4deg);"></div>',
  },
};
