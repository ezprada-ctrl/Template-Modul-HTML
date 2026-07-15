import { Fragment, useEffect, useState } from 'react';
import type { BlockType } from '../types';

/**
 * Scoped, self-contained copy of the learner-facing block CSS (from
 * server/api/shell-template.html) so the dropdown preview looks 1:1 like
 * the real generated output. Kept isolated under .pbp-scope so it never
 * leaks into the rest of the editor UI.
 */
export const BLOCK_PREVIEW_STYLES = `
.pbp-scope, .pbp-scope *{box-sizing:border-box;}
.pbp-scope{
  --bg:#ffffff;--bg-soft:#f6f7fa;--surface:#ffffff;--surface-2:#f1f3f7;
  --border:rgba(22,33,62,.10);--border-strong:rgba(22,33,62,.18);
  --text:#16213e;--text-dim:#4d5876;--text-faint:#8891a8;
  --accent:#c99a3d;--accent-2:#b3822a;--accent-soft:rgba(201,154,61,.14);
  --accent-glow:rgba(201,154,61,.45);--on-accent:#2a1c04;--navy:#1b2a4a;
  --amber-soft:rgba(201,154,61,.14);--rose:#c04a44;--rose-soft:rgba(192,74,68,.10);
  --blue-soft:rgba(47,102,144,.10);--violet:#2f7d70;--violet-soft:rgba(47,125,112,.18);
  --green:#2f9e6a;--green-soft:rgba(47,158,106,.14);
  --radius-lg:22px;--radius-md:16px;--radius-sm:10px;
  --shadow-md:0 10px 26px -14px rgba(22,33,62,.16);
  font-family:'Inter',system-ui,sans-serif;font-size:13px;color:var(--text);
  background:var(--bg-soft);padding:16px;border-radius:14px;width:280px;
  overflow:auto;max-height:340px;
}
.pbp-scope .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;box-shadow:var(--shadow-md);}
.pbp-scope .card h3{font-size:14px;font-weight:700;margin:0 0 10px;display:flex;align-items:center;gap:8px;color:var(--navy);}
.pbp-scope .card h3 .ic{width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;background:var(--accent-soft);color:var(--accent-2);}
.pbp-scope .card p{margin:0;line-height:1.55;color:var(--text-dim);font-size:12.5px;}

.pbp-scope .definition{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;position:relative;margin-top:10px;box-shadow:var(--shadow-md);}
.pbp-scope .definition .tag{position:absolute;top:-10px;left:16px;background:var(--accent);color:var(--on-accent);font-size:9.5px;font-weight:800;letter-spacing:.06em;padding:3px 10px;border-radius:20px;text-transform:uppercase;}
.pbp-scope .definition p{margin:6px 0 0;line-height:1.55;color:var(--text-dim);font-size:12.5px;}
.pbp-scope .definition b{color:var(--accent-2);}

.pbp-scope .pull-quote{margin:10px 0;padding:16px 8px;text-align:center;border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);}
.pbp-scope .pull-quote .pq-num{display:block;font-size:32px;font-weight:800;color:var(--accent-2);line-height:1.05;}
.pbp-scope .pull-quote .pq-text{display:block;margin:6px auto 0;font-size:12px;color:var(--text-dim);line-height:1.5;}

.pbp-scope .callout{border-radius:var(--radius-md);padding:12px 14px;border:1px solid;font-size:12.5px;line-height:1.55;display:flex;gap:10px;}
.pbp-scope .callout .ic{font-size:15px;flex-shrink:0;}
.pbp-scope .callout .ic-badge{width:22px;height:22px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;}
.pbp-scope .callout.amber{background:var(--amber-soft);border-color:rgba(201,154,61,.3);}
.pbp-scope .callout p{margin:0;color:var(--text-dim);}
.pbp-scope .callout b{color:var(--text);}

.pbp-scope .badge-ref{display:inline-block;font-size:10.5px;font-weight:700;color:var(--text-dim);background:var(--surface-2);border:1px solid var(--border);padding:3px 10px;border-radius:20px;letter-spacing:.02em;}

.pbp-scope ul.tick, .pbp-scope ol.tick{list-style:none;margin:0;padding:0;counter-reset:tk;}
.pbp-scope ul.tick li, .pbp-scope ol.tick li{position:relative;padding-left:20px;font-size:12.5px;line-height:1.5;color:var(--text-dim);margin-bottom:6px;counter-increment:tk;}
.pbp-scope ul.tick li::before{content:"";position:absolute;left:0;top:6px;width:6px;height:6px;border-radius:50%;background:var(--accent);}
.pbp-scope ol.tick li::before{content:counter(tk);position:absolute;left:0;top:0;width:18px;height:18px;border-radius:6px;background:var(--accent-soft);color:var(--accent-2);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;}

.pbp-scope .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}

.pbp-scope .flow{display:flex;align-items:stretch;gap:0;overflow-x:auto;padding:4px 2px 10px;}
.pbp-scope .flow-step{flex:1;min-width:84px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;position:relative;transition:.25s;cursor:default;}
.pbp-scope .flow-step.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 14px 30px -14px var(--accent-glow);transform:translateY(-2px);}
.pbp-scope .flow-step .fs-num{width:20px;height:20px;border-radius:6px;background:var(--accent-soft);color:var(--accent-2);font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
.pbp-scope .flow-step .fs-title{font-size:11px;font-weight:700;color:var(--text);line-height:1.3;}
.pbp-scope .flow-arrow{flex:0 0 16px;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:13px;}
.pbp-scope .flow-detail{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;font-size:12px;line-height:1.5;color:var(--text-dim);margin-top:8px;transition:opacity .2s;}
.pbp-scope .flow-detail b{color:var(--accent-2);}

.pbp-scope .tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.pbp-scope .tab-btn{padding:6px 12px;border-radius:20px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-faint);font-size:11.5px;font-weight:700;transition:.2s;}
.pbp-scope .tab-btn.active{background:var(--navy);border-color:var(--navy);color:#f6d998;}
.pbp-scope .tab-panel{display:none;font-size:12px;line-height:1.55;color:var(--text-dim);}
.pbp-scope .tab-panel.active{display:block;animation:pbpRiseIn .3s ease;}

.pbp-scope .dtable{width:100%;border-collapse:collapse;font-size:11.5px;}
.pbp-scope .dtable th{background:var(--navy);color:#f6d998;font-weight:700;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.04em;}
.pbp-scope .dtable td{padding:8px 10px;border-top:1px solid var(--border);color:var(--text-dim);}

.pbp-scope .timeline{display:flex;flex-direction:column;gap:0;margin:4px 0;}
.pbp-scope .tl-item{display:flex;gap:12px;position:relative;padding-bottom:18px;}
.pbp-scope .tl-item:last-child{padding-bottom:0;}
.pbp-scope .tl-dot-wrap{display:flex;flex-direction:column;align-items:center;}
.pbp-scope .tl-dot{width:11px;height:11px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--accent-soft);flex-shrink:0;margin-top:2px;}
.pbp-scope .tl-item-line{flex:1;width:2px;background:var(--border-strong);margin-top:3px;}
.pbp-scope .tl-item:last-child .tl-item-line{display:none;}
.pbp-scope .tl-content .tl-time{font-size:9.5px;font-weight:800;color:var(--accent-2);letter-spacing:.03em;text-transform:uppercase;margin-bottom:2px;}
.pbp-scope .tl-content .tl-title{font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:2px;}
.pbp-scope .tl-content .tl-desc{font-size:11px;color:var(--text-dim);line-height:1.45;}

.pbp-scope .acc-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:8px;overflow:hidden;box-shadow:var(--shadow-md);}
.pbp-scope .acc-head{width:100%;display:flex;align-items:center;gap:10px;padding:11px 14px;background:transparent;border:none;color:var(--text);font-size:12px;font-weight:600;text-align:left;}
.pbp-scope .acc-head .acc-n{min-width:22px;height:22px;padding:0 5px;border-radius:6px;background:var(--accent-soft);color:var(--accent-2);font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pbp-scope .acc-head .acc-chevron{margin-left:auto;color:var(--text-faint);transition:transform .2s;font-size:10px;}
.pbp-scope .acc-item.open .acc-chevron{transform:rotate(180deg);}
.pbp-scope .acc-body{max-height:0;overflow:hidden;transition:max-height .35s ease;}
.pbp-scope .acc-item.open .acc-body{max-height:200px;}
.pbp-scope .acc-body-inner{padding:0 14px 13px 46px;font-size:11.5px;color:var(--text-dim);line-height:1.5;}

.pbp-scope .modal-demo{position:relative;height:150px;}
.pbp-scope .modal-trigger{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text);font-size:12px;font-weight:600;box-shadow:var(--shadow-md);}
.pbp-scope .modal-trigger .ic{width:22px;height:22px;border-radius:7px;background:var(--accent-soft);color:var(--accent-2);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}
.pbp-scope .modal-trigger .chevron{margin-left:auto;color:var(--text-faint);font-size:11px;}
.pbp-scope .modal-overlay{position:absolute;inset:0;background:rgba(22,33,62,.35);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s ease;}
.pbp-scope .modal-overlay.open{opacity:1;}
.pbp-scope .modal-box{width:90%;background:var(--surface);border-radius:var(--radius-md);padding:14px;box-shadow:var(--shadow-md);transform:translateY(8px) scale(.97);opacity:0;transition:.25s ease;}
.pbp-scope .modal-overlay.open .modal-box{transform:translateY(0) scale(1);opacity:1;}
.pbp-scope .modal-box h3{font-size:13px;font-weight:800;color:var(--navy);margin:0 0 6px;}
.pbp-scope .modal-box p{margin:0;font-size:11.5px;line-height:1.5;color:var(--text-dim);}

.pbp-scope .html-demo{background:var(--surface);border:1px dashed var(--border-strong);border-radius:var(--radius-md);padding:12px;font-family:ui-monospace,monospace;font-size:11px;color:var(--text-dim);line-height:1.6;}
.pbp-scope .image-demo{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px;box-shadow:var(--shadow-md);}
.pbp-scope .image-demo .ph{width:100%;height:90px;border-radius:10px;background:linear-gradient(135deg,var(--accent-soft),var(--surface-2));display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--accent-2);}
.pbp-scope .image-demo .cap{margin:8px 0 0;font-size:11px;color:var(--text-faint);}

@keyframes pbpRiseIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
`;

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
];

// Same auto-cycling as before, but pauses ~260ms before each step change so a
// fake cursor (see ClickCursor) can "click" the upcoming item first — makes
// it visually obvious these previews are showing a click-to-reveal
// interaction, not just an unprompted slideshow.
const CLICK_PAUSE_MS = 260;

function useCycleWithClick(length: number, intervalMs: number) {
  const [i, setI] = useState(0);
  const [clicking, setClicking] = useState(false);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => {
      setClicking(true);
      setTimeout(() => {
        setI(v => (v + 1) % length);
        setClicking(false);
      }, CLICK_PAUSE_MS);
    }, intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return { index: i, clicking };
}

function useBlinkWithClick(onMs: number, offMs: number) {
  const [on, setOn] = useState(false);
  const [clicking, setClicking] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      setClicking(true);
      setTimeout(() => {
        setOn(v => !v);
        setClicking(false);
      }, CLICK_PAUSE_MS);
    }, on ? onMs : offMs);
    return () => clearTimeout(id);
  }, [on, onMs, offMs]);
  return { on, clicking };
}

// Small hand-cursor glyph that "clicks" the element it's anchored to. The
// parent must be `position:relative`; this renders absolutely in its
// top-right corner, hidden until `show` flips true right before the state
// change it's pointing at.
function ClickCursor({ show }: { show: boolean }) {
  return (
    <span style={{
      position: 'absolute', top: show ? -6 : -20, right: -4, fontSize: 15,
      transition: 'top .25s ease, transform .25s ease, opacity .25s ease',
      transform: show ? 'scale(0.85)' : 'scale(1)', opacity: show ? 1 : 0,
      pointerEvents: 'none', zIndex: 5,
    }}>
      👆
    </span>
  );
}

export default function BlockPreviewCard({ type }: { type: BlockType }) {
  switch (type) {
    case 'card':
      return (
        <div className="pbp-scope">
          <div className="card">
            <h3><span className="ic">📌</span>Judul Kartu</h3>
            <p>{LOREM[0]} {LOREM[1]}</p>
          </div>
        </div>
      );
    case 'callout':
      return (
        <div className="pbp-scope">
          <div className="callout amber">
            <span className="ic-badge">!</span>
            <p>{LOREM[0]} {LOREM[2]}</p>
          </div>
        </div>
      );
    case 'definition':
      return (
        <div className="pbp-scope">
          <div className="definition">
            <span className="tag">DEFINISI</span>
            <p><b>Lorem ipsum</b> {LOREM[1].toLowerCase()}</p>
          </div>
        </div>
      );
    case 'pullquote':
      return (
        <div className="pbp-scope">
          <div className="pull-quote">
            <span className="pq-num">87%</span>
            <span className="pq-text">{LOREM[0]}</span>
          </div>
        </div>
      );
    case 'ticklist':
      return (
        <div className="pbp-scope">
          <ul className="tick">
            <li>{LOREM[0]}</li>
            <li>{LOREM[1]}</li>
            <li>{LOREM[2]}</li>
          </ul>
        </div>
      );
    case 'accordion': {
      return <AccordionDemo />;
    }
    case 'tabs': {
      return <TabsDemo />;
    }
    case 'timeline':
      return (
        <div className="pbp-scope">
          <div className="timeline">
            {['2024', '2025', '2026'].map((t, i) => (
              <div className="tl-item" key={t}>
                <div className="tl-dot-wrap"><div className="tl-dot" /><div className="tl-item-line" /></div>
                <div className="tl-content">
                  <div className="tl-time">{t}</div>
                  <div className="tl-title">{LOREM[i].split(',')[0]}</div>
                  <div className="tl-desc">{LOREM[(i + 1) % LOREM.length]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'dtable':
      return (
        <div className="pbp-scope">
          <table className="dtable">
            <thead><tr><th>Kolom Satu</th><th>Kolom Dua</th></tr></thead>
            <tbody>
              <tr><td>Lorem ipsum</td><td>Dolor sit amet</td></tr>
              <tr><td>Consectetur</td><td>Adipiscing elit</td></tr>
            </tbody>
          </table>
        </div>
      );
    case 'flow': {
      return <FlowDemo />;
    }
    case 'grid':
      return (
        <div className="pbp-scope">
          <div className="grid2">
            <div className="card"><h3>Lorem</h3><p>{LOREM[0]}</p></div>
            <div className="card"><h3>Ipsum</h3><p>{LOREM[1]}</p></div>
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="pbp-scope">
          <div className="image-demo">
            <div className="ph">🖼️</div>
            <p className="cap">Lorem ipsum caption gambar</p>
          </div>
        </div>
      );
    case 'badgeref':
      return (
        <div className="pbp-scope">
          <span className="badge-ref">Pasal 1 · Lorem Ipsum 00/0000</span>
        </div>
      );
    case 'html':
      return (
        <div className="pbp-scope">
          <div className="html-demo">&lt;p&gt;{LOREM[0]}&lt;/p&gt;</div>
        </div>
      );
    case 'modal': {
      return <ModalDemo />;
    }
    default:
      return null;
  }
}

function AccordionDemo() {
  const { index: open, clicking } = useCycleWithClick(2, 1400);
  const nextOpen = (open + 1) % 2;
  return (
    <div className="pbp-scope">
      {[0, 1].map(i => (
        // acc-item itself needs overflow:hidden for the collapse animation,
        // which would clip the cursor if it lived inside — so the cursor is
        // anchored to this outer (overflow-visible) wrapper instead.
        <div key={i} style={{ position: 'relative' }}>
          <div className={`acc-item${open === i ? ' open' : ''}`}>
            <button className="acc-head" type="button">
              <span className="acc-n">{String.fromCharCode(97 + i)}</span>
              <span>{i === 0 ? 'Lorem ipsum dolor' : 'Consectetur adipiscing'}</span>
              <span className="acc-chevron">⌄</span>
            </button>
            <div className="acc-body"><div className="acc-body-inner">{LOREM[i]}</div></div>
          </div>
          <ClickCursor show={clicking && nextOpen === i} />
        </div>
      ))}
    </div>
  );
}

function TabsDemo() {
  const { index: active, clicking } = useCycleWithClick(3, 1200);
  const nextActive = (active + 1) % 3;
  const labels = ['Tab Satu', 'Tab Dua', 'Tab Tiga'];
  return (
    <div className="pbp-scope">
      <div className="tabs">
        {labels.map((l, i) => (
          <span key={l} style={{ position: 'relative', display: 'inline-block' }}>
            <button className={`tab-btn${active === i ? ' active' : ''}`} type="button">{l}</button>
            <ClickCursor show={clicking && nextActive === i} />
          </span>
        ))}
      </div>
      {labels.map((l, i) => (
        <div className={`tab-panel${active === i ? ' active' : ''}`} key={l}>{LOREM[i]}</div>
      ))}
    </div>
  );
}

function FlowDemo() {
  const { index: active, clicking } = useCycleWithClick(3, 1300);
  const nextActive = (active + 1) % 3;
  const steps = [
    { n: 1, title: 'Lorem ipsum' },
    { n: 2, title: 'Tempor incididunt' },
    { n: 3, title: 'Quis nostrud' },
  ];
  return (
    <div className="pbp-scope">
      <div className="card">
        <div className="flow">
          {steps.map((s, i) => (
            <Fragment key={s.n}>
              <div className={`flow-step${active === i ? ' active' : ''}`} style={{ position: 'relative' }}>
                <div className="fs-num">{s.n}</div>
                <div className="fs-title">{s.title}</div>
                <ClickCursor show={clicking && nextActive === i} />
              </div>
              {i < steps.length - 1 && <div className="flow-arrow">›</div>}
            </Fragment>
          ))}
        </div>
        <div className="flow-detail"><b>{steps[active].title}.</b> {LOREM[active]}</div>
      </div>
    </div>
  );
}

function ModalDemo() {
  const { on: open, clicking } = useBlinkWithClick(1300, 900);
  return (
    <div className="pbp-scope">
      <div className="modal-demo">
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <button className="modal-trigger" type="button">
            <span className="ic">📝</span><span>Info Tambahan</span><span className="chevron">›</span>
          </button>
          <ClickCursor show={clicking} />
        </span>
        <div className={`modal-overlay${open ? ' open' : ''}`}>
          <div className="modal-box">
            <h3>Info Tambahan</h3>
            <p>{LOREM[0]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
