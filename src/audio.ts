import {bowStrikeOffset,type BowSession} from './bowTimeline';
let ctx: AudioContext | null = null;
let bowlBuffer:Promise<AudioBuffer|null>|null=null;
const bowlVoices=new Set<{source:AudioBufferSourceNode;gain:GainNode}>();
const bowlTickets=new Map<number,object>();
export function preloadBowl(){if(bowlBuffer)return bowlBuffer;ctx??=new AudioContext();const context=ctx;
  bowlBuffer=fetch('/assets/audio/bow-bowl.mp3').then(r=>{if(!r.ok)throw new Error('bowl audio');return r.arrayBuffer()}).then(b=>context.decodeAudioData(b)).catch(()=>{bowlBuffer=null;return null});return bowlBuffer;
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
let ambient: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
export function setAmbient(enabled: boolean) {
  if (!enabled) { ambient?.source.stop(); ambient = null; stopBowlVoices();return; }
  ctx ??= new AudioContext(); void ctx.resume();
  void preloadBowl();if (ambient) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
  const samples = buffer.getChannelData(0); let last = 0;
  for (let i = 0; i < samples.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02; samples[i] = last * 2.5; }
  const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
  const gain = ctx.createGain(); gain.gain.value = 0.14;
  source.connect(filter).connect(gain).connect(ctx.destination); source.start(); ambient = { source, gain };
}
export function playBell() {
  if (!useSound()) return;
  ctx ??= new AudioContext(); void ctx.resume();
  for (const [frequency, volume] of [[220, .2], [440.7, .08], [661, .04], [887, .02]]) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 7);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 7);
  }
}
let useSound = () => false;
export function bindSound(check: () => boolean) { useSound = check; }
export function playWood() {
  if (!useSound()) return;
  ctx ??= new AudioContext(); void ctx.resume();
  for (const frequency of [520, 870, 1280]) {
    const osc=ctx.createOscillator(), gain=ctx.createGain(); osc.frequency.value=frequency;osc.type='sine';
    gain.gain.setValueAtTime(.09,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.23);
    osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.25);
  }
}
