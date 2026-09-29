/* ══════════════════════════════════════════════════════════════════════
   1RY · render — turns PORTFOLIO_DATA into both experiences.

   The two experiences share one data object and one set of escaping
   helpers, and nothing else: the markup each produces is structurally
   different on purpose. A fact changed in js/data.js changes in both.

   This module never touches the DOM and never reads user input. It
   returns strings, and every interpolated value goes through esc() or
   safeHref() first.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var DATA = window.PORTFOLIO_DATA;

/* ── Escaping for text and attribute contexts ── */
function esc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* ── Only navigational schemes may reach an href. Today every value is
      authored above, but this is the one place a data value becomes a
      link, so the allowlist lives here and not in the data file. ── */
var SAFE_HREF=/^(https:\/\/|mailto:|#|\/(?!\/)|[A-Za-z0-9._~-]+[\/.])/;
function safeHref(href){
  var h=String(href==null?'':href).trim();
  return SAFE_HREF.test(h)?h:null;
}

/* ── Link. An unverified address is marked so it can be styled as
      unconfirmed — never presented as a working demo. ── */
function link(l,cls){
  if(!l){return '';}
  var href=safeHref(l.href);
  if(!href){return '';}
  var target=(l.external===false)?'':' target="_blank" rel="noopener noreferrer"';
  var flag=(l.verified===false)?' data-unverified="true"':'';
  return '<a class="'+(cls||'link')+'" href="'+esc(href)+'"'+target+flag+'>'+esc(l.label)+'</a>';
}

function chips(items,extra){
  if(!items||!items.length){return '';}
  return '<ul class="chips">'+items.map(function(t){
    return '<li class="chip'+(extra?' '+extra:'')+'">'+esc(t)+'</li>';
  }).join('')+'</ul>';
}

function status(s){
  if(!s){return '';}
  return '<span class="status status--'+esc(s.tone||'plain')+'">'+esc(s.label)+'</span>';
}

function facts(list){
  if(!list||!list.length){return '';}
  return '<dl class="archive-facts">'+list.map(function(f){
    return '<div><dt>'+esc(f.k)+'</dt><dd>'+esc(f.v)+'</dd></div>';
  }).join('')+'</dl>';
}

/* ── Benchmark table. Only rendered where real measurements exist. ── */
function benchmark(b){
  if(!b){return '';}
  var head='<tr>'+b.columns.map(function(c){
    return '<th scope="col">'+esc(c)+'</th>';
  }).join('')+'</tr>';
  var body=b.rows.map(function(r){
    return '<tr'+(r.selected?' class="is-selected"':'')+'>'+r.cells.map(function(c,i){
      return (i===0?'<th scope="row">'+esc(c)+'</th>':'<td>'+esc(c)+'</td>');
    }).join('')+'</tr>';
  }).join('');
  return '<div class="bench-wrap"><table class="bench">'+
      '<caption>'+esc(b.caption)+'</caption>'+
      '<thead>'+head+'</thead><tbody>'+body+'</tbody>'+
    '</table></div>'+
    (b.note?'<p class="bench__takeaway"><b>Reading the table:</b> '+esc(b.note)+'</p>':'');
}

/* ── Screenshots. Real captures only; the caption says so. ── */
function shots(list){
  if(!list||!list.length){return '';}
  return '<div class="shots">'+list.map(function(s){
    var src=safeHref(s.src),fallback=safeHref(s.fallback);
    if(!src){return '';}
    var source=fallback?'<source srcset="'+esc(src)+'" type="image/webp">':'';
    var imgSrc=fallback||src;
    return '<figure class="figure"><picture>'+source+
      '<img src="'+esc(imgSrc)+'" alt="'+esc(s.alt)+'"'+
      (s.width?' width="'+esc(s.width)+'"':'')+(s.height?' height="'+esc(s.height)+'"':'')+
      ' loading="lazy" decoding="async"></picture>'+
      (s.caption?'<figcaption>'+esc(s.caption)+'</figcaption>':'')+
    '</figure>';
  }).join('')+'</div>';
}

/* ── Dated record rows, used for education and activities ── */
function ledger(rows){
  if(!rows||!rows.length){return '';}
  return '<ol class="ledger">'+rows.map(function(r){
    return '<li>'+
      '<span class="ledger__period">'+esc(r.period)+'</span>'+
      '<div>'+
        '<h3 class="ledger__title">'+esc(r.title)+'</h3>'+
        '<p class="ledger__org">'+esc(r.org)+'</p>'+
        (r.note?'<p class="ledger__note">'+esc(r.note)+'</p>':'')+
      '</div>'+
    '</li>';
  }).join('')+'</ol>';
}

function nav(list,cls,label,pad){
  return '<nav class="'+cls+'" aria-label="'+esc(label)+'">'+list.map(function(n,i){
    var href=safeHref(n.href);
    if(!href){return '';}
    return '<a href="'+esc(href)+'">'+
      (pad?'<span aria-hidden="true">'+esc(('0'+(i+1)).slice(-2))+'</span>':'')+
      esc(n.label)+'</a>';
  }).join('')+'</nav>';
}

/* ══════════════════════════════════════════════════════════════════════
   THE SIGNAL
   Projects arrive as transmissions in a stacked log; capability reads as
   constellations of nodes. Order is spoken first, filed second.
   ══════════════════════════════════════════════════════════════════════ */

function transmission(p){
  var links=(p.links&&p.links.length)
    ? '<p class="transmission__links">'+p.links.map(function(l){return link(l);}).join('')+'</p>'
    : '';
  /* data-theme is the shard's climate: motion.js reads it the instant the
     lens captures the card and paints --theme / the shader's flood colour
     with it. Absent on data that never declares one, which leaves the
     house cyan in place. */
  return '<li class="transmission" id="transmission-'+esc(p.id)+'"'+
    (p.theme?' data-theme="'+esc(p.theme)+'"':'')+'>'+
    '<div class="transmission__head">'+
      '<span class="transmission__index" aria-hidden="true">'+esc(p.index)+'</span>'+
      '<h3 class="transmission__code">'+esc(p.code)+'</h3>'+
      '<span class="transmission__category">'+esc(p.category)+'</span>'+
      status(p.status)+
    '</div>'+
    '<p class="transmission__summary">'+esc(p.summary)+'</p>'+
    chips(p.stack)+
    links+
  '</li>';
}

function signalMarkup(){
  var I=DATA.identity, resume=safeHref(I.resume.href);

  var hero='<div class="signal-hero">'+
      '<p class="eyebrow signal-hero__tag">'+esc(I.signalTagline)+'</p>'+
      '<h1 class="signal-name" id="signal-heading">'+
        I.nameLines.map(function(l){return '<span class="signal-name__line">'+esc(l)+'</span>';}).join('')+
      '</h1>'+
      '<p class="signal-hero__lede">'+esc(DATA.statement.signal)+'</p>'+
    '</div>';

  var readout='<dl class="signal-readout">'+DATA.facts.map(function(f){
      return '<div><dt>'+esc(f.k)+'</dt><dd>'+esc(f.v)+'</dd></div>';
    }).join('')+'</dl>';

  var actions='<div class="signal-actions">'+
      (resume?'<a class="btn btn--primary" href="'+esc(resume)+'" download="'+esc(I.resume.label)+'">Resume · PDF</a>':'')+
      '<a class="btn" href="mailto:'+esc(I.email)+'">'+esc(I.email)+'</a>'+
      '<a class="btn btn--quiet" href="'+esc(safeHref(I.links.github.href))+'">'+esc(I.links.github.label)+'</a>'+
    '</div>';

  var transmissions='<section class="signal-section" id="sig-transmissions" aria-labelledby="sig-transmissions-title">'+
      '<div class="signal-section__head">'+
        '<p class="eyebrow">01 · Transmissions</p>'+
        '<h2 class="signal-section__title" id="sig-transmissions-title">Four builds, with their state attached.</h2>'+
        '<p class="signal-section__lede">Each entry is a project that exists, labelled with what is verified and what is still under evaluation.</p>'+
      '</div>'+
      '<ol class="transmissions">'+DATA.projects.map(transmission).join('')+'</ol>'+
    '</section>';

  var constellation='<section class="signal-section" id="sig-constellation" aria-labelledby="sig-constellation-title">'+
      '<div class="signal-section__head">'+
        '<p class="eyebrow">02 · Constellation</p>'+
        '<h2 class="signal-section__title" id="sig-constellation-title">Skills, tied to evidence.</h2>'+
        '<p class="signal-section__lede">Grouped the way they were actually learned — coursework, bench training, and repositories that exist. No gauges, no invented percentages.</p>'+
      '</div>'+
      '<div class="constellation">'+DATA.skills.map(function(g){
        return '<div class="node">'+
          '<h3 class="node__title">'+esc(g.title)+'</h3>'+
          '<p class="node__proof">'+esc(g.proof)+'</p>'+
          chips(g.items)+
        '</div>';
      }).join('')+'</div>'+
    '</section>';

  var channel='<section class="signal-section signal-channel" id="sig-channel" aria-labelledby="sig-channel-title">'+
      '<div class="signal-section__head">'+
        '<p class="eyebrow">03 · Channel · open</p>'+
        '<h2 class="signal-section__title" id="sig-channel-title">Send a signal.</h2>'+
        '<p class="signal-section__lede">Mechatronics, embedded/IoT, and software work. Email is the fastest route.</p>'+
      '</div>'+
      '<a class="signal-channel__mail" href="mailto:'+esc(I.email)+'">'+esc(I.email)+'</a>'+
      '<ul class="signal-channel__links">'+
        '<li>'+link(I.links.github)+'</li>'+
        '<li>'+link(I.links.linkedin)+'</li>'+
        (resume?'<li><a href="'+esc(resume)+'" download="'+esc(I.resume.label)+'">Resume · PDF</a></li>':'')+
      '</ul>'+
    '</section>';

  return hero+readout+actions+
    nav(DATA.nav.signal,'signal-nav','Signal sections',false)+
    transmissions+constellation+channel;
}

/* ══════════════════════════════════════════════════════════════════════
   THE ARCHIVE
   Projects become case files with a summary, a facts column, evidence,
   then limits. Everything is in reading order: nothing needs exploring.
   ══════════════════════════════════════════════════════════════════════ */

function caseFile(p){
  var links=(p.links&&p.links.length)
    ? '<p class="case-file__links">'+p.links.map(function(l){return link(l);}).join('')+'</p>'
    : '';
  return '<article class="case-file" id="case-'+esc(p.id)+'">'+
    '<div class="case-file__head">'+
      '<h3 class="case-file__code">'+esc(p.code)+'</h3>'+
      '<span class="case-file__category">'+esc(p.category)+'</span>'+
      status(p.status)+
      (p.flagship?'<span class="chip chip--accent">Flagship</span>':'')+
    '</div>'+
    '<div class="case-file__body">'+
      '<div><p class="case-file__summary">'+esc(p.summary)+'</p></div>'+
      '<div>'+facts(p.facts)+'</div>'+
    '</div>'+
    (p.stack&&p.stack.length?'<div>'+chips(p.stack)+'</div>':'')+
    links+
    benchmark(p.benchmark)+
    shots(p.shots)+
    (p.limits?'<p class="case-file__limits"><b>Limits.</b> '+esc(p.limits)+'</p>':'')+
  '</article>';
}

function archiveSection(num,id,title,note,body){
  return '<section class="archive-section" id="'+esc(id)+'" aria-labelledby="'+esc(id)+'-title">'+
    '<div class="archive-section__head">'+
      '<p class="archive-section__num">'+esc(num)+'</p>'+
      '<h2 class="archive-section__title" id="'+esc(id)+'-title">'+esc(title)+'</h2>'+
      '<p class="archive-section__note">'+esc(note)+'</p>'+
    '</div>'+
    body+
  '</section>';
}

function archiveMarkup(){
  var I=DATA.identity, resume=safeHref(I.resume.href);

  var factRows=DATA.facts.map(function(f){
    return '<div><dt>'+esc(f.k)+'</dt><dd>'+esc(f.v)+'</dd></div>';
  }).join('');

  var masthead='<header class="archive-masthead">'+
    '<div>'+
      '<p class="eyebrow archive-kicker">The Archive · professional record</p>'+
      '<h1 class="archive-name" id="archive-heading">'+esc(I.name)+'</h1>'+
      '<p class="archive-discipline">'+esc(I.discipline)+'</p>'+
      '<p class="archive-statement">'+esc(DATA.statement.archive)+'</p>'+
      '<div class="archive-actions">'+
        (resume?'<a class="btn btn--primary" href="'+esc(resume)+'" download="'+esc(I.resume.label)+'">Download resume · PDF</a>':'')+
        '<a class="btn" href="mailto:'+esc(I.email)+'">Email</a>'+
        '<a class="btn btn--quiet" href="'+esc(safeHref(I.links.github.href))+'">GitHub</a>'+
        '<a class="btn btn--quiet" href="'+esc(safeHref(I.links.linkedin.href))+'">LinkedIn</a>'+
      '</div>'+
    '</div>'+
    '<dl class="archive-facts">'+factRows+'</dl>'+
  '</header>';

  var cases=DATA.projects.map(caseFile).join('');

  var matrix=DATA.skills.map(function(g){
    return '<div class="matrix__group">'+
      '<h3 class="matrix__title">'+esc(g.title)+'</h3>'+
      '<p class="matrix__proof">'+esc(g.proof)+'</p>'+
      chips(g.items)+
    '</div>';
  }).join('');

  var contactBody='<a class="archive-contact__mail" href="mailto:'+esc(I.email)+'">'+esc(I.email)+'</a>'+
    '<ul class="contact-links">'+
      '<li>'+link(I.links.github)+'</li>'+
      '<li>'+link(I.links.linkedin)+'</li>'+
      '<li>'+link(I.links.site)+'</li>'+
      (resume?'<li><a class="link" href="'+esc(resume)+'" download="'+esc(I.resume.label)+'">Resume · PDF</a></li>':'')+
    '</ul>'+
    '<p class="archive-footnote">Links verified '+esc(DATA.meta.verifiedOn)+'. <b>'+esc(DATA.meta.sourceOfTruth)+'</b> remains the source of truth: nothing here claims a CGPA, an award, employment, or credentials beyond that file.</p>';

  return masthead+
    nav(DATA.nav.archive,'archive-index','Archive contents',true)+
    archiveSection('01','arc-cases','Case files',
      'What was built, what is verified, and what is still unproven. Figures are local measurements unless stated otherwise.',
      cases)+
    archiveSection('02','arc-matrix','Engineering matrix',
      'Each group names the coursework, bench training, or repository that supports it. No self-assigned scores.',
      '<div class="matrix">'+matrix+'</div>')+
    archiveSection('03','arc-record','Academic record',
      'B.Tech 2026 → 2030, first semester. No CGPA has been issued, so none is listed.',
      ledger(DATA.education))+
    archiveSection('04','arc-activities','Training & activities',
      'Training, campus roles, and events — described as what they are, never as employment.',
      ledger(DATA.activities))+
    archiveSection('05','arc-contact','Contact',
      'Open to mechatronics, embedded/IoT, and software engineering opportunities.',
      contactBody);
}

/* ── Footer links: same data, so the chrome cannot drift from the record. ── */
function footerLinks(){
  var I=DATA.identity, resume=safeHref(I.resume.href);
  return '<li><a class="link" href="mailto:'+esc(I.email)+'">Email</a></li>'+
    '<li>'+link(I.links.github,'link')+'</li>'+
    '<li>'+link(I.links.linkedin,'link')+'</li>'+
    (resume?'<li><a class="link" href="'+esc(resume)+'" download="'+esc(I.resume.label)+'">Resume · PDF</a></li>':'');
}

window.PORTFOLIO_RENDER={signal:signalMarkup,archive:archiveMarkup,footerLinks:footerLinks};
})();
