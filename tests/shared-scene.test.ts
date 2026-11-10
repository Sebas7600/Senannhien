import {beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {makeFireworksPlan} from '../src/fireworksPlan';
import {sharedEventAge} from '../src/sharedActivity';
import {setWorldTransport} from '../src/worldTransport';
import {roomServiceMeal} from '../src/sharedMeal';
import {fruitAltars} from '../src/fruitOfferingData';
import {WISH_STATION} from '../src/ritualMotion';
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}},configurable:true});
const {useGame}=await import('../src/gameStore');
const initial=useGame.getInitialState();
beforeEach(()=>{useGame.setState({...initial},true);setWorldTransport(null);});
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

test('PC and phone share every shell trajectory and the same visible particle paths',()=>{
 for(const seed of [17,555]){
  const high=makeFireworksPlan(seed,'high',true),low=makeFireworksPlan(seed,'low',true);
  assert.equal(high.length,low.length);
  high.forEach((event,i)=>{
   const smaller=low[i];
   assert.deepEqual([event.at,event.flight,event.style,event.origin.toArray(),event.target.toArray()],[smaller.at,smaller.flight,smaller.style,smaller.origin.toArray(),smaller.target.toArray()]);
   assert.ok(smaller.particles.length<event.particles.length);
   assert.deepEqual(smaller.particles,event.particles.slice(0,smaller.particles.length));
  });
 }
});
test('canonical event age remains correct across device clock skew and a clock adjustment',()=>{
 assert.equal(sharedEventAge(9000,1000,12000,18000),5000);
 assert.equal(sharedEventAge(9000,1000,72012000,72018000),5000);
});
test('disconnected LAN never spends items or creates a private lantern, fruit, firework or garden',()=>{
 useGame.setState({roomSync:true,connection:'offline',position:[...WISH_STATION],inventory:{...initial.inventory,fruit:2}});
 useGame.getState().releaseWish('An lành');useGame.getState().startFireworks(true);
 useGame.setState({position:[...fruitAltars[0].spot]});useGame.getState().offerFruit();
 useGame.setState({position:[31,-53]});useGame.getState().garden('plot-0');
 const s=useGame.getState();assert.deepEqual(s.flights,[]);assert.equal(s.fireworksShow,null);assert.deepEqual(s.fruitOfferings,[]);assert.deepEqual(s.plots,{});assert.equal(s.inventory.fruit,2);assert.equal(s.inventory.lantern,initial.inventory.lantern);
});
test('online scene commands await server acknowledgement and cannot add a local-only visual',async()=>{
 const sent:unknown[]=[];setWorldTransport(async request=>{sent.push(request);return {at:100,serverTime:100};});
 useGame.setState({roomSync:true,connection:'online',position:[...fruitAltars[0].spot],inventory:{...initial.inventory,fruit:2}});
 useGame.getState().startFireworks(true);await settle();assert.equal(useGame.getState().fireworksShow,null);
 useGame.getState().stopFireworks();await settle();useGame.getState().offerFruit();await settle();
 assert.deepEqual(sent.map((r:any)=>[r.kind,r.command??r.altar]),[['fireworks','start'],['fireworks','stop'],['fruit','temple']]);
 assert.equal(useGame.getState().inventory.fruit,1);assert.deepEqual(useGame.getState().fruitOfferings,[]);
 setWorldTransport(async()=>{throw Error('lost connection');});useGame.getState().offerFruit();await settle();assert.equal(useGame.getState().inventory.fruit,1);
});
test('observers choose the same kitchen service regardless of their own meal or peer ordering',()=>{
 const first={dish:'rice' as const,seatId:'dining-0',status:'preparing' as const,orderedAt:100,readyAt:500,homeAt:900};
 const second={...first,seatId:'dining-1',orderedAt:200,homeAt:1200};
 assert.equal(roomServiceMeal({roomSync:true,roomMeals:[second,first],meal:second},300),first);
 assert.equal(roomServiceMeal({roomSync:true,roomMeals:[first,second],meal:null},300),first);
 assert.equal(roomServiceMeal({roomSync:true,roomMeals:[first,second],meal:first},1000),second);
 assert.equal(roomServiceMeal({roomSync:true,roomMeals:[],meal:first},300),null);
});
