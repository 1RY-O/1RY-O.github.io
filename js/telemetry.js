/* ══════════════════════════════════════════════════════════════════════
   1RY · telemetry — the Signal's live HUD readout.

   Four values, all of them derived, none of them invented:
     · DEPTH  — real scroll fraction of the document (1.0 = footer);
     · RA     — depth mapped to a 24 h right-ascension frame plus a slow
                sensor drift, so the readout breathes while idle;
     · DEC    — depth mapped from −42° at the masthead to +42° at the
                end of the record;
     · FIELD  — the sector that depth falls in (INNER → MIDPLANE → JET
                → ESCAPE), the same flow zones the accretion disk uses.

   It defines window.PORTFOLIO_TELEMETRY with one entry point, tick(now),
   and js/motion.js calls it from the single frame loop — 15 Hz writes
   are the only DOM cost. Values are written as textContent into fixed
   tabular-numeral cells, so nothing ever reflows. When the footer comes
   into view the HUD parks itself (a class; css/signal.css does the
   fade), and in Archive mode the display rule hides it entirely.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root=document.documentElement;
var WRITE_MS=66;                 /* ~15 Hz */
var lastWrite=0,docSpan=1;
var hud=null,out={},parked=false,foot=null,started=false;

function pad(n,w){
  var s=String(n);
  while(s.length<w){s='0'+s;}
  return s;
}

function set(key,text){
  var el=out[key];
  if(el&&el.textContent!==text){el.textContent=text;}
}

/* Document span, re-measured only when the document or the viewport
   actually changes — never inside the frame loop. */
function measure(){
  var d=document.scrollingElement||document.documentElement;
  var max=d.scrollHeight-window.innerHeight;
  docSpan=max>1?max:1;
}

function scrollY(){
  var d=document.scrollingElement||document.documentElement;
  return d.scrollTop||window.scrollY||0;
}

function write(now){
  var dep=Math.min(1,Math.max(0,scrollY()/docSpan));
  var sec=now/1000;

  /* RA: depth as hours, plus 14.4 s of drift per full revolution —
     a deterministic function of (depth, time), never random. */
  var ra=(dep*24+sec*(24/6000))%24;
  var rh=Math.floor(ra);
  var rm=Math.floor((ra-rh)*60);

  /* DEC: signed degrees, minutes below. */
  var dec=-42+dep*84;
  var mag=Math.abs(dec);
  var dd=Math.floor(mag);
  var dm=Math.floor((mag-dd)*60);

  set('ra',pad(rh,2)+'h'+pad(rm,2)+'m');
  set('dec',(dec<0?'-':'+')+pad(dd,2)+'\u00B0'+pad(dm,2)+'\u2032');
  set('depth',(dep*100).toFixed(1)+'%');
  set('field',dep<0.25?'INNER':(dep<0.5?'MIDPLANE':(dep<0.75?'JET':'ESCAPE')));
}

function tick(now){
  if(!started||root.getAttribute('data-mode')!=='signal'){return;}
  if(now-lastWrite<WRITE_MS){return;}
  lastWrite=now;
  write(now);
}

function park(entries){
  var vis=entries.length?entries[0].isIntersecting:false;
  if(vis===parked){return;}
  parked=vis;
  if(hud){hud.classList.toggle('is-parked',parked);}
}

function init(){
  hud=document.querySelector('[data-telemetry]');
  if(!hud){return;}
  ['ra','dec','depth','field'].forEach(function(k){
    out[k]=hud.querySelector('[data-tele="'+k+'"]');
  });
  measure();
  window.addEventListener('resize',measure,false);
  if(window.ResizeObserver){
    try{new window.ResizeObserver(measure).observe(document.body);}catch(e){}
  }
  foot=document.querySelector('.site-foot');
  if(foot&&window.IntersectionObserver){
    try{
      new window.IntersectionObserver(park,{rootMargin:'0px 0px 80px 0px'})
        .observe(foot);
    }catch(e){}
  }
  started=true;
  write(0);                      /* correct values before first paint of it */
}

window.PORTFOLIO_TELEMETRY={tick:tick,measure:measure};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
})();
