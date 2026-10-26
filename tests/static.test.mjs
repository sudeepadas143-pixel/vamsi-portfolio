// Static checks on the built site (run `npm run build` first; `npm test` does both).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES } from './routes.mjs';

const DIST = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist');

const htmlFiles = (dir = DIST) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? htmlFiles(p) : f.endsWith('.html') ? [p] : [];
});
const resolves = (path) => {
  const p = join(DIST, decodeURIComponent(path.split(/[?#]/)[0]));
  return (existsSync(p) && statSync(p).isFile()) || existsSync(join(p, 'index.html'));
};

test('every original route is built, plus 404 and sitemap', () => {
  for (const r of ROUTES) assert.ok(existsSync(join(DIST, r, 'index.html')), `missing ${r}`);
  assert.ok(existsSync(join(DIST, '404.html')));
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  for (const r of ROUTES) assert.ok(sitemap.includes(`https://www.vamsi-kasina.com${r}<`), `sitemap lacks ${r}`);
});

test('internal links and local assets resolve', () => {
  const broken = [];
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    for (const [, attr, url] of html.matchAll(/\s(href|src|poster|data-src|data-preview)="(\/[^"]*)"/g)) {
      if (!resolves(url)) broken.push(`${file.replace(DIST, '')}: ${attr}=${url}`);
    }
    for (const [, set] of html.matchAll(/\ssrcset="([^"]+)"/g)) {
      for (const part of set.split(',')) { const u = part.trim().split(' ')[0]; if (!resolves(u)) broken.push(`${file.replace(DIST, '')}: srcset ${u}`); }
    }
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      if (id !== 'main' && !html.includes(`id="${id}"`)) broken.push(`${file.replace(DIST, '')}: #${id}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('no template placeholders or dead links from the Framer export survive', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    for (const bad of ['lucas@', 'yourwebsite', 'cocobasic', 'framerusercontent.com', 'href="./', 'href="../']) {
      assert.ok(!html.includes(bad), `${file.replace(DIST, '')} contains ${bad}`);
    }
  }
});

test('project cards link to their own case study', () => {
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  for (const href of ['/work/darkfen---darkfen', '/projects/delumination', '/pier-extract', '/furscape', '/castle-infiltration']) {
    assert.ok(home.includes(`class="project__card" href="${href}"`), `home card for ${href}`);
  }
});

test('each page has exactly one h1, a title, a description and a main landmark', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${file.replace(DIST, '')} h1 count`);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<main id="main"/);
  }
});

test('every <img> has an alt attribute', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    const missing = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/\salt="/.test(t));
    assert.deepEqual(missing, [], file.replace(DIST, ''));
  }
});
