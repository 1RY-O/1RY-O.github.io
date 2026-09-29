/* ══════════════════════════════════════════════════════════════════════
   1RY · motion — Lenis momentum scrolling, GSAP kinetic reveals,
   magnetic physics, and the single requestAnimationFrame the site runs on.

   One loop, eight jobs, in this order every frame:
     1. lenis.raf(now)    — momentum scrolling (when armed);
     2. pointer smoothing — parallax + cursor trail + monolith targets,
                            lerped here, never in event handlers;
     3. cursor flush      — one transform write for the fluid cursor dot,
                            plus the spotlight position spent to CSS;
     4. monolith flush    — one hero 3D-tracking write (≤5° clamped);
     5. magnetic step     — nav pills + mode toggle lean toward the
                            cursor inside a ~40 px field (rAF-driven);
     6. tilt flush        — at most one transform write per armed card;
     7. parallax drift    — stage 0.1 / grid 0.4 / hero 1.3 offsets, spent
                            as --par-* custom props (cards ride native 1.0);
     8. quasar.tick       — the renderer reads the same frame number.

   Everything continuous happens inside that loop; pointermove, pointerleave
   and resize handlers only record numbers. GSAP is used for what GSAP is
   good at — elastic snap-back tweens, kinetic line-mask reveals, and
   ScrollTrigger (wired to Lenis through ScrollTrigger.update; no
   gsap.ticker — this file owns the only rAF).

   Kinetic text (Signal only): hero + project titles are split into
   line masks by a dependency-free splitter (no SplitText plugin on the
   asset budget) and rise with y:40 → 0, opacity 0 → 1, power4.out.
   The boot hero plays once from the preloader handoff via playBootReveal;
   below-fold titles play once via ScrollTrigger. Under reduced motion or
   without GSAP nothing is ever pre-hidden — content is simply there.

   Reduced motion is evaluated at load and again on change: it tears
   Lenis down, disarms magnets + tilt + reveals, stops the loop, and the
   CSS core replaces the renderer. Nothing here runs without JavaScript.
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
var mousePx={x:0,y:0};             /* last pointer position, CSS px */
var cursorDot=null,cursorOn=false;  /* fluid cursor element + armed flag */
var cur={x:-100,y:-100,tx:-100,ty:-100,qx:null,qy:null};  /* cursor trail */
var mono={rx:0,ry:0,trx:0,try_:0,hero:null,hx:-9999,hy:-9999,hw:1,hh:1,lastY:-1};  /* monolith 3D-tracking state + spotlight rect cache */
var spotEls=[];                     /* [el, style] pairs of hollow spotlight type */

/* ── God-tier mutation: spatial camera + zero-gravity gallery ──
   reads is the frame's ONLY layout-query surface: gather() fills it at
   the top of the loop and every step below reads from it, so no write
   is ever interleaved with a measurement (no layout thrash, 60 fps). */
var reads={y:0,vw:1,vh:1,hero:null,spot:[],box:null};
var cam={hp:0,el:null,gone:false};   /* hero crane state                  */
var gal=[];                         /* one record per scattered shard     */
var galVol=null;                    /* cached volume geometry (doc space) */
var galArmed=false,galTouched=0;
var PERSP=1100;                     /* focal length of the solved camera.
   The volume carries no CSS `perspective` on purpose: the projection is
   solved once here in JS (k = P/(P-z)) so the same numbers can drive hit
   testing. A CSS perspective on top would project the same point twice. */
var RISE=1400;                      /* scroll px to pull a shard -5000 → 0 */
var DEEP=-5000;                     /* the deep void a shard starts in    */
var GAL_MAG=110;                    /* magnetic intercept radius, px      */
var hor={wrap:null,flare:null,x:-999,y:-999,i:0,armed:false};
var HOR_D=[[-12,74],[26,112],[70,-16],[112,40]];   /* cubic Bézier, 0..100 space */
var portal={on:false,armed:false,timer:0};

/* ── Climate ignition ──
   Every project carries its own hex in the DOM (data-theme on the shard).
   The instant the orb is captured by one of them, that hex becomes the
   temperature of the entire page: the sapphire lens, the dial's jewel, the
   shard's edge light and the accretion field in WebGL all answer to it.
   It is written on the root — one style pass per snap, never per frame —
   and the same value is handed to quasar.js as u_theme for the starfield. */
var theme={on:'',owner:null};
function paintTheme(hex){
  hex=hex||'';
  if(theme.on===hex){return;}
  theme.on=hex;
  try{
    if(hex){root.style.setProperty('--theme',hex);}
    else{root.style.removeProperty('--theme');}
  }catch(e){}
  var q=window.PORTFOLIO_QUASAR;
  if(q&&q.setTheme){try{q.setTheme(hex);}catch(e){}}
}
var ripple={t:0,active:false};       /* click ripple 0..1, spent via quasar */
var magList=[];                   /* magnetic pills + toggle */
var tiltList=[];
var revealTweens=[];
var kineticArmed=false,bootPlayed=false;
var docSpan=1;
var parStage=null,parGrid=null,parHeros=[];  /* parallax layer handles */
var parCache=0;                               /* re-cache every ~250 ms */

/* Magnetic field: pull starts ~40 px outside the element edge. */
var MAG_RADIUS=40;
var MAG_PULL=0.35;                /* fraction of the cursor offset applied */

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

/* ── The one frame loop. Read pass first (gather), then nothing but
   writes: the GPU-facing steps consume reads.* and each owns exactly one
   style write per element per frame. Camera Z, zero-g drift, magnetic
   intercept, the horology flare and the portal all live in here — there
   is no second loop and no second clock. ── */
function frame(now){
  rafId=window.requestAnimationFrame(frame);
  if(lenis){lenis.raf(now);}

  gather(now);                      /* the frame's only layout queries   */

  ptr.x+=(ptr.tx-ptr.x)*0.06;      /* parallax smoothing: cheap math only */
  ptr.y+=(ptr.ty-ptr.y)*0.06;

  cursorStep();                     /* one transform write, trail weight */
  horStep(now);                     /* specular flare along the curve    */
  monoStep();                       /* one hero 3D-tracking write        */
  camStep();                        /* scroll Y becomes camera Z         */
  galleryStep(now);                 /* zero-g drift + intercept, 1 write */
  magStep();
  tiltStep();
  parStep(now);                     /* stage + grid depth tears only     */
  spotStep();                       /* light centres → hollow type       */

  var q=window.PORTFOLIO_QUASAR;
  if(q){
    q.setPointer(ptr.x,ptr.y);
    q.setDepth(docSpan>1?reads.y/docSpan:0);
    q.tick(now);
  }
}
function startLoop(){
  if(!looping){looping=true;rafId=window.requestAnimationFrame(frame);}
}
function stopLoop(){
  if(looping){looping=false;window.cancelAnimationFrame(rafId);}
}
function onPageMove(e){
  if(e.pointerType==='touch'){return;}
  mousePx.x=e.clientX;
  mousePx.y=e.clientY;
  cur.tx=e.clientX;cur.ty=e.clientY;
  /* Monolith targets: normalised cursor position mapped to ±5° of hero
     rotation. Only numbers are recorded — the loop spends them. */
  var nx=(e.clientX/Math.max(1,window.innerWidth))*2-1;
  var ny=(e.clientY/Math.max(1,window.innerHeight))*2-1;
  mono.try_=nx*5;
  mono.trx=-ny*3.5;
  ptr.tx=(e.clientX/Math.max(1,window.innerWidth))*2-1;
  ptr.ty=(e.clientY/Math.max(1,window.innerHeight))*2-1;
}

/* ── Fluid cursor: a glowing orb light source with fluid mass. The
      trail is deliberately heavy — quickTo duration 0.55s layered over
      a slow rAF lerp (0.14) — so the orb drags through the void like a
      lamp through dark water. quickTo setters are created once and
      cursorStep() spends the targets inside the single rAF (never in
      the pointer handler): exactly one transform write per frame, plus
      the spotlight position mapped to the hollow type. Over links,
      buttons, pills and cards it snaps to a large cyan orb (html.cursor-hot
      swaps the CSS); on press it compresses (html.cursor-down). Native
      cursor hides only via html.has-cursor on pointer:fine + motion allowed,
      so touch, keyboard and reduced-motion readers are untouched. */
function armCursor(){
  if(cursorOn||!fine.matches||reduced.matches){return;}
  try{
    cursorDot=document.createElement('div');
    cursorDot.className='cursor-dot';
    cursorDot.setAttribute('aria-hidden','true');
    document.body.appendChild(cursorDot);
    if(!G){cursorDot.style.display='none';return;}
    cur.qx=G.quickTo(cursorDot,'x',{duration:0.55,ease:'power3.out'});
    cur.qy=G.quickTo(cursorDot,'y',{duration:0.55,ease:'power3.out'});
    root.classList.add('has-cursor');
    cursorOn=true;
    var HOT='a,button,.signal-nav a,.mode-switch__btn,[data-tilt],.transmission';
    document.addEventListener('pointerover',function(e){
      if(e.pointerType==='touch'){return;}
      var hot=null;
      try{hot=e.target.closest?e.target.closest(HOT):null;}catch(err){hot=null;}
      root.classList.toggle('cursor-hot',!!hot);
    },false);
    document.addEventListener('pointerdown',function(e){
      if(e.pointerType==='touch'){return;}
      root.classList.add('cursor-down');
      fireRipple(e.clientX,e.clientY);
    },false);
    document.addEventListener('pointerup',function(){
      root.classList.remove('cursor-down');
    },false);
  }catch(e){cursorDot=null;cursorOn=false;}
}
function cursorStep(){
  if(!cursorOn||!cursorDot||!cur.qx||!cur.qy){return;}
  cur.x+=(cur.tx-cur.x)*0.14;         /* heavy fluid drag (with the 0.55s quickTo) */
  cur.y+=(cur.ty-cur.y)*0.14;
  try{cur.qx(cur.x);cur.qy(cur.y);}catch(e){}
}
/* ── gather(): the frame's READ PASS. Every layout query the frame needs
   is taken here, in one burst, before any step is allowed to write —
   reads and writes never interleave, which is what keeps a page full of
   transform writes off the forced-reflow path. Values land in `reads`
   and the step functions spend them. ── */
function gather(now){
  var y=scrollTop();
  reads.y=y;
  var w=window.innerWidth||1,h=window.innerHeight||1;
  if(w!==reads.vw||h!==reads.vh){        /* width change moves every authored
     volume coordinate: rebuild, but only on the frame it actually changes */
    reads.vw=w;reads.vh=h;
    if(galArmed){buildGallery();}
  }
  reads.hero=null;
  if(mono.hero&&mono.hw>1&&y===mono.lastY&&Math.abs(cur.x-mono.hx)<900){
    reads.hero={l:mono.hx,t:mono.hy,w:mono.hw,h:mono.hh};    /* cached frame */
  }else if(mono.hero){
    try{
      var r=mono.hero.getBoundingClientRect();
      mono.hx=r.left;mono.hy=r.top;mono.hw=r.width;mono.hh=r.height;mono.lastY=y;
      reads.hero={l:r.left,t:r.top,w:r.width,h:r.height};
    }catch(e){}
  }
  /* hollow spotlight type: one rect each, read here and spent by spotStep */
  var n=spotEls.length;
  for(var i=0;i<n;i++){
    var slot=reads.spot[i]||(reads.spot[i]={l:0,t:0,w:1});
    try{
      var er=spotEls[i][0].getBoundingClientRect();
      slot.l=er.left;slot.t=er.top;slot.w=er.width;
    }catch(err){}
  }
  reads.spot.length=n;
  /* the gallery volume is measured once and then tracked as pure math:
     document-space top minus this frame's scroll = viewport-space top */
  reads.box=galVol?{l:galVol.l,t:galVol.t-y,h:galVol.h}:null;
  reads.t=now;
}
/* Spotlight: the orb's smoothed position becomes the light centre of
   the hollow type. Positions come from gather(); this is writes only.
   effects.css unmasks a cyan fill through a radial mask centred there,
   so sweeping the light over outline type illuminates it. */
function spotStep(){
  if(!mono.hero||mono.hw<2){return;}
  try{
    root.style.setProperty('--spot-x',(cur.x-mono.hx).toFixed(0)+'px');
    root.style.setProperty('--spot-y',(cur.y-mono.hy).toFixed(0)+'px');
    /* Machined type needs the light as a RATIO, not just a point: the
       specular band that sweeps the milled face is positioned by where the
       orb sits across the glyph run (0 → 100% of its own box). */
    root.style.setProperty('--spec',(((cur.x-mono.hx)/mono.hw)*100).toFixed(1)+'%');
    for(var i=0;i<spotEls.length;i++){
      var s=spotEls[i][1],er=reads.spot[i];
      if(!s||!er){continue;}
      s.setProperty('--spot-x',(cur.x-er.l).toFixed(0)+'px');
      s.setProperty('--spot-y',(cur.y-er.t).toFixed(0)+'px');
      s.setProperty('--spec',(((cur.x-er.l)/Math.max(1,er.w))*100).toFixed(1)+'%');
    }
  }catch(e){}
}
/* Monolith 3D tracking: the hero h1 leans toward the cursor like a
   massive slab floating in the void — ±5° yaw, ±3.5° pitch, lerped
   slowly (0.07) for architectural weight and clamped hard. Targets are
   recorded in onPageMove; this spends them: one custom-prop write per
   frame, the composed transform in signal.css folds --par-hero and the
   rotations together. Settles to exactly 0 when the pointer rests. */
function monoStep(){
  if(root.getAttribute('data-mode')!=='signal'||reduced.matches){return;}
  if(!mono.hero){
    try{
      var h=document.querySelector('.shell--signal .signal-name');
      mono.hero=(h&&h.style)?h:null;
    }catch(e){mono.hero=null;}
    if(!mono.hero){return;}
  }
  mono.rx+=(mono.trx-mono.rx)*0.07;
  mono.ry+=(mono.try_-mono.ry)*0.07;
  if(mono.rx>3.5){mono.rx=3.5;}else if(mono.rx<-3.5){mono.rx=-3.5;}
  if(mono.ry>5){mono.ry=5;}else if(mono.ry<-5){mono.ry=-5;}
  try{
    mono.hero.style.setProperty('--hero-rx',mono.rx.toFixed(2)+'deg');
    mono.hero.style.setProperty('--hero-ry',mono.ry.toFixed(2)+'deg');
  }catch(e){}
}
function disarmCursor(){
  if(cursorDot&&cursorDot.parentNode){
    try{cursorDot.parentNode.removeChild(cursorDot);}catch(e){}
  }
  cursorDot=null;cursorOn=false;
  root.classList.remove('has-cursor','cursor-hot','cursor-down');
}

/* ── Spacetime ripple trigger. Origin maps client px to shader uv; the
      GSAP tween drives u_impactT 0→1 while quasar.tick() spends it inside
      the same rAF — no second loop, no ticker. */
function fireRipple(cx,cy){
  var q=window.PORTFOLIO_QUASAR;
  if(!q||!q.fireImpact||reduced.matches){return;}
  try{
    var w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
    var uvx=cx/w,uvy=1-cy/h;
    q.fireImpact(uvx,uvy);
    ripple.active=true;ripple.t=0;
    if(G&&q.setImpactT){
      var st={v:0};
      G.to(st,{v:1,duration:1.4,ease:'expo.out',
        onUpdate:function(){q.setImpactT(st.v);},
        onComplete:function(){ripple.active=false;}});
    }else{
      q.setImpactT(1);ripple.active=false;
    }
  }catch(e){}
}

/* ── Lusion-tier scroll parallax: spatial depth inside the one rAF.
      Layer factors — stage canvas 0.1 (deep background), schematic grid
      0.4 (tears against the field), hero type 1.3 (foreground floats up
      faster); project cards ride the native scroll at 1.0 so they stay
      the readable reference plane. scrollY is read ONCE per frame and all
      three offsets are pure transforms via --par-* props — no layout, no
      ScrollTrigger scrubbers, 60 fps locked. Offsets are clamped
      (stage ±90, grid ±160, hero ±220) so fast flings never separate the
      composition into gaps. Handles re-cache every ~250 ms, on resize and
      on mode switch; reduced motion kills the loop so nothing drifts. */
function cachePar(){
  try{
    var stage=document.querySelector('.signal-stage__canvas');
    parStage=(stage&&stage.style)?stage.style:null;
  }catch(e){parStage=null;}
  try{
    var grid=document.querySelector('.schematic');
    parGrid=(grid&&grid.style)?grid.style:null;
  }catch(e){parGrid=null;}
  parHeros=[];
  try{
    qsa('.shell--signal .signal-hero').forEach(function(el){
      if(el&&el.style){parHeros.push(el.style);}
    });
  }catch(e){}
  /* Spotlight + monolith targets rebuild here: cachePar runs on
     resize, mode switch and until first fill, so detached nodes from
     a re-render are never kept. spotStep()/monoStep() re-measure the
     fresh nodes on their next tick. */
  spotEls=[];
  try{
    qsa('.signal-name,.signal-name__line,.transmission__code,.signal-section__title')
      .forEach(function(el){
        if(el&&el.style){spotEls.push([el,el.style]);}
      });
  }catch(e){}
  mono.hero=null;mono.hw=-1;
}
function parStep(ms){
  if(reduced.matches){return;}
  if(root.getAttribute('data-mode')!=='signal'){return;}
  if(!parStage&&!parGrid&&!parHeros.length){
    if(ms-parCache<250){return;}
    parCache=ms;cachePar();return;
  }
  var y=reads.y;                     /* spent from gather(): parStep runs
     after the transform writes, so measuring here would flush layout */
  var st=y*0.1;if(st>90){st=90;}
  var gr=y*0.4;if(gr>160){gr=160;}
  try{
    if(parStage){parStage.setProperty('--par-stage',st.toFixed(1)+'px');}
    if(parGrid){parGrid.setProperty('--par-grid',gr.toFixed(1)+'px');}
  }catch(e){}
}
/* ══════════════════════════════════════════════════════════════════════
   GOD-TIER MUTATION · SPATIAL CAMERA (Lusion) — scroll Y becomes camera Z
   ──────────────────────────────────────────────────────────────────────
   The page stopped scrolling down. The Y axis is now spent as forward
   travel, and two things are driven by it inside the one rAF: the hero
   monolith is craned up and out of the way on an accelerating curve, and
   every shard of the shattered gallery is pulled out of deep
   translateZ(-5000px) toward the lens and then past it.

   The projection is solved here rather than left to a parent perspective
   because the camera sits at the viewport centre and the volume does not:
   k = P/(P−z) is the pinhole scale, and each shard's translate is derived
   so that its on-screen position IS the projection of its 3D position.
   One transform write per shard per frame — and the magnetic hit-test
   consumes the same numbers, so what the orb aims at is what the
   geometry says.
   ══════════════════════════════════════════════════════════════════════ */
function disarmCamera(){
  /* The loop is about to stop, and a frozen camera is worse than no
     camera: it would leave the title card at visibility:hidden (content
     the reader cannot reach) and the shards mid-flight. Return to base. */
  var host=cam.el||document.querySelector('.shell--signal');
  cam.gone=false;cam.hp=0;
  if(!host){return;}
  try{
    host.style.removeProperty('--cam-y');
    host.style.removeProperty('--cam-s');
    host.style.removeProperty('--cam-o');
    host.classList.remove('is-cam-gone');
  }catch(e){}
  if(mono.hero){try{mono.hero.style.removeProperty('--par-hero');}catch(e){}}
}
function camStep(){
  if(root.getAttribute('data-mode')!=='signal'){return;}
  var vh=reads.vh||window.innerHeight||1;
  var hp=reads.y/Math.max(1,vh*0.95);
  if(hp<0){hp=0;}else if(hp>1){hp=1;}
  cam.hp=hp;
  var lift=-Math.pow(hp,1.55)*vh*1.08;         /* up and out of frame     */
  var s=1-hp*0.44;                             /* shrinking as it recedes */
  var op=1-hp*hp*1.65;if(op<0){op=0;}
  if(!cam.el){
    try{cam.el=document.querySelector('.shell--signal');}catch(e){cam.el=null;}
  }
  if(cam.el){
    /* Written once, on the shell: custom properties inherit, so the
       monolith, the readout and the actions all crane away as one title
       card from three property writes instead of nine. */
    try{
      cam.el.style.setProperty('--cam-y',lift.toFixed(1)+'px');
      cam.el.style.setProperty('--cam-s',s.toFixed(3));
      cam.el.style.setProperty('--cam-o',op.toFixed(3));
    }catch(e){}
    var gone=op<0.03;
    if(gone!==cam.gone){cam.gone=gone;cam.el.classList.toggle('is-cam-gone',gone);}
  }
  if(mono.hero){         /* the monolith keeps a small counter-parallax inside the crane */
    try{mono.hero.style.setProperty('--par-hero',(hp*vh*0.14).toFixed(1)+'px');}catch(e){}
  }
}

/* ── The shattered gallery ──
   The grid is destroyed. Each transmission is absolutely positioned
   inside a tall 3D volume at authored coordinates (--gx/--gy, read once
   at build) and forward travel decides where it sits in Z. Drift is three
   out-of-phase sines per shard with per-shard frequency, amplitude and
   phase, so no two ever breathe together; amplitude collapses as a shard
   docks and dies completely while the orb holds it. */
var wide=window.matchMedia('(min-width:861px)');
function galNum(v,f){
  var n=parseFloat(v);
  return (n===n)?n:f;
}
/* Which shard owns this element, if any — the camera drives anything
   inside one, because a scroll plugin cannot know where a projected slab
   actually is. */
function galRecFor(el){
  for(var i=0;i<gal.length;i++){
    if(gal[i].el===el||(gal[i].el.contains&&gal[i].el.contains(el))){return gal[i];}
  }
  return null;
}
function buildGallery(){
  gal=[];galVol=null;
  var volEl=document.querySelector('.shell--signal .transmissions');
  if(reduced.matches||!wide.matches||!volEl){
    if(volEl){volEl.classList.remove('is-volume');}
    return;
  }
  var list=qsa('.shell--signal .transmissions > .transmission');
  if(!list.length){volEl.classList.remove('is-volume');return;}
  var i,el;
  for(i=0;i<list.length;i++){                 /* park first: a rect taken
     through last frame's transform would bake drift into the layout slot */
    try{list[i].style.removeProperty('--sh-t');}catch(e){}
  }
  var vol=list[0].parentNode;
  var styles=[];
  for(i=0;i<list.length;i++){styles.push(window.getComputedStyle(list[i]));}   /* READ */
  var vr=vol.getBoundingClientRect();                                            /* READ */
  if(vr.width<2||vr.height<2){return;}
  galVol={l:vr.left,t:vr.top+scrollTop(),w:vr.width,h:vr.height};
  var vh=window.innerHeight||1;
  for(i=0;i<list.length;i++){
    el=list[i];
    var r=el.getBoundingClientRect();                                            /* READ */
    if(r.width<2){continue;}
    var gx=galNum(styles[i].getPropertyValue('--gx'),6+(i%2)*52);
    var gy=galNum(styles[i].getPropertyValue('--gy'),8+i*22);
    var rec={
      el:el,style:el.style,
      ax:gx/100*galVol.w,ay:gy/100*galVol.h,   /* authored slot, volume px */
      w:r.width,h:r.height,
      dock:galVol.t+gy/100*galVol.h+r.height*0.5-vh*0.5,  /* scroll Y where it centres */
      ph:i*1.79+0.6,
      axA:15+(i*7)%11,axB:9+(i*5)%7,
      ayA:19+(i*11)%13,ayB:7+(i*3)%5,
      az:520+(i*211)%420,
      sxA:0.31+(i%3)*0.07,sxB:0.83+(i%2)*0.11,
      syA:0.24+((i+1)%4)*0.05,syB:0.67+(i%3)*0.09,
      sz:0.19+(i%2)*0.06,
      hot:0,want:0,dist:false,
      dir:(i%2)?-1:1,                          /* which flank it swings from */
      /* The volume is clipped to the shell's measure, so the flank a
         carousel card arrives from is always the one toward the middle:
         a shard thrown past its own edge would be cut off mid-approach. */
      toMid:(gx<50)?1:-1,
      theme:el.getAttribute('data-theme')||'',  /* climate hex, see render.js */
      taken:false,
      qh:null,
      /* The project code is revealed and flooded by the camera, not by
         ScrollTrigger: the trigger positions a scroll plugin caches at
         refresh go stale the moment this slab is projected 300 px out of
         its layout slot, and a stale trigger can strand a title at
         opacity 0. armKinetic hands the line masks over here. */
      code:el.querySelector('.transmission__code'),
      masks:null,kin:false,flooded:false
    };
    if(G){
      try{rec.qh=G.quickTo(rec,'hot',{duration:0.45,ease:'power3.out'});}
      catch(e){rec.qh=null;}
    }
    gal.push(rec);
  }
  /* The scatter only exists once it has been measured: signal.css keeps
     the stacked log until this class lands, so a page whose script never
     ran (or whose reader asked for less motion) is still a readable log. */
  volEl.classList.add('is-volume');
}

/* One pass, one write per shard: depth from forward travel, three
   out-of-phase sines of zero-gravity drift, the magnetic intercept, and
   the sapphire glare offset that tracks Z. Every number below comes out
   of reads.* — nothing here measures the document. */
function galleryStep(now){
  if(!gal.length){return;}
  if(root.getAttribute('data-mode')!=='signal'){return;}
  var box=reads.box;
  if(!box){return;}
  var vh=reads.vh||window.innerHeight||1;
  var vw=reads.vw||window.innerWidth||1;
  var t=(now||0)/1000,vpx=vw*0.5,vpy=vh*0.5;
  var q=window.PORTFOLIO_QUASAR,focus=false;
  for(var i=0;i<gal.length;i++){
    var rec=gal[i];
    /* ── depth from forward travel. Exponential approach: most of the
       5000 px happens in the first third of the window, so the shard
       lurches out of the void and settles at the lens. Past its window
       the camera outruns it — Z goes positive and it slides off frame
       the way a passed building does. */
    var raw=(reads.y-rec.dock+RISE)/RISE;
    if(raw<0){raw=0;}
    var app=1-Math.pow(1-Math.min(1,raw),2.4);
    var past=Math.min(1,Math.max(0,(raw-1)*0.8));
    var z=DEEP*(1-app)+((PERSP*0.62+5000)*past*0.30);
    /* ── the detent: inside 7.7% of scroll either side of this shard's
       dock, the zero-gravity drift is squeezed out of it. The slab stops
       dead in its slot — the click of a lever, not a float past. ─────── */
    var det=1-Math.min(1,Math.abs(raw-1)*13);
    var damp=(1-0.55*app)*(1-rec.hot)*(1-past*0.9)*(1-det*det*0.85);
    /* ── zero gravity: three out-of-phase sines per shard ────────────── */
    var dx=(Math.sin(t*rec.sxA+rec.ph)*rec.axA+Math.sin(t*rec.sxB+rec.ph*2.3)*rec.axB)*damp;
    var dy=(Math.cos(t*rec.syA+rec.ph*1.7)*rec.ayA+Math.sin(t*rec.syB+rec.ph*0.9)*rec.ayB)*damp;
    z+=Math.sin(t*rec.sz+rec.ph*0.6)*rec.az*damp*(1-past);
    if(z>PERSP*0.62){z=PERSP*0.62;}
    var k=PERSP/(PERSP-z);                       /* pinhole scale          */
    /* ── wandering hour: the slab rides an invisible carousel. It enters
       yawed 45° out of the deep field, off to the side, and turns to face
       the lens exactly as it docks. Yaw collapses on a square curve, so
       the last stretch of travel is pure Z — precision, not float. The
       lateral swing resolves on the same curve and always toward the
       middle of the volume: the stage is clipped to the shell's measure,
       and a card thrown past its own edge would be cut off mid-approach.
       Measured in vw because the stage it swings across is a viewport. ── */
    var turn=(1-app)*(1-app)*(1-past);
    var yaw=rec.dir*45*turn;
    var swing=rec.toMid*vw*0.16*turn;
    /* ── projected centre: what the orb aims at is what geometry says ─── */
    var lx=box.l+rec.ax+rec.w*0.5;               /* layout centre, z = 0   */
    var ly=box.t+rec.ay+rec.h*0.5;
    var sx=vpx+(lx-vpx)*k+dx+swing;              /* projected + drifting   */
    var sy=vpy+(ly-vpy)*k+dy;
    /* ── magnetic intercept: quickTo ramps `hot`, which kills the drift,
       pulls the slab toward the lens and drives its edge lighting ─────── */
    if(fine.matches&&!portal.on){
      var hw=rec.w*k*0.5,hh=rec.h*k*0.5;
      var mdx=cur.x-sx,mdy=cur.y-sy;
      var ox=Math.max(0,Math.abs(mdx)-hw),oy=Math.max(0,Math.abs(mdy)-hh);
      var want=(Math.sqrt(ox*ox+oy*oy)<=GAL_MAG)?1:0;
      if(want!==rec.want){
        rec.want=want;
        if(rec.qh){try{rec.qh(want);}catch(e){rec.hot=want;}}
        else{rec.hot=want;}
      }
    }else if(rec.want){
      rec.want=0;
      if(rec.qh){try{rec.qh(0);}catch(e){rec.hot=0;}}else{rec.hot=0;}
    }
    /* ── ignition: not a fade. The moment the orb is taken by a slab, that
       project's hex floods the environment, and it releases only when the
       capture itself releases. One root write, gated on the change. ───── */
    var taken=rec.want>0.5;
    if(taken!==rec.taken){
      rec.taken=taken;
      if(taken){theme.owner=rec;paintTheme(rec.theme);}
      else if(theme.owner===rec){theme.owner=null;paintTheme('');}
    }
    var hot=rec.hot;
    if(hot>0.02){
      sx+=(cur.x-sx)*0.24*hot;
      sy+=(cur.y-sy)*0.24*hot;
      if(!focus){
        focus=true;
        if(q&&q.setFocus){q.setFocus(sx/vw,1-sy/vh,0.9*hot);}
      }
    }
    /* ── sapphire glare: the specular band rides with depth, so a slab
       4000 px out catches the light at the far end of its travel; the
       horology flare is a real light source here, its distance to this
       shard decides how much of it ignites ───────────────────────────── */
    var ldx=hor.x-sx,ldy=hor.y-sy;
    var lit=Math.max(0,1-Math.sqrt(ldx*ldx+ldy*ldy)/820)*Math.max(0,hor.i);
    var glare=50+(z/DEEP)*34+((cur.x-sx)/(vw*0.5))*9+(ldx/(vw*0.5))*13+yaw*0.8;
    /* Fade: the approach brightens it, the fly-past dims it to a 0.16
       ghost — faintly present in the field, far enough under the 0.2
       threshold to drop its pointer hit box (is-distant). */
    var op=Math.min(1,app*1.5)*(1-past*0.84)+(hot*0.2);
    if(op>1){op=1;}
    var dist=op<0.2;
    if(dist!==rec.dist){rec.dist=dist;rec.el.classList.toggle('is-distant',dist);}
    /* ── the camera reveals what a scroll plugin cannot find: the title's
       line masks arrive as the slab reaches the lens, and its type floods
       solid while it is near enough to read (see buildGallery) ──────── */
    if(rec.masks&&!rec.kin&&app>0.42){
      rec.kin=true;
      try{G.to(rec.masks,{y:0,opacity:1,duration:0.9,ease:'power4.out',stagger:0.07});}
      catch(err){
        try{G.set(rec.masks,{clearProps:'opacity,transform'});}catch(e2){}
      }
    }
    var fl=app>0.62||hot>0.3;
    if(fl!==rec.flooded&&rec.code){
      rec.flooded=fl;
      try{rec.code.classList.toggle('type-flood',fl);}catch(e){}
    }
    try{
      /* Self-perspective, not a parent's: the pinhole that positions the
         slab is the one solved above, and a second perspective on the
         volume would multiply the two. perspective() inside this element's
         own list only ever affects its own yaw. */
      rec.style.setProperty('--sh-t',
        'translate3d('+(sx-lx).toFixed(1)+'px,'+(sy-ly).toFixed(1)+'px,0) '+
        'perspective(1150px) rotateY('+yaw.toFixed(2)+'deg) '+
        'rotate('+((cur.x-sx)/(vw*0.5)*2.2+Math.sin(t*rec.sxA*0.6+rec.ph)*0.8*damp).toFixed(2)+'deg) '+
        'scale('+(k*(1+0.07*hot)).toFixed(4)+')');
      rec.style.setProperty('--sh-o',op.toFixed(3));
      rec.style.setProperty('--sh-hot',hot.toFixed(3));
      rec.style.setProperty('--sh-lit',lit.toFixed(3));
      rec.style.setProperty('--sh-glare',glare.toFixed(1)+'%');
      rec.style.setProperty('--sh-elev',(k*(1+0.07*hot)).toFixed(3));
    }catch(e){}
  }
}
function armGallery(){
  if(galArmed){return;}
  galArmed=true;
  buildGallery();
}
function disarmGallery(){
  galArmed=false;
  for(var i=0;i<gal.length;i++){
    var rec=gal[i];
    try{
      rec.el.classList.remove('is-distant');
      rec.style.removeProperty('--sh-t');rec.style.removeProperty('--sh-o');
      rec.style.removeProperty('--sh-hot');rec.style.removeProperty('--sh-glare');
      rec.style.removeProperty('--sh-elev');rec.style.removeProperty('--sh-lit');
      if(rec.qh){rec.qh.kill();rec.qh=null;}
      /* a title the camera was still holding has to arrive now, plainly */
      if(rec.masks&&G){try{G.set(rec.masks,{clearProps:'opacity,transform'});}catch(e){}}
      if(rec.flooded&&rec.code){
        rec.flooded=false;
        try{rec.code.classList.remove('type-flood');}catch(e){}
      }
    }catch(e){}
  }
  if(theme.owner){theme.owner=null;paintTheme('');}
  gal=[];galVol=null;
  try{
    var v=document.querySelector('.shell--signal .transmissions');
    if(v){v.classList.remove('is-volume');}
  }catch(e){}
}

/* ── Luxury horology lighting ──
   A single massive curve cut across the background, like the studio
   sweep behind a macro watch plate, and one blinding specular travelling
   along it. Its intensity is published on the root as --hor-i, and every
   shard reads the same light through CSS: the sapphire band offset, the
   edge light and the card highlight all answer to one source. Injected
   here rather than in index.html because the light does not exist without
   the loop driving it. */
function bez3(u,a,b,c,d){
  var m=1-u;
  return m*m*m*a+3*m*m*u*b+3*m*u*u*c+u*u*u*d;
}
function armHorology(){
  if(hor.armed||reduced.matches){return;}
  var host=document.querySelector('.shell--signal');
  if(!host){return;}
  var P=HOR_D;
  var d='M '+P[0][0]+' '+P[0][1]+' C '+P[1][0]+' '+P[1][1]+', '+P[2][0]+' '+P[2][1]+', '+P[3][0]+' '+P[3][1];
  var wrap=document.createElement('div');
  wrap.className='horology';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML='<svg class="horology__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+
      '<path class="horology__curve" d="'+d+'"/>'+
      '<path class="horology__curve horology__curve--soft" d="'+d+'"/>'+
    '</svg>'+
    '<span class="horology__flare"></span>'+
    '<span class="horology__bounce"></span>';
  try{
    host.insertBefore(wrap,host.firstChild);
    hor.wrap=wrap;
    hor.flare=wrap.querySelector('.horology__flare');
    hor.bounce=wrap.querySelector('.horology__bounce');
    hor.armed=true;
  }catch(e){hor.armed=false;}
}
function disarmHorology(){
  if(!hor.armed){return;}
  hor.armed=false;
  if(hor.wrap&&hor.wrap.parentNode){
    try{hor.wrap.parentNode.removeChild(hor.wrap);}catch(e){}
  }
  hor.wrap=null;hor.flare=null;hor.bounce=null;
  hor.x=-999;hor.y=-999;hor.i=0;
  try{root.style.removeProperty('--hor-i');}catch(e){}
}
function horStep(now){
  if(!hor.armed){return;}
  if(root.getAttribute('data-mode')!=='signal'){return;}
  var t=(now||0)/1000;
  /* one pass every 17 s, plus a scroll lead so the sweep answers to
     forward travel instead of orbiting on its own clock */
  var u=((t/17)+(reads.y/Math.max(1,docSpan))*0.65)%1;
  var bump=0.5-0.5*Math.cos(u*Math.PI*2);
  var i=0.10+0.90*Math.pow(Math.sin(u*Math.PI),0.7);
  var x=bez3(u,HOR_D[0][0],HOR_D[1][0],HOR_D[2][0],HOR_D[3][0])/100*(reads.vw||1);
  var y=bez3(u,HOR_D[0][1],HOR_D[1][1],HOR_D[2][1],HOR_D[3][1])/100*(reads.vh||1);
  hor.x=x;hor.y=y;hor.i=i;
  try{
    root.style.setProperty('--hor-i',i.toFixed(3));
    if(hor.flare){
      hor.flare.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)'+
        ' rotate('+(-38+bump*76).toFixed(1)+'deg) scale('+(0.65+i*1.25).toFixed(3)+')';
    }
    if(hor.bounce){
      hor.bounce.style.transform='translate3d('+(reads.vw*0.5).toFixed(0)+'px,'+y.toFixed(1)+'px,0)'+
        ' scale('+(0.9+i*0.5).toFixed(3)+')';
    }
  }catch(e){}
}

/* ── The interstellar portal ──
   A click on a transmission is not a link press, it is an interception:
   navigation is held, u_portalT tears a hole in the starfield over
   1.5 s expo.inOut, and the route only fires once the frame is fully
   consumed. Nothing is intercepted under reduced motion, without GSAP,
   for in-page anchors, for modified clicks, or for mailto: — those keep
   their native behaviour, because a transition is not worth a lost
   mail message. */
function armPortal(){
  if(portal.armed){return;}
  portal.armed=true;
  document.addEventListener('click',onPortalClick,true);
}
function disarmPortal(){
  if(!portal.armed){return;}
  portal.armed=false;
  document.removeEventListener('click',onPortalClick,true);
  /* Arming is revoked by a preference change, and the screen may be mid
     tear at that exact moment: never leave a reader sealed inside a hole
     whose animation just stopped. */
  closePortal();
}
function onPortalClick(e){
  if(portal.on||reduced.matches||!G||e.defaultPrevented){return;}
  if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey){return;}
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
  if(!a){return;}
  var card=a.closest?a.closest('.transmission'):null;
  if(!card){return;}                       /* only projects tear the sky */
  var href=a.getAttribute('href')||'';
  if(href.charAt(0)==='#'||href.indexOf('mailto:')===0||href.indexOf('tel:')===0){return;}
  if(!/^https?:/i.test(href)){return;}
  e.preventDefault();
  e.stopPropagation();
  openPortal(a.href,card.getAttribute('data-theme'));
}
function openPortal(href,hex){
  portal.on=true;
  /* The void this tear opens is the project's own colour: the climate
     ignited by the capture is locked in for the crossing, so the iris
     floods with the same hex the lens took off the card. */
  if(hex){paintTheme(hex);}
  root.classList.add('is-portal');
  root.style.setProperty('--portal','0');
  if(lenis){try{lenis.stop();}catch(e){}}
  var q=window.PORTFOLIO_QUASAR;
  var st={t:0};
  try{if(document.activeElement&&document.activeElement.blur){document.activeElement.blur();}}catch(e){}
  try{
    G.to(st,{t:1,duration:1.5,ease:'expo.inOut',
      onUpdate:function(){
        if(q&&q.setPortal){q.setPortal(st.t);}
        root.style.setProperty('--portal',st.t.toFixed(3));
      },
      onComplete:function(){
        if(q&&q.setPortal){q.setPortal(1);}
        root.style.setProperty('--portal','1');
        try{window.location.assign(href);}
        catch(err){window.location.href=href;}
      }});
  }catch(err){
    try{window.location.assign(href);}catch(e2){}
  }
  /* If the navigation cannot happen (sandboxed preview, blocked target),
     the reader must not be sealed inside a black hole. */
  portal.timer=window.setTimeout(function(){closePortal();},4500);
}
function closePortal(){
  if(!portal.on){return;}
  window.clearTimeout(portal.timer);
  portal.on=false;
  root.classList.remove('is-portal');
  /* The crossing failed (sandboxed preview, blocked target): the
     environment returns to ambient light and the shard under the orb is
     free to ignite the climate again on the next frame. */
  if(theme.owner){theme.owner.taken=false;theme.owner=null;}
  paintTheme('');
  var q=window.PORTFOLIO_QUASAR;
  if(q&&q.setPortal){try{q.setPortal(0);}catch(e){}}
  root.style.setProperty('--portal','0');
  if(lenis){try{lenis.start();}catch(e){}}
}

/* ── Flood the hollow type: project + section titles fill solid cyan as
      they cross viewport centre (ScrollTrigger once each). Hero lines are
      excluded — the boot handoff owns them. */
function armFlood(){
  if(!G||!ST||reduced.matches){return;}
  try{
    G.registerPlugin(ST);
    qsa('.shell--signal .transmission__code, .shell--signal .signal-section__title').forEach(function(el){
      if(galRecFor(el)){return;}    /* inside a shard → galleryStep floods it */
      ST.create({trigger:el,start:'top 55%',end:'bottom 45%',
        onEnter:function(){el.classList.add('type-flood');},
        onEnterBack:function(){el.classList.add('type-flood');},
        onLeave:function(){el.classList.remove('type-flood');},
        onLeaveBack:function(){el.classList.remove('type-flood');}});
    });
  }catch(e){}
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
    if(ST){
      try{
        G.registerPlugin(ST);
        lenis.on('scroll',ST.update);
      }catch(e){}
    }
  }catch(e){lenis=null;}
}
function destroyScroll(){
  if(!lenis){return;}
  try{if(lenis.destroy){lenis.destroy();}}catch(e){}
  lenis=null;
}
function scrollToTarget(el,instant){
  if(!el){return;}
  try{
    if(lenis&&!instant&&!reduced.matches){lenis.scrollTo(el);return;}
  }catch(e){}
  try{el.scrollIntoView({behavior:instant||reduced.matches?'auto':'smooth',block:'start'});}catch(err){
    el.scrollIntoView();
  }
}

/* ── Magnetic jiggle: nav pills + mode toggle ──
      Within ~40 px of the element edge the element leans toward the
      cursor (a fraction of the offset, written once per frame from the
      loop — handlers only record the pointer). On leave the element
      snaps home with a heavy elastic spring, so it overshoots and
      settles like it has mass. Gated on pointer:fine + GSAP + motion
      allowed; without any of those the elements simply never move. */
function armMagnets(){
  if(!G||!fine.matches||reduced.matches||magList.length){return;}
  qsa('.signal-nav a, .mode-switch__btn').forEach(function(el){
    var rec={
      el:el,
      pull:{x:0,y:0},
      qx:null,qy:null,
      hot:false,
      snap:null
    };
    try{
      rec.qx=G.quickTo(el,'x',{duration:0.25,ease:'power3.out'});
      rec.qy=G.quickTo(el,'y',{duration:0.25,ease:'power3.out'});
    }catch(e){return;}
    el.addEventListener('pointerleave',function(){magRelease(rec);},false);
    el.addEventListener('blur',function(){magRelease(rec);},false);
    magList.push(rec);
  });
}
function magRelease(rec){
  rec.hot=false;
  rec.pull.x=0;rec.pull.y=0;
  if(!G){return;}
  try{
    if(rec.snap){rec.snap.kill();}
    /* Heavy elastic: overshoot, wobble, settle. quickTo setters are
       parked at 0 first so the spring owns the motion alone. */
    rec.qx(0);rec.qy(0);
    rec.snap=G.fromTo(rec.el,{x:G.getProperty(rec.el,'x'),y:G.getProperty(rec.el,'y')},
      {x:0,y:0,duration:0.9,ease:'elastic.out(1,0.4)',overwrite:'auto',
       onComplete:function(){rec.snap=null;}});
  }catch(e){}
}
function magStep(){
  if(!magList.length){return;}
  for(var i=0;i<magList.length;i++){
    var rec=magList[i];
    var r=rec.el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var dx=mousePx.x-cx, dy=mousePx.y-cy;
    /* Distance outside the edge: 0 while the pointer is over the box. */
    var ox=Math.max(0,Math.abs(dx)-r.width/2);
    var oy=Math.max(0,Math.abs(dy)-r.height/2);
    var outside=Math.sqrt(ox*ox+oy*oy);
    if(outside<=MAG_RADIUS){
      if(rec.snap){try{rec.snap.kill();}catch(e){}rec.snap=null;}
      rec.hot=true;
      var px=dx*MAG_PULL, py=dy*MAG_PULL;
      /* Clamp: the pill leans, it never chases the cursor off. */
      if(px>10){px=10;}else if(px<-10){px=-10;}
      if(py>8){py=8;}else if(py<-8){py=-8;}
      rec.pull.x=px;rec.pull.y=py;
      try{rec.qx(px);rec.qy(py);}catch(e){}
    }else if(rec.hot){
      magRelease(rec);
    }
  }
}
function disarmMagnets(){
  if(!magList.length){return;}
  magList.forEach(function(rec){
    try{if(rec.snap){rec.snap.kill();}}catch(e){}
    if(G){try{G.set(rec.el,{clearProps:'transform'});}catch(e){}}
  });
  magList=[];
}

/* ── Magnetic cards ──
      Each record pre-creates its GSAP quickTo setters once; the frame
      loop spends the stored targets (tiltStep) so 120 Hz pointer events
      collapse to one transform write per card per frame. focusin/out
      mirrors hover for keyboard readers. On release the slab eases home
      with an elastic spring — a wobble, not a snap — so the glass reads
      as a physical object with mass.
      When GSAP is absent the handlers still track hover for the shader
      focus well, but no transform is ever written. ── */
function armTilt(){
  if(!fine.matches||reduced.matches||tiltList.length){return;}
  qsa('[data-tilt]').forEach(function(el){
    var rec={
      el:el,rx:0,ry:0,trx:0,try_:0,tx:0,ty:0,live:true,
      qrx:null,qry:null,snap:null,
      focus:{fx:0.5,fy:0.5,fa:0}
    };
    if(G){
      try{
        rec.qrx=G.quickTo(el,'rotationX',{duration:0.5,ease:'power3.out'});
        rec.qry=G.quickTo(el,'rotationY',{duration:0.5,ease:'power3.out'});
      }catch(e){rec.qrx=null;rec.qry=null;}
    }
    el.addEventListener('pointermove',function(e){
      if(e.pointerType==='touch'){return;}
      var r=el.getBoundingClientRect();
      var px=(e.clientX-r.left)/Math.max(1,r.width);
      var py=(e.clientY-r.top)/Math.max(1,r.height);
      rec.try_=(px-0.5)*12;           /* ±6° clamp */
      rec.trx=(0.5-py)*8;             /* ±4° clamp */
      rec.tx=e.clientX;rec.ty=e.clientY;
    },false);
    el.addEventListener('pointerleave',function(){tiltRelease(rec);},false);
    el.addEventListener('focusin',function(){
      var r=el.getBoundingClientRect();
      rec.tx=r.left+r.width/2;rec.ty=r.top+r.height/2;
    },false);
    el.addEventListener('focusout',function(){tiltRelease(rec);},false);
    tiltList.push(rec);
  });
}
function tiltRelease(rec){
  rec.trx=0;rec.try_=0;
  rec.focus.fa=0;
  var q=window.PORTFOLIO_QUASAR;
  if(q&&q.setFocus){q.setFocus(0,0,0);}
  if(!G||!rec.qrx||!rec.qry){return;}
  try{
    if(rec.snap){rec.snap.kill();}
    /* Park the quickTo setters, then let one elastic tween own the
       return: overshoot past 0, wobble, settle. */
    rec.qrx(0);rec.qry(0);
    rec.snap=G.fromTo(rec.el,
      {rotationX:G.getProperty(rec.el,'rotationX'),rotationY:G.getProperty(rec.el,'rotationY')},
      {rotationX:0,rotationY:0,duration:1,ease:'elastic.out(1,0.45)',overwrite:'auto',
       onComplete:function(){rec.snap=null;}});
  }catch(e){}
}
function tiltStep(){
  if(!tiltList.length){return;}
  for(var i=0;i<tiltList.length;i++){
    var r=tiltList[i];
    if(!r.live){continue;}
    if(r.snap){continue;}              /* the spring owns the transform */
    var nx=r.rx+(r.trx-r.rx)*0.18;
    var ny=r.ry+(r.try_-r.ry)*0.18;
    if(Math.abs(nx-r.rx)<0.001&&Math.abs(ny-r.ry)<0.001){continue;}
    r.rx=nx;r.ry=ny;
    if(r.qrx&&r.qry){
      try{r.qrx(nx);r.qry(ny);}catch(e){}
    }
    var q=window.PORTFOLIO_QUASAR;
    if(q&&q.setFocus){
      var vx=r.tx/Math.max(1,window.innerWidth);
      var vy=1-r.ty/Math.max(1,window.innerHeight);
      q.setFocus(vx,vy,(Math.abs(nx)+Math.abs(ny))>0.15?0.85:0);
    }
    r.el.style.setProperty('--mouse-x',(((r.try_/12)+0.5)*100).toFixed(1)+'%');
    r.el.style.setProperty('--mouse-y',((0.5-(r.trx/8))*100).toFixed(1)+'%');
  }
}

function disarmTilt(){
  if(!tiltList.length){return;}
  tiltList.forEach(function(r){
    r.live=false;
    r.el.removeAttribute('data-tilt');
    try{if(r.snap){r.snap.kill();}}catch(e){}
    if(G){
      try{G.set(r.el,{clearProps:'transform,rotationX,rotationY'});}catch(e){}
    }
    r.el.style.removeProperty('--mouse-x');
    r.el.style.removeProperty('--mouse-y');
  });
  tiltList=[];
}

/* ── Kinetic text: dependency-free line splitter ──
      SplitText is a Club plugin — off the asset budget — so hero lines
      and project titles are split by this vanilla splitter instead. Each
      target keeps its authored <br> structure: every child that already
      forces its own line (the renderer's .signal-name__line spans) is one
      mask; any other target is split on words into row masks measured
      from offsetTop, so wraps become masks whatever the viewport is.
      Masks carry overflow:hidden; inner spans rise y:40 → 0 with
      power4.out — the liquid entrance. Splitting is idempotent
      (data-split="done") and re-runs on resize only for elements not yet
      played, so a played hero is never torn apart mid-read. */
function splitLines(el){
  if(!el||el.getAttribute('data-split')==='done'){return [];}
  var doc=el.ownerDocument||document;
  var masks=[];
  /* Authored lines (hero name spans): one mask each, order preserved. */
  var authored=el.querySelectorAll('.signal-name__line');
  if(authored.length){
    Array.prototype.forEach.call(authored,function(line){
      var mask=doc.createElement('span');
      mask.className='kinetic-mask';
      mask.setAttribute('aria-hidden','true');
      var inner=doc.createElement('span');
      inner.className='kinetic-line';
      inner.textContent=line.textContent;
      mask.appendChild(inner);
      line.textContent='';
      line.appendChild(mask);
      masks.push(inner);
    });
    el.setAttribute('data-split','done');
    return masks;
  }
  /* Generic path: words grouped into rows by measured offsetTop. */
  var text=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(!text){return [];}
  el.setAttribute('data-split','done');
  el.setAttribute('aria-label',text);
  var words=text.split(' ');
  el.textContent='';
  var spans=words.map(function(w){
    var s=doc.createElement('span');
    s.className='kinetic-word';
    s.textContent=w;
    el.appendChild(s);
    el.appendChild(doc.createTextNode(' '));
    return s;
  });
  var rows=[],cur=[],top=null;
  spans.forEach(function(s){
    var t=s.offsetTop;
    if(top===null||t!==top){
      if(cur.length){rows.push(cur);}
      cur=[s];top=t;
    }else{cur.push(s);}
  });
  if(cur.length){rows.push(cur);}
  rows.forEach(function(row){
    var mask=doc.createElement('span');
    mask.className='kinetic-mask';
    mask.setAttribute('aria-hidden','true');
    el.insertBefore(mask,row[0]);
    var inner=doc.createElement('span');
    inner.className='kinetic-line';
    row.forEach(function(w){inner.appendChild(w);inner.appendChild(doc.createTextNode(' '));});
    mask.appendChild(inner);
    masks.push(inner);
  });
  Array.prototype.forEach.call(el.childNodes,function(n){
    if(n.nodeType===3&&!n.textContent.trim()){el.removeChild(n);}
  });
  return masks;
}

function playMasks(masks,at){
  if(!G||!masks.length||reduced.matches){return null;}
  return G.fromTo(masks,{y:40,opacity:0},
    {y:0,opacity:1,duration:1.05,ease:'power4.out',stagger:0.09},at||0);
}

/* The boot hero: tag + name + lede rise as one liquid gesture, called
   from the preloader handoff so overlay-out and text-in stay in sync. */
function playBootReveal(){
  if(bootPlayed||reduced.matches){return;}
  bootPlayed=true;
  var scope=document.querySelector('.shell--signal');
  if(!scope||!G){
    root.classList.add('is-kinetic');
    return;
  }
  try{
    var groups=[];
    var tag=scope.querySelector('.signal-hero__tag');
    var name=scope.querySelector('.signal-name');
    var lede=scope.querySelector('.signal-hero__lede');
    if(tag){groups.push({masks:splitLines(tag),at:0});}
    if(name){groups.push({masks:splitLines(name),at:0.08});}
    if(lede){groups.push({masks:splitLines(lede),at:0.18});}
    var tl=G.timeline({defaults:{overwrite:'auto'}});
    groups.forEach(function(gr){
      var tw=playMasks(gr.masks,gr.at);
      if(tw){tl.add(tw,0);}
    });
    tl.add(function(){root.classList.add('is-kinetic');});
  }catch(e){root.classList.add('is-kinetic');}
}

/* Below-fold Signal titles: split now, rise once on scroll. Hero lines
   are excluded — the preloader handoff owns them. Titles hidden here
   are revealed by their own trigger; if ScrollTrigger never runs, the
   CSS fallback (.is-kinetic / no-JS) leaves them visible. */
function armKinetic(){
  if(!G||!ST||reduced.matches||kineticArmed){return;}
  kineticArmed=true;
  try{
    G.registerPlugin(ST);
    qsa('.shell--signal .signal-section__title, .shell--signal .transmission__code').forEach(function(el){
      var rec=galRecFor(el);          /* inside a shard → the camera owns it */
      var masks=splitLines(el);
      if(!masks.length){return;}
      G.set(masks,{y:40,opacity:0});
      if(rec){rec.masks=masks;return;}
      revealTweens.push(G.to(masks,{
        y:0,opacity:1,duration:1,ease:'power4.out',stagger:0.09,
        scrollTrigger:{trigger:el,start:'top 88%',once:true}
      }));
    });
  }catch(e){}
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
  if(!revealTweens.length&&!kineticArmed){return;}
  revealTweens.forEach(function(tw){
    try{
      if(tw.scrollTrigger){tw.scrollTrigger.kill();}
      var targets=tw.targets?tw.targets():[];
      tw.kill();
      if(G&&targets.length){G.set(targets,{clearProps:'opacity,transform'});}
    }catch(e){}
  });
  revealTweens=[];
  kineticArmed=false;
  qsa('[data-split="done"]').forEach(function(el){
    el.removeAttribute('data-split');
  });
}

/* ── Wiring ── */
function onPageMoveBound(e){onPageMove(e);}

function watchMode(){
  if(!window.MutationObserver){return;}
  try{
    new window.MutationObserver(function(){
      measure();cachePar();
      if(ST&&ST.refresh){try{ST.refresh();}catch(e){}}
      rebuildGallery();
    }).observe(root,{attributes:true,attributeFilter:['data-mode','class']});
  }catch(e){}
}
if(wide.addEventListener){
  wide.addEventListener('change',rebuildGallery);
}else if(wide.addListener){
  wide.addListener(rebuildGallery);
}

/* The arming order is load-bearing, so it lives in one function that both
   the boot path and the preference listener call: the volume must be
   measured BEFORE the type is split (armKinetic hands each project title's
   line masks to the shard that owns them, and a shard has to exist to
   receive them), and it must be measured AGAIN afterwards, because
   splitting a title can move the box the dock centre is computed from. */
function armVolume(){
  initScroll();
  armCursor();
  armMagnets();
  armTilt();
  armGallery();
  armKinetic();
  armFlood();
  armReveals();
  rebuildGallery();
}

function applyPref(){
  if(reduced.matches){
    destroyScroll();
    disarmCursor();
    disarmMagnets();
    disarmTilt();
    disarmPortal();
    disarmHorology();
    disarmGallery();
    disarmCamera();
    killReveals();
    stopLoop();
  }else{
    armVolume();
    armHorology();
    armPortal();
    cachePar();
    startLoop();
  }
}
/* The volume is authored in --gx/--gy percentages of its own box, so a
   width change, a mode swap or a re-render invalidates the cached
   geometry and the shards get re-measured from scratch. */
function rebuildGallery(){
  if(galArmed){buildGallery();}
}
if(reduced.addEventListener){
  reduced.addEventListener('change',applyPref);
}else if(reduced.addListener){
  reduced.addListener(applyPref);
}

function init(){
  measure();
  window.addEventListener('resize',function(){measure();cachePar();rebuildGallery();},false);
  if(window.ResizeObserver){
    try{new window.ResizeObserver(measure).observe(document.body);}catch(e){}
  }
  window.addEventListener('pointermove',onPageMoveBound,{passive:true});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){stopLoop();}else{startLoop();}
  },false);
  watchMode();

  if(!reduced.matches){
    armVolume();
    armHorology();
    armPortal();
    cachePar();
    startLoop();
  }
}

/* Read-only surface for js/mode.js and js/preloader.js. */
window.PORTFOLIO_MOTION={
  scrollTo:function(el,instant){scrollToTarget(el,instant);},
  playBootReveal:function(){playBootReveal();},
  refresh:function(){
    measure();cachePar();rebuildGallery();
    if(ST&&ST.refresh){try{ST.refresh();}catch(e){}}
  },
  /* the interstellar portal, callable on purpose as well as by click */
  portal:function(href){
    if(!href||reduced.matches||!G||portal.on){return false;}
    openPortal(href);return true;
  },
  untear:function(){closePortal();},
  armed:function(){
    return {scroll:!!lenis,cursor:cursorOn,magnets:magList.length,tilt:tiltList.length,reveals:revealTweens.length,ripple:ripple.active,gallery:gal.length,horology:hor.armed,portal:portal.armed,portalOpen:portal.on};
  }
};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
})();
