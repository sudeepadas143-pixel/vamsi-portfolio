const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const BASE = 'https://voluntary-path-520226.framer.app';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Hero entrance: record mutations from navigation start.
  await page.addInitScript(() => {
    window.__log = []; const t0 = performance.now();
    new MutationObserver((ms) => { for (const m of ms) { const el = m.target; if (el.nodeType !== 1) continue; window.__log.push([Math.round(performance.now() - t0), el.getAttribute('data-framer-name') || el.tagName + '.' + (el.className || '').toString().slice(0, 30), (el.getAttribute('style') || '').replace(/will-change:[^;]+;?/g, '').slice(0, 160)]); } })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  for (const t of [100, 400, 800, 1400, 2400]) { await sleep(t === 100 ? 100 : 300 + t / 4); await page.screenshot({ path: `${OUT}/hero-${t}.png` }); }
  await sleep(1500);
  const log = await page.evaluate(() => window.__log.filter((l) => !/Moving Line/.test(l[1])));
  fs.writeFileSync(`${OUT}/hero-log.json`, JSON.stringify(log.slice(0, 400), null, 0));

  // 2. Nav hover — sample letter spans.
  const nav = page.locator('header a').first();
  const before = await nav.evaluate((a) => [...a.querySelectorAll('*')].map((e) => e.getAttribute('style') || '').join('\n'));
  await nav.hover(); await sleep(150);
  await page.screenshot({ path: `${OUT}/nav-hover-150.png`, clip: { x: 200, y: 20, width: 600, height: 80 } });
  await sleep(600);
  const after = await nav.evaluate((a) => [...a.querySelectorAll('*')].map((e) => (e.getAttribute('style') || '') + ' | ' + getComputedStyle(e).transform + ' ' + getComputedStyle(e).color).join('\n'));
  await page.screenshot({ path: `${OUT}/nav-hover-750.png`, clip: { x: 200, y: 20, width: 600, height: 80 } });
  fs.writeFileSync(`${OUT}/nav-hover.txt`, before + '\n=====\n' + after + '\n=====\n' + await nav.evaluate((a) => a.outerHTML.slice(0, 3000)));

  // 3. Project card hover geometry.
  await page.mouse.move(5, 5);
  const card = page.locator('[data-framer-name="Project Item"]').first();
  await card.scrollIntoViewIfNeeded(); await sleep(1500);
  const box = await card.boundingBox();
  await page.screenshot({ path: `${OUT}/card-rest.png`, clip: { x: box.x - 120, y: box.y - 30, width: box.width + 260, height: box.height + 140 } });
  await card.hover(); await sleep(900);
  await page.screenshot({ path: `${OUT}/card-hover.png`, clip: { x: box.x - 120, y: box.y - 30, width: box.width + 260, height: box.height + 140 } });
  const geo = await card.evaluate((c) => [...c.querySelectorAll('*')].map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute('data-framer-name') || e.tagName, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), getComputedStyle(e).opacity, getComputedStyle(e).borderRadius].join(' '); }).join('\n'));
  fs.writeFileSync(`${OUT}/card-hover.txt`, JSON.stringify(box) + '\n' + geo);

  // 4. Title separator hover screenshot.
  const sep = page.locator('[data-framer-name="Title Separator"]').first();
  await sep.scrollIntoViewIfNeeded(); await page.mouse.move(5, 5); await sleep(600);
  const sb = await sep.boundingBox();
  await page.screenshot({ path: `${OUT}/sep-rest.png`, clip: { x: sb.x + sb.width - 300, y: sb.y - 10, width: 320, height: 65 } });
  await sep.hover(); await sleep(900);
  await page.screenshot({ path: `${OUT}/sep-hover.png`, clip: { x: sb.x + sb.width - 300, y: sb.y - 10, width: 320, height: 65 } });

  // 5. About page "<" menu.
  await page.goto(BASE + '/about', { waitUntil: 'load' }); await sleep(2500);
  await page.screenshot({ path: `${OUT}/about-top.png` });
  const menuHtml = await page.evaluate(() => { const h = document.querySelector('header, nav, [data-framer-name*="Nav" i], [data-framer-name*="Menu" i]'); return h ? h.outerHTML.slice(0, 6000) : 'none'; });
  fs.writeFileSync(`${OUT}/about-menu.html`, menuHtml);
  await page.mouse.click(272, 76); await sleep(1200);
  await page.screenshot({ path: `${OUT}/about-menu-open.png` });
  await browser.close();
})();
