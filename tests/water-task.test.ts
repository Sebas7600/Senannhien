import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {WATER_WELL,WATER_JARS,WATER_TASK,emptyWaterJars,jarUnits,jarWaterRadius,nearWaterJar} from '../src/waterTaskData';
import {walkable,seats} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';
import * as geometry from '../src/waterTaskGeometry';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}}});
const {useGame,emptyProgress}=await import('../src/gameStore');
const {travel}=await import('../src/MapView');
const defaults=useGame.getInitialState(),realNow=Date.now;
let now=1800000000000;
beforeEach(()=>{now=1800000000000;Date.now=()=>now;useGame.setState({...defaults,started:true,characterConfigured:true,connection:'offline',progress:emptyProgress(),lifetime:emptyProgress(),waterJars:emptyWaterJars()},true);});
afterEach(()=>{Date.now=realNow;});
function pickUp(){useGame.setState({position:[...WATER_WELL.approach]});useGame.getState().perform('carryWater');now+=WATER_TASK.drawMs;useGame.getState().tickWaterTask();assert.equal(useGame.getState().action,'carryWater');}
function pour(id=0){useGame.setState({position:[...WATER_JARS[id].approach]});useGame.getState().waterTask(id);assert.equal(useGame.getState().waterQuest?.phase,'pouring');}

test('well and all four jars have walkable approaches and clear paths without crossing the dining wall',()=>{
  assert.ok(walkable(...WATER_WELL.approach));
  for(const start of [[0,22],[28,-45],[34,-17]] as [number,number][]){const route=findPath(start,WATER_WELL.approach);assert.ok(route.length,`route from ${start}`);let from=start;for(const point of route){assert.ok(clearLine(from,point),`${from} -> ${point}`);from=point;}assert.deepEqual(route.at(-1),WATER_WELL.approach);}
  for(const j of WATER_JARS){assert.ok(walkable(...j.approach));const path=findPath(WATER_WELL.approach,j.approach);assert.ok(path.length);let from=WATER_WELL.approach;for(const point of path){assert.ok(clearLine(from,point));from=point;}assert.deepEqual(path.at(-1),j.approach);assert.ok(nearWaterJar(j.approach,j.id));assert.equal(nearWaterJar([j.x,-35.3],j.id),false,'no pouring through the rear wall');}
});
test('pickup walks to the well, takes three seconds, and repeated clicks never award merit',()=>{
  useGame.getState().perform('carryWater');assert.deepEqual(useGame.getState().destination,WATER_WELL.approach);assert.equal(useGame.getState().pendingActivity,'carryWater');assert.equal(useGame.getState().waterQuest,null);
  useGame.setState({position:[...WATER_WELL.approach]});useGame.getState().perform('carryWater');const quest=useGame.getState().waterQuest!;
  for(let i=0;i<10;i++)useGame.getState().waterTask();assert.equal(useGame.getState().waterQuest,quest);
  now+=WATER_TASK.drawMs-1;useGame.getState().tickWaterTask();assert.equal(useGame.getState().action,'drawWater');
  now++;useGame.getState().tickWaterTask();assert.equal(useGame.getState().action,'carryWater');assert.equal(useGame.getState().merit,0);assert.equal(useGame.getState().progress.carryWater,0);
});
test('a delivery requires carrying to the jar and finishing its pour, then pays exactly once',()=>{
  const inventory={...useGame.getState().inventory};pickUp();useGame.getState().waterTask(2);assert.deepEqual(useGame.getState().destination,WATER_JARS[2].approach);assert.equal(useGame.getState().action,'carryWater');
  now+=20000;useGame.getState().tickWaterTask();assert.equal(useGame.getState().merit,0);
  pour(2);for(let i=0;i<20;i++)useGame.getState().waterTask(2);now+=WATER_TASK.pourMs-1;useGame.getState().tick();assert.equal(useGame.getState().merit,0);
  now++;useGame.getState().tick();for(let i=0;i<30;i++){useGame.getState().tickWaterTask();useGame.getState().waterTask(2);}
  const s=useGame.getState();assert.equal(s.merit,8);assert.equal(s.progress.carryWater,1);assert.equal(s.lifetime.carryWater,1);assert.equal(s.waterQuest,null);assert.equal(s.action,'walk');assert.equal(jarUnits(s.waterJars[2],now),1);assert.deepEqual(s.waterJars.map(j=>jarUnits(j,now)),[0,0,1,0]);assert.deepEqual(s.inventory,inventory);
});
test('cancelling, leaving a station or changing room never rewards an unfinished trip',()=>{
  useGame.setState({position:[...WATER_WELL.approach]});useGame.getState().waterTask();useGame.setState({position:[0,0]});now+=4000;useGame.getState().tickWaterTask();assert.equal(useGame.getState().waterQuest,null);
  pickUp();pour();useGame.setState({position:[0,0]});now+=3000;useGame.getState().tickWaterTask();assert.equal(useGame.getState().waterQuest?.phase,'carrying');assert.equal(useGame.getState().merit,0);
  useGame.getState().cancelWaterTask();now+=5000;useGame.getState().tickWaterTask();assert.equal(useGame.getState().waterQuest,null);assert.equal(useGame.getState().merit,0);assert.equal(useGame.getState().destination,null);
  pickUp();useGame.setState({room:'truc-lam'});useGame.getState().tickWaterTask();assert.equal(useGame.getState().waterQuest,null);assert.equal(useGame.getState().merit,0);
});
test('full jars reject pickup, automatically recover capacity, and a full chosen jar preserves the load',()=>{
  useGame.setState({position:[...WATER_WELL.approach],waterJars:WATER_JARS.map(()=>({units:4,at:now}))});useGame.getState().waterTask();assert.equal(useGame.getState().waterQuest,null);
  now+=WATER_TASK.useMs;pickUp();useGame.setState({waterJars:WATER_JARS.map(()=>({units:4,at:now}))});useGame.getState().waterTask(0);assert.equal(useGame.getState().waterQuest?.phase,'carrying');assert.equal(useGame.getState().action,'carryWater');
  useGame.setState({waterJars:[{units:4,at:now},{units:0,at:now},{units:4,at:now},{units:4,at:now}]});useGame.getState().waterTask();assert.equal(useGame.getState().waterQuest?.jar,1);
  assert.equal(jarUnits({units:4,at:now},now+WATER_TASK.useMs*10),0);assert.equal(jarUnits(undefined,now),0);assert.equal(jarUnits({units:NaN,at:now},now),0);
});
test('other practices, seats and gardening cannot steal a carried load; ordinary walking preserves its pose',()=>{
  pickUp();const quest=useGame.getState().waterQuest;for(const activity of ['bow','pray','sweep','meal','meditate','tea'] as const){useGame.getState().perform(activity);assert.equal(useGame.getState().waterQuest,quest);assert.equal(useGame.getState().action,'carryWater');}
  useGame.getState().sit(seats[0].id);useGame.getState().arriveSeat(seats[0].id);useGame.getState().garden('plot-0');assert.equal(useGame.getState().seated,null);assert.equal(useGame.getState().gardenPending,null);
  const position=[...useGame.getState().position];travel('garden');assert.equal(useGame.getState().teleport,null);assert.deepEqual(useGame.getState().position,position);
  useGame.getState().go('garden');assert.equal(useGame.getState().action,'carryWater');assert.equal(useGame.getState().waterQuest?.phase,'carrying');useGame.getState().stand();assert.equal(useGame.getState().action,'carryWater');
  pour();useGame.getState().stand();assert.equal(useGame.getState().waterQuest?.phase,'carrying');assert.equal(useGame.getState().merit,0);
});
test('a jar filled while pouring cannot consume the load or pay a reward; another jar still accepts it',()=>{
  pickUp();pour();useGame.setState({waterJars:[{units:4,at:now},...emptyWaterJars().slice(1)]});now+=WATER_TASK.pourMs;useGame.getState().tickWaterTask();assert.equal(useGame.getState().waterQuest?.phase,'carrying');assert.equal(useGame.getState().merit,0);
  pour(1);now+=WATER_TASK.pourMs;useGame.getState().tickWaterTask();assert.equal(useGame.getState().merit,8);assert.equal(jarUnits(useGame.getState().waterJars[1],now),1);
});
test('only jar contents persist; unfinished trips and held buckets reset on reload',()=>{
  pickUp();pour();now+=WATER_TASK.pourMs;useGame.getState().tickWaterTask();pickUp();const saved=useGame.persist.getOptions().partialize!(useGame.getState());
  assert.ok('waterJars' in saved);assert.ok(!('waterQuest' in saved));assert.ok(!('action' in saved));assert.ok(!('destination' in saved));assert.equal((saved as any).waterJars[0].units,1);
});
test('water assets share low-poly geometry, finite normals and no image textures',()=>{
  const triangles=(g:any)=>(g.index?.count??g.attributes.position.count)/3;
  let fixed=0;for(const name of ['wellStoneGeometry','wellFrameGeometry','wellRopeGeometry','wellRopeLineGeometry','wellBucketGeometry'] as const)fixed+=triangles(geometry[name]);fixed+=triangles(geometry.waterJarGeometry)*4+triangles(geometry.waterDiscGeometry)*5;
  const carry=triangles(geometry.yokeWoodGeometry)+triangles(geometry.yokeBucketGeometry)+triangles(geometry.yokeWaterGeometry);assert.ok(fixed<6000,`${fixed} static triangles`);assert.ok(carry<1200,`${carry} carried triangles`);
  for(const value of Object.values(geometry))if('isBufferGeometry' in value){for(const attr of Object.values((value as any).attributes) as any[])assert.ok(Array.from(attr.array).every(Number.isFinite));}
  for(const mat of [geometry.jarMaterial,geometry.waterMaterial,geometry.bucketMaterial,geometry.wellStoneMaterial,geometry.wellWoodMaterial])assert.equal(mat.map,null);
  for(let fill=.25;fill<=1;fill+=.25)assert.ok(jarWaterRadius(fill)>.3&&jarWaterRadius(fill)<.51);
});
