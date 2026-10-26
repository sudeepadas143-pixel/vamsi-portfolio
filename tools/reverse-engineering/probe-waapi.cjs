const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  for (const r of ['/education', '/']) {
    await p.goto('https://voluntary-path-520226.framer.app' + r, { waitUntil: 'load' }); await p.waitForTimeout(3000);
    await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(1000);
    console.log(r, JSON.stringify(await p.evaluate(() => document.getAnimations().map((a) => ({ id: a.id, name: a.animationName || a.transitionProperty, target: a.effect?.target?.tagName + ':' + (a.effect?.target?.textContent || '').slice(0, 20) + ':' + a.effect?.target?.getAttribute?.('data-framer-name'), timing: a.effect?.getTiming?.(), kf: a.effect?.getKeyframes?.().map((k) => k.transform + ' ' + k.offset + ' ' + (k.easing || '')), rate: a.playbackRate }))), null, 0));
  }
  await b.close();
})();
