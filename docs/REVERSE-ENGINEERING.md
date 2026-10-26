# Reverse-engineering & upgrade report

Reference: <https://voluntary-path-520226.framer.app/> (Framer, generator `Framer 8bbc62e`).
Everything below was measured in Chromium via Playwright; nothing was eyeballed.

## 1. How the site was inspected

| Pass | What it captured | Script (`tools/reverse-engineering/`) |
|---|---|---|
| Route discovery | in-page links + `/sitemap.xml` (13 URLs) | — |
| Page capture | 1440 / 810 / 390 screenshots (top + full), computed styles of every text/media/named element, post-JS DOM | `capture.cjs` |
| Motion (rAF) | `MutationObserver` on `style` during a slow scroll + mouse moves: recovers Framer Motion transforms that `getAnimations()` cannot see | `capture.cjs` |
| Motion (WAAPI) | `document.getAnimations()` keyframes/timing (the Ticker) | `probe-waapi.cjs` |
| Entrance timing | per-letter first/settled timestamps from navigation start | `probe-letters.cjs` |
| Hover | computed-style diff before/after `hover()` on every link + clip screenshots | `capture.cjs`, `probe-interactions.cjs` |
| Content | ordered atoms (full text with bold/italic/links, images, videos, iframes) with geometry | `content.cjs` |
| Panels & dividers | coloured boxes, borders, 1px rules, slideshow contents | `boxes.cjs`, `lines.cjs` |
| Layout data | atoms → rows/columns with measured gaps | `rows.py` |
| Verification | pixel diff (ImageMagick AE, 12% fuzz) + per-element vertical drift vs the reference | `compare.cjs`, `drift.cjs` |

Framer's own `<script type="framer/appear">` JSON was also read for exact entrance springs.

## 2. Site map

| Route | Content | Linked from |
|---|---|---|
| `/` | nav, hero (name + reel), Projects, Tools, About, Contact | — |
| `/projects` | white 180px title, 3 featured cards, separator, contact | nav |
| `/otherprojects` | title, Furscape + Castle Infiltration cards | nav, home separator |
| `/about` | title, about block with lead paragraph, contact | nav |
| `/projects/delumination`, `/work/darkfen---darkfen`, `/pier-extract`, `/furscape`, `/castle-infiltration` | case studies | cards |
| `/education` | two education entries + two opposing tool tickers | **nothing** (orphan) |
| `/contact` | title + contact lines | **nothing** (orphan) |
| `/projects-2` | unedited template page (placeholder "lucas@email.com", "San Francisco", FB/TW/INS) | nothing — **not rebuilt** |
| `/404` | 260px "404" + homepage link | — |

## 3. Design tokens (measured)

* Colours: background `#121212`, text `#F0F0F0` (50% / 30% / 10% variants), accent `rgb(224,241,31)` `#E0F11F`, alert `#FF2244`, card caption `#E6E6E6`.
* Layout: 928px content column centred (x=256 at 1440), 130px section rhythm, Framer breakpoints 1200 / 810.
* Type: **Big Shoulders** 900 (260px/1.1, −0.02em hero; 139px page titles; 180px Projects) and 700 (25px/35px nav, +1px tracking; 32px/1.4 section titles, +0.04em); **DM Sans** 18px/1.7 body, 22px/1.8 hero caption, 25px/1.1 +2px role/“SCROLL”; **Inter** 36px/1.2 bold case-study headings, 18px/1.2 case-study body; **Geist** 21px tool names. Big Shoulders is loaded as the exact static Google instances the original uses.

## 4. Motion & interaction inventory (measured)

| Effect | Measured behaviour |
|---|---|
| Hero name | per-letter rise from `translateY(50px)`, opacity 0→1, ~50–100ms stagger; KASINA fades as one word |
| Role line | per-word rise from 10px |
| Home nav | per-letter blur-in: `blur(10px)` + `translateY(10px)` → none, ~50ms stagger, links offset ~25–60ms |
| Reel | `scale(0.5)→1`, spring (bounce 0.2, duration 2, delay 0.4) |
| Scroll reveal | `opacity 0, perspective(1200px) translateY(40px)` → none on enter (sparkle, caption, cards, sections) |
| Scroll cue | 3×14px bar looping inside a 3×34px track |
| Mouse parallax | *Corrected in §10:* the original's parallax component (`(pointer − centre) × 0.05`) wraps an empty layer, so nothing visible moves |
| Scroll-linked | signature `translateX(−30px→0)` and yellow panel `(−20px→0)` across page scroll |
| Section separator hover | dark line −180px, middle line 40→100px and pulls back 40px, two 22px arms rotate 41° / −50° about their centres (offset −6px / +8px) into an arrowhead |
| Project card hover | image scales 300×200→327×220 (≈1.09), black 40% overlay fades in, light label pill (`padding 20px 32px`, top-right radius 8) slides in from −100px |
| LinkedIn icon hover | 32→40px |
| Nav link hover / tap | *Added in §10:* PROJECTS and OTHER PROJECTS scale 1.1 on hover, all scale 0.9 on tap |
| Tool card hover | *Added in §10:* white → `rgba(18,18,18,0.2)` (the light name becomes readable on hover) |
| Education ticker | WAAPI `translateX(0→±4860px)` over 162s = **30px/s**, rows in opposite directions, 16% edge fade mask |
| Pier Extract slideshow | 7 slides (cloned ×4 for looping), arrows + dots |
| Sub-page nav | sticky 90px bar with a “‹” built from two 26×2px bars rotated ±35° (links home) |

## 5. Reference repositories — capabilities, licences, use

| Repo | Licence | What it actually is | Used? |
|---|---|---|---|
| viniciuscffreitas/site-deep-clone | MIT | Node + Playwright extractor (computed styles, inline/adopted stylesheets, MutationObserver motion, hover diffs, multi-breakpoint shots, route crawl) | Its *approach* was followed. Running it directly was blocked by this environment's policy on executing downloaded code; its bootstrap would also `npm install` a second Playwright and download another browser. Equivalent focused scripts were written instead; no code copied. |
| sumanrox/mimic | MIT | Claude Code skill: feasibility → measure → baseline → TDD rebuild → pixel/metric verify; motion-sampling snippets | Methodology adopted (measure-first, baseline-driven verification, OBSERVED/APPROXIMATE labelling). Not installed. |
| voidmatcha/ui-clone-skills | Apache-2.0 | Python/Node "motion forensics" pipeline producing React/Tailwind with AE/SSIM gates | Ideas only (AE pixel gate, motion parameter recovery). Heavy toolchain not needed for a static target. |
| mikulgohil/Morph | MIT | Next.js/Tailwind cloning CLI + agent pipeline | Not used: would impose a Next.js scaffold on a small static site. |
| yakew7/DesignHub | MIT | Local-first brand/design toolkit app (palettes, type, mockups) | Not used: not a cloning or analysis tool. |

## 6. Faithful pass — results (`git checkout faithful-recreation`)

Full-page desktop (1440) comparison against the reference; diff = share of pixels differing by more than 12%.

| Page | Height Δ | Pixel diff | Main residual cause |
|---|---|---|---|
| `/` | −2px | 4.0% | video frame, sub-pixel AA |
| `/about` | 0 | 1.3% | — |
| `/contact` | 0 | 0.35% | — |
| `/projects` | 0 | 2.4% | — |
| `/otherprojects` | 0 | 1.2% | — |
| `/education` | 0 | 7.6% | ticker phase at capture time |
| `/projects/delumination` | +1px | 6.9% | autoplaying videos at different frames |
| `/furscape` | +1px | 4.0% | 〃 |
| `/castle-infiltration` | +1px | 4.3% | GIF frames |
| `/pier-extract` | −2px | 8.8% | 5 autoplaying videos + slideshow position |
| `/work/darkfen---darkfen` | +6px | 6.3% | GIF frames |

Hover states (card, separator) and an entrance frame were compared visually against reference captures
and match. Even the original's quirks were reproduced in this pass (overlapping meta text on
Darkfen/Castle, clipped "Ongoing Project" lines kept as invisible spacers, missing back control on
Education). Template placeholders (`mailto:lucas@yourwebsite.com`, `cocobasic.com`, every card linking to
Delumination) were *not* reproduced.

## 7. Bugs found in the original

1. Phone (390px) and tablet (810px) layouts are broken: nav overflows off-screen, name clipped, card titles break mid-word ("DARKF/EN"), About text overlaps the photo, tool cards overflow; the page is 693px wide at 390.
2. Tool names are `#F0F0F0` on white cards: effectively invisible.
3. Furscape's intro paragraph is `#121212` on `#121212`: invisible.
4. Darkfen and Castle Infiltration header labels overlap ("Personal Project" over "Inspiration").
5. Email links to `mailto:lucas@yourwebsite.com`; phone links to `https://cocobasic.com`.
6. All three home/projects cards link to `/projects/delumination`; Furscape's card does too.
7. The "CONTACT" section title links to the résumé PDF.
8. `/education` and `/contact` are unreachable; `/projects-2` is an unedited template page.
9. Case-study "Project Breakdown" lines are clipped; "RELATED PROJECTS" is always empty.
10. Hero video has `autoplay` + sound + native controls: blocked by browsers, so it shows a static frame with a cramped control bar.
11. Copy typos left untouched for the owner to review: "an Dark Souls", "-one", "for the asto explore", "alot", "Unitedworld", "Assassins Creed 3".

## 8. Upgrade — what changed

**Kept (identity):** #121212 + acid yellow, oversized Big Shoulders, the reel card overlapping the name,
per-letter appear, sparkle motif, line→arrow separators, the sliding label on card hover, signature +
yellow panel with scroll parallax, mouse parallax, opposing tool tickers, original URLs.

**Hierarchy & storytelling**
* Case studies get a structured header: "LEVEL 01 / 05" eyebrow + genre, logo, award pill, lede,
  a facts grid (type, role, timeline, software, inspiration), breakdown list, CTAs (itch.io, walkthrough)
  and a full-width hero (trailer with a sound toggle, YouTube facade, or key art).
* Section headings become Big Shoulders 900 uppercase; body text moves to DM Sans 16.5/1.65 (was Inter 18/1.2).
* Chapter navigation with scroll-spy beside long case studies (≥1360px), a yellow reading-progress bar,
  and a "NEXT LEVEL" footer in place of the empty "Related projects".
* Home: numbered project cards (01/03) with genre, team/timeline and award; Other Projects surfaced on
  home; legible tool cards; résumé/education CTAs; a real footer.

**Interactions & transitions**
* Reel card: play badge, muted hover preview, opens a modal player with sound.
* Project cards: short silent preview clips (130–350KB, cut from the trailers) play on hover.
* Lightbox for every case-study image/clip (keyboard arrows, captions from the section heading).
* Nav letters roll into yellow copies on hover; footer "LET'S TALK" letters wave; signature draws itself.
* Sub-nav hides on scroll down, returns on scroll up; full-screen oversized menu on tablet/phone.
* Cursor label (VIEW / PLAY / ZOOM / NEXT) on fine pointers; cross-page View Transitions.

**Responsive**: designed 390 / 810 / 1440 layouts; the hero scales from one variable using the original's
measured proportions; case-study rows stack with captions kept beside their media. No horizontal overflow
at any tested width (enforced by tests).

**Performance & accessibility**: media 375MB → 65MB (H.264, GIF→looping MP4, WebP + 720w `srcset`), lazy
video loading, YouTube loaded only on click, self-hosted fonts with preload; semantic headings (one `h1`),
labelled controls, skip link, focus styles, `prefers-reduced-motion` honoured, OG/meta/JSON-LD/sitemap.

**Fixed**: all bugs in §7 except the copy typos (left for the owner) and `/projects-2` (not rebuilt).

## 9. Not reproduced exactly / incomplete

* Spring physics, parallax and scroll-linked offsets: superseded by §10 (now reproduced from the original bundles).
* **Tablet/phone of the original** were not reproduced because they are broken; the faithful pass is desktop-exact only.
* **Hidden Framer components** (an empty "SLIDESHOW 2.0" on Darkfen, the invisible sub-page menu, empty contact form) were left out.
* **Video timing**: autoplay clips can't be frame-matched, which accounts for most residual pixel diff.
* **Hosting / domain**: the canonical/OG URLs assume `https://vamsi-kasina.com` (from the original sitemap); deployment is not set up.
* Copy written for the upgrade: "LET'S TALK", "FEATURED LEVELS", "YOU FELL OUT OF THE MAP" (404), eyebrow labels "Solo project" / "Stealth mission" (derived from the project descriptions). Review before publishing.
* Assets were reused from the owner's own Framer project on the assumption the repository owner is the portfolio owner.

## 10. Animation fidelity pass

### Method
1. **Bundle reading (read-only, never executed).** The original's page and component chunks were
   downloaded as text and searched for Framer motion configs (`__framer__enter/exit/animate`,
   `effect` text animations, `whileHover/whileTap`, `transformTargets`, loop, Slideshow and Ticker
   props), per the ui-clone-skills *js-animation-extraction* guidance.
2. **Runtime sampling.** `tools/reverse-engineering/motion.cjs` samples opacity / translate / scale /
   blur / box position every animation frame on both sites for the same scenario (load, scroll
   reveal, hover in/out, loop) and reports start, t50, settle (98%) and overshoot.
   `trigger.cjs` finds the scroll position where a reveal fires and whether it replays;
   `jank.cjs` measures frame intervals while wheel-scrolling down and up with CPU throttling.
3. **Exact springs.** `scripts/springs.mjs` re-implements Motion's duration/bounce spring solver
   (damping ratio = 1 − bounce, envelope 0.001 at `duration`) and emits CSS `linear()` easings
   (cubic-bézier fallbacks for browsers without `linear()`). The model predicted the measured
   overshoots exactly (2.8% name, 1.5% reel and separator).

### Reference parameters (from the bundles) and measured match

| Motion | Original config | Reference measured | Rebuild measured |
|---|---|---|---|
| Hero name letters | per char, y 50, spring bounce .25 / .45s, stagger .1s | start R+231ms, t50 +42, overshoot 2.8%, 94ms/char | start R+200ms, overshoot 2.8%, 100ms/char |
| KASINA | block appear: opacity 0, y 40, tween 1s `[.4,0,0,1]` | R+297ms, t50 +227, settle +728 | R+317ms, t50 +216, settle +717 |
| Reel | scale .5→1, spring bounce .2 / 2s, delay .4 | t50 +311, settle +802, overshoot 1.5% | t50 +300, settle +801, overshoot 1.5% |
| Nav letters | per char, blur 10px + y 10, spring bounce 0 / .4s, stagger .05 | R+262ms, settle ≈+250 | R+233ms, settle ≈+250 |
| Role words | per word, y 10, start .3s, stagger .075 | R+510 / R+719 (word 4) | R+467 / R+701 |
| Scroll appear | opacity 0, y 40, perspective 1200, tween 1s `[.4,0,0,1]`, threshold 0, once | t50 +200, settle +699; fires at the viewport edge; no replay | t50 +217, settle +717; fires at the edge; no replay |
| Project card hover | stiffness 500 / damping 60; image 300→327, label −100px→0 | t50 +91, settle +408, no overshoot | t50 +83, settle +417, no overshoot |
| Separator hover | spring bounce .2 / .4s | in: t50 +56, settle +157, 1.5%; out: no overshoot, ~550ms | in: t50 +65, settle +164, 1.5%; out: overdamped, no overshoot |
| Nav hover / tap | scale 1.1 / 0.9, spring bounce .2 / .4s | — | scale 1.1 verified |
| Scroll cue | y 0→20, linear 1s, mirror loop | half-period 1017ms | 1000ms |
| Signature / panel | x −30→0 / −20→0 linear over page scroll | linear in samples | identical mapping |
| Slideshow | spring stiffness 200 / damping 40, autoplay 1s, gap 10, 10px dots | ~1 slide/s | same spring, 2s period (see below) |
| Ticker | 30px/s, gap 22, fade, no hover slow-down | 30px/s | 30px/s, hover pause removed |

R = reel start (the original waits ~380ms for hydration; the rebuild starts at 120ms).

### Enhanced (deliberate deviations)
* **Reel parallax** — the original's component never moved anything visible; the rebuild applies its own formula (×0.05) to the reel with light smoothing. Fine pointers only, off in lite mode.
* **Nav hover** — the original scales only two of four links; all four now scale 1.1 and also roll their letters into yellow copies.
* **Slideshow** — same spring, but 2s per slide instead of ~1s so level shots are readable; pauses on hover/focus and off-screen (the original also pauses off-screen).
* **Card label, preview video, lightbox, dialogs and menu** have entrance *and* exit transitions on the measured springs; lightbox media cross-fade on prev/next.
* **Page transitions** (View Transitions, absent in the original) and the signature draw-on.
* **Touch**: hover rules only apply under `(hover: hover)` (no sticky states); the card crossing mid-screen plays its preview; separators morph into their arrow mid-screen; press feedback on cards, tools and buttons; taps navigate directly.
* **Lite mode** (≤2 cores, ≤2GB RAM or Save-Data): no preview videos, blur filters, backdrop blur, parallax or cursor label. Phones also drop the sticky nav's backdrop blur.
* **Performance**: scroll handler reads no layout per frame (cached metrics + ResizeObserver); the cursor loop idles when settled. Wheel-scrolling Darkfen down and up with 4× CPU throttling: rebuild p95 33ms / p99 50ms / 1–3 long tasks vs the original's p95 50ms / p99 133–183ms / 6–7 long tasks. Home at 1×: locked 60fps on both.
* **Reduced motion**: content and hero are visible immediately, loops stop, transitions are instant, View Transitions are disabled.

### Layout fixes in this pass
* Tablet portrait (601–809px) keeps two-column project grids and case-study rows (it collapsed to one 728px-wide column).
* Long centred paragraphs keep left-aligned text inside a centred box (as the original); only headings/short lines are centre-aligned.
* Small yellow sub-headings no longer wrap mid-phrase; sub-page title rise is the original 50px (32px on phones); hero caption wraps without an orphan.

### Still not exact
* **Absolute timing** — the rebuild starts ~260ms earlier than the original (which waits for React hydration); relative order and spacing are reproduced.
* **Separator hover-out** — the original's return (~550ms, layout animation) is approximated with the overdamped card spring (~160ms to 98%, no overshoot).
* **Framer layout animations** (the card image grows its layout box 300→327) are reproduced as a clipped `scale(1.09)`; the visible result is the same.
* **Blueprint embeds** (blueprintUE iframes) are third-party and were not reachable from the test environment.
