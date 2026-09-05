/* ============================================================
   PILLA SRI SAI RAHUL — experience engine
   fracture → reassembly → exploration
   The prologue cuts chapter 01 into shards; the shards
   reassemble; the reassembled plate dissolves into the deck.
   Input: wheel · trackpad · keyboard · touch/swipe · rail
   Motion: transform/opacity/filter only · reduced-motion safe
   ============================================================ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileQuery = window.matchMedia("(max-width: 900px)");

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function isMobile() { return mobileQuery.matches; }

  /* ============================================================
     PROLOGUE — the fractured plate
     ============================================================ */

  var prologue = document.getElementById("prologue");
  var stage = document.getElementById("prologue-stage");
  var plane = document.getElementById("prologue-plane");

  /* 11 hand-cut shards — an intentional fracture pattern,
     straight fracture lines meeting at irregular nodes.
     Each entry: cut + scatter vector + surface quality. */
  var SHARDS = [
    { clip: "polygon(0% 0%, 34% 0%, 22% 26%, 0% 32%)",
      dx: -210, dy: -150, dz: -240, rx: 12, ry: -8, rz: -6, o: 0.8, fb: 2.5, br: 0.85 },
    { clip: "polygon(34% 0%, 66% 0%, 58% 22%, 22% 26%)",
      dx: -60, dy: -215, dz: -320, rx: -8, ry: 6, rz: 4, o: 0.72, fb: 3, br: 0.8 },
    { clip: "polygon(66% 0%, 100% 0%, 100% 30%, 78% 34%, 58% 22%)",
      dx: 175, dy: -160, dz: -210, rx: 10, ry: 8, rz: 5, o: 0.78, fb: 2, br: 0.82 },
    { clip: "polygon(0% 32%, 22% 26%, 58% 22%, 52% 52%, 18% 58%, 0% 64%)",
      dx: -245, dy: -30, dz: -150, rx: -6, ry: -10, rz: 3, o: 0.88, fb: 1.5, br: 0.86 },
    { clip: "polygon(58% 22%, 78% 34%, 74% 56%, 52% 52%)",
      dx: -36, dy: -56, dz: -60, rx: 4, ry: -3, rz: -2, o: 0.95, fb: 0.8, br: 0.96 },
    { clip: "polygon(78% 34%, 100% 30%, 100% 62%, 84% 66%, 74% 56%)",
      dx: 235, dy: -40, dz: -260, rx: 7, ry: 9, rz: 6, o: 0.78, fb: 2.5, br: 0.8 },
    { clip: "polygon(0% 64%, 18% 58%, 52% 52%, 46% 80%, 20% 86%, 0% 92%)",
      dx: -190, dy: 130, dz: -230, rx: -9, ry: -7, rz: 4, o: 0.84, fb: 2, br: 0.84 },
    { clip: "polygon(52% 52%, 74% 56%, 70% 78%, 46% 80%)",
      dx: 34, dy: 150, dz: -90, rx: 5, ry: 4, rz: -3, o: 0.94, fb: 1.2, br: 0.93 },
    { clip: "polygon(74% 56%, 84% 66%, 100% 62%, 100% 92%, 78% 96%, 70% 78%)",
      dx: 205, dy: 140, dz: -300, rx: -7, ry: 9, rz: 5, o: 0.76, fb: 2.5, br: 0.79 },
    { clip: "polygon(0% 92%, 20% 86%, 46% 80%, 54% 100%, 0% 100%)",
      dx: -125, dy: 235, dz: -360, rx: 10, ry: -5, rz: -7, o: 0.68, fb: 3.5, br: 0.77 },
    { clip: "polygon(46% 80%, 70% 78%, 78% 96%, 100% 92%, 100% 100%, 46% 100%)",
      dx: 75, dy: 255, dz: -280, rx: -11, ry: 6, rz: 5, o: 0.7, fb: 3, br: 0.8 }
  ];

  /* reassembly order — center crystallizes first, the frame settles last */
  var ORDER = [4, 7, 3, 5, 1, 8, 0, 2, 6, 9, 10];

  var timers = [];
  var prologueDone = false;
  var finished = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function buildShards() {
    var source = document.querySelector("#panel-1 .panel-frame");
    if (!prologue || !stage || !plane || !source) return null;

    var clone = source.cloneNode(true);
    plane.appendChild(clone);

    SHARDS.forEach(function (s) {
      var shard = document.createElement("div");
      shard.className = "shard";
      var fill = document.createElement("div");
      fill.className = "shard-fill";
      fill.appendChild(clone.cloneNode(true));
      shard.appendChild(fill);

      shard.style.setProperty("--clip", s.clip);
      shard.style.setProperty("--dx", s.dx + "px");
      shard.style.setProperty("--dy", s.dy + "px");
      shard.style.setProperty("--dz", s.dz + "px");
      shard.style.setProperty("--rx", s.rx + "deg");
      shard.style.setProperty("--ry", s.ry + "deg");
      shard.style.setProperty("--rz", s.rz + "deg");
      shard.style.setProperty("--o", s.o);
 ``     shard.style.setProperty("--fb", s.fb + "px");
      shard.style.setProperty("--br", s.br);

      stage.appendChild(shard);
    });

    return Array.prototype.slice.call(stage.querySelectorAll(".shard"));
  }

  function finishPrologue(instant) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    timers = [];

    var shards = stage ? Array.prototype.slice.call(stage.querySelectorAll(".shard")) : [];
    if (!instant) {
      shards.forEach(function (s) {
        s.style.transitionDelay = "0s";
        s.classList.add("home");
      });
    }

    prologueDone = true;
    if (prologue) prologue.classList.add("done");
    revealDeck();
    later(function () {
      if (prologue && prologue.parentNode) prologue.parentNode.removeChild(prologue);
    }, 1000);
  }

  function runPrologue() {
    if (reduceMotion || isMobile() || !prologue || !stage || !plane) {
      if (prologue) prologue.style.display = "none";
      prologueDone = true;
      revealDeck();
      return;
    }

    var shards = buildShards();
    if (!shards) {
      if (prologue) prologue.style.display = "none";
      prologueDone = true;
      revealDeck();
      return;
    }

    // wait for type — the plate must fracture in its final face
    var fontsReady = (document.fonts && document.fonts.ready) ?
      Promise.race([
        document.fonts.ready,
        new Promise(function (r) { setTimeout(r, 1500); })
      ]) :
      Promise.resolve();

    fontsReady.then(function () {
      // Phase 1 — the fragments surface out of the dark
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          shards.forEach(function (s) { s.classList.add("seen"); });
        });
      });

      var STAGGER = ORDER.length * 55;
      var MOVE = 1600;

      // Phase 2 — a held breath, then reassembly, center-out
      later(function () {
        ORDER.forEach(function (shardIdx, order) {
          var s = shards[shardIdx];
          if (!s) return;
          s.style.transitionDelay = (order * 0.055).toFixed(3) + "s";
          s.classList.add("home");
        });
      }, 2400);

      // Phase 3 — clear delays, settle, then dissolve into chapter 01
      later(function () {
        shards.forEach(function (s) { s.style.transitionDelay = "0s"; });
      }, 2400 + MOVE + STAGGER + 500);

      later(function () {
        finishPrologue(false);
      }, 2400 + MOVE + STAGGER + 800);

      // skip — a click or key enters immediately
      prologue.addEventListener("click", function () { finishPrologue(true); });
      document.addEventListener("keydown", function skipKey(e) {
        if (prologueDone) {
          document.removeEventListener("keydown", skipKey);
          return;
        }
        if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          finishPrologue(true);
        }
      });
    });
  }

  /* ============================================================
     THE DECK — six compositions in depth
     ============================================================ */

  var deck = document.getElementById("deck");
  var panels = deck ? Array.prototype.slice.call(deck.querySelectorAll(".panel")) : [];
  var total = panels.length;
  var current = 0;
  var transitioning = false;
  var TRANSITION_MS = 1200;

  var chapterCur = document.getElementById("chapter-cur");
  var chapterTitle = document.getElementById("chapter-title");
  var railBtns = Array.prototype.slice.call(document.querySelectorAll(".rail-btn"));
  var navPrev = document.getElementById("nav-prev");
  var navNext = document.getElementById("nav-next");
  var hint = document.getElementById("hint");
  var firstMove = true;

  function setPos(el, pos) {
    if (el._pos !== undefined) el.classList.remove("pos-" + el._pos);
    el._pos = pos;
    el.classList.add("pos-" + pos);
  }

  function applyPositions() {
    panels.forEach(function (p, i) {
      var dist = (i - current + total) % total;
      if (dist > total / 2) dist -= total;
      var pos;
      if (dist === 0) pos = 0;
      else if (dist === -1) pos = 1;
      else if (dist === -2) pos = 2;
      else if (dist === 1) pos = 3;
      else if (dist === 2) pos = 4;
      else pos = 5;
      setPos(p, pos);
      // far panels arrive a breath later — weight, not synchrony
      p.style.transitionDelay = Math.abs(dist) >= 2 ? "0.06s" : "0s";
    });
  }

  function updateMeta() {
    if (chapterCur) chapterCur.textContent = pad2(current + 1);
    if (chapterTitle) {
      var t = panels[current] && panels[current].getAttribute("data-title");
      if (t) chapterTitle.textContent = "\u2002" + t;
    }
    railBtns.forEach(function (btn, i) {
      btn.classList.toggle("active", i === current);
    });
    if (navPrev) navPrev.disabled = current === 0;
    if (navNext) navNext.disabled = current === total - 1;
  }

  function goTo(index) {
    if (transitioning || !prologueDone) return;
    if (index < 0 || index >= total) return;
    if (index === current) return;

    transitioning = true;
    current = index;
    applyPositions();
    updateMeta();

    if (firstMove && hint) {
      hint.classList.add("off");
      firstMove = false;
    }

    var active = panels[current];
    if (active && !isMobile()) active.focus({ preventScroll: true });

    setTimeout(function () { transitioning = false; }, TRANSITION_MS);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function revealDeck() {
    if (!deck) return;
    doc.classList.add("head-on");
    applyPositions();
    updateMeta();
    // the deck surfaces out of the plate — staggered, weighted
    panels.forEach(function (p, i) {
      p.style.transitionDelay = (i * 0.09).toFixed(2) + "s";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          p.classList.remove("pre");
        });
      });
    });
    deck.classList.add("on");
    setTimeout(function () {
      panels.forEach(function (p) { p.style.transitionDelay = "0s"; });
      applyPositions();
    }, 1400);
    if (panels[0] && !isMobile()) panels[0].focus({ preventScroll: true });
  }

  /* ============================================================
     INPUT — wheel, keyboard, touch, rail
     ============================================================ */

  var wheelLock = false;
  var wheelLockT = null;

  function handleWheel(e) {
    if (!prologueDone || isMobile()) return;
    if (wheelLock) { e.preventDefault(); return; }
    var dy = e.deltaY;
    if (Math.abs(dy) < 8) return;

    wheelLock = true;
    if (dy > 0) next(); else prev();
    clearTimeout(wheelLockT);
    wheelLockT = setTimeout(function () { wheelLock = false; }, 1000);
  }

  window.addEventListener("wheel", handleWheel, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!prologueDone) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (isMobile()) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault(); next();
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault(); prev();
    } else if (e.key === "Home") {
      e.preventDefault(); goTo(0);
    } else if (e.key === "End") {
      e.preventDefault(); goTo(total - 1);
    }
  });

  var touchStartY = 0, touchStartX = 0, touchActive = false;

  window.addEventListener("touchstart", function (e) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchActive = true;
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (!touchActive || !prologueDone || isMobile()) return;
    var dy = e.touches[0].clientY - touchStartY;
    var dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      touchActive = false;
      if (dy < 0) next(); else prev();
    }
  }, { passive: true });

  window.addEventListener("touchend", function () { touchActive = false; }, { passive: true });

  railBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () { goTo(i); });
  });

  var wordmark = document.querySelector(".wordmark");
  if (wordmark) wordmark.addEventListener("click", function () { goTo(0); });
  if (navPrev) navPrev.addEventListener("click", prev);
  if (navNext) navNext.addEventListener("click", next);

  /* ============================================================
     POINTER PARALLAX — the room responds to the hand
     ============================================================ */

  var px = 0, py = 0, pxT = 0, pyT = 0;
  var lastPx = "", lastPy = "";

  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      pxT = (e.clientX / window.innerWidth) * 2 - 1;
      pyT = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  function frame() {
    if (finePointer && !reduceMotion) {
      px += (pxT - px) * 0.045;
      py += (pyT - py) * 0.045;
      var pxr = px.toFixed(3), pyr = py.toFixed(3);
      if (pxr !== lastPx) { doc.style.setProperty("--px", pxr); lastPx = pxr; }
      if (pyr !== lastPy) { doc.style.setProperty("--py", pyr); lastPy = pyr; }
    }
    window.requestAnimationFrame(frame);
  }

  /* ============================================================
     INIT
     ============================================================ */

  function init() {
    doc.classList.remove("no-js");
    doc.classList.add("js");

    var desktop = !isMobile() && !reduceMotion;

    if (desktop) {
      panels.forEach(function (p) { p.classList.add("pre"); });
      runPrologue();
      window.requestAnimationFrame(frame);
    } else {
      prologueDone = true;
      doc.classList.add("head-on");
      panels.forEach(function (p) { p.classList.remove("pre"); });
      updateMeta();
      if (railBtns[0]) railBtns[0].classList.add("active");
      if (deck) deck.classList.add("on");
    }

    // crossing from the mobile edition back to desktop mid-session
    var onChange = function (e) {
      if (!e.matches && prologueDone && deck && !deck.classList.contains("on")) {
        revealDeck();
      }
    };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onChange);
    else if (mobileQuery.addListener) mobileQuery.addListener(onChange);
  }

  init();
})();