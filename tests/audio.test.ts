import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {setAmbient,setChant,playBell,bindSound} from '../src/audio';

test('audio stops pending music and bell playback on mute, reuses one media element and avoids duplicate loops',async()=>{
  const sources:FakeSource[]=[],media:FakeAudio[]=[];
  class FakeNode {disconnected=false;gain={value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};connect<T>(node:T){return node}disconnect(){this.disconnected=true}}
  class FakeSource extends FakeNode {buffer:unknown;loop=false;onended:(()=>void)|null=null;started=false;stopped=false;start(){this.started=true}stop(){this.stopped=true}}
  class FakeContext {sampleRate=100;currentTime=0;destination=new FakeNode();createGain(){return new FakeNode()}resume(){return Promise.resolve()}createBuffer(_n:number,length:number){return {getChannelData:()=>new Float32Array(length)}}createBufferSource(){const s=new FakeSource();sources.push(s);return s}}
  class FakeAudio {paused=true;currentTime=0;loop=false;volume=1;preload='';calls=0;defer=true;resolve:()=>void=()=>{};constructor(readonly src:string){media.push(this)}play(){this.paused=false;this.calls++;return this.defer?new Promise<void>(r=>this.resolve=r):Promise.resolve()}pause(){this.paused=true}}
  const oldContext=globalThis.AudioContext,oldAudio=globalThis.Audio,oldFetch=globalThis.fetch;
  let fetches=0;globalThis.fetch=(async()=>{fetches++;throw new Error('Audio must not request a downloadable media URL')}) as typeof fetch;
  globalThis.AudioContext=FakeContext as unknown as typeof AudioContext;globalThis.Audio=FakeAudio as unknown as typeof Audio;
  try{
    bindSound(()=>true);setAmbient(true);
    const first=setChant(true);const music=media[0];await setChant(false);music.resolve();await first;assert.ok(music.paused,'Closing during load cannot restart music');
    const pendingMusic=setChant(true);while(music.calls===0)await setImmediate();await setChant(false);music.resolve();await pendingMusic;assert.ok(music.paused,'Closing during play cannot restart music');
    music.defer=false;await setChant(true);assert.ok(!music.paused&&music.loop);const calls=music.calls;await setChant(true);assert.equal(music.calls,calls,'No duplicate playback');
    await setChant(false);assert.ok(music.paused);assert.equal(music.currentTime,0);
    const bellRequest=playBell(),bell=media[1];while(bell.calls===0)await setImmediate();setAmbient(false);bell.resolve();await bellRequest;assert.ok(bell.paused);assert.ok(music.paused);assert.ok(sources.every(s=>s.stopped&&s.disconnected));
    setAmbient(true);bell.defer=false;await playBell();await playBell();assert.equal(media.length,2,'Reuses exactly two media elements');assert.ok(!bell.paused);setAmbient(false);assert.ok(bell.paused);
    assert.ok(music.src.startsWith('data:audio/wav;base64,'));assert.ok(bell.src.startsWith('data:audio/mpeg;base64,'));assert.equal(fetches,0);
  }finally{setAmbient(false);globalThis.AudioContext=oldContext;globalThis.Audio=oldAudio;globalThis.fetch=oldFetch;}
});
