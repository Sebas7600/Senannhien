import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {AnimationMixer,Group,Vector3} from 'three';
import {npcs} from '../src/gameData';import {npcAppearance,NPC_CHIBI_SCALE,NPC_SERVICE_LEAD} from '../src/npcAppearance';import {createChibiPose} from '../src/chibiPose';import {serviceTimes,chefSchedule,createMealPresentation,sampleKitchenMeal,sampleMealPresentation,mealPlan,HANDOFF_MS} from '../src/mealService';
test('every NPC uses the player chibi appearance while retaining its original robe and role',()=>{
 for(const npc of npcs){const look=npcAppearance(npc);assert.equal(look.npc,true);assert.equal(look.robe,npc.robe);assert.equal(look.apron,npc.id==='chef');}
 assert.equal(npcAppearance(npcs.find(n=>n.id==='cook')!).gender,'female');
});
test('chibi kitchen hands follow the held tray and knees keep both ankles anchored while lowering',async()=>{
 const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=new Group(),visual=new Group();root.scale.setScalar(NPC_CHIBI_SCALE);visual.position.set(0,-.025,NPC_SERVICE_LEAD/NPC_CHIBI_SCALE);root.add(visual);visual.add(scene);scene.scale.set(1.08,1,1.1);
 const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();const rig=createChibiPose(scene),out=createMealPresentation(),ankles=[new Vector3(),new Vector3()];let held=0;
 const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',10000)},plan=mealPlan(order.seatId),schedule=chefSchedule(order.cookedAt);
 const check=(time:number,chef:boolean)=>{
  const sample=chef?sampleKitchenMeal(order,time,out):sampleMealPresentation(order,time,{x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading},out),h={...sample.hands,handZ:sample.hands.handZ-NPC_SERVICE_LEAD};
  for(let i=0;i<20;i++){rig.restore();mixer.update(1/60);for(const [index,side]of ['L','R'].entries())scene.getObjectByName('Co_Chan_'+side)!.getWorldPosition(ankles[index]);rig.update('serve',false,false,1/60,undefined,undefined,0,false,false,h);}
  root.updateMatrixWorld(true);for(const [index,side]of ['L','R'].entries()){
   const foot=scene.getObjectByName('Co_Chan_'+side)!.getWorldPosition(new Vector3());assert.ok(foot.distanceTo(ankles[index])<.012,`ankle moved at ${time}`);
   if(sample.hands.release<.05){const hand=scene.getObjectByName('Co_Tay_'+side)!.getWorldPosition(new Vector3()),target=new Vector3(sample.hands.handX+(side==='L'?.18:-.18),sample.hands.handY,sample.hands.handZ);assert.ok(hand.distanceTo(target)<.02,`hand separated at ${time}: ${hand.distanceTo(target)}`);held++;}
  }
 };
 for(let t=order.cookedAt+500;t<schedule.counterReadyAt;t+=200)check(t,true);
 for(let t=order.readyAt-HANDOFF_MS;t<order.readyAt;t+=100)check(t,false);
 assert.ok(held>50);
});
