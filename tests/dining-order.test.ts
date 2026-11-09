import {beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {RECEPTION,seats} from '../src/gameData';
const storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
Object.defineProperty(globalThis,'window',{value:{localStorage:storage},configurable:true});
const {useGame}=await import('../src/gameStore');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults,position:[...RECEPTION]},true));

test('reception remembers the selected dish, suppresses the second menu and starts only one meal at arrival',()=>{
  useGame.getState().orderMeal('bread');
  const target=useGame.getState().pendingSeat!;
  assert.ok(target);assert.equal(useGame.getState().mealRequest?.dish,'bread');assert.equal(useGame.getState().meal,null);
  useGame.getState().orderMeal('rice');
  assert.equal(useGame.getState().mealRequest?.dish,'bread');
  useGame.getState().arriveSeat(target);
  const order=useGame.getState().meal;
  assert.equal(order?.dish,'bread');assert.equal(order?.seatId,target);assert.equal(order?.status,'preparing');
  assert.equal(useGame.getState().panel,null);assert.equal(useGame.getState().mealRequest,null);
  useGame.getState().orderMeal('rice');useGame.getState().perform('meal');
  assert.equal(useGame.getState().meal,order);assert.equal(useGame.getState().panel,null);
});

test('direct seating still opens the menu and accepts the dish chosen at the table',()=>{
  useGame.getState().sit('dining-0');useGame.getState().arriveSeat('dining-0');
  assert.equal(useGame.getState().panel,'menu');assert.equal(useGame.getState().meal,null);
  useGame.getState().orderMeal('rice');assert.equal(useGame.getState().meal?.dish,'rice');
});

test('an interrupted route or occupied target retains the first choice for another dining cushion',()=>{
  useGame.getState().orderMeal('bread');const target=useGame.getState().pendingSeat!;
  useGame.getState().stand();assert.equal(useGame.getState().mealRequest?.dish,'bread');
  useGame.setState({peers:[{id:'other',seat:target} as any]});useGame.getState().arriveSeat(target);
  assert.equal(useGame.getState().seated,null);assert.equal(useGame.getState().meal,null);
  useGame.getState().perform('meal');const next=useGame.getState().pendingSeat!;assert.notEqual(next,target);
  useGame.getState().arriveSeat(next);assert.equal(useGame.getState().meal?.dish,'bread');assert.equal(useGame.getState().panel,null);
});

test('full dining, remote ordering and a water task cannot create a reception request',()=>{
  useGame.setState({peers:seats.filter(s=>s.kind==='dining').map(s=>({id:s.id,seat:s.id} as any))});
  useGame.getState().orderMeal('rice');assert.equal(useGame.getState().mealRequest,null);
  useGame.setState({peers:[],position:[0,0]});useGame.getState().orderMeal('rice');assert.equal(useGame.getState().mealRequest,null);
  useGame.setState({position:[...RECEPTION],waterQuest:{phase:'carrying'} as any});useGame.getState().orderMeal('rice');assert.equal(useGame.getState().mealRequest,null);
});

test('reception request can be cancelled and is never restored from storage',()=>{
  useGame.getState().orderMeal('rice');
  const saved=useGame.persist.getOptions().partialize!(useGame.getState());assert.ok(!('mealRequest' in saved));
  useGame.getState().cancelMealRequest();assert.equal(useGame.getState().mealRequest,null);assert.equal(useGame.getState().pendingSeat,null);assert.equal(useGame.getState().destination,null);
});

test('returning to a ready meal starts eating and closes the menu instead of accepting a new order',()=>{
  useGame.getState().arriveSeat('dining-0');useGame.getState().orderMeal('rice');
  useGame.setState({meal:{...useGame.getState().meal!,status:'ready'},panel:'menu'});
  useGame.getState().perform('meal');assert.equal(useGame.getState().meal?.dish,'rice');
  assert.equal(useGame.getState().action,'eat');assert.equal(useGame.getState().panel,null);
  useGame.setState({panel:'menu'});useGame.getState().perform('meal');assert.equal(useGame.getState().panel,null);
});
