# REDESIGN_PROGRESS — The Signal / The Archive

Working note for the portfolio redesign. One phase per session. This file is
the only document that needs updating between phases; the per-phase report in
chat is the narrative, this is the record.

- Live site: https://1ry-o.github.io — static, no build step, GitHub Pages ready.
- Source of truth for every fact: `Pilla_Sri_Sai_Rahul_Resume.pdf` (unmodified).
- Committed to `main` as the redesign work lands, phase by phase. The
  Powerhouse Overdrive battery passed **118/118** before its merge (see the
  session record below).

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
---

## Apex Command — mechanical horology + spatial depth (session record)

The Signal stopped being a starfield with text on it and became a machine.
Five mechanisms, one clock (the rAF in `js/motion.js`), one WebGL program
(`js/quasar.js`). No new dependencies, no build step.

### 1 · The sapphire lens (`.cursor-dot`, css/effects.css)

The cursor is no longer an emitter, it is a crystal: a 26 px sphere with
`backdrop-filter: blur(4px) brightness(1.2) contrast(1.5) saturate(1.35)`,
two inset shadows standing in for its near and far faces, a conic-gradient
girdle masked to a ring, and a rim drawn from `--theme`. Over an
interactive target it grows to 72 px and its optical power goes up with it.
This is the **only** `backdrop-filter` on the page — the shards keep none,
and four moving blur layers is exactly how a 60 fps lock dies.

### 2 · Climate ignition (data.js → render.js → motion.js → quasar.js)

Every project in `DATA.projects` carries a `theme` hex; `transmission(p)`
in render.js puts it on the shard as `data-theme`. When the orb is captured
by a slab (`want > 0.5` in `galleryStep`), `paintTheme(hex)` writes `--theme`
once on `<html>` and hands the same hex to `PORTFOLIO_QUASAR.setTheme()`,
which parses it into `u_theme` and ramps `u_themeI`. Release removes the
property; a failed portal crossing cools it back to ambient. `:root`
declares `--theme:#7BE7FF` so the whole themed surface list has a floor, and
every themed declaration ships an `rgba()` pair before its `color-mix()`
line for engines that cannot mix a live custom property.

### 3 · Wandering-hour carousel (`galleryStep`)

Each slab enters yawed 45° and off to one side, and resolves to face the
lens exactly as it docks: `turn = (1-approach)² · (1-past)` drives yaw,
lateral swing and the entry of the mechanism together, so the last stretch
of travel is pure Z. Swing direction is `toMid` (derived from the authored
`--gx`), always toward the middle of the volume — the stage is
`overflow:clip`, and a card thrown past its own edge would be cut off
mid-approach. The perspective is solved in the same expression
(`perspective(1150px)` inside the element's own transform list) rather than
inherited from the volume, so the pinhole that positions the slab and the
pinhole that turns it are the same one.

### 4 · Machined type (`--spec`)

`spotStep` publishes the orb's position as a **ratio** — `--spec`, the
percentage across each hollow title's own run — alongside `--spot-x/-y`.
Flood is no longer a cyan paint bucket: it is three layers clipped to the
glyphs (a long anisotropic shade curve, 3 px milling at 96°, and a hard
specular band centred on `--spec`), so sweeping the lens across an ignited
title travels the flare with it. Row inversion has to kill
`background-image` and reset `background-clip`, or the light alloy paints
itself over a flooded row.

### 5 · The mechanical iris (`u_portalT`)

The black hole is gone. Six blades: `cos(6a)` corners the aperture into a
polygon, a 60-tooth `step/fract` term notches its leading edge like a
wheel, the assembly turns a sixth of a revolution across the crossing, and
six hairlines of mechanical black ride the blade seams. In the last 14% of
the travel the assembly is ragged at its own scale — the aperture is a
tear, not a circle. What the blades reveal is **pure black**: the old
theme-flood seal is gone (see Powerhouse Overdrive §4 below), because a
flooded hole can never be provably black at the instant the DOM routes.
The CSS veil mirrors the mechanism: the same radius (148% of the corner
distance), the same hex on its rim, and six seams confined to a thin
annulus by a mask that rides the aperture.

### The dial (`.schematic`)

Concentric hairlines every 58 px, a jewelled ring every 290 px in
`--theme`, and a masked tick assembly — 12 hour markers, 60 minute ticks,
one hand in the project colour — rotating once in **720 s** on the
compositor. Radially symmetric where it can be, one animated transform
where it can't. Hidden outright under reduced motion and `prefers-contrast`.

### Load-bearing order (`armVolume`)

`armGallery` → `armKinetic` → `rebuildGallery`. The volume must be measured
before the type is split, because splitting hands each title's line masks to
the shard that owns them and a shard has to exist to receive them; and it
must be measured **again** afterwards, because splitting a title can move
the box a dock centre is computed from. Both the boot path and the
preference listener call this one function — the arming order is not
allowed to exist in two places.

### Verified / not verified

- `node --check` clean on all `js/*.js`; CSS brace balance intact.
- **No browser run.** The iris geometry, the refraction cost on low-end
  GPUs, the carousel feel and the climate hand-off are unexercised. First
  browser open: hold the orb on a shard (the environment should warm to
  that project's hex within ~300 ms), then open a project link and watch
  the blades rotate open into the same hex.
- `color-mix()` and `backdrop-filter` both degrade by design (paired
  fallbacks / the plain hollow type), but neither fallback path has been
  rendered.

## Powerhouse Overdrive — graphics lift on an untouched DOM (session record)

*Session date: 29 Sep 2026 · The DOM architecture is frozen at `2c5dca9`:
layout, typography and CSS logic are not rewritten by this pass — only the
graphics engine's constraints were lifted.*

**The fork, settled first.** The brief authorised "Three.js via CDN **or**
WebGL2". CDN is not available to this document at any price: the meta CSP is
`script-src 'self'` with `connect-src 'none'`, which blocks a CDN `<script>`
*and* an ESM `import()` — so the library would have to be vendored, at
~339 KB plus a 381 KB core, for a scene that is one triangle and one shader.
Raw **WebGL2** therefore carries the overdrive: zero new bytes, the CSP
untouched, the script plan and the boot handshake unreshuffled, and the
pixel budget still governed from one readable place. If the project ever
wants the library for real (meshes, glTF, a post chain), it goes into
`vendor/` with SRI like GSAP and Lenis — never a CDN tag. The decision is
recorded in `index.html`'s CSP comment and at the top of `js/quasar.js` so
nobody re-litigates it from memory.

### 1 · Residency (killing DOM lag)

- `.cursor-dot` — `will-change:transform,backdrop-filter` plus
  `contain:layout style`. It moves every frame *and* re-samples the backdrop
  every frame, which is the one pairing that makes the compositor re-raster
  the region behind an element. `contain:paint` deliberately **not** used: it
  would clip the two outer bloom shadows.
- `.boot__shard` — added `backface-visibility:hidden` (it already carried
  `will-change:transform,opacity`). The container keeps `will-change:filter`
  alone: it is the `transform-style:preserve-3d` chamber, and hinting
  `transform` on a preserving container risks flattening the formation.
- `.transmissions.is-volume` — `contain:layout paint`, matching the clip it
  already has. `will-change:transform` deliberately **not** on the volume:
  the box is 320 vh tall, so the hint would buy one texture roughly three
  viewports high for a node that never moves. The nodes that do move — the
  shards — were already promoted, and that is where the hint pays.
- Carousel cards already carried `will-change:transform,opacity` and
  `backface-visibility:hidden`; left exactly as they were.

### 2 · GNS Infinity Track (`galleryStep`)

Idle drift is no longer three unrelated sines sharing a variable name. A
shard outside the detent travels a **lemniscate of Gerono** —
`x = cos θ`, `y = ½ sin 2θ` — tilted into its own plane (`orbC`/`orbS`
precomputed at build time, so the tilt costs no trig per frame) with its
**Z taken from the same θ**, so the idle state is one continuous 3D curve.
Two things the sines could not do: a shard rounding the near lobe is
genuinely nearer the lens than one on the far lobe, and the rate is not
constant — the crossing of the eight is the fast part of the cycle, which is
the escapement read, a mechanical train whose members move at different
speeds without ever separating. Amplitude (22–38 px) stays inside the
footprint the clipped volume can hold, and `damp` — squeezed to zero by the
detent — is still what pins a centred card dead still.

### 3 · Twin-dragon plasma void (`js/quasar.js`, rewritten)

Context is requested `webgl2` → `webgl` → CSS core, and **the shader source
stays GLSL ES 1.00 on purpose**: one set of bytes compiles on both contexts,
so there is no second source to drift out of sync and the WebGL 1 path keeps
every pixel of the design. `data-webgl-ctx` records which context was
reached; no rule keys off it.

- `vnoise3`/`fbm3` — real 3D value noise. The 2D fbm could not carry a
  vortex: a vortex needs a third axis so neighbouring depth planes disagree,
  and that disagreement — not blur, not opacity — is what reads as volume.
- `dragon()` — a vortex sampled in its own cylindrical domain: the angle
  around the axis is sheared by depth and time, so the noise is wound into
  filaments and the column turns as a body while its surface boils. A ridged
  `|n|` term gives threads instead of blobs, a two-arm term folds them into a
  spiral, an exponential throat makes the funnel. `dir` alone makes the pair
  opposing — the dragons counter-rotate, either side of the accretion core.
- `plasma()` — one march evaluates **both** dragons at the same samples, so
  they interleave and occlude in a single accumulation, and a sample outside
  a dragon's radius costs one dot and one compare instead of a whole noise
  octet. That early reject — not a smaller volume — is what pays for it. Each
  depth plane is scaled slightly further inward, so the volume has real
  parallax against the pointer instead of sliding as one sheet.
- A domain-warped dust bed sits behind them, so the void is never flat black
  in the gaps between the dragons.
- **Climate hook:** `u_theme`/`u_themeI` drive colour *and* structure — `turb`
  tightens the filaments while the `bloom` gain raises the emission, so a
  capture excites the void rather than recolouring it. In JS the intensity
  runs on a **damped spring (ζ ≈ 0.32) instead of a lerp** and is allowed to
  overshoot past 1 into the shader; that overshoot *is* the detonation. A
  fresh hex also kicks the spring's velocity, so the bloom leads the DOM's
  colour change instead of chasing it.
- **Cost control, in three places:** compile-time `#define VOL_STEPS` /
  `VOL_OCT` picked by tier at `warm()` (renderer string, buffer area, core
  count); a **tier ladder** at link time (a driver that cannot unroll a 7-tap
  march is offered 4-tap, then 3-tap, before it is offered the CSS core); and
  a **frame governor** that walks the DPR cap down in quarter-steps after 90
  sustained slow frames and back up after 240 fast ones. The governor spends
  pixels, never recompiles — a resize costs one re-raster, a recompile is a
  stall. Every loop bound in the shader is a literal or a `#define`, so no
  driver is ever asked to count a loop it cannot count.

### 4 · Mystery tourbillon portal (click)

- **Active Theory flash** — `openPortal` paints the theme and springs
  `--flash` 0→1→0 on the root over ~0.7 s. `body::before` — the one
  pseudo-element on the page nobody else used — becomes a screen-blended hex
  sheet; the hollow type's stroke takes the hex and throws a bloom; the nav,
  chips, status pills and the crystal rim take it too. Suppressed under
  `prefers-reduced-motion` and `prefers-contrast:more`, because the sheet is
  the one part of a strike that could lift the text it passes over.
- **Counter-rotation** — three concentric cages injected into `body` the way
  `armHorology` injects its light (the mechanism does not exist without the
  event that fires it), then `html.is-tourbillon` hands it to CSS: one
  `@keyframes`, three sets of custom properties, each cage with its own axes,
  direction, duration and delay, travelling through a 560 px `perspective()`
  volume past the focal plane so it blows by the lens instead of scaling
  inside the frame. A tear is one class added and one removed — zero
  per-frame style writes per shard.
- **Spaghettification and route-on-black** — the plasma is marched through
  the portal-warped field, so it is already falling when the tear opens; the
  aperture edge is now perturbed by the fbm, which makes it a rip and not a
  circle. Inside the blades is `vec3(0.0)`: the old hex-flood seal is gone
  and the hex stays on the rim plus one blackbody lip, where accreting
  material would actually sit. After the readability floor and the vignette —
  both of which add or scale and would leave a residual grey — comes
  `col *= 1 − smoothstep(0.82, 0.985, pt)`, which drives the frame to exactly
  zero. That line is why routing the DOM at `t = 1` is a property of the
  shader rather than a hope about the iris radius.

### Contract audit

`window.PORTFOLIO_QUASAR` is compatible as shipped: `warm` (still resolves
`'webgl'`/`'css'` for the boot milestone), `tick`, `setDepth`, `setPointer`,
`setFocus`, `setReveal`, `fireImpact`, `setImpactT`, `setPortal`,
`portalValue`, `setTheme`, `mode`. No timing entered the module —
`u_portalT` and `u_impactT` are still written straight from motion.js's
tweens. quasar still owns no rAF, still renders nothing in Archive, still
falls to the CSS core on every failure path, and `html[data-webgl="on"]`
means exactly what it meant before.

### Verification — Phase 3 battery (30 Sep 2026)

**118 checks · 118 passed · 0 failed — VERDICT PASS** (91.4 s), then merged
into `main`. The battery is source-level *and* runtime: it compiles every
tier of the ladder against the real driver, then drives the shipped page over
CDP and reads pixels, uniforms, draw counts and DOM state.

| Phase | Checks | Phase | Checks |
|---|---|---|---|
| static contract | 22 ✅ | click (flash/portal/route) | 17 ✅ |
| env + boot | 9 ✅ | fps + residency | 9 ✅ |
| compile + landed tier | 14 ✅ | reduced-motion | 10 ✅ |
| ambient pixels | 9 ✅ | no-GL | 7 ✅ |
| climate hook | 7 ✅ | contrast | 3 ✅ |
| portal blackout | 6 ✅ | archive | 5 ✅ |

**The one production fix.** The software-renderer sniff read `gl.RENDERER`,
which Chrome masks to `"WebKit WebGL"`, so SwiftShader never matched and the
heaviest tier `[7,3]` ran at `u_quality=1` on a CPU rasteriser (~1.8 fps,
mean RGB 134/157/186 — a white-out). `js/quasar.js` now appends
`WEBGL_debug_renderer_info.UNMASKED_RENDERER_WEBGL` inside a `try/catch`
before the regex. Result: landed tier **[3,2]**, **u_quality 0.25**, ambient
mean **66/83/106** with luma **p05 24.7 / p95 192.5**, dragon lobes at
89.6/122.2 against a far corner of 25.9. The tier ladder existed for exactly
this case; it was just never reached.

**Route-on-black, proven three ways:** the source ordering (`col *=` blackout
after the readability floor and the vignette, with nothing that adds light
after it), `u_portalT = 1` → every pixel exactly 0 (max channel `[0,0,0]`,
mean `[0,0,0]`), and a real click whose navigation is intercepted at the
instant of routing — frame black, `u_portalT` 1.000, `--portal` monotonic
`[0, 0.015, 0.037, 0.938, 1]`, `--flash` peaking **0.906**, three cages, and
the 4.5 s failsafe releasing the aborted route with the page intact.

**Climate:** hex reaches `u_theme` exactly, `u_themeI` peaks **1.082** (the
documented spring overshoot past 1), frame mean R 70.7 → 163.0, and release
cools it back to 69.7.

**Hostile:** reduced-motion never creates a GL context; no-GL settles
`mode()` → `'css'` on the preloader's own clock; contrast suppresses the
strike sheet (stroke `rgb(123,231,255)`); archive mounts the canvas but
issues **0 draws in 2 s**.

**Recorded deviations.** 60 FPS is asserted as frame *cost*, not frame time
(p95 483 ms on SwiftShader — a GPU question this environment cannot answer);
`.transmissions.is-volume` still carries no `will-change` (320 vh box, see
§1); the live sapphire lens node is absent under headless because it is built
only on `pointer:fine`. `gsap.ticker.lagSmoothing(0)` was used **for
measurement only** so a 1.5 s crossing could complete at software frame
rates — no shipped file was changed by it.


## Phase 1 — Design foundation: typography, grid, glass (session record, 30 Sep 2026)

The engine was locked at Phase 3; this phase is the layer the engine has to
carry type on. Scope was CSS only — `css/tokens.css`, `css/signal.css`,
`css/archive.css`, 89 insertions across three files, no JS file opened.
`js/quasar.js` is byte-identical to HEAD (`md5 ec3efd8f…`, asserted in the
battery rather than promised), no class name was removed or renamed, and the
approved palette tokens are untouched. The phase adds structure to the
token surface; it does not restyle anything already composed.

### 1 · A scale with a floor and a ceiling

`--text-display`, `--text-hero` and `--text-cinema` already existed and are
kept verbatim — the 13rem hero cap is the design's own voice, so the hero
still measures 60.6 / 115.7 / 206.4 px at 360 / 768 / 1440 (middle term
`0.75rem + 13.5vw`, cap not yet reached at 1440). What was missing was
everything *below* display: a prose scale has to be continuous from the
monument down to the 11px mono label, and the shipped CSS was mixing
rem literals in that band. Added `--text-3xs … --text-3xl`, every step a
`clamp()` on rem so browser zoom keeps working, measured as monotonic at
three viewports and landing on real component boxes: h2 28.8 → 39 → 52,
case-file prose 15.1 → 15.9 → 17, eyebrow and mono label 11 → 11.5 → 12.

Two extra leading registers, because the scale reaches 13rem: `--leading-hero`
(0.9) — at display sizes even 1.04 floats a four-word line into a stack of
words instead of one mass — and `--leading-loose` (1.72) for Archive
long-measure prose. `h1`–`h4` and `p` are now bound to the scale in the reset
so a component that sets no size is still on the ladder, and `.eyebrow` /
`.tech-label` share one rule: same role, two names, one measurement.

### 2 · The twelve-column field, named

The Archive's editorial split was a literal `minmax(0,7fr) minmax(0,5fr)`
copy-pasted into two rules. It is now a contract: `--grid-cols:12` names the
field, `--grid-major` / `--grid-minor` are the shipped 7 + 5 reading of it,
`--grid-col-gap` / `--grid-row-gap` are the gutters, and `--grid-rhythm`
(1.5rem) is one line of prose at `--text-base`/`--leading-body`, so the
vertical cadence is measured in whole lines. The `minmax(0,…)` guard stays on
the component side deliberately: a long mono part number or a bench figure is
otherwise enough to blow out a track.

Measured after the swap: masthead plus all four case-file bodies split at
exactly **1.40** track ratio (7/5) — five splits, none within 4% of drift —
and the column gutter resolves to 110.4px, identical to `--space-xl` at
1440. `--measure` still resolves to its own definition: the summary's
`max-width` computes to 707.824px = 66 × 10.72px, 10.72px being one `ch` of
the prose face at the rendered size — verified against a live `1ch` probe
rather than against the unit string, because Chrome resolves `ch` to px at
computed-value time.

### 3 · Glass at a measured alpha

A panel over live plasma has to survive the brightest frame the shader can
emit, because nothing in the compositor guarantees a dark backdrop. Sampling
the worst case (frame max 255,255,255) through candidate fills:

| fill alpha | `--ink` | `--ink-muted` | verdict |
| --- | --- | --- | --- |
| 0.84 | 10.96:1 | 7.26:1 | AAA body, AAA muted |
| 0.70 | 6.46:1 | 4.28:1 | AA body, muted fails |
| 0.94 | — | — | backdrop effectively gone |

`--glass-bg` is therefore `rgba(10,15,27,0.84)`: the floor for anything
 carrying prose, still translucent enough that the plasma reads *through* the
panel rather than being painted over it. `--glass-bg-lift`, `--glass-border`
and `--glass-border-lift` name the hovered state and the flat hairline so a
panel can state both without repeating a literal, and the elevation ladder
`--shadow-1/2/3` (with `--shadow-elevation:var(--shadow-2)` as the floating
reference step) is shadow only — no rounding, no glow, no blur filter
smuggled in, which the battery checks by string.

Re-measured off rendered pixels rather than arithmetic: sampling the 21,420
pixels of the nav's interior over live plasma, `--ink` holds **13.56:1** and
the nav's own link colour holds **8.99:1** at the 99th-percentile luma
pixel. The hottest single pixel inside the panel was `rgb(44,54,65)` — the
milled edge, where no text can sit.

**A defect the battery caught.** `.signal-nav` shipped two `background:`
shorthands; the second one, carrying only image layers, resets
`background-color` to transparent. It was invisible before because the
padding-box gradient was opaque at 0.94. At a 0.84 fill it would not be: the
1px border ring is painted only by `--glass-edge`, whose alpha dies toward
the bottom-right, so plasma would show through the edge of the bar with
nothing behind it. The rule now uses longhands — `background-color` under
every layer, taking the clip of the last one (`border-box`) — so the fill
spans the ring and the milled edge still draws on top. `effects.css` keeps
its shorthand idiom, where the surface is opaque and the ring cannot leak.

### Verification — Phase 1 battery (30 Sep 2026)

Scratch harness `/tmp/pw/verify-type.mjs` plus `/tmp/pw/overflow.mjs`: zero
npm dependencies, Node 22 `WebSocket` driving Chrome over CDP, a 20-line Node
server serving the repo at `127.0.0.1` so the page runs under its real
`<meta>` CSP. Static phase first (brace balance, token completeness, no
`var()` without a declaration or a fallback, class-name integrity vs HEAD,
`js/quasar.js` md5), then runtime, then pixels.

**57/57** signal, **35/35** archive, **23/23** sweep — 115 checks, 0 failures.
The sweep walks every element at 360 / 768 / 1440 in both routes and asserts
three separate things: the document does not scroll sideways, nothing sits
past the frame with no ancestor willing to clip or scroll it (the root uses
`overflow-x:clip`, which *hides* overflow, so scrollWidth alone proves
nothing), and no text box is cut by its own box. The nav stays one row at
every width, and the Archive's benchmark table degrades to its own scroller
(`[auto]`, 444px of table inside 324px) instead of widening the page.

Four failures were the harness's fault, and each was fixed in the harness, not
papered over in the CSS: a `var(--gallery-height,320vh)` fallback is a
deliberate hook, not a dangling reference; Chrome resolves `ch` to px at
computed-value time, so the `--measure` check had to compare against a live
`1ch` probe instead of a unit string; the `aria-live` announcer is a
`.sr-only` 1px clipped box and must not be measured as a text box; and the
frame-escape check walked only the immediate parent, so it flagged table
cells whose scroller is `.bench-wrap` two levels up. Descendants of an SVG
viewport are clipped by that viewport and are excluded for the same reason.

**Recorded deviations.** The contrast measurement is taken at 1440 only, and
the luma samples come from a SwiftShader frame — a software renderer's
plasma, conservative but not identical to a GPU's. `--glass-bg` moved the nav
fill from 0.94 to 0.84 alpha and its hairline from 0.08 to 0.16: both
deliberate, both noted above. `.transmissions.is-volume` still carries no
`will-change` (see §1), and no token in this phase is consumed by JS — the
`--par-*`, `--sh-*` and `--cam-*` properties remain motion.js's own.
