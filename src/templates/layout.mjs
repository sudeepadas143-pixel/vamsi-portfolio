import { site, nav } from '../data/site.mjs';
import { esc, attrs, letters, link, img } from './helpers.mjs';
import { back, sparkle } from './icons.mjs';

export function page({ title = site.title, description = site.description, path = '/', body, bodyClass = '', image }) {
  const url = `https://vamsi-kasina.com${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="https://vamsi-kasina.com${image}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#121212">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/big-shoulders-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/big-shoulders-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles/main.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/js/main.js" defer></script>
</head>
<body class="${esc(bodyClass)}">
<a class="skip-link" href="#main">Skip to content</a>
${body}
</body>
</html>
`;
}

export function homeNav() {
  return `<header class="home-nav" data-appear>
  <nav aria-label="Primary">
    ${nav.map((n, i) => link(n.href, `<span class="sr-only">${esc(n.label)}</span>${letters(n.label, 'nch')}`, { class: `home-nav__link home-nav__link--${i}` })).join('\n    ')}
  </nav>
</header>`;
}

export function subNav({ back: showBack = true } = {}) {
  return `<header class="sub-nav">
  <div class="sub-nav__inner">
    ${showBack ? `<a class="sub-nav__back" href="/" aria-label="Back to home">${back()}</a>` : ''}
  </div>
</header>`;
}

// Section title with the animated line that morphs into an arrow on hover.
export function separator(title, href, { tag = 'h2', cls = '' } = {}) {
  const inner = `<${tag} class="sep__title">${esc(title)}</${tag}><span class="sep__lines" aria-hidden="true"><i class="sep__dark"></i><i class="sep__mid"></i><i class="sep__top"></i><i class="sep__bot"></i></span>`;
  return href ? link(href, inner, { class: `sep ${cls}`.trim() }) : `<div class="sep ${cls}">${inner}</div>`;
}

export function contactLines({ cls = '' } = {}) {
  return `<address class="contact-lines ${cls}">
  <p>${esc(site.location)}</p>
  <p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
  <p><a href="${esc(site.phoneHref)}">${esc(site.phone)}</a></p>
</address>`;
}

export function pageTitle(text, { size = 'l', color = 'accent', star = true } = {}) {
  return `<div class="page-intro">
  <h1 class="page-title page-title--${size} page-title--${color}" data-split><span class="sr-only">${esc(text)}</span>${letters(text)}</h1>
  ${star ? `<div class="page-intro__star" data-reveal>${sparkle()}</div>` : ''}
</div>`;
}

export function projectCard(p, { caption = true, w, h, cls = '' } = {}) {
  const style = w ? `--w:${w}px;--h:${h}px` : undefined;
  return `<div ${attrs({ class: `project ${cls}`.trim(), style, 'data-reveal': true })}>
  <a class="project__card" href="${esc(p.href)}" aria-label="${esc(p.title)}">
    <span class="project__media">${img(p.cover, { alt: `${p.title} key art`, cls: 'project__img' })}<span class="project__shade"></span></span>
    <span class="project__label"><span class="project__label-text">${esc(p.title)}</span></span>
  </a>
  ${caption ? `<div class="project__caption">
    <p class="project__title">${esc(p.title.toUpperCase())}</p>
    ${p.genre ? `<p class="project__genre">${esc(p.genre)}</p>` : ''}
    ${p.award ? `<p class="project__award">${esc(p.award)}</p>` : ''}
  </div>` : ''}
</div>`;
}
