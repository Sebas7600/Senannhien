import {test} from 'node:test';import assert from 'node:assert/strict';
import {createLeafPool,advanceLeaf,collectLeaf,sampleLeaf,leafSources,LEAVES,type LeafPose} from '../src/leafSimulation';
import {courtyardTrees,COURTYARD_TREE,restingBenches} from '../src/courtyardData';
import {walkable} from '../src/gameData';
const pose=():LeafPose=>({x:0,y:0,z:0,rx:0,ry:0,rz:0,scale:0});
test('all three real trees have bounded leaf pools landing on reachable ground outside their basins and benches',()=>{
  const pool=createLeafPool(1000000);assert.equal(pool.length,180);assert.equal(pool.filter(s=>s.index%2===0).length,90);
  assert.deepEqual(leafSources.slice(1).map(s=>[s.x,s.z]),courtyardTrees.map(t=>[t.x,t.z]));
  for(let i=0;i<3;i++)assert.equal(pool.filter(s=>s.source===i).length,60);
  for(const leaf of pool){const source=leafSources[leaf.source],distance=Math.hypot(leaf.landX-source.x,leaf.landZ-source.z);assert.ok(distance>source.radius+.3);assert.ok(distance<=source.maxRadius+.001);assert.ok(walkable(leaf.landX,leaf.landZ,.22));for(const b of restingBenches){const dx=leaf.landX-b.x,dz=leaf.landZ-b.z,c=Math.cos(b.rotation),s=Math.sin(b.rotation);assert.ok(Math.abs(c*dx-s*dz)>=1.1||Math.abs(s*dx+c*dz)>=.55);}}
});
test('falling leaves settle continuously at their own landing, and only grounded leaves can be swept once',()=>{
  const now=1000000;for(const source of [0,1,2]){const leaf=createLeafPool(now).find(s=>s.source===source)!;leaf.fallAt=now;const out=pose();assert.equal(sampleLeaf(leaf,now,false,out),out);assert.ok(out.y>4.5);assert.equal(collectLeaf(leaf,now,leaf.landX,leaf.landZ,0),false);
    sampleLeaf(leaf,now+LEAVES.fallMs-1,false,out);const before=[out.x,out.y,out.z];sampleLeaf(leaf,now+LEAVES.fallMs,false,out);assert.ok(Math.hypot(out.x-before[0],out.y-before[1],out.z-before[2])<.002);assert.equal(out.y,leafSources[source].ground);
    assert.equal(collectLeaf(leaf,now+LEAVES.fallMs,leaf.landX+3,leaf.landZ,0),false);assert.equal(collectLeaf(leaf,now+LEAVES.fallMs,leaf.landX,leaf.landZ,0),true);assert.equal(collectLeaf(leaf,now+LEAVES.fallMs+1,leaf.landX,leaf.landZ,0),false);
    sampleLeaf(leaf,leaf.collectedAt+LEAVES.gatherMs,false,out);assert.equal(out.scale,0);
  }
});
test('swept leaves wait at least ninety seconds then restart in the canopy, never pop back on the ground',()=>{
  const leaf=createLeafPool(1000000)[59],out=pose(),now=leaf.fallAt+LEAVES.cycleMs-100;assert.equal(collectLeaf(leaf,now,leaf.landX,leaf.landZ,0),true);const next=now+LEAVES.renewMs;
  advanceLeaf(leaf,next-1);sampleLeaf(leaf,next-1,false,out);assert.equal(out.scale,0);
  advanceLeaf(leaf,next);assert.equal(leaf.collectedAt,0);assert.equal(leaf.fallAt,next);sampleLeaf(leaf,next,false,out);assert.ok(out.y>4.5);assert.ok(out.scale>0);
  const pool=createLeafPool(1000000);for(let t=1000000;t<1000000+36000000;t+=130000)for(const item of pool){advanceLeaf(item,t);sampleLeaf(item,t,false,out);assert.ok(Object.values(out).every(Number.isFinite));}assert.equal(pool.length,180);
});
test('reduced motion hides airborne movement but still invalidates the matrix when leaves land',()=>{
  const leaf=createLeafPool(1000000)[0],out=pose();leaf.fallAt=1000000;advanceLeaf(leaf,1000000);sampleLeaf(leaf,1000000,true,out);assert.equal(out.scale,0);leaf.dirty=false;
  advanceLeaf(leaf,1000000+LEAVES.fallMs);assert.equal(leaf.phase,'ground');assert.equal(leaf.dirty,true);sampleLeaf(leaf,1000000+LEAVES.fallMs,true,out);assert.ok(out.scale>0);assert.equal(out.y,leafSources[0].ground);
  leaf.dirty=false;advanceLeaf(leaf,1000000+LEAVES.fallMs+1);assert.equal(leaf.dirty,false);
});
