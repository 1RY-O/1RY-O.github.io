/* ══════════════════════════════════════════════════════════════════════
   1RY · quasar — The Signal's celestial renderer (raw WebGL2, one pass).

   One fullscreen triangle, one fragment shader: a twin-dragon plasma
   void — two counter-rotating volumetric vortices raymarched through
   3D fBm in a cylindrical domain — behind a tilted accretion disk with
   shearing streaks, volumetric rays, a pulse ring, a chromatic core,
   a starfield, and a gravitational well that leans toward whichever
   transmission is under the pointer. A click opens an event horizon:
   the field is spaghettified into it and the frame is driven to
   analytically pure black, which is the exact moment motion.js routes.

   POWERHOUSE OVERDRIVE (29 Sep 2026) — what changed and what did not:
   the context is now requested as `webgl2` first (WebGL 1 second, CSS
   core last). The shader source stays GLSL ES 1.00 so that BOTH
   contexts compile the same bytes — there is no second source to drift
   out of sync, and the WebGL 1 path keeps every pixel of the design.
   Volume cost is bounded by compile-time #defines (march steps and fBm
   octaves, picked from a device tier at warm()) plus a runtime
   pixel-budget governor — never by a loop the compiler cannot count.
   The software sniff inside createContext() reads the *unmasked* adapter
   name, because the masked RENDERER is "WebKit WebGL" on every Chromium
   build and matches no software signature (see the note there).

   Why raw WebGL and not Three.js — the answer is now legal as well as
   measured. This document ships a meta CSP of `script-src 'self'` with
   `connect-src 'none'` (index.html): a CDN copy of three.js can be
   neither script-loaded nor fetch-imported under it, so "load Three
   from a CDN" is not a slower option here, it is a dead one. The
   alternative is vendoring it, and the measured cost is ~339 KB (plus a
   381 KB core) for a scene that is one triangle and one shader — about
   179 KB gzipped to draw a quad, with ESM-only loading that would
   reorder the script plan and the boot handshake. Raw gets the same
   pixels for zero bytes and keeps the DPR cap, the frame governor and
   the failure path in one readable place. Bring the library in the day
   the Signal needs meshes, glTF or a real post-processing chain — and
   vendor it, never CDN it.

   Contract with the rest of the site (unchanged):
     · never runs under prefers-reduced-motion — the CSS core on
       .signal-stage is the static, contrast-measured substitute;
     · owns no animation loop: js/motion.js calls tick(now) inside its
       single requestAnimationFrame, and stops calling it when the tab
       is hidden;
     · renders nothing while html[data-mode] is archive;
     · u_portalT and u_impactT arrive from motion.js's tweens — quasar
       owns no timing, only pixels;
     · every failure path resolves to the CSS core. No dialogs, no
       console noise, no half-initialised canvas.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── Shaders. ES 1.00 only: no #version, no texture(), no int ops —
      the same source compiles on WebGL 1 and on WebGL 2 contexts. ── */
var VERT=`
attribute vec2 a_pos;
void main(){gl_Position=vec4(a_pos,0.0,1.0);}
`;

var FRAG=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

/* Volume cost is a compile-time constant, not a uniform read per pixel:
   the march loop and the octave loop must be countable by the compiler
   on every GLSL ES 1.00 implementation it may meet. warm() picks the
   tier from the renderer and the buffer area, then substitutes. */
#define VOL_STEPS @@STEPS@@
#define VOL_OCT   @@OCT@@

uniform vec2 u_res;       /* drawing-buffer size in px                    */
uniform float u_time;     /* seconds since the kernel warmed              */
uniform vec2 u_pointer;   /* -1..1, lerped in motion.js before it lands   */
uniform float u_depth;    /* 0..1 scroll depth — lifts the core           */
uniform float u_reveal;   /* 0..1 boot ramp: the field arrives, not pops  */
uniform vec2 u_focus;     /* hovered card centre, uv space                */
uniform float u_focusAmt; /* 0..1 gravitational-well strength             */
uniform float u_quality;
uniform vec2 u_impact;    /* click origin, uv space */
uniform float u_impactT;  /* 0..1 wavefront, GSAP-driven from motion.js */
uniform float u_portalT;  /* 0..1 interstellar tear, GSAP-driven from motion.js */
uniform vec3  u_theme;    /* ignited project hex, 0..1 per channel             */
uniform float u_themeI;   /* climate intensity — may exceed 1: see tick()      */

const vec3 CYAN=vec3(0.482,0.906,1.000);
const vec3 VIOLET=vec3(0.663,0.580,1.000);
const vec3 WHITE=vec3(0.955,0.977,1.000);
const vec3 INK=vec3(0.027,0.039,0.071);

/* The two dragon anchors, in the volume's own screen space, and the
   depth of slab marched through them. Constants, not uniforms, so the
   early-reject spheres fold. They sit either side of the accretion core
   at (0.0,-0.34): the core burns between the dragons, it does not
   compete with them. */
const vec2 DA=vec2(-0.455,0.052);
const vec2 DB=vec2(0.455,-0.052);
const float VOL_FAR=2.70;

float hash21(vec2 p){
  p=fract(p*vec2(234.34,435.345));
  p+=dot(p,p+34.23);
  return fract(p.x*p.y);
}
float hash13(vec3 p){
  p=fract(p*0.1031);
  p+=dot(p,p.zyx+31.32);
  return fract((p.x+p.y)*p.z);
}
float vnoise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash21(i);
  float b=hash21(i+vec2(1.0,0.0));
  float c=hash21(i+vec2(0.0,1.0));
  float d=hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<4;i++){
    v+=a*vnoise(p);
    p=p*2.03+vec2(1.7,9.2);
    a*=0.5;
  }
  return v;
}
/* ── 3D value noise ──
   Eight hashed corners, smoothstepped. The 2D fbm above could not carry
   a vortex: a vortex needs a third axis so that neighbouring depth
   planes disagree, and it is that disagreement — not blur, not opacity —
   that reads as volume instead of as a painted decal. */
float vnoise3(vec3 p){
  vec3 i=floor(p),f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash13(i);
  float b=hash13(i+vec3(1.0,0.0,0.0));
  float c=hash13(i+vec3(0.0,1.0,0.0));
  float d=hash13(i+vec3(1.0,1.0,0.0));
  float e=hash13(i+vec3(0.0,0.0,1.0));
  float g=hash13(i+vec3(1.0,0.0,1.0));
  float h=hash13(i+vec3(0.0,1.0,1.0));
  float k=hash13(i+vec3(1.0,1.0,1.0));
  float x0=mix(a,b,f.x),x1=mix(c,d,f.x),x2=mix(e,g,f.x),x3=mix(h,k,f.x);
  return mix(mix(x0,x1,f.y),mix(x2,x3,f.y),f.z);
}
float fbm3(vec3 p){
  float v=0.0,a=0.5;
  for(int i=0;i<VOL_OCT;i++){
    v+=a*vnoise3(p);
    p=p*2.04+vec3(1.7,9.2,4.3);
    a*=0.5;
  }
  return v;
}
/* ── Twin dragons ──
   A plasma vortex, sampled in its own cylindrical domain. The angle
   around the axis is sheared by depth and by time, so the noise is wound
   into filaments and the column turns as a body while its surface boils;
   the ridged term turns |n| into threads instead of blobs and the two-arm
   term folds those threads into a spiral that winds outward at a rate
   the eye can follow. The throat is a funnel — dense on the axis, spent
   two radii out. dir alone makes the pair opposing.
   turb is the climate: an ignited hex tightens the filaments and raises
   the boil, so a capture does not merely recolour the void, it excites
   it. */
float dragon(vec2 q,float z,float dir,float t,float turb){
  float r=length(q*vec2(1.0,0.86));
  float a=atan(q.y,q.x);
  float w=a+dir*(z*1.42+t*0.30);
  float n=fbm3(vec3(w*1.30,r*3.4-t*0.05,z*1.75-t*dir*0.14)*(1.0+turb*0.42));
  float rid=clamp(1.0-abs(n*2.0-1.0),0.0,1.0);
  float arms=0.5+0.5*cos(w*2.0+r*5.6-t*dir*1.10);
  float throat=exp(-pow(max(r,0.0001)*1.95,1.60));
  return rid*rid*(0.34+0.92*arms)*throat;
}
/* One march evaluates both dragons at the same samples, so they
   interleave and occlude inside a single accumulation. A sample outside
   a dragon's radius costs one dot and one compare instead of a whole
   noise octet — and that is most of the frame, which is how a void with
   this much structure is affordable at 60 Hz. The slab is screen-anchored
   and every depth plane is scaled a little further inward, so the volume
   has genuine parallax against the pointer instead of sliding as one
   sheet. Sample positions arrive already warped by the portal, which is
   what makes the plasma fall into the tear rather than being painted
   over it. */
vec3 plasma(vec2 sp,float t,float turb,float bloom,vec3 cA,vec3 cB){
  vec3 acc=vec3(0.0);
  float ds=VOL_FAR/float(VOL_STEPS);
  float jit=hash21(gl_FragCoord.xy*0.537+vec2(t*0.71,2.7));
  for(int i=0;i<VOL_STEPS;i++){
    float z=(float(i)+0.42+jit*0.9)*ds;
    vec2 pp=sp*(1.0-z*0.125)+u_pointer*(z*0.030);
    vec2 qa=pp-DA;
    if(dot(qa,qa)<0.92){
      float da=dragon(qa,z,1.0,t,turb);
      acc+=cA*(da*0.55+pow(max(da,0.0001),3.0)*2.30);
    }
    vec2 qb=pp-DB;
    if(dot(qb,qb)<0.92){
      float db=dragon(qb,z,-1.0,t,turb);
      acc+=cB*(db*0.50+pow(max(db,0.0001),3.0)*2.05);
    }
  }
  return acc*ds*bloom*(0.32+0.68*u_quality);
}

void main(){
  float h=max(u_res.y,1.0);
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/h;
  vec2 field=uv+u_pointer*0.055;

  /* Gravitational-wave ripple: an expanding refractive ring fired by
     click. u_impactT sweeps 0..1 (GSAP, from motion.js); the front
     travels outward from u_impact while amplitude decays, bending the
     starfield and disk like spacetime around the wave. */
  {
    vec2 rip=field-u_impact;
    float r=length(rip)+1e-4;
    float front=u_impactT*1.6;
    float band=exp(-(r-front)*(r-front)*81.0);
    float atten=(1.0-u_impactT)*(1.0-u_impactT);
    field-=(rip/r)*band*atten*0.22;
  }

  /* Interstellar portal: u_portalT tears a black hole open at the centre
     of the field. Every pixel outside the horizon falls inward — the
     radial coordinate is compressed exponentially while the angle is
     dragged, and the starfield grid is stretched anisotropically along
     the fall direction. That is literal spaghettification: radial
     wavelength grows, tangential wavelength shrinks. Driven 0→1 by GSAP
     from motion.js; by t=1 the horizon outruns the screen diagonal and
     the frame is consumed, which is when motion.js routes the DOM. */
  float pt=u_portalT;
  float hz=pt*pt*1.70;            /* iris aperture radius, uv units (see below) */
  vec2 wuv=uv;                    /* warped uv — the starfield samples it  */
  if(pt>0.003){
    float pr0=length(uv)+1e-5;
    vec2 dir=uv/pr0;
    vec2 perp=vec2(-dir.y,dir.x);
    float sw=1.0-1.0/(1.0+pr0*4.0);            /* 0 far field → 1 at the hole */
    float rad=max(pr0-hz,0.0);
    float nr=hz+rad*mix(1.0,0.26,pt*sw);       /* exponential infall          */
    float ang=atan(uv.y,uv.x)-pt*sw*5.2;       /* frame dragging, ~300° at 1  */
    vec2 inf=vec2(cos(ang),sin(ang))*nr;
    float fr=dot(inf,dir),ft=dot(inf,perp);
    float stretch=1.0+pt*sw*7.5;
    wuv=vec2(fr/stretch,ft*(0.34+stretch*0.86));
    field+=(wuv-uv)*pt*1.15;                   /* the disk bends into the tear */
  }

  /* the core rides just above the horizon line and lifts as the
     reader descends the document */
  vec2 core=vec2(0.0,-0.34+u_depth*0.10);
  vec2 d=field-core;

  /* discovery: a hovered transmission dents the field toward itself */
  vec2 toF=u_focus-field;
  float well=exp(-dot(toF,toF)*7.0)*u_focusAmt;
  d+=toF*well*0.35;

  float r=length(d);
  r=mix(r,0.05+r*0.72,0.5*exp(-r*3.5));   /* gravitational lensing */
  float ang=atan(d.y,d.x);
  float t=u_time;

  /* tilted accretion disk (~17 deg) with shearing streaks */
  vec2 e=vec2(d.x*0.955+d.y*0.296,-d.x*0.296+d.y*0.955);
  vec2 dp=vec2(e.x,e.y*3.2);
  float dr=length(dp);
  float band=(dr-0.155)/0.070;
  float ring=exp(-band*band);
  float streak=fbm(vec2(ang*2.0+t*0.20,dr*6.0-t*0.12));
  float disk=ring*(0.30+0.95*streak)*(1.0-smoothstep(0.24,0.30,dr));

  /* volumetric rays, fading outward */
  float rays=fbm(vec2(ang*3.0+t*0.05,1.7+r*2.4))*exp(-r*2.8);

  /* the heartbeat: one ring leaves the core every ~4.5 s */
  float pulse=fract(t*0.22);
  float q=(r-(0.05+pulse*0.75))/0.028;
  float ring2=exp(-q*q)*(1.0-pulse);

  /* chromatic core: the three channels fall off at slightly different
     radii, which reads as spectral leakage around the light */
  float ca=max(r*0.9,0.0);
  vec3 core3=vec3(exp(-(ca+0.012)*11.0),exp(-ca*11.0),exp(-max(ca-0.012,0.0)*11.0));
  float halo=exp(-r*3.2);

  /* starfield; density follows the quality budget. Sampled through the
     portal warp, so the stars stretch into radial threads as the tear
     opens instead of simply dimming. */
  vec2 st=wuv*64.0;
  vec2 idp=floor(st);
  float hn=hash21(idp);
  float on=step(0.994-0.004*u_quality,hn);
  vec2 sf=fract(st)-0.5;
  float star=on*(1.0-smoothstep(0.0,0.34,length(sf)));
  star*=0.55+0.45*sin(t*1.6+hn*47.0);

  /* ── deep field: a domain-warped dust bed the dragons burn through.
     Two fbm fields warp a third; at four octaves it is the cheapest
     large structure in the shader, and it is what stops the void reading
     as flat black in the gaps between the vortices. */
  vec2 nw=vec2(fbm(field*2.10+vec2(t*0.018,-t*0.013)),
               fbm(field*2.10-vec2(t*0.015,t*0.021)));
  float dust=pow(clamp(fbm(field*3.05+nw*0.85),0.0,1.0),2.30);

  /* ── the twin dragons ──
     Marched through the portal-warped field (wuv), so when the tear
     opens the plasma is already falling: the samples pile up at the
     horizon with everything else instead of being switched off.
     u_themeI is allowed to overshoot 1 — tick() runs it on a damped
     spring, not a lerp — and that overshoot IS the detonation: the bloom
     gain and the turbulence both ride it, so an ignited pair flares past
     the project's hex and settles into it rather than cross-fading. */
  float climate=clamp(u_themeI,0.0,1.0);
  float bloom=1.0+1.30*max(u_themeI,0.0);
  vec3 hotA=mix(mix(CYAN,WHITE,0.34),u_theme,climate*0.94);
  vec3 hotB=mix(mix(VIOLET,WHITE,0.16),u_theme,climate*0.80);
  vec3 vol=plasma(wuv,t,climate*0.85,bloom,hotA,hotB)*0.62;

  /* climate: the ignited hex becomes the temperature of the gas. The
     theme is only ever blended into the field's own colours — the core and
     the stars keep their white, so a card cannot tint the sky into a
     poster — and u_themeI holds it at zero until a capture happens. */
  vec3 warm=mix(CYAN,u_theme,0.85*u_themeI);
  vec3 col=INK;
  col+=mix(INK*2.4,mix(VIOLET,CYAN,dust),0.55)*dust*0.40*u_quality;
  col+=vol;
  col+=WHITE*star*0.85;
  col+=warm*disk*1.02;
  col+=mix(warm,VIOLET,0.5+0.5*sin(ang+t*0.25))*rays*0.45;
  col+=warm*halo*0.34;
  col+=WHITE*core3*1.05;
  col+=mix(warm,WHITE,0.35)*ring2*0.55;
  col+=mix(VIOLET,warm,0.4*u_themeI)*well*0.45;

  /* The mechanical iris: u_portalT drives a six-blade aperture, not a
     round hole. spin turns the whole assembly a sixth of a turn across the
     crossing; cos(6a) puts a corner on every blade so the opening is a
     polygon; the 60-tooth term notches its leading edge like a wheel; and
     six hairlines of mechanical black ride the blade seams. uv here is
     divided by the viewport height, so hz reaching 1.70 already swallows
     a 16:9 frame; the corners of an ultra-wide one are finished by the
     CSS veil (--portal, 148% of the corner distance), and by t=1 nothing
     is left to read — which is exactly where motion.js routes the DOM. */
  if(pt>0.003){
    float prc=length(uv);
    float pa=atan(uv.y,uv.x);
    float spin=pt*1.047;                                /* 60° of mechanism   */
    float teeth=1.0+0.035*step(0.5,fract((pa+spin)*9.5493));
    float edge=hz*(1.0+0.135*cos(6.0*(pa+spin)))*teeth; /* aperture radius    */
    /* The rip: the aperture is not a circle opening, it is a tear — a
       low-frequency perturbation of the blade line that grows with the
       opening, so the edge is ragged at the tear's own scale and the
       raggedness advances outward with it. */
    edge*=1.0+(fbm(vec2((pa+spin)*2.4,1.7+pt*3.0))-0.44)*0.16*pt;
    float hole=smoothstep(edge,edge+0.014,prc);         /* 0 inside → 1 out   */
    float rq=(prc-edge)/0.034;
    float rim=exp(-rq*rq)*(1.0-pt*0.30);                /* hot leading edge   */
    float bl=fract((pa+spin)*0.9549);                   /* 6 seams per turn   */
    float seam=clamp(1.0-min(bl,1.0-bl)*9.0,0.0,1.0);
    float bq=(prc-edge)/0.06;
    float bite=exp(-bq*bq)*seam*pt;                     /* blade overlap shadow */
    /* Inside the aperture there is no colour at all. This is the part the
       old seal had wrong: flooding the hole with the project's hex read
       as a tinted overlay, and it also meant the frame could never be
       provably black at the moment motion.js routes. A black hole is
       black; the hex stays on the rim, where a ring of accreting
       material would actually be. */
    col=mix(vec3(0.0),col,hole);
    col+=mix(warm,WHITE,0.45)*rim*1.55;
    col*=1.0-0.5*bite;
    /* One blackbody lip just inside the horizon: the only light allowed
       to come out of the hole, and the only place the climate survives
       once the interior is gone. */
    float lq=(prc-edge*0.962)/0.021;
    col+=mix(warm,WHITE,0.62)*exp(-lq*lq)*pt*0.90*(1.0-hole);
  }

  /* Readability floor. The bottom band is where the footer, the
     floating nav and the HUD sit, and the CSS veil above this canvas
     removes only ~32% of it there — holding the canvas near black is
     what keeps the measured AA contrast intact (css/signal.css). */
  col*=mix(0.12,1.0,smoothstep(-0.50,-0.40,uv.y));

  float vig=1.0-smoothstep(0.30,1.30,length(uv));
  col*=mix(0.72,1.0,vig);
  /* Route-on-black. The last fifth of the crossing drives the frame to
     vec3(0.0) exactly. It is applied here — after the readability floor
     and the vignette, both of which add or scale and either of which
     would otherwise leave a residual grey — and it is why motion.js can
     route the DOM at t=1 as a property of the shader rather than as a
     hope about the iris radius. */
  col*=1.0-smoothstep(0.82,0.985,pt);
  col*=u_reveal;
  gl_FragColor=vec4(col,1.0);
}
`;

/* ── Volume tier. The march depth and the octave count are substituted
      before compilation, so the loop bounds are constants on every
      driver this meets and the cost is fixed rather than negotiated per
      pixel. warm() picks once, from the renderer string and the buffer
      area; the runtime governor below never recompiles — it spends the
      pixel budget instead, which costs a resize instead of a shader
      stall. ── */
var TIER={steps:6,oct:3};
function fragSource(steps,oct){
  return FRAG.replace('@@STEPS@@',String(steps)).replace('@@OCT@@',String(oct));
}
function pickTier(){
  if(soft){TIER={steps:3,oct:2};return;}
  var area=(W>1?W*H:0);
  var cores=Math.max(1,Math.min(16,Math.round(navigator.hardwareConcurrency||4)));
  if(area>3200000||cores<=3){TIER={steps:4,oct:2};return;}
  TIER={steps:(cores>=8&&area<2600000)?7:6,oct:3};
}

/* ── State ── */
var MOUNT=null,canvas=null,gl=null,prog=null,U={};
var state='idle';          /* idle → ready → (dead: CSS core takes over) */
var lost=false,soft=false,resizing=false,gl2=false;
var W=1,H=1;
var BUDGET=3400000;        /* hard pixel ceiling: caps devicePixelRatio   */
var dprCap=1.5;            /* the governor's lever — see governor()        */
var t0=0,reveal=1;
var last=0,slow=0,fast=0;  /* frame-time samples for the governor          */
var depthT=0,depth=0;
var ptx=0,pty=0,px=0,py=0;
var ftx=0,fty=0,fx=0,fy=0,faT=0,fa=0;
var imx=0.5,imy=0.5,imT=0,imTT=0;
var ptT=0;                 /* u_portalT: written straight from the GSAP
                              tween in motion.js — no extra smoothing, so
                              the tear on screen and the route timing the
                              DOM are the same clock. */
/* Climate: the project hex the orb is holding, as a vec3, plus an
   intensity that arrives on a damped spring rather than a lerp. A lerp
   reaches its target monotonically and a capture should not look
   monotonic: the spring overshoots past 1, and because the shader's
   bloom gain reads u_themeI without clamping it, that overshoot is
   exactly the detonation the vortices make when a project is taken.
   Channels go through raw — the field is authored in the same sRGB space
   the CSS custom property is painted with, so the lens, the shard edge
   and the plasma agree with no conversion pass. */
var trc=0.482,tgc=0.906,tbc=1.000;   /* defaults to the house CYAN       */
var thT=0,thI=0,thV=0;               /* target / shown / spring velocity  */

function hexRGB(s){
  if(typeof s!=='string'){return null;}
  var h=s.replace(/^[\s#]+/,'');
  if(h.length===3){h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);}
  if(h.length!==6){return null;}
  var n=parseInt(h,16);
  if(isNaN(n)){return null;}
  return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
}

function now(){
  return (window.performance&&window.performance.now)?window.performance.now():Date.now();
}
function clamp(v,a,b){return v<a?a:(v>b?b:v);}

function mount(){
  if(!MOUNT){MOUNT=document.querySelector('[data-quasar]');}
  return MOUNT;
}

/* ── Context. Created once; if the browser ever reports the context
      lost, the CSS core stands in until (and unless) it returns. ── */
function createContext(){
  if(!mount()){return false;}
  canvas=document.createElement('canvas');
  canvas.className='signal-stage__canvas';
  canvas.setAttribute('aria-hidden','true');
  MOUNT.insertBefore(canvas,MOUNT.firstChild);   /* under glow + veil */
  var opts={alpha:false,antialias:false,depth:false,stencil:false,
            preserveDrawingBuffer:false,powerPreference:'high-performance'};
  /* WebGL 2 first. The shader stays GLSL ES 1.00 so one source serves
     both contexts, but the context itself is worth asking for: ES 1.00
     shaders are a first-class path in WebGL 2, and the drivers that
     implement it are the ones that no longer carry the WebGL 1
     compatibility quirks. What WebGL 2 unlocks for this scene is the
     extension surface (float-renderable colour, texture LOD) a later
     bloom pass would want, without paying for a second shader source. */
  gl=canvas.getContext('webgl2',opts);
  gl2=!!gl;
  if(!gl){gl=canvas.getContext('webgl',opts)||canvas.getContext('experimental-webgl',opts);}
  if(!gl){if(canvas.parentNode){canvas.parentNode.removeChild(canvas);}canvas=null;return false;}
  canvas.addEventListener('webglcontextlost',onLost,false);
  canvas.addEventListener('webglcontextrestored',onRestored,false);
  var renderer=String(gl.getParameter(gl.RENDERER)||'');
  /* The masked RENDERER is the string "WebKit WebGL" on every Chromium
     build, so it matches none of the software signatures below — which
     meant a machine that is entirely software-rendered still asked for
     the heaviest march tier. Measured in Chrome 154 on ANGLE/SwiftShader
     before this line existed: tier [7,3] with u_quality 1 at ~1.8 fps,
     against the [3,2] / 0.25 path the tier ladder was written to take.
     WEBGL_debug_renderer_info is the only place the real adapter name
     lives; when a driver hides the extension the masked string is still
     tested, so nothing regresses on a browser that refuses it. */
  try{
    var dbg=gl.getExtension('WEBGL_debug_renderer_info');
    if(dbg){renderer+=' '+String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'');}
  }catch(e){}
  soft=/swiftshader|llvmpipe|software|softpipe|basic render/i.test(renderer);
  return true;
}

function compile(type,src){
  var s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function linkWith(steps,oct){
  var vs=compile(gl.VERTEX_SHADER,VERT);
  var fs=compile(gl.FRAGMENT_SHADER,fragSource(steps,oct));
  if(!vs||!fs){return null;}
  var p=gl.createProgram();
  gl.attachShader(p,vs);
  gl.attachShader(p,fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){gl.deleteProgram(p);return null;}
  return p;
}

function buildProgram(){
  /* Tier ladder. A driver that cannot unroll a seven-tap march gets a
     four-tap one before it gets the CSS core: a thinner volume is still
     this design, where the alternative is a flat black background.
     Whatever rung lands is remembered, so a context restore rebuilds the
     program this machine actually compiled rather than the one it could
     not. */
  var rungs=[[TIER.steps,TIER.oct],[4,2],[3,2]];
  var i,p;
  prog=null;
  for(i=0;i<rungs.length;i++){
    p=linkWith(rungs[i][0],rungs[i][1]);
    if(p){TIER={steps:rungs[i][0],oct:rungs[i][1]};prog=p;break;}
  }
  if(!prog){return false;}
  gl.useProgram(prog);
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  /* One list, one source of truth: the static check compares this
     array against the uniform declarations in FRAG above. */
  ['u_res','u_time','u_pointer','u_depth','u_reveal','u_focus',
   'u_focusAmt','u_quality','u_impact','u_impactT','u_portalT','u_theme','u_themeI'].forEach(function(n){
    U[n]=gl.getUniformLocation(prog,n);
  });
  return true;
}

function fail(){
  state='dead';
  root.removeAttribute('data-webgl');
  root.removeAttribute('data-webgl-ctx');
  if(canvas&&canvas.parentNode){canvas.parentNode.removeChild(canvas);}
  canvas=null;gl=null;prog=null;
}

function onLost(e){
  e.preventDefault();          /* a restore is then allowed to happen */
  lost=true;
  root.removeAttribute('data-webgl');
}
function onRestored(){
  lost=false;
  if(!buildProgram()){fail();return;}
  root.setAttribute('data-webgl','on');
  resizing=true;
}

/* ── Pixel budget. DPR caps at 1.5, then lowers again if width ×
      height × dpr² would exceed BUDGET — one number governs cost on
      every display. Software renderers run at 1.0 with thin stars.
      The governor underneath shares the top of that range: on a machine
      that cannot hold 60 Hz the cap walks down in quarter-steps, which
      is a resize (one re-raster) rather than a recompile (a stall), and
      it walks back up when the frames come back. ── */
function sizeCanvas(){
  if(!canvas||!gl){return;}
  var w=Math.max(1,MOUNT.clientWidth||window.innerWidth||1);
  var h=Math.max(1,MOUNT.clientHeight||window.innerHeight||1);
  var cap=soft?1:dprCap;
  var dpr=Math.min(window.devicePixelRatio||1,cap);
  if(w*h*dpr*dpr>BUDGET){dpr=Math.max(Math.min(1,cap),dpr*Math.sqrt(BUDGET/(w*h)));}
  var nw=Math.round(w*dpr),nh=Math.round(h*dpr);
  if(nw!==canvas.width||nh!==canvas.height){
    canvas.width=nw;
    canvas.height=nh;
    gl.viewport(0,0,nw,nh);
  }
  W=nw;H=nh;
  resizing=false;
}

/* ── Frame governor. dt is the interval between motion.js's ticks, which
      is the honest measurement available without a timer-query extension:
      a GPU that cannot finish this shader before the next vsync shows up
      as a long interval. Ninety slow frames is a second and a half of
      sustained pain — long enough that a one-off hitch (a tab return, a
      layout storm) never spends the budget, short enough that a weak
      machine is fixed before a reader scrolls twice. ── */
function governor(dt){
  if(soft||dt<=0||dt>250){return;}
  if(dt>20.5){slow++;fast=0;}
  else if(dt<13.5){fast++;slow=0;}
  else{return;}
  if(slow>=90&&dprCap>0.82){
    dprCap=Math.max(0.82,dprCap-0.25);
    slow=0;resizing=true;
  }else if(fast>=240&&dprCap<1.5){
    dprCap=Math.min(1.5,dprCap+0.25);
    fast=0;resizing=true;
  }
}

function draw(sec){
  if(!gl||lost||state==='dead'){return;}
  if(resizing){sizeCanvas();}
  if(U.u_res){gl.uniform2f(U.u_res,W,H);}
  if(U.u_time){gl.uniform1f(U.u_time,sec);}
  if(U.u_pointer){gl.uniform2f(U.u_pointer,px,py);}
  if(U.u_depth){gl.uniform1f(U.u_depth,depth);}
  if(U.u_reveal){gl.uniform1f(U.u_reveal,reveal);}
  if(U.u_focus){gl.uniform2f(U.u_focus,fx,fy);}
  if(U.u_focusAmt){gl.uniform1f(U.u_focusAmt,fa);}
  if(U.u_quality){gl.uniform1f(U.u_quality,soft?0.25:1.0);}
  if(U.u_impact){gl.uniform2f(U.u_impact,imx,imy);}
  if(U.u_impactT){gl.uniform1f(U.u_impactT,imT);}
  if(U.u_portalT){gl.uniform1f(U.u_portalT,ptT);}
  if(U.u_theme){gl.uniform3f(U.u_theme,trc,tgc,tbc);}
  if(U.u_themeI){gl.uniform1f(U.u_themeI,thI);}
  gl.drawArrays(gl.TRIANGLES,0,3);
}

function onResize(){resizing=true;}

/* ── warm(): the "shader warmup" milestone — create, compile, link,
      resolve every uniform, present one frame (at whatever reveal is
      set), so the handoff never pays for a cold compile. Always
      resolves: 'webgl' or 'css', never rejects. ── */
function warm(){
  if(reduced.matches){return Promise.resolve('css');}
  return new Promise(function(resolve){
    try{
      if(state==='dead'){resolve('css');return;}
      if(!gl){
        if(!createContext()){fail();resolve('css');return;}
        /* Sized before compiled: the buffer area is one of the inputs to
           the volume tier, and a 4K framebuffer does not get the same
           march depth as a phone. */
        sizeCanvas();
        pickTier();
        if(!buildProgram()){fail();resolve('css');return;}
        state='ready';
        root.setAttribute('data-webgl','on');
        /* Diagnostics only — no rule keys off this one. data-webgl="on"
           is the CSS contract and stays exactly as it was. */
        root.setAttribute('data-webgl-ctx',gl2?'webgl2':'webgl');
        window.addEventListener('resize',onResize,false);
      }
      sizeCanvas();
      if(!t0){t0=now();}
      draw((now()-t0)/1000);
      resolve('webgl');
    }catch(err){
      fail();
      resolve('css');
    }
  });
}

/* ── tick(): called by motion.js from its one rAF. Every smoothed
      value advances here — no per-event math, no setInterval, and no
      frames at all while the Archive is showing. ── */
function tick(ms){
  if(state!=='ready'||lost){return;}
  if(root.getAttribute('data-mode')!=='signal'){return;}
  var dt=last?ms-last:0;
  last=ms;
  governor(dt);
  px+=(ptx-px)*0.06;
  py+=(pty-py)*0.06;
  depth+=(depthT-depth)*0.08;
  fa+=(faT-fa)*0.10;
  fx+=(ftx-fx)*0.12;
  fy+=(fty-fy)*0.12;
  imT+=(imTT-imT)*0.12;
  /* The climate runs on a spring, not a lerp: ζ ≈ 0.32, so an ignition
     overshoots to about 1.35 and settles. That overshoot is deliberate —
     u_themeI is not clamped in the shader, and the plasma bloom gain
     rides it, which is the difference between the void changing colour
     and the void being hit. */
  thV+=((thT-thI)*0.22-thV*0.30);
  thI+=thV;
  if(thI<0){thI=0;thV*=-0.35;}
  if(thI>2){thI=2;thV=0;}
  if(!t0){t0=ms;}
  draw((ms-t0)/1000);
}

window.PORTFOLIO_QUASAR={
  warm:warm,
  tick:tick,
  setDepth:function(v){depthT=clamp(v||0,0,1);},
  setPointer:function(x,y){ptx=x||0;pty=y||0;},
  setFocus:function(x,y,amt){ftx=x||0;fty=y||0;faT=clamp(amt||0,0,1);},
  setReveal:function(v){reveal=clamp(v==null?1:v,0,1);},
  fireImpact:function(x,y){imx=x==null?0.5:x;imy=y==null?0.5:y;imTT=0;imT=0;},
  setImpactT:function(v){imTT=clamp(v==null?0:v,0,1);},
  /* u_portalT is fed straight from the caller's tween — quasar owns no
     timing here, only pixels. */
  setPortal:function(v){ptT=clamp(v==null?0:v,0,1);},
  portalValue:function(){return ptT;},
  /* Climate ignition, called by paintTheme() in motion.js with the hex
     off the shard the orb just captured — and with '' when the orb is
     released, which only cools the intensity back down: the last colour
     stays parked in the channels until the next capture replaces it.
     A fresh hex also kicks the spring's velocity, so the vortices are
     already moving upward on the very frame the DOM takes the colour —
     the detonation leads the target change instead of chasing it. */
  setTheme:function(hex){
    var c=hexRGB(hex);
    if(!c){thT=0;return;}
    var fresh=(trc!==c[0]||tgc!==c[1]||tbc!==c[2]||thT===0);
    trc=c[0];tgc=c[1];tbc=c[2];thT=1;
    if(fresh){thV+=0.20;}
  },
  mode:function(){return state==='ready'?'webgl':(state==='dead'?'css':'idle');}
};
})();
