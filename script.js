/* ============================================================
   Rahul Pilla — site interactions
   Index overlay · scroll reveals · active-section mark · year
   ============================================================ */

(function () {
  "use strict";

  /* JS is available: unlock reveal styles */
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
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
  }

  /* ---------- Active section in masthead ---------- */
  var map = { work: null, profile: null, contact: null };
  Object.keys(map).forEach(function (id) {
    var link = document.querySelector('.head-nav a[href="#' + id + '"]');
    if (link) map[id] = link;
  });

  if ("IntersectionObserver" in window) {
    var activeIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = map[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            Object.keys(map).forEach(function (k) {
              if (map[k]) map[k].style.color = "";
            });
            link.style.color = "var(--accent)";
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) activeIo.observe(sec);
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector(".js-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();