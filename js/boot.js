/* ══════════════════════════════════════════════════════════════════════
   1RY · boot — the only script that runs before first paint.

   It does three things, in this order:
     1. Clickjacking guard. `frame-ancestors` is ignored in a <meta> CSP
        and GitHub Pages cannot send X-Frame-Options, so a framed copy
        refuses to render.
     2. html.js / html.no-js, so CSS can arm progressive enhancement
        before anything is painted.
     3. Mode restore — hash, then sessionStorage, then The Signal — so the
        wrong experience never flashes on screen.

   It also arms a failsafe: if the deferred modules never report a
   successful render, the readable fallback stays on screen instead of an
   empty page.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var MODES={signal:1,archive:1};
/* Own-property test, so a hand-edited sessionStorage value like
   '__proto__' or 'constructor' cannot set a mode that does not exist. */
var hasOwn=Object.prototype.hasOwnProperty;
var HASH=/^#\/(signal|archive)\/?$/i;

if(window.top!==window.self){
  root.setAttribute('data-render','failed');
  document.addEventListener('DOMContentLoaded',function(){
    document.body.textContent='This page does not render inside a frame. Open https://1ry-o.github.io/ directly.';
  });
  return;
}

root.classList.remove('no-js');
root.classList.add('js');
root.setAttribute('data-render','pending');

var mode=null;
var m=HASH.exec(window.location.hash||'');
if(m){mode=m[1].toLowerCase();}
if(!mode){
  try{mode=window.sessionStorage.getItem('iry-mode');}catch(e){}
}
if(!hasOwn.call(MODES,mode)){mode='signal';}
root.setAttribute('data-mode',mode);

/* ── The acquisition sequence ──
   Armed here, before first paint, and only when motion is allowed:
   prefers-reduced-motion gets no overlay and no scroll lock (css/boot.css
   displays .boot only while this class exists). js/preloader.js is
   expected to remove it inside ~1 s; the timer below guarantees removal
   even if that file fails to load or throws. The sequence can be
   skipped — it can never be survived. */
var reducedMotion=!!(window.matchMedia&&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches);
if(!reducedMotion){root.classList.add('is-booting');}
window.setTimeout(function(){root.classList.remove('is-booting');},5000);

/* If js/mode.js never finishes, stop claiming a render is coming. */
window.setTimeout(function(){
  if(root.getAttribute('data-render')!=='ok'){root.setAttribute('data-render','failed');}
},6000);

window.PORTFOLIO_READY=false;
})();
