/* ══════════════════════════════════════════════════════════════════════
   1RY · quasar — The Signal's celestial renderer (raw WebGL, one pass).

   One fullscreen triangle and a single fragment shader: a tilted
   accretion disk with shearing fbm streaks, volumetric rays, a pulse
   ring that leaves the core every ~4.5 s, a chromatic core, a starfield,
   and a gravitational well that leans toward whichever transmission is
   under the pointer. No textures, no requests — the field is entirely
   procedural, so "loading" it means compiling one shader pair.

   Why raw WebGL instead of Three.js (measured 28 Sep 2026): the current
   three.module.min.js is 338,908 B / 78,794 B gzipped and pulls
   three.core.min.js (381,124 B / 100,467 B gzipped) along with it —
   about 179 KB gzipped to draw one quad, plus ESM-only loading that
   would reorder the whole script plan. The scene graph, materials and
   loaders would be idle weight here; this module is a fraction of that
   and keeps the pixel budget (DPR cap, frame budget) in one readable
   place. Bring Three in the day the Signal needs meshes or
   post-processing.

   Contract with the rest of the site:
     · never runs under prefers-reduced-motion — the CSS core on
       .signal-stage is the static, contrast-measured substitute;
     · owns no animation loop: js/motion.js calls tick(now) inside its
       single requestAnimationFrame, and stops calling it when the tab
       is hidden;
     · renders nothing while html[data-mode] is archive;
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

uniform vec2 u_res;       /* drawing-buffer size in px                    */
uniform float u_time;     /* seconds since the kernel warmed              */
uniform vec2 u_pointer;   /* -1..1, lerped in motion.js before it lands   */
uniform float u_depth;    /* 0..1 scroll depth — lifts the core           */
uniform float u_reveal;   /* 0..1 boot ramp: the field arrives, not pops  */
uniform vec2 u_focus;     /* hovered card centre, uv space                */
uniform float u_focusAmt; /* 0..1 gravitational-well strength             */
uniform float u_quality;  /* 0..1 star-density budget                     */

const vec3 CYAN=vec3(0.482,0.906,1.000);
const vec3 VIOLET=vec3(0.663,0.580,1.000);
const vec3 WHITE=vec3(0.955,0.977,1.000);

float hash21(vec2 p){
  p=fract(p*vec2(234.34,435.345));
  p+=dot(p,p+34.23);
  return fract(p.x*p.y);
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

void main(){
  float h=max(u_res.y,1.0);
  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/h;
  vec2 field=uv+u_pointer*0.055;

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

  /* starfield; density follows the quality budget */
  vec2 st=uv*64.0;
  vec2 idp=floor(st);
  float hn=hash21(idp);
  float on=step(0.994-0.004*u_quality,hn);
  vec2 sf=fract(st)-0.5;
  float star=on*(1.0-smoothstep(0.0,0.34,length(sf)));
  star*=0.55+0.45*sin(t*1.6+hn*47.0);

  vec3 col=vec3(0.027,0.039,0.071);
  col+=WHITE*star*0.85;
  col+=CYAN*disk*1.10;
  col+=mix(CYAN,VIOLET,0.5+0.5*sin(ang+t*0.25))*rays*0.45;
  col+=CYAN*halo*0.34;
  col+=WHITE*core3*1.05;
  col+=CYAN*ring2*0.55;
  col+=VIOLET*well*0.45;

  /* Readability floor. The bottom band is where the footer, the
     floating nav and the HUD sit, and the CSS veil above this canvas
     removes only ~32% of it there — holding the canvas near black is
     what keeps the measured AA contrast intact (css/signal.css). */
  col*=mix(0.12,1.0,smoothstep(-0.50,-0.40,uv.y));

  float vig=1.0-smoothstep(0.30,1.30,length(uv));
  col*=mix(0.72,1.0,vig);
  col*=u_reveal;
  gl_FragColor=vec4(col,1.0);
}
`;

/* ── State ── */
var MOUNT=null,canvas=null,gl=null,prog=null,U={};
var state='idle';          /* idle → ready → (dead: CSS core takes over) */
var lost=false,soft=false,resizing=false;
var W=1,H=1;
var BUDGET=3400000;        /* hard pixel ceiling: caps devicePixelRatio   */
var t0=0,reveal=1;
var depthT=0,depth=0;
var ptx=0,pty=0,px=0,py=0;
var ftx=0,fty=0,fx=0,fy=0,faT=0,fa=0;

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
  gl=canvas.getContext('webgl',opts)||canvas.getContext('experimental-webgl',opts);
  if(!gl){if(canvas.parentNode){canvas.parentNode.removeChild(canvas);}canvas=null;return false;}
  canvas.addEventListener('webglcontextlost',onLost,false);
  canvas.addEventListener('webglcontextrestored',onRestored,false);
  var renderer=String(gl.getParameter(gl.RENDERER)||'');
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

function buildProgram(){
  var vs=compile(gl.VERTEX_SHADER,VERT);
  var fs=compile(gl.FRAGMENT_SHADER,FRAG);
  if(!vs||!fs){return false;}
  prog=gl.createProgram();
  gl.attachShader(prog,vs);
  gl.attachShader(prog,fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){prog=null;return false;}
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
   'u_focusAmt','u_quality'].forEach(function(n){
    U[n]=gl.getUniformLocation(prog,n);
  });
  return true;
}

function fail(){
  state='dead';
  root.removeAttribute('data-webgl');
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
      every display. Software renderers run at 1.0 with thin stars. ── */
function sizeCanvas(){
  if(!canvas||!gl){return;}
  var w=Math.max(1,MOUNT.clientWidth||window.innerWidth||1);
  var h=Math.max(1,MOUNT.clientHeight||window.innerHeight||1);
  var dpr=Math.min(window.devicePixelRatio||1,soft?1:1.5);
  if(w*h*dpr*dpr>BUDGET){dpr=Math.max(1,dpr*Math.sqrt(BUDGET/(w*h)));}
  var nw=Math.round(w*dpr),nh=Math.round(h*dpr);
  if(nw!==canvas.width||nh!==canvas.height){
    canvas.width=nw;
    canvas.height=nh;
    gl.viewport(0,0,nw,nh);
  }
  W=nw;H=nh;
  resizing=false;
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
        if(!createContext()||!buildProgram()){fail();resolve('css');return;}
        state='ready';
        root.setAttribute('data-webgl','on');
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
  px+=(ptx-px)*0.06;
  py+=(pty-py)*0.06;
  depth+=(depthT-depth)*0.08;
  fa+=(faT-fa)*0.10;
  fx+=(ftx-fx)*0.12;
  fy+=(fty-fy)*0.12;
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
  mode:function(){return state==='ready'?'webgl':(state==='dead'?'css':'idle');}
};
})();
