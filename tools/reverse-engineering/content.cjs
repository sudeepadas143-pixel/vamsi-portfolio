// Extract ordered content atoms (text w/ inline markup, images, videos, iframes) with geometry.
const { chromium } = require('playwright');
const fs = require('fs');
const [, , out, ...routes] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const all = {};
  for (const r of routes) {
    await p.goto('https://voluntary-path-520226.framer.app' + r, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(2500);
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); });
    await p.waitForTimeout(1500);
    all[r] = await p.evaluate(() => {
      const atoms = [];
      const main = document.querySelector('#main');
      const inline = (el) => {
        let s = '';
        for (const n of el.childNodes) {
          if (n.nodeType === 3) s += n.textContent;
          else if (n.nodeType === 1) {
            const t = n.tagName; const inner = inline(n);
            if (t === 'STRONG' || t === 'B') s += `**${inner}**`;
            else if (t === 'EM' || t === 'I') s += `_${inner}_`;
            else if (t === 'BR') s += '\n';
            else if (t === 'A') s += `[${inner}](${n.getAttribute('href')})`;
            else s += inner;
          }
        }
        return s;
      };
      const seen = new Set();
      for (const el of main.querySelectorAll('h1,h2,h3,h4,h5,h6,p,img,video,iframe,ul,ol')) {
        if ([...seen].some((s) => s.contains(el))) continue;
        if (el.closest('header,nav,[data-framer-name="Navigation"]')) continue;
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
        let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
        const a = { tag: el.tagName, x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), href: el.closest('a')?.getAttribute('href') || undefined, op: +op.toFixed(2) };
        if (/^(H\d|P|UL|OL)$/.test(el.tagName)) {
          a.text = el.tagName.match(/UL|OL/) ? [...el.querySelectorAll('li')].map((li) => '- ' + inline(li).trim()).join('\n') : inline(el).trim();
          if (!a.text) continue;
          a.font = `${cs.fontFamily.split(',')[0].replace(/"/g, '')} ${cs.fontSize} ${cs.fontWeight} ${cs.color} ${cs.textAlign}`;
          seen.add(el);
        } else if (el.tagName === 'IMG') { a.src = el.currentSrc || el.src; a.nw = el.naturalWidth; a.nh = el.naturalHeight; a.alt = el.alt; a.radius = cs.borderRadius; a.fit = cs.objectFit; }
        else if (el.tagName === 'VIDEO') { a.src = el.currentSrc || el.src; a.poster = el.poster; a.attrs = ['autoplay', 'loop', 'muted', 'controls'].filter((k) => el.hasAttribute(k) || el[k]).join(','); a.radius = cs.borderRadius; }
        else if (el.tagName === 'IFRAME') { a.src = el.src; }
        atoms.push(a);
      }
      return { height: document.documentElement.scrollHeight, atoms };
    });
    console.log('done', r, all[r].atoms.length);
  }
  fs.writeFileSync(out, JSON.stringify(all, null, 1));
  await b.close();
})();
