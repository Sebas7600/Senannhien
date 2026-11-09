import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createTempleRoofTemplate} from '../src/templeRoofTemplate';
import RAPIER from '@dimforge/rapier3d-compat';
import {bridgeHeight,bridgeSegments} from '../src/pondLayout';
import {CHARACTER_OFFSET,CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS} from '../src/gameData';
import {bambooEntrances,mayaPaths,onLayoutPath,pathPoint,bambooStalks} from '../src/mayaPaths';
import {GATE,GATE_ENTRY,BELL_PROP,DRUM_PROP} from '../src/courtyardPropsData';
import {BODHI} from '../src/bodhiData';
import {BRIDGE_ROAD,POND,POND_BRIDGES,pondContains} from '../src/pondLayout';
import {QUAN_AM} from '../src/quanAmData';
import {walkable} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';

test('the saved Maya layout moves landmarks and keeps gate, shrine and gravel routes reachable',()=>{
 assert.ok(Math.abs(GATE.z-65.85002024181004)<1e-8);
 assert.ok(Math.abs(BELL_PROP.x+12.99111344053481)<1e-8);
 assert.ok(Math.abs(DRUM_PROP.x-13.26289520966489)<1e-8);
 assert.ok(Math.abs(BODHI.z-2.588907366281066)<1e-8);
 assert.ok(POND.rx>11&&POND.rz>19);
 for(let z=BRIDGE_ROAD.northZ;z<=BRIDGE_ROAD.southZ;z++){
   assert.equal(pondContains(BRIDGE_ROAD.x,z,.65),false);
   assert.ok(walkable(BRIDGE_ROAD.x,z));
 }
 assert.ok(walkable(...GATE_ENTRY));assert.ok(walkable(...QUAN_AM.approach));
 for(const target of [QUAN_AM.approach,...mayaPaths.slice(0,3).map(p=>[p.x,p.z] as [number,number])]){
  const route=findPath(GATE_ENTRY,target);assert.ok(route.length,`route to ${target}`);let from=GATE_ENTRY;for(const point of route){assert.ok(clearLine(from,point));from=point;}
 }
 assert.ok(POND_BRIDGES[0].z>12);
});

test('the saved path guides retain their footprint, with walkable joins and clear bamboo shoulders',()=>{
 assert.equal(mayaPaths[0].length,13.832953119351126);assert.equal(mayaPaths[1].width,4.0233839092696115);assert.equal(mayaPaths[2].length,35.6);
 for(const path of mayaPaths){assert.ok(onLayoutPath(path.x,path.z));const end=pathPoint(path,path.length/2-.1,0);assert.ok(onLayoutPath(...end));}
 for(const {axis,edge,from,to} of bambooEntrances){
   const middle=(from+to)/2;
   const entry:[number,number]=axis==='x'?[edge,middle]:[middle,edge];
   assert.ok(onLayoutPath(...entry)&&walkable(...entry));
 }
 assert.ok(bambooStalks.length>700);
 for(const stalk of bambooStalks)assert.equal(onLayoutPath(stalk.x,stalk.z,1.25),false);
});

test('the shared roof retains the main-hall materials and a normalized footprint without old lower walls',async()=>{
 const bytes=fs.readFileSync('public/assets/main-temple/tam-the-complete.glb'),loader=new GLTFLoader();loader.register(()=>({name:'test_texture',loadTexture:async()=>new T.Texture()}));
 const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const roof=createTempleRoofTemplate(scene);
 const box=new T.Box3().setFromObject(roof),size=box.getSize(new T.Vector3());assert.ok(Math.abs(size.x-1)<1e-5&&Math.abs(size.z-1)<1e-5);assert.ok(Math.abs(box.min.y)<1e-5);assert.ok(size.y>.2&&size.y<.65);
 let roofTiles=0;roof.traverse(node=>{if(!(node instanceof T.Mesh))return;const material=node.material as T.MeshStandardMaterial;if(material.name==='roof_tile'){roofTiles++;assert.ok(material.map);}for(const value of node.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});assert.ok(roofTiles>0);
});

test('a real character controller climbs and descends the arched lake bridge with matching deck physics',async()=>{
 await RAPIER.init();const bridge=POND_BRIDGES[0],spans=bridgeSegments(bridge),middle=(bridge.start+bridge.end)/2;
 assert.ok(bridgeHeight(middle,bridge)>1.7);assert.equal(bridgeHeight(bridge.start,bridge),.06);assert.ok(Math.abs(bridgeHeight(bridge.end,bridge)-.06)<1e-6);
 const world=new RAPIER.World({x:0,y:-9.81,z:0});try{
  world.createCollider(RAPIER.ColliderDesc.cuboid(80,.05,80).setTranslation(0,-.05,0));
  for(const span of spans)world.createCollider(RAPIER.ColliderDesc.cuboid(span.length/2,.05,span.halfWidth).setTranslation(span.x,span.y-.05,span.z).setRotation({x:0,y:0,z:Math.sin(span.angle/2),w:Math.cos(span.angle/2)}));
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(bridge.start-.5,CHARACTER_OFFSET+.08,bridge.z));const capsule=world.createCollider(RAPIER.ColliderDesc.capsule(CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS),body),controller=world.createCharacterController(.02);controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);
  let highest=0;for(let i=0;i<420;i++){controller.computeColliderMovement(capsule,{x:.075,y:-.035,z:0});const p=body.translation(),d=controller.computedMovement();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step();highest=Math.max(highest,body.translation().y-CHARACTER_OFFSET);}
  assert.ok(highest>1.7);assert.ok(body.translation().x>bridge.end);assert.ok(body.translation().y-CHARACTER_OFFSET<.2);
 }finally{world.free();}
});
