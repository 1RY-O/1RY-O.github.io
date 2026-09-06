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

  /* ---------- masthead passage indicator ---------- */

  var passages = qsa('.passage');
  var curEl = qs('#passage-cur');
  var titleEl = qs('#passage-title');
  var indexLinks = qsa('[data-passage-link]');

  function setPassage(idx) {
    var p = passages[idx];
    if (!p) return;
    curEl.textContent = String(idx + 1).padStart(2, '0');
    titleEl.textContent = p.dataset.passage;
    indexLinks.forEach(function (a, j) {
      a.classList.toggle('active', j === idx);
    });
  }

  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setPassage(passages.indexOf(en.target));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    passages.forEach(function (p) { secIO.observe(p); });
  }

  /* ---------- index overlay ---------- */

  var indexToggle = qs('#index-toggle');
  var indexNav = qs('#index');

  function setIndex(open) {
    root.classList.toggle('index-open', open);
    indexToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    indexToggle.querySelector('.index-toggle-label').textContent = open ? 'Close' : 'Index';
    indexNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  indexToggle.addEventListener('click', function () {
    setIndex(!root.classList.contains('index-open'));
  });
  indexLinks.forEach(function (a) {
    a.addEventListener('click', function () { setIndex(false); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('index-open')) {
      setIndex(false);
    }
  });

  /* ---------- cursor + magnetic (fine pointers, full motion) ---------- */

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

    var magnets = qsa('.btn, .brand, .mast-resume, .index-toggle, .contact-link');
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

  /* ---------- fallback reveals (no GSAP / reduced motion / mobile) ---------- */

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
    return;
  }

  /* ---------- GSAP scenes ---------- */

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* hero entrance — the first five seconds */
  var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('[data-hero="eyebrow"]', { y: 18, opacity: 0, duration: 0.9 }, 0.15)
    .from('[data-hero="line"]', { yPercent: 112, duration: 1.25, stagger: 0.12 }, 0.25)
    .from('[data-hero="fields"]', { y: 22, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.9)
    .from('.hero-aperture', { scale: 0.88, opacity: 0, duration: 1.6, ease: 'power3.out' }, 0.5)
    .from('[data-hero="cue"]', { opacity: 0, duration: 0.8 }, 1.4);

  /* hero scroll exit — the page pulls the hero apart gently */
  gsap.to('#hero-inner', {
    y: -70, scale: 0.965, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-aperture', {
    yPercent: 26, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
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

  /* LUMIS — pinned flagship passage */
  var lumisTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#lumis-pin', start: 'top top+=80',
      end: '+=130%', scrub: 1, pin: '#lumis .wrap'
    }
  });
  lumisTl
    .from('[data-lumis="title"]', { yPercent: 60, opacity: 0, duration: 1 }, 0)
    .from('[data-lumis="desc"]', { y: 26, opacity: 0, duration: 1 }, 0.25)
    .from('[data-lumis="stanza"]', { x: -34, opacity: 0, duration: 0.9, stagger: 0.5 }, 0.5)
    .from('[data-lumis="stack"]', { opacity: 0, duration: 0.8 }, 2.2)
    .from('[data-lumis="actions"]', { y: 22, opacity: 0, duration: 0.8 }, 2.5)
    .fromTo('#device-clip',
      { clipPath: 'inset(8% 8% 8% 8%)', scale: 0.96 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 2 }, 0.3)
    .from('[data-lumis="device"] figcaption, [data-lumis="device"] .stamp', { opacity: 0, duration: 0.8 }, 2.6);

  /* beam draws as the passage travels */
  gsap.set('#beam-line', { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.to('#beam-line', {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '#lumis-pin', start: 'top top+=80', end: '+=130%', scrub: 1 }
  });
  gsap.fromTo('#beam-dot', { attr: { cx: 230, cy: 20 }, opacity: 0 },
    {
      attr: { cx: 372, cy: 92 }, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#lumis-pin', start: 'top top+=80', end: '+=130%', scrub: 1 }
    });

  /* velocity tilt on the device — the page has momentum */
  var devTilt = gsap.quickTo('.device', 'rotationY', { duration: 0.6, ease: 'power3' });
  var devShift = gsap.quickTo('.device', 'x', { duration: 0.6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '#lumis', start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var v = Math.max(-2600, Math.min(2600, self.getVelocity()));
      devTilt(v / 2600 * 7);
      devShift(v / 2600 * -18);
    }
  });

  /* SYSTEMS — the drawing draws itself */
  var draws = qsa('#schem-svg .draw');
  draws.forEach(function (p) {
    if (!p.classList.contains('draw--dash')) {
      gsap.set(p, { strokeDasharray: 1, strokeDashoffset: 1 });
    }
  });
  var sysTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#systems-pin', start: 'top top+=90',
      end: '+=110%', scrub: 1, pin: '#systems .wrap'
    }
  });
  sysTl
    .to(draws, { strokeDashoffset: 0, duration: 1.4, stagger: 0.3 }, 0)
    .from('[data-systems="row"]', { x: 26, opacity: 0, duration: 0.7, stagger: 0.25 }, 0.4);
  gsap.set('#wire-flow', { strokeDasharray: '0.14 0.05', strokeDashoffset: 0 });
  gsap.to('#wire-flow', {
    strokeDashoffset: -1, ease: 'none',
    scrollTrigger: { trigger: '#systems-pin', start: 'top top+=90', end: '+=110%', scrub: 1 }
  });

  /* progress rule */
  gsap.to('#progress-bar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();