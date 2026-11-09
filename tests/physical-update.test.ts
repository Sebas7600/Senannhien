import {CUSHION} from '../src/cushionData';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import {CHARACTER_OFFSET,CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS,diningTables,seats,floorSurfaces,obstacles,surfaceHeight,stepAssistHeight,walkable,distance} from '../src/gameData';
import {clearLine} from '../src/navigation';
import {mealPlan,serviceTimes,servicePhase,counterHasMeal,sampleRoute,HANDOFF_MS,TURN_MS,WITHDRAW_MS,MEAL_SCALE,PLATE_LIFT,createMealPresentation,sampleMealPresentation} from '../src/mealService';
import {floatingLotusPose,lanternPose,LANTERN_RISE} from '../src/ritualMotion';
import {templeSurfaceHeight} from '../src/templeFixtures';
import {bridgeHeight,POND,pondContains,islandContains} from '../src/pondLayout';

test('ritual platforms coexist with the new temple and koi bridge without lifting visitors through their sides',()=>{
  assert.equal(surfaceHeight(0,-24),templeSurfaceHeight(0,3)+.08);
  assert.equal(surfaceHeight(33,9),bridgeHeight(33));assert.equal(surfaceHeight(22.5,9),bridgeHeight(22.5));
  for(const [x,z,dx,dz] of [[15,-25,-.05,0],[8.3,-14,0,-.05],[22.4,9,.05,0]]){
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
  assert.ok(!clearLine([-33,-26],[-33,-24]));assert.ok(!walkable(-42.6,-17));assert.ok(!walkable(-19,-13));assert.ok(walkable(-19,-11));
});

test('real Rapier controller steps onto the bell platform instead of standing inside the wood',async()=>{
  await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});
  try{
    world.createCollider(RAPIER.ColliderDesc.cuboid(62,.03,66).setTranslation(0,.03,-2));
    for(const f of floorSurfaces)world.createCollider(RAPIER.ColliderDesc.cuboid(f.w/2,f.height/2,f.d/2).setTranslation(f.x,f.height/2,f.z));
    for(const o of obstacles.filter(o=>!o.navigationOnly)){const h=o.height??1.4;world.createCollider(RAPIER.ColliderDesc.cuboid(o.w/2,h/2,o.d/2).setTranslation(o.x,(o.base??0)+h/2,o.z));}
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-19,.06+CHARACTER_OFFSET+.02,-9));
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

test('supplementary solid decorations have matching navigation and real Rapier hitboxes',async()=>{
 const {courtyardSolids}=await import('../src/courtyardCollisionData');
 assert.equal(new Set(courtyardSolids.map(s=>s.id)).size,courtyardSolids.length);
 await RAPIER.init();const world=new RAPIER.World({x:0,y:0,z:0});
 try{
  for(const s of courtyardSolids){
   assert.ok(obstacles.some(o=>o.navigationOnly&&o.x===s.x&&o.z===s.z&&o.w===s.w&&o.d===s.d),s.id);
   const description=s.round?RAPIER.ColliderDesc.cylinder(s.height/2,s.w/2):RAPIER.ColliderDesc.cuboid(s.w/2,s.height/2,s.d/2);
   const collider=world.createCollider(description.setTranslation(s.x,(s.base??0)+s.height/2,s.z));world.step();
   const ray=new RAPIER.Ray({x:s.x-s.w/2-1,y:(s.base??0)+s.height/2,z:s.z},{x:1,y:0,z:0});
   const hit=world.castRay(ray,s.w+2,true);assert.ok(hit,s.id);assert.ok(hit.timeOfImpact<1.01,s.id);world.removeCollider(collider,false);
  }
 }finally{world.free()}
});

test('middle stair rails and decorative altar vases block movement at their actual height',async()=>{
 const {templeColliders}=await import('../src/templeCollisionData');
 const {middleStairRails,templeVaseSolids}=await import('../src/templeDetailCollision');
 await RAPIER.init();const world=new RAPIER.World({x:0,y:0,z:0});
 try{
  const shapes=[...middleStairRails.map(r=>({kind:'box',position:[r.x,r.y,r.z],args:[r.halfWidth,r.halfHeight,r.halfDepth]})),...templeVaseSolids.map(v=>({kind:'cylinder',position:[v.x,v.y,v.z],args:[v.height/2,v.radius]}))];
  for(const shape of shapes){
   assert.ok(templeColliders.some(c=>c.kind===shape.kind&&c.position.every((v,i)=>Math.abs(v-shape.position[i])<.0001)),'detail collider survives filtering');
   const [x,y,z]=shape.position,desc=shape.kind==='box'?RAPIER.ColliderDesc.cuboid(shape.args[0],shape.args[1],shape.args[2]):RAPIER.ColliderDesc.cylinder(shape.args[0],shape.args[1]);
   const col=world.createCollider(desc.setTranslation(x,y,z));world.step();
   assert.ok(world.castRay(new RAPIER.Ray({x:x-1,y,z},{x:1,y:0,z:0}),2,true));world.removeCollider(col,false);
  }
  assert.equal(middleStairRails.length,48);assert.equal(templeVaseSolids.filter(v=>v.id.startsWith('decorative-front')).length,2);
 }finally{world.free()}
});

test('fish food stays outside the bridge and is thrown only from its same-side edge',async()=>{
 const {feedStations,canFeedFrom}=await import('../src/pondLayout');
 for(const s of feedStations){assert.ok(Math.abs(s.target[1]-9)>2.2);assert.ok(canFeedFrom(s.spot,s));if(s.id.startsWith('bridge-')){assert.equal(canFeedFrom([s.spot[0],9],s),false);assert.equal(canFeedFrom([s.spot[0],18-s.spot[1]],s),false);}}
});

test('three main statues align their supporting base with each altar centre',async()=>{
 const fs=await import('node:fs');const {GLTFLoader,MeshoptDecoder}=await import('three-stdlib');const {Vector3}=await import('three');
 const {centerStatueOnBase,statueFootprint}=await import('../src/statuePlacement');
 for(const name of ['seated-quan-am.glb','seated-quan-am-low.glb','center-buddha.glb','center-ksitigarbha.glb']){
  const bytes=fs.readFileSync('public/assets/main-temple/'+name),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);
  const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const height=name.includes('quan-am')?2.76:name==='center-buddha.glb'?4.5:3.75;centerStatueOnBase(scene,height);const {bounds,base}=statueFootprint(scene),center=base.getCenter(new Vector3());
  assert.ok(Math.abs(center.x)<.0001&&Math.abs(center.z)<.0001,name);assert.ok(Math.abs(bounds.min.y)<.0001,name);assert.ok(Math.abs(bounds.max.y-height)<.0001,name);
 }
});

test('statue mounting height clears the golden dais surface, rather than its lower stone foot',async()=>{
 const fs=await import('node:fs');const {GLTFLoader,MeshoptDecoder}=await import('three-stdlib');const {Mesh,Texture,Vector3}=await import('three');
 const {templeParts}=await import('../src/templeGeometry');const {templeFixtures}=await import('../src/templeFixtures');
 const bytes=fs.readFileSync('public/assets/main-temple/tam-the-complete-interior.glb'),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);loader.register(()=>({name:'offline',loadTexture:async()=>new Texture()}));
 const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let found=0;
 scene.traverse(n=>{if(!(n instanceof Mesh)||(n.material as any).name!=='gold')return;for(const part of templeParts(n.geometry)){const centre=part.box.getCenter(new Vector3()).multiplyScalar(.5),size=part.box.getSize(new Vector3()).multiplyScalar(.5);if(Math.abs(centre.z-templeFixtures.statueDais.z)<.01&&size.x>2.5&&size.x<3.1){found++;assert.ok(templeFixtures.statueDais.mount>part.box.max.y*.5);assert.ok(templeFixtures.statueDais.mount-part.box.max.y*.5<.015);}}});assert.equal(found,3);
});

test('legacy rear aureoles can be removed without deleting the gold wall niches',async()=>{
 const fs=await import('node:fs');const {GLTFLoader,MeshoptDecoder}=await import('three-stdlib');const {Mesh,Texture,Vector3}=await import('three');
 const {templeParts}=await import('../src/templeGeometry');const {removeLegacyStatueHalos}=await import('../src/templeLayout');
 const bytes=fs.readFileSync('public/assets/main-temple/tam-the-complete-interior.glb'),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);loader.register(()=>({name:'offline',loadTexture:async()=>new Texture()}));
 const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const count=()=>{let aureoles=0,niches=0;scene.traverse(n=>{if(!(n instanceof Mesh)||!/^gold(?:_light)?$/.test((n.material as any).name))return;for(const p of templeParts(n.geometry)){const c=p.box.getCenter(new Vector3()).multiplyScalar(.5);if(c.z> -6.62&&c.z< -6.35&&c.y>2.55&&[-4.7,0,4.7].some(x=>Math.abs(c.x-x)<2.1))aureoles++;if(c.z< -7&&c.y>3)niches++;}});return {aureoles,niches}};
 const before=count();assert.ok(before.aureoles>3);assert.ok(before.niches>0);removeLegacyStatueHalos(scene,templeParts);const after=count();assert.equal(after.aureoles,0);assert.equal(after.niches,before.niches);
});


test('camera sphere moves inside tight wall limits and restores distance after turning away',async()=>{
 const {cameraSafeDistance}=await import('../src/cameraCollision');await RAPIER.init();const world=new RAPIER.World({x:0,y:0,z:0});
 try{
  const wallBody=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());wallBody.userData={cameraWall:true};
  world.createCollider(RAPIER.ColliderDesc.cuboid(.1,1,1).setTranslation(.35,1,0)); // Unmarked lamp/gate props must be ignored.
  const wall=world.createCollider(RAPIER.ColliderDesc.cuboid(.1,2,5).setTranslation(.8,1,0),wallBody);
  const player=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1,0));world.createCollider(RAPIER.ColliderDesc.ball(.4),player);world.step();
  const ball=new RAPIER.Ball(.23),origin={x:0,y:1,z:0};const close=cameraSafeDistance(world,origin,{x:1,y:0,z:0},10,ball);
  assert.ok(close>.35&&close<.5,'camera can move closer than the old 2.2m minimum without clipping');assert.equal(cameraSafeDistance(world,origin,{x:-1,y:0,z:0},10,ball),10);
  world.removeCollider(wall,false);world.createCollider(RAPIER.ColliderDesc.cuboid(.1,2,5).setTranslation(2,1,0),wallBody);world.createCollider(RAPIER.ColliderDesc.cuboid(5,2,.1).setTranslation(0,1,2),wallBody);world.step();
  const corner=cameraSafeDistance(world,origin,{x:Math.SQRT1_2,y:0,z:Math.SQRT1_2},10,ball);assert.ok(corner>2&&corner<2.5);
 }finally{world.free()}
});

test('compressed camera waits in world space until the default distance is restored',async()=>{
 const {Vector3}=await import('three');const {followAfterObstruction,DEFAULT_FOLLOW_DISTANCE}=await import('../src/cameraFollow');
 const camera=new Vector3(0,1,0),previous=new Vector3(0,1,1),target=new Vector3(0,1,2);
 followAfterObstruction(camera,previous,target,DEFAULT_FOLLOW_DISTANCE);assert.deepEqual(camera.toArray(),[0,1,0]);
 previous.copy(target);followAfterObstruction(camera,previous,target,DEFAULT_FOLLOW_DISTANCE);assert.deepEqual(camera.toArray(),[0,1,0],'stopping does not automatically push camera back');
 target.z=6;followAfterObstruction(camera,previous,target,DEFAULT_FOLLOW_DISTANCE);assert.equal(camera.z,0);
 previous.copy(target);target.z=7;followAfterObstruction(camera,previous,target,DEFAULT_FOLLOW_DISTANCE);assert.ok(Math.abs(camera.z-.5)<.00001);assert.equal(camera.distanceTo(target),DEFAULT_FOLLOW_DISTANCE);
 previous.copy(target);target.z=8;followAfterObstruction(camera,previous,target,DEFAULT_FOLLOW_DISTANCE);assert.ok(Math.abs(camera.z-1.5)<.00001);
});

test('compressed camera slides laterally without yaw oscillation and restores only the radial gap',async()=>{
 const {Vector3}=await import('three');const {followAfterObstruction}=await import('../src/cameraFollow');
 const camera=new Vector3(0,2,0),previous=new Vector3(0,1,2),target=previous.clone();
 const yaw=()=>Math.atan2(camera.x-target.x,camera.z-target.z),initialYaw=yaw();
 for(let i=0;i<100;i++){previous.copy(target);target.x+=i<50?.08:-.08;followAfterObstruction(camera,previous,target,6.5);assert.ok(Math.abs(yaw()-initialYaw)<.00001);assert.ok(Math.abs(camera.distanceTo(target)-Math.sqrt(5))<.00001);}
 previous.copy(target);target.x+=.2;target.z+=.2;const before=camera.distanceTo(previous);followAfterObstruction(camera,previous,target,6.5);assert.ok(camera.distanceTo(target)>before);assert.ok(Math.abs(yaw()-initialYaw)<.00001);
});
