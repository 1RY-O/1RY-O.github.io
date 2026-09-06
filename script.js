(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = !new URLSearchParams(location.search).has('motion') &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 900px)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var canFull = !reduceMotion && !mobile && finePointer;
  var hasGsap = typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined';
  var fullMotion = hasGsap && canFull;

  root.classList.remove('no-js');
  root.classList.add('js');
  if (fullMotion) root.classList.add('full-motion');

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- halo + type warp ---------- */

  var halo = document.createElement('div');
  halo.className = 'halo';
  document.body.appendChild(halo);

  var nameplate = qs('#nameplate');
  var axSoft = qs('#ax-soft');
  var axWonk = qs('#ax-wonk');
  var axOpsz = qs('#ax-opsz');
  var sky = qs('#sky');
  var skyVisible = true;

  var aim = { x: innerWidth / 2, y: innerHeight * 0.4 };
  var cur = { x: aim.x, y: aim.y };
  var axes = { soft: 62, wonk: 1 };
  var axisTarget = { soft: 62, wonk: 1 };
  var lastVis = null;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      skyVisible = en[0].isIntersecting;
      halo.classList.toggle('on', skyVisible);
    }).observe(sky);
  }

  document.addEventListener('pointermove', function (e) {
    if (!canFull) return;
    aim.x = e.clientX;
    aim.y = e.clientY;
    var px = e.clientX / innerWidth;
    var py = e.clientY / innerHeight;
    halo.classList.add('on');
    axisTarget.soft = clamp(20 + (1 - py) * 70, 20, 92);
    axisTarget.wonk = px < 0.5 ? 1 : 0;
  });

  function frame() {
    cur.x += (aim.x - cur.x) * 0.1;
    cur.y += (aim.y - cur.y) * 0.1;
    axes.soft += (axisTarget.soft - axes.soft) * 0.08;
    axes.wonk += (axisTarget.wonk - axes.wonk) * 0.08;
    halo.style.transform = 'translate3d(' + (cur.x - 235) + 'px,' + (cur.y - 235) + 'px,0)';
    if (nameplate) {
      nameplate.style.fontVariationSettings =
        '"opsz" 144, "wght" 900, "SOFT" ' + axes.soft.toFixed(1) + ', "WONK" ' +
        (axes.wonk > 0.5 ? 1 : 0);
    }
    var vis = Math.round(axes.soft) + ',' + (axes.wonk > 0.5 ? 1 : 0);
    if (vis !== lastVis) {
      lastVis = vis;
      if (axSoft) axSoft.textContent = Math.round(axes.soft);
      if (axWonk) axWonk.textContent = axes.wonk > 0.5 ? 1 : 0;
      if (axOpsz) axOpsz.textContent = 144;
    }
    requestAnimationFrame(frame);
  }
  if (canFull) requestAnimationFrame(frame);

  /* ---------- rotor ---------- */

  var words = ['BUILDER', 'MAKER', 'ENGINEER', 'MAVERICK'];
  var rotor = qs('#rotor');
  if (rotor) {
    var wi = 0;
    setInterval(function () {
      wi = (wi + 1) % words.length;
      rotor.style.opacity = 0;
      rotor.style.transform = 'translateY(4px)';
      setTimeout(function () {
        rotor.textContent = words[wi];
        rotor.style.opacity = 1;
        rotor.style.transform = 'translateY(0)';
      }, 180);
    }, 2800);
  }

  /* ---------- index overlay ---------- */

  var indexKey = qs('#index-key');
  var indexNav = qs('#index');

  function setIndex(open) {
    document.body.classList.toggle('index-open', open);
    indexKey.setAttribute('aria-expanded', open ? 'true' : 'false');
    indexNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (indexKey) {
    indexKey.addEventListener('click', function () {
      setIndex(!document.body.classList.contains('index-open'));
    });
  }

  qsa('#index a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = qs(a.getAttribute('href'));
      setIndex(false);
      if (t) requestAnimationFrame(function () {
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('index-open')) {
      setIndex(false);
    }
  });

  /* ---------- drop cue key ---------- */

  qs('#drop-cue').setAttribute('tabindex', '0');
  qs('#drop-cue').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      qs('#prelim').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- current chip ---------- */

  var current = qs('#current');
  var progressFill = qs('#progress');
  var currentCode = qs('#current-code');
  var codes = ['01\u00B7PRELIM', '02\u00B7LUMIS', '03\u00B7INVENTORY', '04\u00B7LOG', '05\u00B7CONNECT'];
  var plates = qsa('.plate');

  if ('IntersectionObserver' in window) {
    var plateIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var i = plates.indexOf(en.target);
          if (i >= 0) currentCode.textContent = codes[i];
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    plates.forEach(function (p) { plateIO.observe(p); });
  }

  function onScroll2() {
    var st = document.documentElement.scrollTop;
    var tableTop = (qs('#table') ? qs('#table').offsetTop : 0) - innerHeight * 0.8;
    if (st > tableTop) {
      current.classList.add('on');
      var span = document.documentElement.scrollHeight - innerHeight;
      if (span > 0) progressFill.style.width = clamp(st / span * 100, 0, 100) + '%';
    } else {
      current.classList.remove('on');
    }
  }
  window.addEventListener('scroll', onScroll2, { passive: true });

  /* ---------- typewriter + trace ---------- */

  var tracePath = qs('#trace-path');
  var liveprint = qs('#liveprint');
  var lpTicked = false;

  function typeRow(row, done) {
    var raw = row.__plain;
    var i = 0;
    (function tick() {
      i += 1;
      row.textContent = raw.slice(0, i);
      row.classList.add('typed');
      if (i < raw.length) {
        row.classList.add('cursor');
        setTimeout(tick, 11);
      } else {
        row.classList.remove('cursor');
        done();
      }
    })();
  }

  function playConsole() {
    if (lpTicked) return;
    lpTicked = true;
    var rows = qsa('#liveprint .lp-row');
    rows.forEach(function (r) { r.__plain = r.textContent.replace(/\s+/g, ' ').trim(); r.textContent = ''; });
    var d = 300;
    rows.forEach(function (r) {
      setTimeout(function () { typeRow(r, function () {}); }, d);
      d += 140 + r.__plain.length * 11 + 260;
    });
  }

  if (fullMotion) {
    if (tracePath) {
      gsap.to(tracePath, {
        strokeDashoffset: 0, ease: 'none', duration: 1.3,
        scrollTrigger: { trigger: '#lumis-console', start: 'top 70%' }
      });
      gsap.to('#trace-label', {
        opacity: 0, y: 6, yoyo: true, repeat: -1, duration: 1.6, ease: 'sine.inOut'
      });
    }
    if ('IntersectionObserver' in window) {
      var lprIO = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          playConsole();
          lprIO.disconnect();
        }
      }, { threshold: 0.35 });
      lprIO.observe(qs('#lumis-console'));
    }
  } else {
    if (tracePath) {
      tracePath.style.strokeDasharray = 'none';
      tracePath.style.strokeDashoffset = '0';
    }
    qsa('#liveprint .lp-row').forEach(function (r) { r.classList.add('typed'); });
  }

  /* ---------- motion scenes ---------- */

  function bootIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.np-line i', { yPercent: 112, stagger: 0.09, duration: 1.15 }, 0.25)
      .from('.rotorline', { y: 14, opacity: 0, duration: 0.7 }, 0.9)
      .from('.sky-meta, .sky-mono', { y: -8, opacity: 0, duration: 0.6, stagger: 0.1 }, 1.05);
  }

  function dropScrub() {
    gsap.fromTo('.namewrap', { scaleY: 1, yPercent: 0 },
      { scaleY: 0.58, yPercent: -8, ease: 'none',
        scrollTrigger: { trigger: '#sky', start: 'top top', end: '+=100%', scrub: true } });
    gsap.fromTo('#sky .sky-meta, #sky .sky-mono', { opacity: 1 },
      { opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '#sky', start: 'top top', end: '+=100%', scrub: true } });
  }

  function plateReveals() {
    qsa('.plate').forEach(function (plate) {
      var kids = Array.prototype.slice.call(plate.querySelectorAll(':scope > *'));
      gsap.from(kids, {
        y: 26, opacity: 0, duration: 0.95, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: plate, start: 'top 86%', toggleActions: 'play none none reverse' }
      });
    });
    gsap.from('#lumis .lumis-title', {
      y: 40, opacity: 0, duration: 1, ease: 'power4.out',
      scrollTrigger: { trigger: '#lumis', start: 'top 78%' }
    });
    gsap.from('.connect-lead .maskline', {
      yPercent: 112, duration: 1.1, ease: 'power4.out', stagger: 0.12,
      scrollTrigger: { trigger: '#connect', start: 'top 80%' }
    });
  }

  if (fullMotion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    bootIntro();
    dropScrub();
    plateReveals();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }
})();