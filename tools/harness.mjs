/* ══════════════════════════════════════════════════════════════════════
   1RY · shared browser harness for the tools/ batteries.
   Zero npm deps: Node 22 global WebSocket drives Chrome over CDP, and a
   14-line Node server serves the repo at 127.0.0.1 so every page runs
   under the same <meta> CSP it ships with. Cut verbatim from
   verify-type.mjs, which keeps its own copy - the batteries are evidence,
   and evidence does not get quietly re-factored under each other.

   usage: import { ROOT, launch, nav, size, chk, ... } from './harness.mjs'
          node verify-signal.mjs <repoRoot>
   ══════════════════════════════════════════════════════════════════════ */
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';

import { fileURLToPath } from 'node:url';
/* Root = argv[2], else the folder above tools/ - so `node tools/x.mjs` works
   from anywhere without a path argument, which the /tmp scratch copy never
   did (it defaulted to cwd and read css/tokens.css out of the tool folder). */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.argv[2] || path.join(HERE, '..'));
/* let, not const: serve() steps the port when a dead run left it bound, and
   nav() reads the live binding. */
let SRV = +(process.env.HARNESS_SRV || 8841);
let CDP_PORT = +(process.env.HARNESS_CDP || 9421);
/* Chrome, de-pinned: CHROME_BIN wins, otherwise the newest build in the
   puppeteer cache, otherwise whatever is on PATH. The literal this replaces
   named one version directory, and the battery died the day that moved. */
function findChrome(){
  if(process.env.CHROME_BIN){return process.env.CHROME_BIN;}
  const base=(process.env.HOME||'/tmp')+'/.cache/puppeteer/chrome';
  try{
    const v=fs.readdirSync(base).filter(d=>d.startsWith('linux-')).sort().reverse();
    for(const d of v){
      for(const p of ['chrome-linux64/chrome','chrome-linux/chrome']){
        const f=base+'/'+d+'/'+p;
        if(fs.existsSync(f)){return f;}
      }
    }
  }catch(e){}
  return 'chrome';
}
const CHROME = findChrome();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const md5 = s => crypto.createHash('md5').update(s).digest('hex');
let N = 0, FAIL = 0; const GROUPS = {}; const NOTE = [];
function chk(g, name, ok, detail) {
  N++; if (!ok) FAIL++;
  GROUPS[g] = GROUPS[g] || { p: 0, f: 0 }; ok ? GROUPS[g].p++ : GROUPS[g].f++;
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + (detail !== undefined && detail !== '' ? '   [' + detail + ']' : ''));
}
function note(s) { NOTE.push(s); console.log('  ~ ' + s); }
const cssFile = f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
const TOKENS = cssFile('tokens.css');
const lum = c => { const s = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]; };
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

/* ══════════ static server (real CSP, no CDN) ══════════ */
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(b);
  });
});

/* ══════════ CDP ══════════ */
class CDPClient {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.p = new Map(); this.waiters = [];
    this.errors = []; this.exceptions = []; this.logs = [];
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.p.has(m.id)) {
        const { res, rej } = this.p.get(m.id); this.p.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return;
      }
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails || {};
        this.exceptions.push((d.exception && d.exception.description) || d.text || 'exception');
      } else if (m.method === 'Runtime.consoleAPICalled') {
        if (m.params.type === 'error') this.errors.push('console:' + (m.params.args || []).map(a => a.value !== undefined ? a.value : (a.description || a.type)).join(' '));
      } else if (m.method === 'Log.entryAdded') {
        const e = m.params.entry || {};
        this.logs.push(e.level + ':' + e.text);
        if (e.level === 'error') this.errors.push('log:' + e.text);
      }
      const keep = []; for (const w of this.waiters) { if (w.method === m.method) w.res(m.params); else keep.push(w); }
      this.waiters = keep;
    };
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      const to = setTimeout(() => { this.p.delete(id); rej(new Error('CDP timeout ' + timeoutMs + 'ms: ' + method)); }, timeoutMs);
      this.p.set(id, { res: v => { clearTimeout(to); res(v); }, rej: e => { clearTimeout(to); rej(e); } });
      try { this.ws.send(JSON.stringify({ id, method, params })); }
      catch (e) { clearTimeout(to); this.p.delete(id); rej(e); }
    });
  }
  once(method, timeout = 20000) { return new Promise((res, rej) => {
    const w = { method, res }; this.waiters.push(w);
    setTimeout(() => { this.waiters = this.waiters.filter(x => x !== w); rej(new Error('timeout ' + method)); }, timeout); }); }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.text || '') + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
    return r.result.value;
  }
}
/* true when something is already listening - a free port refuses the socket */
const portBusy = p => new Promise(res => {
  const s = net.connect(p, '127.0.0.1');
  const done = v => { s.destroy(); res(v); };
  s.setTimeout(300);
  s.once('connect', () => done(true));
  s.once('timeout', () => done(false));
  s.once('error', () => done(false));
});

async function wsUrl(budget = 16000) {
  const t0 = Date.now();
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const p = l.find(t => t.type === 'page'); if (p && p.webSocketDebuggerUrl) return p.webSocketDebuggerUrl; } catch (e) {}
    if (Date.now() - t0 > budget) break;
    await sleep(200);
  }
  throw new Error('no CDP target on ' + CDP_PORT);
}
/* Debug ports are contested on a development machine: a Chrome left behind by
   an earlier run keeps the port, the new one quietly binds elsewhere, and the
   target never appears at the address the harness is polling - which reads as
   "no CDP target". Probe the port, and step it if something is already home. */
async function launch(label, w = 1440, h = 900) {
  let lastErr = new Error('no free debug port above ' + CDP_PORT);
  for (let attempt = 0; attempt < 6; attempt++) {
    CDP_PORT++;
    if (await portBusy(CDP_PORT)) { continue; }
    const profile = '/tmp/pw/type-' + label + '-' + CDP_PORT;
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
    const args = ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
      '--window-size=' + w + ',' + h, '--hide-scrollbars', '--force-device-scale-factor=1',
      '--remote-debugging-port=' + CDP_PORT, '--user-data-dir=' + profile,
      '--no-first-run', '--no-default-browser-check', '--mute-audio',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--disable-features=Translate', '--autoplay-policy=no-user-gesture-required',
      '--use-gl=angle', '--use-angle=swiftshader', 'about:blank'];
    const chrome = spawn(CHROME, args, { stdio: 'ignore' });
    try {
      const url = await wsUrl(8000);
      const ws = new WebSocket(url);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      const c = new CDPClient(ws);
      await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
      return { chrome, ws, c, label };
    } catch (e) {
      lastErr = e;
      try { chrome.kill('SIGKILL'); } catch (err) {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch (err) {}
    }
  }
  throw lastErr;
}
async function nav(c, hash = '') {
  const p = c.once('Page.loadEventFired');
  await c.send('Page.navigate', { url: 'http://127.0.0.1:' + SRV + '/#' + hash });
  try { await p; } catch (e) {}
}
async function bootWait(c, ms = 20000) {
  const t0 = Date.now(); let s = null;
  for (;;) {
    s = await c.eval(`({render:document.documentElement.getAttribute('data-render'),
      mode:document.documentElement.getAttribute('data-mode'),
      booting:document.documentElement.classList.contains('is-booting'),
      webgl:document.documentElement.getAttribute('data-webgl'),
      ctx:document.documentElement.getAttribute('data-webgl-ctx')})`);
    if (s && s.render === 'ok' && !s.booting) return s;
    if (Date.now() - t0 > ms) return s;
    await sleep(300);
  }
}
async function size(c, w, h) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await c.eval(`new Promise(r=>{let n=0;const f=()=>{if(++n>6)r(1);else requestAnimationFrame(f)};requestAnimationFrame(f)})`);
  await sleep(250);
}
function kill(ctx) { try { ctx.ws.close(); } catch (e) {} try { ctx.chrome.kill('SIGKILL'); } catch (e) {} }
/* The harness port is contended too - a battery killed mid-run leaves its
   server listening - and an unhandled EADDRINUSE is not a verdict. Step the
   port; nav() reads SRV when it is called, so the pages follow. */
async function serve() {
  for (let i = 0; i < 8; i++) {
    try {
      await new Promise((res, rej) => { server.once('error', rej); server.listen(SRV, '127.0.0.1', res); });
      return;
    } catch (e) {
      if (e && e.code === 'EADDRINUSE') { SRV += 7; continue; }
      throw e;
    }
  }
  throw new Error('no free harness port above ' + SRV);
}
await serve();

export { ROOT, SRV, CDP_PORT, CHROME, MIME, sleep, md5, N, FAIL, GROUPS, NOTE,
  chk, note, cssFile, TOKENS, lum, ratio, server, CDPClient, wsUrl,
  launch, nav, bootWait, size, kill };
