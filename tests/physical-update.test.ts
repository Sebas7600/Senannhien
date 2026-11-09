import {MAYA_LEVEL} from '../src/mayaLevel';
import {CUSHION} from '../src/cushionData';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import {CHARACTER_OFFSET,CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS,diningTables,seats,floorSurfaces,obstacles,surfaceHeight,stepAssistHeight,walkable,distance} from '../src/gameData';
import {clearLine} from '../src/navigation';
import {mealPlan,serviceTimes,servicePhase,counterHasMeal,sampleRoute,HANDOFF_MS,TURN_MS,WITHDRAW_MS,MEAL_SCALE,PLATE_LIFT,createMealPresentation,sampleMealPresentation} from '../src/mealService';
import {floatingLotusPose,lanternPose,LANTERN_RISE} from '../src/ritualMotion';
import {templeSurfaceHeight} from '../src/templeFixtures';
import {bridgeHeight,POND,POND_BRIDGES,pondContains,islandContains} from '../src/pondLayout';

test('ritual platforms coexist with the new temple and koi bridge without lifting visitors through their sides',()=>{
  assert.equal(surfaceHeight(0,-24),templeSurfaceHeight(0,3)+.08);
  assert.equal(surfaceHeight(33,POND_BRIDGES[0].z),bridgeHeight(33));assert.equal(surfaceHeight(22.5,POND_BRIDGES[0].z),bridgeHeight(22.5));
  for(const [x,z,dx,dz] of [[15,-25,-.05,0],[8.3,-14,0,-.05],[22.4,POND_BRIDGES[0].z,.05,0]]){
    const body=.06+CHARACTER_OFFSET+.02;assert.equal(stepAssistHeight(x,z,dx,dz,body),body);
  }
  assert.ok(!floorSurfaces.some(s=>s.x===0&&s.z===-27),'No legacy flat temple slab');
});

test('five dining tables have twenty distinct floor cushions on the actual floor',()=>{
  assert.equal(diningTables.length,5);assert.deepEqual(diningTables[4],[34,.64,-25]);
  for(const t of diningTables)assert.equal(seats.filter(s=>s.table===t).length,4);
  for(const s of seats.filter(s=>s.kind==='dining'||s.kind==='tea')){
    assert.ok(Math.abs(s.position[1]-CUSHION.seatLift-surfaceHeight(s.position[0],s.position[2]))<.001,s.id);
  }
});

test('open pavilion sides allow crossing while visible back walls, columns and furniture remain solid',()=>{
  for(const [a,b] of [[[-44,-14],[-42,-14]],[[-44,-41],[-42,-41]],[[46.5,-24],[44,-24]],[[-11,-54],[-9,-54]]] as const)assert.ok(clearLine([...a],[...b]),`${a} to ${b}`);
  assert.ok(!clearLine([-33,-26],[-33,-24]));assert.ok(!walkable(-42.6,-17));assert.ok(!walkable(MAYA_LEVEL.bellX,-13));assert.ok(walkable(MAYA_LEVEL.bellX,-11));
});

test('real Rapier controller steps onto the bell platform instead of standing inside the wood',async()=>{
  await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});
  try{
    world.createCollider(RAPIER.ColliderDesc.cuboid(62,.03,66).setTranslation(0,.03,-2));
    for(const f of floorSurfaces)world.createCollider(RAPIER.ColliderDesc.cuboid(f.w/2,f.height/2,f.d/2).setTranslation(f.x,f.height/2,f.z));
    for(const o of obstacles.filter(o=>!o.navigationOnly)){const h=o.height??1.4;world.createCollider(RAPIER.ColliderDesc.cuboid(o.w/2,h/2,o.d/2).setTranslation(o.x,(o.base??0)+h/2,o.z));}
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(MAYA_LEVEL.bellX,.06+CHARACTER_OFFSET+.02,-9));
    const capsule=world.createCollider(RAPIER.ColliderDesc.capsule(CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS),body),controller=world.createCharacterController(.02);
    controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);
    for(let i=0;i<60;i++){let p=body.translation();const assisted=stepAssistHeight(p.x,p.z,0,-.035,p.y);if(assisted>p.y){body.setTranslation({x:p.x,y:assisted,z:p.z},true);p=body.translation();}controller.computeColliderMovement(capsule,{x:0,y:-.035,z:-.035});const d=controller.computedMovement();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step();}
    const p=body.translation();assert.ok(p.z<-10.6,`z=${p.z}`);assert.ok(p.y-CHARACTER_OFFSET>=.39,`feet=${p.y-CHARACTER_OFFSET}`);assert.ok(p.y-CHARACTER_OFFSET<.47);
    for(let i=0;i<100;i++){const p=body.translation();controller.computeColliderMovement(capsule,{x:0,y:-.035,z:-.035});const d=controller.computedMovement();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step();}
    assert.ok(body.translation().z>-12,'The character head must not pass through the hanging bell.');
  }finally{world.free()}
});

test('all twenty meal plans enter the kitchen, pick up cooked food, deliver and return without crossing furniture',()=>{
  for(const seat of seats.filter(s=>s.kind==='dining')){
    const plan=mealPlan(seat.id),times=serviceTimes(seat.id,1000);
    for(const route of [plan.toKitchen,plan.toTable,plan.toReception]){
      assert.ok(route.length>0);for(let i=1;i<route.points.length;i++)assert.ok(clearLine(route.points[i-1],route.points[i]),seat.id);
    }
    assert.equal(servicePhase(times,1000),'toKitchen');assert.equal(counterHasMeal(times,times.cookedAt),false);assert.equal(counterHasMeal(times,times.counterReadyAt-1),false);assert.equal(counterHasMeal(times,times.counterReadyAt),true);
    assert.equal(servicePhase(times,times.deliveryAt-1),'pickup');assert.equal(counterHasMeal(times,times.deliveryAt),false);
    assert.equal(servicePhase(times,times.deliveryAt),'delivering');assert.equal(servicePhase(times,times.readyAt-HANDOFF_MS),'handoff');
    assert.equal(servicePhase(times,times.readyAt),'returning');assert.equal(servicePhase(times,times.homeAt),'idle');
    const out={x:0,z:0,heading:0};assert.equal(sampleRoute(plan.toTable,1,out),out);assert.ok(distance([out.x,out.z],plan.toReception.points[0])<.001);
    const returned=sampleRoute(plan.toReception,1,out);assert.ok(distance([returned.x,returned.z],plan.toKitchen.points[0])<.001);
  }
});

test('Cô Tâm stops at the table end and every service route clears the occupied dining cushions',()=>{
  const diners=seats.filter(s=>s.kind==='dining');
  for(const seat of diners){
    const plan=mealPlan(seat.id),table=seat.table!;
    assert.ok(Math.abs(plan.destination[1]-table[2])>1.9);
    assert.ok(distance(plan.destination,[seat.position[0],seat.position[2]])>1.6);
    assert.ok(Math.cos(plan.heading)*(table[2]-plan.destination[1])>0,'Faces the tabletop');
    for(const route of [plan.toKitchen,plan.toTable,plan.toReception])for(let i=0;i<route.points.length-1;i++){
      const a=route.points[i],b=route.points[i+1],steps=Math.ceil(distance(a,b)/.05);
      for(let j=0;j<=steps;j++)for(const diner of diners)assert.ok(Math.hypot(a[0]+(b[0]-a[0])*j/steps-diner.position[0],a[1]+(b[1]-a[1])*j/steps-diner.position[2])>.85,`${seat.id} crosses ${diner.id}`);
    }
    assert.ok(Math.abs(plan.plate[0]-table[0])+.62*MEAL_SCALE<1.25);
    assert.ok(Math.abs(plan.plate[2]-table[2])+.5*MEAL_SCALE<1.4);
    assert.ok(Math.abs(plan.plate[1]-PLATE_LIFT-table[1])<1e-9,'Tray underside contacts the tabletop');
  }
});

test('one meal moves continuously from counter to hands to table, then stays still while empty hands withdraw',()=>{
  for(const seat of seats.filter(s=>s.kind==='dining')){
    const plan=mealPlan(seat.id),order={seatId:seat.id,status:'preparing',...serviceTimes(seat.id,1000)},out=createMealPresentation();
    const sample=(now:number)=>{
      const route=now<order.deliveryAt?plan.toKitchen:now<order.readyAt?plan.toTable:plan.toReception;
      const progress=now<order.deliveryAt?1:now<order.readyAt?(now-order.deliveryAt)/(order.readyAt-HANDOFF_MS-order.deliveryAt):(now-order.readyAt)/(order.homeAt-order.readyAt);
      const pose=sampleRoute(route,progress,{x:0,z:0,heading:0});
      const heading=now<order.deliveryAt?-Math.PI/2:now>=order.readyAt-HANDOFF_MS&&now<order.readyAt?plan.heading:pose.heading;
      return sampleMealPresentation(order,now,{...pose,y:.16,heading},out);
    };
    assert.ok(!sample(order.cookedAt-1).visible);assert.ok(sample(order.cookedAt).visible);
    // Hold orientation constant across phase boundaries, just as the damped NPC transform does.
    const npc={x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading};
    for(const boundary of [order.deliveryAt,order.readyAt-HANDOFF_MS,order.readyAt-WITHDRAW_MS,order.readyAt]){
      const a=[...sampleMealPresentation(order,boundary-.01,npc,out).position];
      const b=sampleMealPresentation(order,boundary+.01,npc,out).position;
      assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<.001,`${seat.id} jumps at ${boundary}`);
    }
    const arrival=order.readyAt-HANDOFF_MS,waiting=[...sample(arrival).position];
    assert.deepEqual(sample(arrival+TURN_MS).position,waiting,'Waits to turn before lowering the plate');
    for(let now=arrival;now<=order.readyAt;now+=10){const frame=sample(now);assert.ok(frame.position[1]-PLATE_LIFT>=seat.table![1]-.00001,'Never sinks through the tabletop');}
    assert.deepEqual(sample(order.readyAt-WITHDRAW_MS).position,plan.plate);
    assert.ok(sample(order.readyAt-1).hands.release>.99);
    assert.deepEqual(sample(order.readyAt+600).position,plan.plate,'Walking away cannot drag the plate');
    order.status='ready';assert.deepEqual(sample(order.readyAt+1000).position,plan.plate,'Ready status does not replace the plate position');
    order.status='finished';assert.ok(!sample(order.homeAt).visible);
  }
});

test('lotuses remain on the water while silk lanterns rise, with allocation-free sampling available',()=>{
  const out={position:[0,0,0] as [number,number,number],rotation:0,scale:1},position=out.position;
  assert.equal(lanternPose(LANTERN_RISE,123,false,out),out);assert.equal(out.position,position);assert.ok(out.position[1]>7);
  const point:[number,number,number]=[0,0,0];
  for(let i=0;i<6;i++)for(let seconds=0;seconds<300;seconds+=5){
    assert.equal(floatingLotusPose(seconds,i,point),point);
    assert.ok(point[1]>POND.waterY&&point[1]<POND.bankY);
    assert.ok(pondContains(point[0],point[2])&&!islandContains(point[0],point[2]));
  }
});
