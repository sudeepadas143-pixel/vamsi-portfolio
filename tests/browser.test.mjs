// Browser tests against the built site, using Playwright's Chromium.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { serve } from '../scripts/serve.mjs';
import { ROUTES } from './routes.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const VIEWPORTS = { phone: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, laptop: { width: 1024, height: 768 }, desktop: { width: 1440, height: 900 } };
let server, browser;

before(async () => { server = await serve(PORT); browser = await chromium.launch(); });
after(async () => { await browser?.close(); server?.close(); });

async function open(path, viewport = VIEWPORTS.desktop, opts = {}) {
  const { init, ...ctxOpts } = opts;
  const ctx = await browser.newContext({ viewport, ...ctxOpts });
  const page = await ctx.newPage();
  // Programmatic scrolls in tests must be instant (the site uses smooth scrolling for anchors).
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = 'html{scroll-behavior:auto!important}'; document.head.append(st); }));
  if (init) await page.addInitScript(init);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/i\.ytimg\.com|ERR_NAME_NOT_RESOLVED|ERR_TUNNEL/.test(m.text() + (m.location()?.url || ''))) errors.push(m.text()); });
  const res = await page.goto(BASE + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, res, errors };
}

test('every route loads without errors and without horizontal overflow at 375, 768, 1024 and 1440px', async () => {
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    for (const route of ROUTES) {
      const { ctx, page, res, errors } = await open(route, vp);
      assert.equal(res.status(), 200, `${route} status`);
      await page.waitForTimeout(300);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      assert.ok(sw <= cw, `${route} @${name}: horizontal overflow ${sw} > ${cw}`);
      assert.deepEqual(errors, [], `${route} @${name}: console errors`);
      await ctx.close();
    }
  }
});

test('unknown routes return the 404 page', async () => {
  const { ctx, page, res } = await open('/no-such-level');
  assert.equal(res.status(), 404);
  assert.match(await page.textContent('h1'), /404/);
  await ctx.close();
});

test('hero name animates in and the reel dialog plays the summary video', async () => {
  const { ctx, page } = await open('/');
  await page.waitForFunction(() => document.querySelector('.hero__line--1').classList.contains('is-in'));
  await page.click('.reel-card');
  await page.waitForSelector('dialog.reel[open]');
  assert.match(await page.getAttribute('.reel__video', 'src'), /\/media\/C68RXlqYZEHmSyQSdQOWK06nI\.mp4$/);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.reel').open);
  await ctx.close();
});

test('section separator morphs into an arrow on hover', async () => {
  const { ctx, page } = await open('/');
  const sep = page.locator('a.sep').first();
  await sep.scrollIntoViewIfNeeded();
  await sep.hover();
  await page.waitForTimeout(700);
  const w = await sep.locator('.sep__mid').evaluate((e) => e.getBoundingClientRect().width);
  assert.ok(Math.abs(w - 100) < 2, `mid line width ${w}`);
  const t = await sep.locator('.sep__top').evaluate((e) => getComputedStyle(e).transform);
  assert.notEqual(t, 'none');
  await ctx.close();
});

test('project card hover reveals the label and starts the preview', async () => {
  const { ctx, page } = await open('/');
  const card = page.locator('.project__card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(800);
  assert.equal(await card.locator('.project__label').evaluate((e) => getComputedStyle(e).opacity), '1');
  assert.ok(await card.locator('video').evaluate((v) => !!v.getAttribute('src')), 'preview src set on hover');
  await ctx.close();
});

test('phone menu opens and closes with Escape', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.phone);
  const btn = page.locator('.home-nav .menu-btn');
  assert.ok(await btn.isVisible());
  await btn.click();
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  assert.ok(await page.locator('#site-menu').isVisible());
  assert.ok(await page.locator('.menu__link', { hasText: 'EDUCATION' }).isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  await page.waitForTimeout(300); // exit animation
  assert.ok(await page.locator('#site-menu').isHidden());
  await ctx.close();
});

test('case study: chapters, lightbox and next level navigation', async () => {
  const { ctx, page } = await open('/work/darkfen---darkfen');
  const chapters = await page.$$eval('.cs-toc a', (as) => as.map((a) => a.hash));
  assert.ok(chapters.length >= 10, `chapters: ${chapters.length}`);
  for (const h of chapters) assert.ok(await page.$(h), `heading ${h} exists`);
  const zoom = page.locator('[data-zoom]').nth(2);
  await zoom.scrollIntoViewIfNeeded();
  await zoom.click();
  await page.waitForSelector('dialog.lightbox[open]');
  const first = await page.textContent('.lightbox__caption');
  assert.ok(first.length > 0);
  await page.click('.lightbox__nav--next');
  assert.ok(await page.locator('.lightbox__stage > *').count() === 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.getAttribute('.next-level__link', 'href'), '/projects/delumination');
  await ctx.close();
});

test('slideshow advances with its controls', async () => {
  const { ctx, page } = await open('/pier-extract');
  const show = page.locator('[data-slideshow]');
  await show.scrollIntoViewIfNeeded();
  await show.locator('.slideshow__btn--next').click();
  const current = await show.locator('.slideshow__dots button[aria-current="true"]').getAttribute('aria-label');
  assert.equal(current, 'Go to slide 2');
  await ctx.close();
});

test('with reduced motion, content is visible immediately', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.desktop, { reducedMotion: 'reduce' });
  await page.waitForTimeout(400);
  const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  assert.equal(hidden, 0);
  await ctx.close();
});

test('education ticker scrolls at the measured 30px/s', async () => {
  const { ctx, page } = await open('/education');
  await page.waitForTimeout(500);
  const ok = await page.$eval('.ticker__track', (t) => {
    const dur = parseFloat(getComputedStyle(t).animationDuration);
    return Math.abs(t.scrollWidth / 2 / dur - 30) < 1;
  });
  assert.ok(ok);
  await ctx.close();
});

// ---------------------------------------------------------------------------------------------
// Motion behaviour (values measured on the original; see docs/REVERSE-ENGINEERING.md §10)

test('load sequence: reel, then name letters (spring overshoot), nav, KASINA, role words', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.desktop, {
    init: () => {
      window.__seen = {}; window.__minY = 0; const t0 = performance.now();
      const watch = { reel: '.hero__reel', name: '.hero__line--1 .ch', nav: '.home-nav .nch', kasina: '.hero__line--2', role: '.hero__role .wd' };
      const tick = () => {
        for (const [k, sel] of Object.entries(watch)) {
          const el = document.querySelector(sel);
          if (el && !window.__seen[k] && +getComputedStyle(el).opacity > 0.5) window.__seen[k] = performance.now() - t0;
        }
        const v = document.querySelector('.hero__line--1 .ch');
        if (v) window.__minY = Math.min(window.__minY, new DOMMatrixReadOnly(getComputedStyle(v).transform).m42);
        if (performance.now() - t0 < 3500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  });
  await page.waitForTimeout(3600);
  const { seen, minY } = await page.evaluate(() => ({ seen: window.__seen, minY: window.__minY }));
  for (const k of ['reel', 'name', 'nav', 'kasina', 'role']) assert.ok(seen[k] > 0, `${k} appeared`);
  assert.ok(seen.reel < seen.kasina && seen.name < seen.role && seen.nav < seen.role, `order ${JSON.stringify(seen)}`);
  // Spring bounce .25 overshoots ~2.8% of the 0.19em (≈49px) rise: about -1.4px.
  assert.ok(minY < -0.5 && minY > -4, `name overshoot ${minY}`);
  await ctx.close();
});

test('scroll reveal fires at the viewport edge, takes ~1s and plays once in both directions', async () => {
  const { ctx, page } = await open('/');
  await page.waitForTimeout(800);
  const target = '.others-section .project';
  await page.evaluate((sel) => { const el = document.querySelector(sel); scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 30); }, target);
  await page.waitForTimeout(400);
  assert.equal(await page.$eval(target, (e) => e.classList.contains('is-in')), false, 'not revealed below the fold');
  await page.evaluate(() => scrollBy(0, 60));
  await page.waitForTimeout(100);
  assert.equal(await page.$eval(target, (e) => e.classList.contains('is-in')), true, 'revealed once its box touches the viewport');
  const mid = await page.$eval(target, (e) => +getComputedStyle(e).opacity);
  assert.ok(mid < 0.9, `still animating after 100ms (opacity ${mid})`);
  await page.waitForTimeout(1100);
  assert.equal(await page.$eval(target, (e) => getComputedStyle(e).opacity), '1');
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), target); await page.waitForTimeout(50);
  assert.equal(await page.$eval(target, (e) => getComputedStyle(e).opacity), '1', 'does not replay');
  await ctx.close();
});

test('scrolling to the bottom and back leaves nothing hidden; about shift tracks scroll both ways', async () => {
  const { ctx, page } = await open('/');
  await page.waitForTimeout(800);
  const shift = () => page.$eval('.about__signature', (e) => parseFloat(e.style.getPropertyValue('--shift')));
  assert.ok(Math.abs((await shift()) + 30) < 0.5, 'signature starts at -30px');
  for (let y = 0; y < 6000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(40); }
  await page.waitForTimeout(1300);
  assert.ok(Math.abs(await shift()) < 0.5, 'signature reaches 0 at the bottom');
  const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  assert.equal(hidden, 0, 'every reveal has played');
  await page.mouse.wheel(0, -1500); await page.waitForTimeout(400);
  const back = await shift();
  assert.ok(back < -1 && back > -30, `shift reverses when scrolling up (${back})`);
  await ctx.close();
});

test('repeated hovers always settle in the right state', async () => {
  const { ctx, page } = await open('/');
  const card = page.locator('.project__card').first();
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
  for (let i = 0; i < 5; i++) { await card.hover(); await page.waitForTimeout(80); await page.mouse.move(2, 2); await page.waitForTimeout(60); }
  await card.hover(); await page.waitForTimeout(900);
  assert.equal(await card.locator('.project__label').evaluate((e) => getComputedStyle(e).opacity), '1');
  const s = await card.locator('.project__media').evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
  assert.ok(Math.abs(s - 1.09) < 0.005, `image scale ${s}`);
  await page.mouse.move(2, 2); await page.waitForTimeout(900);
  assert.equal(await card.locator('.project__label').evaluate((e) => getComputedStyle(e).opacity), '0');
  await ctx.close();
});

test('nav links scale to 1.1 on hover (spring) like the original', async () => {
  const { ctx, page } = await open('/');
  await page.waitForTimeout(2200);
  const link = page.locator('.home-nav__link').first();
  await link.hover(); await page.waitForTimeout(500);
  const s = await link.evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).a);
  assert.ok(Math.abs(s - 1.1) < 0.01, `scale ${s}`);
  await ctx.close();
});

test('touch: no hover-only states, centre-band previews and separators, taps navigate', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.phone, { hasTouch: true, isMobile: true });
  await page.waitForTimeout(800);
  const card = page.locator('.project__card').first();
  await card.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  assert.ok(await card.locator('video').evaluate((v) => !!v.getAttribute('src')), 'card in the middle band starts its preview');
  const sep = page.locator('a.sep').first();
  await sep.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  assert.ok(await sep.evaluate((e) => e.classList.contains('is-armed')), 'separator morphs into its arrow mid-screen');
  await card.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await Promise.all([page.waitForURL('**/work/darkfen---darkfen'), card.tap()]);
  await ctx.close();
});

test('reduced motion: hero is fully visible immediately and nothing loops', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.desktop, { reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  const vis = await page.$$eval('.hero__line--1 .ch, .hero__line--2, .home-nav .nch, .hero__reel', (els) => els.every((e) => getComputedStyle(e).opacity === '1'));
  assert.ok(vis, 'hero visible');
  assert.equal(await page.$eval('.scroll-cue__bar', (e) => getComputedStyle(e).animationIterationCount), '1');
  await ctx.close();
});

test('lite mode on low-end devices drops previews, blur and the cursor label', async () => {
  const { ctx, page } = await open('/', VIEWPORTS.desktop, { init: () => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }) });
  await page.waitForTimeout(2200);
  assert.ok(await page.evaluate(() => document.documentElement.classList.contains('lite')));
  assert.equal(await page.$eval('.home-nav .nch', (e) => getComputedStyle(e).filter), 'none');
  const card = page.locator('.project__card').first();
  await card.scrollIntoViewIfNeeded(); await card.hover(); await page.waitForTimeout(300);
  assert.equal(await card.locator('video').evaluate((v) => v.getAttribute('src')), null);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('has-cursor')), false);
  await ctx.close();
});
