// Per-frame motion sampler, run identically against the reference and the rebuild.
// usage: node motion.cjs <url> <scenario.json>
// scenario: { width, height, action: "load"|"reveal"|"hover"|"loop", target?: sel, durationMs,
//             track: [{ name, sel, index? }] }
// Prints a summary per tracked element: first change (ms), 50% time, settle time, overshoot.
const { chromium } = require('playwright');
const [, , url, scenarioPath] = process.argv;
const sc = require(require('path').resolve(scenarioPath));

const sampler = (track, durationMs) => new Promise((resolve) => {
  const parse = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
    const blur = /blur\(([\d.]+)px\)/.exec(cs.filter);
    const r = el.getBoundingClientRect();
    let eo = 1; for (let e = el; e; e = e.parentElement) eo *= +getComputedStyle(e).opacity;
    return { eo: +eo.toFixed(3), o: +cs.opacity, x: +m.m41.toFixed(2), y: +m.m42.toFixed(2), s: +Math.hypot(m.m11, m.m12).toFixed(4), b: blur ? +blur[1] : 0, w: +r.width.toFixed(1), top: +r.top.toFixed(1), l: +r.left.toFixed(1) };
  };
  const els = track.map((t) => document.querySelectorAll(t.sel)[t.index || 0]);
  const t0 = performance.now(); const out = track.map(() => []);
  const frame = () => {
    const t = performance.now() - t0;
    els.forEach((el, i) => { const v = parse(el); if (v) out[i].push([Math.round(t), v]); });
    if (t < durationMs) requestAnimationFrame(frame); else resolve(out);
  };
  requestAnimationFrame(frame);
});

function summarise(series, key) {
  if (!series.length) return 'missing';
  const v0 = series[0][1][key], v1 = series[series.length - 1][1][key];
  const span = v1 - v0;
  if (Math.abs(span) < 1e-3) {
    const moved = series.some(([, v]) => Math.abs(v[key] - v0) > 0.01);
    return moved ? `loop/transient range ${Math.min(...series.map((s) => s[1][key]))}..${Math.max(...series.map((s) => s[1][key]))}` : `static ${v0}`;
  }
  const first = series.find(([, v]) => Math.abs(v[key] - v0) > Math.abs(span) * 0.01);
  const half = series.find(([, v]) => Math.abs(v[key] - v0) >= Math.abs(span) * 0.5);
  let settle = series[series.length - 1][0];
  for (let i = series.length - 1; i >= 0; i--) { if (Math.abs(series[i][1][key] - v1) > Math.abs(span) * 0.02) { settle = series[Math.min(i + 1, series.length - 1)][0]; break; } }
  const over = Math.max(...series.map(([, v]) => ((v[key] - v1) * Math.sign(span)))) / Math.abs(span);
  return `${v0}→${v1} start ${first ? first[0] : '-'}ms  t50 ${half ? half[0] : '-'}ms  settle ${settle}ms  overshoot ${(over * 100).toFixed(1)}%`;
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: sc.width || 1440, height: sc.height || 900 }, reducedMotion: sc.reducedMotion || 'no-preference' });
  const p = await ctx.newPage();
  let out;
  if (sc.action === 'load') {
    await p.addInitScript(`window.__sampler = ${sampler.toString()};`);
    await p.goto(url, { waitUntil: 'commit' });
    await p.waitForSelector(sc.track[0].sel, { state: 'attached' });
    out = await p.evaluate(([track, d]) => window.__sampler(track, d), [sc.track, sc.durationMs]);
  } else {
    await p.goto(url, { waitUntil: 'load' });
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important;scroll-padding:0!important}' });
    await p.waitForTimeout(3500);
    await p.evaluate(`window.__sampler = ${sampler.toString()};`);
    if (sc.action === 'reveal') {
      await p.evaluate((sel) => { const el = document.querySelector(sel); scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight - 50); }, sc.target);
      await p.waitForTimeout(400);
      const run = p.evaluate(([track, d]) => window.__sampler(track, d), [sc.track, sc.durationMs]);
      await p.waitForTimeout(50);
      await p.evaluate(() => scrollBy(0, 300));
      out = await run;
    } else if (sc.action === 'hover') {
      const el = p.locator(sc.target).first();
      await el.scrollIntoViewIfNeeded(); await p.mouse.move(2, 2); await p.waitForTimeout(800);
      const run = p.evaluate(([track, d]) => window.__sampler(track, d), [sc.track, sc.durationMs]);
      await p.waitForTimeout(30); await el.hover();
      await p.waitForTimeout(sc.durationMs / 2); await p.mouse.move(2, 2);
      out = await run;
    } else {
      out = await p.evaluate(([track, d]) => window.__sampler(track, d), [sc.track, sc.durationMs]);
    }
  }
  sc.track.forEach((t, i) => {
    const s = out[i];
    console.log(`# ${t.name} (${s.length} frames)`);
    for (const k of t.keys || ['o', 'y', 's']) {
      if (sc.action === 'hover') {
        const half = sc.durationMs / 2;
        const rebase = (arr, off) => arr.map(([tt, v]) => [tt - off, v]);
        console.log(`   ${k} in : ${summarise(s.filter(([tt]) => tt < half), k)}`);
        console.log(`   ${k} out: ${summarise(rebase(s.filter(([tt]) => tt >= half), half), k)}`);
      } else console.log(`   ${k}: ${summarise(s, k)}`);
    }
  });
  if (sc.dump) require('fs').writeFileSync(sc.dump, JSON.stringify(out));
  await b.close();
})();
