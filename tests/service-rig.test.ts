import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {skirtCloth,torsoCloth} from '../src/clothGeometry';
import {createServiceGarment,updateServiceGarment,serviceBodyForward,serviceKnee} from '../src/serviceRig';
import {serviceTimes,chefSchedule,chefPhase,servicePhase,createMealPresentation,sampleKitchenMeal,sampleMealPresentation,mealPlan,HANDOFF_MS} from '../src/mealService';

function poses(){
  const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',1000)},schedule=chefSchedule(order.cookedAt),out=createMealPresentation(),frames:{hips:number;forward:number;bend:number}[]=[];
  const add=()=>frames.push({hips:out.hands.hips,bend:out.hands.bend,forward:serviceBodyForward(out.hands.bend)});
  for(let now=order.cookedAt;now<schedule.withdrawnAt;now+=20){sampleKitchenMeal(order,now,out);add();}
  const plan=mealPlan(order.seatId),npc={x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading};
  for(let now=order.readyAt-HANDOFF_MS;now<order.readyAt;now+=20){sampleMealPresentation(order,now,npc,out);add();}
  return frames;
}

test('both NPC robes stay joined to the actual torso ring throughout lowering and withdrawing',()=>{
  const g=createServiceGarment(),torso=torsoCloth.getAttribute('position'),base=skirtCloth.getAttribute('position'),v=new THREE.Vector3(),actual=new THREE.Vector3();let ring=1;while(torso.getY(ring)===torso.getY(0))ring++;
  const original=new Float32Array(base.array as Float32Array);
  try{for(const frame of poses())for(const width of [.95,1]){
    updateServiceGarment(g,frame.hips,frame.forward,frame.bend,width);
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(0,frame.hips,frame.forward),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),frame.bend),new THREE.Vector3(width,1,1)),p=g.geometry.getAttribute('position');
    for(let j=0;j<ring;j++){
      v.fromBufferAttribute(torso,j).applyMatrix4(matrix);actual.fromBufferAttribute(p,p.count-ring+j);assert.ok(v.distanceTo(actual)<2e-6,'No open waist seam');
      actual.fromBufferAttribute(p,j);v.fromBufferAttribute(base,j);assert.deepEqual(actual.toArray(),v.toArray(),'Hem stays anchored above the feet');
    }
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);assert.ok(g.geometry.boundingBox!.containsPoint(v));assert.ok(g.geometry.boundingSphere!.containsPoint(v));}
    for(const n of g.geometry.getAttribute('normal').array)assert.ok(Number.isFinite(n));
  }assert.deepEqual(base.array,original,'Other avatars keep the shared robe unchanged');}finally{g.geometry.dispose();}
});

test('service knees bend with fixed limb lengths and planted ankle anchors',()=>{
  const knee={y:0,z:0};
  for(const frame of poses()){
    assert.equal(serviceKnee(frame.hips,frame.forward,knee),knee);
    assert.ok(Math.abs(Math.hypot(frame.hips-knee.y,frame.forward-knee.z)-.395)<1e-8);
    assert.ok(Math.abs(Math.hypot(knee.y-.065,knee.z)-.385)<1e-8);
    assert.ok(knee.y>.065&&knee.y<frame.hips);
  }
});

test('knees remain reachable during smoothed pose changes at 15, 30 and 60 FPS',()=>{
  const order={seatId:'dining-14',status:'preparing',...serviceTimes('dining-14',1000)},schedule=chefSchedule(order.cookedAt),out=createMealPresentation(),plan=mealPlan(order.seatId),knee={y:0,z:0};
  for(const fps of [15,30,60])for(const role of ['chef','server']){
    let hips=.84,bend=0,forward=0;const dt=1/fps;
    for(let now=order.orderedAt;now<order.homeAt+1000;now+=1000/fps){
      let serving=false,cooking=false;
      if(role==='chef'){sampleKitchenMeal(order,now,out);const phase=chefPhase(order,now);serving=out.kitchen.carrying;cooking=phase==='cooking';}
      else{const phase=servicePhase(order,now);serving=phase==='pickup'||phase==='delivering'||phase==='handoff';sampleMealPresentation(order,now,{x:plan.destination[0],y:.16,z:plan.destination[1],heading:plan.heading},out);}
      bend=THREE.MathUtils.damp(bend,serving?out.hands.bend:cooking?.1:0,serving?18:10,dt);
      hips=THREE.MathUtils.damp(hips,serving?out.hands.hips:.84,serving?18:12,dt);
      forward=THREE.MathUtils.damp(forward,serving?serviceBodyForward(bend):0,18,dt);
      serviceKnee(hips,forward,knee);
      assert.ok(Math.abs(Math.hypot(hips-knee.y,forward-knee.z)-.395)<1e-8,`${role} thigh stretches at ${fps} FPS`);
      assert.ok(Math.abs(Math.hypot(knee.y-.065,knee.z)-.385)<1e-8,`${role} shin stretches at ${fps} FPS`);
    }
  }
});

test('stationary service garments reuse geometry without recomputing unchanged frames',()=>{
  const g=createServiceGarment();try{assert.equal(updateServiceGarment(g,.84,0,0,.95),true);const version=g.geometry.getAttribute('position').version;assert.equal(updateServiceGarment(g,.84,0,0,.95),false);assert.equal(g.geometry.getAttribute('position').version,version);}finally{g.geometry.dispose();}
});
