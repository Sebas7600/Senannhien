import {test} from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import * as THREE from 'three';
import {CUSHION} from '../src/cushionData';
import {cushionNearGeometry,cushionFarGeometry} from '../src/cushionGeometry';
import {seats,walkable,usesFloorSeat,surfaceHeight} from '../src/gameData';
import {cushionSeats,cushionBaseY,cushionScale} from '../src/cushionPlacement';
import {findPath,clearLine} from '../src/navigation';
test('woven cushions keep one indexed mesh per LOD, consistent bounds and a small texture download',()=>{
  assert.ok(cushionNearGeometry.index!.count/3<=1000);assert.ok(cushionFarGeometry.index!.count/3<=500);
  for(const g of [cushionNearGeometry,cushionFarGeometry]){assert.equal(g.groups.length,0);assert.ok(g.index);assert.equal(g.attributes.uv.count,g.attributes.position.count);for(const key of ['position','normal','uv'])for(const value of g.attributes[key].array)assert.ok(Number.isFinite(value));assert.ok(g.boundingBox!.max.y<=CUSHION.height+.001);assert.ok(g.boundingBox!.min.y>=0);}
  assert.ok(cushionNearGeometry.boundingBox!.min.distanceTo(cushionFarGeometry.boundingBox!.min)<.001);assert.ok(cushionNearGeometry.boundingBox!.max.distanceTo(cushionFarGeometry.boundingBox!.max)<.001);
  assert.ok(statSync('public'+CUSHION.textureUrl).size<450000);
});
test('the rounded seat surface supports the seated avatar and uses centered planar pattern UVs',()=>{
  for(const geometry of [cushionNearGeometry,cushionFarGeometry]){const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld();
    for(const [x,z] of [[0,0],[.13,.1],[-.13,.1]]){const hits=new THREE.Raycaster(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0)).intersectObject(mesh);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-(CUSHION.seatLift+.02))<.015);if(x===0){assert.ok(Math.abs(hits[0].uv!.x-.375)<.001);assert.ok(Math.abs(hits[0].uv!.y-.625)<.001);}}
  }
});
test('all 60 indoor meditation cushions remain reachable with raised seat anchors',()=>{
  const cushions=seats.filter(s=>s.kind==='cushion');assert.equal(cushions.length,60);assert.equal(cushions.filter(s=>s.zone==='temple').length,40);assert.equal(cushions.filter(s=>s.zone==='hall').length,20);
  for(const s of cushions){const base=s.zone==='temple'?2.28:s.zone==='hall'?.4:.06;assert.ok(Math.abs(s.position[1]-CUSHION.seatLift-base)<1e-8);assert.ok(walkable(s.position[0],s.position[2]));const path=findPath([0,22],[s.position[0],s.position[2]]);assert.ok(path.length,s.id);let from:[number,number]=[0,22];for(const p of path){assert.ok(clearLine(from,p),s.id);from=p;}}
});

test('every floor seat uses the woven batch, including all dining and reading cushions, without changing seat heights',()=>{
  assert.equal(cushionSeats.length,120);assert.equal(new Set(cushionSeats.map(s=>s.id)).size,120);
  assert.deepEqual(cushionSeats.map(s=>s.id),seats.filter(usesFloorSeat).map(s=>s.id));
  assert.deepEqual(Object.fromEntries(['temple','hall','bamboo','dining','library','terrace'].map(zone=>[zone,cushionSeats.filter(s=>s.zone===zone).length])),{temple:40,hall:20,bamboo:0,dining:20,library:20,terrace:20});
  for(const seat of cushionSeats){const scale=cushionScale(seat),base=cushionBaseY(seat);
    assert.equal(base,seat.position[1]-CUSHION.seatLift);
    assert.ok(Math.abs(CUSHION.radius*scale[0]-CUSHION.radius)<1e-9);
    assert.ok(Math.abs(CUSHION.height*scale[1]-CUSHION.height)<1e-9);
    for(const geometry of [cushionNearGeometry,cushionFarGeometry]){const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.position.set(seat.position[0],base,seat.position[2]);mesh.scale.set(...scale);mesh.rotation.y=seat.rotation;mesh.updateMatrixWorld();const hit=new THREE.Raycaster(new THREE.Vector3(seat.position[0],base+1,seat.position[2]),new THREE.Vector3(0,-1,0)).intersectObject(mesh)[0];assert.ok(hit,seat.id);assert.ok(Math.abs(hit.uv!.x-.375)<.001&&Math.abs(hit.uv!.y-.625)<.001,'All sizes and LODs sample the same patterned top');assert.ok(hit.point.y<=base+CUSHION.height+.001);}
  }
});


test('all 120 floor seats share the Truc Lam cushion anchors and keep clear accessible approaches',()=>{
  const cushions=seats.filter(usesFloorSeat);assert.equal(cushions.length,120);assert.equal(seats.length,146);
  for(const seat of cushions.filter(s=>s.table)){
    assert.ok(Math.abs(seat.position[1]-CUSHION.seatLift-surfaceHeight(seat.position[0],seat.position[2]))<1e-8);
    assert.ok(walkable(seat.position[0],seat.position[2]),seat.id);
    const path=findPath([0,22],[seat.position[0],seat.position[2]]);assert.ok(path.length,seat.id);
    let from:[number,number]=[0,22];for(const point of path){assert.ok(clearLine(from,point),seat.id);from=point;}
    const table=seat.table!;assert.ok(table[1]-seat.position[1]>.2&&table[1]-seat.position[1]<.4,'Low table clears seated legs');
  }
  for(let i=0;i<10;i++){const pair=cushions.filter(s=>s.id===`tea-${i*2}`||s.id===`tea-${i*2+1}`);assert.equal(pair.length,2);assert.equal(pair[0].table,pair[1].table);assert.ok(Math.cos(pair[0].rotation)*(pair[0].table![2]-pair[0].position[2])>0);assert.ok(Math.cos(pair[1].rotation)*(pair[1].table![2]-pair[1].position[2])>0);}
});
