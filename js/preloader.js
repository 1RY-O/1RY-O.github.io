/* ══════════════════════════════════════════════════════════════════════
   1RY · preloader — drives the acquisition sequence and hands off.

   The counter is honest: each of the seven lines is a promise for
   something that truly happened, and the percentage never runs ahead of
   the milestones it has already cleared. Milestones, in order:

     1  parsing     — this document parsed (already true);
     2  type        — document.fonts.ready (2 s race — offline fonts
                      must never hold the page hostage);
     3  render      — mode.js finished rendering both experiences;
     4  assets      — near-viewport screenshots decoded (2 s race;
                      lazy off-screen images are not awaited);
     5  kernel      — js/quasar.js warm(): context, compile, link,
                      uniforms resolved, one frame presented;
     6  frame       — two more rAFs, so a frame was actually shown;
     7  lock        — the remaining slice of a 700 ms floor — a boot
                      sequence that flashes for 40 ms is a bug.

   Exit paths: natural completion, Skip, Escape/Tab/Enter/Space, any
   click on the overlay, or the 5 s hard timeout — every one of them
   converges on finish(). Reduced motion never gets here at all:
   js/boot.js only sets html.is-booting when motion is allowed.

   Selector list alert: REVEAL_SEL below is duplicated in
   css/boot.css (the html.is-booting hidden state). The two must agree —
   anything hidden there that is not animated here would stay hidden.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

/* Nothing to drive if boot.js decided there should be no sequence. */
if(!root.classList.contains('is-booting')){return;}

var G=window.gsap||null;
var MIN_MS=700;
var HARD_MS=5000;

var bootEl=document.querySelector('[data-boot]');
var steps=bootEl?Array.prototype.slice.call(bootEl.querySelectorAll('[data-step]')):[];
var pctEl=bootEl?bootEl.querySelector('[data-boot-pct]'):null;
var fillEl=bootEl?bootEl.querySelector('[data-boot-fill]'):null;
var taskEl=bootEl?bootEl.querySelector('[data-boot-task]'):null;
var skipBtn=bootEl?bootEl.querySelector('[data-boot-skip]'):null;

var target=0,shown=0,done=false,rafId=0,hardTimer=0;
var startedAt=(window.performance&&performance.now)?performance.now():Date.now();

function now(){
  return (window.performance&&window.performance.now)?performance.now():Date.now();
}
function timeout(ms){
  return new Promise(function(res){window.setTimeout(function(){res('timeout');},ms);});
}
function race(p,ms){return Promise.race([p,timeout(ms)]);}

/* ── Log line helpers. Labels live in the markup; this file only
      changes the state glyph and the duration. ── */
function labelOf(i){
  var t=steps[i]&&steps[i].querySelector('.boot__task');
  return t?t.textContent:'';
}
function markActive(i){
  var el=steps[i];
  if(!el){return;}
  el.classList.add('is-active');
  var s=el.querySelector('.boot__state');
  if(s){s.textContent='[ >> ]';}
  if(taskEl){taskEl.textContent=labelOf(i);}
}
function markDone(i,ms,failed){
  var el=steps[i];
  if(!el){return;}
  el.classList.remove('is-active');
  el.classList.add(failed?'is-failed':'is-done');
  var s=el.querySelector('.boot__state');
  if(s){s.textContent=failed?'[ !! ]':'[ OK ]';}
  var m=el.querySelector('.boot__ms');
  if(m){m.textContent=Math.round(ms)+'ms';}
}

/* ── The milestones ── */
function stepParse(){
  return Promise.resolve('parsed');
}

function stepFonts(){
  if(!document.fonts||!document.fonts.ready){return Promise.resolve('n/a');}
  return race(document.fonts.ready,2000);
}

function stepRendered(){
  if(window.PORTFOLIO_READY){return Promise.resolve('ready');}
  return new Promise(function(res){
    var t0=now();
    var iv=window.setInterval(function(){
      if(window.PORTFOLIO_READY||
         root.getAttribute('data-render')==='failed'||
         now()-t0>2500){
        window.clearInterval(iv);
        res('settled');
      }
    },40);
  });
}

function stepAssets(){
  var imgs=Array.prototype.slice.call(document.querySelectorAll('.shots img'))
    .filter(function(im){
      /* only what the reader is about to see; lazy, off-screen work
         is allowed to finish in the background after the handoff */
      return !im.complete&&im.getBoundingClientRect().top<window.innerHeight*1.5;
    });
  if(!imgs.length){return Promise.resolve('cached');}
  var all=Promise.all(imgs.map(function(im){
    return new Promise(function(res){
      im.addEventListener('load',res,{once:true});
      im.addEventListener('error',res,{once:true});
    });
  }));
  return race(all,2000);
}

function stepKernel(){
  var q=window.PORTFOLIO_QUASAR;
  if(!q||!q.warm){return Promise.resolve('css');}
  return race(q.warm(),2500);
}

function stepFrame(){
  return new Promise(function(res){
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(function(){res('presented');});
    });
  });
}

function stepLock(){
  var left=MIN_MS-(now()-startedAt);
  return new Promise(function(res){
    window.setTimeout(function(){res('locked');},left>0?left:0);
  });
}

/* Weights sum to 1.000 — the progress bar's total is not a guess. */
var PLAN=[
  {weight:0.06,run:stepParse},
  {weight:0.20,run:stepFonts},
  {weight:0.18,run:stepRendered},
  {weight:0.18,run:stepAssets},
  {weight:0.20,run:stepKernel},
  {weight:0.12,run:stepFrame},
  {weight:0.06,run:stepLock}
];

/* ── Counter. One rAF, easing toward the achieved target — it can
      approach a milestone but never pass it. Text and the rail's
      scaleX (--boot-p) are the only writes. ── */
function displayLoop(){
  if(done){return;}
  shown+=(target-shown)*0.18;
  if(target-shown<0.0005){shown=target;}
  if(pctEl){pctEl.textContent=(shown*100).toFixed(2);}
  if(fillEl){fillEl.style.setProperty('--boot-p',shown.toFixed(4));}
  rafId=window.requestAnimationFrame(displayLoop);
}

/* ── The chain. A rejecting step still advances: the boot must never
      stall on a loader, it can only report what happened. ── */
function runStep(i){
  if(done){return;}
  if(i>=PLAN.length){finish(false);return;}
  var s=PLAN[i];
  var t0=now();
  markActive(i);
  Promise.resolve()
    .then(function(){return done?'cancelled':s.run();})
    .then(function(){
      if(done){return;}
      markDone(i,now()-t0,false);
      target=Math.min(1,target+s.weight);
      runStep(i+1);
    },function(){
      if(done){return;}
      markDone(i,now()-t0,true);
      target=Math.min(1,target+s.weight);
      runStep(i+1);
    });
}

/* ── The choreographed reveal. This list is the JS half of a contract
      with the html.is-booting hidden state in css/boot.css — it is
      kept textually identical to that rule (mode shells included) so a
      diff between the two files shows any drift immediately. Without
      GSAP there is no stagger: removing html.is-booting alone reveals
      everything at once. ── */
var REVEAL_SEL=[
  '.shell--signal .signal-hero__tag',
  '.shell--signal .signal-name__line',
  '.shell--signal .signal-hero__lede',
  '.shell--signal .signal-actions',
  '.shell--signal .signal-readout',
  '.shell--signal .signal-nav',
  '.shell--archive .archive-masthead > *',
  '.shell--archive .archive-index',
  '.telemetry',
  '.site-foot'
];

function revealEls(){
  var out=[];
  REVEAL_SEL.forEach(function(sel){
    Array.prototype.push.apply(out,document.querySelectorAll(sel));
  });
  return out;
}

function rampReveal(dur){
  var q=window.PORTFOLIO_QUASAR;
  if(!q||!q.setReveal){return;}
  if(!G){q.setReveal(1);return;}
  var rev={v:0};
  G.to(rev,{
    v:1,duration:dur,ease:'power2.out',
    onUpdate:function(){q.setReveal(rev.v);},
    onComplete:function(){q.setReveal(1);}
  });
}

function refreshLayout(){
  var m=window.PORTFOLIO_MOTION;
  if(m&&m.refresh){m.refresh();}
}

/* ── Handoff ── */
function finish(instant){
  if(done){return;}
  done=true;
  window.clearTimeout(hardTimer);
  if(rafId){window.cancelAnimationFrame(rafId);rafId=0;}

  target=1;shown=1;
  if(pctEl){pctEl.textContent='100.00';}
  if(fillEl){fillEl.style.setProperty('--boot-p','1');}

  var animate=G&&!instant&&!reduced.matches&&!!bootEl;
  rampReveal(animate?1.4:0.7);          /* the field blooms as the
                                           overlay dissolves */
  refreshLayout();

  if(!animate){
    root.classList.remove('is-booting');
    root.setAttribute('data-boot','done');
    revealEls().forEach(function(el){
      el.style.opacity='';
      el.style.transform='';
    });
    return;
  }

  var tl=G.timeline();
  tl.to(bootEl.querySelector('.boot__panel'),
        {opacity:0,y:-16,duration:0.4,ease:'power3.out'},0)
    .to(bootEl,{opacity:0,duration:0.34,ease:'power2.out'},0.14)
    .add(function(){
      root.classList.remove('is-booting');
      root.setAttribute('data-boot','done');
      bootEl.style.opacity='';
    },0.48);

  var els=revealEls();
  if(els.length){
    tl.fromTo(els,{opacity:0,y:20},
      {opacity:1,y:0,duration:0.7,ease:'power3.out',stagger:0.045},0.16)
      .add(function(){
        /* hand the elements back to CSS: no inline styles left behind
           for the mode-switch reveal to fight with */
        G.set(els,{clearProps:'opacity,transform'});
      });
  }
}

/* ── Dismissal. Everything the reader can do to end the sequence
      lands here, and here only. ── */
function dismiss(){finish(true);}

function bindDismiss(){
  if(skipBtn){skipBtn.addEventListener('click',dismiss,false);}
  if(bootEl){
    bootEl.addEventListener('pointerdown',dismiss,false);
  }
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'||e.key==='Tab'||e.key==='Enter'||e.key===' '){
      dismiss();
    }
  },false);
}

/* ── Start ── */
var q=window.PORTFOLIO_QUASAR;
if(q&&q.setReveal){q.setReveal(0);}   /* the field must not be visible
                                         before its warm frame */
bindDismiss();
hardTimer=window.setTimeout(function(){finish(true);},HARD_MS);
displayLoop();
runStep(0);

})();
