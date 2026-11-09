import {beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {DRUM_APPROACH,DRUM_DURATION,DRUM_STRIKES,drumBeats,drumStroke} from '../src/drumMotion';
import {renderDrumSamples,DRUM_SAMPLE_RATE} from '../src/drumSynthesis';
import {TouchLookGesture} from '../src/touchLook';
import {HALL_INCENSE} from '../src/ritualStations.mjs';
import {findPath,clearLine} from '../src/navigation';
import {fetchDeadline} from '../src/fetchDeadline';
const storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
Object.defineProperty(globalThis,'window',{value:{localStorage:storage},configurable:true});
const {useGame}=await import('../src/gameStore');const initial=useGame.getInitialState();
beforeEach(()=>useGame.setState({...initial},true));

test('requests time out with AbortController even when Safari has no AbortSignal.timeout',async()=>{
  const saved=globalThis.fetch,descriptor=Object.getOwnPropertyDescriptor(AbortSignal,'timeout');
  try{
    Object.defineProperty(AbortSignal,'timeout',{value:undefined,configurable:true});
    globalThis.fetch=((_url,options)=>new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted'))))) as typeof fetch;
    await assert.rejects(fetchDeadline('/api/offerings',{},8),/aborted/);
    globalThis.fetch=(async()=>new Response('{"ok":true}',{status:200})) as typeof fetch;
    assert.equal((await fetchDeadline('/api/health')).status,200);
  }finally{globalThis.fetch=saved;if(descriptor)Object.defineProperty(AbortSignal,'timeout',descriptor);}
});

test('the look finger retains ownership while another finger moves and releases',()=>{
  const g=new TouchLookGesture();assert.equal(g.begin(7,100,100),true);assert.equal(g.begin(8,300,200),false);
  assert.equal(g.move(8,400,400),null);g.end(8);assert.deepEqual(g.move(7,120,110),{yaw:-.1,pitch:-.05});
  g.end(7);assert.equal(g.move(7,140,150),null);assert.equal(g.begin(8,300,200),true);assert.deepEqual(g.move(8,300,200),{yaw:-0,pitch:-0});
  g.clear();assert.equal(g.move(8,350,250),null);
});

test('plain reading seats animate without a modal; explicitly opening the library works before or after sitting',()=>{
  useGame.getState().sit('reading-0');useGame.getState().arriveSeat('reading-0');assert.equal(useGame.getState().action,'read');assert.equal(useGame.getState().panel,null);
  useGame.getState().perform('read');assert.equal(useGame.getState().panel,'library');
  useGame.getState().stand();useGame.getState().perform('read');const id=useGame.getState().pendingSeat!;useGame.getState().arriveSeat(id);assert.equal(useGame.getState().panel,'library');
});

test('hall incense completes locally once and is assigned to its own censer',()=>{
  let now=100000;const real=Date.now;Date.now=()=>now;
  try{useGame.setState({position:[...HALL_INCENSE.spot],connection:'offline'});useGame.getState().perform('incense',HALL_INCENSE.id);assert.equal(useGame.getState().action,'incense');now+=3000;useGame.getState().tick();
    assert.equal(useGame.getState().inventory.incense,initial.inventory.incense-1);assert.equal(useGame.getState().offeringSlots[now],HALL_INCENSE.id);useGame.getState().tick();assert.equal(useGame.getState().progress.incense,1);
  }finally{Date.now=real;}
});

test('three drum impacts match the animation and grant one completed activity; repeated presses never restart it',()=>{
  let now=100000;const real=Date.now;Date.now=()=>now;
  try{useGame.setState({position:[...DRUM_APPROACH]});useGame.getState().perform('drum');const at=useGame.getState().event!.at;assert.equal(useGame.getState().action,'drum');now+=500;useGame.getState().perform('drum');assert.equal(useGame.getState().event!.at,at);
    for(const [index,strike]of DRUM_STRIKES.entries()){assert.equal(drumStroke(strike),1);assert.equal(drumBeats(strike),index+1);}
    now=at+DRUM_DURATION-1;useGame.getState().tick();assert.equal(useGame.getState().progress.drum,0);now++;useGame.getState().tick();useGame.getState().tick();assert.equal(useGame.getState().progress.drum,1);assert.equal(useGame.getState().action,'walk');
  }finally{Date.now=real;}
});

test('drum and hall incense approaches are reachable without crossing furniture',()=>{
  for(const target of [DRUM_APPROACH,HALL_INCENSE.approach]){const path=findPath([0,6],target);assert.ok(path.length);for(let i=1;i<path.length;i++)assert.ok(clearLine(path[i-1],path[i]));}
});

test('the cached drum waveform is finite, unclipped, has an audible attack and a quiet tail',()=>{
  const samples=renderDrumSamples();assert.equal(samples.length,Math.ceil(DRUM_SAMPLE_RATE*2.8));let peak=0,tail=0;
  for(const value of samples){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));}for(let i=samples.length-1000;i<samples.length;i++)tail=Math.max(tail,Math.abs(samples[i]));assert.ok(peak>.8&&peak<.9);assert.ok(tail<.02);
});
