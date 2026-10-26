const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const r of ['/projects/delumination', '/furscape', '/castle-infiltration', '/pier-extract', '/work/darkfen---darkfen']) {
    await p.goto('https://voluntary-path-520226.framer.app' + r, { waitUntil: 'load', timeout: 90000 }).catch(() => {}); await p.waitForTimeout(2000); await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } scrollTo(0, 0); }); await p.waitForTimeout(1500);
    const l = await p.evaluate(() => [...document.querySelectorAll('#main *')].map((el) => { const rr = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: Math.round(rr.x), y: Math.round(rr.y + scrollY), w: Math.round(rr.width), h: Math.round(rr.height), bg: cs.backgroundColor, bt: cs.borderTopWidth + ' ' + cs.borderTopColor, op: cs.opacity }; }).filter((o) => o.w > 300 && o.h <= 4 && o.h > 0 && (o.bg !== 'rgba(0, 0, 0, 0)' || o.bt[0] !== '0')));
    console.log(r, JSON.stringify(l));
  }
  await b.close();
})();
