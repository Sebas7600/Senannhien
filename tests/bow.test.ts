import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {BOW,bowDuration,bowStrikeOffset,sampleBow} from '../src/bowTimeline';
import {BOWL_MODES,BOWL_SAMPLE_RATE,renderBowlSamples} from '../src/bowlSynthesis';
import {places,seats} from '../src/gameData';
const storage=new Map<string,string>();Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}}});
const{useGame,emptyProgress}=await import('../src/gameStore');const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults,position:[0,-24],progress:emptyProgress(),lifetime:emptyProgress()},true));
test('a standing bow fully kneels before bending and returns upright; a cushion bow has no kneeling delay',()=>{
  const out={kneel:0,bend:0,reach:0,done:false};sampleBow(BOW.kneel*.8,'standing',out);assert.equal(out.bend,0);assert.ok(out.kneel>.8);
  sampleBow(BOW.kneel,'standing',out);assert.equal(out.kneel,1);assert.equal(out.bend,0);
  sampleBow(.4,'cushion',out);assert.ok(out.bend>.4);assert.equal(out.kneel,1);
  for(const mode of ['standing','cushion'] as const){const strike=sampleBow(bowStrikeOffset(mode),mode,out);assert.ok(strike.bend>1.4);assert.ok(strike.reach>.95);let previous=0;for(let t=0;t<bowDuration(mode);t+=.01){assert.equal(sampleBow(t,mode,out),out);assert.ok(Number.isFinite(out.bend));assert.ok(out.kneel>=0&&out.kneel<=1);assert.ok(Math.abs(out.bend-previous)<.04);previous=out.bend;}sampleBow(bowDuration(mode),mode,out);assert.equal(out.done,true);assert.equal(out.bend,0);assert.equal(out.reach,0);assert.equal(out.kneel,mode==='standing'?0:1);}
});
test('repeat bow clicks retain one standing session, stop travel and award only once',()=>{
  useGame.setState({destination:[0,-30],pendingSeat:'temple-0'});useGame.getState().perform('bow');const at=useGame.getState().bow!.at;
  assert.equal(useGame.getState().bow?.mode,'standing');assert.equal(useGame.getState().destination,null);assert.equal(useGame.getState().pendingSeat,null);
  for(let i=0;i<20;i++)useGame.getState().perform('bow');assert.equal(useGame.getState().bow?.at,at);assert.equal(useGame.getState().progress.bow,1);
  useGame.setState({bow:{at:Date.now()-1200,mode:'standing'}});const midway=useGame.getState().bow!.at;useGame.getState().perform('bow');assert.equal(useGame.getState().bow?.at,midway);
  useGame.getState().finishBow();assert.equal(useGame.getState().action,'bow');useGame.setState({bow:{at:Date.now()-4801,mode:'standing'}});useGame.getState().finishBow();assert.equal(useGame.getState().action,'walk');assert.equal(useGame.getState().bow,null);
});
test('a cushion bow preserves its seat, finishes sitting and can be cancelled by standing or praying',()=>{
  useGame.setState({seated:'temple-0',action:'sit'});useGame.getState().perform('bow');assert.equal(useGame.getState().bow?.mode,'cushion');assert.equal(useGame.getState().seated,'temple-0');
  useGame.setState({bow:{at:Date.now()-3051,mode:'cushion'}});useGame.getState().finishBow();assert.equal(useGame.getState().action,'sit');assert.equal(useGame.getState().seated,'temple-0');
  useGame.setState({event:null});useGame.getState().perform('bow');useGame.getState().perform('pray');assert.equal(useGame.getState().bow,null);assert.equal(useGame.getState().action,'pray');
  useGame.setState({event:null});useGame.getState().perform('bow');useGame.getState().stand();assert.equal(useGame.getState().bow,null);assert.equal(useGame.getState().seated,null);
  assert.ok(!('bow' in useGame.persist.getOptions().partialize!(useGame.getState())));
});
test('the bowl is a finite unclipped cached sample with the reference resonance and a small MP3',()=>{
  const samples=renderBowlSamples();assert.equal(samples.length,BOWL_SAMPLE_RATE*6.4);let peak=0,early=0,late=0;
  for(let i=0;i<samples.length;i++){assert.ok(Number.isFinite(samples[i]));peak=Math.max(peak,Math.abs(samples[i]));if(i<BOWL_SAMPLE_RATE)early+=samples[i]*samples[i];if(i>samples.length-BOWL_SAMPLE_RATE)late+=samples[i]*samples[i]}
  assert.ok(peak<=.721);assert.ok(early>late*5);assert.equal(BOWL_MODES[0][0],863.6);assert.ok(statSync('public/assets/audio/bow-bowl.mp3').size<60000);
});
test('bowing starts in place in every area and cancels an old route instead of walking to the temple',()=>{
  for(const place of places){const position:[number,number]=[place.x,place.z];
    useGame.setState({...defaults,position,height:.4,heading:.73,destination:[0,-24],pendingSeat:'temple-0',progress:emptyProgress(),lifetime:emptyProgress()},true);
    useGame.getState().perform('bow');const s=useGame.getState();
    assert.equal(s.action,'bow',place.id);assert.equal(s.bow?.mode,'standing',place.id);assert.deepEqual(s.position,position,place.id);assert.equal(s.height,.4);assert.equal(s.heading,.73);assert.equal(s.teleport,null);assert.equal(s.destination,null);assert.equal(s.pendingSeat,null);assert.equal(s.event?.x,place.x);assert.equal(s.event?.z,place.z);assert.equal(s.progress.bow,1);
  }
});
test('every cushion, including all Truc Lam seats, bows without releasing or changing its location',()=>{
  for(const seat of seats.filter(s=>s.kind==='cushion')){
    const position:[number,number]=[seat.position[0],seat.position[2]];
    useGame.setState({...defaults,seated:seat.id,position,height:seat.position[1],heading:seat.rotation,action:'meditate',destination:[0,-24],pendingSeat:'temple-0',progress:emptyProgress(),lifetime:emptyProgress()},true);
    useGame.getState().perform('bow');let s=useGame.getState();
    assert.equal(s.action,'bow',seat.id);assert.equal(s.bow?.mode,'cushion',seat.id);assert.equal(s.seated,seat.id);assert.deepEqual(s.position,position);assert.equal(s.height,seat.position[1]);assert.equal(s.heading,seat.rotation);assert.equal(s.destination,null);assert.equal(s.pendingSeat,null);assert.equal(s.teleport,null);
    useGame.setState({bow:{at:Date.now()-4000,mode:'cushion'}});useGame.getState().finishBow();s=useGame.getState();assert.equal(s.action,'sit');assert.equal(s.seated,seat.id);assert.deepEqual(s.position,position);
  }
});
