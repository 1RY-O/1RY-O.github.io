# Pilla Sri Sai Rahul — a living type specimen

**GENOME** — an interactive type installation for https://1ry-o.github.io

Not a portfolio page: an identity that *grows*. The page opens on a dark sky filled by the subject's name set in live variable type — move the pointer and the letterforms warp (Fraunces `SOFT`/`WONK` axes respond to your position), an oxide current passes through the composition, and the instrument readout in the corner reports the live axis values. A fixed rotor under the name cycles `BUILDER/Maker/Engineer/Maverick`. Then: **"drop the context"** — scroll or press the cue — and the sky recedes mechanically while every real fact lands on a lit paper table below.

## The two acts

1. **Sky (100svh, sticky)** — the art. Massive Fraunces nameplate, axis warp under the pointer, oxide halo bloom, live axis inspector (`soft`, `wonk`, `opsz`), the rotor line, an INDEX key.
2. **Table (paper surface)** — the content, printed on a bright sheet under a dark sky:

   - **I · Prelim** — the thesis in one sentence, plus an identity sheet (mail / GitHub / LinkedIn / site / resume.pdf).
   - **II · The Flagship — Lumis** — poster-type plate; a live "print" console types out problem → idea → system → status, and a ruled trace draws itself with an `ENTRY › INSIGHT` label. Live prototype and source links prominent. Honest stamp: *open prototype, not production*.
   - **III · Inventory** — standing post (Unlox Academy trainee, E-Cell Team Leader) as ledger records, plus the toolbox in four columns.
   - **IV · Field Log** — two hackathon entries (Hack2Skill Gen-AI APAC, AssemblyAI × LabLab) each with an outcome line.
   - **V · Connect** — "Let's build something", a big mail line, handles, colophon.

## Identity system

- **Ground**: near-black sky, bone type, oxide as the only saturated signal — used for the rotor, the current, the seam, the trace, the tooling caps, and in the console.
- **Type**: Fraunces variable (opsz/wght/SOFT/WONK) everywhere; IBM Plex Mono for instrument text and ledgers.
- **Figure-ground**: the page literally flips light/dark between acts — ink field above, lit specimen sheet below.

## Motion & resilience

One easing family, transform/opacity/variable-font only. GSAP drives the boot intro, the mechanical drop (scrubbed scale on the name as the sky leaves), plate reveals, the trace draw. Independent of GSAP: the axis warp, halo, rotor, typewriter, progress chip, and index wipe. If GSAP is missing, reduced motion is set, or the device is small/finger-only: everything still renders — the console prints instantly, the trace shows full, the page opens static and scrolls. No JS at all gets the same document linearized. `prefers-reduced-motion` disables all animation.

## Navigation as instruments

- **INDEX key** (top-right) — full-screen wipe to five numbered plates; keyboard-cue `Escape` closes it.
- **Drop cue** (bottom) — enter or scroll to descend from the sky.
- **Progress chip** (fixed, bottom-left) — a bone/ink chip with a hairline fill and the current plate code (`01·PRELIM … 05·CONNECT`).
- Native anchors, never hijacked.

## QA hooks

- `#prelim`, `#lumis`, `#inventory`, `#log`, `#connect` — jump to a plate
- `?motion=1` — force full motion even under `prefers-reduced-motion` (headless capture)

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000 — press the INDEX key, scroll past the sky, watch the console type.

## Deploy to GitHub Pages

The upstream remote must point to a repo named **exactly** `1RY-O.github.io`.

```bash
git remote add origin https://github.com/1RY-O/1RY-O.github.io.git
git branch -M main
git add .
git commit -m "feat: GENOME — living type installation"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Sky installation, index wipe, five table plates |
| `styles.css` | Sky/table system, variable type, ledgers, console, mechanics, fallbacks |
| `script.js` | Axis warp, halo, rotor, typewriter, trace, chip, index, fallback |
| `resume.pdf` | Downloadable resume |
| `reference.png` | Visual quality reference (not shipped as a site asset) |