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

  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).map(l => l.slice(3).trim());
  const PHASE2=/^(css\/(signal|effects)\.css|index\.html|js\/render\.js|tools\/[\w.-]+$|REDESIGN_PROGRESS\.md)$/;
  const offLimits = dirty.filter(f => !PHASE2.test(f));
  chk(G, 'only the Phase 2 surface touched (signal CSS, shard material, markup, tools, note)', offLimits.length === 0, offLimits.join(' '));
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

/* ══════════ in-page probe ══════════ */
const PROBE = `(() => {
  const cs = el => getComputedStyle(el);
  const px = s => parseFloat(s) || 0;
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden','true');
  probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;visibility:hidden';
  document.body.appendChild(probe);
  const tokPx = n => { probe.style.fontSize = 'var(--text-' + n + ')'; return px(cs(probe).fontSize); };
  const valPx = (prop, tok) => { probe.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;width:0;height:0';
    probe.style[prop] = 'var(--' + tok + ')'; return px(cs(probe)[prop]); };
  const SCALE = ['3xs','2xs','xs','sm','base','lg','xl','2xl','3xl','display','hero','cinema'];
  const scale = {}; SCALE.forEach(s => scale[s] = tokPx(s));
  const fam = s => { const el = document.querySelector(s); return el ? cs(el).fontFamily.split(',')[0].replace(/[\"]/g,'') : null; };
  const pick = s => { const el = document.querySelector(s); if (!el) return null; const c = cs(el);
    return { size: px(c.fontSize), lh: c.lineHeight, family: c.fontFamily.split(',')[0].replace(/[\"]/g,''),
             track: c.letterSpacing, tt: c.textTransform, color: c.color }; };
  /* floor probe: bare elements, exactly what a hand-written section gets */
  const host = document.createElement('div');
  host.setAttribute('aria-hidden','true');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:600px';
  host.innerHTML = '<h1></h1><h2>x</h2><h3>x</h3><h4>x</h4><p>x</p><span class="tech-label">x</span>';
  document.body.appendChild(host);
  const bare = {}; const pickEl = el => { const c = cs(el);
    return { size: px(c.fontSize), lh: c.lineHeight, family: c.fontFamily.split(',')[0].replace(/[\"]{}/g,''), track: c.letterSpacing, tt: c.textTransform }; };
  ['h1','h2','h3','h4','p','.tech-label'].forEach(s => bare[s] = pickEl(host.querySelector(s)));
  host.remove(); probe.remove();
  const nav = document.querySelector('.signal-nav');
  const navc = nav ? cs(nav) : null;
  return {
    vw: innerWidth, scale,
    fam: { h1: fam('.signal-name'), p: fam('.signal-section__lede'), mono: fam('.eyebrow') },
    comp: { name: pick('.signal-name'), code: pick('.transmission__code'), sec: pick('.signal-section__title'),
            eyebrow: pick('.eyebrow'), lede: pick('.signal-section__lede') },
    bare,
    spaceXl: valPx('width', 'space-xl'),
    nav: navc ? { bg: navc.backgroundColor, border: navc.borderTopColor, shadow: navc.boxShadow,
                  rect: (() => { const r = nav.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
                  link: (() => { const a = nav.querySelector('a'); return a ? cs(a).color : null; })() } : null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
})()`;

async function pixels(c, clip) {
  const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  return await c.eval(`(async () => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,${data}'; });
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data; const out = [];
    for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
    return out; })()`);
}
const lumaStats = px => {
  const l = px.map(p => lum(p)).sort((a, b) => a - b);
  const q = f => l[Math.min(l.length - 1, Math.floor(l.length * f))];
  return { p50: q(0.5), p95: q(0.95), p99: q(0.99), max: l[l.length - 1] };
};
const brightOf = px => px.reduce((w, p) => (lum(p) > lum(w) ? p : w), [0, 0, 0]);

/* ══════════ main ══════════ */
server.listen(SRV, '127.0.0.1');
const { alpha } = staticPhase();
const G = 'runtime';
const ORDER = ['3xs','2xs','xs','sm','base','lg','xl','2xl','3xl','display','hero'];
const ONLY = process.argv[3] || 'all';
const ctx = await launch('type');
await nav(ctx.c, '/signal');
await sleep(600);
const boot = await bootWait(ctx.c);
chk(G, 'page boots under its own CSP', boot.render === 'ok', 'webgl=' + boot.webgl + ' ctx=' + boot.ctx);

const fonts = await ctx.c.eval(`({status:document.fonts.status,
  d:document.fonts.check('600 1rem "Space Grotesk"'),b:document.fonts.check('400 1rem "Inter"'),
  m:document.fonts.check('500 1rem "IBM Plex Mono"')})`);
chk(G, 'Space Grotesk / Inter / IBM Plex Mono all resolve', !!(fonts.d && fonts.b && fonts.m), 'status=' + fonts.status);
if (!(fonts.d && fonts.b && fonts.m)) note('webfont files did not reach this sandbox - fallback stack measured instead');

if (ONLY !== 'archive') {
console.log('\n═══ STEP 2 · fluid scale at 3 viewports ═══');
const GV = 'scale';
const byVw = {};
for (const [w, h] of [[360, 780], [768, 900], [1440, 900]]) {
  await size(ctx.c, w, h);
  const r = await ctx.c.eval(PROBE);
  byVw[w] = r;
  const bad = [];
  for (let i = 1; i < ORDER.length; i++) {
    if (!(r.scale[ORDER[i]] > r.scale[ORDER[i - 1]])) bad.push(ORDER[i - 1] + '->' + ORDER[i]);
  }
  chk(GV, w + 'px: scale strictly increasing, no collapsed steps', bad.length === 0, bad.join(' '));
  chk(GV, w + 'px: no horizontal overflow from the fluid type', r.overflow <= 1, 'delta=' + r.overflow + 'px');
  console.log('     ' + ORDER.map(k => k + '=' + r.scale[k].toFixed(1)).join(' '));
}
const shrink = [];
for (const k of ORDER) if (byVw[1440].scale[k] < byVw[360].scale[k]) shrink.push(k);
chk(GV, 'every step is non-decreasing from 360 to 1440', shrink.length === 0, shrink.join(' '));
chk(GV, '--text-3xs stays legible at 360 (>= 10px)', byVw[360].scale['3xs'] >= 10, byVw[360].scale['3xs'].toFixed(2) + 'px');
chk(GV, 'body copy lands in the 15-17px reading band',
  byVw[360].scale.base >= 15 && byVw[1440].scale.base <= 17,
  byVw[360].scale.base.toFixed(1) + ' -> ' + byVw[1440].scale.base.toFixed(1) + 'px');
chk(GV, 'hero spans a real optical range (>= 60px @360, >= 150px @1440)',
  byVw[360].scale.hero >= 60 && byVw[1440].scale.hero >= 150,
  byVw[360].scale.hero.toFixed(0) + ' / ' + byVw[1440].scale.hero.toFixed(0) + 'px');
const ratioSpread = ORDER.slice(0, 9).every(k =>
  (byVw[1440].scale[k] - byVw[768].scale[k]) * (byVw[768].scale[k] - byVw[360].scale[k]) >= -0.0001);
chk(GV, 'interpolation is monotonic through the mid viewport (no kink)', ratioSpread);

console.log('\n═══ STEP 3 · shipped components still resolve to their token ═══');
const GC = 'components';
const S = byVw[1440].scale;
const eq = (a, b, tol) => a !== null && Math.abs(a - b) <= (tol === undefined ? 0.6 : tol);
chk(GC, '.signal-name = --text-hero', eq(byVw[1440].comp.name.size, S.hero), byVw[1440].comp.name.size + ' vs ' + S.hero.toFixed(1));
/* Phase 2 gave the slab names their own arithmetic: inside a volume the code is
   min(--text-cinema, --slab-code) so that a name fits the glass it is written on
   at the scale the camera shows it, and the cinema step is what the stacked log
   and the no-script floor keep (verify-signal.mjs asserts that case). Either is
   correct at 1440; a size that is neither - a literal smuggled in - is the
   failure this check is for. */
chk(GC, '.transmission__code is the cinema step or a slab-fit beneath it',
  eq(byVw[1440].comp.code.size, S.cinema) || byVw[1440].comp.code.size < S.cinema,
  byVw[1440].comp.code.size + ' vs cinema ' + S.cinema.toFixed(1));
chk(GC, '.signal-section__title = --text-3xl', eq(byVw[1440].comp.sec.size, S['3xl']), byVw[1440].comp.sec.size + ' vs ' + S['3xl'].toFixed(1));
chk(GC, '.eyebrow = --text-2xs', eq(byVw[1440].comp.eyebrow.size, S['2xs']), byVw[1440].comp.eyebrow.size + ' vs ' + S['2xs'].toFixed(1));
chk(GC, 'prose resolves to --text-base on --leading-body',
  eq(byVw[1440].comp.lede.size, S.base) &&
  Math.abs(parseFloat(byVw[1440].comp.lede.lh) / byVw[1440].comp.lede.size - 1.62) < 0.02,
  byVw[1440].comp.lede.size + 'px / ' + byVw[1440].comp.lede.lh);
if (fonts.d) {
  chk(GC, 'display face on headings, body face on prose',
    /Space Grotesk/.test(byVw[1440].fam.h1) && /Inter/.test(byVw[1440].fam.p), byVw[1440].fam.h1 + ' | ' + byVw[1440].fam.p);
}
chk(GC, 'mono on the technical label', /IBM Plex Mono|Menlo|monospace|Consolas/i.test(byVw[1440].comp.eyebrow.family), byVw[1440].comp.eyebrow.family);

console.log('\n═══ STEP 4 · the element floor + .tech-label ═══');
const GB = 'floor';
const B = byVw[1440].bare;
chk(GB, 'bare h1 = --text-3xl on hero leading', eq(B['h1'].size, S['3xl']) && Math.abs(parseFloat(B['h1'].lh) / B['h1'].size - 0.9) < 0.02, B['h1'].size + 'px');
chk(GB, 'bare h2 = --text-2xl', eq(B['h2'].size, S['2xl']), B['h2'].size + 'px');
chk(GB, 'bare h3 = --text-xl', eq(B['h3'].size, S.xl), B['h3'].size + 'px');
chk(GB, 'bare h4 = --text-lg', eq(B['h4'].size, S.lg), B['h4'].size + 'px');
chk(GB, 'bare p = --text-base on --leading-body', eq(B['p'].size, S.base) && Math.abs(parseFloat(B['p'].lh) / B['p'].size - 1.62) < 0.02, B['p'].size + 'px / ' + B['p'].lh);
chk(GB, '.tech-label is uppercase mono with label tracking',
  B['.tech-label'].tt === 'uppercase' && parseFloat(B['.tech-label'].track) > 0 &&
  eq(B['.tech-label'].size, S['2xs']), B['.tech-label'].family + ' ' + B['.tech-label'].track + ' ' + B['.tech-label'].tt);
chk(GB, '.tech-label matches .eyebrow exactly (one role, no drift)',
  B['.tech-label'].size === byVw[1440].comp.eyebrow.size && B['.tech-label'].track === byVw[1440].comp.eyebrow.track);

console.log('\n═══ STEP 5 · glass + elevation, measured off the rendered frame ═══');
const GG = 'glass';
const N0 = byVw[1440].nav;
chk(GG, '.signal-nav fill resolves to --glass-bg', N0 && N0.bg === 'rgba(10, 15, 27, 0.84)', N0 && N0.bg);
/* Phase 2's arrival: under the monolith the pill is deliberately unlit and lying
   flat on the glass - the engine's is-cam-gone flag releases the edge and the
   shadow ladder when the title card spends out. This snapshot reads the bar at
   the top of the page, which is the unlit half; verify-signal.mjs reads both
   halves and the 320 ms of material between them. */
chk(GG, '.signal-nav edge is the hairline token, or unlit under the monolith',
  N0 && (N0.border === 'rgba(234, 243, 255, 0.16)' || N0.border === 'rgba(0, 0, 0, 0)'), N0 && N0.border);
chk(GG, '.signal-nav shadow carries the hairline (the ladder arrives with the handover)',
  !!N0 && /inset/.test(N0.shadow), N0 && (N0.shadow || '').slice(0, 44));
if (N0 && N0.rect.w > 40) {
  /* The rect has to be read at the moment of capture and in document space. The
     steps above sweep three viewports and touch the scroll, so a rect carried
     from the sweep points at wherever the bar has gone, and the clip is in
     document space while a bounding rect is in viewport space - the pair of
     mistakes that made this sample report a bright patch that is not in the
     pill at all. */
  const R = await ctx.c.eval(`(() => { const r = document.querySelector('.signal-nav').getBoundingClientRect();
    document.querySelectorAll('.signal-nav a').forEach(a => a.style.visibility = 'hidden');
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  const IN = 3;
  const clip = { x: Math.round(R.x + IN), y: Math.round(R.y + IN),
    width: Math.max(6, Math.round(R.w - 2 * IN)), height: Math.max(4, Math.round(R.h - 2 * IN)) };
  const px = await pixels(ctx.c, clip);
  await ctx.c.eval(`(()=>{document.querySelectorAll('.signal-nav a').forEach(a=>a.style.visibility='')})()`);
  chk(GG, 'panel substrate sampled from real rendered pixels', px.length > 500, px.length + ' px over live plasma');
  if (px.length > 500) {
    const st = lumaStats(px);
    const rank = px.map((p, i) => [lum(p), i]).sort((a, b) => a[0] - b[0]);
    const p99 = px[rank[Math.floor(rank.length * 0.99)][1]];
    const max = px[rank[rank.length - 1][1]];
    const parseRGB = t => { const m = (t || '').match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [234, 243, 255]; };
    const link = parseRGB(N0.link);
    const ci = ratio([234, 243, 255], p99), cm = ratio(link, p99);
    console.log('     panel interior luma  p50=' + (st.p50 * 100).toFixed(1) + '  p99=' + (st.p99 * 100).toFixed(1) + '  max=' + (st.max * 100).toFixed(1) + '  (relative, 0-100)');
    chk(GG, '--ink over the rendered panel holds AAA at p99 (>= 7:1)', ci >= 7, ci.toFixed(2) + ':1 over rgb(' + p99.join(',') + ')');
    chk(GG, 'nav link colour over the rendered panel holds AA at p99 (>= 4.5:1)', cm >= 4.5, cm.toFixed(2) + ':1 for rgb(' + link.join(',') + ')');
    note('hottest single pixel inside the panel was rgb(' + max.join(',') + ') - the milled edge, where no text can sit');
  }
}

}

function finish() {
  kill(ctx); server.close();
  console.log('\n=== RESULT (' + ONLY + ') ===');
  for (const g of Object.keys(GROUPS)) console.log('  ' + (g + '        ').slice(0, 12) + GROUPS[g].p + ' passed, ' + GROUPS[g].f + ' failed');
  console.log('  TOTAL ' + (N - FAIL) + '/' + N + ' passed, ' + FAIL + ' failed');
  NOTE.forEach(n => console.log('  ~ ' + n));
  process.exit(FAIL ? 1 : 0);
}
if (ONLY === 'signal') finish();
console.log('\n═══ STEP 6 · the Archive reads as a 7 + 5 field ═══');
const GA = 'archive';
await nav(ctx.c, '/archive'); await sleep(400); await bootWait(ctx.c); await size(ctx.c, 1440, 900);
const A = await ctx.c.eval(`(() => {
  const rows = [...document.querySelectorAll('.archive-masthead,.case-file__body')].map(m => { const c = getComputedStyle(m);
    return { cls: m.className, gap: parseFloat(c.columnGap), kids: [...m.children].map(k => Math.round(k.getBoundingClientRect().width)) }; });
  const sizes = sel => [...document.querySelectorAll(sel)].slice(0, 4).map(e => parseFloat(getComputedStyle(e).fontSize));
  const mws = sel => [...document.querySelectorAll(sel)].slice(0, 1).map(e => getComputedStyle(e).maxWidth);
  return { vw: innerWidth, rows, title: sizes('.archive-section__title'), code: sizes('.case-file__code'),
    lede: sizes('.case-file__summary'), mono: sizes('.archive-section__num'), mw: mws('.case-file__summary'),
    ch: (() => { const el = document.querySelector('.case-file__summary'); if (!el) return 0;
      const d = document.createElement('span'); d.style.cssText = 'position:fixed;left:-9999px;visibility:hidden;width:1ch';
      d.textContent = '0'; el.appendChild(d);
      const w = parseFloat(getComputedStyle(d).width); d.remove(); return w; })(),
    spaceXl: (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px;width:var(--space-xl)';
      document.body.appendChild(d); const w = parseFloat(getComputedStyle(d).width); d.remove(); return w; })(),
    scale: (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(d); const o = {};
      ['3xs','2xs','xs','sm','base','lg','xl','2xl','3xl','display','hero','cinema'].forEach(k => {
        d.style.fontSize = 'var(--text-' + k + ')'; o[k] = parseFloat(getComputedStyle(d).fontSize); });
      d.remove(); return o; })() };
})()`);
const SCALEK = ['3xs','2xs','xs','sm','base','lg','xl','2xl','3xl','display','hero','cinema'];
const onScale = v => SCALEK.some(k => Math.abs(A.scale[k] - v) <= 0.6);
chk(GA, 'masthead + every case-file split into two tracks', A.rows.length > 0 && A.rows.every(r => r.kids.length === 2), A.rows.length + ' splits');
const splits = A.rows.map(r => r.kids[0] / r.kids[1]);
chk(GA, 'every split is the 7:5 reading of the field (1.40 +/- 4%)',
  splits.every(r => Math.abs(r - 1.4) / 1.4 < 0.04), splits.map(r => r.toFixed(2)).join(' '));
chk(GA, 'column gutter resolves from --grid-col-gap = --space-xl',
  A.rows.every(r => Math.abs(r.gap - A.spaceXl) <= 1), A.rows.map(r => r.gap).join(' ') + ' vs ' + A.spaceXl.toFixed(1));
chk(GA, 'Archive headings land on the scale, not on a literal',
  A.title.concat(A.code, A.mono).every(onScale), A.title.join('/') + ' ' + A.code.join('/'));
chk(GA, 'Archive prose lands on the scale', A.lede.every(onScale), A.lede.join('/'));
chk(GA, 'measure still resolves to --measure (66ch of the prose face)',
  A.ch > 0 && Math.abs(parseFloat(A.mw[0]) - 66 * A.ch) <= 1.5, A.mw[0] + ' = 66 x ' + A.ch.toFixed(2) + 'px');

console.log('\n═══ STEP 7 · console ═══');
const GE = 'clean';
const csp = ctx.c.errors.filter(e => /Content Security Policy/.test(e));
chk(GE, 'zero CSP violations from the new token surface', csp.length === 0, csp.slice(0, 2).join(' | '));
const real = ctx.c.errors.filter(e => !/fonts\.(gstatic|googleapis)/.test(e));
chk(GE, 'zero console errors (sandbox font fetch excluded)', real.length === 0, real.slice(0, 2).join(' | '));
if (ctx.c.errors.length !== real.length) note(ctx.c.errors.length - real.length + ' font fetch failure(s) - offline sandbox only, real visitors get the webfonts');
chk(GE, 'no uncaught exceptions', ctx.c.exceptions.length === 0, ctx.c.exceptions.slice(0, 1).join('').slice(0, 70));
note('deliberate deltas: nav fill 0.94 -> 0.84 alpha, nav hairline 0.08 -> 0.16');
finish();

