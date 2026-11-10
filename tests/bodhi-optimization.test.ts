import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {benchNearGeometry,benchFarGeometry} from '../src/benchGeometry';
import {canopyGeometry,foliageMaterial,FOLIAGE_DETAIL_CLUSTERS,LEAVES_PER_CLUSTER} from '../src/foliage';
import {foliageTexture} from '../src/foliageTexture';
import {BODHI} from '../src/bodhiData';
import {GATE_ENTRY} from '../src/courtyardPropsData';
import {incenseApproach,walkable} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';
import {courtyardTrees,COURTYARD_TREE,restingBenches} from '../src/courtyardData';
import {courtyardTreeGeometry} from '../src/courtyardTreeGeometry';
import {bodhiStoneGeometry} from '../src/bodhiGeometry';
const memory=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}}});
const {useGame,emptyProgress}=await import('../src/gameStore');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults,inventory:{...defaults.inventory},progress:emptyProgress(),lifetime:emptyProgress()},true));
test('bench LODs fit a strict geometry budget and keep the same silhouette bounds',()=>{
  assert.ok(benchNearGeometry.index!.count/3<=1450);assert.ok(benchFarGeometry.index!.count/3<=700);
  for(const g of [benchNearGeometry,benchFarGeometry]){assert.equal(g.groups.length,0);assert.equal(g.attributes.benchPart.count,g.attributes.position.count);assert.ok(g.index);for(const value of g.attributes.position.array)assert.ok(Number.isFinite(value));}
  const a=benchNearGeometry.boundingBox!,b=benchFarGeometry.boundingBox!;assert.ok(a.min.distanceTo(b.min)<.015);assert.ok(a.max.distanceTo(b.max)<.015);
});
test('detailed opaque canopy stays below 2000 triangles with one small shared vein texture',()=>{
  assert.ok(canopyGeometry.index!.count/3<=2000);assert.equal(foliageMaterial.transparent,false);assert.equal(foliageMaterial.side,THREE.FrontSide);assert.ok(canopyGeometry.boundingBox!.max.y>5);
  assert.equal(canopyGeometry.groups.length,0);assert.equal(canopyGeometry.attributes.leafDetail.count,canopyGeometry.attributes.position.count);
  assert.equal(canopyGeometry.attributes.uv.count,canopyGeometry.attributes.position.count);assert.equal(FOLIAGE_DETAIL_CLUSTERS*LEAVES_PER_CLUSTER,56);
  const details=Array.from(canopyGeometry.attributes.leafDetail.array);assert.ok(details.some(n=>n===0)&&details.some(n=>n===1));
  assert.equal(foliageTexture.image.width,256);assert.equal(foliageTexture.image.height,256);assert.ok(foliageTexture.image.data.byteLength<=262144);
  const data=foliageTexture.image.data;assert.ok(data.some((v,i)=>i%4===1&&v>200));assert.ok(data.some((v,i)=>i%4===1&&v<20));
  for(const key of ['position','normal','uv','color'])for(const value of canopyGeometry.attributes[key].array)assert.ok(Number.isFinite(value));
});
test('lettering stays in front of the curved backrest in both bench LODs',()=>{
  for(const geometry of [benchNearGeometry,benchFarGeometry]){const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();for(const y of [.65,.72,.81]){const hits=new THREE.Raycaster(new THREE.Vector3(0,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh);assert.ok(hits.length);assert.equal(geometry.attributes.benchPart.getX(hits[0].face!.a),3,`lettering hidden at y=${y}`);}}
});
test('a seat-facing camera ray detects an opaque crown and can stop before it',()=>{
  const crown=new THREE.Mesh(canopyGeometry,foliageMaterial);crown.position.set(-13,0,20);crown.scale.setScalar(1.1);crown.updateMatrixWorld();const target=new THREE.Vector3(-11,1.06,17),offset=new THREE.Vector3(0,5.8,10),direction=offset.clone().normalize(),ray=new THREE.Raycaster(target,direction,.35,offset.length()),hits=ray.intersectObject(crown);
  assert.ok(hits.length);const safe=Math.max(2.2,hits[0].distance-.32);assert.ok(safe<offset.length());assert.equal(new THREE.Raycaster(target,direction,.35,safe).intersectObject(crown).length,0);
});
test('Bodhi altar is reachable around the enlarged tree base from the gate and pond',()=>{
  assert.ok(walkable(...BODHI.offeringPoint));assert.equal(walkable(BODHI.x,BODHI.z),false);
  for(const start of [GATE_ENTRY,[18,5]] as [number,number][]){const path=findPath(start,BODHI.offeringPoint);assert.ok(path.length);let from=start;for(const p of path){assert.ok(clearLine(from,p));from=p;}assert.ok(Math.hypot(from[0]-BODHI.offeringPoint[0],from[1]-BODHI.offeringPoint[1])<.1);}
});
test('three benches hug the cardinal basin faces while leaving the lamp-facing side empty',()=>{
  assert.equal(restingBenches.length,6);assert.equal(new Set(restingBenches.map(b=>b.id)).size,6);
  for(const tree of courtyardTrees){
    assert.equal(walkable(tree.x,tree.z),false);
    const benches=restingBenches.filter(b=>b.treeId===tree.id);assert.equal(benches.length,3);
    assert.deepEqual(benches.map(b=>[Math.round(b.x-tree.x),Math.round(b.z-tree.z)]),tree.x<0?[[0,3],[3,0],[0,-3]]:[[0,3],[-3,0],[0,-3]]);
    for(const b of benches){
      const radial=new THREE.Vector2(b.x-tree.x,b.z-tree.z),facing=new THREE.Vector2(Math.sin(b.rotation),Math.cos(b.rotation));
      assert.ok(Math.abs(radial.length()-COURTYARD_TREE.benchRadius)<1e-6);assert.ok(radial.normalize().dot(facing)>.999);
      assert.ok(Math.hypot(b.x-BODHI.x,b.z-BODHI.z)>12);
      // Bench corners and a standing point in front keep clear of the basin.
      for(const x of [-.91,0,.91])for(const z of [-.38,.28]){const px=b.x+Math.cos(b.rotation)*x+Math.sin(b.rotation)*z,pz=b.z-Math.sin(b.rotation)*x+Math.cos(b.rotation)*z;assert.ok(Math.hypot(px-tree.x,pz-tree.z)>COURTYARD_TREE.radius+.28);
        for(let i=0;i<14;i++)assert.ok(Math.hypot(px-Math.sign(tree.x)*14.7,pz-(-22+i*4))>2.5);
      }
      assert.ok(Math.abs(b.x)<=Math.abs(tree.x)+.001,'no bench on the lamp side');
      assert.ok(walkable(b.x+facing.x*.8,b.z+facing.y*.8));
    }
  }
  assert.ok(clearLine(GATE_ENTRY,[0,6]));assert.ok(courtyardTreeGeometry.index!.count/3<=1800);
});
test('raised coping has the requested height while the altar front stays visible outside the ring',()=>{
  assert.ok(BODHI.wallHeight>.33);assert.ok(BODHI.wallHeight<BODHI.altarHeight);
  const material=new THREE.MeshBasicMaterial(),stone=new THREE.Mesh(bodhiStoneGeometry,material);stone.updateMatrixWorld();
  const front=new THREE.Raycaster(new THREE.Vector3(0,.46,5),new THREE.Vector3(0,0,-1)).intersectObject(stone);assert.ok(front[0].point.z>BODHI.radius);
  for(const [g,r,h] of [[bodhiStoneGeometry,BODHI.radius,BODHI.wallHeight],[courtyardTreeGeometry,COURTYARD_TREE.radius,COURTYARD_TREE.wallHeight]] as const){
    const mesh=new THREE.Mesh(g,material);mesh.updateMatrixWorld();const hits=new THREE.Raycaster(new THREE.Vector3((r-.13)*Math.cos(.1),2,(r-.13)*Math.sin(.1)),new THREE.Vector3(0,-1,0)).intersectObject(mesh);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-h)<.001);
  }
});
test('Bodhi incense waits for the complete gesture and records only once',()=>{
 useGame.setState({position:[...BODHI.offeringPoint]});const before=useGame.getState().inventory.incense;
 useGame.getState().perform('incense');let s=useGame.getState();assert.equal(s.action,'incense');assert.equal(s.event?.target,'bodhi');assert.equal(s.inventory.incense,before);assert.equal(s.progress.incense,0);
 s.perform('incense');assert.equal(useGame.getState().inventory.incense,before);
 useGame.setState({event:{...s.event!,at:Date.now()-3100}});s.tick();s=useGame.getState();assert.equal(s.inventory.incense,before-1);assert.equal(s.bodhiIncense,1);assert.equal(s.progress.incense,1);assert.equal(s.action,'walk');assert.equal(s.offeringSlots[s.burningIncense[0]],'bodhi');
 s.tick();assert.equal(useGame.getState().progress.incense,1);
});

test('cancelling Bodhi incense preserves the item and reward',()=>{
 useGame.setState({position:[...BODHI.offeringPoint]});useGame.getState().perform('incense');const before=useGame.getState().inventory.incense;useGame.getState().stand();useGame.getState().tick();assert.equal(useGame.getState().inventory.incense,before);assert.equal(useGame.getState().progress.incense,0);
});

test('temple offering stays separate and an empty incense bag cannot light the Bodhi altar',()=>{
  useGame.setState({position:[...incenseApproach]});useGame.getState().perform('incense');useGame.setState({event:{...useGame.getState().event!,at:Date.now()-3100}});useGame.getState().tick();assert.equal(useGame.getState().bodhiIncense,0);assert.equal(useGame.getState().progress.incense,1);
  useGame.setState({event:null,position:[...BODHI.offeringPoint],inventory:{...defaults.inventory,incense:0}});useGame.getState().perform('incense');assert.equal(useGame.getState().bodhiIncense,0);assert.equal(useGame.getState().panel,'bag');assert.equal(useGame.getState().progress.incense,1);
});
