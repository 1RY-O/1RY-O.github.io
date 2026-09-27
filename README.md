# 1RY — Sonic Rush Portfolio

Live: https://1ry-o.github.io — vanilla HTML/CSS/JS, no build step, GitHub Pages ready.

## What this is

A high-velocity "Sonic Rush" portfolio and interactive resume for a first-year
Mechatronics Engineering student: deep obsidian void (#050505), electric blue
WebGL core (#0059FF), stark velocity yellow (#FFDE00). Heavy italicised
forward-leaning display type (Archivo 900 italic/expanded, standing in for
Monument Extended) paired with JetBrains Mono for resume data. Buttons, tags and
panels use `transform: skewX(-15deg)` and `clip-path` polygons.

## Architecture

| Piece | What it does |
|---|---|
| **Velocity core** (`#gl`) | Raw WebGL (no Three.js, no CDN) fullscreen fragment shader: infinite electric-blue tunnel with rushing rings, shockwaves, radial spokes and a streaming particle field. Mouse drives parallax; hovering a portal opens a gravitational well (`u_warp`/`u_amp`) and speeds the stream up; portal transitions spike chromatic aberration (`u_ab`) and velocity (`u_speed`). |
| **Streak fallback** | If WebGL is unavailable the same canvas becomes a Canvas2D radial streak field with identical parallax + well behaviour. If canvas fails entirely, the CSS radial core stands in. |
| **Boot sequence** | 5-step system log, skewed scale-line rail, 000→100% counter, and the hero name scrambling into place via a text-decode effect (`GLYPHS` charset). Skippable with click, Enter, Space or Escape; auto-dismisses in ~1.4s. |
| **Portal array** | Five skewed portal cards (4 case files + resume). Opening one animates `clip-path: circle()` from the cursor origin to full bleed with `expo.out`, per `--ox/--oy/--or` custom props. Real `#/p/<key>` hrefs, `pushstate` + `popstate` support, Escape to close, Tab is trapped inside the dialog, focus returns to the trigger. Clicking a "RESUME SUMMARY" link inside a case file swaps views without collapsing the circle. |
| **Resume HUD** | Telemetry dashboard injected from `RESUME` data: identity record, snapshot tiles, an engagement log rendered as a glowing blue vertical track whose nodes blast in, glitch their dates and scramble them, a skills matrix of velocity/evidence gauges that fill fast as they enter view, and a project log. |
| **Magnetic physics** | `gsap.quickTo` spring-pull on portals, buttons, HUD links and timeline nodes; each hover also warps the WebGL field behind the element. Pointer-fine devices only, and never double-bound. |
| **Diagonal ticker** | "VELOCITY // ENGINEER // SYSTEM ARCHITECT" runs diagonally in yellow/black at the hero and as an outlined band across the flagship section. |
| **Bottom rail** | Continuous system ticker (portal count, PDF mounted, live read mode, core status) plus back-to-top. |

## Normal / Professional switch

Two `radiogroup` controls (header + resume HUD note) swap the copy on hero,
portals and every case file. Session-only via `sessionStorage`, no cookies.
Keyboard arrows move within the group, `aria-checked` + visible selected state,
and a screen-reader live region announces changes. Open portals rebuild their
copy so the mode always applies.

## Honesty policy (unchanged, and load-bearing)

The approved `Pilla_Sri_Sai_Rahul_Resume.pdf` remains the source of truth:

- No GPA, employment, awards or credentials are claimed beyond that file.
- VI-071 is labelled an active experiment; the BF16 table (1157.1 → 844.9 MB,
  ~27%) is a local measurement, and the separately-reported ~690 MB optimized
  run is shown as **unverified setup, not merged** into the comparison.
- Lumis is labelled an INCOMPLETE PROTOTYPE everywhere it appears.
- CircuitMate's demo URLs are listed in the resume, so they are presented as
  resume-listed and marked "verify" rather than guaranteed.
- Skills gauges are labelled relative, self-assessed evidence depth — each row
  names the build it comes from; they are not certification claims.

## Accessibility & fallbacks

- `prefers-reduced-motion`: boot skipped, no rAF loop (one static frame), tickers
  paused, hero shown immediately, portal content appears without the circle.
- No JS: the `<noscript>` resume summary renders a full plain-text resume, and
  CSS keeps content visible (all hidden states are gated on `.js`/`.anim`, plus
  a 5.2s global failsafe that can never leave the page blank).
- GSAP CDN unreachable: content is revealed instantly, portraits still open,
  magnetic hover is skipped, the WebGL core still runs.
- Dialog semantics (`role="dialog"`, `aria-modal`, labelled by the portal
  title), skip link, visible focus rings, and buttons all carry `type`.

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Deploy

Static files only — pushing `main` serves via GitHub Pages. Do not push or
change repo settings without explicit approval.

## Security & performance audit (2026-09-27)

Audited with headless Chromium 153 over CDP against `git HEAD` as a control.
Verified claims are marked ✅ with the measurement; everything else is called
out as not-applicable or not-done rather than quietly skipped.

### Fixed

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Prototype-chain key injection.** `if(!CONTENT[key])` walks `Object.prototype`, so `#/constructor` (and `#/toString`, `#/valueOf`, `#/hasOwnProperty`, `#/isPrototypeOf`, `#/toLocaleString`) passed the guard and a native function's source was injected into `#portal-body` via `innerHTML`. Reachable by any link: `/#/constructor`. | `script.js` — 5 read sites | `contentFor()` using `Object.prototype.hasOwnProperty.call`. ✅ Verified: before, 3/3 prototype hashes opened the portal and leaked `[native code]`; after, 0/3 open and the body stays empty, while `#/vi071` and `#/resume` are unchanged. |
| 2 | **No WebGL context-loss recovery.** iOS Safari drops the GL context on every app switch and Android Chrome on memory pressure; with no handler the hero canvas stayed permanently black with no error. | `script.js` `init()` | `bindGLRecovery()` — `preventDefault()` on `webglcontextlost` (required or the browser never fires restore), re-init on `webglcontextrestored`, degrade to Canvas2D if the GPU refuses to return. |
| 3 | **Fragment `highp` assumed.** WebGL1 makes fragment highp optional; older Adreno/Mali report precision 0, the shader fails to compile and the whole site silently drops to the slower Canvas2D field. | `script.js` `initGL()` | `getShaderPrecisionFormat` probe, downgrade to `mediump` and recompile instead of losing the effect. |
| 4 | **4K thermal throttle.** Fullscreen fragment shader at dpr 2 on a 2560×1440 screen shaded **11.29M pixels/frame**. | `script.js` `sizeCanvas()` | Shaded-pixel budget (2.6M desktop / 1.1M mobile) on top of the DPR ceiling. ✅ Verified 4K: 11.29M → **2.60M**; phone stays at 0.28M. |
| 5 | **Unescaped `href` sink.** `caseFile()` interpolated a data-supplied `l.href` straight into `href="…"`. All values are hand-authored constants today, so not exploitable — but it is the one path that becomes stored XSS the moment `CONTENT` is fed by a CMS or API. | `script.js` `caseFile()` | `safeHref()` scheme allowlist (https/mailto/#/relative) drops `javascript:`, `data:`, `vbscript:`; `attr()`/`txt()` escapers applied to every plain-text field. `done`/`state`/`nested` stay raw on purpose — they carry authored `<b>` and the benchmark `<table>`, documented inline. |
| 6 | **Missing `og-preview.jpg`** — referenced by both `og:image` and `twitter:image` and 404ing on every share, and specified as a relative URL, which most crawlers reject. | `index.html` | Generated a 1200×630 / 37KB card; URLs are now absolute with `og:image:width/height/alt`. |
| 7 | **`Reference/` was deployed despite `.gitignore`.** The `Reference/` rule was added *after* the 2.1MB of PNGs were already tracked, and git never ignores tracked files — so 5 design screenshots shipped to the public repo. | repo | `git rm --cached -r Reference/`. Files remain on disk. **Staged only — not committed, not pushed.** History still contains them; purging needs a rewrite + force-push, which is your call. |
| 8 | **History pollution.** `closePortal()` used `pushState('#top')`, stacking an entry per open/close cycle so Back walked a dead portal trail. | `script.js` | `replaceState()` to the clean path. |
| 9 | **Hash routing was case-insensitive against lowercase keys**, and there was no `hashchange` listener, so editing the hash in the address bar did nothing. | `script.js` `init()` | Keys normalised to lowercase, `deepKey()`/`handleDeepLink()` added, gated on a new `bootDone` flag so it cannot race the boot sequence. |
| 10 | **`booted` class never set when GSAP fails to load**, unlike the GSAP boot path. | `script.js` `init()` | Set in the `!G` branch. |

### Verified already sound — no change needed

- **No secrets.** Grepped the working tree *and* every patch in all of
  `git log -p --all` for API keys, tokens, `sk-`, `ghp_`, `AKIA`, passwords:
  zero hits. `opencode.json` contains only a `baseURL`, no credential.
- **CSP is strict and correctly scoped.** `default-src 'none'`,
  `script-src 'self'`, `connect-src 'none'`, `form-action 'none'`,
  `base-uri 'none'`, `object-src 'none'`. Zero inline `<script>` and zero inline
  event handlers in `index.html`, so `'unsafe-inline'` is needed only on
  `style-src` (GSAP animates `--pr`/`--ox`/`--oy` custom properties, which
  cannot be pre-hashed). This is also why the usual font-preload trick is
  unavailable: it needs an inline `onload` that this CSP correctly blocks.
- **SRI is valid.** Recomputed:
  `sha384-g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt`
  matches the claimed hash byte-for-byte. GSAP is vendored, not CDN-loaded.
- **All 9 `target="_blank"` links** carry `rel="noopener"`; portal-injected links
  now also get `noreferrer`. ✅ Verified 0 `javascript:` hrefs in the live DOM.
- **Images already lazy + `async` decoded** via `<picture>` with WebP sources
  (PNG fallback only for pre-2017 browsers). Nothing left to compress.
- **No inline handlers, no `eval`, no `new Function`, no `setTimeout(string)`.**
- **Reduced-motion, no-JS and no-GSAP paths** all render full content. ✅
  Verified: reduced-motion shows the hero at opacity 1 with boot hidden; blocking
  `*gsap*` leaves WebGL running and portals opening, with 0 console errors.
- **Clickjacking** is blocked by a frame-busting guard at the top of
  `script.js`, because CSP's `frame-ancestors` is ignored in a `<meta>` tag and
  GitHub Pages sends no `X-Frame-Options`. (Verified: adding `frame-ancestors`
  to the meta produced a console error and did nothing.)

### Not applicable

Row Level Security, CORS, parameterised SQL, connection pooling, password
hashing, OAuth, webhook signatures, file-upload validation, rate limiting,
tenant isolation, mass assignment, command injection, deserialisation, breach
detection, audit logging, API response caching, code splitting, CDN config,
list pagination, loading skeletons, input debouncing. **This repository is a
static site — no server, no database, no auth, no user input, no runtime
network calls.** `connect-src 'none'` means the browser cannot make one.
Auditing those here would be theatre.

### Considered and deliberately rejected

- **`content-visibility: auto` on sections.** The initial DOM is ~28KB and the
  heavy portal/resume markup is already injected on demand. Skipping layout for
  off-screen sections buys nothing measurable while making `root.scrollHeight`
  — and therefore the SCROLL progress readout — jitter as each section swaps
  its placeholder for real size.
- **Trimming the Google Fonts request.** All five requested Archivo faces
  (700/900 normal, 700/900 italic, 900 expanded) are genuinely referenced by
  `styles.css`; there is no unused face to drop. `rel=preload` is blocked by
  CSP as described above.
- **`html { overflow-x: clip }`** — kept, but note it fixes nothing real.
  `scrollWidth` exceeds `clientWidth` because the marquee track is intentionally
  wider than the screen, and `.marq` already clips it. ✅ Verified
  `scrollTo(300,0)` leaves `scrollX` at 0 with *and* without the rule, at 1440px
  and 360px, i.e. no horizontal scrollbar exists. Retained only as insurance,
  and as `clip` rather than `hidden` so the sticky portal bar and scroll
  anchoring keep working.

### Performance: measured, not claimed

Throttled (Lighthouse Slow 4G + 4× CPU) headless Chromium, software GL.
**CLS = 0.00 on every device tested.** Payload: 5 requests, ~190KB decoded.

FCP/LCP are **unchanged** by this work — measured 764–984ms across runs, but the
swing tracks *navigation order*, not the code: whichever of before/after loads
first is always ~130ms faster. There is therefore no honest Lighthouse delta to
report. The wins here are GPU safety and correctness, not speed; anything
claiming a score improvement would be guessing.

### Files added

| File | Purpose |
|---|---|
| `_headers` | HSTS, `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy`, COOP/CORP and cache-control for Cloudflare Pages / Netlify. **GitHub Pages cannot send response headers, so this is inert until you move hosts** — nothing in the site needs to change to adopt it. `frame-ancestors` is set here rather than in the `<meta>` CSP, because it is ignored there. |
| `.nojekyll` | Stops Jekyll processing so the tree is served verbatim. |
| `og-preview.jpg` | 1200×630 social card, 37KB. |

Note `.gitignore` itself has never been committed, which is the root cause of
finding #7 — the `Reference/` rule existed only on this machine.

### ⚠️ Read this before you commit

`vendor/`, `.gitignore` and the two `assets/*.webp` files are **untracked** —
they exist only in the working tree. The last commit (`4ae547c`) still loads
GSAP from `cdnjs.cloudflare.com` and its `script.js` has no `<picture>` markup,
so `HEAD` is internally consistent and the live site works today.

But the working tree has already switched `index.html` to the vendored,
SRI-pinned `vendor/gsap-3.12.5.min.js`, and `script.js` to the WebP `<picture>`
sources. **If you commit those two files without also committing `vendor/` and
the `.webp` files, the deployed site 404s both and silently loses all GSAP
animation** — the no-`G` fallback keeps the content readable, so it fails quiet
rather than loud. Stage them together:

```bash
git add index.html script.js styles.css README.md _headers .nojekyll .gitignore
git add vendor assets/lumis-app.webp assets/lumis-landing.webp og-preview.jpg
```

## Files

| File | Purpose |
|---|---|
| `index.html` | HUD chrome, hero, portal array, flagship telemetry, skills matrix, profile, signal, portal overlay, noscript resume |
| `styles.css` | Token system, tactile/electric styling, ticker, portal clip-path, resume HUD, responsive, reduced-motion, print |
| `script.js` | WebGL velocity core + 2D fallback, boot/decode, portals, magnetic physics, HUD animation, read modes |
| `assets/` | Real Lumis screenshots (used in the Lumis case file) |
| `Pilla_Sri_Sai_Rahul_Resume.pdf` | Approved resume, linked by every View/Download/Print action |
| `resume.pdf` | Old resume, kept untouched as a checkpoint (not linked) |
| `mockup-vortex.html` | Earlier mockup, not shipped as content |
| `Reference/` | Design references — now git-ignored and no longer deployed |

## Print

`PRINT / SAVE` inside the resume HUD calls `window.print()`; the print
stylesheet hides the whole site chrome and renders the resume HUD as a plain
black-on-white document with gauges forced full.
