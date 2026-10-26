const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const out = {};
  for (const r of ['/', '/projects/delumination', '/education', '/furscape', '/castle-infiltration', '/pier-extract', '/work/darkfen---darkfen', '/about', '/otherprojects', '/projects']) {
    await p.goto('https://voluntary-path-520226.framer.app' + r, { waitUntil: 'load', timeout: 90000 }).catch(() => {}); await p.waitForTimeout(2500);
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.waitForTimeout(1000);
    out[r] = await p.evaluate(() => {
      const boxes = [];
      for (const el of document.querySelectorAll('#main *')) {
        const cs = getComputedStyle(el); const rr = el.getBoundingClientRect();
        if (rr.width < 40 || rr.height < 20) continue;
        const bg = cs.backgroundColor; const hasBg = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(18, 18, 18)';
        const hasBorder = cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px';
        const grad = cs.backgroundImage !== 'none';
        if (!hasBg && !hasBorder && !grad && cs.boxShadow === 'none') continue;
        boxes.push({ name: el.getAttribute('data-framer-name'), tag: el.tagName, x: Math.round(rr.x), y: Math.round(rr.y + scrollY), w: Math.round(rr.width), h: Math.round(rr.height), bg: hasBg ? bg : undefined, border: hasBorder ? `${cs.borderTopWidth} ${cs.borderBottomWidth} ${cs.borderTopColor}` : undefined, grad: grad ? cs.backgroundImage.slice(0, 120) : undefined, shadow: cs.boxShadow !== 'none' ? cs.boxShadow : undefined, radius: cs.borderRadius, op: cs.opacity });
      }
      const slides = [...document.querySelectorAll('#main ul')].map((ul) => ({ n: ul.children.length, imgs: [...new Set([...ul.querySelectorAll('img')].map((i) => i.currentSrc || i.src))], vids: [...new Set([...ul.querySelectorAll('video')].map((v) => v.currentSrc || v.src))], txt: [...ul.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean).slice(0, 30) }));
      return { boxes, slides };
    });
    console.log('done', r);
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  await b.close();
})();
