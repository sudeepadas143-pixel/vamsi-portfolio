# Vamsi Kasina — Level / Game Design Portfolio

A static rebuild of [the original Framer portfolio](https://voluntary-path-520226.framer.app/),
first recreated faithfully from measured browser behaviour (git tag `faithful-recreation`),
then upgraded. See [`docs/REVERSE-ENGINEERING.md`](docs/REVERSE-ENGINEERING.md) for the full
analysis, fidelity results and what changed.

## Commands

```bash
npm run build      # render dist/ (no dependencies needed)
npm run dev        # build + serve dist/ on http://localhost:4173
npm test           # build + static checks + Playwright browser tests
npm run media      # re-download original media and re-encode (needs ffmpeg + ImageMagick)
node scripts/springs.mjs   # regenerate the CSS linear() easings for the original's springs
```

Browser tests need Playwright with Chromium (`npm install && npx playwright install chromium`).

## Structure

```
src/data/site.mjs             site copy, nav, projects, tools, education
src/data/case-meta.mjs        structured case-study headers (facts, hero media, links)
src/data/case-studies/*.json  case-study bodies: rows/columns measured from the original pages
src/data/media.json           media manifest written by scripts/media.mjs
src/templates/                page templates (plain template literals)
src/styles/main.css           all styles
src/js/main.js                motion + interaction runtime (no dependencies)
public/                       fonts (OFL) and optimised media
scripts/                      build, dev server, media pipeline
tests/                        node:test suites (static + browser)
tools/reverse-engineering/    capture, motion-sampling (motion.cjs, trigger.cjs, jank.cjs) and comparison scripts
```

## Editing content

* Copy, projects and tools: `src/data/site.mjs`.
* A case study's header (facts, award, links, hero media): `src/data/case-meta.mjs`.
* A case study's body: `src/data/case-studies/<slug>.json`. Each row has columns positioned in px of
  the original 928px content column (`x`, `w`) and items with a top gap (`mt`), so the desktop
  composition matches the original; rows stack automatically on phones.
* New media: add the source URL to `src/data/media-sources.json` and run `npm run media`.

## Deploying

`dist/` is a plain static site with clean URLs (`/about/index.html`, …) and a `404.html`, so it
works on GitHub Pages, Netlify, Vercel or any static host. The original routes (including
`/work/darkfen---darkfen`) are preserved so existing links keep working.
