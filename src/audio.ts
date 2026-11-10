import {renderBowlSamples,BOWL_SAMPLE_RATE} from './bowlSynthesis';
import {bowStrikeOffset,type BowSession} from './bowTimeline';
import {DRUM_STRIKES} from './drumMotion';
import {renderDrumSamples,DRUM_SAMPLE_RATE} from './drumSynthesis';
let ctx:AudioContext|null=null,master:GainNode|null=null;
let ambient:AudioBufferSourceNode|null=null;
let chant:HTMLAudioElement|null=null,bell:HTMLAudioElement|null=null;
let enabled=false,chantRequested=false,soundVersion=0;
let useSound=()=>false;
const voices=new Set<AudioScheduledSourceNode>();
const outputs=new Map<AudioScheduledSourceNode,GainNode>();
const audioAssets={bell:()=>import('./generated/bellAudio'),chant:()=>import('./generated/chantAudio')};
const mediaLoading=new Map<'bell'|'chant',Promise<HTMLAudioElement|null>>();
let chantVersion=0;
const silentWave='data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
function context(){
  if(typeof AudioContext==='undefined')return null;
  if(!ctx)ctx=new AudioContext();if(!master){master=ctx.createGain();master.gain.value=enabled?.7:0;master.connect(ctx.destination);}
  return ctx;
}
function clean(source:AudioScheduledSourceNode){source.disconnect();outputs.get(source)?.disconnect();outputs.delete(source);voices.delete(source)}
function track<T extends AudioScheduledSourceNode>(source:T){voices.add(source);source.onended=()=>clean(source);return source;}
function stop(source:AudioScheduledSourceNode|null){if(source){source.onended=null;try{source.stop()}catch{/* Already ended. */}clean(source)}}
function media(kind:'bell'|'chant'){
  if(typeof Audio==='undefined')return null;
  if(kind==='chant'){if(!chant){chant=new Audio(silentWave);chant.loop=true;chant.preload='metadata';chant.volume=.65;}return chant;}
  if(!bell){bell=new Audio(silentWave);bell.preload='auto';bell.volume=.55;}return bell;
}
function prepareMedia(kind:'bell'|'chant'){
  let loading=mediaLoading.get(kind);
  if(!loading){const audio=media(kind);loading=audio?audioAssets[kind]().then(({default:source})=>{audio.src=source;return audio}):Promise.resolve(null);mediaLoading.set(kind,loading);void loading.catch(()=>mediaLoading.delete(kind));}
  return loading;
}
function stopMedia(audio:HTMLAudioElement|null){if(audio){audio.pause();try{audio.currentTime=0}catch{/* Metadata has not loaded yet. */}}}
/** Prime both media elements inside the tap, so later arrival callbacks also work on iOS. */
export function unlockAudio(){
  const c=context();if(c){void c.resume().catch(()=>{});preloadDrum();}
  for(const kind of ['bell','chant'] as const){const audio=media(kind);if(!audio||!audio.paused)continue;audio.muted=true;const playing=audio.play();audio.pause();audio.muted=false;void playing.catch(()=>{});void prepareMedia(kind).catch(()=>{});}
}
export function bindSound(check:()=>boolean){useSound=check;}
export function setAmbient(next:boolean){
  enabled=next;
  if(!next){stopBowlVoices();soundVersion++;stop(ambient);ambient=null;stopMedia(chant);stopMedia(bell);for(const v of [...voices])stop(v);if(master&&ctx)master.gain.setValueAtTime(0,ctx.currentTime);return;}
  const c=context();if(!c)return;void c.resume().catch(()=>{});master!.gain.setValueAtTime(.7,c.currentTime);
  if(!ambient){
    const b=c.createBuffer(1,c.sampleRate*5,c.sampleRate),samples=b.getChannelData(0);let last=0;
    for(let i=0;i<samples.length;i++){last=(last+(Math.random()*2-1)*.02)/1.02;samples[i]=last*.20;}
    ambient=track(c.createBufferSource());ambient.buffer=b;ambient.loop=true;ambient.connect(master!);ambient.start();
  }
}
export async function setChant(next:boolean){
  chantRequested=next;const version=++chantVersion;
  if(!next||!enabled){stopMedia(chant);return;}
  const audio=media('chant');if(!audio||!audio.paused)return;
  try{await prepareMedia('chant');if(!enabled||!chantRequested||version!==chantVersion)return;await audio.play();if(!enabled||!chantRequested)stopMedia(audio)}catch{/* A later direct tap may unlock playback. */}
}
export async function playBell(ageMs=0){
  if(!useSound()||!enabled)return;const version=++soundVersion;
  const audio=media('bell');if(!audio){const c=context();if(c&&ageMs<1000)synthBell(c);return;}
  stopMedia(audio);
  try{await prepareMedia('bell');if(!enabled||!useSound()||version!==soundVersion)return;audio.currentTime=ageMs/1000;await audio.play();if(!enabled||!useSound())stopMedia(audio)}catch{if(enabled&&useSound()&&version===soundVersion){const c=context();if(c)synthBell(c)}}
}
function synthBell(c:AudioContext){
  // Inharmonic bronze modes and slow beating if the recording cannot be decoded.
  for(const [f,v,decay] of [[112,.12,14],[113.1,.10,13],[247,.065,10],[249.4,.045,10],[443,.025,7],[655,.012,4]]){
    const o=track(c.createOscillator()),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(v,c.currentTime+.012);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+decay);outputs.set(o,g);o.connect(g).connect(master!);o.start();o.stop(c.currentTime+decay);
  }
}
export function playWood(){
  if(!useSound()||!enabled)return;const c=context();if(!c)return;
  for(const f of [520,870,1280]){const o=track(c.createOscillator()),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.055,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.23);outputs.set(o,g);o.connect(g).connect(master!);o.start();o.stop(c.currentTime+.25);}
}

let drumBuffer:AudioBuffer|null=null;
export function preloadDrum(){
  const c=context();if(!c||drumBuffer)return;
  const fill=()=>{if(drumBuffer)return;const samples=renderDrumSamples();drumBuffer=c.createBuffer(1,samples.length,DRUM_SAMPLE_RATE);drumBuffer.getChannelData(0).set(samples);};
  if(typeof requestIdleCallback==='function')requestIdleCallback(fill,{timeout:1000});else setTimeout(fill,100);
}

export function scheduleDrum(at:number){
  const c=context();if(!c||!useSound()||!enabled)return()=>{};
  void c.resume();
  if(!drumBuffer){const samples=renderDrumSamples();drumBuffer=c.createBuffer(1,samples.length,DRUM_SAMPLE_RATE);drumBuffer.getChannelData(0).set(samples);}
  const scheduled:{source:AudioBufferSourceNode;start:number}[]=[];
  DRUM_STRIKES.forEach((delay,i)=>{
    const remaining=(at+delay-Date.now())/1000;if(remaining<-.12)return;
    const source=track(c.createBufferSource()),gain=c.createGain();source.buffer=drumBuffer;gain.gain.value=.7-i*.045;outputs.set(source,gain);source.connect(gain).connect(master!);
    const start=c.currentTime+Math.max(0,remaining);source.start(start);scheduled.push({source,start});
  });
  // Stop future hits on movement/cancel; a hit already heard may decay naturally.
  return()=>{for(const voice of scheduled)if(c.currentTime<voice.start)stop(voice.source);};
}

let bowlBuffer:Promise<AudioBuffer|null>|null=null;
const bowlVoices=new Set<{source:AudioBufferSourceNode;gain:GainNode}>();
const bowlTickets=new Map<number,object>();
/** Generate the same reference resonance locally; download-manager extensions cannot intercept it. */
export function preloadBowl(){
  if(bowlBuffer)return bowlBuffer;
  ctx??=new AudioContext();const context=ctx;
  bowlBuffer=Promise.resolve().then(()=>{
    const samples=renderBowlSamples(),buffer=context.createBuffer(1,samples.length,BOWL_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);return buffer;
  });
  return bowlBuffer;
}

function stopBowlVoices(){for(const voice of bowlVoices){voice.source.stop();voice.source.disconnect();voice.gain.disconnect()}bowlVoices.clear()}
export function scheduleBowBowl(session:BowSession){let cancelled=false,source:AudioBufferSourceNode|null=null,start=Infinity;
  if(!useSound()||bowlTickets.has(session.at))return()=>{};const ticket={};bowlTickets.set(session.at,ticket);for(const at of bowlTickets.keys())if(Date.now()-at>30000)bowlTickets.delete(at);const discard=()=>{if(bowlTickets.get(session.at)===ticket)bowlTickets.delete(session.at)};
  ctx??=new AudioContext();const context=ctx;void context.resume();
  const due=session.at+bowStrikeOffset(session.mode)*1000;
  void preloadBowl().then(buffer=>{if(cancelled||!buffer||!useSound()||Date.now()>due+150){discard();return;}
    if(bowlVoices.size>=2){const oldest=bowlVoices.values().next().value!;oldest.gain.gain.setTargetAtTime(0,context.currentTime,.025);oldest.source.stop(context.currentTime+.08);bowlVoices.delete(oldest)}
    source=context.createBufferSource();const gain=context.createGain(),voice={source,gain};source.buffer=buffer;gain.gain.value=.48;source.connect(gain).connect(context.destination);
    source.onended=()=>{bowlVoices.delete(voice);voice.source.disconnect();gain.disconnect()};bowlVoices.add(voice);start=context.currentTime+Math.max(0,(due-Date.now())/1000);source.start(start);
  });
  // A cancelled gesture loses its pending strike; an already-ringing bowl decays naturally.
  return()=>{cancelled=true;if(!source||context.currentTime<start){discard();source?.stop()}};
}
