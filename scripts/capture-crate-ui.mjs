// Capture pieces of Crate's UI from the live demo, at 2x, for the portfolio cover (scripts/make-crate-cover.mjs).
//   node scripts/capture-crate-ui.mjs <out folder>/
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || '/tmp/crate-ui/';   // where the captured pieces go
mkdirSync(OUT, { recursive: true });
const PORT = 9346;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=/private/tmp/claude-501/-Users-iankim-Desktop-portfolio-handoff/1c64f9c6-b383-4b89-b550-e157c8dc9bfc/scratchpad/.chrome-cap2', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const rect = async (sel) => JSON.parse(await ev(`JSON.stringify((() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })())`));
const clip = async (name, sel, w, h) => {
  const [x, y, rw, rh] = await rect(sel);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w ?? rw, height: h ?? rh, scale: 2 } });
  writeFileSync(OUT + name + '.png', Buffer.from(shot.result.data, 'base64')); console.log(name, Math.round(w ?? rw), Math.round(h ?? rh));
};
const click = (label) => ev(`[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === ${JSON.stringify(label)} || b.textContent.trim() === ${JSON.stringify(label)})?.click()`);

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1025, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'https://kkim248.github.io/Crate/' }); await sleep(6000);
await clip('library', '.listpanel', 640, 640);
await clip('detail', '.panel.detail', 380, 600);
await clip('filters', '.panel.filters', 264, 560);
await click('Listen'); await sleep(3500);
await clip('listen', '.panel.np');
await clip('upnext', '.panel.upnext', 340, 520);
await click('Recap'); await sleep(3000);
await clip('recap-a', '.tile.a'); await clip('recap-b', '.tile.b'); await clip('recap-e', '.tile.e');
ws.close(); chrome.kill();
