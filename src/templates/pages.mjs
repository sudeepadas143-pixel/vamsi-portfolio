import { site, projects, tools, about, education, tickerWords } from '../data/site.mjs';
import { esc, img, video, letters, words, link } from './helpers.mjs';
import { page, homeNav, subNav, separator, contactLines, pageTitle, projectCard } from './layout.mjs';
import { sparkle, linkedin, signature } from './icons.mjs';

const featured = projects.filter((p) => p.featured);
const others = projects.filter((p) => !p.featured);

function aboutBlock({ lead = false } = {}) {
  return `<div class="about" data-reveal>
  <div class="about__left">
    <div class="about__photo" data-scroll-shift>
      <div class="about__panel" data-shift="-20">
        <a class="about__social" href="${esc(site.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${linkedin()}</a>
      </div>
      ${img(site.portrait, { alt: 'Portrait of Vamsi Kasina', cls: 'about__img' })}
      <div class="about__signature" data-shift="-30">${signature()}</div>
    </div>
  </div>
  <div class="about__right">
    ${about.map((t, i) => `<p class="${i === 0 && lead ? 'about__lead' : ''}">${esc(t)}</p>`).join('\n    ')}
  </div>
</div>`;
}

function toolsBlock() {
  return `<section class="tools" aria-labelledby="tools-title" data-reveal>
  <div class="tools__pill"><h2 id="tools-title" class="tools__title">TOOLS</h2></div>
  <ul class="tools__grid">
    ${tools.map((t) => `<li class="tool">${img(t.icon, { alt: '', cls: 'tool__icon' })}<span class="tool__name">${esc(t.name)}</span></li>`).join('\n    ')}
  </ul>
</section>`;
}

export function home() {
  const body = `${homeNav()}
<main id="main" class="home">
  <section class="hero" aria-label="Intro">
    <p class="hero__role" data-split-words><span class="sr-only">${esc(site.role)}</span>${words(site.role)}</p>
    <div class="hero__name">
      <h1 class="hero__title"><span class="sr-only">${esc(site.name)}</span><span class="hero__line hero__line--1" data-split aria-hidden="true">${letters(site.firstName)}</span><span class="hero__line hero__line--2" data-appear-fade aria-hidden="true">${esc(site.lastName)}</span></h1>
      <div class="hero__reel" data-appear-scale>
        <div class="hero__parallax" data-mouse-parallax>
          ${video(site.heroVideo, { cls: 'hero__video', controls: true, alt: '60 second portfolio summary' })}
        </div>
      </div>
    </div>
    <div class="hero__star" data-reveal>${sparkle()}</div>
    <p class="hero__caption" data-reveal>${esc(site.heroCaption)}</p>
    <div class="scroll-cue" data-reveal aria-hidden="true">
      <span class="scroll-cue__track"><span class="scroll-cue__bar"></span></span>
      <span class="scroll-cue__label">SCROLL</span>
    </div>
  </section>

  <section class="section projects-section" aria-labelledby="projects-title">
    ${separator('PROJECTS', '/otherprojects')}
    <div class="projects-row">
      ${featured.map((p) => projectCard(p)).join('\n      ')}
    </div>
  </section>

  ${toolsBlock()}

  <section class="section about-section" aria-labelledby="about-title">
    <h2 id="about-title" class="page-title page-title--l page-title--accent about-section__title" data-split><span class="sr-only">ABOUT</span>${letters('ABOUT')}</h2>
    ${aboutBlock()}
  </section>

  <section class="section contact-section" aria-labelledby="contact-title">
    ${separator('CONTACT', site.resume)}
    <div class="contact-section__content" data-reveal>${contactLines()}</div>
  </section>
</main>`;
  return page({ path: '/', body, bodyClass: 'page-home', image: '/media/8NDoYYbqyMg6ztDoOZDRI1NQ.webp' });
}

function subPage({ title, path, main, bodyClass = '', description, back = true }) {
  return page({ title: `${title} | ${site.name}`, path, description, bodyClass, body: `${subNav({ back })}\n<main id="main" class="sub ${bodyClass}">\n${main}\n</main>` });
}

export function aboutPage() {
  return subPage({
    title: 'About', path: '/about', bodyClass: 'page-about',
    main: `${pageTitle('ABOUT')}
<section class="section-flush">${aboutBlock({ lead: true })}</section>
<div class="sub-contact" data-reveal>${contactLines()}</div>`,
  });
}

export function contactPage() {
  return subPage({
    title: 'Contact', path: '/contact', bodyClass: 'page-contact',
    main: `${pageTitle('CONTACT')}
<div class="contact-page" data-reveal>${contactLines()}</div>`,
  });
}

export function educationPage() {
  const row = (dir) => `<div class="ticker ticker--${dir}" aria-hidden="true"><ul class="ticker__track">${[0, 1, 2, 3, 4, 5]
    .flatMap(() => tickerWords)
    .map((w) => `<li>${esc(w)}</li><li class="ticker__star">${sparkle()}</li>`)
    .join('')}</ul></div>`;
  return subPage({
    title: 'Education', path: '/education', bodyClass: 'page-education', back: false,
    main: `${pageTitle('EDUCATION')}
<section class="education" data-reveal>
  ${education.map((e) => `<article class="edu">
    <h3 class="edu__title">${esc(e.title)}</h3>
    <p class="edu__meta">${esc(e.school)}</p>
    <p class="edu__meta">${esc(e.years)}</p>
    <p class="edu__text">${esc(e.text)}</p>
  </article>`).join('\n  ')}
</section>
<section class="tickers" aria-label="Software: ${tickerWords.join(', ')}">${row('left')}${row('right')}</section>
<div class="sub-contact" data-reveal>${contactLines()}</div>`,
  });
}

export function projectsPage() {
  return subPage({
    title: 'Projects', path: '/projects', bodyClass: 'page-projects',
    main: `${pageTitle('PROJECTS', { size: 'xl', color: 'fg', star: false })}
<div class="projects-row projects-row--page">${featured.map((p) => projectCard(p)).join('\n')}</div>
<section class="section-sep">${separator('PROJECTS', '/otherprojects')}</section>
<div class="sub-contact sub-contact--tight" data-reveal>${contactLines()}</div>`,
  });
}

export function otherProjectsPage() {
  const sizes = [[444, 320], [429, 313]];
  return subPage({
    title: 'Other Projects', path: '/otherprojects', bodyClass: 'page-otherprojects',
    main: `${pageTitle('OTHER PROJECTS')}
<section class="section other-projects">
  ${separator('PROJECTS', '/projects')}
  <div class="projects-row projects-row--two">${others.map((p, i) => projectCard(p, { caption: false, w: sizes[i][0], h: sizes[i][1] })).join('\n')}</div>
</section>
<div class="sub-contact" data-reveal>${contactLines()}</div>`,
  });
}

export function notFoundPage() {
  return subPage({
    title: 'Page not found', path: '/404', bodyClass: 'page-404',
    main: `${pageTitle('404', { size: 'xxl' })}
<p class="not-found" data-reveal>Ooops! Something went wrong. Please go back to ${link('/', 'homepage')}.</p>`,
  });
}
