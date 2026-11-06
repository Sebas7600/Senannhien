import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {GLTFLoader,MeshoptDecoder} from 'three-stdlib';import {createBroomContact,createSweepPose,sampleSweepPose,sweepElbow,placeSweepContact,SWEEP} from '../src/sweepMotion';import {createLeafPool,collectLeaf,LEAVES,leafSources} from '../src/leafSimulation';import {createFallenLeafGeometry,createFallenLeafMaterial,leafVariant} from '../src/fallenLeafSurface';
const contact=()=>({...createBroomContact(),ground:.085});
async function load(file:string){const b=fs.readFileSync('public/assets/sweeping/'+file),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);loader.register(()=>({name:'OfflineTexture',loadTexture:async()=>new T.Texture()}));return (await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
test('supplied broom decodes as three material batches with a movable head, accurate grip length and smaller LOD',async()=>{
 const report=JSON.parse(fs.readFileSync('public/assets/sweeping/broom-budget.json','utf8'));assert.equal(report.sourceTriangles,21856);assert.equal(report.assets.length,2);const bounds=[];
 for(const a of report.assets){const scene=await load(a.file);let draws=0,triangles=0;scene.traverse(o=>{if(!(o instanceof T.Mesh))return;draws++;triangles+=o.geometry.index!.count/3;for(const key of ['position','normal','uv','color'])assert.ok(Array.from(o.geometry.attributes[key].array).every(Number.isFinite));});assert.equal(draws,3);assert.equal(triangles,a.triangles);assert.ok(scene.getObjectByName('Can_Go'));assert.equal(scene.getObjectByName('Dau_Choi')!.position.y,.39);bounds.push(new T.Box3().setFromObject(scene));assert.ok(a.bytes<220000);}
 assert.ok(report.assets[0].triangles<10000);assert.ok(report.assets[1].triangles<3500);assert.ok(bounds[0].min.distanceTo(bounds[1].min)<.012);assert.ok(bounds[0].max.distanceTo(bounds[1].max)<.012);assert.ok(bounds[0].max.y>1.24&&bounds[0].max.y<1.26);assert.ok(SWEEP.lowerGrip>report.handleMinY&&SWEEP.upperGrip<report.handleMaxY);
});
test('both hands remain on the same wooden shaft and fixed-length arms reach them throughout the sweep',()=>{
 const pose=createSweepPose(),shoulder=new T.Vector3(),wrist=new T.Vector3(),hand=new T.Vector3(),elbow=new T.Vector3(),direction=new T.Vector3(),pole=new T.Vector3(),axis=new T.Vector3(),rotation=new T.Quaternion(),body=new T.Matrix4(),inverse=new T.Matrix4();
 for(const scale of [1,.95])for(let now=0;now<SWEEP.periodMs*3;now+=17){sampleSweepPose(now,false,pose);body.compose(new T.Vector3(0,.84,0),new T.Quaternion().setFromEuler(new T.Euler(.07,0,0)),new T.Vector3(scale,1,1));inverse.copy(body).invert();axis.copy(pose.axis).transformDirection(inverse);rotation.setFromUnitVectors(new T.Vector3(0,1,0),axis);
  const fan=new T.Vector3(1,0,0).applyQuaternion(pose.rotation);
  assert.ok(Math.abs(fan.z)>.95&&Math.abs(fan.x)<.1);
  assert.ok(new T.Vector3(0,1,0).applyQuaternion(pose.rotation).distanceTo(pose.axis)<1e-8);
  for(const side of [-1,1]){const grip=side===-1?pose.upperGrip:pose.lowerGrip,along=new T.Vector3().copy(grip).sub(pose.base);assert.ok(along.clone().cross(pose.axis).length()<1e-8);assert.ok(along.length()>=.355&&along.length()<=1.236);hand.copy(grip).applyMatrix4(inverse);wrist.set(1,0,0).applyQuaternion(rotation).multiplyScalar(side===-1?.036:-.036).add(hand);shoulder.set(side*.193,.42,0);assert.ok(shoulder.distanceTo(wrist)<SWEEP.upperArm+SWEEP.forearm);assert.equal(sweepElbow(shoulder,wrist,side,elbow,direction,pole),elbow);assert.ok(Math.abs(shoulder.distanceTo(elbow)-SWEEP.upperArm)<1e-7);assert.ok(Math.abs(wrist.distanceTo(elbow)-SWEEP.forearm)<1e-7);}
 }
});
test('contact uses the visible broom trajectory in every heading and cannot sweep through a teleport',()=>{
 const pose=createSweepPose(),previous={x:0,z:0,valid:false},out=contact();sampleSweepPose(0,false,pose);placeSweepContact(pose,10,20,.085,Math.PI/2,previous,33,out);assert.ok(Math.abs(out.x-(10+pose.base.z))<1e-8);assert.ok(Math.abs(out.z-(20-pose.base.x))<1e-8);assert.equal(out.fromX,out.x);
 const x=out.x;sampleSweepPose(33,false,pose);placeSweepContact(pose,10,20,.085,Math.PI/2,previous,33,out);assert.equal(out.fromX,x);placeSweepContact(pose,30,50,.085,Math.PI/2,previous,33,out);assert.equal(out.fromX,out.x);assert.equal(out.fromZ,out.z);placeSweepContact(pose,30.1,50,.085,Math.PI/2,previous,500,out);assert.equal(out.fromX,out.x);
});
test('only ground leaves touched by the bristle capsule move; nearby or behind the player are not vacuumed',()=>{
 const now=1000000,leaf=createLeafPool(now)[0],c=contact();leaf.fallAt=now-LEAVES.fallMs;leaf.landX=0;leaf.landZ=0;c.fromX=-.4;c.x=.4;
 assert.equal(collectLeaf(leaf,now,c),true);assert.equal(collectLeaf(leaf,now+1,c),false);
 const fresh=()=>({...leaf,collectedAt:0,landX:0,landZ:.6});assert.equal(collectLeaf(fresh(),now,c),false);assert.equal(collectLeaf({...fresh(),landZ:-.6},now,c),false);assert.equal(collectLeaf({...fresh(),landZ:0},now,{...c,ground:1}),false);assert.equal(collectLeaf({...fresh(),landZ:0,fallAt:now},now,c),false);
 for(const source of leafSources)assert.ok(source.ground<.1);
});
test('the larger bristle footprint picks up near misses in front and on the side, but excludes leaves behind the player',()=>{
 const now=1000000,pose=createSweepPose(),previous={x:0,z:0,valid:false},out=contact();
 const leaf={...createLeafPool(now)[0],fallAt:now-LEAVES.fallMs};
 sampleSweepPose(now,false,pose);
 for(const heading of [0,Math.PI/2]){
  previous.valid=false;
  placeSweepContact(pose,0,0,.085,heading,previous,33,out);
  const {forwardX,forwardZ}=out;
  const near=(side:number,depth:number)=>({
   ...leaf,landX:out.x+side*forwardZ+depth*forwardX,landZ:out.z-side*forwardX+depth*forwardZ,
  });
  assert.equal(collectLeaf(near(.04,.41),now,out),true);
  assert.equal(collectLeaf(near(.31,0),now,out),true);
  assert.equal(collectLeaf(near(.41,0),now,out),false);
  assert.equal(collectLeaf(near(0,-.67),now,out),false);
 }
});
test('bristle impact has a bounded damped response and reduced motion retains contact without head shake',()=>{
 const pose=createSweepPose(),idle=createSweepPose(),impact={at:100000,side:1,strength:1,ready:true};sampleSweepPose(100050,false,pose,impact);sampleSweepPose(100050,false,idle);assert.ok(Math.abs(pose.headFlexZ-idle.headFlexZ)>.02);assert.ok(Math.abs(pose.headFlexZ)<.2);sampleSweepPose(101000,false,pose,impact);sampleSweepPose(101000,false,idle);assert.equal(pose.headFlexZ,idle.headFlexZ);sampleSweepPose(100050,true,pose,impact);assert.equal(pose.headFlexX,0);assert.equal(pose.headFlexZ,0);sampleSweepPose(100050,false,idle);assert.ok(pose.base.distanceTo(idle.base)<1e-9);
});
test('all leaf photographs use one small alpha-tested atlas and an eight-triangle instanced surface',()=>{
 const budget=JSON.parse(fs.readFileSync('public/assets/sweeping/leaves-budget.json','utf8'));assert.equal(budget.width,512);assert.equal(budget.height,512);assert.equal(budget.variants.length,3);assert.ok(budget.bytes<50000);const image=fs.readFileSync('public/assets/sweeping/'+budget.file);assert.equal(image.length,budget.bytes);assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8X');assert.ok((image[20]&0x10)!==0,'atlas retains alpha');
 const g=createFallenLeafGeometry(180),mat=createFallenLeafMaterial(new T.Texture());assert.equal(g.index!.count/3,8);assert.equal(g.attributes.leafVariant.count,180);assert.equal(mat.transparent,false);assert.equal(mat.depthWrite,true);assert.ok(mat.alphaTest>0);assert.ok(leafVariant(1)===2&&leafVariant(4)===0&&leafVariant(9)===1);for(const key of ['position','normal','uv'])assert.ok(Array.from(g.attributes[key].array).every(Number.isFinite));g.dispose();mat.dispose();
});
