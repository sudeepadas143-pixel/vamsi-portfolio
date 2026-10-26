import { site, nav, projects } from '../data/site.mjs';
import { esc, letters, link, img, mediaInfo } from './helpers.mjs';
import { back, sparkle, linkedin, arrowUpRight, signature } from './icons.mjs';

const ORIGIN = 'https://vamsi-kasina.com';

export function page({ title = site.title, description = site.description, path = '/', body, bodyClass = '', image = '/media/8NDoYYbqyMg6ztDoOZDRI1NQ.webp' }) {
  const url = `${ORIGIN}${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#121212">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/big-shoulders-900.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/big-shoulders-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles/main.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/js/main.js" defer></script>
${path === '/' ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: site.name, jobTitle: 'Level / Game Designer', address: { '@type': 'PostalAddress', addressLocality: 'Stockholm', addressCountry: 'SE' }, email: `mailto:${site.email}`, sameAs: [site.linkedin], url: ORIGIN })}</script>` : ''}
</head>
<body class="${esc(bodyClass)}">
<a class="skip-link" href="#main">Skip to content</a>
${body}
${menu()}
<div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>
</body>
</html>
`;
}

const navLink = (n, cls) => link(n.href, `<span class="sr-only">${esc(n.label)}${n.external ? ' (opens in a new tab)' : ''}</span><span class="roll" aria-hidden="true">${letters(n.label, 'nch')}</span>`, { class: cls });

const menuButton = () =>
  `<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-menu"><span class="menu-btn__label">MENU</span><span class="menu-btn__icon" aria-hidden="true"><i></i><i></i></span></button>`;

export function homeNav() {
  return `<header class="home-nav">
  <nav class="home-nav__links" aria-label="Primary">
    ${nav.map((n) => navLink(n, 'home-nav__link')).join('\n    ')}
  </nav>
  <a class="home-nav__mark" href="/" aria-label="${esc(site.name)}, home">${signature('home-nav__sig')}</a>
  ${menuButton()}
</header>`;
}

export function subNav({ back: showBack = true } = {}) {
  return `<header class="sub-nav" data-hide-on-scroll>
  <div class="sub-nav__inner">
    ${showBack ? `<a class="sub-nav__back" href="/" aria-label="Back to home">${back()}</a>` : '<span></span>'}
    <a class="sub-nav__name" href="/">${esc(site.name.toUpperCase())}</a>
    <nav class="sub-nav__links" aria-label="Primary">
      ${nav.map((n) => navLink(n, 'sub-nav__link')).join('\n      ')}
    </nav>
    ${menuButton()}
  </div>
</header>`;
}

// Full-screen menu (phones/tablets): oversized links, the site's typographic signature.
function menu() {
  const items = [{ label: 'HOME', href: '/' }, ...nav, { label: 'EDUCATION', href: '/education' }, { label: 'CONTACT', href: '/contact' }];
  return `<div class="menu" id="site-menu" hidden>
  <nav aria-label="Menu">
    <ol class="menu__list">
      ${items.map((n, i) => `<li style="--i:${i}">${link(n.href, `<span class="menu__num">0${i + 1}</span><span class="menu__label">${esc(n.label)}</span>`, { class: 'menu__link' })}</li>`).join('\n      ')}
    </ol>
  </nav>
  <div class="menu__foot">
    <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
    <a href="${esc(site.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
  </div>
</div>`;
}

// Section title with the animated line that morphs into an arrow on hover.
export function separator(title, href, { tag = 'h2', cls = '', id } = {}) {
  const inner = `<${tag} class="sep__title"${id ? ` id="${id}"` : ''}>${esc(title)}</${tag}><span class="sep__lines" aria-hidden="true"><i class="sep__dark"></i><i class="sep__mid"></i><i class="sep__top"></i><i class="sep__bot"></i></span>`;
  return href ? link(href, inner, { class: `sep ${cls}`.trim() }) : `<div class="sep sep--static ${cls}">${inner}</div>`;
}

export function contactLines({ cls = '' } = {}) {
  return `<address class="contact-lines ${cls}">
  <p>${esc(site.location)}</p>
  <p><a class="u-link" href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
  <p><a class="u-link" href="${esc(site.phoneHref)}">${esc(site.phone)}</a></p>
</address>`;
}

export function footer() {
  return `<footer class="footer" data-reveal>
  ${separator('CONTACT', `mailto:${site.email}`, { id: 'contact-title' })}
  <div class="footer__grid">
    ${contactLines()}
    <ul class="footer__links">
      <li>${link(site.resume, `Resume ${arrowUpRight()}`, { class: 'footer__link' })}</li>
      <li>${link(site.linkedin, `LinkedIn ${arrowUpRight()}`, { class: 'footer__link' })}</li>
      <li>${link('/education', 'Education', { class: 'footer__link' })}</li>
      <li>${link('/about', 'About', { class: 'footer__link' })}</li>
    </ul>
  </div>
  <a class="footer__mail" href="mailto:${esc(site.email)}" aria-label="Email ${esc(site.email)}"><span aria-hidden="true">${letters("LET'S TALK", 'fch')}</span>${sparkle('footer__spark')}</a>
  <div class="footer__base">
    <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
    <span>${esc(site.role)}</span>
    <a class="footer__top" href="#main">Back to top ↑</a>
  </div>
</footer>`;
}

export function pageTitle(text, { size = 'l', color = 'accent', star = true, eyebrow } = {}) {
  return `<div class="page-intro">
  ${eyebrow ? `<p class="eyebrow" data-reveal>${esc(eyebrow)}</p>` : ''}
  <h1 class="page-title page-title--${size} page-title--${color}" data-split><span class="sr-only">${esc(text)}</span><span aria-hidden="true">${letters(text)}</span></h1>
  ${star ? `<div class="page-intro__star" data-reveal>${sparkle()}</div>` : ''}
</div>`;
}

export function projectCard(p, { index, total, size = 'm', cls = '', headingTag = 'h3' } = {}) {
  const num = index != null ? String(index + 1).padStart(2, '0') : null;
  return `<article class="project project--${size} ${cls}" data-reveal>
  <a class="project__card" href="${esc(p.href)}" data-cursor="VIEW">
    <span class="project__media">
      ${img(p.cover, { alt: '', cls: 'project__img', sizes: size === 'l' ? '(max-width: 809px) 100vw, 50vw' : '(max-width: 809px) 100vw, 33vw' })}
      ${p.preview ? `<video class="project__preview" muted loop playsinline preload="none" data-preview="${esc(mediaInfo(p.preview).src)}" aria-hidden="true"></video>` : ''}
      <span class="project__shade"></span>
    </span>
    ${num ? `<span class="project__num" aria-hidden="true">${num}${total ? `<small>/${String(total).padStart(2, '0')}</small>` : ''}</span>` : ''}
    <span class="project__label" aria-hidden="true"><span class="project__label-text">${esc(p.title)}</span><span class="project__label-arrow">→</span></span>
    <span class="sr-only">${esc(p.title)}${p.genre ? `, ${esc(p.genre.toLowerCase())}` : ''}</span>
  </a>
  <div class="project__caption">
    <${headingTag} class="project__title"><a href="${esc(p.href)}" tabindex="-1">${esc(p.title.toUpperCase())}</a></${headingTag}>
    ${p.genre ? `<p class="project__genre">${esc(p.genre)}</p>` : ''}
    ${p.meta ? `<p class="project__meta">${p.meta.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''}
    ${p.award ? `<p class="project__award">${sparkle('project__award-icon')}<span>${esc(p.award)}</span></p>` : ''}
  </div>
</article>`;
}

export const featured = projects.filter((p) => p.featured);
export const others = projects.filter((p) => !p.featured);
