# vendor/ — third-party code, pinned

The site's CSP is `script-src 'self'`, so **nothing may load from a CDN**.
Every library below is a local file, referenced with an `integrity` hash in
`index.html` and cached immutably by the `/vendor/*` rule in `_headers`
(the names are versioned on purpose — renaming one of these files requires
updating its SRI hash in the same commit).

Recomputed on 28 Sep 2026 with
`openssl dgst -sha384 -binary <file> | openssl base64 -A`:

| File | Raw | Gzipped | sha384 |
|---|---:|---:|---|
| `gsap-3.12.5.min.js` | 72,214 B | 28,073 B | `g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt` |
| `ScrollTrigger-3.12.5.min.js` | 43,380 B | 17,642 B | `Z3REaz79l2IaAZqJsSABtTbhjgOUYyV3p90XNnAPCSHg3EMTz1fouunq9WZRtj3d` |
| `lenis-1.3.26.min.js` | 18,722 B | 5,418 B | `jqpi9VmOdhyLoLURgjCn7EpnG9BbnHW57ibIZoeaIU+erWDH3k8fQQg0xH2ySjnw` |

Motion stack total: **51 KB gzipped**.

## Provenance and licences

* **GSAP 3.12.5 + ScrollTrigger 3.12.5** — GreenSock, fetched from
  `https://unpkg.com/gsap@3.12.5/dist/`. Licence: *Standard "no charge"
  licence*, <https://gsap.com/standard-license> (no charge for this use;
  the npm package ships no licence file, hence this note in its place).
* **Lenis 1.3.26** — darkroom.engineering, fetched from
  `https://unpkg.com/lenis@1.3.26/dist/`. Licence: **MIT**, full text in
  `lenis-1.3.26.LICENSE`.
* **Three.js — deliberately absent.** Measured 28 Sep 2026:
  `three.module.min.js` 338,908 B / 78,794 B gz **plus**
  `three.core.min.js` 381,124 B / 100,467 B gz (the module re-exports from
  core, so a bare `import 'three'` ships both) ≈ **179 KB gzipped** to draw
  one fullscreen quad — and it is ESM-only, which would reorder the whole
  script plan. The Signal's renderer is a hand-written single-pass WebGL
  module in `js/quasar.js` instead. Bring Three in only when the design
  needs meshes, loaders or post-processing.

## Before you edit a vendor file

1. Replace the file, recompute its sha384, update the `integrity` attribute
   in `index.html` **and** the table above in the same change.
2. Never add a vendor file without its licence.
