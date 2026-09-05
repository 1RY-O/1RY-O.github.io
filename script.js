/* ============================================================
   PILLA SRI SAI RAHUL — optical bench engine
   FRACTURE → REASSEMBLY → IDENTITY → EXPLORATION
   One scene. One master motion. Eight states in depth.
   Input: wheel · trackpad · keyboard · touch/swipe · rail
   Motion: transform / opacity / filter only · reduced-motion safe
   ============================================================ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileQuery = window.matchMedia("(max-width: 820px)");

  function isMobile() { return mobileQuery.matches; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ============================================================
     PROLOGUE — fracture → reassembly → identity
     A single continuous transformation. The emblem surfaces,
     breaks apart, and the fragments reassemble as the identity.
     ============================================================ */

  var prologue = document.getElementById("prologue");
  var stage = document.getElementById("prologue-stage");
  var plane = document.getElementById("prologue-plane");
  var emblemLayer = document.getElementById("emblem-layer");
  var idLayer = document.getElementById("id-layer");
  var prologueDone = false;
  var finished = false;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* 11 hand-cut shards — an irregular fracture pattern.
     Each entry: clip-path + scatter vector + surface quality. */
  var SHARDS = [
    { clip: "polygon(0% 0%, 32% 0%, 21% 27%, 0% 34%)",
      dx: -205, dy: -165, dz: -260, rx: 11, ry: -7, rz: -6, o: 0.72, fb: 2.8, br: 0.82 },
    { clip: "polygon(32% 0%, 64% 0%, 55% 21%, 21% 27%)",
      dx: -70, dy: -230, dz: -330, rx: -8, ry: 5, rz: 4, o: 0.68, fb: 3.2, br: 0.78 },
    { clip: "polygon(64% 0%, 100% 0%, 100% 30%, 77% 32%, 55% 21%)",
      dx: 190, dy: -170, dz: -230, rx: 9, ry: 8, rz: 5, o: 0.74, fb: 2.4, br: 0.8 },
    { clip: "polygon(0% 34%, 21% 27%, 55% 21%, 49% 51%, 16% 56%, 0% 62%)",
      dx: -250, dy: -35, dz: -170, rx: -6, ry: -9, rz: 3, o: 0.84, fb: 1.8, br: 0.85 },
    { clip: "polygon(55% 21%, 77% 32%, 73% 54%, 49% 51%)",
      dx: -30, dy: -50, dz: -70, rx: 3, ry: -3, rz: -2, o: 0.94, fb: 0.8, br: 0.97 },
    { clip: "polygon(77% 32%, 100% 30%, 100% 61%, 85% 64%, 73% 54%)",
      dx: 245, dy: -45, dz: -280, rx: 7, ry: 9, rz: 6, o: 0.74, fb: 2.6, br: 0.79 },
    { clip: "polygon(0% 62%, 16% 56%, 49% 51%, 42% 79%, 14% 84%, 0% 90%)",
      dx: -210, dy: 135, dz: -250, rx: -9, ry: -7, rz: 4, o: 0.82, fb: 2.2, br: 0.83 },
    { clip: "polygon(49% 51%, 73% 54%, 68% 76%, 42% 79%)",
      dx: 45, dy: 155, dz: -100, rx: 5, ry: 4, rz: -3, o: 0.92, fb: 1.2, br: 0.93 },
    { clip: "polygon(73% 54%, 85% 64%, 100% 61%, 100% 90%, 79% 95%, 68% 76%)",
      dx: 215, dy: 145, dz: -310, rx: -7, ry: 9, rz: 5, o: 0.72, fb: 2.8, br: 0.78 },
    { clip: "polygon(0% 90%, 14% 84%, 42% 79%, 49% 100%, 0% 100%)",
      dx: -160, dy: 255, dz: -380, rx: 9, ry: -5, rz: -7, o: 0.62, fb: 3.6, br: 0.75 },
    { clip: "polygon(42% 79%, 68% 76%, 79% 95%, 100% 90%, 100% 100%, 49% 100%)",
      dx: 80, dy: 265, dz: -300, rx: -10, ry: 6, rz: 5, o: 0.66, fb: 3.2, br: 0.78 }
  ];

  /* reassembly order — the centre crystallises first, the frame settles last */
  var ORDER = [4, 7, 3, 8, 5, 6, 2, 0, 9, 1, 10];

  function buildShards() {
    var source = document.querySelector("#state-01 .plate");
    var emblem = document.querySelector(".emblem");
    if (!prologue || !stage || !plane || !source || !emblem) return null;

    var plateClone = source.cloneNode(true);
    plateClone.classList.add("clone-force");

    SHARDS.forEach(function (s) {
      var shard = document.createElement("div");
      shard.className = "shard";

      /* layer one — the emblem slice that surfaces with the fracture */
      var emblemFill = document.createElement("div");
      emblemFill.className = "shard-fill shard-fill--emblem";
      emblemFill.appendChild(emblem.cloneNode(true));
      shard.appendChild(emblemFill);

      /* layer two — the identity slice that forms on reassembly */
      var idFill = document.createElement("div");
      idFill.className = "shard-fill shard-fill--id";
      idFill.appendChild(plateClone.cloneNode(true));
      shard.appendChild(idFill);

      shard.style.setProperty("--clip", s.clip);
      shard.style.setProperty("--dx", s.dx + "px");
      shard.style.setProperty("--dy", s.dy + "px");
      shard.style.setProperty("--dz", s.dz + "px");
      shard.style.setProperty("--rx", s.rx + "deg");
      shard.style.setProperty("--ry", s.ry + "deg");
      shard.style.setProperty("--rz", s.rz + "deg");
      shard.style.setProperty("--o", s.o);
      shard.style.setProperty("--fb", s.fb + "px");
      shard.style.setProperty("--br", s.br);

      stage.appendChild(shard);
    });

    /* the id-layer stays hidden — only its sharded fragments
       are ever part of the composition */
    return Array.prototype.slice.call(stage.querySelectorAll(".shard"));
  }

  function finishPrologue(instant) {
    if (finished) return;
    finished = true;
    clearTimers();

    var shards = stage ? Array.prototype.slice.call(stage.querySelectorAll(".shard")) : [];
    if (instant) {
      shards.forEach(function (s) {
        s.style.transition = "none";
        s.classList.add("home", "instant");
      });
    } else {
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
    }, instant ? 60 : 1100);
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

    var fontsReady = (document.fonts && document.fonts.ready) ?
      Promise.race([
        document.fonts.ready,
        new Promise(function (r) { setTimeout(r, 1800); })
      ]) :
      Promise.resolve();

    fontsReady.then(function () {
      /* Phase 1 — a held breath, then the emblem tears apart */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (emblemLayer) emblemLayer.classList.add("fade");
        });
      });

      var HOLD = 900;    /* the emblem holding — anticipation */

      later(function () {
        shards.forEach(function (s) { s.classList.add("seen"); });
      }, HOLD);

      var SCATTER = 1700;  /* the fractured field drifts — stillness in depth */

      /* Phase 2 — reassembly, centre-out */
      later(function () {
        ORDER.forEach(function (shardIdx, order) {
          var s = shards[shardIdx];
          if (!s) return;
          s.style.transitionDelay = (order * 0.05).toFixed(3) + "s";
          s.classList.add("home");
        });
      }, HOLD + SCATTER);

      /* Phase 3 — clear delays, then the plate becomes the deck */
      later(function () {
        shards.forEach(function (s) { s.style.transitionDelay = "0s"; });
        finishPrologue(false);
      }, HOLD + SCATTER + 1400 + 600);

      /* skip — a click or key enters immediately */
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
     THE DECK — eight states in depth
     ============================================================ */

  var deck = document.getElementById("deck");
  var world = document.getElementById("world");
  var states = Array.prototype.slice.call(document.querySelectorAll(".state"));
  var total = states.length;
  var current = 0;
  var transitioning = false;
  var TRANS_MS = 1200;

  var chapterCur = document.getElementById("chapter-cur");
  var chapterTitle = document.getElementById("chapter-title");
  var railBtns = Array.prototype.slice.call(document.querySelectorAll(".rail-btn"));
  var navPrev = document.getElementById("nav-prev");
  var navNext = document.getElementById("nav-next");
  var hint = document.getElementById("hint");
  var bgGrid = document.getElementById("bg-grid");
  var firstMove = true;

  function slotFor(dist) {
    if (dist === 0) return "s-0";
    if (dist === -1) return "s-n1";
    if (dist === -2) return "s-n2";
    if (dist === -3) return "s-n3";
    if (dist === 1) return "s-p1";
    if (dist === 2) return "s-p2";
    if (dist === 3) return "s-p3";
    return "s-cull";
  }

  function applySlots() {
    states.forEach(function (s, i) {
      var dist = i - current;
      var cls = slotFor(dist);
      var old = null;
      for (var k = 0; k < s.classList.length; k++) {
        var c = s.classList[k];
        if (c.indexOf("s-") === 0) { old = c; break; }
      }
      if (old !== cls) {
        if (old) s.classList.remove(old);
        s.classList.add(cls);
      }
      if (i === current) {
        s.removeAttribute("inert");
      } else {
        s.setAttribute("inert", "");
      }
    });
  }

  function updateMeta() {
    if (chapterCur) chapterCur.textContent = pad2(current + 1);
    if (chapterTitle) {
      var t = states[current] && states[current].getAttribute("data-title");
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

    /* Phase 0 — the whole scene gathers (anticipation) */
    if (world && !isMobile()) world.classList.add("gather");

    later(function () {
      /* Phase 1 — states begin travelling through the room */
      current = index;
      applySlots();
      updateMeta();

      var arriving = states[current];

      /* veil re-trigger — the arriving state's content clears
         as it travels, then reassembles as it lands */
      if (arriving) {
        arriving.classList.remove("ready");
        arriving.classList.remove("arrive");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            arriving.classList.add("ready");
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                arriving.classList.add("arrive");
              });
            });
          });
        });
      }

      if (bgGrid) bgGrid.classList.add("shift");
    }, 170);

    later(function () {
      if (bgGrid) bgGrid.classList.remove("shift");
    }, 1000);

    /* Phase 2 — the camera returns; the scene settles */
    later(function () {
      if (world && !isMobile()) world.classList.remove("gather");
    }, 430);

    later(function () {
      transitioning = false;
      var active = states[current];
      if (active && !isMobile()) active.focus({ preventScroll: true });
    }, TRANS_MS);

    if (firstMove && hint) {
      hint.classList.add("off");
      firstMove = false;
    }
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function revealDeck() {
    if (!deck) return;
    doc.classList.add("head-on");
    applySlots();
    updateMeta();

    var active = states[current];
    if (active) {
      active.classList.add("ready");
      later(function () {
        if (active && active === states[current]) active.classList.add("arrive");
      }, 80);
    }

    deck.classList.add("on");
    later(function () {
      if (active && !isMobile()) active.focus({ preventScroll: true });
    }, 650);
  }

  /* ============================================================
     INPUT — wheel, keyboard, touch, rail, arrows
     ============================================================ */

  var wheelLock = false;
  var wheelTimer = null;

  function handleWheel(e) {
    if (!prologueDone || isMobile()) return;
    if (transitioning || wheelLock) { e.preventDefault(); return; }
    var dy = e.deltaY;
    if (Math.abs(dy) < 8) return;

    wheelLock = true;
    if (dy > 0) next(); else prev();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function () { wheelLock = false; }, TRANS_MS + 100);
  }

  window.addEventListener("wheel", handleWheel, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!prologueDone) return;
    if (isMobile()) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
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

  var tStartY = 0, tStartX = 0, tActive = false, tScroll = false;

  /* a swipe inside one of the mobile scrollable states scrolls
     that state's content instead of navigating the deck */
  function inScrollable(el) {
    while (el && el !== document.body) {
      var style = window.getComputedStyle(el);
      if ((style.overflowY === "auto" || style.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight + 4) {
        return true;
      }
      el = el.parentNode;
    }
    return false;
  }

  window.addEventListener("touchstart", function (e) {
    tStartY = e.touches[0].clientY;
    tStartX = e.touches[0].clientX;
    tActive = true;
    tScroll = inScrollable(e.target);
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (!tActive || !prologueDone) return;
    if (transitioning) return;
    var dy = e.touches[0].clientY - tStartY;
    var dx = e.touches[0].clientX - tStartX;
    if (tScroll) {
      /* leave room for native scrolling inside the region */
      if (Math.abs(dy) < 8) return;
    }
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      if (tScroll) {
        var sc = e.target;
        while (sc && sc !== document.body) {
          if ((sc.scrollTop > 0 && dy > 0) ||
              (sc.scrollTop < sc.scrollHeight - sc.clientHeight - 2 && dy < 0)) {
            return; /* the content is mid-scroll — let it breathe */
          }
          sc = sc.parentNode;
        }
      }
      tActive = false;
      if (dy < 0) next(); else prev();
    }
  }, { passive: true });

  window.addEventListener("touchend", function () { tActive = false; }, { passive: true });

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

    if (isMobile() || reduceMotion) {
      prologueDone = true;
      if (prologue) prologue.style.display = "none";
      revealDeck();
    } else {
      runPrologue();
      window.requestAnimationFrame(frame);
    }
  }

  init();
})();