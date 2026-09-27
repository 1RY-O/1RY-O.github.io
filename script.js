/* ══════════════════════════════════════════════════════════════════════
   1RY · SONIC RUSH ENGINE
   ─ WebGL velocity core (infinite tunnel + particle stream, parallax/warp)
   ─ Canvas2D streak fallback when WebGL is unavailable
   ─ Boot-up scramble sequence
   ─ Liquid portal transitions (clip-path circle expanding from cursor)
   ─ Magnetic hover physics (gsap.quickTo) driving the GL warp field
   ─ Scroll-snapped resume HUD: telemetry timeline + velocity gauges
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
root.classList.remove('no-js');
root.classList.add('js');

var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer=window.matchMedia('(pointer:fine)').matches;
var G=window.gsap||null;
function qs(s,b){return (b||document).querySelector(s);}
function qsa(s,b){return Array.prototype.slice.call((b||document).querySelectorAll(s));}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}

/* ══════════════════════════════════════════════════════════════════════
   0 · HARDENING PRIMITIVES
   ── Own-property lookup. `CONTENT[key]` alone walks the prototype chain,
      so '#/constructor' or '#/toString' satisfies the truthiness guard and
      a native function's source gets injected into #portal-body.
      Every CONTENT read goes through this.
   ══════════════════════════════════════════════════════════════════════ */
var hasOwn=Object.prototype.hasOwnProperty;
function contentFor(key){
  if(typeof key!=='string'||!CONTENT){return null;}
  return hasOwn.call(CONTENT,key)?CONTENT[key]:null;
}

/* Allow only navigational schemes in data-supplied hrefs. Anything else
   (javascript:, data:, vbscript:) is dropped rather than rendered. */
var SAFE_HREF=/^(https:\/\/|mailto:|#|\/(?!\/)|\.{1,2}\/|[A-Za-z0-9._~-]+\/)/;
function safeHref(href){
  var h=String(href==null?'':href).trim();
  return SAFE_HREF.test(h)?h:null;
}
/* Escape for use inside a double-quoted attribute. */
function attr(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
/* Escape for use as element text content. */
function txt(v){
  return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* Clickjacking: CSP `frame-ancestors` is ignored in a <meta> CSP and
   GitHub Pages sends no X-Frame-Options, so refuse to render framed. */
if(window.top!==window.self){
  try{window.top.location=window.self.location;}catch(e){}
  document.documentElement.innerHTML='<head><title>Blocked</title></head><body></body>';
  return;
}

/* global failsafe — content can never stay hidden, whatever happens later */
window.setTimeout(function(){
  var els=document.querySelectorAll('.rise,.hero-in>*');
  for(var i=0;i<els.length;i++){
    els[i].classList.add('in');
    if(!els[i].style.opacity||els[i].style.opacity==='0'){els[i].style.opacity='1';els[i].style.transform='none';}
  }
  document.documentElement.classList.add('booted');
  if(CORE){CORE.fluxTarget=1;CORE.flux=Math.max(CORE.flux,0.6);CORE.speedTarget=0.55;}
  var b=document.getElementById('boot');
  if(b&&!b.classList.contains('is-done')){b.classList.add('is-done');b.setAttribute('aria-hidden','true');}
},5200);

/* ═══════════════════════════════════════════════════════════════
   1 · VELOCITY CORE — shared state consumed by the GL / 2D renderers
   ═══════════════════════════════════════════════════════════════ */
var CORE={
  mouse:{x:0,y:0},          /* smoothed pointer, -1..1, y up */
  target:{x:0,y:0},
  warp:{x:0,y:0},           /* gravitational well position, -1..1 */
  warpTarget:{x:0,y:0},
  amp:0,ampTarget:0,        /* warp intensity */
  speed:0.55,speedTarget:0.55,
  flux:0,fluxTarget:0,      /* boot ignition 0..1 */
  ab:0,abTarget:0           /* chromatic aberration — portal flux */
};

/* ── GLSL: infinite electric tunnel with streaming particle field ── */
var VERT=[
'attribute vec2 a_pos;',
'void main(){ gl_Position=vec4(a_pos,0.0,1.0); }'
].join('\n');

var FRAG=[
'precision highp float;',
'uniform vec2 u_res;',
'uniform float u_time;',
'uniform vec2 u_mouse;',
'uniform vec2 u_warp;',
'uniform float u_amp;',
'uniform float u_speed;',
'uniform float u_flux;',
'uniform float u_ab;',
'#define PI 3.14159265',
'float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
'float sceneDepth(vec2 uv,float bend,out float rad){',
'  uv+=u_mouse*0.10;',
'  vec2 d=uv-u_warp;',
'  float dr=length(d);',
'  float well=exp(-dr*dr*3.4)*u_amp;',
'  uv*=1.0-well*0.20;',
'  float r=length(uv);',
'  float a=atan(uv.y,uv.x)+bend*(u_mouse.x*0.09)+well*0.85*sign(uv.y*u_warp.x+0.0001);',
'  rad=r;',
'  return 1.0/(r+0.16)+u_time*u_speed+well*2.6+a*0.02;',
'}',
'vec3 render(vec2 uv){',
'  float r0; float depth=sceneDepth(uv,0.0,r0);',
'  float rad=length(uv+u_mouse*0.10);',
'  float core=smoothstep(0.62,0.0,rad);',
'  vec3 col=vec3(0.0);',
/* rings rushing toward the viewer */
'  float ring=pow(abs(sin(depth*2.35)),10.0);',
'  col+=vec3(0.0,0.19,0.62)*ring*1.55;',
/* thin cyan shockwaves */
'  float shock=pow(abs(sin(depth*1.05+1.7)),34.0);',
'  col+=vec3(0.10,0.42,0.80)*shock*1.2;',
/* radial spokes */
'  float ang=atan(uv.y,uv.x);',
'  float spokes=pow(abs(sin(ang*8.0+depth*0.35)),26.0);',
'  col+=vec3(0.30,0.42,0.75)*spokes*(0.30+0.55*shock);',
/* particle stream — quantised polar grid, some cells yellow */
'  float ga=ang/(2.0*PI)*54.0;',
'  float gd=depth*2.6;',
'  vec2 gid=vec2(floor(ga),floor(gd));',
'  float h=hash(gid);',
'  vec2 f=vec2(ga-gid.x-0.5,gd-gid.y-0.5);',
'  float pt=smoothstep(0.44,0.02,length(f))*step(0.74,h);',
'  vec3 pcol=mix(vec3(0.25,0.55,1.0)*1.5,vec3(1.0,0.87,0.0)*1.35,step(0.955,h));',
'  col+=pcol*pt;',
/* core ignition glow */
'  col+=vec3(0.0,0.28,1.0)*core*1.35;',
'  col+=vec3(1.0,0.87,0.0)*pow(smoothstep(0.12,0.0,rad),2.0)*0.55;',
/* accelerating bands during portal flux */
'  col+=vec3(0.05,0.30,0.85)*pow(abs(sin(depth*0.7)),6.0)*u_flux*0.9;',
'  return col;',
'}',
'void main(){',
'  vec2 uv=(gl_FragCoord.xy-0.5*u_res)/min(u_res.x,u_res.y);',
'  float e=0.0022+u_ab*0.010;',
'  vec3 col=render(uv);',
'  if(u_ab>0.001){',
'    col.r=mix(col.r,render(uv+vec2(e,e)).r,u_ab);',
'    col.b=mix(col.b,render(uv-vec2(e,e)).b,u_ab);',
'  }',
'  float rad=length(uv+u_mouse*0.10);',
'  float vig=smoothstep(1.30,0.16,rad);',
'  col*=vig*(0.30+0.70*u_flux);',
'  col+=vec3(0.004,0.010,0.030);',
'  col+=(hash(gl_FragCoord.xy*0.37)-0.5)/180.0;',
'  gl_FragColor=vec4(col,1.0);',
'}'
].join('\n');
/* ═══════════════════════════════════════════════════════════════
   2 · RENDERERS — WebGL primary, Canvas2D streak fallback
   ═══════════════════════════════════════════════════════════════ */
var VIS={
  mode:'none',
  canvas:qs('#gl'),
  w:0,h:0,dpr:1,
  setPointer:function(nx,ny){CORE.target.x=clamp(nx,-1,1);CORE.target.y=clamp(-ny,-1,1);},
  setWarp:function(nx,ny,amp){CORE.warpTarget.x=clamp(nx,-1,1);CORE.warpTarget.y=clamp(-ny,-1,1);
    if(amp!==undefined)CORE.ampTarget=amp;},
  setAmp:function(a){CORE.ampTarget=a;},
  setSpeed:function(s){CORE.speedTarget=s;},
  setFlux:function(f){CORE.fluxTarget=f;},
  setAberration:function(a){CORE.abTarget=a;}
};

/* Fullscreen fragment shaders are expensive, and cost scales with AREA, not
   with CSS pixels. A 4K display at dpr 2 rendered at 1.75 shades 11.3M pixels
   every frame — enough to thermally throttle a good GPU in under a minute.
   So cap on a shaded-pixel budget, not just a device-pixel-ratio ceiling:
   a 4K desktop renders the background below 1:1 and a phone stays crisp. */
var isCoarse=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
var lowPower=isCoarse||(navigator.hardwareConcurrency||8)<=4;
var PIXEL_BUDGET=lowPower?1.1e6:2.6e6;   /* shaded pixels per frame */
var DPR_STEPS=[1.75,1.5,1.25,1.0,0.85,0.75];
var dprStep=0;
function dprCap(){
  var ceiling=lowPower?1.25:1.75;
  var dpr=Math.min(window.devicePixelRatio||1,ceiling,DPR_STEPS[dprStep]);
  var w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  var area=w*h*dpr*dpr;
  if(area>PIXEL_BUDGET){dpr=Math.max(0.5,dpr*Math.sqrt(PIXEL_BUDGET/area));}
  return dpr;
}
function sizeCanvas(){
  var c=VIS.canvas;if(!c)return;
  VIS.dpr=dprCap();
  VIS.w=Math.max(1,Math.round(window.innerWidth));
  VIS.h=Math.max(1,Math.round(window.innerHeight));
  c.width=Math.round(VIS.w*VIS.dpr);c.height=Math.round(VIS.h*VIS.dpr);
  c.style.width=VIS.w+'px';c.style.height=VIS.h+'px';
}

/* ── 2a · WebGL tunnel ── */
function initGL(){
  var c=VIS.canvas;if(!c){return false;}
  var opts={alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:false};
  var gl=c.getContext('webgl',opts)||c.getContext('experimental-webgl',opts);
  if(!gl){return false;}
  /* Fragment highp is optional in WebGL1. Older Adreno/Mali parts report a
     precision of 0, the shader fails to compile, and the whole site silently
     drops to the much slower Canvas2D streak field. Detect and downgrade the
     precision instead of losing the effect entirely. */
  var fragSrc=FRAG;
  try{
    var pf=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
    if(!pf||!pf.precision){fragSrc=FRAG.replace('precision highp float;','precision mediump float;');}
  }catch(e){}
  function compile(type,src){
    var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){try{console.warn(gl.getShaderInfoLog(s));}catch(e){}return null;}
    return s;
  }
  var vs=compile(gl.VERTEX_SHADER,VERT),fs=compile(gl.FRAGMENT_SHADER,fragSrc);
  if(!vs||!fs){return false;}
  var prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){return false;}
  gl.useProgram(prog);
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a_pos');gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var U={};
  ['u_res','u_time','u_mouse','u_warp','u_amp','u_speed','u_flux','u_ab'].forEach(function(n){U[n]=gl.getUniformLocation(prog,n);});
  function draw(t){
    gl.viewport(0,0,c.width,c.height);
    gl.uniform2f(U.u_res,c.width,c.height);   /* device pixels — matches gl_FragCoord */
    gl.uniform1f(U.u_time,t);
    gl.uniform2f(U.u_mouse,CORE.mouse.x,CORE.mouse.y);
    gl.uniform2f(U.u_warp,CORE.warp.x,CORE.warp.y);
    gl.uniform1f(U.u_amp,CORE.amp);
    gl.uniform1f(U.u_speed,CORE.speed);
    gl.uniform1f(U.u_flux,CORE.flux);
    gl.uniform1f(U.u_ab,CORE.ab);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  return {draw:draw};
}

/* ── 2b · Canvas2D streak fallback — same parallax + well behaviour ── */
function init2D(){
  var c=VIS.canvas;if(!c){return false;}
  var ctx=c.getContext('2d');if(!ctx){return false;}
  var N=finePointer?150:70,streaks=[];
  function spawn(s,seed){
    s.r=0.05+Math.random()*0.35;
    s.a=Math.random()*Math.PI*2;
    s.v=0.55+Math.random()*1.5;
    s.len=0.05+Math.random()*0.22;
    s.blue=Math.random()>0.09;
    if(seed){s.r+=Math.random()*1.1;}
    return s;
  }
  for(var i=0;i<N;i++){streaks.push(spawn({},true));}
  function draw(t){
    var w=VIS.w,h=VIS.h,m=Math.min(w,h);
    ctx.setTransform(VIS.dpr,0,0,VIS.dpr,0,0);
    ctx.fillStyle='#050505';ctx.fillRect(0,0,w,h);
    var cx=w/2-CORE.mouse.x*46,cy=h/2+CORE.mouse.y*46;
    var wx=cx+CORE.warp.x*w*0.5,wy=cy-CORE.warp.y*h*0.5;
    var glow=ctx.createRadialGradient(cx,cy,0,cx,cy,m*0.75);
    glow.addColorStop(0,'rgba(0,90,255,'+(0.30+0.35*CORE.flux)+')');
    glow.addColorStop(0.45,'rgba(0,50,170,'+(0.12+0.16*CORE.flux)+')');
    glow.addColorStop(1,'rgba(5,5,5,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    var well=ctx.createRadialGradient(wx,wy,0,wx,wy,m*0.3*(0.6+CORE.amp));
    well.addColorStop(0,'rgba(140,190,255,'+(0.05+0.30*CORE.amp)+')');
    well.addColorStop(1,'rgba(0,60,255,0)');
    ctx.fillStyle=well;ctx.fillRect(0,0,w,h);
    ctx.lineCap='round';
    for(var k=0;k<streaks.length;k++){
      var s=streaks[k];
      s.r+=s.v*0.0042*(CORE.speed*2.1)*(1+CORE.amp*0.9)*(1+CORE.flux*0.5);
      if(s.r>1.45){spawn(s,false);}
      var ca=Math.cos(s.a),sa=Math.sin(s.a);
      var x0=wx+ca*s.r*m*0.85,y0=wy+sa*s.r*m*0.85;
      var x1=wx+ca*(s.r+s.len*(0.4+CORE.speed))*m*0.85,y1=wy+sa*(s.r+s.len*(0.4+CORE.speed))*m*0.85;
      var op=clamp(1-s.r*0.72,0,1)*(0.25+0.6*CORE.flux);
      ctx.strokeStyle=s.blue?'rgba(61,130,255,'+op+')':'rgba(255,222,0,'+op*0.9+')';
      ctx.lineWidth=s.blue?1.2:1.6;
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    }
  }
  return {draw:draw};
}
/* ═══════════════════════════════════════════════════════════════
   3 · FRAME LOOP — integrate uniforms, drive whichever renderer is live
   ═══════════════════════════════════════════════════════════════ */
var glRenderer=null,ctxRenderer=null;
var fpsEl=qs('#rail-fps'),scrollEl=qs('#rail-scroll');
var fpsAcc=0,fpsFrames=0,fpsShown=0;
var elScroll=null,elClock=qs('#hud-clock');

function integrate(dt){
  var ease=1-Math.pow(0.0025,dt);           /* frame-rate independent pursuit */
  CORE.mouse.x=lerp(CORE.mouse.x,CORE.target.x,ease);
  CORE.mouse.y=lerp(CORE.mouse.y,CORE.target.y,ease);
  CORE.warp.x=lerp(CORE.warp.x,CORE.warpTarget.x,ease*0.72);
  CORE.warp.y=lerp(CORE.warp.y,CORE.warpTarget.y,ease*0.72);
  CORE.amp=lerp(CORE.amp,CORE.ampTarget,1-Math.pow(0.02,dt));
  CORE.speed=lerp(CORE.speed,CORE.speedTarget,1-Math.pow(0.12,dt));
  CORE.flux=lerp(CORE.flux,CORE.fluxTarget,1-Math.pow(0.05,dt));
  CORE.ab=lerp(CORE.ab,CORE.abTarget,1-Math.pow(0.05,dt));
}

var t0=null;
function loop(now){
  window.requestAnimationFrame(loop);
  if(document.hidden){return;}
  if(!t0){t0=now;return;}
  var dt=Math.min((now-t0)/1000,0.05);t0=now;
  integrate(dt);
  fpsAcc+=dt;fpsFrames++;
  if(fpsAcc>0.5){
    fpsShown=Math.round(fpsFrames/fpsAcc);fpsAcc=0;fpsFrames=0;
    if(fpsEl){fpsEl.textContent='CORE '+String(fpsShown).padStart(3,'0')+' FPS';}
    if(fpsShown<40&&dprStep<DPR_STEPS.length-1){dprStep++;sizeCanvas();}
  }
  var r=(glRenderer||ctxRenderer);
  if(r){r.draw(now/1000);}
}

function bodyScrollPct(){
  var span=root.scrollHeight-window.innerHeight;
  return span>0?clamp(root.scrollTop/span,0,1):0;
}
function onScrollFrame(){
  if(scrollEl){scrollEl.textContent='SCROLL '+String(Math.round(bodyScrollPct()*100)).padStart(3,'0')+'%';}
  if(elScroll){elScroll.style.transform='scaleX('+bodyScrollPct()+')';}
}

/* ── pointer → parallax + well ── */
function bindPointer(){
  window.addEventListener('pointermove',function(e){
    VIS.setPointer((e.clientX/window.innerWidth)*2-1,(e.clientY/window.innerHeight)*2-1);
  },{passive:true});
  window.addEventListener('touchmove',function(e){
    var t=e.touches[0];if(!t)return;
    VIS.setPointer((t.clientX/window.innerWidth)*2-1,(t.clientY/window.innerHeight)*2-1);
  },{passive:true});
}
/* ═══════════════════════════════════════════════════════════════
   4 · TEXT DECODE — resume data scrambling into place
   ═══════════════════════════════════════════════════════════════ */
var GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*%$<>[]{}=+';
function scramble(el,duration){
  if(!el){return;}
  var final=el.getAttribute('data-decode')||el.textContent;
  el.setAttribute('data-decode',final);
  if(reduceMotion||!G) {el.textContent=final;return;}
  var chars=final.split(''),total=chars.length,progress=0,span=0;
  var dur=(duration||0.72)*1000;
  el.classList.add('is-decoding');
  function frame(now){
    if(!span){span=now;}
    var p=clamp((now-span)/dur,0,1);
    progress=p*total;
    var out='';
    for(var i=0;i<total;i++){
      var c=chars[i];
      if(c===' '){out+=' ';continue;}
      out+=(i<progress)?c:GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
    }
    el.textContent=out;
    if(p<1){window.requestAnimationFrame(frame);}
    else{el.textContent=final;el.classList.remove('is-decoding');}
  }
  window.requestAnimationFrame(frame);
}
function scrambleAll(scope,stagger){
  var els=qsa('[data-decode]',scope);
  els.forEach(function(el,i){
    if(stagger){window.setTimeout(function(){scramble(el);},i*(stagger*1000));}
    else{scramble(el);}
  });
}

/* ═══════════════════════════════════════════════════════════════
   5 · BOOT-UP SEQUENCE — core ignition + system log
   ═══════════════════════════════════════════════════════════════ */
var BOOT_STEPS=[
  ['THREADS / CORE ARRAY',0.20],
  ['MOUNTING PORTAL ARRAY · 05',0.42],
  ['STREAMING RESUME TELEMETRY',0.66],
  ['CALIBRATING WARP FIELD',0.84],
  ['VELOCITY CORE ONLINE',1.00]
];
var bootDone=false;                 /* gates hash routing until boot settles */
function runBoot(done){
  var boot=qs('#boot'),fill=qs('#boot-fill'),pct=qs('#boot-pct'),logEl=qs('#boot-log'),skip=qs('#boot-skip');
  var finished=false;
  if(!boot){CORE.fluxTarget=1;done();return;}

  function finish(){
    if(finished){return;}
    finished=true;
    if(G){
      G.to(boot,{duration:0.44,ease:'expo.inOut',clipPath:'inset(50% 0% 50% 0%)',opacity:0,
        onComplete:function(){boot.classList.add('is-done');boot.setAttribute('aria-hidden','true');}});
    }else{
      boot.classList.add('is-done');boot.setAttribute('aria-hidden','true');
    }
    window.setTimeout(done,320);
  }
  function skipBoot(){
    if(G){G.killTweensOf([fill,boot]);}
    finish();
  }
  if(skip){skip.addEventListener('click',skipBoot);}
  window.addEventListener('keydown',function(e){
    if(!finished&&(e.key==='Escape'||e.key==='Enter'||e.key===' ')){skipBoot();}
  },{once:true});

  if(reduceMotion||!G){
    if(fill){fill.style.transform='scaleX(1)';}
    if(pct){pct.textContent='100%';}
    if(logEl){logEl.textContent=BOOT_STEPS[BOOT_STEPS.length-1][0];}
    CORE.fluxTarget=1;CORE.flux=1;
    window.setTimeout(finish,180);
    return;
  }

  var tl=G.timeline({onComplete:finish});
  tl.to(CORE,{fluxTarget:1,duration:0.9,ease:'power2.out'},0);
  tl.to(fill,{scaleX:1,duration:0.92,ease:'expo.out'},0);
  BOOT_STEPS.forEach(function(step,i){
    var at=0.10+i*0.18;
    tl.call(function(){
      if(logEl){logEl.textContent=step[0];}
      if(pct){pct.textContent=String(Math.round(step[1]*100)).padStart(3,'0')+'%';}
    },null,at);
  });
  tl.to(boot,{duration:0.06,yoyo:true,repeat:1,opacity:0.72},0.62);
}
/* ═══════════════════════════════════════════════════════════════
   6 · MAGNETIC HOVER PHYSICS → feeds the GL gravitational well
   ═══════════════════════════════════════════════════════════════ */
function initMagnets(scope){
  var mags=qsa('.magnet, .pcard, .tnode, .hud-link, .link-ext',scope||document);
  if(!finePointer||!G||reduceMotion){
    return;
  }
  mags.forEach(function(el){
    if(el.getAttribute('data-magnet')==='1'){return;}   /* never double-bind */
    el.setAttribute('data-magnet','1');
    var pull=el.classList.contains('pcard')?0.16:0.26;
    var maxPull=el.classList.contains('pcard')?26:18;
    var qx=G.quickTo(el,'x',{duration:0.42,ease:'expo.out'});
    var qy=G.quickTo(el,'y',{duration:0.42,ease:'expo.out'});
    function move(e){
      var r=el.getBoundingClientRect();
      var cx=r.left+r.width/2,cy=r.top+r.height/2;
      var dx=clamp((e.clientX-cx)*pull,-maxPull,maxPull);
      var dy=clamp((e.clientY-cy)*pull,-maxPull,maxPull);
      qx(dx);qy(dy);
    }
    function enter(){
      el.classList.add('is-hovered');
      var r=el.getBoundingClientRect();
      if(!r.width||!r.height){return;}
      /* gravitational well: element centre → GL space, amplitude by aspect */
      var nx=((r.left+r.width/2)/window.innerWidth)*2-1;
      var ny=-(((r.top+r.height/2)/window.innerHeight)*2-1);
      VIS.setWarp(nx,ny,clamp((r.width/r.height)*0.4,0.5,1.4));
      VIS.setSpeed(1.45);
      window.addEventListener('pointermove',move,{passive:true});
    }
    function leave(){
      el.classList.remove('is-hovered');
      window.removeEventListener('pointermove',move);
      qx(0);qy(0);
      VIS.setAmp(0);
      VIS.setSpeed(0.55);
    }
    el.addEventListener('pointerenter',enter);
    el.addEventListener('pointerleave',leave);
    el.addEventListener('focus',enter);
    el.addEventListener('blur',leave);
  });
}

/* ═══════════════════════════════════════════════════════════════
   7 · LIQUID PORTAL TRANSITIONS — clip-path circle from the cursor
   ═══════════════════════════════════════════════════════════════ */
var PORTAL=qs('#portal'),P_CLIP=qs('#portal-clip'),P_BODY=qs('#portal-body'),
    P_IDX=qs('#portal-idx'),P_TITLE=qs('#portal-title'),P_KIND=qs('#portal-kind'),
    P_CLOSE=qs('#portal-close');
var portalOpen=false,lastFocus=null,currentKey=null;
var CONTENT={};                       /* case files injected from data.js below */
var PORTAL_META={
  vi071:{idx:'01',title:'VI-071',kind:'CASE FILE · FLAGSHIP'},
  bobby:{idx:'02',title:'BOBBY',kind:'CASE FILE · LIVE DEMO'},
  circuitmate:{idx:'03',title:'CIRCUITMATE',kind:'CASE FILE · PROTOTYPE'},
  lumis:{idx:'04',title:'LUMIS',kind:'CASE FILE · WIP'},
  resume:{idx:'05',title:'RESUME HUD',kind:'TELEMETRY DASHBOARD'}
};

function radiusTo(x,y){
  var w=window.innerWidth,h=window.innerHeight;
  var dx=Math.max(x,w-x),dy=Math.max(y,h-y);
  return Math.sqrt(dx*dx+dy*dy)*1.06;
}
function setOrigin(x,y){
  var r=radiusTo(x,y);
  PORTAL.style.setProperty('--ox',x+'px');
  PORTAL.style.setProperty('--oy',y+'px');
  PORTAL.style.setProperty('--or',r+'px');
  PORTAL.style.setProperty('--or0','0px');
}
function openPortal(key,originEl){
  var html=contentFor(key);
  if(portalOpen||!html){return;}
  P_BODY.innerHTML=html;
  P_IDX.textContent=PORTAL_META[key]?PORTAL_META[key].idx:'--';
  P_TITLE.textContent=PORTAL_META[key]?PORTAL_META[key].title:key.toUpperCase();
  P_KIND.textContent=PORTAL_META[key]?PORTAL_META[key].kind:'CASE FILE';
  var x,y;
  if(originEl){
    var r=originEl.getBoundingClientRect();
    x=r.left+r.width/2;y=r.top+r.height/2;
  }else{x=window.innerWidth/2;y=window.innerHeight/2;}
  setOrigin(x,y);
  lastFocus=document.activeElement;
  portalOpen=true;currentKey=key;
  PORTAL.classList.add('is-open');
  PORTAL.setAttribute('aria-hidden','false');
  document.body.classList.add('is-locked');
  if(P_CLIP){P_CLIP.scrollTop=0;}
  VIS.setAberration(1);VIS.setSpeed(1.9);
  initHudAnim();
  initMagnets(P_BODY);
  if(G&&!reduceMotion){
    G.fromTo(P_CLIP,{'--pr':'0px'},{'--pr':PORTAL.style.getPropertyValue('--or'),duration:0.58,ease:'expo.out',
      onComplete:function(){PORTAL.classList.add('is-settled');}});
    G.fromTo(qsa('.portal-anim',P_BODY),{y:34,autoAlpha:0},
      {y:0,autoAlpha:1,duration:0.44,ease:'expo.out',stagger:0.045,delay:0.16});
    /* failsafe: if the clip tween is ever interrupted, reveal fully */
    G.delayedCall(1.1,function(){PORTAL.classList.add('is-settled');});
  }else{
    PORTAL.classList.add('is-settled');
  }
  if(P_CLOSE){try{P_CLOSE.focus({preventScroll:true});}catch(e){P_CLOSE.focus();}}
  window.setTimeout(function(){VIS.setAberration(0.18);VIS.setSpeed(0.85);},700);
}
function closePortal(){
  if(!portalOpen){return;}
  portalOpen=false;
  clearHudIOs();
  document.body.classList.remove('is-locked');
  PORTAL.classList.remove('is-settled');
  VIS.setAberration(0.85);VIS.setSpeed(1.6);
  /* replace, not push: pushing '#top' on close stacks a history entry per
     open/close cycle, so Back walks a dead portal trail instead of leaving. */
  if(history.state&&history.state.portal){
    try{history.replaceState({},'',location.pathname+location.search);}catch(e){}
  }
  var finish=function(){
    PORTAL.classList.remove('is-open');
    PORTAL.setAttribute('aria-hidden','true');
    P_BODY.innerHTML='';
    VIS.setAberration(0);VIS.setSpeed(0.55);
    if(lastFocus&&lastFocus.focus){try{lastFocus.focus({preventScroll:true});}catch(e){}}
  };
  if(G&&!reduceMotion){
    G.fromTo(P_CLIP,{'--pr':PORTAL.style.getPropertyValue('--or')||'120vmax'},
      {'--pr':'0px',duration:0.42,ease:'expo.in',onComplete:finish});
  }else{finish();}
}
window.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&portalOpen){closePortal();}
});
if(P_CLOSE){P_CLOSE.addEventListener('click',closePortal);}

/* swap one portal view for another without collapsing the circle */
function swapPortal(key){
  var html=contentFor(key);
  if(!html){return;}
  currentKey=key;
  P_BODY.innerHTML=html;
  P_IDX.textContent=PORTAL_META[key]?PORTAL_META[key].idx:'--';
  P_TITLE.textContent=PORTAL_META[key]?PORTAL_META[key].title:key.toUpperCase();
  P_KIND.textContent=PORTAL_META[key]?PORTAL_META[key].kind:'CASE FILE';
  if(P_CLIP){P_CLIP.scrollTop=0;}
  VIS.setAberration(0.9);VIS.setSpeed(1.7);
  window.setTimeout(function(){VIS.setAberration(0.18);VIS.setSpeed(0.85);},640);
  initHudAnim();
  initMagnets(P_BODY);
  if(G&&!reduceMotion){
    G.fromTo(qsa('.portal-anim',P_BODY),{y:26,autoAlpha:0},
      {y:0,autoAlpha:1,duration:0.4,ease:'expo.out',stagger:0.04});
  }
  if(P_CLOSE){try{P_CLOSE.focus({preventScroll:true});}catch(e){}}
}
/* ═══════════════════════════════════════════════════════════════
   8 · REVEAL SYSTEM — expo.out snap-in, IntersectionObserver driven
   ═══════════════════════════════════════════════════════════════ */
function initReveals(){
  var els=qsa('.rise');
  if(!G||reduceMotion){
    els.forEach(function(el){el.classList.add('in');});
    return;
  }
  root.classList.add('anim');                 /* arms the hidden start state */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting){return;}
      var el=en.target;
      io.unobserve(el);
      var siblings=qsa('.rise',el.parentElement).filter(function(s){return s!==el;});
      var delay=Math.min(siblings.length*0.045,0.22);
      el.classList.add('in');
      G.fromTo(el,{y:36,autoAlpha:0,skewX:-3},
        {y:0,autoAlpha:1,skewX:0,duration:0.46,ease:'expo.out',delay:delay});
    });
  },{threshold:0.12,rootMargin:'0px 0px -5% 0px'});
  els.forEach(function(el){io.observe(el);});

  /* section headers blast in with a scale-line sweep */
  qsa('.sec-head').forEach(function(head){
    var bar=document.createElement('i');
    bar.className='head-bar';bar.setAttribute('aria-hidden','true');
    head.appendChild(bar);
    new IntersectionObserver(function(en,obs){
      if(!en[0].isIntersecting){return;}
      obs.disconnect();
      G.fromTo(bar,{scaleX:0},{scaleX:1,duration:0.5,ease:'expo.out'});
    },{threshold:0.4}).observe(head);
  });
  /* failsafe: never leave content hidden */
  window.setTimeout(function(){
    qsa('.rise').forEach(function(el){
      if(!el.classList.contains('in')){el.classList.add('in');G.set(el,{clearProps:'all'});}
    });
  },4000);
}

/* ═══════════════════════════════════════════════════════════════
   9 · HUD CHROME — clock, scrollbar accent
   ═══════════════════════════════════════════════════════════════ */
function initClock(){
  function tick(){
    if(!elClock){return;}
    var d=new Date();
    elClock.textContent=[d.getHours(),d.getMinutes(),d.getSeconds()]
      .map(function(n){return String(n).padStart(2,'0');}).join(':');
  }
  tick();window.setInterval(tick,1000);
}
window.addEventListener('scroll',onScrollFrame,{passive:true});
/* ═══════════════════════════════════════════════════════════════
   10 · READ-MODE COPY — Normal / Professional (session-only)
   ═══════════════════════════════════════════════════════════════ */
var COPY_N={
  'hero-lede':'First-semester Mechatronics Engineering student at Mahindra University building independent projects across software, embedded systems, and AI-assisted applications.',
  'portals-lede':'Four builds, four case files. Open a portal for the full engineering record — stack, decisions, and current state.',
  'vi071-tag':'Audio-to-symbolic-music workflow: inference worker, backend orchestration, notation.',
  'vi071-lede':'An audio-to-sheet-music workflow built around the messy part of transcription: turning a recording into structured notes, readable notation, and usable musical files.',
  'bobby-tag':'Plan the work, inspect the error and code, move toward a focused fix.',
  'circuitmate-tag':'Hands-busy debugging for Arduino and ESP32 work, driven by speech.',
  'lumis-tag':'Full-stack journaling experiment — features and deployment still being validated.'
};
var COPY_P={
  'hero-lede':'First-semester B.Tech Mechatronics Engineering student at Mahindra University. Independent project work spans audio-model inference experiments, memory optimisation, voice-based electronics troubleshooting, and developer-support tooling.',
  'portals-lede':'Four independently developed builds. Each portal documents the stack, the engineering decisions, and the current verified state.',
  'vi071-tag':'Audio-to-symbolic-music pipeline: React/TypeScript client, Node/Express job API, Python MuScriptor worker, FFmpeg, MIDI/MusicXML, Verovio.',
  'vi071-lede':'Developing an audio-to-sheet-music workflow using the MuScriptor transcription model, a web application, and a separate Python inference worker. Memory optimisations were tested (KV-cache adjustments, FlashAttention trials); ONNX inference and INT8 quantization were evaluated and not adopted after testing showed an unacceptable accuracy trade-off.',
  'bobby-tag':'Developer troubleshooting assistant: investigation organised into planning, error/code examination, and remediation stages.',
  'circuitmate-tag':'Voice-oriented assistant for electronics and embedded-system troubleshooting, integrating AssemblyAI voice-agent functionality with a hardware-focused knowledge base.',
  'lumis-tag':'Full-stack AI journaling prototype (React + Firebase + Node/Express + Cloud Run + Gemini). Features and deployment remain under validation.'
};
var mode='normal';
var live=document.createElement('p');
live.setAttribute('aria-live','polite');
live.className='sr-only';
document.body.appendChild(live);

function applyMode(){
  var map=(mode==='professional')?COPY_P:COPY_N;
  var scope=document;
  qsa('[data-mode-text]',scope).forEach(function(el){
    var k=el.getAttribute('data-mode-text');
    if(map[k]){el.textContent=map[k];}
  });
  /* rebuild any open portal so its copy follows the mode */
  var openHtml=portalOpen?contentFor(currentKey):null;
  if(openHtml){
    P_BODY.innerHTML=openHtml;
    if(G&&!reduceMotion){
      G.fromTo(qsa('.portal-anim',P_BODY),{y:18,autoAlpha:0},
        {y:0,autoAlpha:1,duration:0.34,ease:'expo.out',stagger:0.03});
    }
  }
}
function setMode(next){
  mode=(next==='professional')?'professional':'normal';
  try{sessionStorage.setItem('iry-mode',mode);}catch(e){}
  qsa('[data-mode-btn]').forEach(function(b){
    var on=b.getAttribute('data-mode-btn')===mode;
    b.classList.toggle('is-on',on);
    b.setAttribute('aria-checked',on?'true':'false');
    b.tabIndex=on?0:-1;
  });
  if(reduceMotion||!G){applyMode();}
  else{
    document.body.classList.add('swapping');
    G.delayedCall(0.14,function(){applyMode();document.body.classList.remove('swapping');});
  }
  live.textContent='Read mode: '+mode+'. Project descriptions updated.';
  qsa('.hud-mode,#ticker-mode,#ticker-mode-b').forEach(function(el){
    el.textContent=mode.toUpperCase();
  });
}
function initMode(){
  qsa('[role=radiogroup]').forEach(function(group){
    var btns=qsa('[data-mode-btn]',group);
    btns.forEach(function(btn){
      btn.addEventListener('click',function(){setMode(btn.getAttribute('data-mode-btn'));});
      btn.addEventListener('keydown',function(e){
        var keys=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'];
        if(keys.indexOf(e.key)<0){return;}
        e.preventDefault();
        var i=btns.indexOf(btn);
        var n=(e.key==='ArrowRight'||e.key==='ArrowDown')?btns[(i+1)%btns.length]:btns[(i-1+btns.length)%btns.length];
        n.focus();setMode(n.getAttribute('data-mode-btn'));
      });
    });
  });
  try{var saved=sessionStorage.getItem('iry-mode');if(saved==='professional'){setMode('professional');}}catch(e){}
}
/* ═══════════════════════════════════════════════════════════════
   11 · CASE FILES — portal content
   ═══════════════════════════════════════════════════════════════ */
function caseFile(o){
  /* hrefs come from the CONTENT data block. Today they are all hand-authored
     constants, but this is the one place where a data-supplied value reaches
     an href — enforce the scheme allowlist here so the day CONTENT is fed
     from a CMS or API it cannot become a javascript:/data: XSS sink. */
  var links=o.links.filter(function(l){return !!safeHref(l.href);}).map(function(l){
    var href=attr(safeHref(l.href));
    return '<a class="'+(l.primary?'btn btn-blue':'btn btn-ghost')+' magnet" href="'+href+'"'+
      (l.download?' download="'+attr(l.download)+'"':' target="_blank" rel="noopener noreferrer"')+
      '><span>'+txt(l.label)+'</span></a>';
  }).join('');
  var chips=o.stack.map(function(s){return '<li>'+txt(s)+'</li>';}).join('');
  var done=o.done.map(function(s){return '<li>'+s+'</li>';}).join('');
  var state=o.state.map(function(s){return '<li>'+s+'</li>';}).join('');
  /* NOTE: done / state / nested are deliberately passed through raw — they
     are authored inline in the CONTENT block below and carry <b> emphasis and
     the benchmark <table>. They are trusted constants, never user input. */
  var nested=o.nested||'';
  var flags=o.flags.map(function(f){
    return '<li class="'+attr(f.cls)+'">'+txt(f.t)+'</li>';
  }).join('');
  return ''+
  '<div class="cf">'+
    '<section class="cf-lead portal-anim">'+
      '<p class="cf-kicker">'+txt(o.kicker)+'</p>'+
      '<h3 class="cf-title">'+txt(o.title)+'</h3>'+
      '<p class="cf-sub">'+txt(o.sub)+'</p>'+
      '<p class="cf-body">'+txt(o.body)+'</p>'+
      '<ul class="cf-flags">'+flags+'</ul>'+
      '<ul class="cf-stack">'+chips+'</ul>'+
      '<div class="cf-links">'+links+'</div>'+
    '</section>'+
    '<section class="cf-col portal-anim">'+
      '<h4 class="cf-h">Engineering <span>what was built</span></h4>'+
      '<ul class="bullets">'+done+'</ul>'+
    '</section>'+
    '<section class="cf-col portal-anim">'+
      '<h4 class="cf-h">Current state <span>honest limits</span></h4>'+
      '<ul class="bullets bullets-warn">'+state+'</ul>'+
    '</section>'+
    nested+
  '</div>';
}

var CONTENT={
  vi071:caseFile({
    kicker:'CASE FILE 01 · FLAGSHIP · AUDIO-TO-NOTATION',
    title:'VI-071',
    sub:'Audio → sheet music',
    body:'Developing an audio-to-sheet-music workflow using the MuScriptor transcription model, a web application, and a separate Python inference worker. The interesting part is not the demo — it is holding the whole pipeline together: audio handling, model inference, backend jobs, symbolic formats, and notation you can inspect, play, and export.',
    flags:[{t:'ACTIVE EXPERIMENT',cls:'cf-flag cf-flag-blue'},{t:'CPU-ONLY LOCAL WORK',cls:'cf-flag'}],
    stack:['MuScriptor','Python worker','React / TypeScript','Node / Express','FFmpeg','MIDI','MusicXML','Verovio','Cloudflare Tunnel'],
    done:[
      '<b>Transcription worker:</b> Python inference process integrated with a TypeScript backend as background jobs.',
      '<b>Job orchestration:</b> submission, progress and status handling for long-running model work.',
      '<b>Symbolic output:</b> results converted to MIDI and MusicXML rather than a single proprietary blob.',
      '<b>Score rendering:</b> Verovio rendering with inspection, playback and export paths.',
      '<b>Memory profiling:</b> CPU peak-memory comparison across model-loading configurations.',
      '<b>Streaming BF16:</b> reduced combined Node + Python peak memory from 1157.1 MB to 844.9 MB (~27%) in that local benchmark.',
      '<b>KV-cache adjustments</b> and <b>FlashAttention trials</b> explored for footprint and latency.',
      '<b>ONNX + INT8 quantization evaluated, then rejected</b> — testing showed an unacceptable accuracy trade-off.',
      '<b>Cloudflare Tunnel</b> used to connect a front end to the development worker.',
      '<b>Backend tests</b> written for the core workflow behaviour.'
    ],
    state:[
      'Transcription accuracy and long-recording reliability remain active evaluation areas.',
      'Synthetic piano-like melody parity does not establish accuracy on arbitrary music.',
      'An optimized run reported ~690 MB combined peak (from an earlier ~1.15 GB baseline); its setup is unverified and is kept separate from the benchmark above.',
      'No public demo URL is claimed — a deployment address appears in the repo resources but its working state is unverified.'
    ],
    links:[
      {label:'SOURCE ↗',href:'https://github.com/1RY-O/Vi-071'},
      {label:'RESUME SUMMARY',href:'#/resume',primary:true}
    ],
    nested:'<section class="cf-table portal-anim"><h4 class="cf-h">Local CPU benchmark <span>peak memory, measured</span></h4>'+
      '<table class="bench"><caption>MuScriptor model-loading on CPU · local measurement</caption>'+
      '<thead><tr><th scope="col">Configuration</th><th scope="col">Python peak</th><th scope="col">Node + Python</th></tr></thead><tbody>'+
      '<tr><td>Legacy FP32</td><td>1080.2 MB</td><td>1157.1 MB</td></tr>'+
      '<tr><td>Streaming FP32</td><td>1073.7 MB</td><td>1149.8 MB</td></tr>'+
      '<tr class="is-best"><td>Streaming BF16 ★ selected</td><td>766.9 MB</td><td>844.9 MB</td></tr>'+
      '<tr><td>Streaming FP16</td><td>762.8 MB</td><td>836.6 MB</td></tr></tbody></table>'+
      '<p class="fineprint">FP16 measured slightly lower but showed slower generation and a narrower dynamic range in this setup. Local results for the tested environment and workload — not universal guarantees.</p></section>'
  }),
  bobby:caseFile({
    kicker:'CASE FILE 02 · DEVELOPER TOOLING',
    title:'BOBBY',
    sub:'Guided debugging investigation',
    body:'A developer troubleshooting assistant that organises investigation instead of guessing: planning the work, examining the error and the code, then moving toward a focused remediation. Built as an orchestrated multi-stage flow rather than a single prompt.',
    flags:[{t:'LIVE DEMO',cls:'cf-flag cf-flag-blue'},{t:'PUBLIC REPOSITORY',cls:'cf-flag'}],
    stack:['Next.js','FastAPI','LangGraph','React Flow','Tailwind CSS'],
    done:[
      '<b>Staged investigation model:</b> planning → error/code examination → remediation stages.',
      '<b>Graph orchestration:</b> LangGraph drives the stage transitions between reasoning steps.',
      '<b>Flow visualisation:</b> React Flow renders the investigation graph in the interface.',
      '<b>Two-service architecture:</b> Next.js front end against a FastAPI backend.',
      '<b>Public repo with local run and test instructions</b>, so the build can be reproduced.'
    ],
    state:[
      'Scope is deliberately narrow: developer troubleshooting assistance, not a general agent platform.',
      'Investigation quality depends on the error context supplied — incomplete traces give weaker plans.'
    ],
    links:[
      {label:'LIVE DEMO ↗',href:'https://bobby-neon.vercel.app'},
      {label:'SOURCE ↗',href:'https://github.com/1RY-O/Bobby'},
      {label:'RESUME SUMMARY',href:'#/resume',primary:true}
    ]
  }),
  circuitmate:caseFile({
    kicker:'CASE FILE 03 · EMBEDDED × VOICE',
    title:'CIRCUITMATE',
    sub:'Electronics troubleshooting by voice',
    body:'Your hands are busy probing a circuit. CircuitMate lets you talk the problem through instead of stopping to type: voice-oriented interaction, clarifying questions, and routing toward hardware-focused guidance covering sensors, motors, and circuit faults on Arduino and ESP32 targets.',
    flags:[{t:'VOICE-NATIVE',cls:'cf-flag cf-flag-yellow'},{t:'DEPLOYED URLS — VERIFY',cls:'cf-flag'}],
    stack:['AssemblyAI voice agent','Backend API','Electronics knowledge base','Arduino','ESP32'],
    done:[
      '<b>Voice-agent integration:</b> AssemblyAI voice-agent functionality wired to a backend service.',
      '<b>Hardware knowledge base:</b> guidance organised around sensors, motors, and circuit troubleshooting.',
      '<b>Contextual diagnosis:</b> clarifying questions and routing rather than one-shot answers.',
      '<b>Safety-oriented guidance:</b> responses framed around not damaging the board or the person debugging it.'
    ],
    state:[
      'Development URLs are listed in the resume (circuitmate-chi.vercel.app · circuitmate.onrender.com) — their current working state is unverified, so both are shown as resume-listed rather than guaranteed.',
      'Coverage of exotic hardware and fault classes is not claimed.'
    ],
    links:[
      {label:'SOURCE ↗',href:'https://github.com/1RY-O/CircuitMate'},
      {label:'DEMO (RESUME-LISTED) ↗',href:'https://circuitmate-chi.vercel.app'},
      {label:'RESUME SUMMARY',href:'#/resume',primary:true}
    ]
  }),
  lumis:caseFile({
    kicker:'CASE FILE 04 · INCOMPLETE PROTOTYPE',
    title:'LUMIS',
    sub:'AI journaling prototype',
    body:'A quieter place to think, write, and reflect, with AI support when it is wanted. Lumis is a full-stack prototype — features and deployment are still being validated, and it is labelled an incomplete prototype everywhere it appears.',
    flags:[{t:'INCOMPLETE PROTOTYPE',cls:'cf-flag cf-flag-warn'},{t:'FEATURES UNDER VALIDATION',cls:'cf-flag'}],
    stack:['React','Firebase Auth','Firestore','Node / Express','Cloud Run','Gemini API'],
    done:[
      '<b>Authenticated flows:</b> Firebase Auth and Firestore behind a structured reflection interface.',
      '<b>Backend service:</b> Node/Express layer deployed on Cloud Run.',
      '<b>AI reflection support:</b> Gemini API integration for structured, guided prompting.',
      '<b>Real screenshots</b> in this repository under <code>assets/</code> — not mockups.'
    ],
    state:[
      'Broken or unimplemented features are not claimed as working.',
      'Deployment and feature completeness remain under validation; treat the source as work in progress.'
    ],
    links:[
      {label:'SOURCE ↗',href:'https://github.com/1RY-O/lumis-journal'},
      {label:'RESUME SUMMARY',href:'#/resume',primary:true}
    ],
    nested:'<section class="cf-shots portal-anim"><h4 class="cf-h">Interface <span>real screenshots</span></h4>'+
      '<div class="shot-row"><figure><picture><source srcset="assets/lumis-landing.webp" type="image/webp"><img src="assets/lumis-landing.png" alt="Lumis landing screen" loading="lazy" decoding="async" width="952" height="903"></picture><figcaption>Landing</figcaption></figure>'+
      '<figure><picture><source srcset="assets/lumis-app.webp" type="image/webp"><img src="assets/lumis-app.png" alt="Lumis journal view" loading="lazy" decoding="async" width="942" height="910"></picture><figcaption>Journal view</figcaption></figure></div></section>'
  })
};
/* ═══════════════════════════════════════════════════════════════
   12 · RESUME HUD DATA — mirrors the approved PDF, with honest labels
   ═══════════════════════════════════════════════════════════════ */
var RESUME={
  role:'Mechatronics Engineering · Embedded Systems · Software &amp; AI',
  tiles:[
    ['Program','B.Tech · Mechatronics Engineering'],
    ['Institution','Mahindra University · Hyderabad'],
    ['Window','2026 → 2030 · first semester'],
    ['Class XII','89% · AP State Board · 2026'],
    ['Class X','85.4% · CBSE · 2024'],
    ['Certification','BE10X · AI Tools &amp; Claude · Aug 2026'],
    ['Tracked builds','04 projects in this portfolio'],
    ['Open to','Mechatronics · embedded/IoT · software']
  ],
  timeline:[
    {date:'2026 → 2030',title:'B.Tech Mechatronics Engineering',org:'Mahindra University · Hyderabad',
     body:'First-semester undergraduate programme — electronics, mechanics and computing coursework running alongside independent project work.',
     tags:['Coursework','Lab work','In progress']},
    {date:'2026 → NOW',title:'IoT &amp; Robotics Trainee',org:'Unlox Academy',
     body:'Hands-on embedded and IoT bench work: microcontrollers, sensors, actuators, and circuit troubleshooting.',
     tags:['Arduino','ESP32','Sensors','Actuators']},
    {date:'2026 → NOW',title:'Team Leader',org:'E-Cell · Mahindra University',
     body:'Team leadership role inside the campus entrepreneurship cell.',
     tags:['Leadership','Team']},
    {date:'2026',title:'Builder — hackathons',org:'Hack2Skill Gen-AI APAC · AssemblyAI × LabLab AI',
     body:'Builder roles in Gen-AI hackathon events; working demos linked where they are verified.',
     tags:['Gen-AI','Voice agent','Prototyping']},
    {date:'AUG 2026',title:'BE10X — AI Tools &amp; Claude Workshop',org:'Certificate of Completion',
     body:'Workshop covering applied AI tooling and Claude workflows.',
     tags:['Certificate']},
    {date:'2026',title:'Club member',org:'Blockchain Club · Computer Science Club (Enigma) · Mahindra University',
     body:'Member of two campus technical clubs.',
     tags:['Community']}
  ],
  gauges:[
    {group:'Languages',rows:[
      ['Python',78,'VI-071 transcription worker · backend jobs'],
      ['C / C++',62,'Embedded bench work · coursework'],
      ['Java',45,'Coursework only'],
      ['HTML / CSS',70,'This site, hand-built'],
      ['TypeScript / JS',64,'VI-071 client · Node services']
    ]},
    {group:'Embedded &amp; IoT',rows:[
      ['Arduino',74,'IoT &amp; Robotics training bench'],
      ['ESP32',70,'CircuitMate hardware domain · bench work'],
      ['Sensors &amp; actuators',66,'Training bench prototypes'],
      ['Circuit troubleshooting',62,'CircuitMate knowledge base']
    ]},
    {group:'Web &amp; backend',rows:[
      ['Node / Express',68,'VI-071 job API · Lumis backend'],
      ['React',66,'Lumis interface · VI-071 client'],
      ['Next.js',62,'Bobby front end'],
      ['FastAPI',58,'Bobby backend service'],
      ['REST APIs',70,'Job submission + status endpoints'],
      ['Firebase / Firestore',56,'Lumis auth + data layer']
    ]},
    {group:'AI &amp; dev tooling',rows:[
      ['Prompt engineering',76,'Cross-project workflow, daily'],
      ['Structured outputs',62,'Lumis reflection · Bobby stages'],
      ['Gemini API',66,'Lumis AI reflection'],
      ['AssemblyAI',60,'CircuitMate voice agent'],
      ['LangGraph',56,'Bobby investigation graph'],
      ['Claude · Cline · OpenCode',64,'Development workflow']
    ]},
    {group:'Platforms &amp; media',rows:[
      ['Git / GitHub',72,'Every build in this portfolio'],
      ['Linux (Fedora)',64,'Daily development environment'],
      ['Vercel / Render',62,'Bobby live demo · prototype deploys'],
      ['FFmpeg / Verovio',56,'VI-071 audio handling + score render'],
      ['Tinkercad / Wokwi',58,'Hardware simulation benches']
    ]}
  ],
  projects:[
    ['VI-071','Audio-to-sheet-music application — MuScriptor model, Python worker, job backend, MIDI/MusicXML, Verovio.','Active experiment'],
    ['Bobby','Developer troubleshooting assistant — planning, error/code examination, and remediation stages.','Live demo'],
    ['CircuitMate','Voice-native electronics troubleshooting assistant for Arduino and ESP32 work.','Prototype'],
    ['Lumis Journal','Full-stack AI journaling prototype — auth, structured reflection, Cloud Run backend.','Incomplete prototype']
  ]
};
function gaugeRow(r){
  return '<div class="gauge" data-v="'+r[1]+'">'+
    '<div class="gauge-head"><span class="gauge-name">'+r[0]+'</span><span class="gauge-val">00</span></div>'+
    '<div class="gauge-track"><i class="gauge-fill"></i></div>'+
    '<p class="gauge-src">'+r[2]+'</p>'+
  '</div>';
}
function buildResumeHud(){
  var tiles=RESUME.tiles.map(function(t){
    return '<div class="tile"><span class="tile-k">'+t[0]+'</span><span class="tile-v">'+t[1]+'</span></div>';
  }).join('');
  var nodes=RESUME.timeline.map(function(n){
    return '<li class="tnode magnet">'+
      '<span class="tnode-dot" aria-hidden="true"></span>'+
      '<span class="tnode-date" data-decode="'+n.date+'">'+n.date+'</span>'+
      '<div class="tnode-body">'+
        '<h4 class="tnode-title">'+n.title+'</h4>'+
        '<p class="tnode-org">'+n.org+'</p>'+
        '<p class="tnode-text">'+n.body+'</p>'+
        '<ul class="tnode-tags">'+n.tags.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul>'+
      '</div>'+
    '</li>';
  }).join('');
  var groups=RESUME.gauges.map(function(g){
    return '<div class="gauge-group-wrap" data-hud="1">'+
      '<h5 class="gauge-group">'+g.group+'</h5>'+
      g.rows.map(gaugeRow).join('')+
    '</div>';
  }).join('');
  var projects=RESUME.projects.map(function(p){
    return '<li class="plog" data-hud="1"><b>'+p[0]+'</b><span>'+p[1]+'</span><i>'+p[2]+'</i></li>';
  }).join('');

  return '<div class="hud-view">'+
    '<section class="hud-block" data-hud="1">'+
      '<p class="cf-kicker">IDENTITY RECORD · 1RY</p>'+
      '<h3 class="hud-name">Pilla Sri Sai Rahul</h3>'+
      '<p class="hud-role">'+RESUME.role+'</p>'+
      '<ul class="hud-contact">'+
        '<li><a href="mailto:fabledadventurer.pssr@gmail.com">fabledadventurer.pssr@gmail.com</a></li>'+
        '<li><a href="https://www.linkedin.com/in/sri-sai-rahul-pilla" target="_blank" rel="noopener">linkedin.com/in/sri-sai-rahul-pilla</a></li>'+
        '<li><a href="https://github.com/1RY-O" target="_blank" rel="noopener">github.com/1RY-O</a></li>'+
        '<li><a href="https://1ry-o.github.io/" target="_blank" rel="noopener">1ry-o.github.io</a></li>'+
        '<li>Hyderabad, India</li>'+
      '</ul>'+
      '<div class="cf-links">'+
        '<a class="btn btn-yellow magnet" href="Pilla_Sri_Sai_Rahul_Resume.pdf" download="Pilla_Sri_Sai_Rahul_Resume.pdf"><span>DOWNLOAD PDF</span></a>'+
        '<a class="btn btn-ghost magnet" href="Pilla_Sri_Sai_Rahul_Resume.pdf" target="_blank" rel="noopener"><span>VIEW PDF ↗</span></a>'+
        '<button class="btn btn-blue magnet" type="button" data-hud-print><span>PRINT / SAVE</span></button>'+
      '</div>'+
      '<p class="fineprint">The PDF is the source of truth and is preserved unmodified. Nothing here claims a GPA, employment history, awards, or credentials beyond that file.</p>'+
    '</section>'+
    '<section class="hud-block" data-hud="1">'+
      '<h4 class="cf-h">Snapshot <span>telemetry</span></h4>'+
      '<div class="tile-row">'+tiles+'</div>'+
    '</section>'+
    '<section class="hud-block" data-hud="1">'+
      '<h4 class="cf-h">Engagement log <span>nodes snap as you scroll</span></h4>'+
      '<ol class="track">'+nodes+'</ol>'+
    '</section>'+
    '<section class="hud-block" data-hud="1">'+
      '<h4 class="cf-h">Skills matrix <span>velocity / evidence depth</span></h4>'+
      '<p class="fineprint">Gauges show relative hands-on depth across active builds — self-assessed during this build, not a certified rating. Every row names the work it comes from; the resume PDF remains the source of truth.</p>'+
      '<div class="gauge-groups">'+groups+'</div>'+
    '</section>'+
    '<section class="hud-block" data-hud="1">'+
      '<h4 class="cf-h">Selected projects <span>resume order</span></h4>'+
      '<ul class="plog-list">'+projects+'</ul>'+
    '</section>'+
    '<section class="hud-block" data-hud="1">'+
      '<p class="fineprint">Read mode is currently <b class="hud-mode">NORMAL</b> — switch it from the top HUD. Session-only, no cookies. Built by hand: HTML, CSS, JavaScript, raw WebGL.</p>'+
    '</section>'+
  '</div>';
}
CONTENT.resume=buildResumeHud();
/* ═══════════════════════════════════════════════════════════════
   13 · HUD ANIMATION — timeline snap + gauges filling on scroll
   ═══════════════════════════════════════════════════════════════ */
var hudIOs=[];
function clearHudIOs(){
  hudIOs.forEach(function(io){io.disconnect();});
  hudIOs=[];
}
function initHudAnim(){
  clearHudIOs();
  var scroller=P_CLIP||PORTAL;

  /* blocks fade/snap in as they enter the portal viewport */
  qsa('.hud-block',P_BODY).forEach(function(block){
    if(!G||reduceMotion){return;}
    G.set(block,{y:26,autoAlpha:0});
    var io=new IntersectionObserver(function(en,obs){
      if(!en[0].isIntersecting){return;}
      obs.disconnect();
      G.to(block,{y:0,autoAlpha:1,duration:0.46,ease:'expo.out'});
    },{root:scroller,threshold:0.06,rootMargin:'0px 0px -2% 0px'});
    io.observe(block);hudIOs.push(io);
  });

  /* gauges — fill fast, count the value, hint the source row */
  qsa('.gauge',P_BODY).forEach(function(g,i){
    var v=parseFloat(g.getAttribute('data-v'))||0;
    var fill=qs('.gauge-fill',g),val=qs('.gauge-val',g);
    function run(){
      g.classList.add('is-live');
      if(G&&!reduceMotion){
        G.to(fill,{scaleX:v/100,duration:0.58,ease:'expo.out',delay:(i%6)*0.05});
        G.fromTo({n:0},{n:v},{duration:0.58,ease:'expo.out',delay:(i%6)*0.05,
          onUpdate:function(){if(val){val.textContent=String(Math.round(this.targets()[0].n)).padStart(2,'0');}}});
      }else{
        if(fill){fill.style.transform='scaleX('+(v/100)+')';}
        if(val){val.textContent=String(Math.round(v)).padStart(2,'0');}
      }
    }
    if(!('IntersectionObserver' in window)){run();return;}
    var io=new IntersectionObserver(function(en,obs){
      if(!en[0].isIntersecting){return;}
      obs.disconnect();run();
    },{root:scroller,threshold:0.35});
    io.observe(g);hudIOs.push(io);
  });

  /* timeline nodes — blast in and glitch the dates */
  qsa('.tnode',P_BODY).forEach(function(node,i){
    if(G&&!reduceMotion){
      G.set(node,{x:-24,autoAlpha:0});
    }
    var io=new IntersectionObserver(function(en,obs){
      if(!en[0].isIntersecting){return;}
      obs.disconnect();
      node.classList.add('is-hot');
      window.setTimeout(function(){node.classList.remove('is-hot');},900);
      if(G&&!reduceMotion){
        G.to(node,{x:0,autoAlpha:1,duration:0.44,ease:'expo.out'});
        node.classList.add('is-glitch');
        window.setTimeout(function(){node.classList.remove('is-glitch');},460);
      }
      var dateEl=qs('.tnode-date',node);
      if(dateEl){scramble(dateEl,0.5);}
    },{root:scroller,threshold:0.4});
    io.observe(node);hudIOs.push(io);
  });
}

/* ═══════════════════════════════════════════════════════════════
   14 · PORTAL TRIGGERS — buttons, real links, hash routing, focus
   ═══════════════════════════════════════════════════════════════ */
var toastEl=qs('#toast'),toastTimer=null;
function toast(msg){
  if(!toastEl){return;}
  toastEl.textContent=msg;
  toastEl.classList.add('is-on');
  if(toastTimer){window.clearTimeout(toastTimer);}
  toastTimer=window.setTimeout(function(){toastEl.classList.remove('is-on');},2600);
}
function focusables(scope){
  return qsa('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',scope)
    .filter(function(el){return el.offsetParent!==null||el===P_CLOSE;});
}
function initPortalTriggers(){
  document.addEventListener('click',function(e){
    var trigger=e.target.closest?e.target.closest('[data-open-portal]'):null;
    if(!trigger){return;}
    var key=trigger.getAttribute('data-open-portal');
    if(!contentFor(key)){return;}
    var isLink=trigger.tagName==='A';
    var hashLink=isLink&&/#\//.test(trigger.getAttribute('href')||'');
    if(!isLink||hashLink){
      e.preventDefault();
      if(hashLink){try{history.pushState({portal:key},'','#/'+key);}catch(err){}}
    }
    if(portalOpen){swapPortal(key);}else{openPortal(key,trigger);}
  });
  /* print / save button lives inside the injected resume HUD */
  P_BODY.addEventListener('click',function(e){
    var t=e.target.closest?e.target.closest('[data-hud-print]'):null;
    if(!t){return;}
    toast('OPENING PRINT VIEW — SAVE AS PDF');
    window.setTimeout(function(){window.print();},260);
  });
  window.addEventListener('popstate',function(){
    if(portalOpen){closePortal();}
  });
  /* keep focus inside the portal while it is open */
  document.addEventListener('keydown',function(e){
    if(!portalOpen||e.key!=='Tab'){return;}
    var f=focusables(P_BODY);
    if(P_CLOSE){f=[P_CLOSE].concat(f);}
    if(!f.length){return;}
    var first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
}
/* ═══════════════════════════════════════════════════════════════
   15 · HERO ENTRANCE — kinetic type + turbo reveal
   ═══════════════════════════════════════════════════════════════ */
function heroEntrance(){
  var hero=qs('.hero');
  if(!hero){return;}
  var kids=qsa('.hero-in>*',hero);
  if(reduceMotion||!G){
    kids.forEach(function(el){el.style.opacity=1;el.style.transform='none';});
    scrambleAll(hero,0);
    return;
  }
  var tl=G.timeline({defaults:{ease:'expo.out'}});
  tl.fromTo(qs('.hero-tagline',hero),{y:26,autoAlpha:0},{y:0,autoAlpha:1,duration:0.42},0);
  tl.set(qs('.hero-name',hero),{autoAlpha:1},0);
  tl.fromTo(qsa('.kin-t',hero),{yPercent:122,skewX:-15},
    {yPercent:0,skewX:-15,duration:0.62,stagger:0.08},0.04);
  tl.fromTo([qs('.hero-role',hero),qs('.hero-lede',hero)],{y:30,autoAlpha:0},
    {y:0,autoAlpha:1,duration:0.46,stagger:0.07},0.30);
  tl.fromTo(qs('.hero-cta',hero),{y:30,autoAlpha:0},{y:0,autoAlpha:1,duration:0.44},0.40);
  tl.fromTo(qsa('.hero-tele>div',hero),{y:22,autoAlpha:0},
    {y:0,autoAlpha:1,duration:0.4,stagger:0.06},0.44);
  tl.fromTo(qs('.scroll-cue',hero),{autoAlpha:0},{autoAlpha:1,duration:0.4},0.6);
  tl.call(function(){scrambleAll(hero,0.09);},null,0.12);
}

/* ═══════════════════════════════════════════════════════════════
   16 · INIT
   ═══════════════════════════════════════════════════════════════ */
function bootStrip(){
  var el=qs('#boot');
  if(el){el.classList.add('is-done');el.setAttribute('aria-hidden','true');}
}

/* ── WebGL context loss recovery ──────────────────────────────────────────
   iOS Safari drops the GL context on every app switch and on memory pressure,
   and Android Chrome does the same under backgrounding or a low-memory kill.
   Without these handlers the canvas stays permanently black after the user
   returns to the tab — the hero background simply dies with no error.
   preventDefault() on 'webglcontextlost' is what makes the browser willing to
   fire 'webglcontextrestored' at all. */
function bindGLRecovery(){
  var c=VIS.canvas;
  if(!c||!c.addEventListener){return;}
  c.addEventListener('webglcontextlost',function(e){
    e.preventDefault();
    glRenderer=null;
    if(fpsEl){fpsEl.textContent='CORE PAUSED';}
  },false);
  c.addEventListener('webglcontextrestored',function(){
    sizeCanvas();
    glRenderer=initGL();
    if(glRenderer){
      if(fpsEl){fpsEl.textContent='CORE RESUMED';}
      /* a single frame proves the pipeline works again */
      glRenderer.draw((t0||0)/1000+2.4);
    }else{
      /* GPU refused to come back — degrade to Canvas2D, never to a black box */
      ctxRenderer=ctxRenderer||init2D();
    }
  },false);
}
function init(){
  sizeCanvas();
  glRenderer=initGL();
  if(!glRenderer){ctxRenderer=init2D();}
  bindGLRecovery();
  if(!glRenderer&&!ctxRenderer){
    CORE.fluxTarget=1;CORE.flux=1;             /* CSS radial core stands in */
  }else if(reduceMotion){
    CORE.flux=1;CORE.fluxTarget=1;CORE.speedTarget=0.35;CORE.speed=0.35;
    (glRenderer||ctxRenderer).draw(2.4);
    if(fpsEl){fpsEl.textContent='CORE STATIC';}
  }else{
    window.requestAnimationFrame(loop);
  }

  bindPointer();
  initClock();
  initMode();
  initPortalTriggers();
  initMagnets(document);
  initReveals();
  onScrollFrame();

  var rsTimer=null;
  window.addEventListener('resize',function(){
    if(rsTimer){window.clearTimeout(rsTimer);}
    rsTimer=window.setTimeout(function(){
      sizeCanvas();
      if(reduceMotion&&(glRenderer||ctxRenderer)){(glRenderer||ctxRenderer).draw(2.4);}
      if(portalOpen){setOrigin(window.innerWidth/2,window.innerHeight/2);}
    },140);
  },{passive:true});

  window.addEventListener('visibilitychange',function(){t0=null;});

  if(reduceMotion||!G){
    bootStrip();
    bootDone=true;
    root.classList.add('booted');   /* keep parity with the GSAP boot path */
    CORE.fluxTarget=1;CORE.flux=1;
    heroEntrance();
    scrambleAll(qs('.hero'),0);
  }else{
    runBoot(function(){
      bootDone=true;
      heroEntrance();
      root.classList.add('booted');
    });
  }

  /* deep link — #/resume or #/p/vi071 opens straight into a portal.
     Keys are normalised to lower case: CONTENT keys are lower case, so a
     case-insensitive match would resolve a key that can never exist. */
  function deepKey(){
    var m=/^#\/(?:p\/)?([a-z0-9]+)$/i.exec(window.location.hash||'');
    if(!m){return null;}
    var k=m[1].toLowerCase();
    return contentFor(k)?k:null;
  }
  function handleDeepLink(){
    var k=deepKey();
    if(k&&!portalOpen){openPortal(k,qs('[data-open-portal="'+k+'"]'));}
    else if(!k&&portalOpen){closePortal();}
  }
  var deep=deepKey();
  if(deep){
    window.setTimeout(function(){
      openPortal(deep,qs('[data-open-portal="'+deep+'"]'));
    },reduceMotion?220:1500);
  }
  /* manual hash edits (address bar, in-page anchor) must route too */
  window.addEventListener('hashchange',function(){
    if(!bootDone){return;}
    handleDeepLink();
  });
  window.addEventListener('pageshow',function(e){
    if(e.persisted){t0=null;}
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}











})();
