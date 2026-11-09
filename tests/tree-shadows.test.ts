import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createTreeShadowAtlas,createTreeShadowMaterial,projectTreeShadow,projectTreeTrunkShadow,COURTYARD_SUN,TREE_SHADOW_TILE,TREE_SHADOW_TREES} from '../src/treeShadowAtlas';

test('courtyard shadows retain the model canopy silhouette with a light fill and soft border',()=>{
  const atlas=createTreeShadowAtlas(),size=TREE_SHADOW_TILE;
  assert.equal(atlas.bounds.length,3);
  assert.equal(atlas.geometry.index!.count,18);
  assert.equal(atlas.map.format,T.RedFormat);
  assert.equal(atlas.mask.byteLength,65536,'one small single-channel mask serves all three crowns');
  assert.ok(atlas.map.generateMipmaps);
  assert.ok(atlas.geometry.boundingSphere!.radius>0);
  for(let tile=0;tile<4;tile++){
    const column=tile%2,row=Math.floor(tile/2);
    let shadowed=0,soft=0;const shape=new Uint8Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const value=atlas.mask[(row*size+y)*atlas.width+column*size+x];
      if(tile===3||x===0||y===0||x===size-1||y===size-1)assert.equal(value,0,'clear borders prevent a rectangular stain or atlas bleeding');
      if(value>128){shadowed++;shape[y*size+x]=1;}
      if(value>15&&value<240)soft++;
    }
    if(tile===3)continue;
    assert.ok(shadowed/(size*size)>.40&&shadowed/(size*size)<.70,'the crown stays a compact mass, matching the visible asset');
    assert.ok(soft/(size*size)>.04,'the silhouette has a graded soft edge');
    let largest=0;const queue=new Int32Array(size*size);
    for(let i=0;i<shape.length;i++){
      if(!shape[i])continue;
      let head=0,tail=1;queue[0]=i;shape[i]=0;
      while(head<tail){
        const p=queue[head++];
        for(const neighbor of [p-1,p+1,p-size,p+size])if(neighbor>=0&&neighbor<shape.length&&shape[neighbor]){shape[neighbor]=0;queue[tail++]=neighbor;}
      }
      largest=Math.max(largest,tail);
    }
    assert.ok(largest/shadowed>.98,'the shadow must not break into many invented leaf shapes');
    const tree=TREE_SHADOW_TREES[tile],bounds=atlas.bounds[tile],p=projectTreeShadow(tree,0,3.7,0);
    const x=Math.floor((p.x-bounds.minX)/(bounds.maxX-bounds.minX)*size);
    const y=Math.floor((p.z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*size);
    assert.ok(atlas.mask[(row*size+y)*atlas.width+column*size+x]>230,'the projected crown center remains covered');
    for(const height of [.3,.8,1.4,2,2.7,3.5,4]){
      const trunk=projectTreeTrunkShadow(tree,0,height,0);
      const tx=Math.floor((trunk.x-bounds.minX)/(bounds.maxX-bounds.minX)*size);
      const ty=Math.floor((trunk.z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*size);
      assert.ok(atlas.mask[(row*size+ty)*atlas.width+column*size+tx]>110,`${tree.id}: a continuous trunk shadow must connect the base to the crown at height ${height}`);
    }
  }
  const material=createTreeShadowMaterial(atlas.map);
  assert.equal(material.blending,T.MultiplyBlending);
  assert.equal(material.depthWrite,false);
  assert.equal(material.uniforms.shadowMap.value,atlas.map);
  assert.ok(material.uniforms.strength.value>0&&material.uniforms.strength.value<=.25,'daylight shadows should stay gentle');
  material.dispose();atlas.geometry.dispose();atlas.map.dispose();
});

test('shadow projection follows the same sun direction as scene lighting at each tree height',()=>{
  for(const tree of TREE_SHADOW_TREES){
    const low=projectTreeShadow(tree,0,0,0),high=projectTreeShadow(tree,0,5,0);
    assert.ok(high.x>low.x&&high.z<low.z);
    assert.ok(Math.abs((high.x-low.x)*COURTYARD_SUN.y+COURTYARD_SUN.x*5*tree.sy)<1e-8);
    assert.ok(Math.abs((high.z-low.z)*COURTYARD_SUN.y+COURTYARD_SUN.z*5*tree.sy)<1e-8);
  }
});
