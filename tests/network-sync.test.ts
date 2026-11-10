import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCourtyardConnection,createPageIdentity,retryNetworkOperation,type CourtyardEventSource} from '../src/courtyardConnection';
import {createRoomSnapshotApplier,localPeerMeal,mealTimingDeltas,type SharedOffering} from '../src/networkSnapshot';
import type {MealOrder,PlotState} from '../src/gameStore';

class FakeSource implements CourtyardEventSource {
  listeners=new Map<string,((event:{data?:string})=>void)[]>();
  onerror:((event?:unknown)=>void)|null=null;
  closed=false;
  addEventListener(type:string,listener:(event:{data?:string})=>void){this.listeners.set(type,[...(this.listeners.get(type)??[]),listener]);}
  emit(type:string,data?:string){for(const listener of this.listeners.get(type)??[])listener({data});}
  close(){this.closed=true;}
}
function fakeTimers(){
  let sequence=0;
  const timeouts=new Map<number,()=>void>(),intervals=new Map<number,()=>void>();
  return {
    timeouts,intervals,
    setTimeout:((callback:()=>void)=>{const id=++sequence;timeouts.set(id,callback);return id;}) as unknown as typeof globalThis.setTimeout,
    clearTimeout:((id:number)=>{timeouts.delete(id);}) as typeof globalThis.clearTimeout,
    setInterval:((callback:()=>void)=>{const id=++sequence;intervals.set(id,callback);return id;}) as unknown as typeof globalThis.setInterval,
    clearInterval:((id:number)=>{intervals.delete(id);}) as typeof globalThis.clearInterval,
    retry(){const [id,callback]=timeouts.entries().next().value!;timeouts.delete(id);callback();},
  };
}
async function settle(){for(let i=0;i<8;i++)await Promise.resolve();}

test('an initially unavailable LAN recovers; reconnect replaces ghosts without duplicate timers and cleanup stops it',async()=>{
  const timers=fakeTimers(),source=new FakeSource(),force:boolean[]=[];
  const apply=createRoomSnapshotApplier();let healthCalls=0,opened=0,sent=0,status='',state:Record<string,unknown>={};
  const controller=createCourtyardConnection({
    ...timers,
    health:async()=>{if(++healthCalls===1)throw new TypeError('LAN unavailable');},
    openSource:()=>{opened++;return source;},
    onStatus:value=>{status=value;},
    onSnapshot:(_raw,authoritative)=>{force.push(authoritative);state={...state,...apply([],{},1000,2000,authoritative)};},
    sendState:async()=>{assert.equal(status,'online','snapshot must mark the room online before registration');sent++;},
  });
  controller.start();controller.start();await settle();
  assert.equal(status,'offline');assert.equal(opened,0);assert.equal(timers.timeouts.size,1);
  timers.retry();await settle();
  assert.equal(healthCalls,2);assert.equal(opened,1);assert.equal(sent,0);assert.equal(timers.timeouts.size,0);
  source.emit('open');source.emit('snapshot','{}');await settle();
  assert.equal(status,'online');assert.equal(sent,1);assert.equal(timers.intervals.size,1);
  source.emit('snapshot','{}');assert.equal(timers.intervals.size,1);
  state={...state,burningIncense:[999],offerings:{flower:[998],candle:[997]},plots:{ghost:{}}};
  source.onerror?.();assert.equal(status,'offline');assert.equal(timers.intervals.size,0);
  source.emit('open');source.emit('snapshot','{}');await settle();
  assert.deepEqual(force,[true,false,true]);assert.deepEqual(state.burningIncense,[]);
  assert.deepEqual(state.offerings,{flower:[],candle:[]});assert.deepEqual(state.plots,{});
  assert.equal(timers.intervals.size,1);assert.equal(sent,2);
  controller.close();assert.equal(source.closed,true);assert.equal(timers.intervals.size,0);assert.equal(timers.timeouts.size,0);
  source.emit('snapshot','{}');source.onerror?.();assert.equal(sent,2);assert.equal(force.length,3);
});

test('unmount cancels a health retry and ignores an outstanding health response',async()=>{
  const timers=fakeTimers();let opened=0,resolveHealth!:()=>void;
  const controller=createCourtyardConnection({...timers,health:()=>new Promise<void>(resolve=>{resolveHealth=resolve;}),openSource:()=>{opened++;return new FakeSource();},onSnapshot:()=>{},onStatus:()=>{},sendState:async()=>{}});
  controller.start();controller.close();resolveHealth();await settle();assert.equal(opened,0);assert.equal(timers.timeouts.size,0);
  const failed=createCourtyardConnection({...timers,health:async()=>{throw new Error('offline');},openSource:()=>new FakeSource(),onSnapshot:()=>{},onStatus:()=>{},sendState:async()=>{}});
  failed.start();await settle();assert.equal(timers.timeouts.size,1);failed.close();assert.equal(timers.timeouts.size,0);
});

test('each page owns a stable fresh identity even when duplicated tabs copy sessionStorage',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=> 'copied-player-identity'}});
  try{
    const pageA=createPageIdentity(),pageB=createPageIdentity(),firstRoomIdentity=pageA.id;
    assert.notEqual(pageA.id,pageB.id);assert.notEqual(pageA.id,'copied-player-identity');
    assert.equal(pageA.id,firstRoomIdentity,'room changes and reconnects retain the page identity');
  }finally{if(original)Object.defineProperty(globalThis,'sessionStorage',original);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});

test('offering/plot clocks are local, incense seeds stay canonical, and drift/additions preserve existing starts',()=>{
  const apply=createRoomSnapshotApplier(),server=10_000_000,now=1_000_000;
  const offerings:SharedOffering[]=[{kind:'incense',at:server-20000,station:'bodhi'},{kind:'flower',at:server-10000,station:'flower-table-0'},{kind:'candle',at:server-8000,station:'candle-table-0'},{kind:'feed',at:server-5000,station:null,eatingAt:server-2000,x:22,z:6}];
  const plots:Record<string,PlotState>={a:{plantedAt:server-30000,wateredAt:server-15000,revision:1,harvested:false}};
  const first=apply(offerings,plots,server,now,true);
  assert.deepEqual(first.burningIncense,[now-20000]);assert.deepEqual(first.offerings,{flower:[now-10000],candle:[now-8000]});
  assert.equal(first.offeringSlots?.[now-20000],'bodhi');assert.equal(first.offeringSlots?.[now-10000],'flower-table-0');
  assert.equal(first.offeringServerTimes?.[now-20000],server-20000,'render seed retains the same incense geometry on every device');
  assert.equal(first.fishFeedAt,now-5000);assert.equal(first.fishFeeds?.[0].eatingAt,now-2000);assert.equal(first.fishFeeds?.[0].expiresAt,now+16000);
  assert.equal(first.plots?.a.plantedAt,now-30000);assert.equal(first.plots?.a.wateredAt,now-15000);
  const changed=apply([...offerings,{kind:'incense',at:server+1000,station:null}],plots,server+1000,now+6000,true);
  assert.equal(changed.burningIncense?.[0],first.burningIncense?.[0]);assert.equal(changed.offerings?.flower[0],first.offerings?.flower[0]);
  assert.equal(changed.plots?.a.plantedAt,first.plots?.a.plantedAt);
  assert.equal(changed.burningIncense?.[1],now+6000);
  const empty=apply([],{},server+2000,now+7000,true);
  assert.deepEqual(empty.burningIncense,[]);assert.deepEqual(empty.offeringServerTimes,{});assert.deepEqual(empty.offeringSlots,{});assert.deepEqual(empty.fishFeeds,[]);
});

test('meal relative times survive differently skewed sender, server and observer clocks',()=>{
  const senderNow=100_000_000,serverNow=5_000_000,observerNow=20_000_000;
  const meal:MealOrder={dish:'rice',seatId:'dining-1',status:'preparing',orderedAt:senderNow-5000,cookedAt:senderNow-1000,counterReadyAt:senderNow+1000,kitchenAt:senderNow+2000,deliveryAt:senderNow+3000,homeAt:senderNow+6000,readyAt:senderNow+4000};
  const deltas=mealTimingDeltas(meal,senderNow)!;
  const canonical={...meal,...Object.fromEntries(Object.entries(deltas).map(([field,delta])=>[field,serverNow+delta]))};
  const local=localPeerMeal(canonical,serverNow,observerNow)!;
  assert.equal(local.readyAt,observerNow+4000);assert.equal(local.orderedAt,observerNow-5000);assert.equal(local.homeAt,observerNow+6000);
  assert.equal(local.eatUntil,undefined);assert.equal(localPeerMeal(null,serverNow,observerNow),null);assert.equal(mealTimingDeltas(null,senderNow),null);
});

test('lost transport retries the same operation at most twice; semantic rejection is final',async()=>{
  const operation={operation:'same-deduplication-token',kind:'lantern'},seen:typeof operation[]=[];
  const result=await retryNetworkOperation(async()=>{seen.push(operation);if(seen.length===1)throw new TypeError('response lost');return {ok:true};});
  assert.deepEqual(result,{ok:true});assert.equal(seen.length,2);assert.equal(seen[0],seen[1]);
  let attempts=0;await assert.rejects(retryNetworkOperation(async()=>{attempts++;throw new Error('too far');}),/too far/);assert.equal(attempts,1);
  attempts=0;await assert.rejects(retryNetworkOperation(async()=>{attempts++;throw new TypeError('offline');}),/offline/);assert.equal(attempts,2);
});
