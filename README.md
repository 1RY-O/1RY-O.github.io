# Pilla Sri Sai Rahul — Personal Website

A scroll-driven **editorial instrument** for https://1ry-o.github.io

Not a scrolling portfolio in the template sense. The site is set like precision printed matter — monumental masked typography, hairline rules, mono marginalia — and choreographed on scroll: pinned passages, layered parallax, clip reveals, a schematic that draws itself. Stillness is a feature; motion arrives in passages.

## Experience

**TOLERANCE** — seven passages on one continuous page:

1. **Hero** — the name at monumental scale with masked line reveals, a self-drawing aperture mark, pointer parallax, and a scroll-linked exit that pulls the composition apart gently.
2. **Manifesto** — "Hardware gives software a body", plus a condensed fact register.
3. **Lumis (flagship)** — the only full-bleed spread. A pinned sequence: stanzas arrive one by one while the device mock reveals through a clip, the entry→insight beam draws with scroll, and the device tilts with scroll velocity. Honestly stamped "open prototype — not production".
4. **Systems** — a pinned drawing: the ESP32 signal-chain schematic draws itself on scroll beside a spec ledger.
5. **Field Log** — two hackathon entries as large editorial rows with hover displacement.
6. **Index** — Stations and Toolbox merged into one tabular spread.
7. **Contact** — a quiet close: name, links, résumé, colophon.

## Motion system

One easing family across the whole page. GSAP + ScrollTrigger (CDN) drive pins, scrubs, masked reveals and the progress rule; a vanilla rAF layer handles the cursor ring and magnetic elements. If the CDN is unreachable, an IntersectionObserver fallback reveals everything statically — the page is never blank. `prefers-reduced-motion` disables all of it; no-JS gets the same document linearized.

## Navigation

A fixed masthead (mark, live passage indicator, résumé, Index toggle) plus a full-screen index overlay. Native anchor scrolling throughout — never hijacked.

## QA hooks

- `#lumis`, `#systems`, … — jump straight to a passage
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
git commit -m "feat: TOLERANCE scroll-editorial rework"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Masthead, index overlay, seven passages, footer, CDN scripts |
| `styles.css` | TOLERANCE visual system, compositions, overlay, responsive, fallbacks |
| `script.js` | GSAP scenes, IO fallback, cursor/magnetic layer, index overlay, passage indicator |
| `resume.pdf` | Downloadable resume |