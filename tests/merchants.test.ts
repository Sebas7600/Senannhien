import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import meshoptimizer from 'meshoptimizer';
import {merchants,merchantFor,sampleMerchantHead} from '../src/merchantData';
import {souvenirStalls,stallPoint,STALL} from '../src/souvenirData';
import budget from '../public/assets/characters/merchants/vendor-budget.json';
import {sampleMerchantMotion} from '../src/merchantMotion';
import {createChibiPose} from '../src/chibiPose';

test('every stall has one distinct shopkeeper safely behind the counter and facing its visitor approach',()=>{
 assert.equal(merchants.length,8);assert.equal(new Set(merchants.map(m=>m.name)).size,8);
 for(const stall of souvenirStalls){
  const vendor=merchantFor(stall.id);assert.equal(vendor.stallId,stall.id);assert.equal(vendor.heading,stall.rotation);
  const dx=vendor.x-stall.x,dz=vendor.z-stall.z,c=Math.cos(stall.rotation),s=Math.sin(stall.rotation),localX=dx*c-dz*s,localZ=dx*s+dz*c;
  assert.ok(Math.abs(localX)<1&&localZ>=0&&localZ<.1);
  assert.ok(localZ+.638<STALL.counterZ-.47,'hands stop at the back edge of the counter');
  assert.ok(localZ-.60>-.75,'hair stays in front of the back shelves');
  assert.ok(vendor.y>0&&vendor.y<.16);assert.match(vendor.robe,/^#[0-9a-f]{6}$/);
 }
 assert.ok(merchants.some(m=>m.gender==='female')&&merchants.some(m=>m.gender==='male'));
});

test('the seller rest pose keeps both legs and ankles in the neutral player stance rather than the serving stance',async()=>{
 const bytes=fs.readFileSync(budget.source),{scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=new T.Group();root.scale.setScalar(budget.npcScale);root.add(scene);scene.scale.set(1.08,1,1.10);root.updateMatrixWorld(true);
 const names=['Dui_L','Dui_R','Goi_L','Goi_R','Co_Chan_L','Co_Chan_R'],rotations=names.map(name=>scene.getObjectByName(name)!.quaternion.clone()),ankles=['Co_Chan_L','Co_Chan_R'].map(name=>scene.getObjectByName(name)!.getWorldPosition(new T.Vector3()));
 const rig=createChibiPose(scene),mixer=new T.AnimationMixer(scene);mixer.clipAction(animations.find(clip=>clip.name==='Idle')!).play();
 for(let i=0;i<90;i++){
  rig.restore();mixer.setTime(i/30);rig.update('vendor',false,false,1/30);root.updateMatrixWorld(true);
  names.forEach((name,j)=>assert.ok(scene.getObjectByName(name)!.quaternion.angleTo(rotations[j])<1e-6,`${name} tilted`));
  ['Co_Chan_L','Co_Chan_R'].forEach((name,j)=>assert.ok(scene.getObjectByName(name)!.getWorldPosition(new T.Vector3()).distanceTo(ankles[j])<1e-5,`${name} shifted`));
  assert.equal(scene.getObjectByName('Hong')!.position.z,0);
 }
});

test('nearby vendors greet at different times, keep all movement bounded and stop for reduced motion or distant views',()=>{
 const pose={sway:0,breath:0,right:0,left:0};let greeting=0;
 for(const merchant of merchants){
  const stall=souvenirStalls.find(stall=>stall.id===merchant.stallId)!,front=stallPoint(stall,0,3);
  for(let i=0;i<450;i++){
   sampleMerchantMotion(merchant,front,i/30,false,pose);
   assert.ok(Math.abs(pose.sway)<=.0091&&pose.breath>=0&&pose.breath<=.0035&&Math.abs(pose.right)<=.64&&Math.abs(pose.left)<=.071);
   if(pose.right<-.2)greeting++;
  }
  sampleMerchantMotion(merchant,front,2,true,pose);assert.deepEqual(pose,{sway:0,breath:0,right:0,left:0});
  sampleMerchantMotion(merchant,[0,-50],2,false,pose);assert.deepEqual(pose,{sway:0,breath:0,right:0,left:0});
 }
 assert.ok(greeting>100);
});

test('head tracking remains gentle, honours reduced motion and does not turn toward visitors behind the stall',()=>{
 for(const merchant of merchants){
  const stall=souvenirStalls.find(s=>s.id===merchant.stallId)!,front=stallPoint(stall,1.9,3),back=stallPoint(stall,0,-4),pose={yaw:0,pitch:0};
  for(let i=0;i<100;i++){sampleMerchantHead(merchant,front,i*.1,false,pose);assert.ok(Math.abs(pose.yaw)<=.42&&Math.abs(pose.pitch)<.05);}
  sampleMerchantHead(merchant,front,2,true,pose);assert.deepEqual(pose,{yaw:0,pitch:0});
  sampleMerchantHead(merchant,back,2,false,pose);assert.deepEqual(pose,{yaw:0,pitch:0});
  sampleMerchantHead(merchant,[0,-50],2,false,pose);assert.deepEqual(pose,{yaw:0,pitch:0});
 }
});

test('both compressed merchant LODs reuse the original chibi appearance without skeletons or animation payloads',async()=>{
 assert.equal(budget.sourceSha256,createHash('sha256').update(fs.readFileSync(budget.source)).digest('hex'));
 await meshoptimizer.MeshoptDecoder.ready;
 const bounds=new Map<string,T.Box3>();
 for(const asset of budget.assets){
  const bytes=fs.readFileSync(`public/assets/characters/merchants/${asset.file}`);assert.equal(bytes.length,asset.bytes);assert.ok(asset.bytes<160000);
  const {scene,animations}=await new GLTFLoader().setMeshoptDecoder(meshoptimizer.MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  assert.equal(animations.length,0);let triangles=0;const seen:string[]=[];
  scene.traverse(object=>{
   if(!(object instanceof T.Mesh))return;seen.push(object.name);assert.ok(!(object instanceof T.SkinnedMesh));
   const geometry=object.geometry;assert.ok(!geometry.attributes.skinIndex&&!geometry.attributes.skinWeight);
   for(const attribute of Object.values(geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value));
   triangles+=geometry.index!.count/3;geometry.computeBoundingBox();const box=geometry.boundingBox!;
   if(!bounds.has(object.name))bounds.set(object.name,box.clone());else{assert.ok(box.min.distanceTo(bounds.get(object.name)!.min)<.012);assert.ok(box.max.distanceTo(bounds.get(object.name)!.max)<.012);}
   const color=geometry.attributes.color;let skin=0,robe=0,apron=0;
   for(let i=0;i<color.count;i++){if(Math.abs(color.getX(i)-.65)<.01)skin++;if(Math.abs(color.getX(i)-.16)<.005&&Math.abs(color.getY(i)-.05)<.007)robe++;if(color.getY(i)>.7&&color.getX(i)<.06)apron++;}
   if(object.name==='VendorBody'){
    assert.ok(skin>0&&robe>0&&apron>0);assert.ok(box.min.y>=-.002);assert.ok(box.max.z<.65);
    const weights=geometry.attributes.uv,position=geometry.attributes.position;let feet=0,rightArm=0,leftArm=0;
    assert.ok(weights);
    for(let i=0;i<position.count;i++){
     assert.ok(weights.getX(i)>=0&&weights.getX(i)<=1.001&&weights.getY(i)>=0&&weights.getY(i)<=1.001);
     if(position.getY(i)<.30){feet++;assert.equal(weights.getX(i),0);assert.equal(weights.getY(i),0);}
     if(weights.getX(i)>.9)rightArm++;if(weights.getY(i)>.9)leftArm++;
    }
    assert.ok(feet>20&&rightArm>20&&leftArm>20,'feet stay outside both moving arm regions');
   }
   if(object.name==='VendorHead')assert.ok(skin>0);
  });
  assert.deepEqual(seen,['VendorBody','VendorHead','VendorHair']);assert.equal(triangles,asset.triangles);assert.ok(triangles<(asset.file.includes('-low')?7000:12000));
 }
});
