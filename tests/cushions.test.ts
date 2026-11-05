import {test} from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import * as THREE from 'three';
import {CUSHION} from '../src/cushionData';
import {cushionNearGeometry,cushionFarGeometry} from '../src/cushionGeometry';
import {seats,walkable,usesFloorSeat,surfaceHeight} from '../src/gameData';
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
test('all 68 indoor and 8 bamboo cushions remain reachable with their existing IDs and raised seat anchors',()=>{
  const cushions=seats.filter(s=>s.kind==='cushion');assert.equal(cushions.length,76);assert.equal(cushions.filter(s=>s.zone==='temple').length,48);assert.equal(cushions.filter(s=>s.zone==='hall').length,20);
  for(const s of cushions){const base=s.zone==='temple'?2.28-CUSHION.seatLift:s.zone==='hall'?.4:.06;assert.ok(Math.abs(s.position[1]-CUSHION.seatLift-base)<1e-8);assert.ok(walkable(s.position[0],s.position[2]));const path=findPath([0,22],[s.position[0],s.position[2]]);assert.ok(path.length,s.id);let from:[number,number]=[0,22];for(const p of path){assert.ok(clearLine(from,p),s.id);from=p;}}
});


test('all 136 floor seats share the Truc Lam cushion anchors and keep clear accessible approaches',()=>{
  const cushions=seats.filter(usesFloorSeat);assert.equal(cushions.length,136);assert.equal(seats.length,156);
  for(const seat of cushions.filter(s=>s.table)){
    assert.ok(Math.abs(seat.position[1]-CUSHION.seatLift-surfaceHeight(seat.position[0],seat.position[2]))<1e-8);
    assert.ok(walkable(seat.position[0],seat.position[2]),seat.id);
    const path=findPath([0,22],[seat.position[0],seat.position[2]]);assert.ok(path.length,seat.id);
    let from:[number,number]=[0,22];for(const point of path){assert.ok(clearLine(from,point),seat.id);from=point;}
    const table=seat.table!;assert.ok(table[1]-seat.position[1]>.2&&table[1]-seat.position[1]<.4,'Low table clears seated legs');
  }
  for(let i=0;i<10;i++){const pair=cushions.filter(s=>s.id===`tea-${i*2}`||s.id===`tea-${i*2+1}`);assert.equal(pair.length,2);assert.equal(pair[0].table,pair[1].table);assert.ok(Math.cos(pair[0].rotation)*(pair[0].table![2]-pair[0].position[2])>0);assert.ok(Math.cos(pair[1].rotation)*(pair[1].table![2]-pair[1].position[2])>0);}
});
