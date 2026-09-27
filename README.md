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

## Files

| File | Purpose |
|---|---|
| `index.html` | HUD chrome, hero, portal array, flagship telemetry, skills matrix, profile, signal, portal overlay, noscript resume |
| `styles.css` | Token system, tactile/electric styling, ticker, portal clip-path, resume HUD, responsive, reduced-motion, print |
| `script.js` | WebGL velocity core + 2D fallback, boot/decode, portals, magnetic physics, HUD animation, read modes |
| `assets/` | Real Lumis screenshots (used in the Lumis case file) |
| `Pilla_Sri_Sai_Rahul_Resume.pdf` | Approved resume, linked by every View/Download/Print action |
| `resume.pdf` | Old resume, kept untouched as a checkpoint (not linked) |
| `Reference/`, `mockup-vortex.html` | Source material / earlier mockup, not shipped as content |

## Print

`PRINT / SAVE` inside the resume HUD calls `window.print()`; the print
stylesheet hides the whole site chrome and renders the resume HUD as a plain
black-on-white document with gauges forced full.
