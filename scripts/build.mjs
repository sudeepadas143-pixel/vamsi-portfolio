#!/usr/bin/env node
// Renders every page to dist/<route>/index.html and copies static assets.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pages from '../src/templates/pages.mjs';
import { caseStudies, caseStudyPage } from '../src/templates/case-study.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

const routes = {
  '/': pages.home(),
  '/about': pages.aboutPage(),
  '/contact': pages.contactPage(),
  '/education': pages.educationPage(),
  '/projects': pages.projectsPage(),
  '/otherprojects': pages.otherProjectsPage(),
  ...Object.fromEntries(caseStudies.map((cs) => [cs.path, caseStudyPage(cs)])),
};

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const [route, html] of Object.entries(routes)) {
  const file = join(DIST, route, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
writeFileSync(join(DIST, '404.html'), pages.notFoundPage());
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
cpSync(join(ROOT, 'src/styles'), join(DIST, 'styles'), { recursive: true });
cpSync(join(ROOT, 'src/js'), join(DIST, 'js'), { recursive: true });
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(routes)
    .map((r) => `<url><loc>https://vamsi-kasina.com${r}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);
console.log(`built ${Object.keys(routes).length + 1} pages -> dist/`);
