/* Personal site interactions */

(function () {
  "use strict";

  /* ---------- Typing effect ---------- */
  var typedEl = document.getElementById("typed");
  if (typedEl) {
    var roles = [
      "Mechatronics Student",
      "Robotics Builder",
      "Embedded Systems Tinkerer",
      "IoT Developer",
      "AI Integration Enthusiast",
      "Open Source Contributor",
    ];
    var roleIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var current = roles[roleIndex];
      if (deleting) {
        charIndex--;
      } else {
        charIndex++;
      }
      typedEl.textContent = current.slice(0, charIndex);

      var delay = deleting ? 40 : 85;
      if (!deleting && charIndex === current.length) {
        delay = 1600;
        deleting = true;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 600);
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    function closeNav() {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target && e.target.tagName === "A") closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  /* ---------- Nav link active state ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  if ("IntersectionObserver" in window) {
    var activeIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navAnchors.forEach(function (a) {
              var on = a.getAttribute("href") === "#" + entry.target.id;
              a.style.color = on ? "var(--cyan)" : "";
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) {
      activeIo.observe(s);
    });
  }

  /* ---------- Active year ---------- */
  var yearEls = document.querySelectorAll(".js-year");
  var year = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = year;
  });
})();