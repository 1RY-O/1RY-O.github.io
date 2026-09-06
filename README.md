# Pilla Sri Sai Rahul — The Cabinet

A surreal cabinet of curiosities for https://1ry-o.github.io — built from a blank canvas around one belief: *he can make it happen.*

## The idea

The site is a moonlit room that holds the artifacts of an explorer. A glowing amber core hangs in an espresso-night sky; around it float four artifacts — the Lumis journal, an automaton relic, a telemetry node, an AI spark — each a portal to real work. The visitor's cursor is a lantern: light follows it, layers drift in parallax, artifacts lean. Then the room opens into daylight: the Lumis flagship presented inside its own warm world, shelves of honest drawers, a stamped field log, and a dawn-gradient transmission.

Warm wonder on the surface, a straight spine underneath — every fact reachable within two clicks, because the audience is internships and fellowships, not just fellow travelers.

## The rooms

1. **The Room** — night scene: stars, breathing amber core, 4 floating artifact-links (parallax by pointer depth), constellation name, dual CTA (scroll / terminal).
2. **The Flagship — Lumis** — cream gallery in Lumis's own visual world: poster title, its real words ("Think without the noise."), the two real screenshots as tilting plates, Enter-Lumis + source links, problem/idea/system/status, honest *open prototype* stamp.
3. **The Shelves** — four drawers (machines / telemetry / GenAI / experiments) with crafted SVG icons, real stacks, honest status stamps. No invented projects, no fake screenshots.
4. **Field Log** — stamped entries: two hackathons, two standing posts, plus the education line.
5. **Transmission** — dawn gradient, big email button, GitHub/LinkedIn/resume/site, colophon with the backtick hint.

## The hacker layer

- **Working terminal** (`` ` `` key, `>_` button, or the hero's *type help*): `help lumis shelves log contact open source github linkedin mail resume whoami sudo clear exit`, with history and `Esc`.
- **Index overlay**: five numbered rooms, keyboard friendly.
- **Devtools easter egg**: open the console.
- **`whoami`**: "fabled adventurer — personal space." (his real in-app Lumis profile)

## Craft notes

- Vanilla HTML/CSS/JS — zero runtime dependencies, no build step.
- Fraunces (display, same voice as Lumis) + IBM Plex Mono (the instrument).
- Pointer physics (lantern + parallax + plate tilt) run only on fine pointers without reduced-motion; everything else is calm CSS.
- Resilience: content is never hidden unless JS init fully succeeds (`js-armed` gate); no-JS gets a static nav and the full document linearized; `prefers-reduced-motion` stills the room.
- Fixed chrome: masthead, amber progress hairline, skip link, OG tags.

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000 — move the pointer, press `` ` ``, type `help`.

## Deploy to GitHub Pages

The upstream remote must point to a repo named **exactly** `1RY-O.github.io`.

```bash
git remote add origin https://github.com/1RY-O/1RY-O.github.io.git
git branch -M main
git add .
git commit -m "feat: THE CABINET — curiosity-room portfolio"
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Room, terminal, index, flagship, shelves, log, transmission |
| `styles.css` | Night/cream worlds, artifacts, overlays, fallbacks |
| `script.js` | Lantern+parallax engine, terminal, reveals, tilt, eggs |
| `assets/` | Lumis screenshots (copied from `Reference/`) |
| `resume.pdf` | Downloadable resume |
| `Reference/` | Source material: Lumis media (truth) + design refs (quality bar, never copied) |