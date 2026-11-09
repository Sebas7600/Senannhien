import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AnimationMixer,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createChibiPose} from '../src/chibiPose';
import {createQuietActivityFrame,sampleQuietActivity} from '../src/quietActivityMotion';

test('tea pauses at the lips, lowers the cup and wraps continuously; reduced motion stays still',()=>{
  const frame=createQuietActivityFrame();
  assert.equal(sampleQuietActivity('tea',0,frame).sip,0);
  assert.equal(sampleQuietActivity('tea',3.5,frame).sip,1);assert.ok(frame.cupTilt>.2);
  assert.equal(sampleQuietActivity('tea',6,frame).sip,0);
  const before={...sampleQuietActivity('tea',7-.00001,frame)},after=sampleQuietActivity('tea',7+.00001,frame);
  assert.ok(Math.abs(before.sip-after.sip)<.00001);
  sampleQuietActivity('tea',3.5,frame,true);assert.equal(frame.sip,0);assert.equal(frame.breath,0);
});

test('page turn has a reading pause and finishes before the hand returns to supporting the book',()=>{
  const f=createQuietActivityFrame();assert.equal(sampleQuietActivity('read',4,f).page,0);
  assert.ok(sampleQuietActivity('read',6,f).turnHand>.4);assert.equal(sampleQuietActivity('read',7.7,f).turnHand,0);
  assert.equal(sampleQuietActivity('read',7.7,f).page,1);
  sampleQuietActivity('read',6,f,true);assert.equal(f.page,0);assert.equal(f.turnHand,0);
});

test('actual chibi rig brings tea to its mouth and turns a page without moving the seated hips',async()=>{
  const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');
  const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();
  const rig=createChibiPose(scene),hip=scene.getObjectByName('Hong')!,wrist=scene.getObjectByName('Co_Tay_R')!,left=scene.getObjectByName('Co_Tay_L')!,head=scene.getObjectByName('Dau')!;
  const point=new Vector3(),mouth=new Vector3();let restDistance=0,sipDistance=0,leftStart=0,leftTurn=0;
  for(const pose of ['tea','read'])for(let i=0;i<480;i++){
    rig.restore();mixer.update(1/60);rig.update(pose,true,false,1/60);scene.updateMatrixWorld(true);
    assert.ok(Math.abs(hip.position.y-.078)<.00001||i<8);
    if(pose==='tea'&&(i===55||i===205)){
      head.localToWorld(mouth.set(0,.115,.215));wrist.getWorldPosition(point);
      const d=point.distanceTo(mouth);if(i===55)restDistance=d;else sipDistance=d;
    }
    if(pose==='read'&&i===240)leftStart=left.getWorldPosition(point).x;
    if(pose==='read'&&i===385)leftTurn=left.getWorldPosition(point).x;
  }
  assert.ok(sipDistance<.095,`Cup hand misses mouth: ${sipDistance}`);
  assert.ok(restDistance>sipDistance+.15,`No visible sip: ${restDistance} -> ${sipDistance}`);
  assert.ok(leftStart-leftTurn>.12,`Page hand did not cross the book: ${leftStart} -> ${leftTurn}`);
});
