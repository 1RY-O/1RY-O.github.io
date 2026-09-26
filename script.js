(function(){
'use strict';
var root=document.documentElement;
root.classList.remove('no-js');
var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function qs(s,b){return (b||document).querySelector(s)}
function qsa(s,b){return Array.prototype.slice.call((b||document).querySelectorAll(s))}

var COPY_N={
'hero-field':'ENGINEERING / SOFTWARE / SYSTEMS',
'hero-sub':'Mechatronics Engineering student building embedded systems, robotics prototypes, and applied-AI software with measured, documented trade-offs.',
'vi071-title':'VI-071',
'vi071-tag':'Turn sound into something you can read.'
};
var COPY_P={
'hero-field':'EMBEDDED SYSTEMS / ROBOTICS / APPLIED AI',
'hero-sub':'Mechatronics Engineering student building embedded systems, robotics prototypes, and applied-AI software with measured, documented trade-offs.',
'vi071-title':'VI-071 — Audio-to-Notation Pipeline',
'vi071-tag':'Audio-to-symbolic-music workflow: inference, backend orchestration, notation.'
};
COPY_N['vi071-desc']='An audio-to-sheet-music experiment built around the messy part of music transcription: turning a recording into structured notes, readable notation, and usable musical files. VI-071 brings audio processing, model inference, symbolic formats, and score rendering into one workflow.';
COPY_N['vi071-narr']='I wanted to build more than a transcription demo. The interesting challenge was making the whole pipeline work — from audio input and model inference to notation that can be inspected, played, and exported. That meant working through model memory, backend jobs, file conversion, and the difference between a result that renders and a result that is musically accurate.';
COPY_N['vi071-bench']='On a local CPU benchmark, streaming BF16 reduced combined Node/Python peak memory from 1157.1 MB to 844.9 MB (~27%). Results are specific to the tested environment and workload.';
COPY_N['vi071-limits']='Limitations: transcription accuracy and long-recording reliability remain active evaluation areas. Synthetic test parity does not establish accuracy on arbitrary music.';
COPY_N['fleet-lede']='Supporting builds — each one real practice. Ask what is inside and I will show the build.';
COPY_N['cm-title']='CircuitMate';
COPY_N['cm-tag']='Voice-native troubleshooting for hands-busy debugging.';
COPY_N['cm-desc']='Your hands are busy debugging. CircuitMate lets you talk through the problem instead of stopping to type every question.';
COPY_N['cm-note']='Covers sensors, motors + circuit troubleshooting with clarifying questions, contextual flows, routing + safety-oriented guidance.';
COPY_N['bobby-title']='Bobby — guided debugging investigation';
COPY_N['bobby-tag']='Plan the work, inspect the clues, move toward a focused fix.';
COPY_N['bobby-desc']='Bobby turns debugging into a guided investigation: plan the work, inspect the clues, and move toward a focused fix.';
COPY_N['lumis-title']='Lumis Journal';
COPY_N['lumis-tag']='A quieter place to think, write, and reflect.';
COPY_N['lumis-desc']='A quieter place to think, write, and reflect — with AI support when you want it.';
COPY_N['about-copy']='I\'m a Mechatronics Engineering student exploring the space between physical systems and software—building embedded tools, AI-assisted workflows, and experiments that make complex systems easier to understand.';
COPY_N['r-vi071']='VI-071 — audio-to-notation experiment: pipeline, jobs, symbolic outputs, memory benchmark.';
COPY_N['r-lumis']='incomplete prototype — full-stack AI journaling experiment: auth, structured reflection, Cloud Run backend (features + deployment still being validated).';
COPY_N['r-bobby']='developer troubleshooting prototype: Next.js + FastAPI + LangGraph + React Flow.';
COPY_N['r-cm']='voice-first embedded troubleshooting prototype.';
COPY_P['vi071-desc']='Developed an audio-to-symbolic-music workflow integrating a React/TypeScript interface, Node/Express backend, Python inference worker, MuScriptor, FFmpeg, MIDI/MusicXML processing, and Verovio score rendering.';
COPY_P['vi071-narr']='Engineering focus: worker-backend integration, job-oriented processing and status handling, symbolic format handling, CPU memory profiling, streaming BF16 experiment, backend tests, and investigation of latency, model limits, chunking, and failure handling.';
COPY_P['vi071-bench']='Measured experiment: on a local CPU benchmark, streaming BF16 reduced combined Node/Python peak memory from 1157.1 MB to 844.9 MB (~27%). Specific to the tested environment and workload.';
COPY_P['vi071-limits']='Limitations: transcription accuracy and long-recording reliability remain active evaluation areas. No claim of perfect transcription, all-instrument handling, or production readiness.';
COPY_P['fleet-lede']='Selected supporting prototypes with verified stacks and honest status. No fabricated teams, deployments, users, or performance claims.';
COPY_P['cm-title']='CircuitMate — Embedded Troubleshooting Prototype';
COPY_P['cm-tag']='Voice-first diagnostic flows for electronics + embedded development.';
COPY_P['cm-desc']='Developed a voice-first embedded-systems troubleshooting prototype integrating speech interaction, contextual diagnostic flows, and a structured electronics knowledge base.';
COPY_P['cm-note']='Scope: Arduino, ESP32/ESP8266, Pico, sensors, motors; AssemblyAI voice-agent integration; backend API + knowledge base; safety-oriented guidance. Deployment unverified — no availability claim.';
COPY_P['bobby-title']='Bobby — Developer Troubleshooting Prototype';
COPY_P['bobby-tag']='Next.js + FastAPI + LangGraph orchestration with React Flow visualization.';
COPY_P['bobby-desc']='Built a full-stack developer troubleshooting prototype using a Next.js frontend, FastAPI backend, LangGraph workflow orchestration, and React Flow visualization.';
COPY_P['lumis-title']='Lumis Journal — AI-Assisted Journaling App';
COPY_P['lumis-tag']='Firebase authentication + Gemini conversational and summarization workflows.';
COPY_P['lumis-desc']='Developed a personal journaling application integrating Firebase authentication and Gemini-based conversational and summarization workflows.';
COPY_P['about-copy']='Mechatronics Engineering student focused on embedded systems, robotics, software engineering, and applied AI. Interested in building reliable systems that connect physical hardware, data, and software.';
COPY_P['r-vi071']='VI-071 — audio-to-notation pipeline: React/TS + Node/Express + Python/MuScriptor + FFmpeg + MIDI/MusicXML + Verovio; job workflow; BF16 memory experiment.';
COPY_P['r-lumis']='Lumis (incomplete prototype): React + Firebase Auth/Firestore + Node/Express + Cloud Run + Gemini; authenticated flows; feature + deployment state still being validated.';
COPY_P['r-bobby']='Bobby: Next.js + FastAPI + LangGraph + Tailwind + React Flow; orchestration prototype.';
COPY_P['r-cm']='CircuitMate: voice interaction + contextual diagnostics + electronics knowledge base.';

var mode='normal';
var live=document.createElement('p');
live.setAttribute('aria-live','polite');
live.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
document.body.appendChild(live);
function setMode(next){
  mode=(next==='professional')?'professional':'normal';
  try{sessionStorage.setItem('iry-mode',mode);}catch(e){}
  var map=(mode==='professional')?COPY_P:COPY_N;
  qsa('[data-mode-btn]').forEach(function(b){
    var on=b.getAttribute('data-mode-btn')===mode;
    b.classList.toggle('is-on',on);
    b.setAttribute('aria-checked',on?'true':'false');
    b.tabIndex=on?0:-1;
  });
  var apply=function(){
    qsa('[data-mode-text]').forEach(function(el){
      var k=el.getAttribute('data-mode-text');
      if(map[k]){el.textContent=map[k];}
    });
    document.body.classList.remove('swapping');
  };
  if(reduceMotion){apply();}
  else{document.body.classList.add('swapping');setTimeout(apply,160);}
  live.textContent='Mode: '+mode+'. Project descriptions updated.';
}
qsa('[role=radiogroup]').forEach(function(group){
  var btns=qsa('[data-mode-btn]',group);
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){setMode(btn.getAttribute('data-mode-btn'));});
    btn.addEventListener('keydown',function(e){
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp'){return;}
      e.preventDefault();
      var i=btns.indexOf(btn);
      var n=(e.key==='ArrowRight'||e.key==='ArrowDown')?btns[(i+1)%btns.length]:btns[(i-1+btns.length)%btns.length];
      n.focus();setMode(n.getAttribute('data-mode-btn'));
    });
  });
});
try{var saved=sessionStorage.getItem('iry-mode');if(saved==='professional'){setMode('professional');}}catch(e){}

function armReveals(){
  var els=qsa('.reveal');
  if(!('IntersectionObserver' in window)||reduceMotion){
    root.classList.add('js-armed');
    els.forEach(function(el){el.classList.add('in');});
    return;
  }
  root.classList.add('js-armed');
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}
    });
  },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  els.forEach(function(el){io.observe(el);});
}
var fill=qs('#progress-fill');
function onScroll(){var st=root.scrollTop;var span=root.scrollHeight-innerHeight;if(span>0){fill.style.width=Math.max(0,Math.min(100,st/span*100))+'%';}}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
qsa('.streak').forEach(function(s){
  new IntersectionObserver(function(en){
    if(en[0].isIntersecting){s.classList.remove('lit');void s.offsetWidth;s.classList.add('lit');}
  },{threshold:.6}).observe(s);
});
armReveals();

/* ══════════════════════════════════════════════════════════════
   KINETIC PANEL CANVAS ENGINE
   ══════════════════════════════════════════════════════════════ */
var DPR=function(){return Math.min(window.devicePixelRatio||1,2)};
function setupCanvas(id){
  var canvas=document.getElementById(id);
  if(!canvas)return null;
  var ctx=canvas.getContext('2d');
  function resize(){
    var rect=canvas.getBoundingClientRect();
    var d=DPR();
    canvas.width=Math.round(rect.width*d);
    canvas.height=Math.round(rect.height*d);
    ctx.setTransform(d,0,0,d,0,0);
    return{w:rect.width,h:rect.height};
  }
  var dims=resize();
  return{canvas,ctx,dims,resize};
}

/* ── PANEL 1: PARABOLIC REBOUND ARCS WITH SQUASH-AND-STRETCH ── */
var p1=setupCanvas('canvas-1');
var b1Bouncers=[
  {x:0,y:0,vx:260,vy:-420,r:12,color:'#FFE600',stroke:'#0A0A0C',trail:[],gravity:980,bounceLoss:0.88,trailMax:18},
  {x:0,y:0,vx:-320,vy:-380,r:8,color:'#FFA800',stroke:'#0A0A0C',trail:[],gravity:1050,bounceLoss:0.90,trailMax:14},
  {x:0,y:0,vx:180,vy:-480,r:6,color:'#0A0A0C',stroke:'#FFE600',trail:[],gravity:920,bounceLoss:0.86,trailMax:22}
];
var p1Ripples=[];
function initP1(){
  b1Bouncers.forEach(function(b,i){
    b.x=p1.dims.w*(0.2+i*0.3);
    b.y=p1.dims.h*0.4;
    b.vx=(i%2===0?1:-1)*(200+i*80);
    b.vy=-350-i*50;
    b.trail=[];
  });
}
initP1();
function updateP1(dt){
  if(!p1)return;
  var ctx=p1.ctx,w=p1.dims.w,h=p1.dims.h;
  var floor=h-36,ceil=36,left=36,right=w-36;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='rgba(10,10,12,0.12)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(left,floor);ctx.lineTo(right,floor);ctx.stroke();
  for(var x=left;x<=right;x+=24){ctx.beginPath();ctx.moveTo(x,floor);ctx.lineTo(x,floor+4);ctx.stroke();}
  for(var i=p1Ripples.length-1;i>=0;i--){
    var rip=p1Ripples[i];rip.r+=dt*140;rip.alpha-=dt*2.2;
    if(rip.alpha<=0){p1Ripples.splice(i,1);continue;}
    ctx.strokeStyle='rgba(10,10,12,'+(rip.alpha*0.8)+')';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(rip.x,floor,rip.r,rip.r*0.28,0,0,Math.PI*2);ctx.stroke();
  }
  b1Bouncers.forEach(function(b){
    b.trail.push({x:b.x,y:b.y});
    if(b.trail.length>b.trailMax)b.trail.shift();
    b.vy+=b.gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y+b.r>=floor){b.y=floor-b.r;b.vy=-Math.abs(b.vy)*b.bounceLoss;if(Math.abs(b.vy)<240)b.vy=-480-Math.random()*80;p1Ripples.push({x:b.x,r:4,alpha:1});}
    if(b.y-b.r<=ceil){b.y=ceil+b.r;b.vy=Math.abs(b.vy)*b.bounceLoss;}
    if(b.x+b.r>=right){b.x=right-b.r;b.vx=-Math.abs(b.vx);}
    if(b.x-b.r<=left){b.x=left+b.r;b.vx=Math.abs(b.vx);}
    if(b.trail.length>2){
      ctx.beginPath();ctx.moveTo(b.trail[0].x,b.trail[0].y);
      for(var t=1;t<b.trail.length;t++)ctx.lineTo(b.trail[t].x,b.trail[t].y);
      ctx.strokeStyle='rgba(10,10,12,0.14)';ctx.lineWidth=2;ctx.stroke();
      b.trail.forEach(function(pt,idx){
        var frac=idx/b.trail.length;
        ctx.fillStyle=b.color==='#0A0A0C'?'rgba(10,10,12,'+(frac*0.4)+')':'rgba(255,230,0,'+(frac*0.7)+')';
        ctx.beginPath();ctx.arc(pt.x,pt.y,b.r*(0.2+frac*0.6),0,Math.PI*2);ctx.fill();
      });
    }
    var speed=Math.hypot(b.vx,b.vy);
    var angle=Math.atan2(b.vy,b.vx);
    var stretch=Math.min(1.45,1+speed*0.0006);
    var squash=1/stretch;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.scale(stretch,squash);
    ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=b.stroke;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=b.color==='#0A0A0C'?'#FFE600':'#0A0A0C';
    ctx.fillRect(-2,-2,4,4);
    ctx.restore();
  });
}

/* ── PANEL 2: TENSION CORDS & STANDING WAVES ── */
var p2=setupCanvas('canvas-2');
var p2Cords=[
  {yFrac:0.28,tension:8.5,damp:0.96,amp:0,vel:0,phase:0},
  {yFrac:0.50,tension:12.0,damp:0.97,amp:0,vel:0,phase:1.2},
  {yFrac:0.72,tension:7.8,damp:0.95,amp:0,vel:0,phase:2.5}
];
var p2Timer=0;
function updateP2(dt){
  if(!p2)return;
  var ctx=p2.ctx,w=p2.dims.w,h=p2.dims.h;
  p2Timer+=dt;ctx.clearRect(0,0,w,h);
  var left=32,right=w-32;
  p2Cords.forEach(function(c,idx){
    c.vel+=Math.sin(p2Timer*(6+idx*2.5)+c.phase)*(45+idx*20)*dt;
    c.amp+=c.vel*dt;c.vel-=c.amp*c.tension*dt*60;c.vel*=Math.pow(c.damp,dt*60);
    var yBase=h*c.yFrac;
    ctx.fillStyle='#0A0A0C';ctx.fillRect(left-4,yBase-6,8,12);ctx.fillRect(right-4,yBase-6,8,12);
    ctx.fillStyle=idx===1?'#FFE600':'#FFA800';ctx.fillRect(left-2,yBase-3,4,6);ctx.fillRect(right-2,yBase-3,4,6);
    ctx.beginPath();ctx.moveTo(left,yBase);
    for(var i=1;i<=36;i++){
      var u=i/36,x=left+u*(right-left);
      var env=Math.sin(u*Math.PI),wave=Math.sin(u*Math.PI*3+p2Timer*8+c.phase)*0.25;
      ctx.lineTo(x,yBase+(c.amp*env)+(wave*c.amp*0.4));
    }
    ctx.strokeStyle=idx===1?'#0A0A0C':'rgba(10,10,12,0.75)';ctx.lineWidth=idx===1?2.5:1.8;ctx.stroke();
    var nodeU=0.5+Math.sin(p2Timer*(3.5+idx*1.8)+idx)*0.38;
    var nodeX=left+nodeU*(right-left);
    var nodeEnv=Math.sin(nodeU*Math.PI);
    var nodeY=yBase+(c.amp*nodeEnv);
    ctx.fillStyle='#FFE600';ctx.beginPath();ctx.arc(nodeX,nodeY,idx===1?10:7,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0A0A0C';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#FFA800';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(nodeX,nodeY-14);ctx.lineTo(nodeX,nodeY-22);ctx.moveTo(nodeX,nodeY+14);ctx.lineTo(nodeX,nodeY+22);ctx.stroke();
  });
  ctx.strokeStyle='rgba(255,230,0,0.4)';ctx.lineWidth=1;ctx.setLineDash([4,6]);
  var sweepX=left+((Math.sin(p2Timer*2)*0.5+0.5)*(right-left));
  ctx.beginPath();ctx.moveTo(sweepX,36);ctx.lineTo(sweepX,h-36);ctx.stroke();ctx.setLineDash([]);
}

/* ── PANEL 3: ORBITAL SPRING RINGS ── */
var p3=setupCanvas('canvas-3');
var p3Rings=[
  {baseR:30,r:30,targetR:30,vel:0,color:'#0A0A0C',width:2.2,dash:[]},
  {baseR:56,r:56,targetR:56,vel:0,color:'#FFE600',width:4.5,dash:[12,8]},
  {baseR:82,r:82,targetR:82,vel:0,color:'#FFA800',width:2.0,dash:[4,6]},
  {baseR:110,r:110,targetR:110,vel:0,color:'#0A0A0C',width:1.5,dash:[20,14]}
];
var p3Time=0,nextSnap=0.5;
function updateP3(dt){
  if(!p3)return;
  var ctx=p3.ctx,w=p3.dims.w,h=p3.dims.h;
  var cx=w/2,cy=h/2;p3Time+=dt;ctx.clearRect(0,0,w,h);
  if(p3Time>nextSnap){
    p3Rings.forEach(function(r,i){var f=(i%2===0)?1.35:0.65;r.targetR=r.baseR*(Math.random()<0.5?f:1/f);});
    nextSnap=p3Time+1.2+Math.random()*0.8;
  }
  ctx.strokeStyle='rgba(10,10,12,0.1)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-40,cy);ctx.lineTo(cx+40,cy);ctx.moveTo(cx,cy-40);ctx.lineTo(cx,cy+40);ctx.stroke();
  p3Rings.forEach(function(r,idx){
    var force=(r.targetR-r.r)*160;r.vel+=force*dt;r.r+=r.vel*dt;r.vel*=Math.pow(0.88,dt*60);
    ctx.save();ctx.translate(cx,cy);ctx.rotate((idx%2===0?1:-1)*p3Time*(1.8+idx*0.6));
    ctx.strokeStyle=r.color;ctx.lineWidth=r.width;
    if(r.dash.length)ctx.setLineDash(r.dash);
    ctx.beginPath();ctx.arc(0,0,Math.max(4,r.r),0,Math.PI*2);ctx.stroke();
    var numNotches=4;
    for(var k=0;k<numNotches;k++){
      var ang=(k*Math.PI*2)/numNotches,nx=Math.cos(ang)*r.r,ny=Math.sin(ang)*r.r;
      ctx.fillStyle=idx===1?'#0A0A0C':'#FFE600';ctx.beginPath();ctx.arc(nx,ny,3.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#0A0A0C';ctx.lineWidth=1;ctx.stroke();
    }
    ctx.restore();
  });
  var coreScale=1+Math.sin(p3Time*12)*0.22;
  ctx.fillStyle='#FFE600';ctx.beginPath();ctx.arc(cx,cy,12*coreScale,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#0A0A0C';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#0A0A0C';ctx.fillRect(cx-3,cy-3,6,6);
}

/* ── PANEL 4: ELASTIC COLLISION SPHERES WITH VELOCITY TRAILS ── */
var p4=setupCanvas('canvas-4');
var p4Parts=[
  {x:60,y:70,vx:340,vy:220,r:14,color:'#FFE600',stroke:'#0A0A0C',trails:[]},
  {x:220,y:160,vx:-280,vy:310,r:11,color:'#0A0A0C',stroke:'#FFE600',strokeW:2.5,trails:[]},
  {x:140,y:220,vx:260,vy:-320,r:8,color:'#FFA800',stroke:'#0A0A0C',trails:[]},
  {x:280,y:90,vx:-350,vy:-190,r:16,color:'#FFFFFF',stroke:'#0A0A0C',strokeW:3.0,trails:[]}
];
var p4Pings=[];
function updateP4(dt){
  if(!p4)return;
  var ctx=p4.ctx,w=p4.dims.w,h=p4.dims.h,pad=34;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='rgba(10,10,12,0.15)';ctx.lineWidth=1;ctx.strokeRect(pad,pad,w-pad*2,h-pad*2);
  var chLen=10;ctx.strokeStyle='#FFE600';ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.moveTo(pad,pad+chLen);ctx.lineTo(pad,pad);ctx.lineTo(pad+chLen,pad);
  ctx.moveTo(w-pad-chLen,pad);ctx.lineTo(w-pad,pad);ctx.lineTo(w-pad,pad+chLen);
  ctx.moveTo(pad,h-pad-chLen);ctx.lineTo(pad,h-pad);ctx.lineTo(pad+chLen,h-pad);
  ctx.moveTo(w-pad-chLen,h-pad);ctx.lineTo(w-pad,h-pad);ctx.lineTo(w-pad,h-pad-chLen);
  ctx.stroke();
  for(var i=p4Pings.length-1;i>=0;i--){
    var ping=p4Pings[i];ping.r+=dt*110;ping.alpha-=dt*2.8;
    if(ping.alpha<=0){p4Pings.splice(i,1);continue;}
    ctx.strokeStyle='rgba(255,230,0,'+ping.alpha+')';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(ping.x,ping.y,ping.r,0,Math.PI*2);ctx.stroke();
  }
  p4Parts.forEach(function(p,idx){
    p.trails.push({x:p.x,y:p.y});if(p.trails.length>12)p.trails.shift();
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.x-p.r<=pad){p.x=pad+p.r;p.vx=Math.abs(p.vx);p4Pings.push({x:p.x,y:p.y,r:6,alpha:1});}
    else if(p.x+p.r>=w-pad){p.x=w-pad-p.r;p.vx=-Math.abs(p.vx);p4Pings.push({x:p.x,y:p.y,r:6,alpha:1});}
    if(p.y-p.r<=pad){p.y=pad+p.r;p.vy=Math.abs(p.vy);p4Pings.push({x:p.x,y:p.y,r:6,alpha:1});}
    else if(p.y+p.r>=h-pad){p.y=h-pad-p.r;p.vy=-Math.abs(p.vy);p4Pings.push({x:p.x,y:p.y,r:6,alpha:1});}
    for(var j=idx+1;j<p4Parts.length;j++){
      var q=p4Parts[j];var dx=q.x-p.x,dy=q.y-p.y,dist=Math.hypot(dx,dy),minDist=p.r+q.r;
      if(dist<minDist){
        var nx=dx/(dist||1),ny=dy/(dist||1),overlap=minDist-dist;
        p.x-=nx*overlap*0.5;p.y-=ny*overlap*0.5;q.x+=nx*overlap*0.5;q.y+=ny*overlap*0.5;
        var kx=p.vx-q.vx,ky=p.vy-q.vy,pNorm=2*(nx*kx+ny*ky)/2;
        p.vx-=pNorm*nx;p.vy-=pNorm*ny;q.vx+=pNorm*nx;q.vy+=pNorm*ny;
        p4Pings.push({x:(p.x+q.x)/2,y:(p.y+q.y)/2,r:8,alpha:1.2});
      }
    }
    if(p.trails.length>2){
      ctx.beginPath();ctx.moveTo(p.trails[0].x,p.trails[0].y);
      for(var t=1;t<p.trails.length;t++)ctx.lineTo(p.trails[t].x,p.trails[t].y);
      ctx.strokeStyle=p.color==='#0A0A0C'?'rgba(10,10,12,0.15)':'rgba(255,230,0,0.45)';
      ctx.lineWidth=p.r*0.6;ctx.lineCap='round';ctx.stroke();
    }
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=p.stroke;ctx.lineWidth=p.strokeW||2;ctx.stroke();
    ctx.fillStyle=p.color==='#0A0A0C'?'#FFE600':'#0A0A0C';ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill();
  });
}

/* ══════════════════════════════════════════════════════════════
   HERO GSAP TIMELINE — Swiss-brutalist page-load choreography
   1) arcs draw/scale in over ~1.5s
   2) hero lines stagger up out of hard clip boxes (y-axis reveal)
   3) sub-copy + CTAs + reading box settle in
   4) magnetic hover on the black EXPLORE PROJECTS CTA
   ══════════════════════════════════════════════════════════════ */
function heroIntro(){
  var lines=qsa('.hero-line-inner');
  var arcs=qsa('.hero .arc');
  if(reduceMotion){
    arcs.forEach(function(a){a.style.opacity=a.getAttribute('opacity')||'1';});
    return;
  }
  if(!window.gsap){
    /* Graceful fallback when the GSAP CDN is unreachable. */
    document.documentElement.classList.add('no-gsap');
    return;
  }
  arcs.forEach(function(path){
    try{
      var len=path.getTotalLength();
      path.style.strokeDasharray=len;
      path.style.strokeDashoffset=len;
    }catch(e){}
  });
  gsap.set(lines,{yPercent:110});
  gsap.set(['.hero-sub','.hero-actions','.reading-box','.hero-tag','.hero-specs'],{y:26,autoAlpha:0});
  gsap.set('.site-head',{y:-70,autoAlpha:0});
  var tl=gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('.site-head',{y:0,autoAlpha:1,duration:0.7},0);
  tl.to('.hero .arc',{strokeDashoffset:0,duration:1.5,ease:'power2.inOut',stagger:0.08,
    onStart:function(){qsa('.hero .arc').forEach(function(a){a.style.opacity=a.getAttribute('opacity')||'1';});}
  },0.1);
  tl.to(lines,{yPercent:0,duration:0.95,stagger:0.12},0.15);
  tl.to('.hero-sub',{y:0,autoAlpha:1,duration:0.7},0.65);
  tl.to('.hero-actions',{y:0,autoAlpha:1,duration:0.7},0.78);
  tl.to('.reading-box',{y:0,autoAlpha:1,duration:0.7},0.9);
  tl.to(['.hero-tag','.hero-specs'],{y:0,autoAlpha:1,duration:0.6,stagger:0.1},1.0);
}
heroIntro();

/* Slight magnetic hover for the Explore CTA. */
(function magneticCTA(){
  var btn=qs('#explore-btn');
  if(!btn||reduceMotion||!window.gsap||!window.matchMedia('(pointer:fine)').matches){return;}
  var strength=14;
  btn.addEventListener('mousemove',function(e){
    var r=btn.getBoundingClientRect();
    var x=e.clientX-(r.left+r.width/2);
    var y=e.clientY-(r.top+r.height/2);
    gsap.to(btn,{x:x/r.width*strength*2,y:y/r.height*strength*2,duration:0.3,ease:'power3.out'});
  });
  btn.addEventListener('mouseleave',function(){
    gsap.to(btn,{x:0,y:0,duration:0.55,ease:'elastic.out(1,0.45)'});
  });
})();

/* ── MAIN SYNCHRONIZED KINETIC LOOP ── */
var lastTime=0;
function render(time){
  requestAnimationFrame(render);
  if(!lastTime){lastTime=time;return;}
  var dt=(time-lastTime)/1000;lastTime=time;
  if(dt>0.05)dt=0.05;
  updateP1(dt);updateP2(dt);updateP3(dt);updateP4(dt);
}
window.addEventListener('resize',function(){
  if(p1){p1.resize();initP1();}
  if(p2)p2.resize();
  if(p3)p3.resize();
  if(p4)p4.resize();
});
requestAnimationFrame(render);
try{console.log('%c1RY // HIGH-VOLTAGE KINETIC PORTFOLIO','color:#FFE600;font-family:monospace;background:#0A0A0C;padding:4px 8px;border:1px solid #FFE600;');}catch(e){}
})();
