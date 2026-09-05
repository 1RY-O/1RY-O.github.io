/* ============================================================
   PILLA SRI SAI RAHUL — experience engine
   Broken-mirror opening · staircase depth deck · controlled inertia
   Input: wheel · trackpad · keyboard · touch/swipe · rail
   Motion: transform/opacity/filter only · rAF lerp · reduced-motion safe
   ============================================================ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ============================================================
     BROKEN MIRROR — shatter, scatter, reassemble
     ============================================================ */
  var mirror = document.getElementById("mirror");
  var mirrorStage = document.getElementById("mirror-stage");
  var mirrorPlane = document.getElementById("mirror-plane");

  var SHATTER_MS = 900;      // fragments fly apart
  var HOLD_MS = 500;         // brief stillness in the broken state
  var REASSEMBLE_MS = 1900;  // fragments return home
  var REVEAL_MS = 1100;      // mirror fades, deck takes over

  function buildFragments() {
    if (!mirror || !mirrorStage || !mirrorPlane) return;

    // 12 fragments — a 4×3 grid, each a piece of the whole
    var cols = 4, rows = 3;
    var frags = [];
    var planeHTML = mirrorPlane.innerHTML;

    mirrorPlane.style.display = "none";

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var f = document.createElement("div");
        f.className = "frag";
        f.innerHTML = planeHTML;

        // clip-path defines the visible shard
        var x0 = (c / cols) * 100;
        var y0 = (r / rows) * 100;
        var x1 = ((c + 1) / cols) * 100;
        var y1 = ((r + 1) / rows) * 100;
        f.style.clipPath =
          "polygon(" + x0 + "% " + y0 + "%, " + x1 + "% " + y0 + "%, " +
          x1 + "% " + y1 + "%, " + x0 + "% " + y1 + "%)";

        // scattered transform — depth, rotation, drift
        var dx = (Math.random() - 0.5) * 220;
        var dy = (Math.random() - 0.5) * 160;
        var dz = (Math.random() - 0.5) * 300;
        var rot = (Math.random() - 0.5) * 14;
        var scale = 0.82 + Math.random() * 0.3;
        var blur = 1 + Math.random() * 3;
        var op = 0.55 + Math.random() * 0.4;

        f.style.setProperty("--fx", dx.toFixed(1) + "px");
        f.style.setProperty("--fy", dy.toFixed(1) + "px");
        f.style.setProperty("--fz", dz.toFixed(1) + "px");
        f.style.setProperty("--fr", rot.toFixed(2) + "deg");
        f.style.setProperty("--fs", scale.toFixed(3));
        f.style.setProperty("--fb", blur.toFixed(2));
        f.style.setProperty("--fo", op.toFixed(2));

        // staggered scatter timing
        f.style.transitionDelay = (Math.random() * 0.15).toFixed(2) + "s";

        mirrorStage.appendChild(f);
        frags.push(f);
      }
    }

    return frags;
  }

  function runMirror(callback) {
    if (reduceMotion || !mirror || !mirrorStage) {
      if (mirror) mirror.style.display = "none";
      if (callback) callback();
      return;
    }

    var frags = buildFragments();
    if (!frags || !frags.length) {
      if (mirror) mirror.style.display = "none";
      if (callback) callback();
      return;
    }

    // Phase 1 — shatter: fragments fly apart
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        frags.forEach(function (f) { f.classList.add("scattered"); });

        // Phase 2 — reassemble after a beat of stillness
        setTimeout(function () {
          frags.forEach(function (f, i) {
            f.style.transitionDelay = (i * 0.045).toFixed(2) + "s";
            f.classList.remove("scattered");
            f.classList.add("reassembled");
          });

          // Phase 3 — mirror lifts, deck takes over
          setTimeout(function () {
            mirror.classList.add("done");
            setTimeout(function () {
              if (mirror.parentNode) mirror.parentNode.removeChild(mirror);
              if (callback) callback();
            }, REVEAL_MS);
          }, REASSEMBLE_MS + frags.length * 45);
        }, SHATTER_MS + HOLD_MS);
      });
    });
  }

  /* ============================================================
     STAIRCASE DECK — the spatial system
     ============================================================ */
  var deck = document.getElementById("deck");
  var panels = deck ? Array.prototype.slice.call(deck.querySelectorAll(".panel")) : [];
  var total = panels.length;
  var current = 0;
  var transitioning = false;
  var TRANSITION_MS = 1150;

  var chapterCur = document.getElementById("chapter-cur");
  var chapterTotal = document.getElementById("chapter-total");
  var railBtns = Array.prototype.slice.call(document.querySelectorAll(".rail-btn"));
  var navPrev = document.getElementById("nav-prev");
  var navNext = document.getElementById("nav-next");

  if (chapterTotal) chapterTotal.textContent = pad2(total);

  /* ---- position assignment ---- */
  function setPos(el, pos) {
    if (el._pos !== undefined) el.classList.remove("pos-" + el._pos);
    el._pos = pos;
    el.classList.add("pos-" + pos);
  }

  function applyPositions() {
    panels.forEach(function (p, i) {
      // distance from current, wrapping around the ring
      var dist = (i - current + total) % total;
      if (dist > total / 2) dist -= total;
      // map distance to a position slot
      var pos;
      if (dist === 0) pos = 0;
      else if (dist === -1) pos = 1;
      else if (dist === -2) pos = 2;
      else if (dist === 1) pos = 3;
      else if (dist === 2) pos = 4;
      else pos = 5 + Math.min(2, Math.abs(dist) - 3);
      setPos(p, pos);
    });
  }

  /* ---- chapter counter + rail state ---- */
  function updateMeta() {
    if (chapterCur) chapterCur.textContent = pad2(current + 1);
    railBtns.forEach(function (btn, i) {
      btn.classList.toggle("active", i === current);
    });
    if (navPrev) navPrev.disabled = current === 0;
    if (navNext) navNext.disabled = current === total - 1;
  }

  /* ---- navigation ---- */
  function goTo(index, instant) {
    if (transitioning) return;
    if (index < 0 || index >= total) return;
    if (index === current) return;

    transitioning = true;
    current = index;
    applyPositions();
    updateMeta();

    // focus the active panel for keyboard users
    var active = panels[current];
    if (active && !instant) {
      active.focus({ preventScroll: true });
    }

    setTimeout(function () {
      transitioning = false;
    }, instant ? 50 : TRANSITION_MS);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* ============================================================
     INPUT — wheel, keyboard, touch, rail
     ============================================================ */
  var wheelLock = false;
  var wheelLockT = null;

  function handleWheel(e) {
    if (wheelLock) {
      e.preventDefault();
      return;
    }
    var dy = e.deltaY;
    if (Math.abs(dy) < 8) return; // ignore micro-scrolls

    wheelLock = true;
    if (dy > 0) next();
    else prev();

    clearTimeout(wheelLockT);
    wheelLockT = setTimeout(function () {
      wheelLock = false;
    }, 900);
  }

  if (deck && !reduceMotion) {
    deck.addEventListener("wheel", handleWheel, { passive: false });
  }

  document.addEventListener("keydown", function (e) {
    if (mirror && mirror.style.display !== "none" && !mirror.classList.contains("done")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    }
  });

  /* ---- touch / swipe ---- */
  var touchStartY = 0;
  var touchStartX = 0;
  var touchActive = false;

  if (deck) {
    deck.addEventListener("touchstart", function (e) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchActive = true;
    }, { passive: true });

    deck.addEventListener("touchmove", function (e) {
      if (!touchActive) return;
      var dy = e.touches[0].clientY - touchStartY;
      var dx = e.touches[0].clientX - touchStartX;
      // vertical swipe dominates; horizontal swipes ignored
      if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4) {
        touchActive = false;
        if (dy < 0) next();
        else prev();
      }
    }, { passive: true });

    deck.addEventListener("touchend", function () {
      touchActive = false;
    }, { passive: true });
  }

  /* ---- rail buttons + wordmark ---- */
  railBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      goTo(i);
    });
  });

  var wordmark = document.querySelector(".wordmark");
  if (wordmark) {
    wordmark.addEventListener("click", function () {
      goTo(0);
    });
  }

  /* ---- arrows ---- */
  if (navPrev) navPrev.addEventListener("click", prev);
  if (navNext) navNext.addEventListener("click", next);

  /* ============================================================
     POINTER PARALLAX — subtle depth on the active panel
     ============================================================ */
  var px = 0, py = 0, pxT = 0, pyT = 0;
  var pointerSeen = false;

  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      pxT = (e.clientX / window.innerWidth) * 2 - 1;
      pyT = (e.clientY / window.innerHeight) * 2 - 1;
      pointerSeen = true;
    }, { passive: true });
  }

  /* ============================================================
     THE LOOP — parallax + atmosphere drift + head visibility
     ============================================================ */
  var head = document.querySelector(".site-head");
  var lastPx = -1, lastPy = -1;
  var lastAdx = -1, lastAdy = -1;
  var atmoT = 0;

  function frame(now) {
    if (finePointer && !reduceMotion) {
      px += (pxT - px) * 0.05;
      py += (pyT - py) * 0.05;
      var pxR = px.toFixed(3);
      var pyR = py.toFixed(3);
      if (pxR !== lastPx) {
        doc.style.setProperty("--px", pxR);
        lastPx = pxR;
      }
      if (pyR !== lastPy) {
        doc.style.setProperty("--py", pyR);
        lastPy = pyR;
      }
    }

    // atmosphere drift — slow, controlled, subordinate
    if (!reduceMotion) {
      atmoT = now * 0.00006;
      var adx = Math.sin(atmoT) * 30;
      var ady = Math.cos(atmoT * 0.8) * 22;
      var adxR = adx.toFixed(1);
      var adyR = ady.toFixed(1);
      if (adxR !== lastAdx) {
        doc.style.setProperty("--adx", adxR);
        lastAdx = adxR;
      }
      if (adyR !== lastAdy) {
        doc.style.setProperty("--ady", adyR);
        lastAdy = adyR;
      }
    }

    window.requestAnimationFrame(frame);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    doc.classList.remove("no-js");
    doc.classList.add("js");

    if (reduceMotion || !panels.length) {
      // reduced motion: show deck immediately, no mirror
      if (mirror) mirror.style.display = "none";
      applyPositions();
      updateMeta();
      return;
    }

    // hide deck until the mirror completes
    if (deck) deck.style.visibility = "hidden";
    if (head) head.style.opacity = "0";

    runMirror(function () {
      if (deck) deck.style.visibility = "visible";
      if (head) head.style.opacity = "1";
      applyPositions();
      updateMeta();
      if (panels[0]) panels[0].focus({ preventScroll: true });
    });

    window.requestAnimationFrame(frame);
  }

  init();
})();