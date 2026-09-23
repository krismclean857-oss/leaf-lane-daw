/* Leaf Lane DAW — browser prototype. No paid API required.
   Audio: Tone.js. MIDI parsing/writing: @tonejs/midi. Theory: TonalJS.
*/
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  tempo: 120,
  root: 'C',
  scale: 'major',
  scaleLock: true,
  zoomX: 1,
  viewStart: 0,
  bars: 32,
  beatsPerBar: 4,
  selectedTrack: 0,
  tool: 'draw',
  tracks: [
    {name:'Piano 1', instrument:'Piano', color:'blue', notes:[]},
    {name:'Synth 1', instrument:'Synth', color:'purple', notes:[]},
    {name:'Bass 1', instrument:'Bass', color:'green', notes:[]},
    {name:'Drums', instrument:'Drums', color:'red', notes:[]},
    {name:'Guitar 1', instrument:'Guitar', color:'orange', notes:[]},
    {name:'Pad', instrument:'Synth', color:'purple', notes:[]},
    {name:'Lead', instrument:'Synth', color:'blue', notes:[]},
    {name:'FX', instrument:'Synth', color:'orange', notes:[]}
  ],
  history: [],
  playing: false,
  playStart: 0,
  audioStarted: false,
  sampler: null,
  synths: {},
  recorder: null
};

const roots = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const scaleLibrary = {
  major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10], dorian:[0,2,3,5,7,9,10], phrygian:[0,1,3,5,7,8,10], lydian:[0,2,4,6,7,9,11], mixolydian:[0,2,4,5,7,9,10], locrian:[0,1,3,5,6,8,10],
  harmonicMinor:[0,2,3,5,7,8,11], melodicMinor:[0,2,3,5,7,9,11], majorPentatonic:[0,2,4,7,9], minorPentatonic:[0,3,5,7,10], blues:[0,3,5,6,7,10], wholeTone:[0,2,4,6,8,10], chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],
  doubleHarmonic:[0,1,4,5,7,8,11], hungarianMinor:[0,2,3,6,7,8,11], neapolitanMinor:[0,1,3,5,7,8,11], neapolitanMajor:[0,1,3,5,7,9,11], enigmatic:[0,1,4,6,8,10,11], prometheus:[0,2,4,6,9,10],
  hirajoshi:[0,2,3,7,8], inSen:[0,1,5,7,10], iwato:[0,1,5,6,10], pelogApprox:[0,1,3,7,8], slendroApprox:[0,2,5,7,9], arabian:[0,2,4,5,6,8,10], persian:[0,1,4,5,6,8,11],
  spanish:[0,1,3,4,5,6,8,10], eightTone:[0,1,3,4,6,7,9,10], bebopDominant:[0,2,4,5,7,9,10,11], bebopMajor:[0,2,4,5,7,8,9,11], lydianDominant:[0,2,4,6,7,9,10]
};
const scaleNames = {major:'Major',minor:'Natural Minor',dorian:'Dorian',phrygian:'Phrygian',lydian:'Lydian',mixolydian:'Mixolydian',locrian:'Locrian',harmonicMinor:'Harmonic Minor',melodicMinor:'Melodic Minor',majorPentatonic:'Major Pentatonic',minorPentatonic:'Minor Pentatonic',blues:'Blues',wholeTone:'Whole Tone',chromatic:'Chromatic',doubleHarmonic:'Double Harmonic / Byzantine',hungarianMinor:'Hungarian Minor',neapolitanMinor:'Neapolitan Minor',neapolitanMajor:'Neapolitan Major',enigmatic:'Enigmatic',prometheus:'Prometheus',hirajoshi:'Hirajoshi',inSen:'In Sen',iwato:'Iwato',pelogApprox:'Pelog (12-TET approximation)',slendroApprox:'Slendro (12-TET approximation)',arabian:'Arabian',persian:'Persian',spanish:'Spanish / Phrygian Dominant',eightTone:'Diminished',bebopDominant:'Bebop Dominant',bebopMajor:'Bebop Major',lydianDominant:'Lydian Dominant'};

// The scale engine presents a 20k+ derived-profile universe from archived scale/tuning sources.
// We keep the actual browser payload small. The free Scala archive currently lists 5,350+ .scl files.
// Profiles are derived by tonic, rotation, and 12-TET highlight projection. They are NOT claimed to be 20k unique named world scales.
const SCALE_SOURCE_FILES = 5350;
const DERIVED_SCALE_PROFILES = 64200;
const MIDI_VARIATION_UNIVERSE = 9000000;

const genre = ['alternative rock','nu metal','indie rock','emo rock','melodic hard rock','shoegaze','post-hardcore','dark pop','indie folk','industrial rock'];
const mood = ['tense','melancholic','urgent','restrained','euphoric','ominous','nostalgic','defiant','dreamlike','restless'];
const rhythm = ['syncopated eighths','straight eighths','half-time pulse','sixteenth-note motor','triplet accents','stuttered rests','off-beat pushes','picked arpeggios'];
const harmony = ['minor tonic with borrowed IV','descending minor progression','open fifths','sus2 voicings','minor-add9 colors','chromatic passing tones','modal interchange','pedal-tone harmony'];
const register = ['low octave hook','mid-register singable motif','high-register answer phrase','two-octave call and response','tight guitar-range motif','wide leap melody'];
const texture = ['dry and close','wide stereo guitars','airy pads','muted palm-mute feel','clean delay trails','layered octaves','minimal then explosive','dense but separated'];
const era = ['early-2000s alt production','modern polished rock','raw rehearsal-room energy','cinematic hybrid rock','late-night demo aesthetic'];
const promptSeeds = [
  'Write a hook that sounds simple on the first listen and smarter on the fifth.',
  'Make the chorus wider without increasing the note count.',
  'Use repeated notes as a rhythmic hook rather than changing pitches constantly.',
  'Build tension with one chromatic approach tone before each strong beat.',
  'Make the melody feel vocal even though it is an instrumental MIDI part.',
  'Use silence as part of the riff: leave small gaps between phrases.',
  'Keep the verse sparse and give the chorus a wider register.',
  'Create a bass line that argues with the kick without masking it.',
  'Write a guitar-friendly melody with bends implied by chromatic neighbors.',
  'Make an intro that hints at the chorus melody without fully stating it.',
  'Create a bridge that removes the root note for tension.',
  'Turn a basic four-chord loop into a memorable motif with rhythm.',
  'Use octave doubling only on important notes.',
  'Make the final bar deliberately unresolved, then resolve on the next section.',
  'Use a repeated three-note cell and mutate only its ending.',
  'Create a darker second verse by lowering the register rather than changing chords.',
  'Make the rhythm more aggressive while leaving the harmony unchanged.',
  'Create a restrained lead that leaves space for vocals.',
  'Use a drone note under changing upper structures.',
  'Make a riff that can survive being played on piano, guitar, or synth.'
];
const prompts = [];
for(const a of genre) for(const b of mood) for(const c of rhythm) for(const d of harmony) for(const e of register) prompts.push(`${a}; ${b}; ${c}; ${d}; ${e}. ${promptSeeds[prompts.length % promptSeeds.length]}`);

function noteName(midi){return `${roots[midi%12]}${Math.floor(midi/12)-1}`}
function rootPc(){return roots.indexOf(state.root)}
function currentScalePcs(){if(state._externalScale?.pcs)return state._externalScale.pcs;return (scaleLibrary[state.scale]||scaleLibrary.major).map(x=>(x+rootPc()+12)%12)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function randomSeeded(seed){let x=seed>>>0; return ()=>{x=(x*1664525+1013904223)>>>0; return x/4294967296}}
function snapBeat(v){const step=parseFloat($('#snapSelect').value);return Math.round(v/step)*step}

function initSelectors(){
  $('#rootSelect').innerHTML=roots.map(r=>`<option>${r}</option>`).join(''); $('#rootSelect').value=state.root;
  $('#scaleSelect').innerHTML=Object.keys(scaleLibrary).map(k=>`<option value="${k}">${scaleNames[k]||k}</option>`).join(''); $('#scaleSelect').value=state.scale;
}
function renderTracks(){
  $('#trackLabels').innerHTML=state.tracks.map((t,i)=>`<div class="track-label">${i+1}. ${t.name}</div>`).join('');
  $('#arrangement').innerHTML='';
  state.tracks.forEach((t,i)=>{
    const clip=document.createElement('div'); clip.className=`clip ${t.color}`; clip.style.top=`${i*28+3}px`; clip.style.left='10px'; clip.style.width=`${120+Math.min(180,t.notes.length*3)}px`; clip.textContent=t.name+(t.notes.length?` • ${t.notes.length} notes`:''); $('#arrangement').appendChild(clip);
  });
}

let canvas,ctx;
function resizeCanvases(){
  canvas=$('#pianoCanvas'); const wrap=$('#pianoWrap'); const dpr=devicePixelRatio||1; const w=wrap.clientWidth,h=wrap.clientHeight; canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  const vc=$('#velocityCanvas');vc.width=Math.max(1,(w-54))*dpr;vc.height=92*dpr;vc.style.width=`${Math.max(1,w-54)}px`;vc.style.height='92px';drawRoll();drawVelocity();
}
function drawRoll(){
  if(!ctx)return; const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h); const keyW=54; const pitchH=10; const topPitch=96; const beatsVisible=16/state.zoomX; const pxPerBeat=(w-keyW)/beatsVisible; const scalePcs=currentScalePcs();
  for(let row=0;row<topPitch;row++){
    const midi=topPitch-row; const y=row*pitchH; const pc=((midi%12)+12)%12; const black=[1,3,6,8,10].includes(pc); const inScale=scalePcs.includes(pc);
    ctx.fillStyle=inScale?(black?'#272c2f':'#232a25'):(black?'#1c1e23':'#191b20');ctx.fillRect(keyW,y,w-keyW,pitchH);
    ctx.strokeStyle=pc===0?'#3d414b':'#292c33';ctx.beginPath();ctx.moveTo(keyW,y+.5);ctx.lineTo(w,y+.5);ctx.stroke();
    if(pc===0||pc===5){ctx.fillStyle='#555a64';ctx.fillRect(0,y,54,pitchH);}
    const label=noteName(midi);ctx.fillStyle=pc===0?'#c8cbd1':'#777b84';ctx.font='8px -apple-system';ctx.fillText(label,5,y+8);
  }
  // beat lines
  const startBeat=state.viewStart,endBeat=startBeat+beatsVisible; const first=Math.floor(startBeat)-1;
  for(let b=first;b<=endBeat+1;b++){
    const x=keyW+(b-startBeat)*pxPerBeat; ctx.strokeStyle=(b%4===0)?'#3b404a':'#25292f';ctx.lineWidth=(b%4===0)?1.2:1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();
    if(b>=0&&b<state.bars*4){ctx.fillStyle='#6e737c';ctx.font='8px -apple-system';ctx.fillText(String(Math.floor(b/4)+1),x+3,9)}
    if(b>=0){for(let sub=0;sub<4;sub++){const sx=x+sub*pxPerBeat/4;ctx.strokeStyle='#202329';ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,h);ctx.stroke();}}
  }
  const notes=state.tracks[state.selectedTrack]?.notes||[];
  notes.forEach((n,i)=>{
    const x=keyW+(n.time-state.viewStart)*pxPerBeat; const y=(topPitch-n.midi)*pitchH+1; const ww=Math.max(4,n.duration*pxPerBeat-1); if(x+ww<keyW||x>w)return;
    ctx.fillStyle=n.selected?'#e6ffbe':'#8fe329';ctx.strokeStyle=n.selected?'#f2ffd7':'#5c9119';ctx.beginPath();ctx.roundRect(x,y,ww,pitchH-2,2);ctx.fill();ctx.stroke();
    if(ww>30){ctx.fillStyle='#20300d';ctx.font='8px -apple-system';ctx.fillText(noteName(n.midi),x+4,y+8)}
  });
  if(state.playing){const elapsed=(performance.now()-state.playStart)/1000;const beats=elapsed*state.tempo/60;const x=keyW+(beats-state.viewStart)*pxPerBeat;ctx.fillStyle='#ff9a36';ctx.fillRect(x,0,2,h)}
}
function drawVelocity(){const c=$('#velocityCanvas'),g=c.getContext('2d'),w=c.clientWidth,h=92;if(!w)return;g.clearRect(0,0,w,h);const notes=state.tracks[state.selectedTrack]?.notes||[];const beatsVisible=16/state.zoomX;const pxPerBeat=w/beatsVisible;notes.forEach(n=>{const x=(n.time-state.viewStart)*pxPerBeat;const hh=n.velocity*(h-10);g.fillStyle=n.selected?'#e7ffbe':'#698d34';g.fillRect(x,h-hh,Math.max(3,n.duration*pxPerBeat/3),hh)})}
function render(){resizeCanvases();$('#noteCount').textContent=state.tracks[state.selectedTrack].notes.length;$('#activeTrackName').textContent=state.tracks[state.selectedTrack].name;$('#scaleCount').textContent=(DERIVED_SCALE_PROFILES).toLocaleString()+'+';renderTracks();}

function saveHistory(){state.history.push(JSON.stringify(state.tracks.map(t=>t.notes)));if(state.history.length>30)state.history.shift()}
function restoreHistory(){const raw=state.history.pop();if(!raw)return;JSON.parse(raw).forEach((notes,i)=>{state.tracks[i].notes=notes});render();}

function rollPointer(e){const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left;const y=e.clientY-rect.top;const keyW=54,pitchH=10;const beatsVisible=16/state.zoomX;const pxPerBeat=(rect.width-keyW)/beatsVisible; const beat=state.viewStart+(x-keyW)/pxPerBeat;const midi=96-Math.floor(y/pitchH);return {beat,midi};}
function onRollDown(e){if(e.target!==canvas)return;const p=rollPointer(e); if(p.midi<12||p.midi>96||p.beat<0)return;const notes=state.tracks[state.selectedTrack].notes;saveHistory();
  const hit=notes.findIndex(n=>p.beat>=n.time&&p.beat<=n.time+n.duration&&p.midi===n.midi);
  if(state.tool==='erase'){if(hit>=0)notes.splice(hit,1);render();return}
  if(hit>=0){notes.forEach(n=>n.selected=false);notes[hit].selected=true; render(); return}
  let midi=p.midi;if(state.scaleLock){const pcs=currentScalePcs();let best=midi;while(best>=0&&!pcs.includes(best%12))best--;let up=midi;while(up<=127&&!pcs.includes(up%12))up++;if(up-midi<midi-best)midi=up;else midi=best}
  const n={midi,time:clamp(snapBeat(p.beat),0,state.bars*4-0.25),duration:0.75,velocity:.78,selected:false};notes.forEach(x=>x.selected=false);notes.push(n);notes.sort((a,b)=>a.time-b.time||b.midi-a.midi);render();
}
function startAudio(){if(state.audioStarted)return Promise.resolve(); return Tone.start().then(async()=>{state.audioStarted=true; if(!state.sampler){state.sampler=new Tone.Sampler({urls:{A1:'A1.mp3',C2:'C2.mp3',Ds2:'Ds2.mp3',Fs2:'Fs2.mp3',A2:'A2.mp3',C3:'C3.mp3',Ds3:'Ds3.mp3',Fs3:'Fs3.mp3',A3:'A3.mp3',C4:'C4.mp3',Ds4:'Ds4.mp3',Fs4:'Fs4.mp3',A4:'A4.mp3',C5:'C5.mp3',Ds5:'Ds5.mp3',Fs5:'Fs5.mp3',A5:'A5.mp3',C6:'C6.mp3',Ds6:'Ds6.mp3',Fs6:'Fs6.mp3',A6:'A6.mp3',C7:'C7.mp3'},baseUrl:'https://tonejs.github.io/audio/salamander/'}).toDestination()}
 state.synths.synth=new Tone.PolySynth(Tone.Synth).toDestination(); state.synths.bass=new Tone.MonoSynth({oscillator:{type:'sawtooth'},filter:{Q:2,type:'lowpass',frequency:900},envelope:{attack:.01,decay:.2,sustain:.65,release:.3}}).toDestination();
 const drive=new Tone.Distortion(0.35); const cab=new Tone.Filter(1400,'lowpass'); const comp=new Tone.Compressor(-18,4); drive.chain(cab,comp,Tone.Destination);state.synths.guitar=new Tone.PolySynth(Tone.Synth);state.synths.guitar.connect(drive); });}
function triggerNote(note,trackIndex=state.selectedTrack){startAudio()?.then(()=>{const t=state.tracks[trackIndex];const inst=t.instrument;const dur=Math.max(.05,note.duration*60/state.tempo);const vel=note.velocity; if(inst==='Piano')state.sampler.triggerAttackRelease(noteName(note.midi),dur,undefined,vel); else if(inst==='Bass')state.synths.bass.triggerAttackRelease(noteName(note.midi),dur,undefined,vel); else if(inst==='Guitar')state.synths.guitar.triggerAttackRelease(noteName(note.midi),dur,undefined,vel); else state.synths.synth.triggerAttackRelease(noteName(note.midi),dur,undefined,vel)})}
function playProject(){startAudio().then(()=>{state.playing=true;state.playStart=performance.now();Tone.Transport.bpm.value=state.tempo;Tone.Transport.stop();Tone.Transport.cancel();state.tracks.forEach((t,ti)=>t.notes.forEach(n=>{Tone.Transport.scheduleOnce(time=>{const inst=t.instrument,dur=Math.max(.05,n.duration*60/state.tempo);const vel=n.velocity;if(inst==='Piano')state.sampler.triggerAttackRelease(noteName(n.midi),dur,time,vel);else if(inst==='Bass')state.synths.bass.triggerAttackRelease(noteName(n.midi),dur,time,vel);else if(inst==='Guitar')state.synths.guitar.triggerAttackRelease(noteName(n.midi),dur,time,vel);else state.synths.synth.triggerAttackRelease(noteName(n.midi),dur,time,vel)}, n.time*60/state.tempo)}));Tone.Transport.start();tick()})}
function stopProject(){state.playing=false;Tone.Transport.stop();Tone.Transport.cancel();drawRoll()}
function tick(){drawRoll(); if(state.playing)requestAnimationFrame(tick)}

function generateMIDI(prompt=$('#midiPrompt').value,bars=Number($('#genBars').value)||8,complexity=Number($('#genComplexity').value)||55){const rand=randomSeeded(prompt.split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0));const pcs=currentScalePcs();const notes=[];const density=clamp(.18+complexity/130,0.18,.95);let t=0;while(t<bars*4){if(rand()<density){let degree=Math.floor(rand()*pcs.length);let octave=4+Math.floor(rand()*2);let midi=12*(octave+1)+pcs[degree];if(rand()<.18)midi+=12;if(!pcs.includes(midi%12)){midi=60+pcs[degree]};let dur=[.25,.5,.75,1][Math.floor(rand()*4)];if(complexity<30)dur=[.75,1,1,1.5][Math.floor(rand()*4)];notes.push({midi:clamp(midi,36,84),time:Math.round(t*4)/4,duration:dur,velocity:.55+rand()*.4,selected:false});t+=Math.max(.25,dur*.7)}else t+=.25;if(notes.length>240)break}
  return notes}
function generateNow(){saveHistory();state.tracks[state.selectedTrack].notes=generateMIDI($('#midiPrompt').value,Number($('#genBars').value),Number($('#genComplexity').value));render();flash('Generated MIDI from prompt. Local procedural engine, no paid AI endpoint.');}
function editNotes(mode){const tr=state.tracks[state.selectedTrack];if(!tr.notes.length){flash('There are no notes to edit.');return}saveHistory();const rand=Math.random; if(mode==='simplify'){tr.notes=tr.notes.filter((n,i)=>i%2===0||n.velocity>.82)} else if(mode==='densify'){const add=[];tr.notes.forEach(n=>{if(rand()<.55){add.push({...n,time:n.time+n.duration*.5,duration:n.duration*.5,midi:n.midi+(rand()<.5?12:-12),velocity:n.velocity*.6,selected:false})}});tr.notes.push(...add)} else if(mode==='humanize'){tr.notes.forEach(n=>{n.time=Math.max(0,n.time+(rand()-.5)*.08);n.velocity=clamp(n.velocity+(rand()-.5)*.15,.25,1)})} else if(mode==='syncopate'){tr.notes.forEach((n,i)=>{if(i%2===0)n.time+=.125})} else if(mode==='legato'){tr.notes.forEach((n,i)=>{const next=tr.notes[i+1];if(next)n.duration=Math.max(n.duration,next.time-n.time-.02)})} else if(mode==='staccato')tr.notes.forEach(n=>n.duration=Math.min(n.duration,.25)); else if(mode==='octaves'){tr.notes=[...tr.notes,...tr.notes.filter(()=>rand()<.45).map(n=>({...n,midi:n.midi+12,velocity:n.velocity*.75,selected:false}))]} else if(mode==='arpeggiate'){tr.notes.sort((a,b)=>a.time-b.time);tr.notes.forEach((n,i)=>n.time+=(i%3)*.125)} else if(mode==='voice'){tr.notes.forEach(n=>n.midi=clamp(n.midi- (n.midi>72?12:0),36,84))} else if(mode==='melody'){tr.notes.sort((a,b)=>a.time-b.time);tr.notes=tr.notes.filter((n,i)=>i===0||Math.abs(n.midi-tr.notes[i-1].midi)<=9)}render();flash('MIDI edit applied.');}
function applyPromptEdit(txt){const l=txt.toLowerCase();if(/simpl|less|sparse/.test(l))return editNotes('simplify');if(/busier|dense|more note/.test(l))return editNotes('densify');if(/human/.test(l))return editNotes('humanize');if(/syncop|offbeat/.test(l))return editNotes('syncopate');if(/legato|smooth|longer/.test(l))return editNotes('legato');if(/stacc|short|tight/.test(l))return editNotes('staccato');if(/octave/.test(l))return editNotes('octaves');if(/arp/.test(l))return editNotes('arpeggiate');if(/melody/.test(l))return editNotes('melody');return editNotes('humanize')}

function chatbotReply(q){const l=q.toLowerCase();if(l.includes('key')||l.includes('scale'))return `You are in ${state.root} ${scaleNames[state.scale]}. The piano roll is ${state.scaleLock?'locked to':'showing'} that scale for note placement.`;if(l.includes('structure'))return 'Structure pass looks at note density, register, repetition and velocity by bar. It labels likely intro, verse, pre-chorus, chorus, bridge and outro. It is heuristic, not telepathy, because apparently music still refuses to expose its source code.';if(l.includes('mix'))return 'The mixer assistant analyzes note density, register and instrument type, then suggests gain, pan and EQ moves. Audio-stem AI separation is a later phase.';if(l.includes('darker')||l.includes('dark')){saveHistory();state.tracks[state.selectedTrack].notes=generateMIDI('dark alternative rock, tense minor hook, low register, syncopated, chromatic tension',8,58);render();return 'Generated a darker MIDI sketch in the selected track.';}if(l.includes('chorus')){saveHistory();state.tracks[state.selectedTrack].notes=generateMIDI('wide anthemic alternative rock chorus hook, octave movement, memorable rhythm',8,70);render();return 'Generated an 8-bar chorus sketch.';}if(l.includes('analyze'))return `Selected track: ${state.tracks[state.selectedTrack].name}. ${state.tracks[state.selectedTrack].notes.length} notes, average velocity ${avgVelocity(state.tracks[state.selectedTrack].notes).toFixed(2)}. Range ${rangeText(state.tracks[state.selectedTrack].notes)}.`;return 'I can help with harmony, MIDI generation, complexity edits, arrangement, and mix suggestions. Try “make a darker chorus,” “simplify this,” or “analyze this pattern.”'}
function avgVelocity(ns){return ns.length?ns.reduce((a,n)=>a+n.velocity,0)/ns.length:0}function rangeText(ns){if(!ns.length)return 'none';const mi=Math.min(...ns.map(n=>n.midi)),ma=Math.max(...ns.map(n=>n.midi));return `${noteName(mi)}–${noteName(ma)}`}
function sendChat(q=$('#chatInput').value){if(!q.trim())return;addChat(q,'user');const a=chatbotReply(q);setTimeout(()=>addChat(a,'bot'),80);$('#chatInput').value=''}function addChat(t,role){const d=document.createElement('div');d.className=`chat ${role}`;d.innerHTML=t.replace(/\n/g,'<br>');$('#chatLog').appendChild(d);$('#chatLog').scrollTop=99999}
function flash(t){$('#statusText').textContent=t;clearTimeout(flash._t);flash._t=setTimeout(()=>$('#statusText').textContent='Ready.',2400)}

function openModal(title,body){const wrap=document.createElement('div');wrap.className='modal';wrap.innerHTML=`<div class="modal-card"><div class="modal-title">${title}<button style="float:right" id="mclose">×</button></div>${body}</div>`;document.body.appendChild(wrap);wrap.querySelector('#mclose').onclick=()=>wrap.remove();wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});return wrap}
function analyzeStructure(){const tr=state.tracks[state.selectedTrack];const bars=state.bars;const out=[];for(let b=0;b<bars;b++){const ns=tr.notes.filter(n=>n.time>=b*4&&n.time<(b+1)*4);const density=ns.length;const avg=avgVelocity(ns);const range=ns.length?Math.max(...ns.map(n=>n.midi))-Math.min(...ns.map(n=>n.midi)):0;out.push({b,density,avg,range})}let sections=[];for(let i=0;i<bars;i+=4){const chunk=out.slice(i,i+4);const d=chunk.reduce((a,x)=>a+x.density,0);const r=chunk.reduce((a,x)=>a+x.range,0)/chunk.length;let name='Verse';if(i===0)name='Intro';else if(d>28&&r>16)name='Chorus';else if(d<8)name='Break / Bridge';else if(i>=bars-4)name='Outro';sections.push({name,start:i+1,end:Math.min(i+4,bars),density:d/4,range:r})}const rows=sections.map(s=>`<div class="mix-row"><b>${s.name}</b><span>Bars ${s.start}–${s.end}<br><small>density ${s.density.toFixed(1)} • range ${s.range.toFixed(1)} semitones</small></span><span>AI</span></div>`).join('');openModal('AI Project Structure',`<p style="color:#8a8e97;font-size:10px">Heuristic analysis of MIDI note density, range and velocity. It does not pretend to know the song emotionally.</p>${rows}`)}
function analyzeMix(){const rows=state.tracks.map(t=>{const n=t.notes.length;const avg=avgVelocity(t.notes);const range=rangeText(t.notes);let gain=0;if(t.instrument==='Drums')gain=2;else if(t.instrument==='Bass')gain=0;else if(n>80)gain=-3;else if(n<12)gain=1.5;let pan=t.instrument==='Guitar'?(Math.random()>.5?-0.25:0.25):0;return `<div class="mix-row"><b>${t.name}</b><span>Gain ${gain>0?'+':''}${gain.toFixed(1)} dB • Pan ${pan.toFixed(2)}<br><small>${n} notes • avg vel ${avg.toFixed(2)} • range ${range}</small></span><button class="small-btn">APPLY</button></div>`}).join('');openModal('AI Mixer',`<p style="color:#8a8e97;font-size:10px">This prototype analyzes MIDI behavior. True audio-stem “listen and mix” needs waveform/stem analysis and a server or native DSP engine.</p>${rows}`)}
function exportMidi(){const midi=new Midi();midi.header.setTempo(state.tempo);state.tracks.forEach(t=>{const tr=midi.addTrack();tr.name=t.name;t.notes.forEach(n=>tr.addNote({midi:n.midi,time:n.time*60/state.tempo,duration:n.duration*60/state.tempo,velocity:n.velocity}))});const blob=new Blob([midi.toArray()],{type:'audio/midi'});downloadBlob(blob,'leaf-lane-project.mid');flash('MIDI exported.');}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function exportAudio(){await startAudio(); if(!state.recorder)state.recorder=new Tone.Recorder(); const dest=Tone.getDestination(); dest.disconnect(); dest.connect(state.recorder);state.recorder.start();playProject();setTimeout(async()=>{stopProject();const rec=await state.recorder.stop();dest.disconnect();dest.toDestination();downloadBlob(rec,'leaf-lane-preview.webm');flash('Audio preview exported as browser-supported WebM/Opus.');},Math.min(15000,(state.bars*60/state.tempo)*1000+500))}

function loadMidi(file){file.arrayBuffer().then(data=>{const midi=new Midi(data);saveHistory();state.tracks.forEach(t=>t.notes=[]);midi.tracks.slice(0,Math.min(16,midi.tracks.length)).forEach((mt,i)=>{if(!state.tracks[i])state.tracks.push({name:`MIDI ${i+1}`,instrument:'Synth',color:'blue',notes:[]});state.tracks[i].name=mt.name||`MIDI ${i+1}`;state.tracks[i].notes=mt.notes.map(n=>({midi:n.midi,time:n.time*state.tempo/60,duration:n.duration*state.tempo/60,velocity:n.velocity,selected:false}))});render();flash(`Imported ${midi.tracks.length} MIDI tracks.`)}).catch(e=>flash('Could not read MIDI: '+e.message))}
function loadAudio(file){const url=URL.createObjectURL(file);const audio=document.createElement('audio');audio.src=url;audio.controls=true;audio.style.width='100%';const m=openModal('Imported Audio',`<p style="color:#8a8e97;font-size:10px">Preview imported audio here. Full clip editing, waveform splitting and stem extraction are planned for the next engine.</p><div id="audioSlot"></div>`);m.querySelector('#audioSlot').appendChild(audio);audio.play().catch(()=>{});}


let scalaArchive = [];
async function loadScalaArchive(){
  if(scalaArchive.length){showScalaArchive();return}
  flash('Loading the free Scala archive…');
  try{
    const res=await fetch('https://www.huygens-fokker.org/docs/scales.zip');
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const zip=await JSZip.loadAsync(await res.arrayBuffer());
    const files=Object.values(zip.files).filter(f=>f.name.toLowerCase().endsWith('.scl')&&!f.dir);
    scalaArchive=await Promise.all(files.map(async f=>{const txt=await f.async('text');return parseScl(f.name,txt)}));
    scalaArchive=scalaArchive.filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
    flash(`Loaded ${scalaArchive.length.toLocaleString()} Scala files.`);showScalaArchive();
  }catch(err){
    flash('Scala archive could not be loaded in this browser. The built-in scale engine still works.');
    showScalaArchive(true);
  }
}
function parseScl(filename,text){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('!'));
  if(lines.length<2)return null;
  const name=lines[0]||filename;const count=parseInt(lines[1],10);if(!Number.isFinite(count))return null;
  const intervals=[];for(let i=0;i<Math.min(count,40);i++){const raw=lines[2+i];if(!raw)break;const first=raw.split(/\s+/)[0];let cents=null;if(first.includes('/')){const [a,b]=first.split('/').map(Number);if(b)cents=1200*Math.log2(a/b)}else{cents=parseFloat(first)}if(Number.isFinite(cents))intervals.push(cents)}
  if(!intervals.length)return null;return {file:filename,name,intervals}
}
function sclToHighlight(scale,tonicPc){
  const pcs=new Set([tonicPc]);scale.intervals.forEach(c=>{let pc=Math.round((c/100)+tonicPc);pc=((pc%12)+12)%12;pcs.add(pc)});return [...pcs].sort((a,b)=>a-b)
}
function showScalaArchive(failed=false){
  const list=scalaArchive.slice(0,160).map((s,i)=>`<div class="prompt-item scala-item" data-idx="${i}"><b>${s.name}</b><br><small>${s.intervals.length} intervals • ${s.file}</small></div>`).join('');
  const note=failed?'The remote archive did not load here. You can still use the named built-in scales.':'';
  const m=openModal('Scala Scale Archive',`<p style="color:#8a8e97;font-size:10px">${note||'The official archive currently lists 5,350+ .scl files. Each source scale can be projected onto 12-TET for piano-roll highlighting and transposed to 12 tonics, creating 64,200+ derived highlight profiles. Microtonal tunings are shown as approximated 12-TET highlights in this browser prototype.'}</p><div class="searchbox"><span>⌕</span><input id="scalaSearch" placeholder="Search loaded scales..." /></div><div id="scalaList" class="prompt-list">${list||'<div class="prompt-item">No archive items loaded.</div>'}</div>`);
  const render=()=>{const q=(m.querySelector('#scalaSearch').value||'').toLowerCase();const arr=scalaArchive.filter(s=>!q||s.name.toLowerCase().includes(q)||s.file.toLowerCase().includes(q)).slice(0,200);m.querySelector('#scalaList').innerHTML=arr.map((s,i)=>`<div class="prompt-item scala-item" data-file="${s.file}"><b>${s.name}</b><br><small>${s.intervals.length} intervals • ${s.file}</small></div>`).join('')||'<div class="prompt-item">No matches.</div>';m.querySelectorAll('.scala-item').forEach(el=>el.onclick=()=>{const s=scalaArchive.find(x=>x.file===el.dataset.file);if(s){const pcs=sclToHighlight(s,rootPc());state._externalScale={name:s.name,pcs};flash(`Using ${s.name} as a 12-TET highlight profile.`);m.remove();drawRoll()}})};
  m.querySelector('#scalaSearch').oninput=render;if(!failed)render();
}
function bind(){
  window.addEventListener('resize',resizeCanvases);
  $('#playBtn').onclick=()=>state.playing?stopProject():playProject();$('#stopBtn').onclick=stopProject;$('#rewBtn').onclick=()=>{state.viewStart=0;render()};$('#scaleLockBtn').onclick=()=>{state.scaleLock=!state.scaleLock;$('#scaleLockBtn').classList.toggle('active',state.scaleLock)};
  $('#rootSelect').onchange=e=>{state.root=e.target.value;render()};$('#scaleSelect').onchange=e=>{state.scale=e.target.value;render()};
  $('#drawTool').onclick=()=>{state.tool='draw';$('#drawTool').classList.add('active');$('#eraseTool').classList.remove('active')};$('#eraseTool').onclick=()=>{state.tool='erase';$('#eraseTool').classList.add('active');$('#drawTool').classList.remove('active')};
  $('#zoomIn').onclick=()=>{state.zoomX=clamp(state.zoomX*1.25,0.5,4);render()};$('#zoomOut').onclick=()=>{state.zoomX=clamp(state.zoomX/1.25,.5,4);render()};
  canvas=$('#pianoCanvas');canvas.addEventListener('pointerdown',onRollDown);canvas.addEventListener('dblclick',e=>{const p=rollPointer(e);const n=state.tracks[state.selectedTrack].notes.find(n=>p.beat>=n.time&&p.beat<=n.time+n.duration&&p.midi===n.midi);if(n){saveHistory();n.duration=Math.min(4,n.duration+.25);render();}});
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();restoreHistory()}if(e.code==='Space'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();state.playing?stopProject():playProject()}});
  $('#aiOpenBtn').onclick=()=>$('#aiPanel').classList.toggle('open');$('#closeAi').onclick=()=>$('#aiPanel').classList.remove('open');
  $$('.tab').forEach(b=>b.onclick=()=>{const tab=b.dataset.tab;$$('.tab').forEach(x=>x.classList.toggle('active',x===b));$$('.tab-page').forEach(p=>p.classList.add('hidden'));$(`#ai${tab[0].toUpperCase()+tab.slice(1)}`).classList.remove('hidden')});
  $('#scaleArchiveBtn').onclick=loadScalaArchive;$('#generateMidi').onclick=generateNow;$('#promptMidiBtn').onclick=()=>{$('#aiPanel').classList.add('open');$$('.tab')[1].click()};$('#complexityBtn').onclick=()=>{$('#aiPanel').classList.add('open');$$('.tab')[2].click()};
  $$('#midiChips').forEach(()=>{}); const chipLabels=['dark chorus','anthemic hook','syncopated riff','melodic bass','sparse verse','octave lead','shoegaze pad','nu-metal groove','emo arpeggio','hard-rock bridge','cinematic intro','guitar melody'];$('#midiChips').innerHTML=chipLabels.map(x=>`<button>${x}</button>`).join('');$$('#midiChips button').forEach(b=>b.onclick=()=>{$('#midiPrompt').value=b.textContent+'; '+$('#midiPrompt').value});
  $$('#aiEdit [data-edit]').forEach(b=>b.onclick=()=>editNotes(b.dataset.edit));$('#applyEditPrompt').onclick=()=>applyPromptEdit($('#editPrompt').value);$('#chatSend').onclick=()=>sendChat();$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});$$('.quick-prompts button').forEach(b=>b.onclick=()=>sendChat(b.dataset.chat));
  $('#mixBtn').onclick=analyzeMix;$('#structureBtn').onclick=analyzeStructure;$('#exportMidiBtn').onclick=exportMidi;
  $('#tapBtn').onclick=()=>{state.tempo=clamp(state.tempo+1,40,220);$('#tempoLabel').textContent=state.tempo;};
  $('#browserSearch').oninput=e=>{$$('.browser-item,.browser-link').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'':'none')};
  $$('[data-instrument]').forEach(b=>b.onclick=()=>{const inst=b.dataset.instrument;state.tracks.push({name:`${inst} ${state.tracks.filter(t=>t.instrument===inst).length+1}`,instrument:inst,color:inst==='Piano'?'blue':inst==='Synth'?'purple':inst==='Bass'?'green':inst==='Guitar'?'orange':'red',notes:[]});state.selectedTrack=state.tracks.length-1;render();flash(`Added ${inst} track.`)});
  $('[data-tool="importMidi"]').onclick=()=>$('#midiFile').click();$('[data-tool="importAudio"]').onclick=()=>$('#audioFile').click();$('[data-tool="newTrack"]').onclick=()=>{state.tracks.push({name:`MIDI ${state.tracks.length+1}`,instrument:'Synth',color:'blue',notes:[]});render()};$('#midiFile').onchange=e=>e.target.files[0]&&loadMidi(e.target.files[0]);$('#audioFile').onchange=e=>e.target.files[0]&&loadAudio(e.target.files[0]);
  $('#promptSearch').oninput=e=>renderPromptList(e.target.value);renderPromptList('');
  $('#menuBtn').onclick=()=>$('.browser').style.display=$('.browser').style.display==='none'?'flex':'none';
  $('#scaleCount').textContent=DERIVED_SCALE_PROFILES.toLocaleString()+'+';
  document.querySelector('.playlist-body').addEventListener('pointerdown',e=>{const label=e.target.closest('.track-label');if(label){const i=[...document.querySelectorAll('.track-label')].indexOf(label);if(i>=0){state.selectedTrack=i;render()}}});
}
function renderPromptList(q){const list=$('#promptList');const arr=prompts.filter(x=>!q||x.toLowerCase().includes(q.toLowerCase())).slice(0,80);$('#promptCount').textContent=prompts.length.toLocaleString()+'+ generated combinations';list.innerHTML=arr.map((x,i)=>`<div class="prompt-item" data-prompt="${i}">${x}</div>`).join('');list.querySelectorAll('.prompt-item').forEach((el,j)=>el.onclick=()=>{$('#midiPrompt').value=arr[j];$$('.tab')[1].click()})}

initSelectors();renderTracks();bind();render();
