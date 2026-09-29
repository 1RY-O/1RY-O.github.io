/* ══════════════════════════════════════════════════════════════════════
   1RY · preloader — drives the pure-flow sequence and hands off.

   The visual is abstract: a single glowing line expands while a pulse
   breathes behind it (css/boot.css, compositor-only animation, so it
   stays at 60 fps while the main thread decodes images and compiles
   the shader). Underneath, the counter is still honest — each of the
   seven milestones is a promise for something that truly happened,
   and the line never runs ahead of the milestones already cleared.
   Milestones, in order:

     1  parsing     — this document parsed (already true);
     2  type        — document.fonts.ready (2 s race — offline fonts
                      must never hold the page hostage);
     3  render      — mode.js finished rendering both experiences;
     4  assets      — near-viewport screenshots decoded (2 s race;
                      lazy off-screen images are not awaited);
     5  kernel      — js/quasar.js warm(): context, compile, link,
                      uniforms resolved, one frame presented;
     6  frame       — two more rAFs, so a frame was actually shown;
     7  lock        — the remaining slice of a 4000 ms floor — the corona
                      needs time to burn before the cinematic handoff.

   Exit paths: natural completion, Skip, Escape/Tab/Enter/Space, any
   click on the overlay, or the 8 s hard timeout — every one of them
   converges on finish(). Reduced motion never gets here at all:
   js/boot.js only sets html.is-booting when motion is allowed.

   The progress rAF below is transient: it lives only while the overlay
   is up and is cancelled inside finish(), before the handoff. After
   that, js/motion.js owns the single frame loop alone.

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
var MIN_MS=4000;               /* astro landing: the corona burns ~4 s      */
var HARD_MS=8000;              /* must exceed the floor with margin        */

/* Mirror Dimension shard engine: 18 glass shards (clip-path polygons)
   float in 3D while progress runs, then snap into a crystal ring.
   Deterministic pseudo-random from the shard index so every load stages
   the same fracture. All motion is spent in displayLoop() via --sh-*
   custom props; finish() removes every node so nothing outlives the
   overlay. */
var SHARD_COUNT=18;
var SHARD_CLIPS=[
  'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
  'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',
  'polygon(50% 0%,100% 100%,0% 100%)',
  'polygon(20% 0%,80% 0%,100% 100%,0% 100%)',
  'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
  'polygon(0% 15%,60% 0%,100% 60%,40% 100%,0% 80%)'
];
var shards=[],shardField=null,dropEl=null;
function hash01(i,s){var h=((i+1)*2654435761+(s+1)*40503)>>>0;h^=h>>15;h=(h*2246822519)>>>0;h^=h>>13;return (h>>>0)/4294967295;}
function buildShards(){
  if(!bootEl){return;}
  shardField=bootEl.querySelector('[data-boot-shards]');
  dropEl=bootEl.querySelector('[data-boot-drop]');
  if(!shardField){return;}
  try{
    var doc=shardField.ownerDocument||document;
    for(var i=0;i<SHARD_COUNT;i++){
      var el=doc.createElement('span');
      el.className='boot__shard';
      var size=26+Math.floor(hash01(i,1)*44);
      var ang=(i/SHARD_COUNT)*Math.PI*2;
      var rad=70+hash01(i,2)*120;
      shards.push({el:el,
        sx:Math.cos(ang)*rad,sy:Math.sin(ang)*rad*0.62,
        sz:(hash01(i,3)-0.5)*220,
        rx:hash01(i,4)*70-35,ry:hash01(i,5)*90-45,rz:hash01(i,6)*180-90,
        spin:(hash01(i,7)-0.5)*140,
        ring:96+hash01(i,8)*26,
        op:0.55+hash01(i,9)*0.45});
      el.style.setProperty('--sh-size',size+'px');
      el.style.setProperty('--sh-clip',SHARD_CLIPS[i%SHARD_CLIPS.length]);
      shardField.appendChild(el);
    }
  }catch(e){shards=[];}
}
function shardFrame(ms,prog){
  if(!shards.length){return;}
  var tt=ms/1000;
  var snap=(prog-0.72)/0.28;
  if(snap<0){snap=0;}else if(snap>1){snap=1;}
  snap=snap*snap*(3-2*snap);
  /* Aggressive ring spin: the drift rate more than triples as the snap
     closes, so the formation visibly whips into a crystal. */
  var spinAll=tt*(0.25+snap*2.6);
  /* Shatterseal anti-gravity drift: each shard breathes on its own slow
     clock (phase from index), levitating on Y and Z like a weapon
     fragment in a magnetic field. Amplitudes collapse as the snap takes
     over; the spin term below takes over the motion instead. */
  var glare=((tt*18)%100+100)%100;
  for(var i=0;i<shards.length;i++){
    var s=shards[i];
    var breatheY=Math.sin(tt*0.9+i*1.7)*14;
    var breatheZ=Math.sin(tt*0.7+i*2.3)*26;
    var hoverY=Math.sin(tt*1.3+i*0.9)*6;
    var a=(i/shards.length)*Math.PI*2+spinAll;
    var ringX=Math.cos(a)*s.ring,ringY=Math.sin(a)*s.ring;
    var k=1-snap;
    var x=s.sx*k+ringX*snap;
    var y=(s.sy+breatheY+hoverY)*k+ringY*snap;
    var z=(s.sz+breatheZ)*k+(snap*40);
    var wobbleRX=Math.sin(tt*0.6+i)*10;
    var wobbleRY=Math.sin(tt*0.45+i*1.3)*12;
    var rx=(s.rx+wobbleRX)*k+(spinAll*57.3+s.rz)*snap;
    var ry=(s.ry+wobbleRY+tt*8)*k+(spinAll*57.3)*snap;
    var rz=(s.rz+tt*s.spin*0.12)*k+(i*(360/shards.length)+spinAll*57.3)*snap;
    try{
      s.el.style.setProperty('--sh-x',x.toFixed(1)+'px');
      s.el.style.setProperty('--sh-y',y.toFixed(1)+'px');
      s.el.style.setProperty('--sh-z',z.toFixed(1)+'px');
      s.el.style.setProperty('--sh-rx',rx.toFixed(1)+'deg');
      s.el.style.setProperty('--sh-ry',ry.toFixed(1)+'deg');
      s.el.style.setProperty('--sh-rz',rz.toFixed(1)+'deg');
      s.el.style.setProperty('--sh-opacity',(s.op*(0.35+0.65*Math.min(1,prog*1.4))).toFixed(3));
      s.el.style.setProperty('--glare-p',glare.toFixed(1)+'% 0%');
    }catch(e){}
  }
  /* Charge the parent ring glow with the snap: dormant while drifting,
     radiating immense energy just before the droplet falls. */
  try{
    if(shardField){shardField.style.setProperty('--ring-glow',snap.toFixed(3));}
  }catch(e){}
}
function clearShards(){
  try{
    shards.forEach(function(s){if(s.el&&s.el.parentNode){s.el.parentNode.removeChild(s.el);}});
  }catch(e){}
  shards=[];
  if(shardField&&shardField.parentNode){try{shardField.parentNode.removeChild(shardField);}catch(e){}}
  if(dropEl&&dropEl.parentNode){try{dropEl.parentNode.removeChild(dropEl);}catch(e){}}
  shardField=null;dropEl=null;
}
var bootEl=document.querySelector('[data-boot]');
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

/* ── Honest progress, abstract display. Each milestone advances the
      target; the line eases toward it — never past it. Only a
      transform (scaleX via --boot-p) is written, so progress never
      triggers layout. ── */
function setTarget(f){target=Math.max(target,Math.min(1,f));}
function displayLoop(){
  if(done){return;}
  shown+=(target-shown)*0.08;
  if(target-shown<0.001){shown=target;}
  if(bootEl){bootEl.style.setProperty('--boot-p',shown.toFixed(4));}
  try{shardFrame(now(),Math.max(shown,target));}catch(e){}
  if(shown<1||target<1){
    rafId=window.requestAnimationFrame(displayLoop);
  }
}

function ready(){
  return root.getAttribute('data-render')==='ok'&&!!window.PORTFOLIO_READY;
}

/* Milestone weights — must sum to 1. */
var PLAN=[
  {w:0.10,run:function(){return Promise.resolve('parsed');}},
  {w:0.14,run:function(){
    try{
      var f=document.fonts;
      if(f&&f.ready){return race(f.ready.then(function(){return 'type';}),2000);}
    }catch(e){}
    return Promise.resolve('type-fallback');
  }},
  {w:0.16,run:function(){
    if(ready()){return Promise.resolve('render');}
    return new Promise(function(res){
      var t0=now();
      (function poll(){
        if(ready()){res('render');return;}
        if(now()-t0>3000){res('render-timeout');return;}
        window.setTimeout(poll,50);
      })();
    });
  }},
  {w:0.14,run:function(){
    try{
      var imgs=Array.prototype.slice.call(document.images||[]).filter(function(im){
        var r=im.getBoundingClientRect();
        return r.top<window.innerHeight*1.5&&r.bottom>-200;
      });
      if(!imgs.length){return Promise.resolve('no-assets');}
      return race(Promise.all(imgs.map(function(im){
        try{
          if(im.decode){return im.decode().catch(function(){return 'decoded-fallback';});}
        }catch(e){}
        return Promise.resolve('asset-fallback');
      })).then(function(){return 'assets';}),2000);
    }catch(e){return Promise.resolve('assets-fallback');}
  }},
  {w:0.22,run:function(){
    try{
      var q=window.PORTFOLIO_QUASAR;
      if(q&&q.warm){return race(q.warm(),3000);}
    }catch(e){}
    return Promise.resolve('kernel-fallback');
  }},
  {w:0.12,run:function(){
    return new Promise(function(res){
      window.requestAnimationFrame(function(){
        window.requestAnimationFrame(function(){res('frame');});
      });
    });
  }},
  {w:0.12,run:function(){
    var rest=MIN_MS-(now()-startedAt);
    if(rest<=0){return Promise.resolve('lock');}
    return timeout(rest);
  }}
];

function runStep(i){
  if(done){return;}
  if(i>=PLAN.length){finish(false);return;}
  var acc=0;
  for(var k=0;k<i;k++){acc+=PLAN[k].w;}
  var result;
  try{result=PLAN[i].run();}
  catch(e){result=Promise.resolve('failed');}
  Promise.resolve(result).then(function(){
    if(done){return;}
    setTarget(acc+PLAN[i].w);
    runStep(i+1);
  });
}

/* ── Handoff targets. A subset of the css/boot.css hidden list:
      the hero lines stay hidden until motion.js plays them kinetically
      (line masks, power4.out) via playBootReveal — see the .add() in
      finish(). Everything listed here crossfades on the same timeline.
      Without GSAP there is no stagger: removing html.is-booting alone
      reveals everything at once. ── */
var REVEAL_SEL=[
  '.shell--signal .signal-actions',
  '.shell--signal .signal-readout',
  '.shell--signal .signal-nav',
  '.shell--archive .archive-masthead > *',
  '.shell--archive .archive-index',
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

/* The cinematic handoff (scale 1.1 / y 100, expo.out, 1.5 s) is staged
   in finish() below. Play the kinetic hero through motion.js when ready;
   fall back to a plain stagger so the handoff never leaves text hidden. */
function playHero(animate){
  var m=window.PORTFOLIO_MOTION;
  if(animate&&m&&m.playBootReveal){m.playBootReveal();return true;}
  return false;
}

/* ── Cinematic handoff: the corona dissolves, the layout drops in
      One GSAP timeline so the crossfade is a single choreography —
      no dropped frames between overlay-out and content-in. ── */
/* The droplet (Resn vibe): at the handoff a glowing bead falls into
   the assembled ring and detonates the WebGL shockwave. Centre-screen
   origin maps to shader uv (0.5, 0.5). GSAP drives the bead; the ripple
   tween drives u_impactT 0->1 exactly like a click ripple. */
function dropShock(done){
  try{
    var q=window.PORTFOLIO_QUASAR;
    if(q&&q.fireImpact){q.fireImpact(0.5,0.5);}else{done();return;}
    var bead=dropEl;
    if(!G||!bead){if(q.setImpactT){q.setImpactT(1);}done();return;}
    G.set(bead,{opacity:1});
    /* Terminal-velocity fall: stretched 2x on Y with a heavy motion-blur
       trail (filter is on the bead only, one node, for 0.5 s). */
    try{bead.style.filter='blur(6px) brightness(1.6)';}catch(e){}
    G.fromTo(bead,{y:-120,scaleX:0.6,scaleY:1.2},{y:0,scaleX:0.85,scaleY:2,duration:0.5,ease:'expo.in',
      onComplete:function(){
        try{bead.style.filter='';}catch(e){}
        var st={v:0};
        G.to(st,{v:1,duration:1.4,ease:'expo.out',
          onUpdate:function(){if(q.setImpactT){q.setImpactT(st.v);}},
          onComplete:function(){
            try{G.to(bead,{opacity:0,scale:2.2,duration:0.4,ease:'power2.out'});}catch(e){}
            done();
          }});
      }});
  }catch(e){done();}
}
function finish(instant){
  if(done){return;}
  done=true;
  window.clearTimeout(hardTimer);
  if(rafId){window.cancelAnimationFrame(rafId);rafId=0;}

  target=1;shown=1;
  if(bootEl){bootEl.style.setProperty('--boot-p','1');}

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
    playHero(false);
    clearShards();
    return;
  }

  try{shardFrame(now(),1);}catch(e){}
  dropShock(function(){});
  var flow=bootEl.querySelector('[data-boot-flow]');
  var tl=G.timeline();
  tl.to(flow||bootEl,
        {opacity:0,y:-18,duration:0.45,ease:'power3.out'},0)
    .to(bootEl,{opacity:0,duration:0.4,ease:'power2.out'},0.16)
    .add(function(){
      root.classList.remove('is-booting');
      root.setAttribute('data-boot','done');
      bootEl.style.opacity='';
      if(flow){flow.style.opacity='';flow.style.transform='';}
      clearShards();
    },0.56);

  var els=revealEls();
  if(els.length){
    tl.fromTo(els,{opacity:0,y:100,scale:1.1},
      {opacity:1,y:0,scale:1,duration:1.5,ease:'expo.out',stagger:0.08},0.2)
      .add(function(){
        /* hand the elements back to CSS: no inline styles left behind
           for the mode-switch reveal to fight with */
        G.set(els,{clearProps:'opacity,transform'});
      });
  }
  /* The hero rises out of its masks on the same timeline position —
     overlay-out and text-in are one gesture. */
  tl.add(function(){playHero(true);},0.25);
}

/* ── Dismissal. Everything the reader can do to end the sequence
      lands here, and here only. ── */
function dismiss(){finish(true);}

function bindDismiss(){
  if(skipBtn){skipBtn.addEventListener('click',dismiss,false);}
  if(bootEl){
    bootEl.addEventListener('click',dismiss,false);
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
if(bootEl){bootEl.style.setProperty('--boot-p','0');}
try{buildShards();}catch(e){}
bindDismiss();
hardTimer=window.setTimeout(function(){finish(true);},HARD_MS);
displayLoop();
runStep(0);

})();
