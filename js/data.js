/* ══════════════════════════════════════════════════════════════════════
   1RY · PORTFOLIO_DATA — the single source of truth for both experiences.

   Rules this file exists to enforce:
   · Every fact here traces to Pilla_Sri_Sai_Rahul_Resume.pdf, to a public
     repository the author controls, or to a link checked on the date in
     meta.verifiedOn. Nothing is invented.
   · A link that failed or was not confirmed at that date is marked
     verified:false, and is rendered in the warning tone — never as a
     working demo.
   · No CGPA is listed: none has been issued.
   · No awards, finalist status, user numbers, clients, testimonials,
     employment or production claims appear anywhere.

   The Signal and The Archive both render from this object (js/render.js),
   so the two experiences cannot drift apart.
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

window.PORTFOLIO_DATA = {

  meta:{
    verifiedOn:'28 September 2026',
    sourceOfTruth:'Pilla_Sri_Sai_Rahul_Resume.pdf'
  },

  identity:{
    name:'Pilla Sri Sai Rahul',
    nameLines:['Pilla','Sri Sai','Rahul'],
    handle:'1RY',
    discipline:'Mechatronics Engineering · Embedded Systems · Software & AI',
    signalTagline:'Mechatronics Engineering · Embedded Systems · Applied AI',
    location:'Hyderabad, India',
    email:'fabledadventurer.pssr@gmail.com',
    resume:{href:'Pilla_Sri_Sai_Rahul_Resume.pdf',label:'Pilla_Sri_Sai_Rahul_Resume.pdf'},
    links:{
      github:{href:'https://github.com/1RY-O',label:'github.com/1RY-O'},
      linkedin:{href:'https://www.linkedin.com/in/sri-sai-rahul-pilla',label:'linkedin.com/in/sri-sai-rahul-pilla'},
      site:{href:'https://1ry-o.github.io/',label:'1ry-o.github.io'}
    }
  },

  /* Two registers, one person. The Signal is spoken; The Archive is filed. */
  statement:{
    signal:'First-semester Mechatronics Engineering student at Mahindra University, building independent projects across software, embedded systems, and AI-assisted applications.',
    archive:'First-semester Mechatronics Engineering student at Mahindra University. Independent project work spans audio-model inference, memory optimisation, voice-oriented electronics troubleshooting, and developer-support tooling — recorded here with its limits attached. Open to opportunities across mechatronics, embedded/IoT, and software engineering.'
  },

  facts:[
    {k:'Program',v:'B.Tech Mechatronics Engineering'},
    {k:'Institution',v:'Mahindra University · Hyderabad'},
    {k:'Window',v:'2026 → 2030 · first semester'},
    {k:'Open to',v:'Mechatronics · embedded/IoT · software'}
  ],

  education:[
    {period:'2026 → 2030',title:'B.Tech, Mechatronics Engineering',
     org:'Mahindra University · Hyderabad',
     note:'First semester. No CGPA has been issued, so none is shown.'},
    {period:'2026',title:'Class XII',org:'Andhra Pradesh State Board',note:'89%.'},
    {period:'2024',title:'Class X',org:'CBSE',note:'85.4%.'}
  ],

  activities:[
    {period:'2026 → present',title:'IoT & Robotics Trainee',org:'Unlox Academy',
     note:'Hands-on bench work with Arduino, ESP32, sensors, actuators, and circuit troubleshooting. A training programme, not employment.'},
    {period:'2026 → present',title:'Team Leader',org:'Entrepreneurship Cell (E-Cell) · Mahindra University',
     note:'Campus entrepreneurship-cell role, held alongside first-year coursework.'},
    {period:'2026',title:'Builder — hackathons',org:'Hack2Skill Gen-AI APAC · AssemblyAI × LabLab AI',
     note:'Builder roles at Gen-AI hackathon events. No placements, awards, or finalist status are claimed.'},
    {period:'Aug 2026',title:'BE10X — AI Tools & Claude Workshop',org:'Certificate of Completion',
     note:'Workshop covering applied AI tooling and Claude workflows.'},
    {period:'2026',title:'Member',org:'Blockchain Club · Computer Science Club (Enigma) · Mahindra University',
     note:'Campus technical-club membership.'}
  ],

  /* Section labels are presentation, but they live here so a rename
     happens once. Section ids are namespaced per mode (sig- / arc-) so the
     two experiences can never anchor to each other's sections. */
  nav:{
    signal:[
      {href:'#sig-transmissions',label:'Transmissions'},
      {href:'#sig-constellation',label:'Constellation'},
      {href:'#sig-channel',label:'Channel'}
    ],
    archive:[
      {href:'#arc-cases',label:'Case files'},
      {href:'#arc-matrix',label:'Matrix'},
      {href:'#arc-record',label:'Academic record'},
      {href:'#arc-activities',label:'Activities'},
      {href:'#arc-contact',label:'Contact'}
    ]
  },

  /* Technologies are listed only where a repository, the approved resume,
     or the training record supports them. */
  skills:[
    {title:'Languages',
     items:['Python','C','C++','Java','HTML','CSS'],
     proof:'Coursework, plus Python in the VI-071 inference worker and the hand-written HTML/CSS of this site.'},
    {title:'Embedded & IoT',
     items:['Arduino','ESP32','Sensors','Actuators'],
     proof:'Bench work during the IoT & Robotics training programme at Unlox Academy.'},
    {title:'Web & backend',
     items:['React','Vite','Node.js','Express','Next.js','FastAPI','REST APIs'],
     proof:'VI-071 job backend, Bobby (Next.js + FastAPI), and the Lumis client and service.'},
    {title:'AI & development',
     items:['Gemini API','Claude','AssemblyAI','LangGraph','Structured outputs','Prompt engineering','OpenCode','Cline'],
     proof:'Gemini in Lumis, AssemblyAI in CircuitMate, LangGraph in Bobby.'},
    {title:'Tools & platforms',
     items:['Git','GitHub','VS Code','Fedora / Linux','Tinkercad','Firebase','Firestore','Vercel','Render'],
     proof:'Version control across every public repository; Fedora/Linux workstation.'}
  ],

  projects:[
    /* ── 01 · VI-071 · flagship ─────────────────────────────────────── */
    {
      id:'vi071',index:'01',code:'VI-071',flagship:true,
      category:'Audio → sheet music',
      status:{label:'Active experiment',tone:'progress'},
      summary:'An audio-to-sheet-music workflow built around the awkward part of transcription: a recording becomes structured note events, readable notation, and musical files that can be inspected and exported.',
      stack:['MuScriptor','Python','Node / Express','TypeScript','FFmpeg','MIDI','MusicXML','Verovio'],
      facts:[
        {k:'Build',v:'Solo — inference worker, job backend, and notation pipeline.'},
        {k:'State',v:'Active experiment · CPU-only local work.'},
        {k:'Source',v:'github.com/1RY-O/Vi-071'}
      ],
      links:[{href:'https://github.com/1RY-O/Vi-071',label:'Source repository',external:true,verified:true}],
      benchmark:{
        caption:'MuScriptor model loading on CPU · peak memory, measured locally',
        columns:['Configuration','Python peak','Node + Python'],
        rows:[
          {cells:['Legacy FP32','1080.2 MB','1157.1 MB']},
          {cells:['Streaming FP32','1073.7 MB','1149.8 MB']},
          {cells:['Streaming BF16 — selected','766.9 MB','844.9 MB'],selected:true},
          {cells:['Streaming FP16','762.8 MB','836.6 MB']}
        ],
        note:'Streaming BF16 cut combined peak memory from 1157.1 MB to 844.9 MB — roughly 27% — in that local benchmark. FP16 measured slightly lower but showed slower generation and a narrower dynamic range in this setup. A separate later run reported ~690 MB combined peak; its measurement setup is unverified, so it is excluded from this comparison.'
      },
      limits:'Transcription accuracy and long-recording reliability remain under evaluation. Synthetic-test parity does not establish accuracy on arbitrary music. No public demo URL is claimed — a deployment address appears in the repository, but its working state is unverified.'
    },

    /* ── 02 · Bobby ─────────────────────────────────────────────────── */
    {
      id:'bobby',index:'02',code:'Bobby',flagship:false,
      category:'Developer troubleshooting assistant',
      status:{label:'Live demo verified',tone:'verified'},
      summary:'A developer troubleshooting assistant that stages an investigation into planning, error-and-code examination, and remediation instead of answering in a single shot.',
      stack:['Next.js','FastAPI','LangGraph','React Flow','Tailwind CSS'],
      facts:[
        {k:'Build',v:'Solo. The public repository carries local run and test instructions.'},
        {k:'State',v:'Live demo responded at the latest link check.'},
        {k:'Source',v:'github.com/1RY-O/Bobby'}
      ],
      links:[
        {href:'https://bobby-neon.vercel.app',label:'Live demo',external:true,verified:true},
        {href:'https://github.com/1RY-O/Bobby',label:'Source repository',external:true,verified:true}
      ],
      limits:'Investigation quality depends on the error context supplied — incomplete traces produce weaker plans. No awards, user numbers, or production claims are made.'
    },

    /* ── 03 · CircuitMate ───────────────────────────────────────────── */
    {
      id:'circuitmate',index:'03',code:'CircuitMate',flagship:false,
      category:'Electronics troubleshooting by voice',
      status:{label:'Prototype · links partly unverified',tone:'progress'},
      summary:'Hands-busy debugging for Arduino and ESP32 work: talk the problem through and get clarifying questions back instead of stopping to type at the bench.',
      stack:['AssemblyAI voice agent','Node / Express','Electronics knowledge base','Arduino','ESP32'],
      facts:[
        {k:'Build',v:'Solo — voice-agent integration and a hardware-focused knowledge base.'},
        {k:'State',v:'Frontend demo responded at the latest link check; the backend demo timed out.'},
        {k:'Source',v:'github.com/1RY-O/CircuitMate'}
      ],
      links:[
        {href:'https://github.com/1RY-O/CircuitMate',label:'Source repository',external:true,verified:true},
        {href:'https://circuitmate-chi.vercel.app',label:'Frontend demo',external:true,verified:true},
        {href:'https://circuitmate.onrender.com',label:'Backend demo — timed out at last check',external:true,verified:false}
      ],
      limits:'Both demo addresses are listed in the resume; the backend address did not respond during the latest verification, so it is shown as unconfirmed rather than working. Coverage of exotic hardware and fault classes is not claimed.'
    },

    /* ── 04 · Lumis ─────────────────────────────────────────────────── */
    {
      id:'lumis',index:'04',code:'Lumis',flagship:false,
      category:'AI journaling platform',
      status:{label:'Incomplete prototype',tone:'prototype'},
      summary:'A quieter place to think, write, and reflect, with AI support when it is wanted. A full-stack prototype whose features and deployment are still being validated.',
      stack:['React','Vite','Firebase Auth','Firestore','Node / Express','Cloud Run','Gemini API'],
      facts:[
        {k:'Build',v:'Solo — client, backend service, and AI integration.'},
        {k:'State',v:'Incomplete prototype. Broken or unimplemented features are not claimed as working.'},
        {k:'Source',v:'github.com/1RY-O/lumis-journal'}
      ],
      links:[{href:'https://github.com/1RY-O/lumis-journal',label:'Source repository',external:true,verified:true}],
      shots:[
        {src:'assets/lumis-landing.webp',fallback:'assets/lumis-landing.png',
         alt:'Lumis landing screen — a real screenshot from the prototype repository',
         caption:'Landing',width:952,height:903},
        {src:'assets/lumis-app.webp',fallback:'assets/lumis-app.png',
         alt:'Lumis journal view — a real screenshot from the prototype repository',
         caption:'Journal view',width:942,height:910}
      ],
      limits:'Deployment and feature completeness remain under validation; treat the source as work in progress. These screenshots show the prototype interface, not a finished product.'
    }
  ]
};
