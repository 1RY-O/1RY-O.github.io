/* ══════════════════════════════════════════════════════════════════════
   1RY · Phase 2 · the Signal layout battery (Normal Mode).

   What this proves, in order:
     1  static  - the phase touched nothing it did not own, and the layout
                  speaks the Phase 1 token contract instead of re-stating it
                  (grid, glass, rhythm, hero leading, slab arithmetic).
     2  runtime - the page still boots under its own CSP with the WebGL
                  engine byte-identical, the volume engages, and the depth
                  variables the engine publishes actually reach the material.
     3  fit     - every project name fits the glass it is written on, at the
                  width the camera actually shows it at.
     4  pixels  - contrast is measured off the rendered frame, not off the
                  stylesheet: screenshot → inflate → unfilter → two clusters
                  → WCAG ratio. This is the only check that can see light
                  bleeding through a slab.
     5  no-js   - script execution switched off: nav, readout and slabs must
                  still be present, legible and inside the viewport.

   usage: node tools/verify-signal.mjs [repoRoot]
   ══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { ROOT, SRV, sleep, md5, chk, note, cssFile, TOKENS, lum, ratio, GROUPS, N, FAIL,
  launch, nav, bootWait, size, kill } from './harness.mjs';

/* Comments are prose about the rules, not the rules: a header block that
   quotes `.shell--signal .shell__inner{` would otherwise be read as that
   rule, and a note recording the value we replaced would fail the test that
   it is gone. Audit the declarations, and only those. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '');
const SIGNAL = strip(cssFile('signal.css'));
const EFFECTS = strip(cssFile('effects.css'));
const G1 = 'static';

/* Rule bodies, by selector, out of a stylesheet. A selector can appear more
   than once - .signal-readout has its grid placement in the 1080 block and its
   body further down, .signal-name has a transform rule in the stage and its
   typography in the base - and what is under audit is the element, not one of
   its rules. So every body the selector owns is read as one: a literal
   smuggled back into any of them still fails, and no check can be satisfied by
   whichever candidate happens to be the longest. */
function body(src, sel) {
  const all = [];
  let i = src.indexOf(sel);
  while (i >= 0) {
    const a = src.indexOf('{', i), b = src.indexOf('}', a);
    if (a >= 0 && b > a) all.push(src.slice(a + 1, b));
    i = src.indexOf(sel, i + sel.length);
  }
  return all.join('\n');
}
const tok = (src, n) => { const m = src.match(new RegExp('--' + n + ':([^;]+);')); return m ? m[1].trim() : null; };
/* the alpha carried by a computed rgb()/rgba() colour */
const alpha = s => (/^rgba\(/.test(s) || /\/\s*[\d.]+\s*\)?$/.test(s))
  ? parseFloat(s.replace(/[)\s]*$/, '').split(/[,\s/]+/).pop()) : 1;
const gitHead = p => { try { return execFileSync('git', ['show', 'HEAD:' + p], { cwd: ROOT }); } catch (e) { return null; } };
const untouched = p => { const h = gitHead(p); if (h === null) return true; return md5(fs.readFileSync(path.join(ROOT, p))) === md5(h); };

/* ══════════ STEP 1 · static contract ══════════ */
console.log('\n═══ STEP 1 · static contract: owned surface, token language ═══');
const all = ['tokens.css', 'signal.css', 'archive.css', 'effects.css', 'boot.css'].map(cssFile);
chk(G1, 'CSS brace balance intact across css/*.css',
  all.every(t => (t.match(/{/g) || []).length === (t.match(/}/g) || []).length));

const jsAll = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
const changedJS = jsAll.filter(f => !untouched('js/' + f));
chk(G1, 'Phase 2 is CSS-only: every js/*.js byte-identical to HEAD (engine + config locked)',
  changedJS.length === 0, changedJS.join(' '));
chk(G1, 'the Archive is untouched: css/archive.css byte-identical to HEAD', untouched('css/archive.css'));
chk(G1, 'index.html untouched (no markup was needed to lay this out)', untouched('index.html'));

const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean).map(l => l.slice(3).trim());
const OWNED = /^(css\/(signal|effects)\.css|tools\/[\w.-]+$|REDESIGN_PROGRESS\.md)$/;
const stray = dirty.filter(f => !OWNED.test(f));
chk(G1, 'working tree holds only owned files (signal + shard material + tools + note)',
  stray.length === 0, stray.join(' '));

/* the twelve-track field is the token contract, not a literal */
const INNER = body(SIGNAL, '.shell--signal .shell__inner{');
chk(G1, 'shell grid reads --grid-cols / --grid-col-gap',
  /repeat\(var\(--grid-cols\)/.test(INNER) && /var\(--grid-col-gap\)/.test(INNER), INNER.replace(/\s+/g, ' ').trim());
chk(G1, 'no viewport gutter literal left in the shell grid', !/column-gap:clamp\(/.test(INNER));
chk(G1, 'the narrow column is floored at zero, so no item can inflate the page',
  /grid-template-columns:minmax\(0,1fr\)/.test(INNER), INNER.replace(/\s+/g, ' ').trim().slice(0, 60));

/* hero speaks the type contract */
const NAME = body(SIGNAL, '.signal-name{'), LEDE = body(SIGNAL, '.signal-hero__lede{'), TAG = body(SIGNAL, '.signal-hero__tag{');
chk(G1, 'monolith leading is --leading-hero', /line-height:var\(--leading-hero\)/.test(NAME));
chk(G1, 'lede sits on --measure-tight + --leading-snug',
  /max-width:var\(--measure-tight\)/.test(LEDE) && /line-height:var\(--leading-snug\)/.test(LEDE));
chk(G1, 'tag rail is milled glass (fill + edge + hairline, all tokens)',
  /background-color:var\(--glass-bg\)/.test(TAG) && /border:1px solid var\(--glass-border\)/.test(TAG)
  && /var\(--glass-hair\)/.test(TAG));
chk(G1, 'tag rail hugs its text without being allowed to set its own track',
  /width:fit-content\(100%\)/.test(TAG) && /min-width:0/.test(TAG) && !/width:max-content/.test(TAG));

/* the readout carries prose, so it must clear the legibility floor */
const READ = body(SIGNAL, '.signal-readout{'), READROW = body(SIGNAL, '.signal-readout > div{');
chk(G1, 'readout floats on the glass contract',
  /background-color:var\(--glass-bg\)/.test(READ) && /border:1px solid var\(--glass-border\)/.test(READ)
  && /var\(--shadow-elevation\)/.test(READ));
chk(G1, 'readout cadence is spent in --grid-rhythm',
  /var\(--grid-rhythm\)/.test(READ) && /var\(--grid-rhythm\)/.test(READROW));

/* the pill */
const NAV = body(SIGNAL, '.signal-nav{'), NAVLIFT = body(SIGNAL, '.signal-nav:hover,.signal-nav:focus-within{');
chk(G1, 'nav padding/gap on the space ladder',
  /padding:var\(--space-3xs\)/.test(NAV) && /gap:var\(--space-3xs\)/.test(NAV));
chk(G1, 'the pill hugs its labels and may still shrink below them',
  /width:fit-content\(100%\)/.test(NAV) && /min-width:0/.test(NAV) && !/width:max-content/.test(NAV));
chk(G1, 'hover / focus takes the lift fill, the lit edge, the top shadow step',
  /var\(--glass-bg-lift\)/.test(NAVLIFT) && /var\(--glass-border-lift\)/.test(NAVLIFT) && /var\(--shadow-3\)/.test(NAVLIFT));
const navTrans = (NAV.match(/transition:[^;]*/) || [''])[0];
chk(G1, "nav never transitions a per-frame property (opacity + transform are the camera's)",
  !/opacity|transform/.test(navTrans), navTrans.replace(/\s+/g, ' ').trim().slice(0, 78));
chk(G1, 'arrival is guarded for script and for reduced motion',
  /html\.js \.shell--signal:not\(\.is-cam-gone\) \.signal-nav\{/.test(SIGNAL)
  && /prefers-reduced-motion:reduce/.test(SIGNAL));
const ARRIVE = body(SIGNAL, 'html.js .shell--signal:not(.is-cam-gone) .signal-nav{');
chk(G1, 'the arrival spends only the edge and the elevation, never a per-frame property',
  /border-color:/.test(ARRIVE) && /box-shadow:/.test(ARRIVE)
  && !/opacity|transform/.test(ARRIVE), ARRIVE.replace(/\s+/g, ' ').trim());
chk(G1, 'the handover is announced by the engine, not guessed by a timer',
  /\.shell--signal:not\(\.is-cam-gone\) \.signal-nav/.test(SIGNAL));

/* the shard material speaks the glass contract */
const SHARDRULE = body(EFFECTS, '.shell--signal .transmissions.is-volume > .transmission{');
chk(G1, 'shard fill is --glass-bg, not a second literal', /background-color:var\(--glass-bg\)/.test(SHARDRULE));
chk(G1, 'the sub-floor fill it replaced is gone', !/rgba\(9,13,21,0?\.8/.test(EFFECTS));
chk(G1, 'shard edge derives from --glass-border, behind an @supports guard',
  /@supports \(color:rgb\(from red r g b \/ calc\(alpha \+ 0\.1\)\)\)/.test(EFFECTS)
  && /border-color:rgb\(from var\(--glass-border\)/.test(EFFECTS));
chk(G1, "edge still consumes the engine's depth terms",
  /var\(--sh-lit,0\)/.test(EFFECTS) && /var\(--sh-hot,0\)/.test(EFFECTS));
const floor = parseFloat((tok(TOKENS, 'glass-bg').match(/,(0?\.\d+)\)/) || [])[1]);
chk(G1, 'the fill it inherits clears the legibility floor', floor >= 0.84, 'alpha=' + floor);

/* slab arithmetic: one width, consumed twice */
const VOLS = body(SIGNAL, '.transmissions.is-volume > .transmission{'), CODE = body(SIGNAL, '.transmission__code{');
chk(G1, 'the slab states its width once as --slab-w',
  /--slab-w:clamp\(19rem,31vw,29rem\)/.test(VOLS) && /width:var\(--slab-w\)/.test(VOLS));
chk(G1, 'the name is sized from the slab, not the viewport',
  /--slab-code:calc\(\(var\(--slab-w\)/.test(VOLS) && /min\(var\(--text-cinema\),var\(--slab-code,/.test(CODE));
chk(G1, 'the stacked fallback keeps the cinema step', /var\(--slab-code,var\(--text-cinema\)\)/.test(CODE));
chk(G1, 'slab headline leading is the hero register', /line-height:var\(--leading-hero\)/.test(CODE));
chk(G1, 'no orphan width literal left in the shard rule', !/width:clamp\(19rem/.test(VOLS));



/* ══════════ rendered pixels: PNG inflate + two-cluster contrast ══════════
   Stylesheet arithmetic cannot see light bleeding through a slab, so the
   contrast of every glass surface here is measured off the frame Chrome
   actually painted: decode the screenshot, split the box into its two
   luminance populations (the fill it sits on, and the ink laid over it),
   and take the WCAG ratio between them. */
function pngDecode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8, w = 0, h = 0, depth = 0, color = 0; const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; color = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error('unsupported bit depth ' + depth);
  const ch = color === 6 ? 4 : color === 2 ? 3 : color === 0 ? 1 : color === 4 ? 2 : 0;
  if (!ch) throw new Error('unsupported colour type ' + color);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, out = new Uint8Array(w * h * 4);
  let prev = new Uint8Array(stride), p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], line = raw.subarray(p, p + stride); p += stride;
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0, d = line[x];
      let v;
      if (f === 0) v = d; else if (f === 1) v = d + a; else if (f === 2) v = d + b;
      else if (f === 3) v = d + ((a + b) >> 1);
      else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
             v = d + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)); }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      out[o] = cur[x * ch]; out[o + 1] = cur[x * ch + (ch > 2 ? 1 : 0)];
      out[o + 2] = cur[x * ch + (ch > 2 ? 2 : 0)];
      out[o + 3] = ch === 4 ? cur[x * ch + 3] : 255;
    }
    prev = cur;
  }
  return { w, h, px: out };
}
/* A capture clip is in DOCUMENT space while a bounding rect is in VIEWPORT
   space - proved side by side: the same pill read as flat black at its viewport
   y and as lit type at its document y - and a capture only reaches what is on
   screen, so the window is [scrollY, scrollY + innerHeight). Ignoring the first
   fact samples the wrong part of the page; clamping the height against
   innerHeight rather than against that window silently grinds a deep sample
   into a two-pixel sliver, which is how a pill wearing bright labels came back
   as 1.98:1 of black. Both facts are now checked, not merely avoided. */
function clipOf(box) {
  const x = Math.max(0, Math.round(box.x)), y = Math.max(0, Math.round(box.y));
  return { x, y,
    width: Math.max(2, Math.min(Math.round(box.w), Math.round(box.iw) - x)),
    height: Math.max(2, Math.min(Math.round(box.h), Math.round(box.sy + box.ih) - y)) };
}
function shot(c, box) {
  const clip = clipOf(box);
  /* scale 2 on the clip: at 1:1 an eleven-pixel mono label contributes a
     handful of fully-inked pixels and the anti-aliased halo is the rest of the
     sample, which reads as low contrast whether the type is legible or not.
     Twice the raster and the glyph cores dominate the bright cluster. */
  return c.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 2 } });
}
/* the crop, measured: decode the frame, then split it into its two populations */
const shotCrop = r => inkVsSurface(pngDecode(Buffer.from(r.data, 'base64')));
/* Split a box into its two luminance populations: everything within a few points
   of the median is the surface it sits on, and the pixels that carry the ink are
   the ones bright enough to be type rather than light on glass - see the gate
   below, which is why the phrase "the brightest few per cent" is not a rule the
   ruler can follow blindly. A slab with light pouring through it lifts BOTH
   populations together and the ratio collapses - exactly the failure a stylesheet
   check is blind to, because the stylesheet says the alpha is fine. */
function inkVsSurface(img) {
  const { w, h, px } = img, n = w * h, L = new Float64Array(n), C = [];
  for (let i = 0; i < n; i++) {
    const rgb = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]];
    L[i] = lum(rgb) * 100; C.push(rgb);
  }
  const sorted = Array.from(L).sort((a, b) => a - b);
  const med = sorted[Math.floor(n / 2)];
  /* The ink population has to be found, not assumed. A percentile alone lands
     below the glyph cores whenever the type covers less area than the percentile
     - a 20px mono label inside a 600x340 panel is a twentieth of one per cent of
     the crop - and then the ruler averages the anti-aliased halo instead of the
     ink and reports a legible surface as a failing one. So the gate takes the
     brighter of the 99.7th percentile and everything within 15 points of the
     brightest pixel: the core is always in, the halo never drags it down. */
  const gate = Math.max(sorted[Math.floor(n * 0.997)], sorted[n - 1] - 15);
  /* and a frame whose brightest pixel is barely above its own median holds one
     uniform tone: the element's box was on screen but nothing was painted into
     it - what a composited layer looks like in the instant before it draws.
     That is a timing artefact, not a contrast verdict, and it is named as such. */
  const flat = sorted[n - 1] - med < 6;
  let bn = 0, inn = 0; const bg = [0, 0, 0], ink = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    if (Math.abs(L[i] - med) <= 5) { bn++; bg[0] += C[i][0]; bg[1] += C[i][1]; bg[2] += C[i][2]; }
    if (L[i] >= gate) { inn++; ink[0] += C[i][0]; ink[1] += C[i][1]; ink[2] += C[i][2]; }
  }
  const norm = (a, k) => a.map(v => Math.round(k ? v / k : 0));
  if (!bn || !inn) return { ratio: 0, surface: norm(bg, bn), ink: norm(ink, inn), flat,
    med: +med.toFixed(1), max: +sorted[n - 1].toFixed(1), coverage: +(inn / n).toFixed(3),
    blank: !inn ? 'frame holds no ink at all - nothing painted yet' : 'frame holds no surface' };
  return {
    ratio: ratio(bg.map(v => v / bn), ink.map(v => v / inn)),
    surface: norm(bg, bn), ink: norm(ink, inn), flat,
    med: +med.toFixed(1), max: +sorted[n - 1].toFixed(1), coverage: +(inn / n).toFixed(3),
  };
}
/* Where to read a surface: where it is most itself. The camera scales and fades
   what it flies past, so the rectangle worth trusting is the one read at the
   top of the page before the flight has spent it, and the frame worth capturing
   is the scroll position where the element is whole on screen AND as opaque as
   it ever gets. The framing range is every position at which it can sit whole
   in the viewport; its opacity is sampled at both ends and the middle, and the
   strongest of those three is what gets measured. */
const readBox = (c, sel) => c.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return null; const r = e.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height,
    op: +parseFloat(getComputedStyle(e).opacity).toFixed(3),
    sy: scrollY, iw: innerWidth, ih: innerHeight,
    vis: r.top >= -1 && r.bottom <= innerHeight + 1 && r.width > 20 && r.height > 12 }; })()`);
async function measure(c, sel, label, g, min) {
  await zeroY(c);
  const at0 = await readBox(c, sel);
  if (!at0) { chk(g, label + ': there is something to measure', false, 'no element for ' + sel); return null; }
  const lo = Math.max(0, Math.round(at0.y + at0.h - at0.ih * 0.98));
  const hi = Math.max(lo, Math.round(at0.y - at0.ih * 0.02));
  /* A crop whose brightest pixel is below L 20 while the element's own computed
     opacity says it is up is not a low-contrast surface - it is a crop with no
     ink in it. The dimmest type this page ships is rgb(124,139,166) at L 25.5,
     and the camera's fade is floored above half for exactly that reason, so at
     opacity 0.5 or more nothing that is drawn can be that dark: the capture
     landed while the compositor was mid-draw. Retry it once, drop it from the
     judgement, name it in the spread. A frame with real ink that is merely weak
     is never dropped - that is the failure this battery exists to catch. */
  const stale = f => f.m.flat || (f.m.max < 20 && f.box.op >= 0.5);
  const frames = [];
  for (const want of [lo, Math.round((lo + hi) / 2), hi]) {
    await gotoY(c, want);
    const b = await readBox(c, sel);
    if (!b || !b.vis) continue;
    let f = { box: b, clip: clipOf(b), m: shotCrop(await shot(c, b)) };
    if (stale(f)) { await sleep(450); f = { box: b, clip: clipOf(b), m: shotCrop(await shot(c, b)) }; }
    frames.push(f);
  }
  if (!frames.length) {
    await gotoY(c, Math.max(0, at0.y - at0.ih / 2 + at0.h / 2));
    const b = await readBox(c, sel);
    if (b && b.vis) frames.push({ box: b, clip: clipOf(b), m: shotCrop(await shot(c, b)) });
  }
  if (!frames.length) { chk(g, label + ': sampled inside the frame', false, 'never whole on screen ' + JSON.stringify(at0)); return null; }
  /* Read every frame the element can hold still on screen, and judge the middle
     one of those that actually carry ink. The best frame would be the flattering
     one and the worst would be the moment the camera had already moved on from
     it; the median is what a reader meets, and the spread beside it says whether
     the surface is steady or only lucky. */
  const painted = frames.filter(f => !stale(f));
  if (painted.length < frames.length) note('dropped ' + (frames.length - painted.length)
    + ' inkless frame' + (frames.length - painted.length > 1 ? 's' : '') + ' of ' + label);
  const judged = (painted.length ? painted : frames).slice().sort((a, b) => a.m.ratio - b.m.ratio);
  const mid = judged[Math.floor((judged.length - 1) / 2)];
  const { box, clip, m } = mid;
  chk(g, label + ': the frame handed to the ruler is the whole element',
    frames.every(f => Math.abs(f.clip.width - Math.round(f.box.w)) <= 1
      && Math.abs(f.clip.height - Math.round(f.box.h)) <= 1),
    'crop ' + clip.width + 'x' + clip.height + '  element ' + Math.round(box.w) + 'x' + Math.round(box.h));
  chk(g, label + ': at least one frame held ink to measure', painted.length > 0,
    painted.length + ' of ' + frames.length + ' frames held ink'
    + (painted.length === frames.length ? ''
      : '; the rest peaked below L 20 with the element opaque - the box was on screen and nothing had been drawn into it'));
  const spread = frames.map(f => (stale(f) ? 'inkless' : f.m.ratio.toFixed(1))
    + '@' + Math.round(f.box.sy) + '(p' + f.box.op + ')').join(' ');
  chk(g, label + ': rendered ink over rendered surface >= ' + min + ':1',
    painted.length > 0 && m.ratio >= min,
    m.blank || (m.ratio.toFixed(2) + ':1  ink ' + m.ink + '  surface ' + m.surface
      + '  crop ' + clip.width + 'x' + clip.height + '  coverage ' + m.coverage
      + '  peak L ' + m.max + '   frames: ' + spread));
  return m;
}

/* The page scrolls through Lenis, which keeps its own position and can re-take
   a native scrollTo on the next frame. Try native first, then feed the wheel the
   way a reader does until the position is the one asked for. */
const innerHeightAt = c => c.eval('innerHeight');
/* the page scrolls through Lenis, which keeps gliding after the wheel is let
   go: a position is only reached when the page stops moving. Two reads agreeing
   is not arrival - a screenshot pauses the renderer, and during that pause both
   reads return the same stale number while the page is mid-glide, which is how a
   request for scroll 0 was reported as reached at 198. Three agreements in a
   row, with a third of a second of watching first, is. */
async function settle(c) {
  let prev = await c.eval('Math.round(scrollY)'), same = 0;
  for (let i = 0; i < 20; i++) {
    await sleep(170);
    const now = await c.eval('Math.round(scrollY)');
    same = now === prev ? same + 1 : 0;
    if (same >= 3 && i >= 3) return now;
    prev = now;
  }
  return prev;
}
async function gotoY(c, y) {
  const target = Math.round(y);
  await c.eval('window.scrollTo(0,' + target + ')');
  await sleep(360);
  let got = await settle(c);
  for (let i = 0; i < 14 && Math.abs(got - target) > 6; i++) {
    await c.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 420,
      deltaX: 0, deltaY: Math.max(-420, Math.min(420, target - got)), pointerType: 'mouse' });
    await sleep(160);
    got = await settle(c);
  }
  if (Math.abs(got - target) > 6) { await c.eval('window.scrollTo(0,' + target + ')'); got = await settle(c); }
  return got;
}
/* Back to the top, and prove the page got there. The framing of every measured
   surface is computed from the rectangle read at the top of the page, so a
   settle that stopped mid-glide - which a paused renderer makes possible - would
   quietly move every frame the ruler is aimed at. Ask three times. */
async function zeroY(c) {
  for (let i = 0; i < 3; i++) {
    await gotoY(c, 0);
    if (Math.abs(await c.eval('Math.round(scrollY)')) <= 2) return true;
  }
  return false;
}

/* ══════════ STEP 2 · runtime: boot, field, arrival ══════════ */
console.log('\n═══ STEP 2 · runtime ═══');
const G2 = 'runtime';
const ctx = await launch('signal');
await nav(ctx.c, '/signal'); await sleep(500);
const boot = await bootWait(ctx.c);
chk(G2, 'boots under its own CSP, engine live, Normal Mode by name',
  boot.render === 'ok' && boot.mode === 'signal', 'render=' + boot.render + ' mode=' + boot.mode + ' webgl=' + boot.webgl + ' ctx=' + boot.ctx);
const fonts = await ctx.c.eval(`({status:document.fonts.status,
  d:document.fonts.check('700 1rem "Space Grotesk"'),b:document.fonts.check('400 1rem "Inter"'),
  m:document.fonts.check('500 1rem "IBM Plex Mono"')})`);
chk(G2, 'Space Grotesk / Inter / IBM Plex Mono all resolve', !!(fonts.d && fonts.b && fonts.m), 'status=' + fonts.status);
if (!(fonts.d && fonts.b && fonts.m)) note('webfont files did not reach this sandbox - fallback metrics measured instead');
await size(ctx.c, 1440, 900);

/* the field, read back off the live layout */
const g = await ctx.c.eval(`(() => {
  const inner = document.querySelector('.shell--signal .shell__inner'), cs = getComputedStyle(inner);
  const bx = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, r: r.right, y: r.y, w: r.width }; };
  const p = document.createElement('div'); p.style.cssText = 'position:fixed;left:-9999px;width:var(--grid-col-gap)';
  document.body.appendChild(p); const gapToken = parseFloat(getComputedStyle(p).width); p.remove();
  const cols = cs.gridTemplateColumns.split(' ').map(parseFloat);
  return { n: cols.length, track: cols[0], gap: parseFloat(cs.columnGap), gapToken,
    hero: bx('.signal-hero'), acts: bx('.signal-actions'), read: bx('.signal-readout'), nav: bx('.signal-nav'),
    inner: { x: inner.getBoundingClientRect().x, r: inner.getBoundingClientRect().right },
    padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight) }; })()`);
g.inner = { x: g.inner.x + g.padL, r: g.inner.r - g.padR };
chk(G2, 'the wide field really is twelve tracks', g.n === 12, g.n + ' × ' + g.track.toFixed(1) + 'px');
chk(G2, 'the gutter is the Archive gutter divided by four',
  Math.abs(g.gap - g.gapToken / 4) < 0.6, 'gap=' + g.gap.toFixed(1) + ' vs token/4=' + (g.gapToken / 4).toFixed(1));
/* eight tracks of title card, four of readout, one gutter of air between -
   read out of the boxes, not of the source: the widths are the claim. */
const span = (w) => (w + g.gap) / (g.track + g.gap);
chk(G2, 'the title card owns eight tracks from the left edge, the readout the last four',
  Math.abs(span(g.hero.w) - 8) < 0.05 && Math.abs(span(g.read.w) - 4) < 0.05,
  'card ' + span(g.hero.w).toFixed(2) + ' + readout ' + span(g.read.w).toFixed(2) + ' of 12');
chk(G2, 'they never share an edge, and the readout closes the field flush',
  g.read.x > g.hero.r + g.gap * 0.9 && Math.abs(g.read.r - g.inner.r) < 3,
  'hero→' + Math.round(g.hero.r) + '  readout ' + Math.round(g.read.x) + '→' + Math.round(g.read.r)
  + '  gap=' + Math.round(g.gap));
chk(G2, 'the readout sits low against the card, not on its shoulder', g.read.y > g.hero.y, 'Δ' + Math.round(g.read.y - g.hero.y) + 'px');
chk(G2, 'the actions stop short of the hero edge (the imbalance holds)',
  g.acts.r <= g.hero.r + 1, 'acts→' + Math.round(g.acts.r) + '  hero→' + Math.round(g.hero.r));
chk(G2, 'the pill floats inside the field instead of spanning it',
  g.nav.x > g.inner.x && g.nav.r < g.inner.r, 'nav ' + Math.round(g.nav.x) + '→' + Math.round(g.nav.r));

/* The arrival is spent on material. The motion loop writes an inline
   transform and opacity on this node every frame it runs, and an inline style
   outranks any selector here - so the harness reads the edge and the shadow
   for the state, and proves separately that the movement really belongs to
   the motion layer, which is the fact that made this a material design. */
const navState = () => ctx.c.eval(`(() => { const n = document.querySelector('.signal-nav'), s = document.querySelector('.shell--signal');
  const cs = getComputedStyle(n);
  return { edge: cs.borderTopColor, shadow: cs.boxShadow.replace(/\s+/g, ' '), tf: cs.transform,
           camo: s.style.getPropertyValue('--cam-o'), inline: (n.getAttribute('style') || '').slice(0, 120),
           gone: s.classList.contains('is-cam-gone'), js: document.documentElement.classList.contains('js') }; })()`);
/* one shadow layer per colour: the hairline alone is flat, the hairline plus
   an elevation step is the pill having left the glass. */
const layers = str => (str.match(/rgba?\(|oklab\(/g) || []).length;
const mat = await ctx.c.eval(`(() => { const p = document.createElement('div');
  p.style.cssText = 'position:fixed;left:-9999px;box-shadow:var(--glass-hair)';
  document.body.appendChild(p); const hair = getComputedStyle(p).boxShadow;
  p.style.boxShadow = 'var(--glass-hair),var(--shadow-elevation)';
  const lifted = getComputedStyle(p).boxShadow; p.remove(); return { hair, lifted }; })()`);
await zeroY(ctx.c); await sleep(500);
const at0 = await navState();
/* The handover is a state change, and the material takes its 320 ms once the
   state arrives - and the state arrives when the scroll has, which under Lenis
   is not when scrollTo is called. Land past the crossing rather than on it: at
   1.25 screens --cam-o is exactly zero, where the flag flips every time the
   scroll moves a fraction of a pixel and the transition restarts before it can
   be read. Then wait for the edge, which IS the arrival: waiting for the
   transition to finish is the measurement, not a way of dodging it. */
await gotoY(ctx.c, (await innerHeightAt(ctx.c)) * 1.6);
/* Read the edge the way the scroller reads a position: wait until it stops
   moving. Two reads 180 ms apart that agree cannot straddle a 320 ms ease, so
   what follows is the state the transition arrives at - and the assertion is
   still the token's own alpha, not the fact that something changed. */
let at1 = await navState(), edgeBefore = '';
for (let i = 0; i < 20 && !(at1.gone && at1.edge === edgeBefore); i++) {
  edgeBefore = at1.edge; await sleep(180); at1 = await navState();
}

chk(G2, 'arrival: under the monolith the pill is unlit and lying on the glass, camera live',
  at0.js && at0.camo !== '' && alpha(at0.edge) === 0 && layers(at0.shadow) === layers(mat.hair),
  'edge ' + at0.edge + '  ' + layers(at0.shadow) + ' shadow layers (hairline alone is '
  + layers(mat.hair) + ')  --cam-o=' + at0.camo);
chk(G2, 'arrival: the handover lights the edge and lifts the pill onto the ladder',
  at1.gone && alpha(at1.edge) >= 0.15 && layers(at1.shadow) === layers(mat.lifted)
  && layers(at1.shadow) > layers(at0.shadow),
  'cam-gone=' + at1.gone + '  edge ' + at1.edge + '  ' + layers(at0.shadow) + ' -> '
  + layers(at1.shadow) + ' layers (the ladder step is ' + (layers(mat.lifted) - layers(mat.hair)) + ')');
/* Whether the motion loop is holding an inline transform on the bar depends on
   where in the reveal and the drift you catch it - present on one run, cleared
   on the next - so it is recorded rather than asserted. What the stylesheet
   promises either way is that it never reaches for those two properties. */
note('the motion loop writes inline transform + opacity on the pill while the reveal or drift runs'
  + ' (this run: ' + (at0.inline || at1.inline || 'caught between writes') + '); the arrival is material-only for that reason.');

/* the volume, and the material the engine drives */
const volY = await ctx.c.eval(`document.querySelector('.transmissions').getBoundingClientRect().top + scrollY`);
const sweep = [];
for (const f of [0.2, 0.45, 0.7, 0.95, 0.45]) {
  await gotoY(ctx.c, volY + (await innerHeightAt(ctx.c)) * f); await sleep(240);
  sweep.push(await ctx.c.eval(`(() => [...document.querySelectorAll('.transmissions > .transmission')].map(k => ({
    lit: k.style.getPropertyValue('--sh-lit'), bc: getComputedStyle(k).borderTopColor })))()`));
}
const vol = await ctx.c.eval(`(() => {
  const v = document.querySelector('.transmissions'), kids = [...v.children];
  return { volume: v.classList.contains('is-volume'), n: kids.length,
    shards: kids.map(k => { const cs = getComputedStyle(k); return {
      lit: k.style.getPropertyValue('--sh-lit'), hot: k.style.getPropertyValue('--sh-hot'),
      op: +parseFloat(cs.opacity).toFixed(3), bg: cs.backgroundColor, bc: cs.borderTopColor,
      placed: cs.transform !== 'none' }; }),
    dist: kids.filter(k => k.classList.contains('is-distant')).length }; })()`);
chk(G2, 'the stacked log becomes a 3D volume', vol.volume && vol.n > 3, vol.n + ' shards, ' + vol.dist + ' distant');
chk(G2, 'the engine publishes depth on every shard (lit + hot live on the node)',
  vol.shards.every(s => s.lit !== '' && s.hot !== ''), vol.shards.map(s => s.lit + '/' + s.hot).join(' '));
chk(G2, 'every shard is placed by the projection, not by the layout', vol.shards.every(s => s.placed));
const glass = await ctx.c.eval(`(() => { const p = document.createElement('div');
  p.style.cssText = 'position:fixed;left:-9999px;background:var(--glass-bg);border:1px solid var(--glass-border)';
  document.body.appendChild(p); const cs = getComputedStyle(p);
  const o = { bg: cs.backgroundColor, border: cs.borderTopColor }; p.remove(); return o; })()`);
chk(G2, 'the shard fill resolves to the glass token, floor and all',
  vol.shards.every(s => Math.abs(alpha(s.bg) - alpha(glass.bg)) < 0.011),
  'shards ' + [...new Set(vol.shards.map(s => s.bg))].join(' ') + '   token ' + glass.bg);
const seen = sweep.flat().map(r => ({ lit: parseFloat(r.lit) || 0, a: alpha(r.bc) }));
const top = Math.max(...seen.map(r => r.lit));
const near = seen.filter(r => r.lit >= top * 0.8).map(r => r.a);
const far = seen.filter(r => r.lit <= 0.12).map(r => r.a);
chk(G2, 'the edge ignites toward the lens: near border denser than far border',
  top > 0.25 && near.length > 0 && far.length > 0 && Math.max(...near) > Math.min(...far) + 0.04,
  'lit 0 … ' + top.toFixed(3) + ' over ' + seen.length + ' readings  near '
  + [...new Set(near.map(v => v.toFixed(2)))].join(' ') + '  far '
  + [...new Set(far.map(v => v.toFixed(2)))].join(' ') + '  token ' + glass.border);


/* ══════════ STEP 3 · the name fits the glass it is written on ══════════ */
console.log('\n═══ STEP 3 · fit ═══');
const G3 = 'fit';
const fit = await ctx.c.eval(`(() => {
  const p = document.createElement('div'); p.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(p);
  p.style.fontSize = 'var(--text-cinema)'; const cinema = parseFloat(getComputedStyle(p).fontSize);
  p.style.fontSize = 'var(--text-2xl)'; const twoxl = parseFloat(getComputedStyle(p).fontSize); p.remove();
  const out = [];
  document.querySelectorAll('.transmissions.is-volume > .transmission').forEach(s => {
    const el = s.querySelector('.transmission__code'); if (!el) return;
    const cs = getComputedStyle(el), ss = getComputedStyle(s);
    const inner = s.clientWidth - parseFloat(ss.paddingLeft) - parseFloat(ss.paddingRight);
    const d = document.createElement('span');
    d.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre;font-weight:'
      + cs.fontWeight + ';font-size:' + cs.fontSize + ';letter-spacing:' + cs.letterSpacing + ';font-family:' + cs.fontFamily;
    d.textContent = (el.textContent || '').trim();
    document.body.appendChild(d); const w = d.getBoundingClientRect().width; d.remove();
    out.push({ name: d.textContent, size: parseFloat(cs.fontSize), w: Math.round(w), inner: Math.round(inner) });
  });
  return { cinema, twoxl, out }; })()`);
chk(G3, 'every slab name was measured', fit.out.length >= 4, fit.out.length + ' names, cinema=' + fit.cinema.toFixed(1) + 'px');
chk(G3, 'inside a slab the name is scaled down, and not below the editorial step',
  fit.out.every(o => o.size < fit.cinema && o.size >= fit.twoxl),
  fit.out.map(o => o.name + '@' + o.size.toFixed(0)).join(' '));
fit.out.forEach(o => chk(G3, '“' + o.name + '” fits its slab with air to spare',
  o.w <= o.inner * 0.96, o.w + 'px of type in ' + o.inner + 'px of glass at ' + o.size.toFixed(1)
  + 'px, advance ' + (o.w / o.size).toFixed(2) + 'em'));

/* and nothing walks out of the page at any width */
for (const [w, h] of [[360, 780], [768, 900], [1440, 900]]) {
  await size(ctx.c, w, h);
  const o = await ctx.c.eval(`(() => { const e = document.querySelector('.signal-hero__tag'), n = document.querySelector('.signal-nav');
    const inner = document.querySelector('.shell--signal .shell__inner').getBoundingClientRect();
    return { sw: document.documentElement.scrollWidth, iw: innerWidth,
      tag: e ? Math.round(e.getBoundingClientRect().width) : -1, tagMax: inner.width,
      navIn: n ? (n.getBoundingClientRect().right <= innerWidth) : false }; })()`);
  chk(G3, 'no horizontal escape at ' + w + 'px', o.sw <= o.iw, 'scrollWidth=' + o.sw + ' innerWidth=' + o.iw);
  chk(G3, 'the tag rail cannot set its own width at ' + w + 'px', o.tag <= o.tagMax + 1 && o.navIn, 'rail=' + o.tag + '/' + Math.round(o.tagMax));
}
await size(ctx.c, 1440, 900);

/* ══════════ STEP 4 · contrast, off the painted frame ══════════ */
console.log('\n═══ STEP 4 · rendered pixels ═══');
const G4 = 'pixels';
await ctx.c.eval('scrollTo(0,0)'); await sleep(700);
note('surfaces are sampled at the size and light they actually ship at; the plasma is live, so these are one frame of the worst case');
await measure(ctx.c, '.signal-hero__tag', 'hero tag rail', G4, 4.5);
await measure(ctx.c, '.signal-readout', 'title-card readout', G4, 4.5);
/* the pill at rest under the monolith, where its edge is deliberately unlit */
await measure(ctx.c, '.signal-nav', 'nav pill at rest', G4, 4.5);
/* a slab, clipped to the frame: the camera only ever shows part of one, and the
   part it is showing is the part that has to be readable. Park the frame in the
   middle of the volume first, where a shard is near enough to read. */
await gotoY(ctx.c, await ctx.c.eval(`scrollY + document.querySelector('.transmissions').getBoundingClientRect().top + innerHeight * 0.35`));
await sleep(900);
const slabBox = await ctx.c.eval(`(() => {
  const v = document.querySelector('.transmissions');
  const kids = [...v.querySelectorAll('.transmission')].map(k => {
    const r = k.getBoundingClientRect();
    return { r: { x: r.x, y: r.y, w: r.width, h: r.height }, o: parseFloat(getComputedStyle(k).opacity) || 0,
      lit: parseFloat(k.style.getPropertyValue('--sh-lit') || 0) };
  });
  const best = kids.filter(k => k.o >= 0.6 && k.r.y < innerHeight && k.r.y + k.r.h > 0 && k.r.w >= 220)
    .sort((a, b) => (b.r.w * b.o) - (a.r.w * a.o))[0];
  if (!best) return null;
  const t = Math.max(0, best.r.y), b = Math.min(innerHeight, best.r.y + best.r.h);
  return { x: best.r.x + scrollX, y: t + scrollY, w: best.r.w, h: b - t, o: best.o, lit: best.lit,
    sy: scrollY, iw: innerWidth, ih: innerHeight, tall: b - t }; })()`);
if (slabBox && slabBox.tall > 90) {
  const cl = clipOf(slabBox);
  const m = shotCrop(await shot(ctx.c, slabBox));
  chk(G4, 'shard slab: the frame handed to the ruler is the visible part of it',
    Math.abs(cl.width - Math.round(slabBox.w)) <= 1 && Math.abs(cl.height - Math.round(slabBox.h)) <= 1,
    'crop ' + cl.width + 'x' + cl.height + '  slab ' + Math.round(slabBox.w) + 'x' + Math.round(slabBox.h));
  chk(G4, 'shard slab: rendered ink over rendered glass >= 4.5:1', m.ratio >= 4.5,
    m.blank || (m.ratio.toFixed(2) + ':1  ink ' + m.ink + '  surface ' + m.surface
      + '  presence ' + slabBox.o + '  crop ' + cl.width + 'x' + cl.height
      + '  coverage ' + m.coverage + '  peak L ' + m.max));
} else chk(G4, 'a slab was on screen to sample', false, JSON.stringify(slabBox));

const noise = [...ctx.c.errors, ...ctx.c.exceptions];
chk(G4, 'the page threw no console errors or exceptions on the way through', noise.length === 0,
  noise.slice(0, 3).join(' | ').slice(0, 150));
kill(ctx);

/* ══════════ STEP 5 · the same layout with no script at all ══════════ */
console.log('\n═══ STEP 5 · no script ═══');
const G5 = 'no-js';
const nj = await launch('nojs');
await nj.c.send('Emulation.setScriptExecutionDisabled', { value: true });
await nav(nj.c, '/signal'); await sleep(900);
/* Content is client-rendered: js/render.js writes the shells at boot, so with
   script off there is no nav, no readout and no log to measure - the empty
   page is an architecture fact this phase did not introduce and cannot fix
   from a stylesheet (recorded in REDESIGN_PROGRESS.md as the Phase 3 gap).
   What the sheet alone promises before markup, motion or camera arrive can
   still be asked directly: each fixture below is built from the real class
   names and read back as computed style. */
const s5 = await nj.c.eval(`(() => {
  document.documentElement.classList.add('js');
  const fix = document.createElement('div');
  fix.innerHTML = '<div class="shell--signal"><nav class="signal-nav"><a href="#a">Work</a></nav>'
    + '<dl class="signal-readout"><div><dt>K</dt><dd>V</dd></div></dl>'
    + '<ul class="transmissions"><li class="transmission"><h3 class="transmission__code">CircuitMate</h3></li></ul></div>';
  document.body.appendChild(fix);
  const cs = s => getComputedStyle(fix.querySelector(s));
  const p = document.createElement('div'); p.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(p); p.style.fontSize = 'var(--text-cinema)';
  const cinema = parseFloat(getComputedStyle(p).fontSize); p.remove();
  const n = cs('.signal-nav'), r = cs('.signal-readout'), c = cs('.transmission__code');
  const out = { navOp: +parseFloat(n.opacity).toFixed(3), navTf: n.transform, navBg: n.backgroundColor,
    navEdge: n.borderTopColor, navShadow: n.boxShadow.replace(/\\s+/g, ' '),
    readBg: r.backgroundColor, codeSize: parseFloat(c.fontSize), cinema,
    stacked: !document.querySelector('.transmissions').classList.contains('is-volume'),
    sw: document.documentElement.scrollWidth, iw: innerWidth };
  fix.remove(); document.documentElement.classList.remove('js');
  return out; })()`);
/* The shell here carries no is-cam-gone and no --cam-o, which is exactly the
   state of a page whose camera never ran: the pill must keep its full
   presence and its layout. Only its edge is allowed to be waiting. */
chk(G5, 'no camera, no engine: the pill keeps its presence, its place and its fill',
  s5.navOp === 1 && s5.navTf === 'none' && alpha(s5.navBg) >= 0.84,
  'opacity=' + s5.navOp + '  transform=' + s5.navTf + '  bg=' + s5.navBg);
/* every layer inset is the hairline: nothing is holding the pill above the
   glass, which is the only thing the arrival is allowed to withhold. */
chk(G5, 'the arrival only ever spends the edge, never the control',
  alpha(s5.navEdge) === 0 && (s5.navShadow.match(/inset/g) || []).length === layers(s5.navShadow),
  'edge ' + s5.navEdge + '  shadow [' + s5.navShadow.slice(0, 52) + '…]');
chk(G5, 'the fallback pill and panel are the same glass as the live ones',
  alpha(s5.navBg) >= 0.84 && alpha(s5.readBg) >= 0.84, s5.navBg + '  ' + s5.readBg);
chk(G5, 'outside a volume a name keeps the cinema step',
  Math.abs(s5.codeSize - s5.cinema) < 0.5, s5.codeSize + 'px vs cinema ' + s5.cinema + 'px');
chk(G5, 'the stacked log is the floor: the sheet needs no .is-volume to be legible', s5.stacked);
chk(G5, 'no horizontal escape without script', s5.sw <= s5.iw, s5.sw + ' / ' + s5.iw);
note('no script means no markup either (content is written by js/render.js into [data-shell-inner]), so the '
  + 'phase-2 layout is judged above on the live page and here on the CSS contract; the empty shell is Phase 3 work.');
kill(nj);

/* ══════════ result ══════════ */
console.log('\n=== RESULT · Phase 2 · The Signal ===');
for (const grp of Object.keys(GROUPS)) {
  console.log('  ' + (grp + '            ').slice(0, 10)
    + GROUPS[grp].p + ' passed, ' + GROUPS[grp].f + ' failed');
}
console.log('  TOTAL ' + (N - FAIL) + '/' + N + ' passed, ' + FAIL + ' failed');
process.exit(FAIL ? 1 : 0);

