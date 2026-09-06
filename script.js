(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileQ = window.matchMedia('(max-width: 820px)');
  var finePointer = window.matchMedia('(pointer: fine)').matches && !mobileQ.matches;

  var GATHER = 200;
  var TRAVEL = 1300;
  var WHEEL_HIT = 40;

  var states, count, world, arcGrid, arcLight;
  var prologue, shardsHost;
  var shards = [];
  var deepIndex = readDeepLink();
  var current = 0;
  var travelling = false;
  var prologueDone = false;
  var entered = false;
  var wheelAcc = 0;
  var touchY = null;
  var scroller = null;
  var pgTimers = [];

  root.classList.remove('no-js');
  root.classList.add('js');

  function qs(sel) { return doc.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function readDeepLink() {
    var m = location.search.match(/[?&]s=(\d+)/);
    if (!m) return null;
    var v = parseInt(m[1], 10) - 1;
    return v >= 0 && v < 8 ? v : null;
  }

  function init() {
    states = qsa('.state');
    count = states.length;
    world = qs('#world');
    arcGrid = qs('#arc-grid');
    arcLight = qs('#arc-light');
    prologue = qs('#prologue');
    shardsHost = qs('#prologue-plane');

    prepareDeck();
    bindHud();
    bindInput();
    bindPointer();

    if (reduceMotion || mobileQ.matches || deepIndex !== null) {
      skipPrologue();
    } else {
      buildPrologue();
    }
  }

  function prepareDeck() {
    states.forEach(function (s) { s.classList.add('ready'); });
    applySlots(0);
    arriveAt(0);
    updateMeta(0);
  }

  function showDeck() {
    states.forEach(function (s) { s.classList.add('ready'); });
    arriveAt(current);
    root.classList.add('head-on');
    startClock();
  }

  function slotFor(delta) {
    if (delta === 0) return 's-0';
    var ahead = ['s-p1', 's-p2', 's-p3'];
    var behind = ['s-n1', 's-n2', 's-n3'];
    if (delta > 0) return delta <= 3 ? ahead[delta - 1] : 's-cull';
    delta = -delta;
    return delta <= 3 ? behind[delta - 1] : 's-cull';
  }

  function applySlots(active) {
    states.forEach(function (s, idx) {
      setSlot(s, slotFor(idx - active));
    });
  }

  function setSlot(s, slot) {
    s.classList.remove('s-0', 's-p1', 's-p2', 's-p3', 's-n1', 's-n2', 's-n3', 's-cull');
    s.classList.add(slot);
  }

  function arriveAt(idx) {
    states[idx].classList.add('arrive');
  }

  function updateMeta(idx) {
    qs('#chapter-cur').textContent = String(idx + 1).padStart(2, '0');
    qs('#chapter-title').textContent = '\u00A0\u2002' + states[idx].dataset.title;
    qsa('.rail-btn').forEach(function (b, j) {
      b.classList.toggle('active', j === idx);
    });
    var pct = count > 1 ? (idx / (count - 1)) * 100 : 0;
    qs('#progress-bar b').style.left = 'calc(' + pct + '% - 17px)';
    qs('#nav-prev').disabled = idx === 0;
    qs('#nav-next').disabled = idx === count - 1;
  }

  function goTo(idx) {
    if (travelling || !prologueDone) return;
    idx = clamp(idx, 0, count - 1);
    if (idx === current) return;

    travelling = true;
    hintOff();
    updateMeta(idx);

    world.classList.add('gather');
    arcGrid.classList.add('deep');
    states.forEach(function (s) { s.classList.add('travelling'); });

    setTimeout(function () {
      world.classList.remove('gather');
      applySlots(idx);
      setTimeout(function () { arriveAt(idx); }, 420);
      setTimeout(function () {
        arcGrid.classList.remove('deep');
        states.forEach(function (s) { s.classList.remove('travelling'); });
        current = idx;
        travelling = false;
        pushState(idx);
      }, TRAVEL);
    }, GATHER);
  }

  function jumpTo(idx) {
    if (!prologueDone || idx === current) return;
    world.style.transition = 'none';
    states.forEach(function (s) { s.style.transition = 'none'; });
    applySlots(idx);
    arriveAt(idx);
    updateMeta(idx);
    current = idx;
    travelling = false;
    pushState(idx);
    requestAnimationFrame(function () {
      world.style.transition = '';
      states.forEach(function (s) { s.style.transition = ''; });
    });
  }

  function pushState(idx) {
    try { history.replaceState(null, '', '?s=' + (idx + 1)); } catch (e) {}
  }

  function hintOff() {
    if (entered) return;
    entered = true;
    qs('#hint').classList.add('off');
  }

  function move(dir) { goTo(current + dir); }

  /* ---------- prologue ---------- */

  function buildPrologue() {
    shardsHost.innerHTML = '';
    shards = [];
    qs('#emblem-layer').classList.remove('fade');

    var emblemTpl = qs('#emblem-layer .emblem').cloneNode(true);
    var idTpl = qs('#state-01 .board').cloneNode(true);
    idTpl.classList.add('clone-force');

    var rnd = mulberry32(7);

    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 4; c++) {
        var y0 = r * 33.333 + (rnd() * 5 - 2.5);
        var y1 = (r + 1) * 33.333 + (rnd() * 5 - 2.5);
        var x0 = c * 25 + (rnd() * 5 - 2.5);
        var x1 = (c + 1) * 25 + (rnd() * 5 - 2.5);
        y0 = clamp(y0, 0, 100); y1 = clamp(y1, 0, 100);
        x0 = clamp(x0, 0, 100); x1 = clamp(x1, 0, 100);

        var cx = x0 + (x1 - x0) / 2;
        var cy = y0 + (y1 - y0) / 2;
        var dist = Math.hypot(cx - 50, cy - 50);
        var nrm = dist / 50;

        var sh = doc.createElement('div');
        sh.className = 'shard';
        sh.style.setProperty('--clip', 'polygon(' + x0 + '% ' + y0 + '%, ' + x1 + '% ' + y0 + '%, ' + x1 + '% ' + y1 + '%, ' + x0 + '% ' + y1 + '%)');
        sh.style.setProperty('--dx', (((cx - 50) / 50) * dist * (2 + rnd() * 3) + (rnd() * 90 - 45)) + 'px');
        sh.style.setProperty('--dy', (((cy - 50) / 50) * dist * (2 + rnd() * 3) + (rnd() * 90 - 45)) + 'px');
        sh.style.setProperty('--dz', (-Math.round(dist * 7 + rnd() * 260)) + 'px');
        sh.style.setProperty('--rx', (rnd() * 26 - 13) + 'deg');
        sh.style.setProperty('--ry', (rnd() * 26 - 13) + 'deg');
        sh.style.setProperty('--rz', (rnd() * 30 - 15) + 'deg');
        sh.style.setProperty('--fb', (0.6 + nrm * 2.2 + rnd() * 0.8).toFixed(2) + 'px');
        sh.style.setProperty('--br', (0.5 + rnd() * 0.32).toFixed(2));
        sh.style.setProperty('--o', (0.5 + rnd() * 0.35).toFixed(2));
        sh.style.setProperty('--cw', (0.02 + rnd() * 0.05).toFixed(3));
        sh.style.setProperty('--ch', (0.02 + rnd() * 0.05).toFixed(3));

        var fe = doc.createElement('div');
        fe.className = 'shard-fill shard-fill--emblem';
        fe.appendChild(emblemTpl.cloneNode(true));
        var fi = doc.createElement('div');
        fi.className = 'shard-fill shard-fill--id';
        fi.appendChild(idTpl.cloneNode(true));
        sh.appendChild(fe);
        sh.appendChild(fi);
        shardsHost.appendChild(sh);
        shards.push(sh);
      }
    }

    pgTimers.push(setTimeout(function () {
      qs('#emblem-layer').classList.add('fade');
      shards.forEach(function (s) { s.classList.add('seen'); });
    }, 1050));

    pgTimers.push(setTimeout(function () {
      shards.forEach(function (s) { s.classList.remove('seen'); s.classList.add('home'); });
    }, 2650));

    pgTimers.push(setTimeout(function () { completePrologue(); }, 4300));

    if (prologue) {
      doc.addEventListener('click', function () {
        if (!prologueDone) dismissPrologue();
      });
    }
  }

  function finishPrologue(quick) {
    var delay = quick ? 0 : 150;
    setTimeout(function () {
      prologue.classList.add('done');
      prologue.style.pointerEvents = 'none';
      setTimeout(function () { if (prologue) prologue.style.display = 'none'; }, 1300);
    }, delay);
    if (deepIndex !== null && deepIndex !== current) {
      setTimeout(function () { jumpTo(deepIndex); }, delay + 550);
    }
  }

  function completePrologue(quick) {
    if (prologueDone) return;
    prologueDone = true;
    clearPrologueTimers();
    showDeck();
    finishPrologue(quick);
  }

  function dismissPrologue() {
    if (prologueDone) return;
    prologueDone = true;
    clearPrologueTimers();
    showDeck();
    if (shards.length) {
      shards.forEach(function (s) {
        s.style.transition = 'none';
        s.classList.remove('seen');
        s.classList.add('home', 'instant');
      });
    }
    finishPrologue(true);
  }

  function clearPrologueTimers() {
    pgTimers.forEach(clearTimeout);
    pgTimers = [];
  }

  function skipPrologue() {
    if (prologue) prologue.style.display = 'none';
    prologueDone = true;
    showDeck();
    if (deepIndex !== null && deepIndex !== current) {
      setTimeout(function () { jumpTo(deepIndex); }, 80);
    }
  }

  /* ---------- input ---------- */

  function bindHud() {
    qs('.wordmark').addEventListener('click', function () {
      if (prologueDone) goTo(0);
    });
    qs('#nav-prev').addEventListener('click', function () {
      if (prologueDone && !this.disabled) goTo(current - 1);
    });
    qs('#nav-next').addEventListener('click', function () {
      if (prologueDone && !this.disabled) goTo(current + 1);
    });
    qsa('.rail-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (prologueDone) goTo(parseInt(b.dataset.go, 10));
      });
    });
  }

  function bindInput() {
    window.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (travelling || !prologueDone) return;
      wheelAcc += e.deltaY + e.deltaX * 0.6;
      if (Math.abs(wheelAcc) < WHEEL_HIT) return;
      var dir = wheelAcc > 0 ? 1 : -1;
      wheelAcc = 0;
      move(dir);
    }, { passive: false });

    doc.addEventListener('keydown', function (e) {
      if (!prologueDone) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          dismissPrologue();
        }
        return;
      }
      var k = e.key;
      var handled = true;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ') move(1);
      else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') move(-1);
      else if (k === 'Home') goTo(0);
      else if (k === 'End') goTo(count - 1);
      else if (/^[1-8]$/.test(k)) goTo(parseInt(k, 10) - 1);
      else handled = false;
      if (handled) e.preventDefault();
    });

    doc.addEventListener('touchstart', function (e) {
      if (!prologueDone) return;
      touchY = e.touches[0].clientY;
      scroller = findScroller(e.target);
    }, { passive: true });

    doc.addEventListener('touchmove', function (e) {
      if (touchY === null || !prologueDone || travelling) return;
      var dy = e.touches[0].clientY - touchY;
      if (Math.abs(dy) < 46) return;
      if (canScroll(scroller, dy)) return;
      touchY = null;
      move(dy < 0 ? 1 : -1);
    }, { passive: true });

    doc.addEventListener('touchend', function () {
      touchY = null;
      scroller = null;
    }, { passive: true });
  }

  function findScroller(node) {
    for (var el = node; el && el !== doc.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2) return el;
    }
    return null;
  }

  function canScroll(el, dy) {
    if (!el) return false;
    var max = el.scrollHeight - el.clientHeight;
    if (dy < 0 && el.scrollTop < max) return true;
    if (dy > 0 && el.scrollTop > 0) return true;
    return false;
  }

  /* ---------- pointer ---------- */

  function bindPointer() {
    if (!prologue) return;

    if (finePointer) {
      var magnets = qsa('.contact-link, .log-entry, .station, .tool-list li');
      doc.addEventListener('pointermove', function (e) {
        var x = (e.clientX / window.innerWidth) * 2 - 1;
        var y = (e.clientY / window.innerHeight) * 2 - 1;
        root.style.setProperty('--px', x);
        root.style.setProperty('--py', y);
        arcLight.classList.add('lit');
        arcLight.style.left = e.clientX + 'px';
        arcLight.style.top = e.clientY + 'px';

        for (var i = 0; i < magnets.length; i++) {
          var m = magnets[i];
          var rect = m.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var dx = e.clientX - cx;
          var dy = e.clientY - cy;
          var d = Math.hypot(dx, dy);
          var r = Math.max(rect.width, rect.height) / 2 + 60;
          if (d < r) {
            var f = 1 - d / r;
            m.style.transform = 'translate(' + dx * 0.16 * f + 'px,' + dy * 0.16 * f + 'px)';
          } else if (m.style.transform) {
            m.style.transform = '';
          }
        }
      });
    } else {
      doc.addEventListener('pointermove', function () {
        arcLight.classList.remove('lit');
      });
    }
  }

  /* ---------- clock ---------- */

  function startClock() {
    var el = qs('#head-clock');
    function tick() {
      try {
        var t = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date());
        el.textContent = 'IST • ' + t;
      } catch (e) {}
    }
    tick();
    setInterval(tick, 30000);
  }

  init();
})();