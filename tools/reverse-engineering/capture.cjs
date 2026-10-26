// Own capture script (techniques adapted from site-deep-clone / mimic ideas, not their code).
// usage: node capture.cjs <baseUrl> <outDir> <route...>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , base, out, ...routes] = process.argv;
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 810, height: 1080 }, mobile: { width: 390, height: 844 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function autoScroll(page) {
  await page.evaluate(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 250) { window.scrollTo(0, y); await s(120); }
    await s(800); window.scrollTo(0, 0); await s(800);
  });
}

function slug(r) { return r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '__'); }

(async () => {
  const browser = await chromium.launch();
  const net = new Set();
  for (const route of routes) {
    const dir = path.join(out, slug(route)); fs.mkdirSync(dir, { recursive: true });
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      page.on('response', (res) => net.add(res.url()));
      try { await page.goto(base + route, { waitUntil: 'load', timeout: 90000 }); } catch (e) { console.log('goto-timeout', route, vpName); }
      await sleep(2500);
      await page.evaluate(() => document.fonts.ready);
      await sleep(1500);
      await page.screenshot({ path: path.join(dir, `${vpName}-top.png`) });
      await autoScroll(page);
      await page.screenshot({ path: path.join(dir, `${vpName}-full.png`), fullPage: true });

      if (vpName === 'desktop' || vpName === 'mobile') {
        // Structured DOM/text/computed-style dump of visible leaf-ish elements.
        const dump = await page.evaluate(() => {
          const out = [];
          const all = document.querySelectorAll('#main *');
          for (const el of all) {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            const cs = getComputedStyle(el);
            const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
            const isMedia = /IMG|VIDEO|SVG|CANVAS/.test(el.tagName);
            const named = el.getAttribute('data-framer-name');
            if (!own && !isMedia && !named) continue;
            out.push({
              tag: el.tagName, name: named, text: own.slice(0, 200),
              x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height),
              src: el.currentSrc || el.getAttribute('src') || undefined,
              ff: cs.fontFamily, fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing,
              color: cs.color, bg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : undefined,
              bgimg: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 200) : undefined,
              tt: cs.textTransform !== 'none' ? cs.textTransform : undefined,
              pos: cs.position !== 'static' ? cs.position : undefined,
              transform: cs.transform !== 'none' ? cs.transform : undefined,
              opacity: cs.opacity !== '1' ? cs.opacity : undefined,
              radius: cs.borderRadius !== '0px' ? cs.borderRadius : undefined,
              border: cs.borderTopWidth !== '0px' ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : undefined,
              filter: cs.filter !== 'none' ? cs.filter : undefined, mix: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : undefined,
              href: el.closest('a')?.getAttribute('href') || undefined,
            });
          }
          return { title: document.title, height: document.documentElement.scrollHeight, bodyBg: getComputedStyle(document.body).backgroundColor, items: out };
        });
        fs.writeFileSync(path.join(dir, `${vpName}-dom.json`), JSON.stringify(dump, null, 1));
        fs.writeFileSync(path.join(dir, `${vpName}-dom.html`), await page.content());
      }

      if (vpName === 'desktop') {
        // Mutation log during a slow scroll trip: recovers Framer Motion rAF transforms.
        await page.evaluate(() => {
          window.__mut = []; const t0 = performance.now(); const ids = new WeakMap(); let n = 0;
          window.__mo = new MutationObserver((ms) => {
            for (const m of ms) {
              const el = m.target; if (window.__mut.length > 6000) return;
              if (!ids.has(el)) ids.set(el, n++);
              window.__mut.push([Math.round(performance.now() - t0), ids.get(el), el.getAttribute('data-framer-name') || el.tagName, (el.textContent || '').trim().slice(0, 24), (el.getAttribute('style') || '').slice(0, 260), Math.round(scrollY)]);
            }
          });
          window.__mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] });
        });
        await page.evaluate(async () => {
          const s = (ms) => new Promise((r) => setTimeout(r, ms));
          for (let y = 0; y < document.documentElement.scrollHeight; y += 80) { window.scrollTo(0, y); await s(60); }
          await s(1200);
        });
        // Mouse move for parallax probes
        for (const [x, y] of [[200, 200], [1200, 700], [720, 450]]) { await page.mouse.move(x, y, { steps: 8 }); await sleep(300); }
        const mut = await page.evaluate(() => { window.__mo.disconnect(); return window.__mut; });
        fs.writeFileSync(path.join(dir, 'mutations.json'), JSON.stringify(mut));

        // Hover diffs on links / named interactive elements.
        await page.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
        const handles = await page.$$('a, [data-highlight="true"], [class*="cursor"]');
        const hovers = [];
        for (const h of handles.slice(0, 25)) {
          try {
            const info = await h.evaluate((el) => ({ text: (el.textContent || '').trim().slice(0, 40), href: el.getAttribute('href'), name: el.getAttribute('data-framer-name') }));
            await h.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await sleep(250);
            const snap = () => h.evaluate((el) => [el, ...el.querySelectorAll('*')].slice(0, 30).map((e) => { const c = getComputedStyle(e); return [e.getAttribute('data-framer-name') || e.tagName, c.color, c.backgroundColor, c.opacity, c.transform, c.width, c.height, c.letterSpacing, (e.getAttribute('style') || '').slice(0, 200)].join('|'); }));
            const before = await snap();
            await h.hover({ timeout: 2000 }); await sleep(700);
            const after = await snap();
            const diff = before.map((b, i) => (b !== after[i] ? { before: b, after: after[i] } : null)).filter(Boolean);
            if (diff.length) hovers.push({ ...info, diff });
          } catch (e) { /* not hoverable */ }
        }
        fs.writeFileSync(path.join(dir, 'hover.json'), JSON.stringify(hovers, null, 1));
      }
      await ctx.close();
      console.log('done', route, vpName);
    }
  }
  fs.writeFileSync(path.join(out, 'network.json'), JSON.stringify([...net], null, 1));
  await browser.close();
})();
