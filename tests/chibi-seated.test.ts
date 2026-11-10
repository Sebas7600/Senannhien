import {createChibiWaterFrame,sampleChibiWater} from '../src/chibiWaterMotion';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AnimationMixer,Box3,Vector3,SkinnedMesh,Quaternion,Mesh,Group,SphereGeometry,TorusGeometry,Raycaster,DoubleSide,MeshBasicMaterial} from 'three';
import {Children,isValidElement} from 'react';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createChibiPose} from '../src/chibiPose';
import FemaleChibiHair from '../src/FemaleChibiHair';
import {CUSHION} from '../src/cushionData';
import {cushionNearGeometry,cushionFarGeometry} from '../src/cushionGeometry';
import {bowDuration} from '../src/bowTimeline';

test('seated activity changes keep the hip down and blend the upper body without a jump',async()=>{
  const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');
  const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();
  const rig=createChibiPose(scene),hip=scene.getObjectByName('Hong')!,head=scene.getObjectByName('Dau')!;
  const step=(pose:string,t=0)=>{rig.restore();mixer.update(1/60);rig.update(pose,true,false,1/60,'cushion',t);scene.updateMatrixWorld(true);};
  for(let i=0;i<90;i++)step('meditate');
  for(const pose of ['bow','meditate','pray','eat','tea','read','sit','chant','bow','meditate']){
    const height=hip.position.y,previous=head.quaternion.clone();step(pose);
    assert.ok(Math.abs(hip.position.y-height)<.00001,`${pose}: hip moved from ${height} to ${hip.position.y}`);
    assert.ok(previous.angleTo(head.quaternion)<.13,`${pose}: head snapped on first frame`);
    for(let i=0;i<90;i++)step(pose,i/60);
    assert.ok(Math.abs(hip.position.y-.078)<.00001);
  }
});

async function practiceModel(){
 const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb'),{scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 scene.scale.set(1.08,1,1.1);scene.getObjectByName('Dau')!.scale.set(1,.91,1.13);const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();return{scene,mixer,rig:createChibiPose(scene)};
}
function skinBounds(scene:import('three').Object3D,name:string,visit?:(point:Vector3)=>void){
 const bounds=new Box3(),point=new Vector3();scene.updateMatrixWorld(true);
 scene.traverse(object=>{if(!(object instanceof SkinnedMesh))return;object.skeleton.update();const bone=object.skeleton.bones.findIndex(bone=>bone.name===name),indices=object.geometry.getAttribute('skinIndex'),weights=object.geometry.getAttribute('skinWeight');
 for(let i=0;i<indices.count;i++){let weight=0;for(let channel=0;channel<4;channel++)if(indices.getComponent(i,channel)===bone)weight+=weights.getComponent(i,channel);if(weight<.5)continue;point.fromBufferAttribute(object.geometry.getAttribute('position'),i);object.applyBoneTransform(i,point);object.localToWorld(point);bounds.expandByPoint(point);visit?.(point);}});return bounds;
}

test('standing and seated prayer brings the actual palm surfaces together below the chin',async()=>{
 const {scene,mixer,rig}=await practiceModel();
 for(const seated of [false,true]){
  for(let i=0;i<90;i++){rig.restore();mixer.update(1/60);rig.update('pray',seated,false,1/60);}
  const left=skinBounds(scene,'Co_Tay_L'),right=skinBounds(scene,'Co_Tay_R'),head=skinBounds(scene,'Dau');
  assert.ok(left.min.x-right.max.x>-.012&&left.min.x-right.max.x<.008,'palms touch without crossing the arms');
  assert.ok(left.max.y<head.min.y&&right.max.y<head.min.y,'fingers stay below the chin');assert.ok(left.min.z>.15&&right.min.z>.15,'hands stay in front of the robe');
 }
});

test('retargeted bow kneels before bending and contacts the floor or cushion instead of the floor under the seat',async()=>{
 const {scene,mixer,rig}=await practiceModel();
 for(const [mode,floor] of [['standing',0],['cushion',0],['cushion',-.16]] as const){
  const peak=mode==='standing'?2.15:1.2;scene.position.y=-floor;
  if(mode==='standing'){
   for(let i=0;i<60;i++){rig.restore();mixer.update(1/60);rig.update('bow',false,false,1/60,mode,.94);}
   assert.ok(scene.getObjectByName('Hong')!.position.y<.20);assert.ok(Math.abs(scene.getObjectByName('Than')!.rotation.x)<.01,'kneel first, then bend');
  }
  for(let i=0;i<90;i++){rig.restore();mixer.update(1/60);rig.update('bow',mode==='cushion',false,1/60,mode,peak);}
  const head=skinBounds(scene,'Dau'),left=skinBounds(scene,'Co_Tay_L'),right=skinBounds(scene,'Co_Tay_R');
  assert.ok(head.min.y>=-floor&&head.min.y<-floor+.045,`${mode} ${floor}: forehead ${head.min.y}`);
  for(const palm of [left,right])assert.ok(palm.min.y>=-floor&&palm.min.y<-floor+.035,`${mode} ${floor}: hand ${palm.min.y}`);
  assert.ok(left.min.x>.08&&right.max.x<-.08,'both palms are open beside the head');
 }
});

// Instantiate the actual hair component, including the front fringe and rear bun.
// The accessory is attached to Dau in the game and must pass the same collision check.
function addHair(parent:import('three').Object3D,children:import('react').ReactNode=FemaleChibiHair()){
 Children.forEach(children,node=>{if(!isValidElement(node))return;const props=node.props as any;
  if(node.type!=='mesh'&&node.type!=='group')return;
  const object=node.type==='mesh'?new Mesh():new Group();
  if(object instanceof Mesh&&props.geometry)object.geometry=props.geometry;
  if(props.position)object.position.fromArray(props.position);if(props.scale)object.scale.fromArray(props.scale);if(props.rotation)object.rotation.fromArray(props.rotation);
  if(object instanceof Mesh)Children.forEach(props.children,child=>{if(!isValidElement(child))return;const p=child.props as any;if(child.type==='sphereGeometry')object.geometry=new SphereGeometry(...p.args);if(child.type==='torusGeometry')object.geometry=new TorusGeometry(...p.args);});
  parent.add(object);addHair(object,props.children);
 });
}

test('free bow folds both shoes backwards without sideways rotation, ground penetration or a snap while rising',async()=>{
 for(const dt of [1/30,1/60,.05]){
  const {scene,mixer,rig}=await practiceModel(),hip=scene.getObjectByName('Hong')!,forward=new Vector3(),rotation=new Quaternion(),previous=new Map<string,Quaternion>();
  for(let i=0;i<60;i++){rig.restore();mixer.update(dt);rig.update('walk',false,false,dt);}
  for(let t=0;t<bowDuration('standing')+dt;t+=dt){
   rig.restore();mixer.update(dt);rig.update('bow',false,false,dt,'standing',t);scene.updateMatrixWorld(true);
   for(const side of ['L','R']){
    const foot=scene.getObjectByName('Co_Chan_'+side)!;forward.set(0,0,1).applyQuaternion(foot.getWorldQuaternion(rotation).normalize());
    assert.ok(Math.abs(forward.x)<.002,`shoe turned sideways at ${t}`);
    if(previous.has(side))assert.ok(previous.get(side)!.angleTo(rotation)<dt*6.1+.002,`ankle snapped at ${t}`);previous.set(side,rotation.clone());
    const bounds=skinBounds(scene,foot.name);assert.ok(bounds.min.y>-.002,`shoe crosses ground at ${t}: ${bounds.min.y}`);
    assert.ok(skinBounds(scene,'Goi_'+side).min.y>-.003,`knee crosses ground at ${t}`);
   }
   if(t>.95&&t<3.8)assert.ok(hip.position.y<=.191,'stays kneeling until the upper body returns');
  }
  assert.ok(Math.abs(hip.position.y-.465)<.006,'returns to standing height');
 }
});

test('hands, forehead and female hair clear the actual cushion mesh during the entire seated bow at both hall heights',async()=>{
 const material=new MeshBasicMaterial({side:DoubleSide}),ray=new Raycaster(),origin=new Vector3(),down=new Vector3(0,-1,0);
 for(const base of [.4,2.28])for(const geometry of [cushionNearGeometry,cushionFarGeometry]){
  const {scene,mixer,rig}=await practiceModel(),hair=scene.getObjectByName('Dau')!;addHair(hair);
  const cushion=new Mesh(geometry,material);cushion.position.y=base;cushion.updateMatrixWorld(true);
  scene.position.set(0,base+CUSHION.seatLift,-.06);
  let closest=Infinity,checks=0;
  const clear=(point:Vector3)=>{
   assert.ok(point.y>=base-.001,'head/hands never pass through the floor');
   if(point.y>base+CUSHION.height+.01||Math.hypot(point.x,point.z)>.65)return;
   origin.set(point.x,base+1,point.z);ray.set(origin,down);const surface=ray.intersectObject(cushion)[0];if(!surface)return;
   const gap=point.y-surface.point.y;closest=Math.min(closest,gap);checks++;assert.ok(gap>=.001,`cushion intersection at base ${base}: ${gap}`);
  };
  for(let i=-60;i<=Math.ceil(bowDuration('cushion')*60)+30;i++){
   rig.restore();mixer.update(1/60);rig.update(i<0||i>bowDuration('cushion')*60?'meditate':'bow',true,false,1/60,'cushion',Math.max(0,i/60));
   for(const name of ['Dau','Co_Tay_L','Co_Tay_R'])skinBounds(scene,name,clear);
   hair.traverse(o=>{if(!(o instanceof Mesh))return;const p=o.geometry.attributes.position;for(let j=0;j<p.count;j++){origin.fromBufferAttribute(p,j);o.localToWorld(origin);clear(origin.clone());}});
   if(i>=0)assert.ok(Math.abs(scene.getObjectByName('Hong')!.position.y-.078)<.00001,'bow retains the seated hip height');
  }
  assert.ok(checks>100,'checks actual mesh contacts throughout lowering and raising');assert.ok(closest<.04,'hands/head approach the cushion naturally');
 }
 material.dispose();
});

test('both hands follow the real bucket grips through drawing and pouring, without putting the bucket into the head',async()=>{
 const {scene,mixer,rig}=await practiceModel(),frame=createChibiWaterFrame(),palm=new Vector3(),inverse=new Quaternion(),bucketPoint=new Vector3();
 for(const pose of ['drawWater','pourWater'] as const)for(let i=0;i<=100;i++){
  sampleChibiWater(pose,i/100,frame);
  for(let warm=0;warm<8;warm++){rig.restore();mixer.update(1/60);rig.update(pose,false,false,1/60,undefined,undefined,0,false,false,undefined,false,undefined,frame);}
  scene.updateMatrixWorld(true);
  for(const side of ['L','R'] as const){scene.getObjectByName('Co_Tay_'+side)!.getWorldPosition(palm);assert.ok(palm.distanceTo(side==='L'?frame.leftGrip:frame.rightGrip)<.004,`${pose} ${i}: ${side} grip`);}
  assert.ok(frame.fill>=0&&frame.fill<=1);if(pose==='drawWater')assert.equal(frame.flow,false);
  if(pose==='pourWater'&&i%5===0){
   inverse.copy(frame.rotation).invert();skinBounds(scene,'Dau',point=>{bucketPoint.copy(point).sub(frame.position).applyQuaternion(inverse).divideScalar(frame.scale);assert.ok(!(bucketPoint.y>.015&&bucketPoint.y<.30&&Math.hypot(bucketPoint.x,bucketPoint.z)<.13+bucketPoint.y*.13),`head intersects bucket at ${i}%`);});
  }
 }
});
