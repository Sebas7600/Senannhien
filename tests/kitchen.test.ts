import {test} from 'node:test';
import assert from 'node:assert/strict';
import {npcs,seats,walkable,distance,CHEF_HOME,CHEF_PASS,KITCHEN_PICKUP,PICKUP_PLATE,KITCHEN_COUNTER_TOP} from '../src/gameData';
import {chefRoutes,chefSchedule,chefPhase,serviceTimes,servicePhase,mealPlan,sampleRoute,createMealPresentation,sampleKitchenMeal,sampleMealPresentation,counterAvailableAt,PLATE_LIFT,HANDOFF_MS} from '../src/mealService';
import {clearLine} from '../src/navigation';

test('Cô An stands at the central stove and cooks for exactly three seconds before carrying food',()=>{
  const chef=npcs.find(n=>n.id==='chef')!;assert.equal(chef.name,'Cô An');assert.deepEqual([chef.x,chef.z],CHEF_HOME);assert.equal(chef.x,34);assert.ok(walkable(...CHEF_HOME));
  const order={seatId:'dining-0',status:'preparing',...serviceTimes('dining-0',10000)},out=createMealPresentation();
  assert.equal(order.cookedAt-order.orderedAt,3000);
  assert.equal(chefPhase(null,0),'idle');assert.equal(chefPhase(order,order.orderedAt-1),'idle');
  for(let t=order.orderedAt;t<order.cookedAt;t+=100){const p=sampleKitchenMeal(order,t,out);assert.equal(p.kitchen.phase,'cooking');assert.deepEqual([p.kitchen.x,p.kitchen.z],CHEF_HOME);assert.ok(!p.visible);}
  assert.equal(chefPhase(order,order.cookedAt),'lifting');assert.ok(sampleKitchenMeal(order,order.cookedAt,out).visible);
  const timing=chefSchedule(order.cookedAt);assert.equal(chefPhase(order,timing.homeAt),'idle');assert.deepEqual([sampleKitchenMeal(order,timing.homeAt,out).kitchen.x,out.kitchen.z],CHEF_HOME);
});

test('chef stays behind the counter and Cô Tâm cannot collect until her tray is set down and hands clear',()=>{
  const routes=chefRoutes();
  for(const r of [routes.toPass,routes.toStove]){assert.ok(r.length>0);for(let i=1;i<r.points.length;i++){assert.ok(clearLine(r.points[i-1],r.points[i]));assert.ok(r.points[i][1]<-34.4);}}
  assert.deepEqual(routes.toPass.points.at(-1),CHEF_PASS);
  for(const seat of seats.filter(s=>s.kind==='dining')){
    const order={seatId:seat.id,status:'preparing',...serviceTimes(seat.id,10000)},plan=mealPlan(seat.id),out=createMealPresentation();
    const startPickup=order.deliveryAt-700;
    assert.ok(startPickup>=counterAvailableAt(order));assert.equal(servicePhase(order,startPickup-1),'waiting');assert.equal(servicePhase(order,startPickup),'pickup');
    for(let now=order.orderedAt;now<=order.counterReadyAt+450;now+=25){
      const chef=sampleKitchenMeal(order,now,out).kitchen,server=sampleRoute(plan.toKitchen,(now-order.orderedAt)/(order.kitchenAt-order.orderedAt),{x:0,z:0,heading:0});
      assert.ok(distance([chef.x,chef.z],[server.x,server.z])>1.1,'Two NPC bodies must not overlap');
      if(now>=order.cookedAt)assert.ok(out.position[1]-PLATE_LIFT>=KITCHEN_COUNTER_TOP-.00001,'Carried tray clears the counter surface');
    }
    const done=sampleKitchenMeal(order,order.counterReadyAt,out);assert.deepEqual(done.position,[PICKUP_PLATE[0],KITCHEN_COUNTER_TOP+PLATE_LIFT,PICKUP_PLATE[2]]);assert.equal(done.kitchen.walking,false);
  }
});

test('the same tray moves continuously from Cô An through the pass into Cô Tâm hands and onto the table',()=>{
  const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',10000)},out=createMealPresentation(),plan=mealPlan(order.seatId),schedule=chefSchedule(order.cookedAt);
  const npc={x:KITCHEN_PICKUP[0],y:.16,z:KITCHEN_PICKUP[1],heading:-Math.PI/2};
  for(const boundary of [schedule.liftedAt,schedule.departAt,schedule.arriveAt,order.counterReadyAt,counterAvailableAt(order),order.deliveryAt]){
    const a=[...sampleMealPresentation(order,boundary-.01,npc,out).position],b=sampleMealPresentation(order,boundary+.01,npc,out).position;
    assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<.001,`Tray jumps at ${boundary}`);
  }
  const arrival=order.readyAt-HANDOFF_MS,atTable={x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading};
  for(let t=arrival;t<=order.readyAt;t+=10)assert.ok(sampleMealPresentation(order,t,atTable,out).position[1]-PLATE_LIFT>=seats.find(s=>s.id===order.seatId)!.table![1]-.00001);
  assert.deepEqual(sampleMealPresentation(order,order.readyAt,atTable,out).position,plan.plate);
  assert.equal(sampleKitchenMeal(order,schedule.returnAt,out).kitchen.carrying,false);
});
