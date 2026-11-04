import {useLayoutEffect,useMemo,useRef} from 'react';
import {useStore} from 'zustand';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {RigidBody,CuboidCollider,type RapierRigidBody} from '@react-three/rapier';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {gateState} from './gateState';
import {GATE,BELL_PROP,DRUM_PROP,gateMasonry,gateLeafPose,inGateSweep} from './courtyardPropsData';
import {bellAngle} from './ritualMotion';
import {useReducedMotion} from './useReducedMotion';
import {NearbyOverlay} from './Environment';
import {toggleTempleGate} from './gateActions';

// Cached high/low models share material/texture objects; switching quality does not double GPU textures.
const materials=new Map<string,THREE.Material>();
function useProp(kind:'gate'|'bell'|'drum'){
  const low=useGame(s=>s.quality==='low'),file=kind==='gate'?(low?GATE.lowFile:GATE.highFile):`${kind}${low?'-low':''}.glb`,{scene}=useGLTF(`/assets/courtyard/${file}`,false,true);
  return useMemo(()=>{const model=scene.clone(true);model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const m=o.material as THREE.MeshStandardMaterial,key=kind+':'+m.name;let shared=materials.get(key);if(!shared){m.envMapIntensity=.9;for(const texture of [m.map,m.normalMap])if(texture)texture.anisotropy=4;materials.set(key,m);shared=m;}o.material=shared;o.castShadow=!low;o.receiveShadow=true;});return model;},[scene,kind,low]);
}
export function ImportedGate(){
  const model=useProp('gate'),open=useStore(gateState,s=>s.open),reduced=useReducedMotion(),progress=useRef(open?1:0),bodies=useRef<(RapierRigidBody|null)[]>([null,null]),q=useRef(new THREE.Quaternion());
  const initialPoses=useRef([gateLeafPose(-1,progress.current),gateLeafPose(1,progress.current)]),applied=useRef<THREE.Group|null>(null);
  const leaves=useMemo(()=>({left:model.getObjectByName('Central_Door_Left')!,right:model.getObjectByName('Central_Door_Right')!,bar:model.getObjectByName('Door_Crossbar')!}),[model]);
  useLayoutEffect(()=>{applied.current=null;leaves.left.rotation.y=GATE.openAngle*progress.current;leaves.right.rotation.y=-GATE.openAngle*progress.current;leaves.bar.visible=progress.current<.01},[leaves]);
  useFrame((_,dt)=>{const target=open?1:0;if(progress.current===target&&applied.current===model)return;const s=useGame.getState();if(!open&&progress.current>.01&&(inGateSweep(s.position)||s.peers.some(p=>inGateSweep([p.x,p.z])))){gateState.setState({open:true});s.notify('Cổng mở lại để nhường lối cho người đang đi qua.');return;}progress.current=reduced?target:THREE.MathUtils.damp(progress.current,target,5,Math.min(dt,.05));if(Math.abs(progress.current-target)<.0001)progress.current=target;applied.current=model;const t=progress.current;leaves.left.rotation.y=GATE.openAngle*t;leaves.right.rotation.y=-GATE.openAngle*t;leaves.bar.visible=t<.01;
    for(let i=0;i<2;i++){const pose=gateLeafPose(i===0?-1:1,t),body=bodies.current[i];if(body){body.setNextKinematicTranslation({x:pose.x,y:pose.y,z:pose.z});q.current.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,pose.angle);body.setNextKinematicRotation(q.current);}}
  });
  return <group dispose={null}>
    <group position={[GATE.x,GATE.y,GATE.z]} scale={GATE.scale} onClick={e=>{if(e.delta>5)return;e.stopPropagation();toggleTempleGate();}}><primitive object={model}/></group>
    <RigidBody type="fixed" colliders={false}>{gateMasonry.map((p,i)=><CuboidCollider key={i} position={[GATE.x+p.x*GATE.scale,GATE.y+p.y*GATE.scale,GATE.z+p.z*GATE.scale]} args={[p.w*GATE.scale/2,p.h*GATE.scale/2,p.d*GATE.scale/2]}/>)}</RigidBody>
    {([-1,1] as const).map((side,i)=>{const p=initialPoses.current[i];return <RigidBody key={side} ref={body=>{bodies.current[i]=body}} type="kinematicPosition" colliders={false} position={[p.x,p.y,p.z]} rotation={[0,p.angle,0]}><CuboidCollider args={[GATE.leafWidth*GATE.scale/2,GATE.leafHeight*GATE.scale/2,.16*GATE.scale]}/></RigidBody>})}
    <NearbyOverlay position={[0,5.9,29]} maxDistance={11}><button className="npc-tag" onClick={toggleTempleGate}>{open?'Khép cổng tam quan':'Mở cổng tam quan'}<span>Chạm để {open?'đóng':'mở'} hai cánh cửa</span></button></NearbyOverlay>
  </group>;
}
export function ImportedBell(){
  const model=useProp('bell'),reduced=useReducedMotion(),bell=useMemo(()=>model.getObjectByName('Bell')!,[model]);
  useFrame(()=>{const c=useGame.getState().ceremony;bell.rotation.z=c?.type==='bell'?bellAngle(Date.now()-c.at,reduced):0;});
  return <group position={[0,.4,0]} scale={BELL_PROP.scale} dispose={null}><primitive object={model}/></group>;
}
export function ImportedDrum(){const model=useProp('drum');return <group position={[0,.4,0]} scale={DRUM_PROP.scale} dispose={null}><primitive object={model}/></group>;}
