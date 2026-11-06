import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {LOTUS_POND as p,lotusBridgeSegments,lotusBridgeHeight,lotusWaterBlocked} from '../src/lotusLayout';
import {outerGroundGeometry,courtyardGroundGeometry,lotusDeckGeometry} from '../src/lotusGeometry';
import {CHARACTER_OFFSET,CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS,surfaceHeight,walkable,stepAssistHeight} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';
import {floatingLotusPose,lanternPose,LANTERN_RISE} from '../src/ritualMotion';

test('lowered lotus water is visible through both ground layers; the other pond and banks retain ground',()=>{
  assert.ok(Math.abs((.085-p.waterY)-1.7/3)<.02);
  for(const geometry of [outerGroundGeometry,courtyardGroundGeometry]){
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld();
    for(const [x,z] of [[28,39],[23,34],[32,43]])assert.equal(new THREE.Raycaster(new THREE.Vector3(x,4,z),new THREE.Vector3(0,-1,0)).intersectObject(mesh).length,0);
    for(const [x,z] of [[14,39],[42,39],[28,29],[33,9]])assert.ok(new THREE.Raycaster(new THREE.Vector3(x,4,z),new THREE.Vector3(0,-1,0)).intersectObject(mesh).length>0);
  }
  const point:[number,number,number]=[0,0,0];
  for(let i=0;i<6;i++)for(let t=0;t<180;t+=.5){floatingLotusPose(t,i,point);assert.ok(point[1]>p.waterY+.045&&point[1]<p.waterY+.085);}
  assert.equal(lanternPose(0,42).position[1],p.waterY+.265);assert.ok(lanternPose(LANTERN_RISE,42).position[1]>7);
});

test('the modest arch has no end steps and its actual mesh matches the shared walking height',()=>{
  const mesh=new THREE.Mesh(lotusDeckGeometry,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld();
  assert.equal(lotusBridgeHeight(14.5),.06);assert.equal(lotusBridgeHeight(41.5),.06);assert.ok(lotusBridgeHeight(28)<.85);
  for(const s of lotusBridgeSegments){
    const hits=new THREE.Raycaster(new THREE.Vector3(s.x,4,39),new THREE.Vector3(0,-1,0)).intersectObject(mesh);
    assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-lotusBridgeHeight(s.x))<1e-6);assert.equal(surfaceHeight(s.x,39),lotusBridgeHeight(s.x));assert.ok(Math.abs(s.angle)<.12);
  }
  for(const [a,b] of [[[13,39],[43,39]],[[13,39],[13,37]]] as const){const path=findPath([...a],[...b]);assert.ok(path.length);let from:[number,number]=[...a];for(const to of path){assert.ok(clearLine(from,to));from=to;}}
  for(const [x,z] of [[28,34],[20,39+2],[28,46]]){assert.ok(lotusWaterBlocked(x,z));assert.ok(!walkable(x,z));}
  assert.ok(!lotusWaterBlocked(28,39));assert.ok(walkable(28,39));
});

test('real Rapier capsule crosses both directions on the curved deck with grounded feet',async()=>{
  await RAPIER.init();
  for(const direction of [1,-1]){
    const world=new RAPIER.World({x:0,y:-9.81,z:0});
    try{
      world.createCollider(RAPIER.ColliderDesc.cuboid(62,.3,66).setTranslation(0,-.24,-2));
      for(const s of lotusBridgeSegments)world.createCollider(RAPIER.ColliderDesc.cuboid((s.length+.008)/2,.07,1.5).setTranslation(s.deckX,s.deckY,39).setRotation({x:0,y:0,z:Math.sin(s.angle/2),w:Math.cos(s.angle/2)}));
      const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(direction>0?13:43,.06+CHARACTER_OFFSET+.02,39));
      const capsule=world.createCollider(RAPIER.ColliderDesc.capsule(CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS),body),controller=world.createCharacterController(.02);
      controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);
      for(let i=0;i<720;i++){
        let pos=body.translation();const assisted=stepAssistHeight(pos.x,pos.z,direction*.045,0,pos.y);
        if(assisted>pos.y){body.setTranslation({x:pos.x,y:assisted,z:pos.z},true);pos=body.translation();}
        controller.computeColliderMovement(capsule,{x:direction*.045,y:-.035,z:0});const d=controller.computedMovement();body.setNextKinematicTranslation({x:pos.x+d.x,y:pos.y+d.y,z:pos.z+d.z});world.step();
        const at=body.translation();assert.ok(Math.abs(at.y-CHARACTER_OFFSET-surfaceHeight(at.x,at.z))<.065,`feet mismatch at ${at.x}`);
      }
      assert.ok(direction>0?body.translation().x>42:body.translation().x<14);
    }finally{world.free();}
  }
});
