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
const VIEWPORTS = { phone: { width: 390, height: 844 }, tablet: { width: 810, height: 1080 }, desktop: { width: 1440, height: 900 } };
let server, browser;

before(async () => { server = await serve(PORT); browser = await chromium.launch(); });
after(async () => { await browser?.close(); server?.close(); });

async function open(path, viewport = VIEWPORTS.desktop, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/i\.ytimg\.com|ERR_NAME_NOT_RESOLVED|ERR_TUNNEL/.test(m.text() + (m.location()?.url || ''))) errors.push(m.text()); });
  const res = await page.goto(BASE + path, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, res, errors };
}

test('every route loads without errors and without horizontal overflow at phone, tablet and desktop', async () => {
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
