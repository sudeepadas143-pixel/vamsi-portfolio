import { site, tools, about, education, tickerWords } from '../data/site.mjs';
import { esc, img, mediaInfo, letters, words, link } from './helpers.mjs';
import { page, homeNav, subNav, separator, contactLines, pageTitle, projectCard, footer, featured, others } from './layout.mjs';
import { sparkle, linkedin, signature, arrowUpRight } from './icons.mjs';

function aboutBlock({ lead = false } = {}) {
  return `<div class="about" data-reveal>
  <div class="about__left">
    <div class="about__photo">
      <div class="about__panel" data-shift="-20">
        <a class="about__social" href="${esc(site.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn profile (opens in a new tab)">${linkedin()}</a>
      </div>
      ${img(site.portrait, { alt: 'Portrait of Vamsi Kasina', cls: 'about__img', sizes: '(max-width: 809px) 80vw, 336px' })}
      <div class="about__signature" data-shift="-30" data-draw>${signature()}</div>
    </div>
  </div>
  <div class="about__right">
    ${about.map((t, i) => `<p class="${i === 0 && lead ? 'about__lead' : ''}">${esc(t)}</p>`).join('\n    ')}
    <p class="about__ctas">
      ${link(site.resume, `Resume ${arrowUpRight()}`, { class: 'btn btn--accent' })}
      ${link('/education', 'Education', { class: 'btn' })}
    </p>
  </div>
</div>`;
}

function toolsBlock() {
  return `<section class="section tools" aria-labelledby="tools-title">
  ${separator('TOOLS', null, { id: 'tools-title' })}
  <ul class="tools__grid">
    ${tools.map((t, i) => `<li class="tool" style="--i:${i}" data-reveal>${img(t.icon, { alt: '', cls: 'tool__icon', sizes: '60px' })}<span class="tool__name">${esc(t.name)}</span></li>`).join('\n    ')}
  </ul>
</section>`;
}

function reelDialog() {
  const m = mediaInfo(site.heroVideo);
  return `<dialog class="reel" aria-label="60 second portfolio summary">
  <div class="reel__frame">
    <video class="reel__video" controls playsinline preload="none" poster="${esc(m.poster)}" data-src="${esc(m.src)}" width="${m.width}" height="${m.height}"></video>
  </div>
  <button class="reel__close" type="button" data-reel-close aria-label="Close video"><i></i><i></i></button>
</dialog>`;
}

export function home() {
  const reel = mediaInfo(site.heroVideo);
  const body = `${homeNav()}
<main id="main" class="home">
  <section class="hero" aria-label="Intro">
    <p class="hero__role" data-split-words><span class="sr-only">${esc(site.role)}</span><span aria-hidden="true">${words(site.role)}</span></p>
    <div class="hero__name">
      <h1 class="hero__title"><span class="sr-only">${esc(site.name)}, level and game designer</span><span class="hero__line hero__line--1" data-split aria-hidden="true">${letters(site.firstName)}</span><span class="hero__line hero__line--2" data-split aria-hidden="true">${letters(site.lastName)}</span></h1>
      <div class="hero__reel" data-appear-scale>
        <div class="hero__parallax" data-mouse-parallax>
          <button class="reel-card" type="button" data-reel data-cursor="PLAY" aria-haspopup="dialog">
            <img class="reel-card__poster" src="${esc(reel.poster)}" alt="" width="${reel.width}" height="${reel.height}" fetchpriority="high">
            <video class="reel-card__preview" muted loop playsinline preload="none" data-preview="${esc(reel.src)}" aria-hidden="true"></video>
            <span class="reel-card__play" aria-hidden="true"><span class="reel-card__tri"></span></span>
            <span class="reel-card__tag" aria-hidden="true">PLAY REEL · 0:60</span>
            <span class="sr-only">Play the 60 second portfolio summary video</span>
          </button>
        </div>
      </div>
    </div>
    <div class="hero__star" data-reveal>${sparkle()}</div>
    <p class="hero__caption" data-reveal><button type="button" class="hero__caption-btn" data-reel aria-haspopup="dialog">${esc(site.heroCaption)}</button></p>
    <a class="scroll-cue" href="#work" data-reveal>
      <span class="scroll-cue__track" aria-hidden="true"><span class="scroll-cue__bar"></span></span>
      <span class="scroll-cue__label">SCROLL</span>
    </a>
  </section>

  <section class="section section--wide projects-section" id="work" aria-labelledby="projects-title">
    ${separator('PROJECTS', '/projects', { id: 'projects-title' })}
    <div class="projects-grid">
      ${featured.map((p, i) => projectCard(p, { index: i, total: featured.length })).join('\n      ')}
    </div>
  </section>

  <section class="section section--wide others-section" aria-labelledby="others-title">
    ${separator('OTHER PROJECTS', '/otherprojects', { id: 'others-title' })}
    <div class="projects-grid projects-grid--two">
      ${others.map((p) => projectCard(p, { size: 'l' })).join('\n      ')}
    </div>
  </section>

  ${toolsBlock()}

  <section class="section about-section" aria-labelledby="about-title">
    <h2 id="about-title" class="page-title page-title--l page-title--accent about-section__title" data-split><span class="sr-only">ABOUT</span><span aria-hidden="true">${letters('ABOUT')}</span></h2>
    ${aboutBlock()}
  </section>
</main>
${footer()}
${reelDialog()}`;
  return page({ path: '/', body, bodyClass: 'page-home' });
}

function subPage({ title, path, main, bodyClass = '', description, back = true, withFooter = true }) {
  return page({
    title: `${title} | ${site.name}`, path, description, bodyClass,
    body: `${subNav({ back })}\n<main id="main" class="sub ${bodyClass}">\n${main}\n</main>\n${withFooter ? footer() : ''}`,
  });
}

export function aboutPage() {
  return subPage({
    title: 'About', path: '/about', bodyClass: 'page-about',
    description: 'About Vamsi Kasina: a level and game designer in Stockholm with a background in animation and motion graphics.',
    main: `${pageTitle('ABOUT')}
<section class="section-flush">${aboutBlock({ lead: true })}</section>
<section class="section edu-teaser" aria-labelledby="edu-title">
  ${separator('EDUCATION', '/education', { id: 'edu-title' })}
  <div class="education education--compact">${education.map(eduItem).join('')}</div>
</section>`,
  });
}

export function contactPage() {
  return subPage({
    title: 'Contact', path: '/contact', bodyClass: 'page-contact', withFooter: false,
    description: 'Contact Vamsi Kasina, level and game designer based in Stockholm, Sweden.',
    main: `${pageTitle('CONTACT')}
<section class="contact-page" data-reveal>
  <a class="contact-page__mail" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
  <div class="contact-page__grid">
    ${contactLines()}
    <p class="about__ctas">
      ${link(site.resume, `Resume ${arrowUpRight()}`, { class: 'btn btn--accent' })}
      ${link(site.linkedin, `LinkedIn ${arrowUpRight()}`, { class: 'btn' })}
    </p>
  </div>
</section>`,
  });
}

function eduItem(e) {
  return `<article class="edu">
    <h3 class="edu__title">${esc(e.title)}</h3>
    <p class="edu__meta">${esc(e.school)}</p>
    <p class="edu__meta">${esc(e.years)}</p>
    <p class="edu__text">${esc(e.text)}</p>
  </article>`;
}

export function educationPage() {
  const row = (dir) => `<div class="ticker ticker--${dir}" aria-hidden="true"><ul class="ticker__track">${[0, 1, 2, 3, 4, 5]
    .flatMap(() => tickerWords)
    .map((w) => `<li>${esc(w)}</li><li class="ticker__star">${sparkle()}</li>`)
    .join('')}</ul></div>`;
  return subPage({
    title: 'Education', path: '/education', bodyClass: 'page-education',
    description: 'Education of Vamsi Kasina: Game Design at Futuregames Stockholm and a Bachelor of Design in Animation and Motion Graphics.',
    main: `${pageTitle('EDUCATION')}
<section class="education" data-reveal>${education.map(eduItem).join('\n')}</section>
<section class="tickers" aria-label="Software: ${tickerWords.join(', ')}">${row('left')}${row('right')}</section>`,
  });
}

export function projectsPage() {
  return subPage({
    title: 'Projects', path: '/projects', bodyClass: 'page-projects',
    description: 'Level and game design projects by Vamsi Kasina: Darkfen, Delumination and Pier Extract.',
    main: `${pageTitle('PROJECTS', { size: 'xl', color: 'fg', star: false, eyebrow: `${featured.length} FEATURED LEVELS` })}
<section class="section section--wide section--tight" aria-label="Featured projects">
  <div class="projects-grid">${featured.map((p, i) => projectCard(p, { index: i, total: featured.length, headingTag: 'h2' })).join('\n')}</div>
</section>
<section class="section section--wide others-section" aria-labelledby="others-title">
  ${separator('OTHER PROJECTS', '/otherprojects', { id: 'others-title' })}
  <div class="projects-grid projects-grid--two">${others.map((p) => projectCard(p, { size: 'l' })).join('\n')}</div>
</section>`,
  });
}

export function otherProjectsPage() {
  return subPage({
    title: 'Other Projects', path: '/otherprojects', bodyClass: 'page-otherprojects',
    description: 'More projects by Vamsi Kasina: Furscape and Castle Infiltration.',
    main: `${pageTitle('OTHER PROJECTS')}
<section class="section section--wide" aria-labelledby="others-title">
  ${separator('PROJECTS', '/projects', { id: 'others-title' })}
  <div class="projects-grid projects-grid--two">${others.map((p) => projectCard(p, { size: 'l', headingTag: 'h2' })).join('\n')}</div>
</section>`,
  });
}

export function notFoundPage() {
  return subPage({
    title: 'Page not found', path: '/404', bodyClass: 'page-404', withFooter: false,
    main: `${pageTitle('404', { size: 'xxl', eyebrow: 'YOU FELL OUT OF THE MAP' })}
<p class="not-found" data-reveal>Ooops! Something went wrong. Please go back to ${link('/', 'homepage')}.</p>`,
  });
}
