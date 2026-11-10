// Screenshots of sections of a page on the dev server, in headless Chrome, for checking layouts.
//   node scripts/shot.mjs <outdir> <path> <WxH,WxH> "<selector|selector>"
// writes <outdir>/<width>-<nn>.jpg, one per selector, each scrolled to that element
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const [, , outdir, path, sizesArg, selArg] = process.argv; mkdirSync(outdir, { recursive: true });
const sizes = sizesArg.split(',').map((s) => s.split('x').map(Number)); const sels = selArg.split('|');
const PORT = 9341;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${outdir}/../.chrome-shot`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Page.bringToFront');
for (const [w, h] of sizes) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  await send('Page.navigate', { url: `http://localhost:4321${path}` }); await sleep(5000);
  for (const [k, sel] of sels.entries()) {
    await ev(`(async () => { const el = document.querySelector('${sel}'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); await new Promise(r => setTimeout(r, 3500)); })()`);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 76 });
    writeFileSync(`${outdir}/${w}-${String(k).padStart(2, '0')}.jpg`, Buffer.from(shot.result.data, 'base64'));
  }
}
ws.close(); chrome.kill();
