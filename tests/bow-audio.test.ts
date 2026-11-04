import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bowStrikeOffset} from '../src/bowTimeline';
import {bindSound,preloadBowl,scheduleBowBowl,setAmbient} from '../src/audio';
test('bowl audio generates locally once without network requests, honours mute and cancels pending strikes',async()=>{
  let fetches=0,generations=0;let context:Context;const sources:{starts:number[];stops:number;onended:(()=>void)|null}[]=[];
  class Context{currentTime=0;destination={};constructor(){context=this}resume(){return Promise.resolve()}createBuffer(channels:number,length:number,rate:number){generations++;assert.equal(channels,1);assert.equal(rate,22050);const samples=new Float32Array(length);return{duration:length/rate,getChannelData:()=>samples}}createGain(){return{gain:{value:0,setTargetAtTime(){}},connect(){return this},disconnect(){}}}createBufferSource(){const source={buffer:null,starts:[] as number[],stops:0,onended:null as (()=>void)|null,connect(){return this},disconnect(){},start(t:number){this.starts.push(t)},stop(){this.stops++;queueMicrotask(()=>this.onended?.())}};sources.push(source);return source}}
  Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});Object.defineProperty(globalThis,'fetch',{value:async()=>{fetches++;return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}},configurable:true});
  bindSound(()=>false);scheduleBowBowl({at:Date.now(),mode:'standing'});assert.equal(fetches,0);
  bindSound(()=>true);await Promise.all([preloadBowl(),preloadBowl()]);assert.equal(fetches,0);assert.equal(generations,1);
  const cancelled=scheduleBowBowl({at:Date.now()-10,mode:'standing'});cancelled();await Promise.resolve();assert.equal(sources.length,0);
  const session={at:Date.now(),mode:'cushion' as const},cancel=scheduleBowBowl(session);scheduleBowBowl(session);await Promise.resolve();assert.equal(sources.length,1);assert.ok(Math.abs(sources[0].starts[0]-bowStrikeOffset('cushion'))<.1);
  cancel();await Promise.resolve();assert.equal(sources[0].stops,1);
  const ringing={at:Date.now()+10,mode:'standing' as const},leave=scheduleBowBowl(ringing);await Promise.resolve();context!.currentTime=3;leave();assert.equal(sources.at(-1)!.stops,0);const count=sources.length;scheduleBowBowl(ringing);await Promise.resolve();assert.equal(sources.length,count);
  setAmbient(false);await Promise.resolve();assert.ok(sources.at(-1)!.stops>0);assert.equal(fetches,0);assert.equal(generations,1);
});
