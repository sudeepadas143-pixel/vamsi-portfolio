const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => {
    window.__s = new Map(); const t0 = performance.now();
    new MutationObserver((ms) => { for (const m of ms) { const el = m.target; if (el.tagName !== 'SPAN') continue; const st = el.getAttribute('style') || '';
      const rec = window.__s.get(el) || { first: null, styleFirst: st, half: null, end: null }; const t = Math.round(performance.now() - t0);
      if (rec.first === null) rec.first = t; const o = parseFloat((st.match(/opacity:\s*([\d.]+)/) || [])[1]); if (o > 0.5 && rec.half === null) rec.half = t; if (o >= 0.999 && rec.end === null) rec.end = t; window.__s.set(el, rec); } })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await p.goto('https://voluntary-path-520226.framer.app/', { waitUntil: 'load' }); await p.waitForTimeout(5000);
  const r = await p.evaluate(() => [...window.__s.entries()].map(([el, v]) => [el.textContent, el.closest('[data-framer-name]')?.getAttribute('data-framer-name'), v.first, v.half, v.end, v.styleFirst.replace(/display: inline-block; |will-change: transform;/g, '')]));
  console.log(r.map((x) => x.join(' | ')).join('\n'));
  await b.close();
})();
