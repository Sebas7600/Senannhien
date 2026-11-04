import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}}});
const {useGame,emptyProgress,localDay}=await import('../src/gameStore.ts');
const {seats,dishes,places,distance,walkable}=await import('../src/gameData.ts');
const {findPath,clearLine}=await import('../src/navigation.ts');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults,inventory:{...defaults.inventory},progress:emptyProgress(),lifetime:emptyProgress(),day:localDay(),position:[0,22],peers:[],claimed:[],badges:[],visited:[],tasted:[],readBooks:[],plots:{},wishes:[]},true));
test('156 unique seats, including 20 dining cushions, are placed outside navigation obstacles',()=>{
  assert.equal(seats.length,156);assert.equal(new Set(seats.map(s=>s.id)).size,156);assert.equal(seats.filter(s=>s.kind==='dining').length,20);

  for(const s of seats)assert.ok(walkable(s.position[0],s.position[2],.3),s.id);
});
test('navigation reaches all dining seats and every practice area without crossing walls or water',()=>{
  const selected=[...seats.filter(s=>['dining','reading','tea'].includes(s.kind)),...seats.filter(s=>['temple-0','temple-17','hall-0','hall-19','bamboo-4','tea-0'].includes(s.id))];
  for(const s of selected){const start:[number,number]=[0,22],path=findPath(start,[s.position[0],s.position[2]]);assert.ok(path.length,s.id);let from=start;for(const p of path){assert.ok(clearLine(from,p),`${s.id}: ${from} -> ${p}`);from=p;}assert.ok(distance(from,[s.position[0],s.position[2]])<1,s.id);}
});
test('meals require a dining seat and cannot be reordered before finishing',()=>{
  useGame.getState().orderMeal('rice');assert.equal(useGame.getState().meal,null);
  useGame.setState({seated:'dining-0',position:[28.2,-29]});useGame.getState().orderMeal('rice');
  assert.equal(useGame.getState().meal?.dish,'rice');assert.equal(useGame.getState().meal?.seatId,'dining-0');
  useGame.getState().orderMeal('bread');assert.equal(useGame.getState().meal?.dish,'rice');
  useGame.getState().eat();assert.equal(useGame.getState().meal?.status,'preparing');
});
test('each of the four dishes is prepared, eaten, awards once and records its name',()=>{
  let time=Date.now();const original=Date.now;Date.now=()=>time;
  try{useGame.setState({seated:'dining-0',position:[28.2,-29],energy:0});
    for(const dish of dishes){time=Math.max(time,(useGame.getState().meal?.homeAt||0)+1);useGame.getState().orderMeal(dish.id);time=useGame.getState().meal!.readyAt+1;useGame.getState().tick();assert.equal(useGame.getState().meal?.status,'ready');useGame.getState().eat();assert.equal(useGame.getState().action,'eat');time+=9001;useGame.getState().tick();assert.equal(useGame.getState().meal?.status,'finished');const earned=useGame.getState().merit;useGame.getState().tick();assert.equal(useGame.getState().merit,earned);}
    assert.equal(useGame.getState().progress.meal,4);assert.deepEqual(useGame.getState().tasted,dishes.map(d=>d.id));assert.equal(useGame.getState().energy,100);
  }finally{Date.now=original}
});
test('leaving the table interrupts eating and preserves the prepared meal',()=>{
  useGame.setState({seated:'dining-1',meal:{dish:'noodles',seatId:'dining-1',status:'ready',readyAt:0}});useGame.getState().eat();useGame.getState().stand();assert.equal(useGame.getState().meal?.status,'ready');assert.equal(useGame.getState().progress.meal,0);assert.equal(useGame.getState().seated,null);
});
test('occupied seats cannot be selected and meditation selects an actual cushion',()=>{
  useGame.setState({peers:[{id:'p2',name:'Guest',robe:'#888888',x:0,y:0,z:0,heading:0,action:'sit',seat:'temple-0'}]});useGame.getState().sit('temple-0');assert.equal(useGame.getState().pendingSeat,null);
  useGame.setState({position:[-38,12]});useGame.getState().perform('meditate');const s=useGame.getState();assert.ok(s.pendingSeat);assert.equal(seats.find(c=>c.id===s.pendingSeat)?.kind,'cushion');assert.equal(s.pendingAction,'meditate');
});
test('garden consumes a seed, needs water and takes 60 seconds to mature',()=>{
  let time=Date.now();const original=Date.now;Date.now=()=>time;
  try{useGame.setState({position:[31,-53],connection:'offline'});const seeds=useGame.getState().inventory.seed;useGame.getState().garden('plot-0');assert.equal(useGame.getState().inventory.seed,seeds-1);assert.equal(useGame.getState().plots['plot-0'].wateredAt,null);useGame.getState().garden('plot-0');assert.ok(useGame.getState().plots['plot-0'].wateredAt);useGame.getState().garden('plot-0');assert.equal(useGame.getState().progress.harvest,0);time+=60001;useGame.getState().garden('plot-0');assert.equal(useGame.getState().inventory.vegetable,3);assert.equal(useGame.getState().progress.harvest,1);useGame.getState().garden('plot-0');assert.equal(useGame.getState().progress.harvest,1);assert.equal(useGame.getState().inventory.seed,seeds-2);
  }finally{Date.now=original}
});
test('daily rewards and achievement rewards cannot be claimed twice',()=>{
  useGame.getState().claim('meal');assert.equal(useGame.getState().merit,0);useGame.getState().record('meal');useGame.getState().claim('meal');assert.equal(useGame.getState().merit,27);useGame.getState().claim('meal');assert.equal(useGame.getState().merit,27);
  useGame.setState({visited:places.map(p=>p.id)});useGame.getState().claimBadge('explorer');assert.equal(useGame.getState().merit,127);useGame.getState().claimBadge('explorer');assert.equal(useGame.getState().merit,127);
});
test('new day clears daily tasks but retains lifetime, meals, crops and discoveries',()=>{
  useGame.setState({day:'2000-1-1',progress:{...emptyProgress(),meal:3},lifetime:{...emptyProgress(),meal:3},tasted:['rice'],visited:['dining'],claimed:['meal']});useGame.getState().checkDay();assert.equal(useGame.getState().progress.meal,0);assert.equal(useGame.getState().lifetime.meal,3);assert.deepEqual(useGame.getState().tasted,['rice']);assert.deepEqual(useGame.getState().visited,['dining']);assert.deepEqual(useGame.getState().claimed,[]);
});
test('insufficient currency or items cannot create supplies or progress',()=>{
  useGame.setState({merit:0,position:[18,4],inventory:{...defaults.inventory,feed:0}});useGame.getState().buy('seed');assert.equal(useGame.getState().inventory.seed,12);useGame.getState().perform('feed');assert.equal(useGame.getState().progress.feed,0);assert.equal(useGame.getState().inventory.feed,0);
});
