import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {stoneBenches,benchSeatWorld,BENCH_GROUND} from '../src/stoneBenchData';
import {seats,walkable} from '../src/gameData';
import {findPath,clearLine} from '../src/navigation';
import {benchSeatGeometry,benchBackGeometry,benchLegGeometry,STONE_BENCH} from '../src/benchGeometry';

test('nine continuous stone benches provide eighteen unique, reachable sitting positions',()=>{
  const positions=seats.filter(s=>s.kind==='bench');assert.equal(stoneBenches.length,9);assert.equal(positions.length,18);
  for(const b of stoneBenches){const pair=positions.filter(s=>s.id.startsWith(`bench-${b.id}-`));assert.equal(pair.length,2);
    for(const [side,seat] of pair.entries()){assert.deepEqual(seat.position,benchSeatWorld(b,side));assert.ok(walkable(seat.position[0],seat.position[2],.3));
      const path=findPath([0,22],[seat.position[0],seat.position[2]]);assert.ok(path.length,seat.id);let prev:[number,number]=[0,22];for(const p of path){assert.ok(clearLine(prev,p),seat.id);prev=p;}
      const local=new THREE.Vector3(seat.position[0]-b.x,seat.position[1]-BENCH_GROUND,seat.position[2]-b.z).applyAxisAngle(new THREE.Vector3(0,1,0),-b.rotation);
      assert.ok(Math.abs(local.x)<STONE_BENCH.width/2-.2);assert.ok(Math.abs(local.z-.035)<1e-6);
    }
    assert.ok(Math.abs(new THREE.Vector3(...pair[0].position).distanceTo(new THREE.Vector3(...pair[1].position))-.86)<1e-6);
  }
});
test('avatar seat anchors sit on the curved slab; back and cast legs have valid geometry',()=>{
  const mesh=new THREE.Mesh(benchSeatGeometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
  for(const x of [-.43,.43]){const ray=new THREE.Raycaster(new THREE.Vector3(x,2,.035),new THREE.Vector3(0,-1,0));const hits=ray.intersectObject(mesh);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-STONE_BENCH.seatHeight)<.015,`surface ${hits[0].point.y}`);}
  for(const geometry of [benchSeatGeometry,benchBackGeometry,benchLegGeometry]){for(const value of geometry.attributes.position.array)assert.ok(Number.isFinite(value));for(const value of geometry.attributes.normal.array)assert.ok(Number.isFinite(value));geometry.computeBoundingBox();assert.ok(geometry.boundingBox!.min.y>=-.001);}
  benchBackGeometry.computeBoundingBox();assert.ok(benchBackGeometry.boundingBox!.max.y>.87);assert.ok(benchBackGeometry.boundingBox!.max.y<.91);
});
