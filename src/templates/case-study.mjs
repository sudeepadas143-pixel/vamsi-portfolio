import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { site, projects } from '../data/site.mjs';
import { caseMeta, caseOrder } from '../data/case-meta.mjs';
import { esc, inline, img, video, mediaInfo, normHref, letters } from './helpers.mjs';
import { page, subNav, footer } from './layout.mjs';
import { arrowUpRight } from './icons.mjs';

// Case-study bodies are row/column data measured from the original pages at 1440px
// (content column is 928px wide, starting at x=256). Columns are positioned in
// percentages of that column so the desktop composition scales fluidly; below the
// tablet breakpoint rows collapse into a single readable stack.
const W = 928;
const pct = (n) => `${+((n / W) * 100).toFixed(3)}%`;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Role of a text block, so the stylesheet controls the type scale.
function textRole(f) {
  if (f.s >= 30 && (f.w >= 700 || f.c === 'accent' || f.c === 'alert')) return f.c === 'alert' ? 'cs-h cs-h--alert' : 'cs-h';
  if (f.s >= 30) return 'cs-sub';
  if (f.f === 'bs') return 'cs-lede';
  if (f.c === 'fg-30') return 'cs-label';
  if (f.c === 'accent' || (f.s >= 20 && f.w >= 600)) return 'cs-h3';
  if (f.s >= 24) return 'cs-sub';
  return 'cs-p';
}
const alignOf = (f) => (f.align ? ` cs-align-${f.align}` : '');

function itemStyle(it, colW) {
  return `--imt:${it.mt || 0}px;--dx:${+(((it.dx || 0) / colW) * 100).toFixed(3)}%;--iw:${Math.min(100, +((it.w / colW) * 100).toFixed(3))}%`;
}

function zoomable(inner, label) {
  return `<button class="zoom" type="button" data-zoom aria-label="Enlarge: ${esc(label)}" data-cursor="ZOOM">${inner}</button>`;
}

// Text that was centred in its column (by position) becomes full-width centred text,
// so it stays centred when the type scale changes.
// Paragraphs whose box was centred keep left-aligned text (as in the original); only headings and
// short lines are centre-aligned.
function centred(it, colW) {
  if (it.kind !== 'text' || it.tag === 'ul') return false;
  const short = it.font.s >= 20 || it.text.replace(/[*_]/g, '').length <= 60;
  return short && it.w < colW - 8 && Math.abs((it.dx || 0) + it.w / 2 - colW / 2) < 12;
}

function item(it, colW, ctx) {
  if (centred(it, colW)) it = { ...it, dx: 0, w: colW, font: { ...it.font, align: 'center' } };
  const style = itemStyle(it, colW);
  const label = () => `${ctx.title}${ctx.section ? ` — ${ctx.section.toLowerCase()}` : ''}`;
  switch (it.kind) {
    case 'text': {
      const role = textRole(it.font);
      if (it.tag === 'ul') {
        return `<ul class="cs-item cs-text cs-list" style="${style}">${it.text.split('\n').map((l) => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`;
      }
      if (role.startsWith('cs-h ')|| role === 'cs-h') {
        const plain = it.text.replace(/[*_]/g, '');
        let id = slugify(plain);
        if (ctx.chapters.some((c) => c.id === id)) id += `-${ctx.chapters.length}`;
        ctx.chapters.push({ id, label: plain });
        ctx.section = plain;
        return `<h2 class="cs-item cs-text ${role}${alignOf(it.font)}" id="${id}" style="${style}" data-reveal>${inline(it.text)}</h2>`;
      }
      const tag = role === 'cs-h3' ? 'h3' : 'p';
      return `<${tag} class="cs-item cs-text ${role}${alignOf(it.font)}" style="${style}">${inline(it.text)}</${tag}>`;
    }
    case 'image': {
      const m = mediaInfo(it.media);
      const sizes = it.w > 600 ? '(max-width: 809px) 100vw, 928px' : '(max-width: 809px) 100vw, 464px';
      const inner = m.type === 'video' ? video(it.media, { cls: 'cs-fill', alt: label() }) : img(it.media, { cls: 'cs-fill', alt: label(), sizes });
      const r = it.radius && it.radius !== '0px' ? `;--r:${it.radius}` : '';
      if (it.href) {
        return `<figure class="cs-item cs-media cs-media--badge" style="${style};--ar:${it.w}/${it.h}${r}" data-reveal><a href="${esc(normHref(it.href))}" target="_blank" rel="noopener">${inner}</a></figure>`;
      }
      return `<figure class="cs-item cs-media" style="${style};--ar:${it.w}/${it.h}${r}" data-reveal>${zoomable(inner, label())}</figure>`;
    }
    case 'video': {
      const r = it.radius && it.radius !== '0px' ? `;--r:${it.radius}` : '';
      return `<figure class="cs-item cs-media" style="${style};--ar:${it.w}/${it.h}${r}" data-reveal>${zoomable(video(it.media, { cls: 'cs-fill', alt: label() }), label())}</figure>`;
    }
    case 'youtube':
      return `<figure class="cs-item cs-media cs-yt" style="${style};--ar:16/9" data-reveal>${youtube(it.id, `${ctx.title} walkthrough`)}</figure>`;
    case 'iframe':
      return `<figure class="cs-item cs-media cs-frame" style="${style};--ar:${it.w}/${it.h}" data-reveal><iframe src="${esc(it.src)}" title="${esc(ctx.title)} Blueprint graph" loading="lazy" allowfullscreen></iframe></figure>`;
    case 'slideshow':
      return slideshow(it, style, ctx);
    default:
      return '';
  }
}

function youtube(id, label) {
  return `<button class="yt" type="button" data-yt="${esc(id)}" aria-label="Play video: ${esc(label)}" data-cursor="PLAY">
    <img src="https://i.ytimg.com/vi_webp/${esc(id)}/sddefault.webp" alt="" loading="lazy" class="cs-fill">
    <span class="yt__play" aria-hidden="true"></span>
    <span class="yt__label" aria-hidden="true">${esc(label)}</span>
  </button>`;
}

function slideshow(it, style, ctx) {
  return `<div class="cs-item slideshow" style="${style};--ar:${it.w}/${it.h}" data-slideshow data-reveal role="region" aria-roledescription="carousel" aria-label="${esc(ctx.title)} slideshow">
  <div class="slideshow__track">${it.media.map((id, i) => `<div class="slideshow__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${it.media.length}">${zoomable(img(id, { cls: 'cs-fill', alt: `${ctx.title} slide ${i + 1}`, sizes: '(max-width: 809px) 100vw, 928px' }), `${ctx.title} slide ${i + 1}`)}</div>`).join('')}</div>
  <button class="slideshow__btn slideshow__btn--prev" type="button" aria-label="Previous slide"></button>
  <button class="slideshow__btn slideshow__btn--next" type="button" aria-label="Next slide"></button>
  <div class="slideshow__dots">${it.media.map((_, i) => `<button type="button" aria-label="Go to slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>
</div>`;
}

function row(b, ctx) {
  if (b.type === 'rule') return `<hr class="cs-rule" style="--rmt:${b.mt}px">`;
  // The original's empty "RELATED PROJECTS / VIEW ALL PROJECTS" row is replaced by the next-level footer.
  if (b.cols.some((c) => c.items.some((i) => /RELATED PROJECTS|VIEW ALL PROJECTS/.test(i.text || '')))) return '';
  // A lone text column centred on the page spans the full column instead.
  if (b.cols.length === 1 && b.cols[0].items.every((i) => i.kind === 'text') && Math.abs(b.cols[0].x + b.cols[0].w / 2 - W / 2) < 16) {
    const c = b.cols[0];
    b = { ...b, cols: [{ x: 0, w: W, items: c.items.map((i) => ({ ...i, dx: (i.dx || 0) + c.x })) }] };
  }
  let cursor = 0;
  const cols = b.cols.map((c) => {
    const ml = c.x - cursor;
    cursor = c.x + c.w;
    return `<div class="cs-col" style="--ml:${pct(ml)};--cw:${pct(c.w)}">${c.items.map((it) => item(it, c.w, ctx)).join('')}</div>`;
  });
  return `<div class="cs-row${b.cols.length > 1 ? ' cs-row--multi' : ''}" style="--rmt:${b.mt}px">${cols.join('')}</div>`;
}

// Captions/labels measured as their own row (e.g. "Before" / "After" under two images, or the
// three game-pillar names above their descriptions) are merged into the neighbouring row when the
// columns line up, so each column keeps its parts together when rows stack on small screens.
function mergeCaptionRows(blocks) {
  const out = [];
  const colsAlign = (a, b) => a.cols.length === b.cols.length && a.cols.length > 1 &&
    a.cols.every((c, i) => c.x < b.cols[i].x + b.cols[i].w && b.cols[i].x < c.x + c.w);
  const isShortText = (r) => r.h < 60 && r.cols.every((c) => c.items.every((i) => i.kind === 'text'));
  for (const b of blocks) {
    const a = out[out.length - 1];
    if (a && a.type === 'row' && b.type === 'row' && b.mt < 40 && colsAlign(a, b) && (isShortText(a) || isShortText(b))) {
      const cols = a.cols.map((ca, i) => {
        const cb = b.cols[i];
        const used = ca.items.reduce((y, it) => y + (it.mt || 0) + it.h, 0);
        const left = Math.min(ca.x, cb.x);
        const shift = (col) => col.items.map((it) => ({ ...it, dx: (it.dx || 0) + col.x - left }));
        const tail = shift(cb);
        tail[0] = { ...tail[0], mt: (tail[0].mt || 0) + b.mt + (a.h - used) };
        return { x: left, w: Math.max(ca.x + ca.w, cb.x + cb.w) - left, items: [...shift(ca), ...tail] };
      });
      out[out.length - 1] = { ...a, h: a.h + b.mt + b.h, cols };
    } else out.push(b);
  }
  return out;
}

export const caseStudies = caseOrder.map((slug) => ({ slug, ...caseMeta[slug] }));

export function loadCaseStudy(slug) {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../data/case-studies/${slug}.json`, import.meta.url)), 'utf8'));
}

function heroMedia(m) {
  if (m.hero.kind === 'video') {
    const v = mediaInfo(m.hero.media);
    return `<div class="cs-hero__media" data-reveal>
      <video class="cs-fill" muted loop playsinline preload="none" poster="${esc(v.poster)}" data-src="${esc(v.src)}" data-autoplay aria-label="${esc(m.title)} ${esc(m.hero.label.toLowerCase())}"></video>
      ${v.audio ? `<button class="sound" type="button" data-sound aria-pressed="false"><span class="sound__icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="sound__label">SOUND OFF</span></button>` : ''}
    </div>`;
  }
  if (m.hero.kind === 'youtube') return `<div class="cs-hero__media cs-yt" data-reveal>${youtube(m.hero.id, `${m.title} ${m.hero.label.toLowerCase()}`)}</div>`;
  return `<div class="cs-hero__media" data-reveal>${zoomable(img(m.hero.media, { cls: 'cs-fill', alt: `${m.title} — ${m.hero.label.toLowerCase()}`, sizes: '(max-width: 809px) 100vw, 1180px', loading: 'eager' }), m.hero.label)}</div>`;
}

function hero(m, n) {
  const logo = mediaInfo(m.logo);
  return `<header class="cs-hero">
  <p class="eyebrow cs-hero__eyebrow" data-reveal><span>LEVEL ${String(n + 1).padStart(2, '0')}<small> / ${String(caseOrder.length).padStart(2, '0')}</small></span><span>${esc(m.genre.toUpperCase())}</span></p>
  <h1 class="cs-hero__title">
    <img class="cs-hero__logo" src="${esc(logo.src)}" width="${logo.width}" height="${logo.height}" alt="${esc(m.title)}" fetchpriority="high">
    ${m.badge ? `<img class="cs-hero__badge" src="${esc(mediaInfo(m.badge).src)}" alt="Made with Unreal Engine" width="40" height="40">` : ''}
  </h1>
  ${m.award ? `<p class="cs-hero__award" data-reveal><span aria-hidden="true">🏆</span> ${esc(m.award)}</p>` : ''}
  ${m.lede ? `<p class="cs-hero__lede" data-reveal>${inline(m.lede)}</p>` : ''}
  <dl class="cs-facts" data-reveal>
    ${m.facts.map(([k, v]) => `<div class="cs-fact"><dt>${esc(k)}</dt><dd>${esc(v).replace(/\n/g, '<br>')}</dd></div>`).join('\n    ')}
  </dl>
  ${m.breakdown ? `<ul class="cs-breakdown" data-reveal>${m.breakdown.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  ${m.links || m.walkthrough ? `<p class="cs-hero__links" data-reveal>
    ${(m.links || []).map((l) => `<a class="btn btn--accent" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ${arrowUpRight()}</a>`).join('')}
    ${m.walkthrough ? `<a class="btn" href="https://www.youtube.com/watch?v=${esc(m.walkthrough)}" target="_blank" rel="noopener">Gameplay walkthrough ${arrowUpRight()}</a>` : ''}
  </p>` : ''}
  ${heroMedia(m)}
</header>`;
}

function nextLevel(n) {
  const k = (n + 1) % caseStudies.length;
  const next = caseStudies[k];
  const p = projects.find((x) => x.slug === next.slug);
  return `<nav class="next-level" aria-label="Next project">
  <a class="next-level__link" href="${esc(next.path)}" data-cursor="NEXT">
    <span class="next-level__media">${img(p.cover, { alt: '', cls: 'cs-fill', sizes: '100vw' })}</span>
    <span class="next-level__eyebrow">NEXT LEVEL · ${String(k + 1).padStart(2, '0')}</span>
    <span class="next-level__title" aria-hidden="true">${letters(next.title.toUpperCase(), 'xch')}</span>
    <span class="sr-only">Next project: ${esc(next.title)}</span>
    <span class="next-level__arrow" aria-hidden="true">→</span>
  </a>
  <a class="next-level__all u-link" href="/projects">All projects</a>
</nav>`;
}

export function caseStudyPage(cs) {
  const n = caseOrder.indexOf(cs.slug);
  const data = loadCaseStudy(cs.slug);
  const ctx = { title: cs.title, chapters: [], section: '' };
  const blocks = mergeCaptionRows(data.blocks.slice(cs.skip));
  if (blocks[0] && blocks[0].type === 'rule') blocks.shift();
  const body = blocks.map((b) => row(b, ctx)).join('\n');
  const toc = ctx.chapters.length > 2
    ? `<nav class="cs-toc" aria-label="Chapters"><p class="cs-toc__title">CHAPTERS</p><ol>${ctx.chapters.map((c) => `<li><a href="#${c.id}">${esc(c.label)}</a></li>`).join('')}</ol></nav>`
    : '';
  const p = projects.find((x) => x.slug === cs.slug);
  return page({
    title: `${cs.title} | ${site.name}`, path: cs.path, bodyClass: `page-case page-${cs.slug}`,
    description: p.summary, image: mediaInfo(p.cover).src,
    body: `<div class="progress" aria-hidden="true"><span></span></div>
${subNav()}
<main id="main" class="sub">
<article class="cs-page">
${hero(cs, n)}
<div class="cs-layout">
  ${toc}
  <div class="cs">
${body}
  </div>
</div>
</article>
${nextLevel(n)}
</main>
${footer()}
<dialog class="lightbox" aria-label="Enlarged media"><div class="lightbox__stage"></div><p class="lightbox__caption"></p><button class="lightbox__close" type="button" aria-label="Close"><i></i><i></i></button><button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image"></button><button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image"></button></dialog>`,
  });
}
