# 1RY — High-Voltage Engineering Portfolio

Live: https://1ry-o.github.io — vanilla HTML/CSS/JS, no build step, GitHub Pages ready.

## What this is

A futuristic racing-garage / engineering-lab portfolio for a first-year
Mechatronics Engineering student. Near-black graphite, frost white, one
radioactive-green accent used sparingly (active states, transitions,
benchmark highlight). No purple-blue gradients, no fake terminals, no
fake telemetry.

## Sections (in order)

1. **Hero** — "BUILDING MACHINES. TEACHING SYSTEMS TO THINK." with
   crystal/reactor motif, energy pulse, Explore Projects + Resume actions,
   and the Normal/Professional mode selector. Usable instantly, no loader.
2. **01 · VI-071 (flagship)** — audio-to-notation workflow:
   conversion motif (waveform → note events → score), pipeline panel,
   engineering-work panel, and a labeled local CPU benchmark table
   (Legacy FP32 / Streaming FP32 / BF16 / FP16 with the ~27% BF16 finding
   and environment caveats). Real repo link (https://github.com/1RY-O/Vi-071); no demo URL claimed — the reported deployment address is unverified. A separately-reported ~690 MB run is labeled as a separate unverified-setup run, not merged into the benchmark table.
3. **02 · Supporting grid** — CircuitMate (no links published until
   deployment verifies), Bobby (source + live demo, both verified),
   Lumis Journal — labeled INCOMPLETE PROTOTYPE (app + source linked as work-in-progress, real screenshots; broken/unimplemented features not claimed).
4. **03 · Capabilities** — evidence-grouped skills, every group tied to a
   project. No percentage bars.
5. **04 · About** — short, credible, first-year framing.
6. **05 · Resume** — Download + View buttons against the approved
   `Pilla_Sri_Sai_Rahul_Resume.pdf` (source of truth). Old `resume.pdf` kept
   untouched as a checkpoint. VI-071 listed first.
7. **06 · Contact** — email, GitHub, LinkedIn, resume, site.

## Normal / Professional switch

Two `radiogroup` controls (header + hero). Session-only via
`sessionStorage` — no cookies. Swaps 24 text nodes from structured copy in
`script.js` without reload or duplicated markup. Keyboard arrows move within
a group; `aria-checked` + visible selected state; screen-reader live region
announces changes. Honors `prefers-reduced-motion` (instant swap, no fade).

## Motion

IntersectionObserver reveals (transform + opacity only), light-streak scene
dividers, one low-frequency hero glow. Reduced-motion and mobile fall back
to short fades / static. Content is never hidden unless JS init succeeds
(`js-armed` gate); no-JS still reads the full document.

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Deploy

Static files only — push `main` serves via GitHub Pages. Do not push or
change repo settings without explicit approval.

## Files

| File | Purpose |
|---|---|
| `index.html` | All sections, mode-bound copy via `data-mode-text` |
| `styles.css` | Graphite/acid system, hero, flagship, grid, responsive |
| `script.js` | Mode copy maps, radiogroup wiring, reveals, progress |
| `assets/` | Real Lumis screenshots only |
| `Pilla_Sri_Sai_Rahul_Resume.pdf` | Approved resume, linked by all View/Download actions |
| `resume.pdf` | Old resume, kept untouched as checkpoint (not linked) |
| `Reference/` | Source material, not shipped as content |
