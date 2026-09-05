# Pilla Sri Sai Rahul — Personal Website

Editorial "paper-and-ink" portfolio for https://1ry-o.github.io

Warm ivory paper, near-black ink, one vermilion accent. Set in Fraunces
(display serif) and IBM Plex Mono. Lumis is presented as a full-bleed dark
"plate" with a hand-crafted product mock. Built with plain HTML/CSS/JS —
no frameworks, no build tools, no dependencies.

## Sections

Hero (cover) · 01 Selected work (Lumis flagship + bench) · 02 Profile · 03 Toolbox · 04 Record · 05 Contact

## Run locally

Open `index.html` directly in a browser, or serve it:

```bash
# Python
python -m http.server 8000
# then open http://localhost:8000
```

Or use VS Code "Live Server".

## Deploy to GitHub Pages

The upstream remote must point to a repo named **exactly** `1RY-O.github.io`
so GitHub auto-publishes the site.

```bash
git remote add origin https://github.com/1RY-O/1RY-O.github.io.git
git branch -M main
git add .
git commit -m "feat: editorial redesign"
git push -u origin main
```

Then the site is live at `https://1ry-o.github.io/`.

## Files

| File | Purpose |
|---|---|
| `index.html` | All page sections (semantic, numbered-monograph structure) |
| `styles.css` | Paper/ink editorial system, Lumis plate, motion, responsive layout |
| `script.js` | Index overlay, scroll reveals, active nav state, footer year |
| `resume.pdf` | Downloadable resume (linked from masthead, hero, contact) |