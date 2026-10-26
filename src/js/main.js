// Motion + interaction runtime. No dependencies; every feature degrades to static content.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine) and (hover: hover)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  // --- Load "appear" (measured from the original: per-letter rise, nav blur-in, reel spring-scale) ---
  const appear = () => {
    $$('.home-nav, .hero [data-split], [data-split-words], [data-appear-scale], .page-intro [data-split]').forEach((el) => el.classList.add('is-in'));
    const nav = $('.home-nav');
    if (nav) setTimeout(() => nav.classList.add('is-settled'), 1400);
  };
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(appear));

  // --- Scroll reveal ---
  const revealTargets = $$('[data-reveal], [data-split]').filter((el) => !el.closest('.hero, .page-intro') || el.matches('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  // --- Scroll-driven bits: about parallax shift, reading progress, sub-nav hide/show ---
  const shifters = $$('[data-shift]');
  const progress = $('.progress');
  const subNav = $('[data-hide-on-scroll]');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 1;
    if (!reduce) shifters.forEach((el) => el.style.setProperty('--shift', `${(+el.dataset.shift * (1 - p)).toFixed(2)}px`));
    if (progress) progress.style.setProperty('--p', p.toFixed(4));
    if (subNav && !document.body.classList.contains('menu-open')) {
      subNav.classList.toggle('is-scrolled', y > 10);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > 240) subNav.classList.add('is-hidden');
      else if (goingUp || y < 120) subNav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // --- Mouse parallax on the hero reel (original: ~±30px x / ±24px y, eased) ---
  const parallax = $('[data-mouse-parallax]');
  if (parallax && !reduce && finePointer) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      parallax.style.setProperty('--px', `${cx.toFixed(2)}px`);
      parallax.style.setProperty('--py', `${cy.toFixed(2)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 60;
      ty = (e.clientY / innerHeight - 0.5) * 48;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  // --- Lazy autoplay for muted loops (GIF replacements, hero trailers) ---
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

  // --- Hover previews on project cards and the hero reel card ---
  if (finePointer && !reduce) {
    $$('.project__card, .reel-card').forEach((card) => {
      const v = $('video[data-preview]', card);
      if (!v) return;
      card.addEventListener('pointerenter', () => {
        if (!v.src) v.src = v.dataset.preview;
        v.currentTime = 0;
        v.play().then(() => card.classList.add('is-previewing')).catch(() => {});
      });
      card.addEventListener('pointerleave', () => { card.classList.remove('is-previewing'); v.pause(); });
    });
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
  const closeDialog = (d) => { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); };
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
      track.style.transform = `translateX(${-100 * i}%)`;
      dots.forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
    };
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 4500); };
    $('.slideshow__btn--prev', root).addEventListener('click', () => { go(i - 1); auto(); });
    $('.slideshow__btn--next', root).addEventListener('click', () => { go(i + 1); auto(); });
    dots.forEach((d, j) => d.addEventListener('click', () => { go(j); auto(); }));
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
    // Lazy images off-screen horizontally never load, so load all slides once the slideshow is near.
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { $$('img', root).forEach((im) => { im.loading = 'eager'; }); o.disconnect(); auto(); } }, { rootMargin: '400px 0px' }).observe(root);
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
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuBtns.forEach((b) => { b.setAttribute('aria-expanded', String(open)); $('.menu-btn__label', b).textContent = open ? 'CLOSE' : 'MENU'; });
    if (open) $('a', menu)?.focus();
  };
  menuBtns.forEach((b) => b.addEventListener('click', () => setMenu(menu.hidden)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); menuBtns.find((b) => b.offsetParent)?.focus(); } });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // --- Cursor label on interactive media (fine pointers only) ---
  if (finePointer && !reduce) {
    document.documentElement.classList.add('has-cursor');
    const cursor = $('.cursor');
    const label = $('.cursor__label', cursor);
    let x = -100, y = -100, cx = -100, cy = -100, active = null;
    const loop = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
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
