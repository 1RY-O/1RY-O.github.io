/* ============================================================
   Rahul Pilla — motion engine v2
   One rAF loop · lerped scroll + pointer · CSS-var driven
   Boot curtain · masked hero type · rotating deck · pinned
   Lumis case study · ghost numerals · magnets · tilt · cursor
   Reduced motion: static page, no loops
   ============================================================ */

(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mqPin = window.matchMedia("(min-width: 901px)");
  var head = document.querySelector(".site-head");

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Index overlay (mobile menu) ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var overlay = document.getElementById("menu-overlay");
  var menuOpen = false;

  if (menuBtn && overlay) {
    function setMenu(open) {
      menuOpen = open;
      overlay.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Index";
      document.body.style.overflow = open ? "hidden" : "";
      if (head) head.classList.remove("head-hidden"); // never trap the toggle
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
     HERO TYPE — masked characters, one beat per line
     ============================================================ */
  function splitHero() {
    var lines = document.querySelectorAll("#hero-display .line-in");
    var global = 0;
    var lineDelay = [0.05, 0.22, 0.39];
    lines.forEach(function (line, li) {
      line.style.setProperty("--d", (lineDelay[li] || 0) + "s");
      var kids = Array.prototype.slice.call(line.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var text = child.textContent;
          for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            var mask = document.createElement("span");
            mask.className = "c";
            var inner = document.createElement("span");
            inner.className = "ci";
            inner.style.setProperty("--i", global++);
            inner.textContent = ch === " " ? "\u00A0" : ch;
            mask.appendChild(inner);
            frag.appendChild(mask);
          }
          line.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          // accent words rise as a single masked unit — keeps the gradient whole
          var m = document.createElement("span");
          m.className = "c";
          var w = document.createElement("span");
          w.className = "ci";
          w.style.setProperty("--i", global++);
          w.appendChild(child.cloneNode(true));
          m.appendChild(w);
          line.replaceChild(m, child);
        }
      });
      line.setAttribute("aria-hidden", "true");
    });
    var h1 = document.getElementById("hero-display");
    if (h1) h1.setAttribute("aria-label", "I build things that move, sense & think.");
  }
  splitHero();

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
     OBSERVERS — reveals · heads · splits · plate · active nav
     ============================================================ */
  var revealEls = document.querySelectorAll(".reveal");
  var headEls = document.querySelectorAll(".sec-head");
  var stageEl = document.getElementById("lumis-stage");
  var plateEl = document.querySelector(".plate");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    headEls.forEach(function (el) { el.classList.add("in"); });
    splitEls.forEach(function (el) { el.classList.add("in"); });
    if (plateEl) plateEl.classList.add("in");
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

    // the case-study frame opens when the stage arrives
    if (stageEl && plateEl) {
      var pio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              plateEl.classList.add("in");
              pio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.22 }
      );
      pio.observe(stageEl);
    }
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
     REDUCED MOTION — stillness: static page, no loops
     ============================================================ */
  if (reduceMotion || !window.requestAnimationFrame) {
    doc.classList.add("loaded");
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
  var deckReady = false;

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
    deckReady = true;
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
     MEASUREMENT — cached geometry, refreshed on resize/load
     ============================================================ */
  var barEl = document.getElementById("progress-bar");
  var vh = window.innerHeight;
  var docH = 1;
  var pinEl = document.querySelector(".stage-pin");
  var appBodyEl = document.querySelector(".app-body");
  var pinExtra = 1;

  var ghosts = [];
  document.querySelectorAll(".ghost").forEach(function (g) {
    var sec = g.closest(".sec");
    if (sec) {
      ghosts.push({
        el: g,
        sec: sec,
        dir: g.getAttribute("data-dir") === "-1" ? -1 : 1
      });
    }
  });

  function measure() {
    vh = Math.max(1, window.innerHeight);
    docH = Math.max(1, doc.scrollHeight - vh);
    if (stageEl && pinEl) {
      pinExtra = Math.max(1, stageEl.offsetHeight - pinEl.offsetHeight);
    }
  }
  measure();
  var resizeT = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(measure, 120);
  });
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* ============================================================
     POINTER — drift, magnets, tilt, cursor physics
     ============================================================ */
  var mx = -100, my = -100;
  var pnx = 0, pny = 0;
  var pointerSeen = false;

  var dotEl = null, ringEl = null;
  var dotX = 0, dotY = 0, ringX = 0, ringY = 0, ringScale = 1, ringScaleT = 1;

  if (finePointer) {
    dotEl = document.createElement("div");
    dotEl.className = "cursor-dot";
    dotEl.setAttribute("aria-hidden", "true");
    ringEl = document.createElement("div");
    ringEl.className = "cursor-ring";
    ringEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(dotEl);
    document.body.appendChild(ringEl);

    window.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        mx = e.clientX;
        my = e.clientY;
        if (!pointerSeen) {
          dotX = mx; dotY = my; ringX = mx; ringY = my; // appear in place
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

  /* ---------- Lumis tilt + spotlight ---------- */
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

  /* ============================================================
     BOOT CURTAIN — count, fill, lift, then hand over the stage
     ============================================================ */
  var loader = document.getElementById("loader");
  var loadCount = document.getElementById("load-count");
  var loadLine = document.getElementById("load-line");
  var BOOT_MS = 1150;

  function boot() {
    doc.classList.add("loaded");
    initDeck();
    measure();
  }

  if (loader) {
    document.body.style.overflow = "hidden";
    var bootStart = 0;
    function tickBoot(now) {
      if (!bootStart) bootStart = now;
      var p = clamp((now - bootStart) / BOOT_MS, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      if (loadCount) loadCount.textContent = pad2(Math.round(eased * 100));
      if (loadLine) loadLine.style.transform = "scaleX(" + eased.toFixed(4) + ")";
      if (p < 1) {
        requestAnimationFrame(tickBoot);
      } else {
        loader.classList.add("done");
        document.body.style.overflow = "";
        boot();
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 1000);
      }
    }
    requestAnimationFrame(tickBoot);
  } else {
    boot();
  }

  /* ============================================================
     THE LOOP — scroll choreography, deck, ghosts, pin, cursor
     ============================================================ */
  var hp = 0;                 // hero progress 0..1
  var par = 0;                // parallax px
  var vel = 0, velT = 0;      // scroll velocity skew (deg)
  var dx = 0, dy = 0, dxT = 0, dyT = 0; // pointer drift px
  var prevSy = window.scrollY || 0;
  var lastHp = -1, lastPar = -1, lastDx = -1, lastDy = -1, lastVel = "";
  var lastPinp = "-1", lastGp = {};

  function frame(now) {
    var sy = window.scrollY || window.pageYOffset || 0;
    var dyScroll = sy - prevSy;
    prevSy = sy;

    // hero exit choreography
    var hpTarget = clamp(sy / vh, 0, 1);
    hp += (hpTarget - hp) * 0.12;
    var parTarget = sy * -0.06;
    par += (parTarget - par) * 0.12;
    if (Math.abs(parTarget - par) < 0.05) par = parTarget;

    var hpR = hp.toFixed(4);
    var parR = par.toFixed(2);
    if (hpR !== lastHp) { doc.style.setProperty("--hp", hpR); lastHp = hpR; }
    if (parR !== lastPar) { doc.style.setProperty("--py", parR); lastPar = parR; }

    // velocity skew — type leans into fast scrolls, settles when still
    velT = clamp(dyScroll * 0.05, -2.4, 2.4);
    vel += (velT - vel) * 0.1;
    var velR = vel.toFixed(2);
    if (velR !== lastVel) {
      if (Math.abs(vel) > 0.02) doc.style.setProperty("--vel", velR + "deg");
      else doc.style.setProperty("--vel", "0deg");
      lastVel = velR;
    }

    // progress hairline
    if (barEl) {
      barEl.style.transform = "scaleX(" + Math.min(1, sy / docH).toFixed(4) + ")";
    }

    // masthead physics — hide on dive, return on rise
    if (!menuOpen && head) {
      if (dyScroll > 6 && sy > vh * 0.9) head.classList.add("head-hidden");
      else if (dyScroll < -6 || sy <= vh * 0.9) head.classList.remove("head-hidden");
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
    if (deckReady && cards.length && heroVisible) {
      var t = now - cycleStart;
      if (deckBar) {
        deckBar.style.transform = "scaleX(" + Math.min(1, t / INTERVAL).toFixed(4) + ")";
      }
      if (t >= INTERVAL) cycle(now);
    }

    // ghost numerals — depth behind each act
    for (var gi = 0; gi < ghosts.length; gi++) {
      var gh = ghosts[gi];
      var gr = gh.sec.getBoundingClientRect();
      if (gr.bottom < -80 || gr.top > vh + 80) continue;
      var gp = clamp((vh - gr.top) / (vh + gr.height), 0, 1);
      var gv = ((gp - 0.5) * -130 * gh.dir).toFixed(1);
      if (lastGp[gi] !== gv) {
        gh.el.style.setProperty("--gp", gv);
        lastGp[gi] = gv;
      }
    }

    // Lumis stage — manual pin, frame push, in-app drift
    if (stageEl && pinEl && mqPin.matches) {
      var sr = stageEl.getBoundingClientRect();
      if (sr.top < 0 && sr.bottom > 0) {
        var offset = clamp(-sr.top, 0, pinExtra);
        pinEl.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
        var pinp = offset / pinExtra;
        var pinpR = pinp.toFixed(3);
        if (pinpR !== lastPinp) {
          pinEl.style.setProperty("--pinp", pinpR);
          lastPinp = pinpR;
        }
        if (appBodyEl) {
          pinEl.style.setProperty("--appj", ((0.5 - pinp) * 26).toFixed(1) + "px");
        }
      } else if (lastPinp !== "0") {
        pinEl.style.transform = "translate3d(0,0,0)";
        pinEl.style.setProperty("--pinp", "0");
        if (appBodyEl) pinEl.style.setProperty("--appj", "13px");
        lastPinp = "0";
      }
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

    // Lumis tilt + element-relative parallax
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

    // cursor physics — dot leads, ring trails
    if (finePointer) {
      if (pointerSeen) {
        dotX += (mx - dotX) * 0.55;
        dotY += (my - dotY) * 0.55;
        ringX += (mx - ringX) * 0.16;
        ringY += (my - ringY) * 0.16;
        ringScale += (ringScaleT - ringScale) * 0.14;
        dotEl.style.opacity = "1";
        ringEl.style.opacity = "1";
        dotEl.style.transform =
          "translate3d(" + (dotX - 3).toFixed(1) + "px," + (dotY - 3).toFixed(1) + "px,0)";
        ringEl.style.transform =
          "translate3d(" + (ringX - 17).toFixed(1) + "px," + (ringY - 17).toFixed(1) + "px,0) scale(" + ringScale.toFixed(3) + ")";
      } else {
        dotEl.style.opacity = "0";
        ringEl.style.opacity = "0";
      }
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();