# Pilla Sri Sai Rahul — Personal Website

**ASSEMBLY** — a portfolio in assembly, for https://1ry-o.github.io

You assemble hardware. You built on AssemblyAI. A portfolio is a cut that is never finished. So the site is built as black-box cinema: a cold open, a title card, scenes joined by hard cuts and an iris, and end credits. Cinema's grammar, original identity.

## Experience

Seven scenes on one continuous page:

1. **Cold Open** — black frame, letterbox bars, a timecode flicker that settles, then the name as a title card with a slow push-in. Scroll holds the title, then an iris cut ends the card.
2. **Scene 01 — Identity** — title-sequence typography plus a condensed fact register.
3. **Scene 02 — Lumis (feature presentation)** — the only scene with its own world. A pinned sequence: takes arrive one by one while the journal screen reveals through a clip, the entry→insight beam draws with scroll, and the screen tilts with scroll velocity. Honestly stamped "open prototype — not production".
4. **Scene 03 — Systems** — blueprint overlay: the ESP32 signal-chain schematic draws itself beside a spec ledger.
5. **Scene 04 — Field Log** — two hackathon takes as a shot list with hover displacement.
6. **Scene 05 — Index** — cast & crew (stations) plus props (technical index) in one tabular spread.
7. **Scene 06 — Credits** — staggered rising credits: name, links, résumé, end of reel.

## Identity system

- Ground: near-black black-box, pure-black letterbox, bone type; oxide rationed to slugs, take numbers and the Lumis signal.
- Type: **Fraunces** variable (display, SOFT/WONK axes) · **IBM Plex Sans Condensed** (slugs, labels) · **IBM Plex Mono** (timecode, registers).

## Motion system

One easing family. GSAP + ScrollTrigger (CDN) drive the letterbox, the iris cut, pins, scrubs, masked reveals and the runtime rule; a live timecode follows reel progress and a vanilla rAF layer handles the cursor ring and magnetic elements. If the CDN is unreachable, an IntersectionObserver fallback reveals everything statically — the page is never blank. `prefers-reduced-motion` disables all of it; no-JS gets the same document linearized.

## Navigation

A fixed masthead (mark, live scene indicator, running timecode, résumé, Slate toggle) plus a full-screen slate overlay. Native anchor scrolling throughout — never hijacked.

## QA hooks

- `#coldopen`, `#act1` … `#credits` — jump straight to a scene
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
git commit -m "feat: ASSEMBLY cinematic rework"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Masthead, slate, cold open, five acts, credits, CDN scripts |
| `styles.css` | ASSEMBLY black-box system, compositions, slate, responsive, fallbacks |
| `script.js` | Iris cut, GSAP scenes, timecode, IO fallback, cursor/magnetic layer |
| `resume.pdf` | Downloadable resume |