# Pilla Sri Sai Rahul — Personal Website

An art-directed **spatial digital experience** for https://1ry-o.github.io

Not a scrolling portfolio. Not a carousel. The site is conceived as a single **optical bench** — a room of plates positioned along a shared axis of depth. You move *through* the environment; the states physically occupy different depths and travel between them.

## Experience

1. **FRACTURE → REASSEMBLY → IDENTITY → EXPLORATION**
   An optical alignment emblem surfaces out of the dark, is cut into 11 hand-placed 3D shards, holds in a fractured field, then converges — the emblem's fragments reassembling into the typographic identity itself. No cut: the reassembled object becomes the first state of the deck.

2. **The Optical Bench** — eight states arranged in a spatial depth system:
   - `Identity` — the name as the strongest typographic moment
   - `Profile` — an editorial spread with an indexed fact register
   - `Lumis` — a miniature case study (problem → idea → system → prototype)
   - `Systems` — engineering documentation: signal-chain schematic + spec ledger
   - `Field Log` — hackathons as an event log
   - `Stations` — experience as two plaques on a spine (not a timeline)
   - `Toolbox` — a technical index (no skill bars, no badges)
   - `Contact` — a quiet closing plate

   ~5 states participate in the composition at any moment: the active plate is largest, sharpest, closest; neighbours recede with blur, opacity, rotation and offset. States physically travel through the slots as you navigate — nothing fades out and back in.

3. **Motion character** — one master curve for the whole scene: a gathering anticipation, acceleration, depth travel, weighted settling. The background grid and camera respond to the same progress. Long moments of stillness.

## Input

- Mouse wheel / trackpad (one gesture = one transition)
- Keyboard: arrows, PageUp/Down, Space, Home/End
- Touch swipe (vertical) — mobile keeps the spatial model
- Chapter rail (right) · prev/next arrows (bottom)

## Design System

- **Type**: Fraunces (display serif) · Instrument Sans (body) · IBM Plex Mono (metadata)
- **Palette**: ink `#0a0a0c` · bone `#e9e5dd` · oxide `#c8723f` · steel `#7d8794`
- **Motifs**: registration marks, ruler ticks, ghost chapter numerals, coordinate grid, mono spec registers — engineering precision as art direction, not decoration
- **Atmosphere**: faint optical-bench grid, ️subtle blooms, ~4 drifting specks, film grain. Aimed restraint.

## Accessibility

- `prefers-reduced-motion` — static exhibition, no prologue, no loops, content fully readable
- Keyboard navigation with visible focus states
- `inert` on non-active states; `aria-live` chapter announcer
- No-JS fallback — static scrollable document

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
git commit -m "feat: optical bench spatial redesign"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | The eight states, emblem prologue, HUD, atmosphere layers |
| `styles.css` | Visual system, plate chrome, state compositions, slot geometry, responsiveness |
| `script.js` | Prologue engine, spatial deck engine, input layer, parallax |
| `resume.pdf` | Downloadable resume |