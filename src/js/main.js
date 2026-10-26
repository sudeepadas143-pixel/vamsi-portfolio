// Motion + interaction runtime. No dependencies; every feature degrades to static content.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine) and (hover: hover)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  // Weaker devices (or Save-Data) get the same layout with the expensive extras switched off:
  // hover/scroll video previews, blur filters, backdrop blur, pointer parallax, cursor label.
  const conn = navigator.connection || {};
  const lite = !!conn.saveData || (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
  if (lite) document.documentElement.classList.add('lite');

  // --- Load sequence (timings live in CSS; measured on the original, see docs §10) ---
  const loadTargets = () => $$('.home-nav, .hero [data-split], .hero [data-rise], .hero [data-reveal], [data-split-words], [data-appear-scale], .page-intro [data-split], .page-intro [data-reveal]');
  const appear = () => {
    loadTargets().forEach((el) => el.classList.add('is-in'));
    const nav = $('.home-nav');
    if (nav) setTimeout(() => nav.classList.add('is-settled'), 1600);
  };
  if (reduce) appear();
  else Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]).then(() => requestAnimationFrame(appear));

  // --- Scroll reveal: Framer "appear" with threshold 0, played once. Like the original, it fires when
  // the element's (still 40px-low) box touches the viewport edge.
  const inLoad = new Set(loadTargets());
  const revealTargets = $$('[data-reveal], [data-split]').filter((el) => !inLoad.has(el));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px', threshold: 0 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  // --- Scroll-driven: about signature/panel shift (linear over page scroll, as the original),
  // reading progress, sub-nav hide/show. Scroll metrics are cached so a scroll frame never reads layout.
  const shifters = $$('[data-shift]');
  const progress = $('.progress');
  const subNav = $('[data-hide-on-scroll]');
  let maxScroll = 1;
  const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  measure();
  addEventListener('resize', measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const p = Math.min(1, Math.max(0, y / maxScroll));
    if (!reduce) shifters.forEach((el) => el.style.setProperty('--shift', `${(+el.dataset.shift * (1 - p)).toFixed(2)}px`));
    if (progress) progress.style.setProperty('--p', p.toFixed(4));
    if (subNav && !document.body.classList.contains('menu-open')) {
      subNav.classList.toggle('is-scrolled', y > 10);
      if (y > lastY + 4 && y > 240) subNav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 120) subNav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // --- Pointer parallax on the hero reel. The original's "Parallax Mouse Effect" component
  // (offset = (pointer - centre) * 0.05) wraps an empty layer, so nothing visibly moved there;
  // here it is applied to the reel, with light smoothing so the card glides instead of snapping.
  const parallax = $('[data-mouse-parallax]');
  if (parallax && !reduce && finePointer && !lite) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      parallax.style.setProperty('--px', `${cx.toFixed(2)}px`);
      parallax.style.setProperty('--py', `${cy.toFixed(2)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('mousemove', (e) => {
      tx = (e.clientX - innerWidth / 2) * 0.05;
      ty = (e.clientY - innerHeight / 2) * 0.05;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  // --- Lazy autoplay for muted loops (GIF replacements, hero trailers); paused off-screen ---
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        if (!reduce) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    }), { rootMargin: '200px 0px' });
    $$('video[data-autoplay]').forEach((v) => vio.observe(v));
  }

  // --- Card previews: on hover with a mouse; on touch screens the card crossing the middle of the
  // viewport previews instead (one at a time), so the effect is not hover-only. Off in lite mode.
  const startPreview = (card) => {
    const v = $('video[data-preview]', card);
    if (!v) return;
    if (!v.src) v.src = v.dataset.preview;
    v.play().then(() => card.classList.add('is-previewing')).catch(() => {});
  };
  const stopPreview = (card) => { const v = $('video[data-preview]', card); card.classList.remove('is-previewing'); if (v && !v.paused) v.pause(); };
  if (!reduce && !lite) {
    if (finePointer) {
      $$('.project__card, .reel-card').forEach((card) => {
        card.addEventListener('pointerenter', () => { const v = $('video[data-preview]', card); if (v) v.currentTime = 0; startPreview(card); });
        card.addEventListener('pointerleave', () => stopPreview(card));
      });
    } else if ('IntersectionObserver' in window) {
      const band = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? startPreview(e.target) : stopPreview(e.target))), { rootMargin: '-40% 0px -40% 0px' });
      $$('.project__card').forEach((c) => band.observe(c));
    }
  }

  // --- Touch: the section separators play their line-to-arrow morph as they cross mid-screen ---
  if (!finePointer && !reduce && 'IntersectionObserver' in window) {
    const arm = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-armed', e.isIntersecting)), { rootMargin: '-25% 0px -25% 0px' });
    $$('a.sep').forEach((s) => arm.observe(s));
  }

  // --- Sound toggle for trailers ---
  $$('[data-sound]').forEach((btn) => {
    const v = btn.parentElement.querySelector('video');
    btn.addEventListener('click', () => {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.muted = !v.muted;
      if (!v.muted) v.play().catch(() => {});
      btn.setAttribute('aria-pressed', String(!v.muted));
      $('.sound__label', btn).textContent = v.muted ? 'SOUND OFF' : 'SOUND ON';
    });
  });

  // --- Dialog helpers ---
  const openDialog = (d) => { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); document.body.style.overflow = 'hidden'; };
  // Dialogs animate out before closing (Escape included); instant when motion is reduced.
  const closeDialog = (d) => {
    if (!d.open || d.classList.contains('is-closing')) return;
    const done = () => { d.classList.remove('is-closing'); if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); };
    if (reduce) return done();
    d.classList.add('is-closing');
    setTimeout(done, 220);
  };
  $$('dialog').forEach((d) => d.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(d); }));
  $$('dialog').forEach((d) => {
    d.addEventListener('close', () => { document.body.style.overflow = ''; $$('video', d).forEach((v) => v.pause()); });
    d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d); });
  });

  // --- Hero reel: opens the 60s summary with sound ---
  const reel = $('dialog.reel');
  if (reel) {
    const v = $('video', reel);
    $$('[data-reel]').forEach((b) => b.addEventListener('click', () => {
      if (!v.src) v.src = v.dataset.src;
      openDialog(reel);
      v.currentTime = 0;
      v.play().catch(() => {});
    }));
    $('[data-reel-close]', reel).addEventListener('click', () => closeDialog(reel));
  }

  // --- Lightbox for case-study media ---
  const lb = $('dialog.lightbox');
  if (lb) {
    const zooms = $$('[data-zoom]');
    const stage = $('.lightbox__stage', lb);
    const caption = $('.lightbox__caption', lb);
    let idx = 0;
    const show = (i) => {
      idx = (i + zooms.length) % zooms.length;
      const src = zooms[idx];
      const im = $('img', src);
      const vid = $('video', src);
      stage.textContent = '';
      stage.classList.remove('is-swapping'); void stage.offsetWidth; stage.classList.add('is-swapping');
      if (vid) {
        const v = document.createElement('video');
        v.src = vid.dataset.src || vid.currentSrc || vid.src;
        Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, controls: true });
        stage.append(v);
      } else if (im) {
        const big = document.createElement('img');
        big.src = im.getAttribute('src');
        big.alt = im.alt;
        stage.append(big);
      }
      caption.textContent = src.getAttribute('aria-label').replace(/^Enlarge: /, '');
    };
    zooms.forEach((z, i) => z.addEventListener('click', () => { show(i); openDialog(lb); }));
    $('.lightbox__close', lb).addEventListener('click', () => closeDialog(lb));
    $('.lightbox__nav--prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lightbox__nav--next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    if (zooms.length < 2) $$('.lightbox__nav', lb).forEach((b) => { b.hidden = true; });
  }

  // --- YouTube facade: loads the player only on request ---
  $$('[data-yt]').forEach((btn) => btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
    f.title = btn.getAttribute('aria-label').replace(/^Play video: /, '');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  }));

  // --- Slideshow ---
  $$('[data-slideshow]').forEach((root) => {
    const track = $('.slideshow__track', root);
    const dots = $$('.slideshow__dots button', root);
    const n = dots.length;
    let i = 0, timer = 0;
    const go = (k) => {
      i = (k + n) % n;
      track.style.transform = `translateX(calc(${-100 * i}% - ${10 * i}px))`;
      dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
    };
    // Original autoplay advances every ~1s; slowed to 2s so the level shots can be read.
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 2000); };
    $('.slideshow__btn--prev', root).addEventListener('click', () => { go(i - 1); auto(); });
    $('.slideshow__btn--next', root).addEventListener('click', () => { go(i + 1); auto(); });
    dots.forEach((d, j) => d.addEventListener('click', () => { go(j); auto(); }));
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
    // Lazy images off-screen horizontally never load, so load all slides once the slideshow is near.
    // Load every slide once the slideshow is near (horizontally off-screen lazy images never load);
    // autoplay only while it is on screen, like the original (playOffscreen: false).
    let loaded = false;
    new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { if (!loaded) { $$('img', root).forEach((im) => { im.loading = 'eager'; }); loaded = true; } auto(); }
      else clearInterval(timer);
    }, { rootMargin: '200px 0px' }).observe(root);
    root.addEventListener('pointerenter', () => clearInterval(timer));
    root.addEventListener('pointerleave', auto);
    root.addEventListener('focusin', () => clearInterval(timer));
  });

  // --- Ticker: 30px/s, measured from the original Framer Ticker (4860px / 162s) ---
  fontsReady.then(() => $$('.ticker__track').forEach((t) => t.style.setProperty('--dur', `${(t.scrollWidth / 2 / 30).toFixed(1)}s`)));

  // --- Case-study chapter scroll-spy ---
  const tocLinks = $$('.cs-toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        tocLinks.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    }), { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => { const h = document.getElementById(id); if (h) spy.observe(h); });
  }

  // --- Full-screen menu (phones/tablets) ---
  const menu = $('#site-menu');
  const menuBtns = $$('.menu-btn');
  const setMenu = (open) => {
    if (!open && !menu.hidden && !reduce) {
      menu.classList.add('is-closing');
      setTimeout(() => { menu.classList.remove('is-closing', 'is-open'); menu.hidden = true; }, 220);
    } else menu.hidden = !open;
    if (open) menu.classList.add('is-open');
    document.body.classList.toggle('menu-open', open);
    menuBtns.forEach((b) => { b.setAttribute('aria-expanded', String(open)); $('.menu-btn__label', b).textContent = open ? 'CLOSE' : 'MENU'; });
    if (open) $('a', menu)?.focus();
  };
  menuBtns.forEach((b) => b.addEventListener('click', () => setMenu(menu.hidden)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); menuBtns.find((b) => b.offsetParent)?.focus(); } });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // --- Cursor label on interactive media (fine pointers only) ---
  if (finePointer && !reduce && !lite) {
    document.documentElement.classList.add('has-cursor');
    const cursor = $('.cursor');
    const label = $('.cursor__label', cursor);
    let x = -100, y = -100, cx = -100, cy = -100, active = null, raf = 0;
    // Runs only while the label is catching up with the pointer, then idles.
    const loop = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      const t = e.target.closest?.('[data-cursor]');
      if (t !== active) {
        active = t;
        cursor.classList.toggle('is-active', !!t);
        if (t) label.textContent = t.dataset.cursor;
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cursor.classList.remove('is-active'); active = null; });
  }
})();
