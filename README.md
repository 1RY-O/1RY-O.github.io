# Pilla Sri Sai Rahul — Personal Website

**SPECIMEN** — a dark observatory for one builder's work, for https://1ry-o.github.io

The room stays near-black; each project sits under its own bright light — illuminated specimen panels (bone surfaces, ink text) with an oxide signal. Cinematic hierarchy, instrument-panel density, tactile controls. No neon, no glass, no blobs, no generic cards.

## Experience

Six specimens on one continuous page:

1. **Hero** — monumental name plus a bright "at a glance" readout rail (role, base, stack, now, status, links) and direct CTAs into Lumis and GitHub.
2. **Lumis (flagship launch)** — a custom three-movement presentation, the brightest surface on the page: teaser with the live site front and center; a pinned stage where the journal screen reveals through a clip and entry → insight plays progressively; parameter rows, spec strip, source link, honest prototype stamp. Click (or Enter on) the screen to replay the beam.
3. **Systems** — schematic stage plus bright spec table; hovering or focusing a node traces its chain (sense / compute / act / cloud) while siblings dim.
4. **Field Log** — two hackathon takes as a shot list with right-aligned outcome lines.
5. **Dossier** — stations plus technical index in one tabular spread.
6. **Contact** — "Let's build something", links, résumé, colophon.

## Identity system

- Ground: near-black room; bone specimen panels; oxide signal only.
- Type: **Fraunces** variable (display) · **IBM Plex Sans Condensed** (labels, body) · **IBM Plex Mono** (registers).
- Body copy on panels targets ~14:1 contrast; dark-ground secondary text ~7:1.

## Motion system

One easing family. GSAP + ScrollTrigger (CDN) drive pins, scrubs, masked reveals and the progress rule; a vanilla rAF layer handles cursor ring and magnetic elements. If the CDN is unreachable, an IntersectionObserver fallback reveals everything statically — the page is never blank. `prefers-reduced-motion` disables all of it; no-JS gets the same document linearized.

## Navigation

Fixed masthead (mark, live specimen indicator, résumé, Index toggle) plus a full-screen index overlay. Native anchor scrolling throughout — never hijacked.

## QA hooks

- `#hero`, `#lumis`, … — jump straight to a specimen
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
git commit -m "feat: SPECIMEN flagship rework"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Masthead, index, hero+rail, Lumis launch, systems, log, dossier, contact |
| `styles.css` | SPECIMEN dark-room/bright-panel system, responsive, fallbacks |
| `script.js` | Pins, beam replay, chain tracing, IO fallback, cursor/magnetic layer |
| `resume.pdf` | Downloadable resume |
| `reference.png` | Visual quality reference (not shipped as a site asset) |