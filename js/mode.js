/* ══════════════════════════════════════════════════════════════════════
   1RY · mode controller — renders both experiences, then swaps between
   them without re-rendering anything.

   The switch is structural, not a theme swap: each mode owns its own
   composition, its own navigation and its own motion, and only one of
   them is ever in the render tree or the accessibility tree.

   · Mouse, touch: the two radios in the header.
   · Keyboard: Tab to the group, arrows / Home / End to move and select
     (radiogroup pattern), Shift+Tab back out.
   · Every switch is announced in a polite live region.
   · Choice survives a reload: #/signal or #/archive first, then
     sessionStorage, then The Signal.
   · The reader's position is mapped across modes where an equivalent
     section exists, so switching mid-read does not throw them to the top.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var DATA=window.PORTFOLIO_DATA;
var RENDER=window.PORTFOLIO_RENDER;

/* Own-property lookups: MODE_NAME['constructor'] would otherwise satisfy a
   truthiness test through the prototype chain and set a mode that cannot
   exist. Every mode read goes through this. */
var hasOwn=Object.prototype.hasOwnProperty;
function knownMode(m){return typeof m==='string'&&hasOwn.call(MODE_NAME,m)?m:null;}

var MODE_NAME={signal:'The Signal',archive:'The Archive'};
var MODE_NOTE={
  signal:'Immersive experience. Projects appear as transmissions.',
  archive:'Editorial experience. Case files, facts and links in plain reading order.'
};
/* Equivalent places in the two documents, so context survives a switch.
   Anything not listed (hero, masthead) simply keeps the scroll position. */
var SECTION_MAP={
  signal:{'sig-transmissions':'arc-cases','sig-constellation':'arc-matrix','sig-channel':'arc-contact'},
  archive:{'arc-cases':'sig-transmissions','arc-matrix':'sig-constellation','arc-contact':'sig-channel'}
};
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
var baseTitle=document.title;
var live=null;

function qsa(sel,scope){
  return Array.prototype.slice.call((scope||document).querySelectorAll(sel));
}
function byId(id){return document.getElementById(id);}

/* ── Render both experiences from the one data object ── */
function render(){
  var signal=document.querySelector('[data-shell-inner="signal"]');
  var archive=document.querySelector('[data-shell-inner="archive"]');
  if(!signal||!archive){throw new Error('shell containers missing');}
  var s=RENDER.signal(), a=RENDER.archive();
  if(!s||!a){throw new Error('renderer returned nothing');}
  signal.innerHTML=s;
  archive.innerHTML=a;
}

function currentMode(){
  return knownMode(root.getAttribute('data-mode'))||'signal';
}

/* The section the reader is currently inside, or null when they are
   above the first one. Sorted by document order, so the last section
   whose top has passed the reading line is the current one. */
function currentSectionId(mode){
  var shell=document.querySelector('.shell--'+mode);
  if(!shell){return null;}
  var sections=qsa('.signal-section, .archive-section',shell);
  var line=window.innerHeight*0.3, current=null;
  sections.forEach(function(s){
    if(s.getBoundingClientRect().top<=line){current=s.id;}
  });
  return current;
}

function syncSwitch(){
  var mode=currentMode();
  qsa('[data-mode-btn]').forEach(function(btn){
    var on=btn.getAttribute('data-mode-btn')===mode;
    btn.setAttribute('aria-checked',on?'true':'false');
    btn.tabIndex=on?0:-1;
    btn.classList.toggle('is-on',on);
  });
}

/* ── The commit — every state change the switch makes, and nothing
      else. It runs synchronously, either inside a View Transition
      callback (where only state changes belong) or plainly when the
      API is unavailable. Scroll routing goes through
      PORTFOLIO_MOTION.scrollTo so Lenis's virtual position can never
      desync; under a transition the jump is instant, because the "new"
      snapshot is taken from whatever the DOM is when this returns. ── */
function commit(next,prev,changed,from,instant){
  root.setAttribute('data-mode',next);
  try{window.sessionStorage.setItem('iry-mode',next);}catch(e){}
  syncSwitch();
  document.title=baseTitle+' · '+MODE_NAME[next];

  if(from&&SECTION_MAP[prev]&&SECTION_MAP[prev][from]){
    var target=byId(SECTION_MAP[prev]&&SECTION_MAP[prev][from]);
    if(target){
      var M=window.PORTFOLIO_MOTION;
      if(M&&M.scrollTo){
        M.scrollTo(target,instant);
      }else if(target.scrollIntoView){
        /* scroll-margin-top on those sections clears the sticky
           header, and scroll-behavior is already `auto` under
           reduced motion. */
        target.scrollIntoView({block:'start'});
      }
    }
  }
}

function clearVT(){root.removeAttribute('data-vt');}

function setMode(requested,opts){
  opts=opts||{};
  var next=knownMode(requested)||'signal';
  var prev=currentMode();
  var changed=(prev!==next);
  var from=changed&&opts.keepContext!==false?currentSectionId(prev):null;

  /* Prefer the View Transitions API: the two named shells cross-morph
     in the compositor while header, footer and grain stay painted.
     Missing API, reduced motion, or an unchanged mode all fall back to
     the CSS reveal — the page never depends on the API existing. */
  var vt=!!(changed&&!reduced.matches&&
    typeof document.startViewTransition==='function');

  var ran=false;
  function update(){
    if(ran){return;}                 /* never commit twice */
    ran=true;
    commit(next,prev,changed,from,vt);
  }

  if(vt){
    root.setAttribute('data-vt',next);
    try{
      var t=document.startViewTransition(update);
      if(t&&t.finished&&t.finished.then){
        t.finished.then(clearVT,clearVT);
      }else{
        clearVT();
      }
    }catch(e){
      /* Most likely a transition already in flight (rapid clicking).
         It is not running, so the update has not happened yet. */
      clearVT();
      vt=false;
      update();
    }
  }else{
    update();
  }

  if(changed){
    var shell=document.querySelector('.shell--'+next);
    /* Under a transition the morph is the reveal; html[data-vt] also
       suppresses the CSS animation, so the two can never stack. */
    if(shell&&!reduced.matches&&!vt){
      shell.classList.remove('is-revealing');
      void shell.offsetWidth;          /* restart the reveal, never stack it */
      shell.classList.add('is-revealing');
    }
    if(live){
      live.textContent='Experience switched to '+MODE_NAME[next]+'. '+MODE_NOTE[next];
    }
  }

  /* Keep the address bar in step — replace, not push, so toggling the
     switch does not fill the back button with mode changes. */
  try{
    window.history.replaceState(window.history.state||{},'',
      window.location.pathname+window.location.search+'#/'+next);
  }catch(e){}
}

/* ── The switch itself ── */
function wireSwitch(){
  var btns=qsa('[data-mode-btn]');
  btns.forEach(function(btn,i){
    btn.addEventListener('click',function(){
      setMode(btn.getAttribute('data-mode-btn'));
    });
    /* Radiogroup keyboard model: arrows move the selection, Home/End jump
       to the ends. Selection follows focus, so the experience changes as
       the user moves — which is what a persistent two-state control should
       do, and it means one keystroke is enough. */
    btn.addEventListener('keydown',function(e){
      var k=e.key;
      if(k!=='ArrowRight'&&k!=='ArrowDown'&&k!=='ArrowLeft'&&k!=='ArrowUp'&&k!=='Home'&&k!=='End'){return;}
      e.preventDefault();
      var n=btns.length,next;
      if(k==='Home'){next=btns[0];}
      else if(k==='End'){next=btns[n-1];}
      else if(k==='ArrowRight'||k==='ArrowDown'){next=btns[(i+1)%n];}
      else{next=btns[(i-1+n)%n];}
      next.focus();
      setMode(next.getAttribute('data-mode-btn'));
    });
  });
}

/* Manual hash edits and shared #/archive links route too. Our own
   replaceState writes never fire this event, so there is no feedback loop. */
function wireHash(){
  window.addEventListener('hashchange',function(){
    var m=/^#\/(signal|archive)\/?$/i.exec(window.location.hash||'');
    if(m){setMode(m[1].toLowerCase(),{keepContext:false});}
  });
}

function init(){
  live=document.createElement('p');
  live.className='sr-only';
  live.setAttribute('role','status');
  live.setAttribute('aria-live','polite');
  document.body.appendChild(live);

  try{
    if(!DATA||!RENDER||!RENDER.signal||!RENDER.archive){throw new Error('data or renderer missing');}
    render();
  }catch(err){
    /* Leave the readable fallback on screen: a failed render must never
       mean a blank page. */
    root.setAttribute('data-render','failed');
    return;
  }

  root.setAttribute('data-render','ok');
  window.PORTFOLIO_READY=true;

  var footerLinks=document.querySelector('[data-footer-links]');
  if(footerLinks&&RENDER.footerLinks){footerLinks.innerHTML=RENDER.footerLinks();}

  wireSwitch();
  wireHash();

  var mode=currentMode();
  root.setAttribute('data-mode',mode);
  syncSwitch();
  document.title=baseTitle+' · '+MODE_NAME[mode];
  /* No entrance animation on arrival: the first paint is complete and
     readable. Reveals are reserved for mode switches, where they explain
     that the whole environment changed. */
}

/* Read-only handle for later phases and for manual testing. */
window.PORTFOLIO_MODE={setMode:setMode,currentMode:currentMode};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
})();

