// Scroll-jank probe: wheel-scrolls a page down and back up with optional CPU throttling and reports
// frame-interval percentiles and long tasks. usage: node jank.cjs <url> <width> <height> [cpuRate]
const { chromium } = require('playwright');
const [, , url, w = 1440, h = 900, rate = 1] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, hasTouch: +w < 1100, isMobile: +w < 800 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +rate });
  await p.evaluate(() => {
    window.__frames = []; window.__long = 0; let last = performance.now();
    const f = (t) => { window.__frames.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
    try { new PerformanceObserver((l) => { window.__long += l.getEntries().length; }).observe({ type: 'longtask', buffered: false }); } catch {}
  });
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = Math.ceil(max / 120);
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); }
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(16); }
  await p.waitForTimeout(500);
  const { frames, long } = await p.evaluate(() => ({ frames: window.__frames.slice(5), long: window.__long }));
  frames.sort((a, b) => a - b);
  const pct = (q) => frames[Math.floor(frames.length * q)].toFixed(1);
  const dropped = frames.filter((f) => f > 34).length;
  console.log(`${url} @${w} cpu x${rate}: frames ${frames.length}, p50 ${pct(0.5)}ms p95 ${pct(0.95)}ms p99 ${pct(0.99)}ms, >34ms frames ${dropped} (${(100 * dropped / frames.length).toFixed(1)}%), long tasks ${long}`);
  await b.close();
})();
