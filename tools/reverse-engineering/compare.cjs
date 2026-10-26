// Screenshot local build like the reference capture, then diff with ImageMagick.
// usage: node compare.cjs <outDir> <viewport:desktop|mobile|tablet> route...
const { chromium } = require('playwright');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const S = process.env.REF_DIR || require('path').resolve(__dirname, '../../.cache/ref');
const [, , out, vpName, ...routes] = process.argv;
const VP = { desktop: { width: 1440, height: 900 }, tablet: { width: 810, height: 1080 }, mobile: { width: 390, height: 844 } }[vpName];
const slug = (r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '__'));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const r of routes) {
    const ctx = await b.newContext({ viewport: VP, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto('http://localhost:4173' + r, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1500);
    await p.evaluate(async () => { const s = (ms) => new Promise((r) => setTimeout(r, ms)); for (let y = 0; y < document.documentElement.scrollHeight; y += 250) { scrollTo(0, y); await s(60); } await s(900); scrollTo(0, 0); await s(900); });
    const mine = path.join(out, `${slug(r)}-${vpName}.png`);
    await p.screenshot({ path: mine, fullPage: true });
    const ref = path.join(S, 'ref', slug(r), `${vpName}-full.png`);
    const [rw, rh] = execFileSync('identify', ['-format', '%w %h', ref]).toString().split(' ').map(Number);
    const [mw, mh] = execFileSync('identify', ['-format', '%w %h', mine]).toString().split(' ').map(Number);
    const h = Math.min(rh, mh), w = Math.min(rw, mw);
    const a = path.join(out, `_a.png`), c = path.join(out, `_b.png`);
    execFileSync('convert', [ref, '-crop', `${w}x${h}+0+0`, '+repage', a]);
    execFileSync('convert', [mine, '-crop', `${w}x${h}+0+0`, '+repage', c]);
    const ae = spawnSync('compare', ['-metric', 'AE', '-fuzz', '12%', a, c, path.join(out, `${slug(r)}-${vpName}-diff.png`)], { encoding: 'utf8' });
    const px = parseFloat(ae.stderr);
    execFileSync('convert', [a, c, '+append', '-resize', '50%', path.join(out, `${slug(r)}-${vpName}-side.png`)]);
    console.log(`${r.padEnd(26)} ref ${rw}x${rh} mine ${mw}x${mh}  height Δ ${mh - rh}px  diff(fuzz12%) ${(100 * px / (w * h)).toFixed(2)}%`);
    await ctx.close();
  }
  await b.close();
})();
