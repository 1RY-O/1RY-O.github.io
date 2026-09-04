# Pilla Sri Sai Rahul — Personal Website

Dark developer-themed portfolio for https://1ry-o.github.io

Built with plain HTML/CSS/JS — no frameworks, no build tools, no dependencies.

## Sections

About · Education · Projects (Lumis) · Experience · Skills · Certifications · Hackathons & Community · Contact

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
git commit -m "feat: launch personal site"
git push -u origin main
```

Then the site is live at `https://1ry-o.github.io/` (no Settings needed for
a `<username>.github.io` repo).

## Files

| File | Purpose |
|---|---|
| `index.html` | All page sections |
| `styles.css` | Dark theme, terminal hero, responsive layout |
| `script.js` | Typing effect, nav toggle, scroll reveal, active nav state |
| `resume.pdf` | Downloadable resume (the button links here) |