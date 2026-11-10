import {createChibiPose} from '../src/chibiPose';
import {sampleChibiSweepPose,CHIBI_SWEEP} from '../src/sweepMotion';
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

test('leaf coverage does not amplify photo RGB and stale premultiplied texture settings are corrected',()=>{
 const atlas=new T.Texture();atlas.premultiplyAlpha=true;atlas.colorSpace=T.NoColorSpace;
 const material=createFallenLeafMaterial(atlas);assert.equal(atlas.premultiplyAlpha,false);assert.equal(atlas.colorSpace,T.SRGBColorSpace);assert.equal(material.map,atlas);assert.ok(material.alphaTest>=.5);
 assert.equal(material.transparent,false);assert.equal(material.alphaToCoverage,false);assert.equal(material.opacity,1);assert.equal(material.blending,T.NormalBlending);
 // The installed Three renderer only enables OPAQUE for this exact combination.
 // Fractional alpha from the old coverage path leaked the light CSS page into edges.
 const programs=fs.readFileSync('node_modules/three/src/renderers/webgl/WebGLPrograms.js','utf8');
 assert.ok(programs.includes('opaque: material.transparent === false && material.blending === NormalBlending && material.alphaToCoverage === false'));
 assert.ok(T.ShaderChunk.opaque_fragment.includes('diffuseColor.a = 1.0;'));
 const fragment=T.ShaderLib.standard.fragmentShader,shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:fragment,uniforms:{}};
 material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 assert.equal(shader.fragmentShader,fragment,'use the stock RGB and alpha pipeline, including mip filtering and lighting');
 assert.ok(shader.vertexShader.includes('leafVariant'),'retain instanced atlas selection');
 atlas.dispose();material.dispose();
});

test('the actual chibi skeleton keeps both palms on the broom shaft throughout idle, walking and stair sweeps',async()=>{
 const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb'),{scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const visual=new T.Group(),root=new T.Group();root.position.set(9,.08,-12);root.rotation.y=1.13;root.add(visual);visual.add(scene);scene.scale.set(CHIBI_SWEEP.modelScaleX,1,CHIBI_SWEEP.modelScaleZ);
 const rig=createChibiPose(scene),mixer=new T.AnimationMixer(scene),pose=createSweepPose(),palm=new T.Vector3(),target=new T.Vector3();
 for(const clipName of ['Idle','Walk','Run'])for(const offset of [.025,.085])for(const reduced of [false,true]){
  mixer.stopAllAction();mixer.clipAction(animations.find(clip=>clip.name===clipName)!).reset().play();visual.position.y=-offset;
  for(let frame=0;frame<200;frame++){
   rig.restore();mixer.update(1/60);sampleChibiSweepPose(frame*17,reduced,pose,null,offset);
   rig.update('sweep',false,false,1/60,undefined,undefined,offset>.03?1:0,clipName!=='Idle',reduced,undefined,false,pose);root.updateMatrixWorld(true);
   if(frame<20)continue;
   for(const side of ['L','R'] as const){
    scene.getObjectByName('Co_Tay_'+side)!.getWorldPosition(palm);target.copy(side==='L'?pose.upperGrip:pose.lowerGrip);visual.localToWorld(target);
    assert.ok(palm.distanceTo(target)<.003,`${clipName}, offset ${offset}, ${side}: ${palm.distanceTo(target)}m grip gap`);
   }
   assert.ok(CHIBI_SWEEP.lowerGrip>.39&&CHIBI_SWEEP.upperGrip<1.25,'both grips are on the wooden handle');
  }
 }
});

test('leaf pickup follows the chibi broom head in all headings and head shake does not move either grip',()=>{
 const pose=createSweepPose(),impactPose=createSweepPose(),previous={x:0,z:0,valid:false},out=contact();
 for(const heading of [0,.6,Math.PI/2,Math.PI,-Math.PI/2])for(let time=0;time<SWEEP.periodMs;time+=33){
  sampleChibiSweepPose(time,false,pose);sampleChibiSweepPose(time,false,impactPose,{at:time-50,side:1,strength:1,ready:true});
  assert.ok(pose.upperGrip.distanceTo(impactPose.upperGrip)<1e-10);assert.ok(pose.lowerGrip.distanceTo(impactPose.lowerGrip)<1e-10);
  previous.valid=false;placeSweepContact(pose,3,4,.085,heading,previous,33,out);
  const base=pose.base.clone().applyAxisAngle(new T.Vector3(0,1,0),heading);assert.ok(Math.abs(out.x-3-base.x)<1e-9&&Math.abs(out.z-4-base.z)<1e-9);
  const leaf={...createLeafPool(1000000)[0],fallAt:1000000-LEAVES.fallMs,landX:out.x,landZ:out.z};assert.equal(collectLeaf(leaf,1000000,out),true);
 }
});

test('both broom LODs keep their visible bristle tips within two centimetres of the ground',async()=>{
 const pose=createSweepPose(),vertex=new T.Vector3();
 for(const file of ['broom-v1.glb','broom-v1-low.glb']){
  const model=await load(file),visual=new T.Group(),prop=new T.Group();visual.position.y=-.025;visual.add(prop);prop.add(model);const head=model.getObjectByName('Dau_Choi')!;
  for(let now=0;now<SWEEP.periodMs;now+=75){
   sampleChibiSweepPose(now,false,pose);prop.position.copy(pose.base);prop.quaternion.copy(pose.rotation);head.rotation.set(-pose.headFlexZ,0,pose.headFlexX);visual.updateMatrixWorld(true);
   let lowest=Infinity;model.traverse(mesh=>{if(!(mesh instanceof T.Mesh))return;const positions=mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){vertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);lowest=Math.min(lowest,vertex.y);}});
   assert.ok(lowest>=-.003&&lowest<.02,`${file} at ${now}: ${lowest}m bristle gap`);
  }
 }
});
