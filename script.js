(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var canPlay = !reduceMotion && finePointer;

  root.classList.remove('no-js');

  function qs(sel, base) { return (base || document).querySelector(sel); }
  function qsa(sel, base) { return Array.prototype.slice.call((base || document).querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- lantern + artifact parallax ---------- */

  var lantern = qs('#lantern');
  var drifts = qsa('.artifact').map(function (a) {
    return { el: qs('.drift', a), depth: parseFloat(a.getAttribute('data-depth')) || 30 };
  });
  var aim = { x: innerWidth / 2, y: innerHeight / 3 };
  var cur = { x: aim.x, y: aim.y };

  if (canPlay) {
    document.addEventListener('pointermove', function (e) {
      aim.x = e.clientX;
      aim.y = e.clientY;
      lantern.classList.add('on');
    }, { passive: true });
    (function frame() {
      cur.x += (aim.x - cur.x) * 0.08;
      cur.y += (aim.y - cur.y) * 0.08;
      lantern.style.transform = 'translate3d(' + (cur.x - 260) + 'px,' + (cur.y - 260) + 'px,0)';
      var nx = (cur.x / innerWidth - 0.5) * 2;
      var ny = (cur.y / innerHeight - 0.5) * 2;
      for (var i = 0; i < drifts.length; i++) {
        var d = drifts[i];
        d.el.style.transform = 'translate3d(' + (-nx * d.depth).toFixed(1) + 'px,' + (-ny * d.depth).toFixed(1) + 'px,0)';
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ---------- reveals (armed only after init succeeds) ---------- */

  function armReveals() {
    var els = qsa('.rv');
    if (!('IntersectionObserver' in window)) {
      root.classList.add('js-armed');
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    root.classList.add('js-armed');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- plate tilt ---------- */

  if (canPlay) {
    qsa('[data-tilt]').forEach(function (fig) {
      var img = qs('img', fig);
      fig.addEventListener('pointermove', function (e) {
        var r = fig.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg)';
      });
      fig.addEventListener('pointerleave', function () {
        img.style.transform = 'rotateY(0deg) rotateX(0deg)';
      });
    });
  }

  /* ---------- progress hairline ---------- */

  var fill = qs('#progress-fill');
  function onScroll() {
    var st = root.scrollTop;
    var span = root.scrollHeight - innerHeight;
    if (span > 0) fill.style.width = clamp(st / span * 100, 0, 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- index overlay ---------- */

  var indexBtn = qs('#index-open');
  var indexNav = qs('#index');
  function setIndex(open) {
    document.body.classList.toggle('index-open', open);
    indexBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    indexNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  indexBtn.setAttribute('aria-expanded', 'false');
  indexBtn.addEventListener('click', function () {
    setIndex(!document.body.classList.contains('index-open'));
  });
  qsa('#index a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = qs(a.getAttribute('href'));
      setIndex(false);
      if (t) requestAnimationFrame(function () {
        t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  });

  /* ---------- terminal ---------- */

  var term = qs('#term');
  var termOut = qs('#term-out');
  var termForm = qs('#term-form');
  var termInput = qs('#term-input');
  var history = [];
  var hi = -1;

  var LINKS = {
    live: 'https://lumis---journal.web.app/',
    source: 'https://github.com/1RY-O/lumis-journal',
    github: 'https://github.com/1RY-O',
    linkedin: 'https://www.linkedin.com/in/sri-sai-rahul-pilla',
    mail: 'mailto:fabledadventurer.pssr@gmail.com',
    resume: 'resume.pdf'
  };

  function say(html, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.innerHTML = html;
    termOut.appendChild(p);
    termOut.scrollTop = termOut.scrollHeight;
  }
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function boot() {
    termOut.innerHTML = '';
    say('cabinetOS v1.0 — the room is listening.', 't-ok');
    say("type <b>help</b> to see what this place understands.", '');
  }
  function openTerm() {
    term.hidden = false;
    if (!termOut.children.length) boot();
    setTimeout(function () { termInput.focus(); }, 30);
  }
  function closeTerm() {
    term.hidden = true;
    qs('#term-open').focus();
  }

  var COMMANDS = {
    help: function () {
      say('rooms → <b>lumis</b> · <b>shelves</b> · <b>log</b> · <b>contact</b>', 't-ok');
      say('links → <b>open</b> · <b>source</b> · <b>github</b> · <b>mail</b> · <b>resume</b>', 't-ok');
      say('fun → <b>whoami</b> · <b>sudo</b> · <b>clear</b> · <b>exit</b>', 't-ok');
    },
    lumis: function () { go('#lumis', 'opening drawer 001 — lumis, live.'); },
    work: function () { go('#shelves', 'four drawers, no filler.'); },
    shelves: function () { go('#shelves', 'four drawers, no filler.'); },
    log: function () { go('#log', 'stamped entries, all carried somewhere.'); },
    contact: function () { go('#contact', 'the room has a door.'); },
    open: function () { jump(LINKS.live, 'entering lumis ↗'); },
    source: function () { jump(LINKS.source, 'source ↗'); },
    github: function () { jump(LINKS.github, 'github ↗'); },
    linkedin: function () { jump(LINKS.linkedin, 'linkedin ↗'); },
    mail: function () { jump(LINKS.mail, 'new message addressed.'); },
    resume: function () { jump(LINKS.resume, 'resume.pdf ↓'); },
    whoami: function () { say('fabled adventurer — personal space. explorer, builder, mechatronics undergrad.', 't-ok'); },
    sudo: function () { say('nice try. this cabinet trusts you already.', 't-err'); },
    clear: function () { termOut.innerHTML = ''; },
    exit: function () { say('closing the hatch.', ''); closeTerm(); },
    quit: function () { say('closing the hatch.', ''); closeTerm(); }
  };

  function go(sel, msg) {
    say(msg, 't-ok');
    var t = qs(sel);
    setTimeout(function () {
      closeTerm();
      if (t) t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 450);
  }
  function jump(url, msg) {
    say(msg + ' <a href="' + url + '" target="_blank" rel="noopener">follow →</a>', 't-ok');
    setTimeout(function () { window.open(url, '_blank', 'noopener'); }, 450);
  }

  termForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = termInput.value.trim();
    if (!raw) return;
    say('<b>❯</b> ' + esc(raw), 't-in');
    history.push(raw);
    hi = history.length;
    termInput.value = '';
    var cmd = raw.toLowerCase().split(/\s+/)[0];
    if (COMMANDS[cmd]) {
      COMMANDS[cmd]();
    } else {
      say("unknown spell: '" + esc(cmd) + "'. try <b>help</b>.", 't-err');
    }
  });
  termInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hi > 0) { hi--; termInput.value = history[hi] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hi < history.length) { hi++; termInput.value = history[hi] || ''; }
    }
  });

  qs('#term-open').addEventListener('click', function () {
    if (term.hidden) openTerm(); else closeTerm();
  });
  qs('#room-term').addEventListener('click', openTerm);
  qs('#term-close').addEventListener('click', closeTerm);

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName || '');
    if (e.key === 'Escape') {
      if (!term.hidden) closeTerm();
      if (document.body.classList.contains('index-open')) setIndex(false);
    } else if (e.key === '`' && !typing && term.hidden) {
      e.preventDefault();
      openTerm();
    }
  });

  /* ---------- devtools easter egg ---------- */

  try {
    console.log('%ccabinetOS // you found the back of the cabinet.', 'color:#e8a33d;font-family:monospace;font-size:13px;');
    console.log('%cpress ` anywhere and type "help". — PSR', 'color:#f2e9d8;font-family:monospace;font-size:12px;');
  } catch (err) { /* consoles are shy on some browsers */ }

  armReveals();
})();