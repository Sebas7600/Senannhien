import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader,MeshoptDecoder} from 'three-stdlib';
import {GATE,BELL_PROP,DRUM_PROP,gateLeafPose,gateMasonry,inGateSweep} from '../src/courtyardPropsData';
import {gateState} from '../src/gateState';
import {walkable,CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS,CHARACTER_OFFSET} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';
import {finishInstanceLayout} from '../src/geometryBatch';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}}});
const {useGame}=await import('../src/gameStore');const {toggleTempleGate}=await import('../src/gateActions');
const initial=useGame.getInitialState();beforeEach(()=>{gateState.setState({open:true});useGame.setState({...initial,peers:[]},true)});

async function load(file:string){const bytes=fs.readFileSync('public/assets/courtyard/'+file),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);loader.register(()=>({name:'QA_texture',loadTexture:async()=>new THREE.Texture()}));return (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;}
test('all six compressed GLBs decode with the game decoder, retain artwork and meet triangle budgets',async()=>{
  const budget=JSON.parse(fs.readFileSync('public/assets/courtyard/asset-budget.json','utf8'));let fullBytes=0,lowBytes=0;
  for(const a of budget.assets){const scene=await load(a.file);let triangles=0,draws=0;scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const key of ['position','normal','uv'])for(const value of o.geometry.attributes[key].array)assert.ok(Number.isFinite(value),a.file);});assert.equal(triangles,a.triangles);assert.equal(draws,a.draws);assert.ok(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()).y>2);(a.file.includes('-low')?lowBytes+=a.bytes:fullBytes+=a.bytes);}
  const textureBytes=budget.textures.reduce((s:number,t:{bytes:number})=>s+t.bytes,0);assert.ok(fullBytes+textureBytes<2500000);assert.ok(lowBytes<fullBytes*.7);
  for(const kind of ['gate','bell','drum']){const high=budget.assets.find((a:{file:string})=>a.file===(kind==='gate'?GATE.highFile:kind+'.glb')),low=budget.assets.find((a:{file:string})=>a.file===(kind==='gate'?GATE.lowFile:kind+'-low.glb'));assert.ok(low.triangles<high.triangles*.6);}
  for(const t of budget.textures)assert.equal(fs.statSync('public/assets/courtyard/'+t.file).size,t.bytes);
});
test('one gate reproduces both original leaf states around actual hinge pivots',async()=>{
  const scene=await load(GATE.highFile),left=scene.getObjectByName('Central_Door_Left')!,right=scene.getObjectByName('Central_Door_Right')!;assert.ok(left&&right&&scene.getObjectByName('Door_Crossbar'));assert.equal(left.position.x,-GATE.hingeX);assert.equal(right.position.x,GATE.hingeX);
  const closed=new THREE.Box3().setFromObject(left);left.rotation.y=GATE.openAngle;right.rotation.y=-GATE.openAngle;scene.updateMatrixWorld(true);const open=new THREE.Box3().setFromObject(left);assert.ok(open.max.z-open.min.z>1.2);assert.ok(open.max.x-open.min.x<.5);assert.ok(closed.max.x-closed.min.x>1.2);
  assert.ok(Math.abs(GATE.openAngle-89*Math.PI/180)<1e-9);assert.ok(gateMasonry.every(p=>p.h>0));
});

test('new Bai Dinh gate retains the complete detailed silhouette and five supplied textures with fewer draws',async()=>{
  const report=JSON.parse(fs.readFileSync('public/assets/courtyard/gate-budget.json','utf8'));
  assert.equal(report.source,'Cong_Moi.zip');assert.equal(report.sourceTriangles,39092);assert.equal(report.assets[0].triangles,report.sourceTriangles);assert.equal(report.assets[0].draws,18);assert.ok(report.assets[0].draws<report.sourceDraws/4);assert.equal(report.uniqueMaterials,12);
  assert.ok(report.highDownloadBytes<1000000);assert.ok(report.lowDownloadBytes<700000);assert.ok(report.highDownloadBytes<report.sourceClosedBytes*.65);
  const high=await load(GATE.highFile),low=await load(GATE.lowFile),hb=new THREE.Box3().setFromObject(high),lb=new THREE.Box3().setFromObject(low);
  assert.ok(Math.abs(hb.min.x+5.11000013)<.00001);assert.ok(Math.abs(hb.max.y-6.24213648)<.00001);assert.ok(Math.abs(hb.max.z-1.10899997)<.00001);
  assert.ok(hb.min.distanceTo(lb.min)<.001&&hb.max.distanceTo(lb.max)<.001,'low detail retains the same footprint and roof tips');
  for(const name of ['Central_Door_Left','Central_Door_Right','Door_Crossbar']){const a=high.getObjectByName(name)!,b=low.getObjectByName(name)!;assert.ok(a&&b);assert.ok(a.position.distanceTo(b.position)<.00001);}
  const bytes=fs.readFileSync('public/assets/courtyard/'+GATE.highFile),j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.equal(j.images.length,5);
  assert.deepEqual(j.images.map((i:{uri:string})=>i.uri).sort(),report.textures.map((i:{file:string})=>i.file).sort());
  assert.ok(j.images.every((i:{uri:string})=>i.uri.startsWith('bai-dinh-v1-')),'new artwork has versioned URLs');
  assert.ok(j.materials.some((m:{name:string})=>m.name==='wood_column')===false,'equal wood materials are merged');
  for(const name of ['brick','wood','wood_edge','frieze','roof_tile'])assert.ok(j.images.some((i:{uri:string})=>i.uri===`bai-dinh-v1-${name}.jpg`));
  assert.ok(Math.abs(report.gateOpenAngles.Central_Door_Left-GATE.openAngle)<1e-7);assert.ok(Math.abs(report.gateOpenAngles.Central_Door_Right+GATE.openAngle)<1e-7);
});
test('gate physics and navigation agree for open and closed doors and leave side passages reachable',()=>{
  const inside:[number,number]=[GATE.x,GATE.z-4],outside:[number,number]=[GATE.x,GATE.z+4];
  assert.ok(walkable(GATE.x,GATE.z));assert.ok(clearLine(inside,outside));
  gateState.setState({open:false});assert.equal(walkable(GATE.x,GATE.z),false);assert.equal(clearLine(inside,outside),false);
  const route=findPath(inside,outside);assert.ok(route.length);let from:[number,number]=inside;for(const p of route){assert.ok(clearLine(from,p));from=p;}assert.deepEqual(from,outside);
  for(const side of [-1,1] as const){const p=gateLeafPose(side,0);assert.ok(!walkable(p.x,p.z,.05));assert.ok(inGateSweep([p.x,p.z]));const open=gateLeafPose(side,1);assert.ok(Math.abs(open.z-GATE.z)>.8);}
});
test('gate refuses remote toggles and movement through a visitor or peer',()=>{
  useGame.setState({position:[GATE.x,GATE.z-7]});toggleTempleGate();assert.equal(gateState.getState().open,true);
  useGame.setState({position:[GATE.x,GATE.z-1]});toggleTempleGate();assert.equal(gateState.getState().open,true);
  useGame.setState({position:[GATE.x,GATE.z-4]});toggleTempleGate();assert.equal(gateState.getState().open,false);
  useGame.setState({peers:[{id:'peer',name:'Sen',robe:'#ffffff',x:GATE.x,y:0,z:GATE.z-1,heading:0,action:'walk',seat:null}]});toggleTempleGate();assert.equal(gateState.getState().open,false);
  useGame.setState({peers:[]});toggleTempleGate();assert.equal(gateState.getState().open,true);
});
test('real Rapier capsule passes through the open arch and stops at the closed wooden leaves',async()=>{
  const R=await import('@dimforge/rapier3d-compat');await R.init();
  for(const open of [false,true]){const world=new R.World({x:0,y:-9.81,z:0});try{
    world.createCollider(R.ColliderDesc.cuboid(20,.1,20).setTranslation(GATE.x,-.04,GATE.z));
    for(const p of gateMasonry)world.createCollider(R.ColliderDesc.cuboid(p.w*GATE.scale/2,p.h*GATE.scale/2,p.d*GATE.scale/2).setTranslation(GATE.x+p.x*GATE.scale,GATE.y+p.y*GATE.scale,GATE.z+p.z*GATE.scale));
    for(const side of [-1,1] as const){const p=gateLeafPose(side,open?1:0);world.createCollider(R.ColliderDesc.cuboid(GATE.leafWidth*GATE.scale/2,GATE.leafHeight*GATE.scale/2,.16*GATE.scale).setTranslation(p.x,p.y,p.z).setRotation({x:0,y:Math.sin(p.angle/2),z:0,w:Math.cos(p.angle/2)}));}
    const body=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(GATE.x,.08+CHARACTER_OFFSET,GATE.z-4)),capsule=world.createCollider(R.ColliderDesc.capsule(CHARACTER_HALF_SEGMENT,CHARACTER_RADIUS),body),controller=world.createCharacterController(.02);controller.enableAutostep(.25,.15,true);controller.enableSnapToGround(.35);world.step();
    for(let i=0;i<160;i++){controller.computeColliderMovement(capsule,{x:0,y:-.035,z:.05});const p=body.translation(),d=controller.computedMovement();body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});world.step();}
    const z=body.translation().z;assert.ok(open?z>GATE.z+3:z<GATE.z-.4,`open=${open}, z=${z}`);
  }finally{world.free()}}
});
test('instance bounds refresh after layout so camera turns keep displaced scenery visible',()=>{
  const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
  const mesh=new THREE.InstancedMesh(geometry,material,1);
  mesh.computeBoundingSphere();
  const camera=new THREE.PerspectiveCamera(45,1,.1,20);
  camera.position.set(64,3,37);camera.lookAt(64,3,30);camera.updateMatrixWorld();
  const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  assert.equal(frustum.intersectsObject(mesh),false);
  mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(64,3,30));
  finishInstanceLayout(mesh);
  assert.ok(frustum.intersectsObject(mesh));
  camera.lookAt(64,3,44);camera.updateMatrixWorld();
  frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  assert.equal(frustum.intersectsObject(mesh),false,'offscreen scenery still benefits from frustum culling');
  geometry.dispose();material.dispose();mesh.dispose();
});
test('bell suspension and drum stand fit their existing pavilions without duplicated supports',async()=>{
  const bell=await load('bell.glb'),drum=await load('drum.glb');assert.ok(bell.getObjectByName('Bell'));assert.ok(bell.getObjectByName('Timber_Frame'));assert.ok(bell.getObjectByName('Wooden_Striker'));assert.ok(drum.getObjectByName('Drum_Shell'));assert.ok(drum.getObjectByName('Wooden_Stand'));
  const bb=new THREE.Box3().setFromObject(bell),db=new THREE.Box3().setFromObject(drum);assert.ok(bb.max.y*BELL_PROP.scale+.4<4.3);assert.ok(db.max.y*DRUM_PROP.scale+.4<4.3);assert.ok(db.min.y>=-.001);assert.ok(db.getSize(new THREE.Vector3()).x*DRUM_PROP.scale<3);assert.ok(bb.getSize(new THREE.Vector3()).x*BELL_PROP.scale<3.1);
});
