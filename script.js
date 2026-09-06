(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = !new URLSearchParams(location.search).has('motion') &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileQ = window.matchMedia('(max-width: 900px)');
  var finePointer = window.matchMedia('(pointer: fine)').matches && !mobileQ.matches;
  var hasGsap = typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined';
  var fullMotion = hasGsap && !reduceMotion && !mobileQ.matches;

  root.classList.remove('no-js');
  root.classList.add('js');

  function qs(sel) { return doc.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); }
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ---------- scene indicator ---------- */

  var acts = qsa('.act');
  var sceneCur = qs('#scene-cur');
  var sceneTitle = qs('#scene-title');
  var sceneLinks = qsa('[data-scene-link]');

  function setScene(idx) {
    var a = acts[idx];
    if (!a) return;
    sceneCur.textContent = pad(idx);
    sceneTitle.textContent = a.dataset.scene;
    sceneLinks.forEach(function (l, j) {
      l.classList.toggle('active', j === idx);
    });
  }

  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setScene(acts.indexOf(en.target));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    acts.forEach(function (a) { secIO.observe(a); });
  }

  /* ---------- timecode — the reel's runtime ---------- */

  var timecodeEl = qs('#timecode');
  var TOTAL_FRAMES = 12 * 60 * 24;
  var tcQueued = false;

  function renderTimecode(progress) {
    var f = Math.round(Math.max(0, Math.min(1, progress)) * TOTAL_FRAMES);
    var ff = f % 24;
    var s = Math.floor(f / 24) % 60;
    var m = Math.floor(f / (24 * 60)) % 60;
    var h = Math.floor(f / (24 * 3600));
    timecodeEl.textContent = pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(ff);
  }

  function queueTimecode(progress) {
    if (tcQueued) return;
    tcQueued = true;
    requestAnimationFrame(function () {
      tcQueued = false;
      renderTimecode(progress);
    });
  }

  function pageProgress() {
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / max));
  }

  /* ---------- slate overlay ---------- */

  var slateToggle = qs('#slate-toggle');
  var slateNav = qs('#slate');

  function setSlate(open) {
    root.classList.toggle('slate-open', open);
    slateToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    slateToggle.querySelector('.slate-toggle-label').textContent = open ? 'Close' : 'Slate';
    slateNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  slateToggle.addEventListener('click', function () {
    setSlate(!root.classList.contains('slate-open'));
  });
  sceneLinks.forEach(function (a) {
    a.addEventListener('click', function () { setSlate(false); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('slate-open')) {
      setSlate(false);
    }
  });

  /* ---------- cursor + magnetic (fine pointers, no reduced motion) ---------- */

  if (finePointer && !reduceMotion) {
    var cursor = qs('#cursor');
    var cxTo = null, cyTo = null;
    if (hasGsap) {
      cxTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
      cyTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    }
    doc.addEventListener('pointermove', function (e) {
      root.classList.add('cursor-on');
      if (cxTo) { cxTo(e.clientX); cyTo(e.clientY); }
      else {
        cursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      }
      var hot = e.target.closest && e.target.closest('a, button, .mag');
      cursor.classList.toggle('is-hot', !!hot);
    });

    var magnets = qsa('.btn, .brand, .mast-resume, .slate-toggle, .credits-link');
    doc.addEventListener('pointermove', function (e) {
      for (var i = 0; i < magnets.length; i++) {
        var m = magnets[i];
        var rect = m.getBoundingClientRect();
        var mx = rect.left + rect.width / 2;
        var my = rect.top + rect.height / 2;
        var dx = e.clientX - mx;
        var dy = e.clientY - my;
        var d = Math.hypot(dx, dy);
        var r = Math.max(rect.width, rect.height) / 2 + 70;
        if (d < r) {
          var f = 1 - d / r;
          m.style.transform = 'translate(' + (dx * 0.14 * f).toFixed(1) + 'px,' + (dy * 0.14 * f).toFixed(1) + 'px)';
        } else if (m.style.transform) {
          m.style.transform = '';
        }
      }
    });
  }

  /* ---------- fallback path (no GSAP / reduced motion / mobile) ---------- */

  function fallbackReveals() {
    qs('.progress').style.display = 'none';
    var els = qsa('[data-rv], [data-rv-line]');
    els.forEach(function (el) { el.classList.add('rv-hide'); });
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.remove('rv-hide'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('rv-hide');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  if (!fullMotion) {
    fallbackReveals();
    window.addEventListener('scroll', function () {
      queueTimecode(pageProgress());
    }, { passive: true });
    queueTimecode(pageProgress());
    return;
  }

  /* ---------- GSAP scenes ---------- */

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* letterbox — the frame holds the cold open, then retracts */
  gsap.set(['#bar-top', '#bar-bottom'], { height: '12vh' });
  gsap.to(['#bar-top', '#bar-bottom'], {
    height: 0, ease: 'none',
    scrollTrigger: { trigger: '#coldopen', start: 'top top', end: 'bottom 35%', scrub: true }
  });

  /* cold open entrance — the title card */
  var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('[data-open="flicker"]', { opacity: 0, duration: 0.5 }, 0.1)
    .from('[data-open="kicker"]', { y: 16, opacity: 0, duration: 0.9 }, 0.2)
    .from('[data-open="line"]', { yPercent: 112, duration: 1.3, stagger: 0.12 }, 0.3)
    .from('[data-open="meta"]', { y: 20, opacity: 0, duration: 0.9, stagger: 0.1 }, 1.0)
    .from('[data-open="cue"]', { opacity: 0, duration: 0.8 }, 1.5);

  /* title hold, then the iris cut */
  var cutTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#coldopen', start: 'top top',
      end: '+=70%', scrub: 1, pin: true
    }
  });
  cutTl
    .to('#coldopen-inner', { scale: 0.97, duration: 1 }, 0)
    .set('#iris', { visibility: 'visible' }, 0.35)
    .fromTo('#iris',
      { clipPath: 'circle(75% at 50% 50%)' },
      { clipPath: 'circle(6% at 50% 50%)', duration: 1 }, 0.4)
    .to('#iris', { clipPath: 'circle(75% at 50% 50%)', duration: 1 }, 1.4)
    .set('#iris', { visibility: 'hidden' });

  /* cold open scroll exit beneath the pin */
  gsap.to('#coldopen-inner', {
    y: -60, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '#coldopen', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* masked line reveals */
  qsa('[data-rv-line]').forEach(function (el) {
    gsap.from(el, {
      yPercent: 112, duration: 1.15, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    });
  });

  /* block reveals */
  qsa('[data-rv]').forEach(function (el) {
    gsap.from(el, {
      y: 30, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
    });
  });

  /* LUMIS — pinned feature presentation */
  var lumisTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#lumis-pin', start: 'top top+=72',
      end: '+=130%', scrub: 1, pin: '#act2 .wrap'
    }
  });
  lumisTl
    .from('[data-lumis="title"]', { yPercent: 60, opacity: 0, duration: 1 }, 0)
    .from('[data-lumis="desc"]', { y: 26, opacity: 0, duration: 1 }, 0.25)
    .from('[data-lumis="take"]', { x: -34, opacity: 0, duration: 0.9, stagger: 0.5 }, 0.5)
    .from('[data-lumis="stack"]', { opacity: 0, duration: 0.8 }, 2.2)
    .from('[data-lumis="actions"]', { y: 22, opacity: 0, duration: 0.8 }, 2.5)
    .fromTo('#screen-clip',
      { clipPath: 'inset(8% 8% 8% 8%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 2 }, 0.3)
    .from('[data-lumis="screen"] figcaption, [data-lumis="screen"] .stamp', { opacity: 0, duration: 0.8 }, 2.6);

  /* beam draws as the presentation runs */
  gsap.set('#beam-line', { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.to('#beam-line', {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '#lumis-pin', start: 'top top+=72', end: '+=130%', scrub: 1 }
  });
  gsap.fromTo('#beam-dot', { attr: { cx: 230, cy: 20 }, opacity: 0 },
    {
      attr: { cx: 372, cy: 92 }, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#lumis-pin', start: 'top top+=72', end: '+=130%', scrub: 1 }
    });

  /* velocity tilt on the screen */
  var scrTilt = gsap.quickTo('.screen', 'rotationY', { duration: 0.6, ease: 'power3' });
  var scrShift = gsap.quickTo('.screen', 'x', { duration: 0.6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '#act2', start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var v = Math.max(-2600, Math.min(2600, self.getVelocity()));
      scrTilt(v / 2600 * 7);
      scrShift(v / 2600 * -18);
    }
  });

  /* SYSTEMS — the blueprint draws itself */
  var draws = qsa('#print-svg .draw');
  draws.forEach(function (p) {
    if (!p.classList.contains('draw--dash')) {
      gsap.set(p, { strokeDasharray: 1, strokeDashoffset: 1 });
    }
  });
  var sysTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#systems-pin', start: 'top top+=84',
      end: '+=110%', scrub: 1, pin: '#act3 .wrap'
    }
  });
  sysTl
    .to(draws, { strokeDashoffset: 0, duration: 1.4, stagger: 0.3 }, 0)
    .from('[data-systems="row"]', { x: 26, opacity: 0, duration: 0.7, stagger: 0.25 }, 0.4);
  gsap.set('#print-flow', { strokeDasharray: '0.14 0.05', strokeDashoffset: 0 });
  gsap.to('#print-flow', {
    strokeDashoffset: -1, ease: 'none',
    scrollTrigger: { trigger: '#systems-pin', start: 'top top+=84', end: '+=110%', scrub: 1 }
  });

  /* runtime rule + timecode follow the reel */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      queueTimecode(self.progress);
      gsap.set('#progress-bar', { scaleX: self.progress });
    }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();