import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { site } from '../data/site.mjs';
import { esc, inline, img, video, mediaInfo, normHref } from './helpers.mjs';
import { page, subNav } from './layout.mjs';

// Case-study bodies are row/column data measured from the original pages at 1440px
// (content column is 928px wide, starting at x=256). Columns are positioned in
// percentages of that column so the desktop layout scales fluidly; below the tablet
// breakpoint rows collapse into a single stack.
const W = 928;
const pct = (n) => `${+((n / W) * 100).toFixed(3)}%`;

const FONT_VARS = { inter: 'var(--f-inter)', dm: 'var(--f-dm)', bs: 'var(--f-display)', geist: 'var(--f-geist)', unbounded: 'var(--f-dm)' };

function textStyle(f) {
  const css = [`font-family:${FONT_VARS[f.f] || 'inherit'}`, `font-size:${f.s}px`, `font-weight:${f.w}`];
  css.push(f.c.startsWith('rgb') ? `color:${f.c}` : `color:var(--c-${f.c})`);
  if (f.lh) css.push(`line-height:${f.lh}`);
  if (f.ls) css.push(`letter-spacing:${f.ls}`);
  if (f.align) css.push(`text-align:${f.align}`);
  return css.join(';');
}

// Role of a text block, so the stylesheet can retune it per breakpoint.
function textRole(f) {
  if (f.s >= 30) return 'cs-h';
  if (f.f === 'bs') return 'cs-lede';
  if (f.c === 'fg-30') return 'cs-label';
  if (f.s >= 20 && f.c === 'accent') return 'cs-h3';
  return 'cs-p';
}

function item(it, colW) {
  const box = [];
  box.push(`--imt:${it.mt || 0}px`);
  box.push(`--dx:${+(((it.dx || 0) / colW) * 100).toFixed(3)}%`);
  const wpct = Math.min(100, +((it.w / colW) * 100).toFixed(3));
  box.push(`--iw:${wpct}%`);
  const style = box.join(';');
  switch (it.kind) {
    case 'text': {
      const tag = it.tag === 'ul' ? 'div' : /^h\d$/.test(it.tag) ? it.tag : 'p';
      const html = it.tag === 'ul'
        ? `<ul>${it.text.split('\n').map((l) => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`
        : inline(it.text);
      return `<${tag} class="cs-item cs-text ${textRole(it.font)}${it.hidden ? ' cs-clipped' : ''}" style="${style};${textStyle(it.font)}">${html}</${tag}>`;
    }
    case 'image': {
      const m = mediaInfo(it.media);
      const r = it.radius && it.radius !== '0px' ? `;--r:${it.radius}` : '';
      const fit = it.fit === 'contain' ? ' cs-media--contain' : '';
      const inner = m.type === 'video' ? video(it.media, { cls: 'cs-fill' }) : img(it.media, { cls: 'cs-fill' });
      const fig = `<figure class="cs-item cs-media${fit}" style="${style};--ar:${it.w}/${it.h}${r}" data-reveal>${inner}</figure>`;
      return it.href ? `<a class="cs-link" href="${esc(normHref(it.href))}" target="_blank" rel="noopener">${fig}</a>` : fig;
    }
    case 'video': {
      const r = it.radius && it.radius !== '0px' ? `;--r:${it.radius}` : '';
      return `<figure class="cs-item cs-media" style="${style};--ar:${it.w}/${it.h}${r}" data-reveal>${video(it.media, { cls: 'cs-fill' })}</figure>`;
    }
    case 'youtube':
      return `<figure class="cs-item cs-media cs-yt" style="${style};--ar:${it.w}/${it.h}" data-reveal>
        <button class="yt" type="button" data-yt="${esc(it.id)}" aria-label="Play gameplay walkthrough video">
          <img src="https://i.ytimg.com/vi_webp/${esc(it.id)}/sddefault.webp" alt="" loading="lazy" class="cs-fill">
          <span class="yt__play" aria-hidden="true"></span>
        </button>
      </figure>`;
    case 'iframe':
      return `<figure class="cs-item cs-media cs-frame" style="${style};--ar:${it.w}/${it.h}" data-reveal><iframe src="${esc(it.src)}" title="Blueprint graph" loading="lazy" allowfullscreen></iframe></figure>`;
    case 'slideshow':
      return slideshow(it, style);
    default:
      return '';
  }
}

function slideshow(it, style) {
  return `<div class="cs-item slideshow" style="${style};--ar:${it.w}/${it.h}" data-slideshow data-reveal>
  <div class="slideshow__track">${it.media.map((id, i) => `<div class="slideshow__slide" aria-roledescription="slide" aria-label="${i + 1} of ${it.media.length}">${img(id, { cls: 'cs-fill', alt: '' })}</div>`).join('')}</div>
  <button class="slideshow__btn slideshow__btn--prev" type="button" aria-label="Previous slide"></button>
  <button class="slideshow__btn slideshow__btn--next" type="button" aria-label="Next slide"></button>
  <div class="slideshow__dots" role="tablist">${it.media.map((_, i) => `<button type="button" role="tab" aria-label="Slide ${i + 1}"${i === 0 ? ' aria-selected="true"' : ''}></button>`).join('')}</div>
</div>`;
}

function row(b) {
  if (b.type === 'rule') return `<hr class="cs-rule" style="--rmt:${b.mt}px">`;
  let cursor = 0;
  const cols = b.cols.map((c) => {
    const ml = c.x - cursor;
    cursor = c.x + c.w;
    return `<div class="cs-col" style="--ml:${pct(ml)};--cw:${pct(c.w)}">${c.items.map((it) => item(it, c.w)).join('')}</div>`;
  });
  return `<div class="cs-row${b.cols.length > 1 ? ' cs-row--multi' : ''}" style="--rmt:${b.mt}px">${cols.join('')}</div>`;
}

export const caseStudies = [
  { slug: 'darkfen', title: 'Darkfen', path: '/work/darkfen---darkfen' },
  { slug: 'delumination', title: 'Delumination', path: '/projects/delumination' },
  { slug: 'pier-extract', title: 'Pier Extract', path: '/pier-extract' },
  { slug: 'furscape', title: 'Furscape', path: '/furscape' },
  { slug: 'castle-infiltration', title: 'Castle Infiltration', path: '/castle-infiltration' },
];

export function loadCaseStudy(slug) {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../data/case-studies/${slug}.json`, import.meta.url)), 'utf8'));
}

export function caseStudyPage(cs) {
  const data = loadCaseStudy(cs.slug);
  const main = `<article class="cs" style="--pb:${data.pb}px">
${data.blocks.map(row).join('\n')}
</article>`;
  return page({
    title: `${cs.title} | ${site.name}`, path: cs.path, bodyClass: `page-case page-${cs.slug}`,
    body: `${subNav()}\n<main id="main" class="sub">\n${main}\n</main>`,
  });
}
