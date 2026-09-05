/* ============================================================
   Rahul Pilla — motion engine
   One rAF loop · lerped scroll + pointer values · CSS-var driven
   Deck rotation · split text · magnetic hover · tilt · reveals
   Reduced-motion: everything static & instant
   ============================================================ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Index overlay (mobile menu) ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var overlay = document.getElementById("menu-overlay");

  if (menuBtn && overlay) {
    function setMenu(open) {
      overlay.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Index";
      document.body.style.overflow = open ? "hidden" : "";
    }
    menuBtn.addEventListener("click", function () {
      setMenu(!overlay.classList.contains("open"));
    });
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector(".js-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     SPLIT TEXT — chars for "Lumis", words for the contact line
     ============================================================ */
  function splitChars(el) {
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    var wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    for (var i = 0; i < text.length; i++) {
      var m = document.createElement("span");
      m.className = "ch";
      var w = document.createElement("span");
      w.className = "wi";
      w.style.setProperty("--i", i);
      w.textContent = text[i] === " " ? "\u00A0" : text[i];
      m.appendChild(w);
      wrap.appendChild(m);
    }
    el.appendChild(wrap);
  }

  function splitWords(el) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var idx = 0;
    function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            var m = document.createElement("span");
            m.className = "w";
            m.setAttribute("aria-hidden", "true");
            var w = document.createElement("span");
            w.className = "wi";
            w.style.setProperty("--i", idx++);
            w.textContent = p;
            m.appendChild(w);
            frag.appendChild(m);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    }
    walk(el);
  }

  var splitEls = document.querySelectorAll("[data-split]");
  splitEls.forEach(function (el) {
    if (el.getAttribute("data-split") === "chars") splitChars(el);
    else splitWords(el);
  });

  /* ============================================================
     OBSERVERS — reveals · section heads · split lines · active nav
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  var headEls = document.querySelectorAll(".sec-head");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    headEls.forEach(function (el) { el.classList.add("in"); });
    splitEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });

    var hio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            hio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    headEls.forEach(function (el) { hio.observe(el); });

    var sio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            sio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    splitEls.forEach(function (el) { sio.observe(el); });
  }

  /* ---------- Active section in masthead ---------- */
  var ids = ["work", "profile", "toolbox", "record", "contact"];
  var navMap = {};
  ids.forEach(function (id) {
    var link = document.querySelector('.head-nav a[href="#' + id + '"]');
    if (link) navMap[id] = link;
  });

  if ("IntersectionObserver" in window) {
    var activeIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = navMap[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            ids.forEach(function (k) {
              if (navMap[k]) navMap[k].classList.remove("active");
            });
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) activeIo.observe(sec);
    });
  }

  /* ============================================================
     REDUCED MOTION — static page, no loops
     ============================================================ */
  if (reduceMotion || !window.requestAnimationFrame) {
    return;
  }

  /* ============================================================
     ROTATING DECK — six slides, dealt forward in a loop
     ============================================================ */
  var deckEl = document.querySelector(".hero-cards");
  var cards = deckEl ? Array.prototype.slice.call(deckEl.querySelectorAll(".hcard")) : [];
  var deckCur = document.getElementById("deck-cur");
  var deckTotal = document.getElementById("deck-total");
  var deckBar = document.getElementById("deck-bar");

  var INTERVAL = 4200; // ms per slide
  var LEAVE_MS = 880;  // fade finishes before teleport to the back slot
  var order = cards.map(function (_, i) { return i; });
  var cycleStart = 0;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function setPos(el, pos) {
    if (el._pos !== undefined) el.classList.remove("pos-" + el._pos);
    el._pos = pos;
    el.classList.add("pos-" + pos);
  }

  function applyPositions() {
    order.forEach(function (cardIdx, pos) {
      setPos(cards[cardIdx], pos);
    });
  }

  function cycle(now) {
    var frontIdx = order.shift(); // remove front card…
    order.push(frontIdx);         // …queue it for the back

    // everyone else glides one slot forward
    order.forEach(function (cardIdx, pos) {
      if (cardIdx !== frontIdx) setPos(cards[cardIdx], pos);
    });

    // front card sails off the top of the fan
    var frontEl = cards[frontIdx];
    if (frontEl._pos !== undefined) frontEl.classList.remove("pos-" + frontEl._pos);
    frontEl._pos = undefined;
    frontEl.classList.add("leaving");

    // counter shows the incoming front card
    if (deckCur) deckCur.textContent = pad2(order[0] + 1);

    // once faded, snap (invisibly) to the back slot
    setTimeout(function () {
      frontEl.classList.remove("leaving");
      frontEl.classList.add("no-t");
      setPos(frontEl, order.length - 1);
      void frontEl.offsetWidth; // commit the teleport without transition
      frontEl.classList.remove("no-t");
    }, LEAVE_MS);

    cycleStart = now;
  }

  function initDeck() {
    if (!cards.length) return;
    if (deckTotal) deckTotal.textContent = pad2(cards.length);

    // staggered bloom from the base (hidden) state into the fan
    cards.forEach(function (el, i) {
      el.style.transitionDelay = (0.35 + i * 0.08).toFixed(2) + "s";
    });
    applyPositions();
    if (deckCur) deckCur.textContent = pad2(order[0] + 1);
    setTimeout(function () {
      cards.forEach(function (el) { el.style.transitionDelay = ""; });
    }, 2400);

    cycleStart = performance.now();
  }

  /* ---------- pause the deck when the hero is off-screen ---------- */
  var heroVisible = true;
  var heroEl = document.querySelector(".hero");
  if (heroEl && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        heroVisible = entries[0].isIntersecting;
      },
      { threshold: 0.02 }
    ).observe(heroEl);
  }

  /* ============================================================
     MOTION LOOP — lerped scroll, drift, magnets, tilt, ring
     ============================================================ */
  var barEl = document.getElementById("progress-bar");
  var vh = window.innerHeight;
  var docH = 1;

  function measure() {
    vh = Math.max(1, window.innerHeight);
    docH = Math.max(1, doc.scrollHeight - vh);
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  // smoothed state
  var hp = 0, hpT = 0;      // hero progress 0..1
  var par = 0, parT = 0;    // parallax px
  var dx = 0, dy = 0, dxT = 0, dyT = 0; // pointer drift px
  var lastHp = -1, lastPar = -1, lastDx = -1, lastDy = -1;

  // pointer
  var mx = -100, my = -100;
  var pnx = 0, pny = 0;     // pointer normalized -1..1 (viewport)
  var pointerSeen = false;

  var useCursor = finePointer;
  var ringEl = null;
  var ringX = 0, ringY = 0, ringScale = 1, ringScaleT = 1;

  if (useCursor) {
    ringEl = document.createElement("div");
    ringEl.className = "cursor-ring";
    ringEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(ringEl);

    window.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        mx = e.clientX;
        my = e.clientY;
        if (!pointerSeen) {
          ringX = mx; // appear in place — never fly in from a corner
          ringY = my;
        }
        pointerSeen = true;
        pnx = (e.clientX / window.innerWidth) * 2 - 1;
        pny = (e.clientY / window.innerHeight) * 2 - 1;
        var t = e.target;
        var hot = t && t.closest && t.closest("a, button, .row, .tool");
        ringScaleT = hot ? 1.9 : 1;
      },
      { passive: true }
    );
    document.documentElement.addEventListener("mouseleave", function () {
      pointerSeen = false;
    });
  }

  /* ---------- magnetic hover ---------- */
  var magnets = [];
  if (finePointer) {
    document.querySelectorAll(".magnet").forEach(function (el) {
      var m = { el: el, cx: 0, cy: 0, tx: 0, ty: 0, live: false };
      el.addEventListener("pointerenter", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        m.live = true;
      });
      el.addEventListener(
        "pointermove",
        function (e) {
          if (!m.live) return;
          var r = el.getBoundingClientRect();
          m.tx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 10;
          m.ty = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 8;
        },
        { passive: true }
      );
      el.addEventListener("pointerleave", function () {
        m.live = false;
        m.tx = 0;
        m.ty = 0;
      });
      magnets.push(m);
    });
  }

  /* ---------- Lumis tilt + spotlight + local parallax ---------- */
  var plate = document.querySelector(".plate");
  var browserEl = document.querySelector(".browser");
  var rx = 0, ry = 0, rxT = 0, ryT = 0;
  var plateVisible = false;

  if (plate && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        plateVisible = entries[0].isIntersecting;
      },
      { rootMargin: "120px 0px 120px 0px" }
    ).observe(plate);
  }

  if (plate && browserEl && finePointer) {
    plate.addEventListener(
      "pointermove",
      function (e) {
        var r = plate.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        ryT = nx * 7;
        rxT = -ny * 6;
        plate.style.setProperty("--gx", ((nx + 0.5) * 100).toFixed(1) + "%");
        plate.style.setProperty("--gy", ((ny + 0.5) * 100).toFixed(1) + "%");
      },
      { passive: true }
    );
    plate.addEventListener("pointerleave", function () {
      rxT = 0;
      ryT = 0;
    });
  }

  /* ---------- the loop ---------- */
  function frame(now) {
    var sy = window.scrollY || window.pageYOffset || 0;

    // scroll choreography
    hpT = Math.min(1, sy / vh);
    parT = sy * -0.06;
    hp += (hpT - hp) * 0.12;
    par += (parT - par) * 0.12;
    if (Math.abs(parT - par) < 0.05) par = parT;

    var hpR = hp.toFixed(4);
    var parR = par.toFixed(2);
    if (hpR !== lastHp) { doc.style.setProperty("--hp", hpR); lastHp = hpR; }
    if (parR !== lastPar) { doc.style.setProperty("--py", parR); lastPar = parR; }

    // progress hairline
    if (barEl) {
      barEl.style.transform = "scaleX(" + Math.min(1, sy / docH).toFixed(4) + ")";
    }

    // hero pointer drift
    if (heroVisible && pointerSeen) {
      dxT = pnx * -14;
      dyT = pny * -10;
    } else {
      dxT = 0;
      dyT = 0;
    }
    dx += (dxT - dx) * 0.06;
    dy += (dyT - dy) * 0.06;
    if (Math.abs(dxT - dx) < 0.05) dx = dxT;
    if (Math.abs(dyT - dy) < 0.05) dy = dyT;
    var dxR = dx.toFixed(2);
    var dyR = dy.toFixed(2);
    if (dxR !== lastDx) { doc.style.setProperty("--dx", dxR); lastDx = dxR; }
    if (dyR !== lastDy) { doc.style.setProperty("--dy", dyR); lastDy = dyR; }

    // deck cadence
    if (cards.length && heroVisible) {
      var t = now - cycleStart;
      if (deckBar) {
        deckBar.style.transform = "scaleX(" + Math.min(1, t / INTERVAL).toFixed(4) + ")";
      }
      if (t >= INTERVAL) cycle(now);
    }

    // magnets
    for (var i = 0; i < magnets.length; i++) {
      var m = magnets[i];
      m.cx += (m.tx - m.cx) * 0.18;
      m.cy += (m.ty - m.cy) * 0.18;
      if (!m.live && Math.abs(m.cx) < 0.05 && Math.abs(m.cy) < 0.05) {
        if (m.cx !== 0 || m.cy !== 0) {
          m.cx = 0;
          m.cy = 0;
          m.el.style.setProperty("--mx", "0px");
          m.el.style.setProperty("--my", "0px");
        }
        continue;
      }
      m.el.style.setProperty("--mx", m.cx.toFixed(2) + "px");
      m.el.style.setProperty("--my", m.cy.toFixed(2) + "px");
    }

    // Lumis tilt + element-relative parallax (measured on the plate,
    // which is never transformed — avoids a transform feedback loop)
    rx += (rxT - rx) * 0.1;
    ry += (ryT - ry) * 0.1;
    if (Math.abs(rxT - rx) < 0.01) rx = rxT;
    if (Math.abs(ryT - ry) < 0.01) ry = ryT;
    if (browserEl) {
      var bpy = 0;
      if (plateVisible) {
        var pr = plate.getBoundingClientRect();
        var off = (pr.top + pr.height / 2 - vh / 2) * -0.055;
        bpy = Math.max(-34, Math.min(34, off));
      }
      browserEl.style.setProperty("--rx", rx.toFixed(2) + "deg");
      browserEl.style.setProperty("--ry", ry.toFixed(2) + "deg");
      browserEl.style.setProperty("--bpy", bpy.toFixed(2) + "px");
    }

    // cursor ring
    if (useCursor) {
      if (pointerSeen) {
        ringX += (mx - ringX) * 0.16;
        ringY += (my - ringY) * 0.16;
        ringScale += (ringScaleT - ringScale) * 0.14;
        ringEl.style.opacity = "1";
        ringEl.style.transform =
          "translate3d(" + (ringX - 16).toFixed(1) + "px," + (ringY - 16).toFixed(1) + "px,0) scale(" + ringScale.toFixed(3) + ")";
      } else {
        ringEl.style.opacity = "0";
      }
    }

    window.requestAnimationFrame(frame);
  }

  initDeck();
  window.requestAnimationFrame(frame);
})();