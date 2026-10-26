#!/usr/bin/env node
// Generates CSS `linear()` easings that reproduce the original site's Framer Motion springs.
// Spring parameters were read from the original bundles (see docs/REVERSE-ENGINEERING.md §10)
// and checked against per-frame samples of the live site.
//   node scripts/springs.mjs   -> prints custom properties for src/styles/main.css
//
// Duration/bounce springs follow Motion's solver: dampingRatio = 1 - bounce and the undamped
// frequency is chosen so the oscillation envelope decays to 0.001 at `duration`.

const SAFE_MIN = 0.001;

function fromDurationBounce(duration, bounce) {
  const z = Math.min(1, Math.max(0.05, 1 - bounce));
  let w;
  if (z < 1) {
    w = -Math.log((SAFE_MIN * Math.sqrt(1 - z * z)) / z) / (z * duration);
  } else {
    // e^{-wD}(wD + 1) = SAFE_MIN, solved by Newton's method
    let x = 5;
    for (let i = 0; i < 50; i++) { const f = Math.exp(-x) * (x + 1) - SAFE_MIN; const d = -x * Math.exp(-x); x -= f / d; }
    w = x / duration;
  }
  return { k: w * w, c: 2 * z * w };
}

// Unit step response of m=1 spring with stiffness k and damping c.
function response(k, c) {
  const w0 = Math.sqrt(k);
  const z = c / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return (t) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const r1 = -w0 * (z - Math.sqrt(z * z - 1));
  const r2 = -w0 * (z + Math.sqrt(z * z - 1));
  return (t) => 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// Duration until the response stays within 0.1% of the target.
function settleTime(f, cap = 4) {
  let last = cap;
  for (let t = cap; t > 0; t -= 0.001) { if (Math.abs(f(t) - 1) > 0.001) { last = t; break; } }
  return Math.ceil(last * 100) / 100;
}

function linearEasing(f, duration, points) {
  const vals = [];
  for (let i = 0; i <= points; i++) vals.push(+f((duration * i) / points).toFixed(4));
  vals[vals.length - 1] = 1;
  return `linear(${vals.join(', ')})`;
}

export const SPRINGS = {
  // name: [description, params]
  name: ['hero name letters (bounce .25, .45s)', fromDurationBounce(0.45, 0.25)],
  text: ['nav letters / role words (bounce 0, .4s)', fromDurationBounce(0.4, 0)],
  reel: ['reel scale-in (bounce .2, 2s)', fromDurationBounce(2, 0.2)],
  snap: ['separator, nav scale (bounce .2, .4s)', fromDurationBounce(0.4, 0.2)],
  tool: ['tool card (bounce .1, .5s)', fromDurationBounce(0.5, 0.1)],
  card: ['project card, social icon (stiffness 500, damping 60)', { k: 500, c: 60 }],
  slide: ['slideshow (stiffness 200, damping 40)', { k: 200, c: 40 }],
};

if (process.argv[1] && process.argv[1].endsWith('springs.mjs')) {
  for (const [key, [desc, { k, c }]] of Object.entries(SPRINGS)) {
    const f = response(k, c);
    const d = settleTime(f);
    const pts = Math.max(24, Math.round(d * 40));
    console.log(`  /* ${desc} */\n  --spring-${key}: ${linearEasing(f, d, pts)};\n  --spring-${key}-d: ${d}s;`);
  }
}
