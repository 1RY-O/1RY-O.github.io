/* ══════════════════════════════════════════════════════════════════════
   1RY · motion — Lenis momentum scrolling, GSAP reveals, magnetic
   cards, and the single requestAnimationFrame the whole site runs on.

   One loop, four jobs, in this order every frame:
     1. lenis.raf(now)           — momentum scrolling (when armed);
     2. pointer smoothing        — page parallax, lerped here, not in
                                   event handlers;
     3. tilt flush               — at most one transform write per
                                   armed card per frame;
     4. quasar.tick + telemetry  — the renderer and the HUD read the
                                   same frame number.

   Everything continuous happens inside that loop; pointermove and
   resize handlers only record numbers. GSAP is used for what GSAP is
   good at — quickTo spring easing on tilt, timeline reveals, and
   ScrollTrigger (wired to Lenis through ScrollTrigger.update, with the
   ticker left alone because this file owns the rAF).

   Reduced motion is evaluated at load and again on change: it tears
   Lenis down, disarms tilt and reveals, stops the loop, and the CSS
   core replaces the renderer. Nothing here runs without JavaScript.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
var fine=window.matchMedia('(pointer:fine)');
var G=window.gsap||null;
var ST=window.ScrollTrigger||null;

var lenis=null,rafId=0,looping=false;
var ptr={x:0,y:0,tx:0,ty:0};
var docSpan=1;
var tiltList=[];
var revealTweens=[];

function qsa(sel){
  return Array.prototype.slice.call(document.querySelectorAll(sel));
}
function scrollTop(){
  var d=document.scrollingElement||document.documentElement;
  return d?d.scrollTop:0;
}
function measure(){
  var d=document.scrollingElement||document.documentElement;
  var max=d.scrollHeight-window.innerHeight;
  docSpan=max>1?max:1;
}

/* ── The one frame loop ── */
function frame(now){
  rafId=window.requestAnimationFrame(frame);
  if(lenis){lenis.raf(now);}

  ptr.x+=(ptr.tx-ptr.x)*0.06;      /* parallax smoothing: cheap math only */
  ptr.y+=(ptr.ty-ptr.y)*0.06;

  tiltStep();

  var q=window.PORTFOLIO_QUASAR;
  if(q){
    q.setPointer(ptr.x,ptr.y);
    q.setDepth(docSpan>1?scrollTop()/docSpan:0);
    q.tick(now);
  }
  var t=window.PORTFOLIO_TELEMETRY;
  if(t&&t.tick){t.tick(now);}
}
function startLoop(){
  if(!looping){looping=true;rafId=window.requestAnimationFrame(frame);}
}
function stopLoop(){
  if(looping){looping=false;window.cancelAnimationFrame(rafId);}
}
function onPageMove(e){
  if(e.pointerType==='touch'){return;}
  ptr.tx=(e.clientX/Math.max(1,window.innerWidth))*2-1;
  ptr.ty=(e.clientY/Math.max(1,window.innerHeight))*2-1;
}

/* ── Lenis. autoRaf is off because this file drives it; anchors are on
      so same-page links route through the same smooth scroll. If Lenis
      is missing or throws, the page keeps native scrolling — which is
      also exactly what reduced motion gets. ── */
function initScroll(){
  if(lenis||reduced.matches||!window.Lenis){return;}
  try{
    lenis=new window.Lenis({
      autoRaf:false,
      lerp:0.1,
      smoothWheel:true,
      syncTouch:false,        /* touch keeps its native feel */
      wheelMultiplier:1,
      touchMultiplier:1.6,
      anchors:true
    });
    if(G&&ST&&lenis.on){lenis.on('scroll',ST.update);}
  }catch(e){lenis=null;}
}
function destroyScroll(){
  if(!lenis){return;}
  try{lenis.destroy();}catch(e){}
  lenis=null;
}

/* Programmatic scrolls must go through Lenis when it is active —
   window.scrollIntoView would desync its virtual position and the next
   wheel event would jump. js/mode.js routes every section jump here;
   the instant variant is used inside a View Transition so the "new"
   snapshot is already at the destination. */
function scrollToTarget(el,instant){
  if(!el||!el.getBoundingClientRect){return;}
  var headH=parseFloat(window.getComputedStyle(root).getPropertyValue('--head-h'))||56;
  if(lenis){
    try{
      lenis.scrollTo(el,{
        offset:-(headH+24),
        duration:instant?0:0.9,
        immediate:!!instant,
        force:true
      });
      return;
    }catch(e){}
  }
  try{
    el.scrollIntoView({block:'start',
      behavior:(instant||reduced.matches)?'auto':'smooth'});
  }catch(e){}
}

/* ── Magnetic cards. Armed only for pointer:fine + motion allowed.
      Each record pre-creates its GSAP quickTo setters once; the
      pointer handlers only store target numbers, and tiltStep() spends
      them in the frame loop — so a 120 Hz mouse still costs one
      transform write per card per frame. Rotation is clamped to 6° on
      figures and 4° on text rows; the glare position rides the
      --mouse-x/--mouse-y custom properties the same way. ── */
var TILT_SEL='.figure,.transmission,.case-file';

function focusQuasar(el){
  var q=window.PORTFOLIO_QUASAR;
  if(!q){return;}
  var r=el.getBoundingClientRect();
  var w=window.innerWidth,h=window.innerHeight;
  if(!h){return;}
  q.setFocus(((r.left+r.width/2)-w/2)/h,((h/2)-(r.top+r.height/2))/h,1);
}

function onTiltMove(rec){
  return function(e){
    if(!rec.live||e.pointerType==='touch'){return;}
    var r=rec.el.getBoundingClientRect();
    if(!r.width||!r.height){return;}
    rec.tx=((e.clientX-r.left)/r.width)*2-1;
    rec.ty=((e.clientY-r.top)/r.height)*2-1;
    rec.dirty=true;
  };
}
function onTiltEnter(rec){
  return function(e){
    if(!rec.live||e.pointerType==='touch'){return;}
    focusQuasar(rec.el);
  };
}
function onTiltLeave(rec){
  return function(){
    if(!rec.live){return;}
    rec.tx=0;rec.ty=0;rec.dirty=true;
    var q=window.PORTFOLIO_QUASAR;
    if(q){q.setFocus(0,0,0);}
  };
}

function armTilt(){
  if(tiltList.length||reduced.matches||!fine.matches||!G){return;}
  qsa(TILT_SEL).forEach(function(el){
    if(el.hasAttribute('data-tilt')){return;}
    el.setAttribute('data-tilt','');
    G.set(el,{transformPerspective:1200,transformStyle:'preserve-3d'});
    var rec={
      el:el,
      max:el.classList.contains('figure')?6:4,
      tx:0,ty:0,dirty:true,live:true,
      rx:G.quickTo(el,'rotationX',{duration:0.5,ease:'power3.out'}),
      ry:G.quickTo(el,'rotationY',{duration:0.5,ease:'power3.out'})
    };
    el.addEventListener('pointermove',onTiltMove(rec),{passive:true});
    el.addEventListener('pointerenter',onTiltEnter(rec),{passive:true});
    el.addEventListener('pointerleave',onTiltLeave(rec),{passive:true});
    tiltList.push(rec);
  });
}

function tiltStep(){
  for(var i=0;i<tiltList.length;i++){
    var r=tiltList[i];
    if(!r.dirty){continue;}
    r.dirty=false;
    /* The card leans its cursor-side toward the viewer: rotateX(+)
       sends the top away, so ty maps straight through; rotateY(+)
       sends the right away, hence the minus. */
    r.rx(r.ty*r.max);
    r.ry(-r.tx*r.max);
    r.el.style.setProperty('--mouse-x',(((r.tx+1)/2)*100).toFixed(1)+'%');
    r.el.style.setProperty('--mouse-y',(((r.ty+1)/2)*100).toFixed(1)+'%');
  }
}

function disarmTilt(){
  if(!tiltList.length){return;}
  tiltList.forEach(function(r){
    r.live=false;
    r.el.removeAttribute('data-tilt');
    if(G){
      try{G.set(r.el,{clearProps:'transform,rotationX,rotationY'});}catch(e){}
    }
    r.el.style.removeProperty('--mouse-x');
    r.el.style.removeProperty('--mouse-y');
  });
  tiltList=[];
}

/* ── Scroll reveals. Section-level and figure-level only — nesting
      deeper would animate the same pixel twice. immediateRender:false
      means nothing is ever pre-hidden: if ScrollTrigger never runs,
      the content is simply there. ── */
function armReveals(){
  if(!G||!ST||reduced.matches||revealTweens.length){return;}
  try{
    G.registerPlugin(ST);
    qsa('.signal-section, .archive-section, .figure').forEach(function(el){
      revealTweens.push(G.from(el,{
        opacity:0,y:26,duration:0.85,ease:'power3.out',immediateRender:false,
        scrollTrigger:{trigger:el,start:'top 90%',once:true}
      }));
    });
  }catch(e){revealTweens=[];}
}
function killReveals(){
  if(!revealTweens.length){return;}
  revealTweens.forEach(function(tw){
    try{
      if(tw.scrollTrigger){tw.scrollTrigger.kill();}
      var targets=tw.targets?tw.targets():[];
      tw.kill();
      if(G&&targets.length){G.set(targets,{clearProps:'opacity,transform'});}
    }catch(e){}
  });
  revealTweens=[];
}

/* ── Wiring ── */
function onPageMoveBound(e){onPageMove(e);}

function watchMode(){
  if(!window.MutationObserver){return;}
  try{
    new window.MutationObserver(function(){
      measure();
      var t=window.PORTFOLIO_TELEMETRY;
      if(t&&t.measure){t.measure();}
      if(ST&&ST.refresh){try{ST.refresh();}catch(e){}}
    }).observe(root,{attributes:true,attributeFilter:['data-mode','class']});
  }catch(e){}
}

function applyPref(){
  if(reduced.matches){
    destroyScroll();
    disarmTilt();
    killReveals();
    stopLoop();
  }else{
    initScroll();
    armTilt();
    armReveals();
    startLoop();
  }
}
if(reduced.addEventListener){
  reduced.addEventListener('change',applyPref);
}else if(reduced.addListener){
  reduced.addListener(applyPref);
}

function init(){
  measure();
  window.addEventListener('resize',measure,false);
  if(window.ResizeObserver){
    try{new window.ResizeObserver(measure).observe(document.body);}catch(e){}
  }
  window.addEventListener('pointermove',onPageMoveBound,{passive:true});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){stopLoop();}else{startLoop();}
  },false);
  watchMode();

  if(!reduced.matches){
    initScroll();
    armTilt();
    armReveals();
    startLoop();
  }
}

/* Read-only surface for js/mode.js and js/preloader.js. */
window.PORTFOLIO_MOTION={
  scrollTo:function(el,instant){scrollToTarget(el,instant);},
  refresh:function(){
    measure();
    var t=window.PORTFOLIO_TELEMETRY;
    if(t&&t.measure){t.measure();}
    if(ST&&ST.refresh){try{ST.refresh();}catch(e){}}
  },
  armed:function(){
    return {scroll:!!lenis,tilt:tiltList.length,reveals:revealTweens.length};
  }
};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
})();
