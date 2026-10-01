/* ══════════════════════════════════════════════════════════════════════
   1RY · Phase 1 design foundation · typography / grid / glass battery.
   LIVES IN tools/ — run it, do not rewrite it to make it green. Zero npm deps: Node 22 global
   WebSocket drives Chrome over CDP; a tiny Node server serves the repo at
   127.0.0.1 so the page runs under its real <meta> CSP.

   usage: node verify-type.mjs <repoRoot>
   ══════════════════════════════════════════════════════════════════════ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] || '.');
const SRV = +(process.env.HARNESS_SRV || 8841);
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

/* ══════════ STEP 1 · static contract (no browser) ══════════ */
function staticPhase() {
  console.log('\n═══ STEP 1 · static contract ═══');
  const G = 'static';
  const all = ['tokens.css', 'signal.css', 'archive.css', 'effects.css', 'boot.css'].map(cssFile);
  const decl = name => { const m = TOKENS.match(new RegExp('--' + name + ':([^;]+);')); return m ? m[1].trim() : null; };

  chk(G, 'CSS brace balance intact across css/*.css',
    all.every(t => (t.match(/{/g) || []).length === (t.match(/}/g) || []).length));

  const SCALE = ['3xs', '2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', 'display', 'hero', 'cinema'];
  const missing = SCALE.filter(s => !decl('text-' + s));
  chk(G, 'fluid type scale complete: --text-3xs … --text-hero', missing.length === 0, missing.join(' ') || SCALE.length + ' steps');
  const noClamp = SCALE.filter(s => { const v = decl('text-' + s); return !v || v.indexOf('clamp(') !== 0; });
  chk(G, 'every --text-* step is clamp()-based and rem-rooted',
    noClamp.length === 0 && SCALE.every(s => decl('text-' + s).includes('rem')), noClamp.join(' '));

  const LEAD = ['tight', 'snug', 'body', 'hero', 'loose'];
  chk(G, 'leading registers defined (tight/snug/body/hero/loose)',
    LEAD.every(l => decl('leading-' + l) !== null), LEAD.filter(l => !decl('leading-' + l)).join(' '));
  chk(G, 'every leading register is a unitless ratio in range',
    LEAD.filter(l => { const v = parseFloat(decl('leading-' + l)); return !(v > 0.8 && v < 2); }).length === 0);

  const SPACE = ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl'];
  chk(G, 'spacing scale complete: --space-3xs … --space-3xl',
    SPACE.every(s => decl('space-' + s) !== null), SPACE.filter(s => !decl('space-' + s)).join(' '));
  chk(G, 'spacing goes fluid at the display end (xl/2xl/3xl clamp)',
    ['xl', '2xl', '3xl'].every(s => decl('space-' + s).includes('clamp(')));
  chk(G, 'lower spacing steps stay stepped (rem, not clamp)',
    ['3xs', '2xs', 'xs', 's', 'm', 'l'].every(s => !decl('space-' + s).includes('clamp(')));
  const GRID = ['grid-cols', 'grid-major', 'grid-minor', 'grid-col-gap', 'grid-row-gap', 'grid-rhythm', 'grid-edge'];
  chk(G, 'editorial grid contract defined (7 tokens)', GRID.every(t => decl(t) !== null), GRID.filter(t => !decl(t)).join(' '));
  chk(G, 'grid major/minor keep the minmax(0,...) track guard',
    /--grid-major:minmax\(0,/.test(TOKENS) && /--grid-minor:minmax\(0,/.test(TOKENS));

  const GLASS = ['glass-bg', 'glass-bg-lift', 'glass-border', 'glass-border-lift', 'glass-edge', 'glass-hair', 'glass-drop'];
  chk(G, 'glass tokens defined, existing edge/hair/drop untouched', GLASS.every(t => decl(t) !== null), GLASS.filter(t => !decl(t)).join(' '));
  const alpha = parseFloat((decl('glass-bg').match(/,(0?\.\d+)\)/) || [])[1]);
  chk(G, '--glass-bg carries a measured alpha in the legible band (0.80-0.90)', alpha >= 0.80 && alpha <= 0.90, 'alpha=' + alpha);
  chk(G, 'base palette untouched: approved colour tokens intact',
    ['void', 'deep-space', 'starlight', 'nebula-mist', 'ion-cyan', 'astral-violet', 'ink-on-accent'].every(c => decl(c) !== null));

  const ELEV = ['shadow-1', 'shadow-2', 'shadow-3', 'shadow-elevation'];
  chk(G, 'elevation ladder defined (1/2/3 + --shadow-elevation)', ELEV.every(t => decl(t) !== null), ELEV.filter(t => !decl(t)).join(' '));
  chk(G, '--shadow-elevation resolves to a ladder step, not a literal', (decl('shadow-elevation') || '').startsWith('var(--shadow-'), decl('shadow-elevation'));
  chk(G, 'elevation is shadow-only - no blur/glow filter smuggled in', !/drop-shadow|filter:/.test(ELEV.map(t => decl(t)).join(' ')));

  /* every referenced custom property must be declared somewhere in the set */
  const jsSrc = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'))
    .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
  const defined = new Set(Array.from(all.join('\n').matchAll(/(--[\w-]+)\s*:/g)).map(m => m[1])
    .concat(Array.from(jsSrc.matchAll(/['"](--[\w-]+)['"]/g)).map(m => m[1])));
  const refs = Array.from(all.join('\n').matchAll(/var\((--[\w-]+)(\s*,[^;)]*)?\)/g));
  const dangling = [...new Set(refs.filter(r => !defined.has(r[1]) && !r[2]).map(r => r[1]))];
  chk(G, 'no var() reference without either a declaration or a fallback', dangling.length === 0, dangling.join(' '));

  /* the hard rule: no existing class name may disappear */
  const classes = t => new Set(Array.from(t.matchAll(/\.([A-Za-z_][\w-]*)/g)).map(m => m[1]));
  const removed = [];
  for (const f of ['tokens.css', 'signal.css', 'archive.css', 'effects.css', 'boot.css']) {
    let before; try { before = execFileSync('git', ['show', 'HEAD:css/' + f], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { continue; }
    for (const c of classes(before)) if (!classes(cssFile(f)).has(c)) removed.push(f + ':' + c);
  }
  chk(G, 'no class name removed or renamed vs HEAD', removed.length === 0, removed.slice(0, 6).join(' '));

  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).map(l => l.slice(3).trim());
  const offLimits = dirty.filter(f => !/^css\/(tokens|signal|archive)\.css$/.test(f) && f !== 'REDESIGN_PROGRESS.md');
  chk(G, 'only css/tokens|signal|archive touched (plus the progress note)', offLimits.length === 0, offLimits.join(' '));
  const qmd5 = md5(fs.readFileSync(path.join(ROOT, 'js/quasar.js')));
  const qhead = md5(execFileSync('git', ['show', 'HEAD:js/quasar.js'], { cwd: ROOT }));
  chk(G, 'js/quasar.js byte-identical to HEAD - WebGL untouched', qmd5 === qhead, qmd5.slice(0, 8));

  chk(G, 'fluid scale bound to base elements h1-h4 and p',
    ['h1\\{font-size:var\\(--text-3xl\\)', 'h2\\{font-size:var\\(--text-2xl\\)', 'h3\\{font-size:var\\(--text-xl\\)',
      'h4\\{font-size:var\\(--text-lg\\)', 'p\\{margin:0 0 1em;font-size:var\\(--text-base\\)']
      .every(r => new RegExp(r).test(TOKENS)));
  chk(G, '.tech-label rides the same rule as .eyebrow (one role, two names)', /\.eyebrow,\.tech-label\{/.test(TOKENS));

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  chk(G, 'font import present for all three families, display=swap',
    /Space\+Grotesk/.test(html) && /family=Inter/.test(html) && /IBM\+Plex\+Mono/.test(html) && /display=swap/.test(html));
  chk(G, 'CSP still allows the font origin and nothing wider',
    /style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/.test(html) &&
    /font-src 'self' https:\/\/fonts\.gstatic\.com/.test(html) && /script-src 'self'/.test(html));
  return { alpha };
}

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
async function wsUrl() {
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const p = l.find(t => t.type === 'page'); if (p && p.webSocketDebuggerUrl) return p.webSocketDebuggerUrl; } catch (e) {}
    await sleep(200);
  }
  throw new Error('no CDP target on ' + CDP_PORT);
}
async function launch(label, w = 1440, h = 900) {
  CDP_PORT++;
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
  const url = await wsUrl();
  const ws = new WebSocket(url);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDPClient(ws);
  await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  return { chrome, ws, c, label };
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

/* ══════════ visual QA · three viewports x two routes ══════════
   A page can report scrollWidth == clientWidth purely because the root uses
   overflow-x:clip, which hides overflow rather than preventing it. So the
   real question is per element: does anything sit past the frame with no
   ancestor willing to clip or scroll it? Decorative layers (pointer-events:
   none, aria-hidden) are counted and reported, not failed on. */
server.listen(SRV, '127.0.0.1');
const VP = [[360, 740], [768, 900], [1440, 900]];
const OVER = `(() => {
  const cw = document.documentElement.clientWidth;
  const name = e => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '');
  const clipper = e => {
    for (let p = e.parentElement; p; p = p.parentElement) {
      if (p.namespaceURI === 'http://www.w3.org/2000/svg') return name(p) + '/svg-viewport';
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible') return name(p) + '[' + cs.overflowX + ']';
      if (cs.position === 'fixed') break;
    }
    return null;
  };
  const bad = [], decor = []; let clipped = 0;
  document.querySelectorAll('body *').forEach(e => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.right <= cw + 1.5 && r.left >= -1.5) return;
    const c = clipper(e);
    if (c) { clipped++; return; }
    if (e.getAttribute('aria-hidden') === 'true' || cs.pointerEvents === 'none') { decor.push(name(e)); return; }
    bad.push({ sel: name(e), right: Math.round(r.right), left: Math.round(r.left), text: (e.textContent || '').trim().slice(0, 18) });
  });
  const inScroller = e => { for (let p = e; p; p = p.parentElement) { const o = getComputedStyle(p);
    if (o.overflowX === 'auto' || o.overflowX === 'scroll' || o.overflowY === 'auto' || o.overflowY === 'scroll') return true; } return false; };
  const chopped = [];
  document.querySelectorAll('h1,h2,h3,h4,p,a,span,li,td,th,dd,dt,figcaption,label,button,b').forEach(e => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || inScroller(e)) return;
    /* screen-reader text lives in a 1px clipped box on purpose; a clip-path
       or a sub-pixel box is not a text box a human can fail to read */
    if (cs.clip !== 'auto' || cs.clipPath !== 'none' || e.clientWidth <= 1) return;
    if (e.getAttribute('aria-live') || e.closest('[aria-live],[role="status"],[role="alert"]')) return;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    if (e.scrollWidth <= Math.ceil(e.clientWidth) + 1) return;
    chopped.push({ sel: name(e), sw: e.scrollWidth, cw: e.clientWidth, t: e.textContent.trim().slice(0, 16) });
  });
  const vis = s => [...document.querySelectorAll(s)].find(e => e.getBoundingClientRect().width > 0);
  const fs_ = s => { const e = s[0] === '.' || s[0] === '#' ? vis(s) : vis(s); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : 0; };
  const nav = document.querySelector('.signal-nav');
  const rows = nav ? new Set([...nav.querySelectorAll('a')].map(a => Math.round(a.getBoundingClientRect().top))).size : 0;
  const bw = document.querySelector('.bench-wrap');
  return { cw, sw: document.documentElement.scrollWidth,
    n: bad.length, bad: bad.slice(0, 5), clipped, decor: decor.slice(0, 4), ndecor: decor.length,
    chopped: chopped.slice(0, 4), nchop: chopped.length,
    navRows: rows, navH: nav ? Math.round(nav.getBoundingClientRect().height) : 0,
    h1: fs_('h1'), h2: fs_('.signal-section__title'), lede: fs_('.signal-hero__lede'),
    prose: fs_('.case-file__summary'), label: fs_('.eyebrow'), mono: fs_('.archive-section__num'),
    bench: bw ? { client: bw.clientWidth, scroll: bw.scrollWidth, ox: getComputedStyle(bw).overflowX } : null };
})()`;

async function sweep(ctx, hash, label) {
  console.log('\n\u2550\u2550\u2550 ' + label + ' \u00b7 ' + (hash || '/') + ' \u2550\u2550\u2550');
  for (const [w, h] of VP) {
    await size(ctx.c, w, h);
    const o = await ctx.c.eval(OVER);
    chk('sweep', label + ' @ ' + w + ': page never scrolls sideways', o.sw <= o.cw + 1, 'scrollWidth ' + o.sw + ' / client ' + o.cw);
    chk('sweep', label + ' @ ' + w + ': nothing escapes the frame unclipped', o.n === 0,
      o.bad.map(b => b.sel + '@' + b.right + '/' + b.left + ' "' + b.text + '"').join(' | '));
    if (hash === '') chk('sweep', label + ' @ ' + w + ': nav stays a single row', o.navRows <= 1, o.navRows + ' row(s), bar ' + o.navH + 'px tall');
    chk('sweep', label + ' @ ' + w + ': no text is cut by its own box', o.nchop === 0,
      o.nchop + ' cut: ' + o.chopped.map(c => c.sel + ' ' + c.sw + '>' + c.cw + ' "' + c.t + '"').join(' | '));
    note('type @ ' + w + ' \u2192 h1 ' + o.h1 + '  h2 ' + o.h2 + '  lede ' + o.lede + '  prose ' + o.prose + '  label ' + o.label + '  mono ' + o.mono);
    note('containment @ ' + w + ' \u2192 ' + o.clipped + ' inside a clip/scroll ancestor, ' + o.ndecor + ' decorative (' + o.decor.join(' ') + ')');
    if (o.bench && w === 360) chk('sweep', label + ' @ ' + w + ': bench table degrades to its own scroller',
      o.bench.ox === 'auto' && o.bench.scroll >= o.bench.client, '[' + o.bench.ox + '] ' + o.bench.scroll + ' in ' + o.bench.client + 'px');
  }
}

const ctx = await launch('ovf');
await nav(ctx.c, '');
await bootWait(ctx.c);
await sweep(ctx, '', 'Signal');
await nav(ctx.c, '/archive'); await sleep(500); await bootWait(ctx.c, 12000);
await sweep(ctx, '/archive', 'Archive');
kill(ctx); server.close();
console.log('\n=== RESULT \u00b7 overflow sweep ===');
console.log('  TOTAL ' + (N - FAIL) + '/' + N + ' passed, ' + FAIL + ' failed');
NOTE.forEach(n => console.log('  ~ ' + n));
process.exit(FAIL ? 1 : 0);
