import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {AnimationMixer,Group,Vector3,SkinnedMesh} from 'three';
import {npcs,KITCHEN_PICKUP} from '../src/gameData';import {npcAppearance,NPC_CHIBI_SCALE,npcServiceLead} from '../src/npcAppearance';import {createChibiPose} from '../src/chibiPose';import {serviceTimes,chefSchedule,createMealPresentation,sampleKitchenMeal,sampleMealPresentation,mealPlan,HANDOFF_MS,PICKUP_MS,PICKUP_HEADING,servicePhase,sampleRoute,MEAL_SCALE,PLATE_LIFT} from '../src/mealService';
test('every NPC uses the player chibi appearance while retaining its original robe and role',()=>{
 for(const npc of npcs){const look=npcAppearance(npc);assert.equal(look.npc,true);assert.equal(look.gender,npc.gender);assert.equal(look.robe,npc.robe);assert.equal(look.apron,npc.id==='chef');}
 for(const id of ['cook','chef'])assert.equal(npcAppearance(npcs.find(n=>n.id===id)!).gender,'female');
});
test('female NPC appearance follows character data independently of kitchen role',()=>{
 const look=npcAppearance({id:'female-visitor',robe:'#859786',gender:'female'});
 assert.equal(look.gender,'female');assert.equal(look.npc,true);assert.equal(look.apron,false);
 assert.equal(npcAppearance({id:'chef',robe:'#bdab87',gender:'male'}).gender,'male');
});

test('chibi kitchen hands follow the held tray and knees keep both ankles anchored while lowering',async()=>{
 const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=new Group(),visual=new Group();root.scale.setScalar(NPC_CHIBI_SCALE);visual.position.set(0,-.025,0);root.add(visual);visual.add(scene);scene.scale.set(1.08,1,1.1);
 const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();const rig=createChibiPose(scene),out=createMealPresentation(),ankles=[new Vector3(),new Vector3()];let held=0;
 const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',10000)},plan=mealPlan(order.seatId),schedule=chefSchedule(order.cookedAt);
 const check=(time:number,chef:boolean)=>{
  const npc=servicePhase(order,time)==='pickup'?{x:KITCHEN_PICKUP[0],y:.16,z:KITCHEN_PICKUP[1],heading:PICKUP_HEADING}:{x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading};
  const sample=chef?sampleKitchenMeal(order,time,out):sampleMealPresentation(order,time,npc,out),lead=npcServiceLead(sample.hands),h={...sample.hands,handZ:sample.hands.handZ-lead}; visual.position.z=lead/NPC_CHIBI_SCALE;
  for(let i=0;i<20;i++){rig.restore();mixer.update(1/60);for(const [index,side]of ['L','R'].entries())scene.getObjectByName('Co_Chan_'+side)!.getWorldPosition(ankles[index]);rig.update('serve',false,false,1/60,undefined,undefined,0,false,false,h);}
  root.updateMatrixWorld(true);for(const [index,side]of ['L','R'].entries()){
   const foot=scene.getObjectByName('Co_Chan_'+side)!.getWorldPosition(new Vector3());assert.ok(foot.distanceTo(ankles[index])<.012,`ankle moved at ${time}`);
   if(sample.hands.release<.05){const hand=scene.getObjectByName('Co_Tay_'+side)!.getWorldPosition(new Vector3()),target=new Vector3(sample.hands.handX+(side==='L'?.18:-.18),sample.hands.handY,sample.hands.handZ);assert.ok(hand.distanceTo(target)<.02,`hand separated at ${time}: ${hand.distanceTo(target)}`);held++;}
  }
 };
 for(let t=order.cookedAt+500;t<schedule.counterReadyAt;t+=200)check(t,true);
 for(let t=order.deliveryAt-PICKUP_MS;t<order.deliveryAt;t+=50)check(t,false);
 for(let t=order.readyAt-HANDOFF_MS;t<order.readyAt;t+=100)check(t,false);
 assert.ok(held>50);
});

test('serving tray and every dish stay outside the skinned body and head throughout pickup and placement',async()=>{
const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const root=new Group(),visual=new Group();root.scale.setScalar(NPC_CHIBI_SCALE);root.add(visual);visual.add(scene);scene.scale.set(1.08,1,1.1);visual.position.y=-.025;scene.getObjectByName('Dau')!.scale.set(1,.91,1.13);const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();const rig=createChibiPose(scene),out=createMealPresentation(),v=new Vector3(),parts:{mesh:SkinnedMesh;indices:number[]}[]=[];
// Test the actual deformed GLB, including its enlarged head. Hands may touch the tray; torso and face may not.
scene.traverse(o=>{if(!(o instanceof SkinnedMesh))return;const indices:number[]=[],skin=o.geometry.getAttribute('skinIndex'),weights=o.geometry.getAttribute('skinWeight');for(let i=0;i<skin.count;i++){let best=0;for(let j=1;j<4;j++)if(weights.getComponent(i,j)>weights.getComponent(i,best))best=j;const name=o.skeleton.bones[skin.getComponent(i,best)].name;if(!/Vai|Khuyu|Co_Tay|Ngon/.test(name))indices.push(i);}parts.push({mesh:o,indices});});
const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',10000)},plan=mealPlan(order.seatId),schedule=chefSchedule(order.cookedAt);let total=0;
for(const chef of [true,false])for(let t=chef?order.cookedAt+200:order.deliveryAt-500;t<(chef?schedule.counterReadyAt:order.readyAt-500);t+=25){
 let npc={x:KITCHEN_PICKUP[0],y:.16,z:KITCHEN_PICKUP[1],heading:PICKUP_HEADING};
 if(!chef){const phase=servicePhase(order,t);if(phase==='delivering')sampleRoute(plan.toTable,(t-order.deliveryAt)/(order.readyAt-HANDOFF_MS-order.deliveryAt),npc);else if(phase==='handoff')Object.assign(npc,{x:plan.destination[0],z:plan.destination[1],heading:plan.heading});}
 const sample=chef?sampleKitchenMeal(order,t,out):sampleMealPresentation(order,t,npc,out);if(chef)npc=sample.kitchen;const lead=npcServiceLead(sample.hands),h={...sample.hands,handZ:sample.hands.handZ-lead};visual.position.z=lead/NPC_CHIBI_SCALE;
 for(let i=0;i<20;i++){rig.restore();mixer.update(1/60);rig.update('serve',false,false,1/60,undefined,undefined,0,false,false,h);}root.updateMatrixWorld(true);for(const p of parts)p.mesh.skeleton.update();
 const dx=sample.position[0]-npc.x,dz=sample.position[2]-npc.z,sin=Math.sin(npc.heading),cos=Math.cos(npc.heading),cx=dx*cos-dz*sin,cz=dx*sin+dz*cos,cy=sample.position[1]-npc.y,a=sample.heading-npc.heading,c=Math.cos(a),s=Math.sin(a);let hits=0;
 for(const {mesh,indices}of parts)for(const i of indices){mesh.getVertexPosition(i,v);mesh.localToWorld(v);const x=(v.x-cx)*c-(v.z-cz)*s,z=(v.x-cx)*s+(v.z-cz)*c;if(x>-.54*MEAL_SCALE&&x<.62*MEAL_SCALE&&Math.abs(z)<.5*MEAL_SCALE&&v.y>cy-PLATE_LIFT-.002&&v.y<cy+.3*MEAL_SCALE)hits++;}
 total++;assert.equal(hits,0,`${chef?"chef":"receptionist"} tray intersects body/head at ${t}`);
}assert.ok(total>550,'Sampled the server and chef through every supported tray handoff frame');

});

test('two-handed equipment holds both palms near the item while retaining the walking leg animation',async()=>{
 const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb'),{scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(clip=>clip.name==='Walk')!).play();const rig=createChibiPose(scene),left=new Vector3(),right=new Vector3();
 let moved=0,lastLeg=scene.getObjectByName('Dui_L')!.quaternion.clone();
 for(let i=0;i<100;i++){
  rig.restore();mixer.update(1/60);const expectedLeg=scene.getObjectByName('Dui_L')!.quaternion.clone();
  rig.update('walk',false,false,1/60,undefined,undefined,0,true,false,undefined,true);
  assert.ok(scene.getObjectByName('Dui_L')!.quaternion.toArray().every((value,index)=>Math.abs(value-expectedLeg.toArray()[index])<1e-8),'holding never overwrites the gait');
  moved+=lastLeg.angleTo(expectedLeg);lastLeg=expectedLeg;
 }
 scene.updateMatrixWorld(true);scene.getObjectByName('Co_Tay_L')!.getWorldPosition(left);scene.getObjectByName('Co_Tay_R')!.getWorldPosition(right);scene.worldToLocal(left);scene.worldToLocal(right);
 assert.ok(left.distanceTo(new Vector3(.085,.65,.24))<.018,`left palm ${left.toArray()}`);assert.ok(right.distanceTo(new Vector3(-.085,.65,.24))<.018,`right palm ${right.toArray()}`);assert.ok(moved>.1);
});
