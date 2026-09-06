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

  /* ---------- specimen indicator ---------- */

  var stages = qsa('.stage');
  var specCur = qs('#spec-cur');
  var specTitle = qs('#spec-title');
  var specLinks = qsa('[data-spec-link]');

  function setStage(idx) {
    var s = stages[idx];
    if (!s) return;
    specCur.textContent = pad(idx + 1);
    specTitle.textContent = s.dataset.stage;
    specLinks.forEach(function (l, j) {
      l.classList.toggle('active', j === idx);
    });
  }

  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setStage(stages.indexOf(en.target));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    stages.forEach(function (s) { secIO.observe(s); });
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
  specLinks.forEach(function (a) {
    a.addEventListener('click', function () { setIndex(false); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('index-open')) {
      setIndex(false);
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

    var magnets = qsa('.btn, .brand, .mast-resume, .index-toggle, .contact-link, .rail-links a');
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

  /* ---------- chain tracing (schematic nodes) ---------- */

  var printSvg = qs('#print-svg');
  if (printSvg) {
    var nodes = qsa('#print-svg .node');
    function trace(chain, on) {
      if (on) {
        printSvg.classList.add('tracing');
        qsa('#print-svg [data-chain="' + chain + '"]').forEach(function (el) {
          el.classList.add('hot');
        });
      } else {
        printSvg.classList.remove('tracing');
        qsa('#print-svg .hot').forEach(function (el) {
          el.classList.remove('hot');
        });
      }
    }
    nodes.forEach(function (n) {
      var chain = n.getAttribute('data-chain');
      n.addEventListener('pointerenter', function () { trace(chain, true); });
      n.addEventListener('pointerleave', function () { trace(chain, false); });
      n.addEventListener('focus', function () { trace(chain, true); });
      n.addEventListener('blur', function () { trace(chain, false); });
    });
  }

  /* ---------- fallback path (no GSAP / reduced motion / mobile) ---------- */

  function fallbackReveals() {
    qs('.progress').style.display = 'none';
    var cap = qs('[data-lumis="cap"]');
    if (cap) cap.textContent = 'Fig. 01 — Entry → Insight';
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

  /* hero entrance */
  var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('[data-hero="eyebrow"]', { y: 18, opacity: 0, duration: 0.9 }, 0.15)
    .from('[data-hero="line"]', { yPercent: 112, duration: 1.25, stagger: 0.12 }, 0.25)
    .from('[data-hero="claim"]', { y: 24, opacity: 0, duration: 1 }, 0.85)
    .from('[data-hero="cta"]', { y: 22, opacity: 0, duration: 0.9 }, 1.0)
    .from('[data-hero="rail"]', { x: 34, opacity: 0, duration: 1.1 }, 0.7)
    .from('[data-hero="cue"]', { opacity: 0, duration: 0.8 }, 1.4);

  /* hero scroll exit */
  gsap.to('#hero-grid', {
    y: -70, opacity: 0.25, ease: 'none',
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

  /* LUMIS — pinned launch stage */
  var lumisTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#lumis-pin', start: 'top top+=72',
      end: '+=120%', scrub: 1, pin: true
    }
  });
  lumisTl
    .from('[data-lumis="param"]', { x: -30, opacity: 0, duration: 0.9, stagger: 0.45 }, 0)
    .from('[data-lumis="stack"]', { opacity: 0, duration: 0.8 }, 1.6)
    .fromTo('#screen-clip',
      { clipPath: 'inset(8% 8% 8% 8%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8 }, 0.2)
    .from('[data-lumis="screen"] figcaption, [data-lumis="screen"] .stamp', { opacity: 0, duration: 0.7 }, 1.8);

  /* beam — plays on arrival, replays on click */
  gsap.set('#beam-line', { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set('#beam-dot', { opacity: 0 });
  var beamTl = gsap.timeline({ paused: true });
  beamTl
    .to('#beam-line', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
    .fromTo('#beam-dot', { attr: { cx: 230, cy: 20 }, opacity: 0 },
      { attr: { cx: 372, cy: 92 }, opacity: 1, duration: 1.1, ease: 'power2.inOut' }, 0);
  ScrollTrigger.create({
    trigger: '#lumis-screen', start: 'top 75%',
    onEnter: function () { beamTl.restart(); }
  });
  qs('#lumis-screen').addEventListener('click', function () { beamTl.restart(); });
  qs('#lumis-screen').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      beamTl.restart();
    }
  });

  /* velocity tilt on the screen */
  var scrTilt = gsap.quickTo('.screen', 'rotationY', { duration: 0.6, ease: 'power3' });
  var scrShift = gsap.quickTo('.screen', 'x', { duration: 0.6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '#lumis', start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var v = Math.max(-2600, Math.min(2600, self.getVelocity()));
      scrTilt(v / 2600 * 7);
      scrShift(v / 2600 * -18);
    }
  });

  /* SYSTEMS — the blueprint draws itself (scrubbed, unpinned) */
  var draws = qsa('#print-svg .draw');
  draws.forEach(function (p) {
    if (!p.classList.contains('draw--dash')) {
      gsap.set(p, { strokeDasharray: 1, strokeDashoffset: 1 });
    }
  });
  gsap.to(draws, {
    strokeDashoffset: 0, ease: 'none', stagger: 0.2,
    scrollTrigger: { trigger: '.blueprint', start: 'top 82%', end: 'top 30%', scrub: 1 }
  });
  gsap.set('#print-flow', { strokeDasharray: '0.14 0.05', strokeDashoffset: 0 });
  gsap.to('#print-flow', {
    strokeDashoffset: -1, ease: 'none',
    scrollTrigger: { trigger: '.blueprint', start: 'top 82%', end: 'bottom 40%', scrub: 1 }
  });
  qsa('[data-systems="row"]').forEach(function (el, i) {
    gsap.from(el, {
      x: 26, opacity: 0, duration: 0.7, ease: 'power3.out', delay: (i % 7) * 0.04,
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' }
    });
  });

  /* progress rule */
  gsap.to('#progress-bar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();