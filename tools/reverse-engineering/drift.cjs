const { chromium } = require('playwright');
const content = require(require('path').join(process.env.REF_DIR || require('path').resolve(__dirname, '../../.cache/ref'), 'content.json'));
const [, , route] = process.argv;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:4173' + route, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '[data-reveal],[data-split] .ch{opacity:1!important;transform:none!important}' });
  const mine = await p.evaluate(() => [...document.querySelectorAll('.cs-item')].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || '').trim().slice(0, 30), y: Math.round(r.top + scrollY), h: Math.round(r.height), img: e.querySelector('img,video')?.getAttribute('poster') || e.querySelector('img')?.getAttribute('src') || '' }; }));
  const ref = content[route].atoms.filter((a) => a.op > 0);
  for (const m of mine) {
    const r = ref.find((a) => (m.t && a.text && a.text.replace(/[*_]/g, '').trim().startsWith(m.t.slice(0, 18))) || (m.img && a.src && a.src.includes(m.img.split('/').pop().split('.')[0])));
    if (r) console.log(String(m.y - r.y).padStart(5), 'h', String(m.h - r.h).padStart(4), m.y, (m.t || m.img).slice(0, 40));
  }
  await b.close();
})();
