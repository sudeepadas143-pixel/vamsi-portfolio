// Finds the scroll position at which a reveal starts (px of the element visible above the
// viewport bottom), then scrolls away and back to see whether it replays.
// usage: node trigger.cjs <url> <selector> [index] [width] [height]
const { chromium } = require('playwright');
const [, , url, sel, index = 0, w = 1440, h = 900] = process.argv;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto(url, { waitUntil: 'load' }); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }); await p.waitForTimeout(3500);
  const state = () => p.evaluate(([s, i]) => {
    const el = document.querySelectorAll(s)[i]; const r = el.getBoundingClientRect();
    let eo = 1; for (let e = el; e; e = e.parentElement) eo *= +getComputedStyle(e).opacity;
    return { visible: Math.round(innerHeight - r.top), eo: +eo.toFixed(3) };
  }, [sel, +index]);
  await p.evaluate(([s, i]) => { const el = document.querySelectorAll(s)[i]; scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight + -60); }, [sel, +index]);
  await p.waitForTimeout(500);
  let st = await state(); let trig = null;
  for (let k = 0; k < 40 && !trig; k++) {
    await p.evaluate(() => scrollBy(0, 5)); await p.waitForTimeout(120);
    const s2 = await state(); if (s2.eo > st.eo + 0.01) trig = s2.visible - 5; st = s2;
  }
  console.log(`${url} ${sel}[${index}] @${w}: reveal starts when ~${trig}px of the element (top edge) is above the viewport bottom`);
  await p.waitForTimeout(1500); const done = await state();
  await p.evaluate(() => scrollBy(0, -2000)); await p.waitForTimeout(800); const away = await state();
  await p.evaluate(() => scrollBy(0, 2000)); await p.waitForTimeout(60); const back = await state();
  console.log(`  settled eo=${done.eo}; after scrolling away eo=${away.eo}; 60ms after returning eo=${back.eo} => ${away.eo < 0.5 || back.eo < 0.9 ? 'REPLAYS' : 'plays once'}`);
  await b.close();
})();
