# Pilla Sri Sai Rahul — Personal Website

An art-directed **spatial digital experience** for https://1ry-o.github.io

Not a scrolling portfolio. Not a carousel. The site is built as **ARC** — a camera travels a curved corridor in the dark. Eight objects stand along the arc at fixed depth slots; you move *between* them, never the other way. The room has a hand: the arc bends, so what lies ahead rises and drifts right, what falls behind drops and drifts left — no mirror symmetry.

## Experience

1. **FRACTURE → REASSEMBLY → IDENTITY → EXPLORATION**
   An aperture emblem surfaces out of the dark, is cut into 12 3D shards, holds as a fractured field, then converges — the fragments reassembling into the typographic identity itself. No hard cut and no loading screen: the reassembled object continues as chapter 01 of the deck.

2. **The Corridor** — eight chapter-objects standing in a depth system:
   - `Identity` — the name as the strongest typographic moment, behind an aperture mark
   - `Profile` — an editorial spread with an indexed fact register
   - `Lumis` — the flagship object: a miniature case study (problem → idea → system → prototype) beside a working device mock, honestly stamped "open prototype — not production"
   - `Systems` — engineering documentation: signal-chain schematic + spec ledger
   - `Field Log` — hackathons as a chronological log (Hack2Skill APAC Ideathon · AssemblyAI × LabLab)
   - `Stations` — current posts as two plaques on a spine (no timeline)
   - `Toolbox` — a technical index A–Z (no skill bars, no badges)
   - `Contact` — a quiet closing plate

   Each moment composes ~5 objects at different depths: the active plate is closest, sharpest, largest; neighbours recede with blur, opacity, rotation and offset. States physically travel through the slots — nothing fades out and back in.

3. **Motion character** — one master easing curve for the whole scene: a gathering anticipation (the camera leans in), depth travel, weighted settling. The grid recedes, the rail curls, content staggers in on arrival and holds still once assembled.

## Input

- Mouse wheel / trackpad — one gesture, one transition (horizontal swipes count too)
- Keyboard: arrows · PageUp/PageDown · Space · Home/End · digits 1–8
- Touch swipe (vertical) — mobile keeps the spatial model
- Chapter rail (right) · prev/next arrows (bottom) · magnetic links and entries

## Design System

- **Type**: Bodoni Moda (display serif, variable optical size) · Instrument Sans (body) · IBM Plex Mono (metadata)
- **Palette**: ink `#0a0a0c` · bone `#e9e5dd` · oxide `#c8723f` · steel `#7d8794`
- **Motifs**: aperture marks, ruler ticks, ghost chapter numerals, an engineering grid floor, mono spec registers — instrument precision as art direction
- **Atmosphere**: fog at the far side of the arc, a cursor lamp, vignette, film grain

## Accessibility

- `prefers-reduced-motion` — static exhibition, no prologue, no loops, content fully readable
- Keyboard navigation with visible focus states
- `aria-live` chapter indicator; labelled rail buttons
- No-JS fallback — static scrollable document

## QA hooks

- `?s=1..8` — jump straight to a chapter (also keeps the URL in sync as you navigate)
- `?motion=1` — force full motion even under `prefers-reduced-motion` (for headless captures)

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

The upstream remote must point to a repo named **exactly** `1RY-O.github.io`.

```bash
git remote add origin https://github.com/1RY-O/1RY-O.github.io.git
git branch -M main
git add .
git commit -m "feat: ARC spatial redesign"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | The eight chapter-objects, emblem prologue, HUD, atmosphere layers |
| `styles.css` | Visual system, board chrome, chapter compositions, slot geometry, responsiveness |
| `script.js` | Prologue shard engine, spatial deck engine, input layer, cursor light |
| `resume.pdf` | Downloadable resume |