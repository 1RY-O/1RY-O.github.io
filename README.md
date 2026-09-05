# Pilla Sri Sai Rahul — Personal Website

Art-directed digital experience for https://1ry-o.github.io

A cinematic, editorial portfolio built around a **broken-mirror opening sequence** and a **staircase depth deck** — five panels visible in spatial depth at any moment, with the active panel dominant and surrounding panels receding.

## Design System

- **Type**: Fraunces (display serif) · Inter (UI) · IBM Plex Mono (metadata)
- **Palette**: Warm charcoal · restrained brass · bone
- **Motion**: GPU-friendly transforms/opacity/filter only · rAF lerp · controlled inertia
- **Atmosphere**: Subtle light blooms + translucent bubbles, subordinate to composition

## Experience

1. **Broken Mirror** — the screen opens as a fractured mirror. Twelve shards hold partial glimpses of the identity. The shards scatter with depth, hold, then reassemble into the full name reveal.
2. **Staircase Deck** — eight chapters arranged in a spatial depth system. Panels physically convey through positions as you navigate. The active panel is largest, sharpest, closest; neighbors recede with scale, blur, and opacity.
3. **Chapters** — Identity · About · Lumis · Robotics/IoT · Hackathons · Experience · Skills · Contact

## Input

- Mouse wheel / trackpad
- Keyboard arrows, PageUp/Down, Home/End, Space
- Touch swipe (vertical)
- Chapter rail (right side)
- Prev/next arrows (bottom center)

## Accessibility

- `prefers-reduced-motion` — mirror skipped, deck static, no loops
- Keyboard navigation with visible focus states
- Semantic structure (`main`, `section`, `nav`, `dl`, `ol`)
- No-JS fallback — static scrollable page

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
git commit -m "feat: art-directed redesign"
git push -u origin main
```

Then the site is live at `https://1ry-o.github.io/`.

## Files

| File | Purpose |
|---|---|
| `index.html` | All 8 chapters, mirror, atmosphere, navigation |
| `styles.css` | Editorial depth system, mirror, deck, responsive, reduced-motion |
| `script.js` | Mirror shatter/reassembly, deck physics, input handling, parallax |
| `resume.pdf` | Downloadable resume (linked from masthead) |