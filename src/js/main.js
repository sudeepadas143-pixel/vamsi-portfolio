// Motion + interaction runtime. No dependencies.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // --- Load "appear" effects (hero letters, nav blur-in, role words, reel scale) ---
  const appearOnLoad = () => {
    $$('.home-nav, .hero [data-split], [data-split-words], [data-appear-fade], [data-appear-scale], .page-intro [data-split]').forEach((el) =>
      el.classList.add('is-in'),
    );
  };
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(appearOnLoad));

  // --- Scroll reveal (Framer "appear on scroll": opacity 0, translateY 40px, perspective 1200) ---
  const revealTargets = $$('[data-reveal], [data-split]:not(.hero [data-split]):not(.page-intro [data-split])');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  // --- Scroll-linked shift: signature (-30px) and yellow panel (-20px) slide to 0 over the page scroll ---
  const shifters = $$('[data-shift]');
  // --- Mouse parallax on the hero reel ---
  const parallax = document.querySelector('[data-mouse-parallax]');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const tick = () => {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    if (parallax) { parallax.style.setProperty('--px', `${cx.toFixed(2)}px`); parallax.style.setProperty('--py', `${cy.toFixed(2)}px`); }
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
  };
  if (parallax && !reduce && matchMedia('(pointer: fine)').matches) {
    addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2 * 30;
      ty = (e.clientY / innerHeight - 0.5) * 2 * 24;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }
  const onScroll = () => {
    if (!shifters.length) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
    shifters.forEach((el) => el.style.setProperty('--shift', `${(+el.dataset.shift * (1 - p)).toFixed(2)}px`));
  };
  if (!reduce) { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // --- Lazy autoplay videos (muted loops) ---
  const vids = $$('video[data-autoplay]');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        if (!reduce) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    }), { rootMargin: '200px 0px' });
    vids.forEach((v) => vio.observe(v));
  }
  // Videos with controls load their source on demand.
  $$('video[controls][data-src]').forEach((v) => {
    const load = () => { if (!v.src) { v.src = v.dataset.src; } };
    v.addEventListener('play', load, { once: true });
    v.addEventListener('pointerenter', load, { once: true });
    v.addEventListener('focus', load, { once: true });
    v.addEventListener('click', () => { load(); v.play().catch(() => {}); }, { once: true });
  });

  // --- YouTube facade: loads the player only when asked ---
  $$('[data-yt]').forEach((btn) => btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    f.title = 'Walkthrough video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  }));

  // --- Slideshow ---
  $$('[data-slideshow]').forEach((root) => {
    const track = root.querySelector('.slideshow__track');
    const dots = $$('.slideshow__dots button', root);
    const n = dots.length;
    let i = 0, timer = 0;
    const go = (k) => {
      i = (k + n) % n;
      track.style.transform = `translateX(${-100 * i}%)`;
      dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === i)));
    };
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 4000); };
    root.querySelector('.slideshow__btn--prev').addEventListener('click', () => { go(i - 1); auto(); });
    root.querySelector('.slideshow__btn--next').addEventListener('click', () => { go(i + 1); auto(); });
    dots.forEach((d, j) => d.addEventListener('click', () => { go(j); auto(); }));
    // Lazy images that sit off-screen horizontally never load, so load all slides once the slideshow is near.
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { $$('img', root).forEach((im) => { im.loading = 'eager'; }); o.disconnect(); } }, { rootMargin: '600px 0px' }).observe(root);
    root.addEventListener('pointerenter', () => clearInterval(timer));
    root.addEventListener('pointerleave', auto);
    auto();
  });

  // --- Ticker: 30px/s, measured from the original Framer Ticker (4860px / 162s) ---
  const sizeTickers = () => $$('.ticker__track').forEach((t) => {
    t.style.setProperty('--dur', `${(t.scrollWidth / 2 / 30).toFixed(1)}s`);
  });
  fontsReady.then(sizeTickers);
})();
