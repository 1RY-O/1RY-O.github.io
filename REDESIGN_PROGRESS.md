# REDESIGN_PROGRESS — The Signal / The Archive

Working note for the portfolio redesign. One phase per session. This file is
the only document that needs updating between phases; the per-phase report in
chat is the narrative, this is the record.

- Live site: https://1ry-o.github.io — static, no build step, GitHub Pages ready.
- Source of truth for every fact: `Pilla_Sri_Sai_Rahul_Resume.pdf` (unmodified).
- Nothing here has been committed, pushed, or deployed by the redesign work.

---

## Phase status

| Phase | Title | State |
|---|---|---|
| 0 | Reconnaissance & design blueprint | ✅ complete |
| 1 | Design foundation (tokens, data, shells, mode switch) | ✅ complete |
| 2 | Normal Mode — The Signal (celestial renderer, hero, discovery) | ⬜ next |
| 3 | Professional Mode — The Archive (case-study composition) | ⬜ |
| 4 | Motion & interaction polish | ⬜ |
| 5 | Content verification & case studies | ⬜ |
| 6 | Responsive & cross-device refinement | ⬜ |
| 7 | Performance, accessibility & failure states | ⬜ |
| 8 | Final QA & release candidate | ⬜ |

---

## Phase 0 — what reconnaissance established

**Retire:** the entire Sonic Rush aesthetic — `#050505`/`#0059FF`/`#FFDE00`,
Archivo 900 italic, `skewX(-15deg)`, WebGL velocity tunnel, diagonal marquees,
boot log, "portal" language. Per the brief, none of it is reused.

**Keep (verified working in the retired build):** strict CSP with no inline
script or handler, SRI-verified vendored GSAP, frame-busting guard,
`noopener` on every `target="_blank"`, `_headers` hardening, `noscript`
readability, reduced-motion path, GL context-loss recovery, session-only mode
preference, deep links.

**Content verified against the approved PDF (and live link checks, 28 Sep 2026):**
B.Tech Mechatronics, Mahindra University, 2026–2030, first semester (no CGPA —
none issued); Class XII AP State Board 89% (2026); Class X CBSE 85.4% (2024);
VI-071 audio-to-sheet-music, active experiment, no public demo claimed;
Bobby developer troubleshooting assistant, live demo responding; CircuitMate
voice-oriented electronics troubleshooting, frontend demo responding but
**`circuitmate.onrender.com` timed out**; Lumis incomplete AI journaling
prototype with real screenshots in `assets/`.

**Open questions carried forward:** the flagged CircuitMate backend link stays
marked unverified until it responds; `resume.pdf` (the older, unapproved
résumé) is still in the repository but is not linked anywhere.

---

## Phase 1 — design foundation

### Files

| File | Role |
|---|---|
| `index.html` | **Replaced.** Shell of both experiences, shared chrome, readable fallback |
| `css/tokens.css` | **New.** Tokens, reset, base typography, shared components, chrome, mode-visibility rules, reduced motion |
| `css/signal.css` | **New.** The Signal's composition only (asymmetric, atmospheric, floating nav) |
| `css/archive.css` | **New.** The Archive's composition only (editorial, numbered sections, sticky index, case files) |
| `js/boot.js` | **New.** Pre-paint: frame guard, `js`/`no-js`, mode restore, render failsafe |
| `js/data.js` | **New.** `window.PORTFOLIO_DATA` — the single source of truth for both modes |
| `js/render.js` | **New.** `window.PORTFOLIO_RENDER` — builds both markups from that data |
| `js/mode.js` | **New.** Mode controller: render, switch, announce, context map |
| `_headers` | **Edited.** Revalidation added for `/css/*` and `/js/*` (unfingerprinted) |
| `styles.css`, `script.js`, `mockup-vortex.html`, `vendor/` | **Untouched, now unreferenced.** Retired build, still in git history. Deleting them is a phase-5/8 decision, not taken here |

### Design tokens

Colour: `--void #070A12`, `--deep-space #101827`, `--starlight #EAF3FF`,
`--nebula-mist #8FA4C4`, `--ion-cyan #7BE7FF`, `--astral-violet #A994FF`, plus
`--surface-1/2/3`, three hairline weights, and state washes for verified /
in-progress / prototype / unverified.

Type: display Space Grotesk, body Inter, technical mono IBM Plex Mono. Fluid
scale `--text-3xs … --text-hero` (all `clamp()`), with leading and tracking
tokens.

Space/radius/layout: `--space-3xs … --space-3xl`, squared radii with a single
pill, `--container`, `--gutter`, `--measure`, `--head-h`.

Motion: two personalities from one vocabulary — `--ease-celestial` and
`--ease-drift` for The Signal, `--ease-editorial` and `--ease-exit` for The
Archive, with `--dur-instant` → `--dur-cinematic`.

### Structure

Both experiences render from `js/data.js` through `js/render.js`, so content
cannot drift: **one** source, **two** compositions. They differ structurally,
not cosmetically — Signal uses an asymmetric twelve-column hero with a telemetry
readout, a stacked transmission log, a constellation of nodes and a floating
pill nav; Archive uses a masthead, a sticky numbered index, case files with
facts / evidence / limits columns, a matrix, dated ledgers and a contact block.
Only one of them is ever in the render tree or the accessibility tree.

Mode visibility is CSS-driven from `html[data-mode]` plus `html[data-render]`;
`display:none` — not `aria-hidden` — is what keeps the inactive experience out
of the focus order entirely.

### Mode switch

`role="radiogroup"` with two `role="radio"` buttons: click or tap to select, Tab
to enter, arrows / Home / End to move and select, `aria-checked` + roving
tabindex, a visible selected state, and a polite live region announcing the
change. Choice is restored before first paint from `#/signal` / `#/archive`,
then `sessionStorage`, then defaults to The Signal. Switching maps the reader's
current section across modes (`sig-transmissions ↔ arc-cases`, and so on) so
mid-read switching does not throw them to the top. `history.replaceState` keeps
the URL in step without filling the back button with mode changes.

### Measured contrast (computed, not assumed)

On `--void`: ink 17.68:1, muted 11.71:1, faint 7.75:1, ghost 5.75:1, cyan
13.87:1, violet 7.88:1, warn 12.72:1, ink-on-accent 13.30:1 — all AA or better.

Aurora backdrop: at full glow the worst case would be ghost 3.62:1 over
`#1F3742`, so the veil floor is set to **0.68**. That keeps ghost at 4.8:1,
faint 6.3:1 and muted 9.5:1 (background `#14232D`) while still reading as a low
horizon of light rather than a panel.

### Safeguards preserved

CSP unchanged in strength (`script-src 'self'`, `connect-src 'none'`,
`object-src 'none'`, `base-uri 'none'`), zero inline scripts, zero inline event
handlers and zero inline `style` attributes; the frame-busting guard moved to
the top of `js/boot.js`; vendored GSAP with its SRI hash left in place for phase
4; `_headers` hardening extended; `noopener noreferrer` on every
renderer-produced external link; hrefs pass a scheme allowlist before they can
become links; `data-unverified` styling so an unconfirmed link never looks like a
working one; and no-JS readability now lives in an always-present `#fallback`
block that also stays up if rendering ever fails.

### Checks run in this phase

- **HTML** — tag balance, duplicate ids, no inline script/handler/style, all
  local references resolve, `noopener` audit, no `http://` links.
- **CSS** — brace balance; 81 custom properties defined, 67 used, **0
  undefined**; mode sheets draw every `var()` from `tokens.css`; no composition
  class leakage between the two mode sheets.
- **JS** — delimiter balance via a regex-literal-aware scanner; all four modules
  `'use strict'` and correctly closed; no scaffolding markers left behind.
- **Data** — `js/data.js` parses as a valid object literal; a contract test
  asserts every field the renderers read exists; exactly one link is marked
  unverified; all project links are `https`; qualifiers (`no CGPA has been
  issued`, `incomplete prototype`, `active experiment`, not employment, no
  awards) are present; screenshot files exist on disk.
- **Renderers** — every template tag-balanced, no inline styles emitted, and the
  two mode vocabularies differ (`ol`/`section`/`span` vs `header`/`b`, with the
  section markup produced by separate functions).
- **Served locally over HTTP** — `/`, both stylesheet layers, all four scripts,
  the résumé PDF and both screenshots return 200 with correct content types.

### Known issues / carried forward

1. **No JS runtime exists in this environment**, so the renderers were verified
   by static analysis (contract + template balance), not by execution. The first
   browser open should confirm both shells paint and the switch works.
2. `style-src 'unsafe-inline'` is still in the CSP. Nothing in phase 1 needs it;
   it is kept because the phase-4 motion layer writes style attributes. Phase 7
   must test whether it can be removed.
3. `og-preview.jpg` belongs to the retired identity, so `og:image` is
   intentionally absent until phase 5 produces a replacement.
4. `README.md` still documents the retired Sonic Rush build; it is rewritten at
   release (phase 8), not before.
5. `styles.css`, `script.js`, `mockup-vortex.html` and `vendor/gsap` are
   unreferenced but kept — GSAP for the phase-4 motion work, the rest out of
   caution. Nothing in the new build imports them.
6. Two mode `<h1>` elements coexist in the document; only one is ever rendered.
   That is correct, but worth re-checking with a screen reader in phase 7.
7. Section order differs between modes (Signal leads with transmissions;
   Archive leads with case files after a masthead). The context map links the
   three that correspond; the archive's academic-record and activities sections
   have no Signal counterpart, so switching from them keeps the scroll offset.

### Next phase (2) — The Signal

Build the celestial renderer on the existing `[data-quasar]` mount (WebGL first,
Canvas2D fallback, CSS atmosphere last), the choreographed hero reveal,
discovery-oriented transmission interaction and the constellation treatment —
without touching The Archive's composition.

---

## Phase 4 — "God-Tier" upgrade (28 Sep 2026)

All six requested upgrades are implemented. Nothing is committed or deployed;
this is a working-tree change for review.

### What shipped, by upgrade

1. **Cinematic boot preloader** — `css/boot.css` + markup in `index.html` +
   `js/preloader.js`. A terminal acquisition sequence over a locked page:
   seven milestones, each a promise for something that truly happened
   (document parsed → `document.fonts.ready` → both shells rendered →
   near-viewport screenshots decoded → shader compiled and linked → a frame
   presented → a 700 ms floor), with per-line durations in ms and a
   `0.00% → 100.00%` counter in tabular numerals that eases toward the last
   cleared milestone and never passes it. The rail animates `scaleX` only.
   Exit paths: natural finish, **Skip intro**, Escape/Tab/Enter/Space, any
   click on the overlay, and an unconditional 5 s failsafe in `js/boot.js`.
   The handoff is a GSAP timeline: panel fades, `html.is-booting` is removed
   (which is also what un-hides the content — no JS, no boot), the hero
   staggers in, and `u_reveal` ramps the WebGL field up over 1.4 s. The
   reveal selector list in `boot.css` and `preloader.js` is kept **textually
   identical** and verified as such by the check pass.
2. **Lenis momentum scrolling** — `vendor/lenis-1.3.26.min.js` (SRI'd),
   driven from the single `requestAnimationFrame` in `js/motion.js`
   (`autoRaf:false`, `lerp:0.1`, touch keeps native feel, `anchors:true`).
   ScrollTrigger is wired through `lenis.on('scroll', ScrollTrigger.update)`;
   the GSAP ticker is deliberately not used because this file owns the loop.
   `PORTFOLIO_MOTION.scrollTo` routes every programmatic scroll through Lenis
   so its virtual position cannot desync — mode switches use an instant jump
   inside a View Transition and a smooth one outside it.
3. **Machined-glass UI** — `css/effects.css` + `--glass-edge` /
   `--glass-hair` / `--glass-drop` tokens in `tokens.css`. Two-layer
   backgrounds (surface `padding-box`, 145° border gradient `border-box`) so
   the edge is brightest top-left with one cyan lift in the far corner;
   hover states repaint only `--glass-surface`. Applied to chips, statuses,
   figures, quiet buttons, the mode switch, the Signal nav pill, fallback
   cards and the HUD — statuses keep their tone through tinted surfaces *and*
   tinted edges (`verified` / `progress` / `prototype`). Statement rows
   (transmissions, case files, section heads) deliberately stay on
   hairlines: a glowing card around a paragraph fights the layout. Plus the
   micro-grain: a static 140×140 `feTurbulence` data-URI on `body::after`
   at `opacity .035; mix-blend-mode:overlay`, above the backdrop and below
   all content, disabled under `prefers-contrast:more`.
4. **View Transitions mode switch** — `document.startViewTransition()` in
   `js/mode.js`, guarded by feature check + reduced-motion + a `ran` flag so
   a commit can never execute twice; a synchronous throw (rapid re-entry)
   falls back cleanly. Only the two shells carry `view-transition-name`, so
   header, footer and grain are never re-rasterised. Duration follows the
   destination: Archive arrives at `--dur-fast`/`--ease-editorial`, Signal at
   `--dur-slow`/`--ease-celestial`; `html[data-vt]` suppresses the CSS
   `is-revealing` animation so the two can never stack. Without the API the
   old CSS reveal is the entire behaviour.
5. **Telemetry HUD** — fixed pill in `index.html`/`css/signal.css`, written
   by `js/telemetry.js` at 15 Hz from the same frame loop. `DEPTH` is the
   real scroll fraction; `RA` and `DEC` are deterministic functions of depth
   plus a slow time drift (never randomness); `FIELD` is the sector the
   depth falls in (`INNER → MIDPLANE → JET → ESCAPE`). Visible only in
   Signal mode on ≥1100 px pointer-fine screens, `aria-hidden`, parks itself
   when the footer enters view, and the footer gains matching bottom padding
   so the HUD never covers a link. Fixed positioning keeps it out of the
   shell grid, so it needs no re-render on mode switches.
6. **Magnetic 3D cards** — `js/motion.js` arms `[data-tilt]` on `.figure`,
   `.transmission` and `.case-file` only for `pointer:fine` with motion
   allowed. GSAP `quickTo` (pre-created per element) eases
   `rotationX/rotationY` to a 6°/4° clamp; pointer handlers only store
   numbers and `tiltStep()` spends them inside the frame loop, so a 120 Hz
   mouse still costs one transform write per card per frame. The specular
   glare is a `::after` radial driven by `--mouse-x/--mouse-y` (percentages,
   written in the same rAF). Hovering a card also feeds the shader a focus
   point — the field leans into a gravitational well toward the card and
   relaxes on leave.

### The celestial renderer — `js/quasar.js` (upgrade 1's engine)

Single fullscreen triangle, single GLSL pass: tilted accretion disk with
shearing fbm streaks, volumetric rays, a pulse ring every ~4.5 s, chromatic
core, starfield, pointer parallax, scroll-depth lift, hover well. Contract:
never runs under reduced motion (the CSS core is the static, contrast-
measured substitute), renders nothing in Archive mode, owns no rAF, and
every failure resolves silently to the CSS core.

**Decision: raw WebGL, not Three.js.** Measured from the registry on
28 Sep 2026: `three.module.min.js` 338,908 B / 78,794 B gz *plus*
`three.core.min.js` 381,124 B / 100,467 B gz (a bare import ships both)
≈ **179 KB gzipped** to draw one quad, and it is ESM-only. `js/quasar.js` is
a fraction of that and keeps the pixel budget in one place. Numbers and
rationale are recorded in `vendor/README.md`.

**Contrast budget honoured:** the shader keeps its bottom band near black
(`smoothstep(-0.50,-0.40,uv.y)` floor) because the readability veil only
removes ~62–68 % of the canvas down there — that is what preserves the
phase-1 measurement (ghost ≈ 4.8:1 on `#14232D`, which is the AA ceiling
every token is held to).

### Stacking change worth knowing

`css/signal.css` dropped `isolation:isolate` from `.shell--signal` and
`css/tokens.css` gave `.fallback` `position:relative; z-index:1`. Required
so the grain (`body::after`, z 0, painted last) lands **between** the cosmic
backdrop (z 0) and all content (z 1); with isolation, `z-index:1` content
was trapped inside an auto stacking context and would have painted above the
grain. The full paint order is documented in `effects.css`.

### Verification (static only — no JS runtime or browser here)

- **JS** — custom lexer over all nine modules: strings, template literals,
  comments and regex literals resolved; every bracket/brace/paren balanced.
- **GLSL** — both shaders balanced; all **8 uniforms** in the fragment
  source exactly match the `getUniformLocation` list; `a_pos` declared and
  looked up; ES1.00-only tokens; guarded precision; **no `pow()`** (it is
  undefined for negative bases); all four `smoothstep` calls have ascending
  edges.
- **HTML** — nesting balanced, zero inline scripts/handlers (CSP), all local
  refs exist, **all three SRI hashes recomputed and matched**, 7 boot
  milestone lines, 4 telemetry keys.
- **CSS** — all five files brace-balanced; every no-fallback `var()`
  defined (87 tokens); `@keyframes` unique across files.
- **Contracts** — reveal lists textually identical (10 selectors); boot
  PLAN weights sum to 1.000; every consumer API call has an exported
  definition; all markup hooks queried by JS exist; every tilt/reveal class
  is produced by the renderer.
- **Behavioural guards** — single rAF loop owns Lenis + tilt + quasar +
  telemetry, Lenis `autoRaf:false`, VT cleanup on both promise outcomes,
  unconditional boot failsafe, non-stalling step chain, archive/reduced
  motion skips in the renderer.
- **HTTP smoke** — HTML, 5 stylesheets, 9 scripts, 3 vendor files and a
  screenshot all served 200 locally.

### Known issues / carried forward

1. **Still no browser verification.** The boot choreography, Lenis feel, VT
   timing, shader look and tilt physics are unexercised — the first browser
   open should watch the boot end-to-end, switch modes rapidly (the VT
   re-entry path), and scroll the Signal after a cold load.
2. `vendor/` (now also ScrollTrigger + Lenis + two licence files +
   `vendor/README.md`) is untracked in git; README.md's commit checklist
   predates this phase. Stage `vendor/`, `assets/` and the new `css/`+`js/`
   files together at release time — half a stage deploys a broken site.
3. `style-src 'unsafe-inline'` is now genuinely load-bearing: GSAP and the
   tilt layer write inline style attributes. Phase 7 must re-test removal.
4. The boot shows on every load (700 ms floor, ~1.2 s typical). A
   returning-reader fast path behind a sessionStorage flag is an open
   question, not a defect.
5. If the reader skips the boot before milestone 5, the shader is never
   warmed for that visit — the deliberate trade: the CSS core stands in
   rather than stalling the skip.
6. The Canvas2D fallback from the original phase-2 sketch was dropped: the
   CSS core already *is* the contrast-measured static fallback, and an
   untested second renderer would add risk without adding reach. Revisit
   only if WebGL failure rates ever show up.

### Next phase (5+)

og:image replacement for the retired preview, README rewrite at release
(phase 8), and the phase-7 accessibility/performance pass (SRI re-check,
`unsafe-inline` removal test, screen-reader walk of both shells).
