import {MAYA_LEVEL} from '../src/mayaLevel';
import {POND} from '../src/pondLayout';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}}});
const {useGame}=await import('../src/gameStore.ts');
const {seats,teaTables,readingTables,seatExit,walkable,distance}=await import('../src/gameData.ts');
const {mealRoute,mealPlan,routePoint}=await import('../src/mealService.ts');
const {clearLine,findPath}=await import('../src/navigation.ts');
const {bellAngle,lanternPose,BELL_DURATION,LANTERN_RISE,LANTERN_LIFETIME,MAX_LANTERNS,WISH_STATION,WISH_APPROACH}=await import('../src/ritualMotion.ts');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults,inventory:{...defaults.inventory},wishes:[],flights:[]},true));

test('20 individual reading desks and 10 tables with two opposing tea cushions have safe exits',()=>{
  assert.equal(readingTables.length,20);assert.equal(teaTables.length,10);
  assert.equal(seats.filter(s=>s.kind==='reading').length,20);
  for(const table of teaTables){const pair=seats.filter(s=>s.table===table);assert.equal(pair.length,2);assert.ok(Math.abs(pair[0].rotation-pair[1].rotation)===Math.PI);assert.equal((pair[0].position[2]+pair[1].position[2])/2,table[2]);}
  for(const seat of seats.filter(s=>!!s.table)){assert.ok(walkable(...seatExit(seat),.3),seat.id);assert.ok(distance(seatExit(seat),[seat.table![0],seat.table![2]])>distance([seat.position[0],seat.position[2]],[seat.table![0],seat.table![2]]),seat.id);}
});

test('tea, reading and chanting complete the selected action on arrival without a second start button',()=>{
  for(const [activity,kind,panel] of [['tea','tea',null],['read','reading','library'],['chant','cushion','chantMoment']] as const){
    useGame.setState({...defaults,position:[0,22]},true);useGame.getState().perform(activity);const pending=useGame.getState().pendingSeat!;assert.ok(pending);assert.equal(seats.find(c=>c.id===pending)?.kind,kind);useGame.getState().arriveSeat(pending);assert.equal(useGame.getState().panel,panel);assert.equal(useGame.getState().action,activity);useGame.getState().closePanel();assert.equal(useGame.getState().seated,pending);assert.equal(useGame.getState().action,activity==='read'?'read':'sit');
  }
});

test('occupied areas do not leave stale pending actions',()=>{
  const peers=seats.filter(s=>s.kind==='tea').map((s,i)=>({id:`peer-${i}`,name:'Guest',robe:'#888888',x:0,y:0,z:0,heading:0,action:'sit' as const,seat:s.id}));
  useGame.setState({peers});useGame.getState().perform('tea');assert.equal(useGame.getState().pendingSeat,null);assert.equal(useGame.getState().pendingActivity,null);
  useGame.setState({peers:[]});useGame.getState().perform('tea');const id=useGame.getState().pendingSeat!;useGame.setState({peers:[{...peers[0],seat:id}]});useGame.getState().arriveSeat(id);assert.equal(useGame.getState().pendingActivity,null);assert.equal(useGame.getState().panel,null);
});

test('meal service walks around furniture to every table, using distance-based delivery times',()=>{
  for(const seat of seats.filter(s=>s.kind==='dining')){const route=mealRoute(seat.id);assert.ok(route.length>0,seat.id);for(let i=1;i<route.points.length;i++)assert.ok(clearLine(route.points[i-1],route.points[i]),seat.id);assert.deepEqual(routePoint(route.points,0).position,route.points[0]);assert.ok(distance(routePoint(route.points,1).position,mealPlan(seat.id).destination)<.01);useGame.setState({seated:seat.id,meal:null});useGame.getState().orderMeal('bread');const order=useGame.getState().meal!;assert.ok(order.readyAt>order.deliveryAt!);assert.equal(order.cookedAt!-order.orderedAt!,3000);assert.ok(order.deliveryAt!>order.cookedAt!);assert.ok(order.homeAt!>order.readyAt);}
});

test('bell waits for the full decaying swing and does not interrupt another open panel',()=>{
  let now=Date.now();const original=Date.now;Date.now=()=>now;
  try{useGame.setState({position:[-19,-9]});useGame.getState().perform('bell');assert.equal(useGame.getState().panel,null);const at=now;assert.equal(bellAngle(0),0);assert.ok(Math.abs(bellAngle(250))>.01);assert.equal(bellAngle(BELL_DURATION),0);now=at+BELL_DURATION-1;useGame.getState().tick();assert.equal(useGame.getState().panel,null);useGame.setState({panel:'bag'});now++;useGame.getState().tick();assert.equal(useGame.getState().panel,'bag');useGame.getState().closePanel();useGame.getState().tick();assert.equal(useGame.getState().panel,null);useGame.getState().closePanel();useGame.getState().tick();assert.equal(useGame.getState().panel,null);}finally{Date.now=original}
});

test('wishes require the station, consume once, rise from the pond and reveal only at flight height',()=>{
  let now=Date.now();const original=Date.now;Date.now=()=>now;
  try{useGame.getState().releaseWish('too far');assert.equal(useGame.getState().inventory.lantern,5);useGame.setState({position:WISH_STATION});useGame.getState().releaseWish('  Bình an  ');const at=now;assert.equal(useGame.getState().wishes[0].text,'Bình an');assert.equal(useGame.getState().inventory.lantern,4);assert.equal(useGame.getState().panel,null);useGame.getState().releaseWish('duplicate');assert.equal(useGame.getState().inventory.lantern,4);assert.deepEqual(lanternPose(0,at).position,[28,POND.waterY+.265,35.5]);const top=lanternPose(LANTERN_RISE,at).position;assert.ok(top[1]>7);const after=lanternPose(LANTERN_RISE+1,at).position;assert.ok(Math.hypot(...top.map((v,i)=>v-after[i]))<.01);now=at+LANTERN_RISE-1;useGame.getState().tick();assert.equal(useGame.getState().panel,null);now++;useGame.getState().tick();assert.equal(useGame.getState().panel,'lanternMoment');assert.equal(useGame.getState().reflectionWish,'Bình an');assert.equal(lanternPose(LANTERN_LIFETIME,at).scale,0);now=at+LANTERN_LIFETIME;useGame.getState().tick();assert.equal(useGame.getState().flights.length,0);}finally{Date.now=original}
});

test('lantern pool is bounded, arbitrary text stays text, and no runtime flight state is persisted',()=>{
  useGame.setState({position:WISH_STATION,inventory:{...defaults.inventory,lantern:40}});
  for(let i=0;i<35;i++){useGame.setState({ceremony:null});useGame.getState().releaseWish(`<script>${i}</script>`);}
  const s=useGame.getState();assert.equal(s.flights.length,MAX_LANTERNS);assert.equal(s.wishes.length,30);assert.equal(new Set(s.wishes.map(w=>w.at)).size,30);assert.equal(s.inventory.lantern,5);assert.ok(s.wishes[0].text.startsWith('<script>'));
  const saved=useGame.persist.getOptions().partialize!(s);assert.ok(!('ceremony' in saved));assert.ok(!('flights' in saved));
  for(let age=0;age<LANTERN_LIFETIME;age+=200){const p=lanternPose(age,1234).position;assert.ok(p[0]>=21&&p[0]<=35);assert.ok(p[2]>=32&&p[2]<=39);}
  assert.equal(bellAngle(250,true),0);assert.equal(lanternPose(6000,12,true).rotation,0);
});

test('another ceremony cannot overwrite a lantern in flight and stopping navigation cancels its pending action',()=>{
  useGame.setState({position:WISH_STATION});useGame.getState().releaseWish('Bình an');const ceremony=useGame.getState().ceremony;
  useGame.setState({position:[MAYA_LEVEL.bellX,-9]});useGame.getState().perform('bell');assert.equal(useGame.getState().ceremony,ceremony);assert.equal(useGame.getState().progress.bell,0);
  useGame.setState({ceremony:null,event:null,position:[0,22]});useGame.getState().perform('lantern');assert.equal(useGame.getState().pendingActivity,'lantern');useGame.getState().stand();assert.equal(useGame.getState().pendingActivity,null);
});

test('wish station has a solid base and a separate reachable standing position',()=>{
  assert.ok(!walkable(...WISH_STATION));assert.ok(walkable(...WISH_APPROACH));assert.ok(distance(WISH_STATION,WISH_APPROACH)>1.5);assert.ok(distance(WISH_STATION,[14,39])>1.5);
  const path=findPath([0,22],WISH_APPROACH);assert.ok(path.length);let from:[number,number]=[0,22];for(const point of path){assert.ok(clearLine(from,point));from=point;}assert.ok(distance(from,WISH_APPROACH)<.01);
  useGame.getState().perform('lantern');assert.deepEqual(useGame.getState().destination,WISH_APPROACH);
});

test('lotuses are balanced across all four sectors and stay off bridges while drifting',async()=>{
 const {lotusPositions,driftingLotusAnchors,lotusWaterClear}=await import('../src/lotusLayout');
 const {floatingLotusPose}=await import('../src/ritualMotion');
 const counts=[0,0,0,0];for(const [x,z]of [...lotusPositions,...driftingLotusAnchors]){counts[(x>POND.x?2:0)+(z>POND.z?1:0)]++;assert.ok(lotusWaterClear(x,z));}
 assert.deepEqual(counts,[14,14,14,14]);
 for(let i=0;i<driftingLotusAnchors.length;i++)for(let t=0;t<600;t+=13){const [x,,z]=floatingLotusPose(t,i);assert.ok(lotusWaterClear(x,z,.7));}
});

test('shared world clock translation does not replay bell/drum snapshots or change lantern seeds',async()=>{
 const {createWorldSnapshotApplier}=await import('../src/worldSnapshot');
 const apply=createWorldSnapshotApplier(),clock=Date.now(),server=clock-90000;
 const world={bell:{at:server-2000,readyAt:server+14000},drum:{at:server-1000},gateOpen:true,waterJars:[{units:2,at:server-3000}],lanterns:[{at:server-500,text:'Bình an'}],leaves:{epoch:server-10000,revision:0,cleared:[]}};
 const first=apply(world,server);assert.ok(Math.abs(first.worldBellAt!-(clock-2000))<100);assert.equal(first.flights![0].serverAt,server-500);assert.equal(first.waterJars![0].units,2);
 const duplicate=apply(world,server+350);assert.equal(duplicate.worldBellAt,undefined);assert.equal(duplicate.worldDrumAt,undefined);assert.equal(duplicate.flights,undefined);
});


test('main and Bodhi urns select disjoint incense and starting sticks share a stable room seed',async()=>{
 const {incenseAtStation,initialIncenseTimes}=await import('../src/incenseStations');
 const all=[1,2,3,4],slots={2:'bodhi',3:'quan-am',4:'truc-lam'};assert.deepEqual(incenseAtStation(all,slots),[1]);assert.deepEqual(incenseAtStation(all,slots,'bodhi'),[2]);
 const epoch=1700000000000,main=initialIncenseTimes(epoch,'main'),bodhi=initialIncenseTimes(epoch,'bodhi');assert.equal(main.length,15);assert.equal(new Set(main).size,15);assert.deepEqual(main,initialIncenseTimes(epoch,'main'));assert.notDeepEqual(main,bodhi);assert.ok(main.every(at=>epoch-at>0&&epoch-at<170000));assert.notDeepEqual(main,initialIncenseTimes(epoch+1000,'main'));
});


test('ambient incense is still burning in old rooms and late arrivals see the same cycles',async()=>{
 const {initialIncenseTimes}=await import('../src/incenseStations');const {incenseLife}=await import('../src/incenseLifecycle');const epoch=1700000000000;
 for(const station of ['main','bodhi','bodhi-right','quan-am','truc-lam'])for(const age of [0,170000,650000,3600000,86400000]){const now=epoch+age,times=initialIncenseTimes(epoch,station,15,now);assert.equal(times.length,15);assert.deepEqual(times,initialIncenseTimes(epoch,station,15,now));assert.ok(times.every(at=>incenseLife(at,now).burning),station+' at '+age);assert.ok(new Set(times.map(at=>Math.floor((now-at)/10000))).size>3,'staggered lengths rather than one uniform row');}
});
