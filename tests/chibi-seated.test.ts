import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AnimationMixer} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createChibiPose} from '../src/chibiPose';

test('seated activity changes keep the hip down and blend the upper body without a jump',async()=>{
  const bytes=fs.readFileSync('public/assets/characters/thay-chua-chibi.glb');
  const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new AnimationMixer(scene);mixer.clipAction(animations.find(a=>a.name==='Idle')!).play();
  const rig=createChibiPose(scene),hip=scene.getObjectByName('Hong')!,head=scene.getObjectByName('Dau')!;
  const step=(pose:string,t=0)=>{rig.restore();mixer.update(1/60);rig.update(pose,true,false,1/60,'cushion',t);scene.updateMatrixWorld(true);};
  for(let i=0;i<90;i++)step('meditate');
  for(const pose of ['bow','meditate','pray','eat','sit','chant','bow','meditate']){
    const height=hip.position.y,previous=head.quaternion.clone();step(pose);
    assert.ok(Math.abs(hip.position.y-height)<.00001,`${pose}: hip moved from ${height} to ${hip.position.y}`);
    assert.ok(previous.angleTo(head.quaternion)<.13,`${pose}: head snapped on first frame`);
    for(let i=0;i<90;i++)step(pose,i/60);
    assert.ok(Math.abs(hip.position.y-.078)<.00001);
  }
});
