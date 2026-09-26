(function(){
'use strict';
var root=document.documentElement;
root.classList.remove('no-js');
var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function qs(s,b){return (b||document).querySelector(s)}
function qsa(s,b){return Array.prototype.slice.call((b||document).querySelectorAll(s))}
var COPY_N={
'hero-field':'ENGINEERING / SOFTWARE / SYSTEMS',
'hero-sub':'Mechatronics engineering, embedded systems, AI-assisted tools, and software built through experimentation.',
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
COPY_N['cm-note']='Covers sensors, motors + circuit troubleshooting with clarifying questions, contextual flows, routing + safety-oriented guidance. Deployment + feature status verify before any availability claim.';
COPY_N['bobby-title']='Bobby — guided debugging investigation';
COPY_N['bobby-tag']='Plan the work, inspect the clues, move toward a focused fix.';
COPY_N['bobby-desc']='Bobby turns debugging into a guided investigation: plan the work, inspect the clues, and move toward a focused fix.';
COPY_N['lumis-title']='Lumis Journal';
COPY_N['lumis-tag']='A quieter place to think, write, and reflect.';
COPY_N['lumis-desc']='A quieter place to think, write, and reflect — with AI support when you want it.';
COPY_N['about-copy']='I’m a Mechatronics Engineering student exploring the space between physical systems and software—building embedded tools, AI-assisted workflows, and experiments that make complex systems easier to understand.';
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
try{
  var saved=sessionStorage.getItem('iry-mode');
  if(saved==='professional'){setMode('professional');}
}catch(e){}
function armReveals(){
  var els=qsa('.rv');
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
function onScroll(){
  var st=root.scrollTop;
  var span=root.scrollHeight-innerHeight;
  if(span>0){fill.style.width=Math.max(0,Math.min(100,st/span*100))+'%';}
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();
qsa('.streak').forEach(function(s){
  new IntersectionObserver(function(en){
    if(en[0].isIntersecting){s.classList.remove('lit');void s.offsetWidth;s.classList.add('lit');}
  },{threshold:.6}).observe(s);
});
armReveals();
try{console.log('%c1RY // high-voltage engineering portfolio','color:#B6FF2E;font-family:monospace');}catch(e){}
})();