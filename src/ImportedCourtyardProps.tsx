import {useLayoutEffect,useMemo,useRef} from 'react';
import {useStore} from 'zustand';
import {useFrame} from '@react-three/fiber';
import {useCourtyardProp} from './courtyardModels';
import {RigidBody,CuboidCollider,type RapierRigidBody} from '@react-three/rapier';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {gateState} from './gateState';
import {GATE,BELL_PROP,DRUM_PROP,gateMasonry,gateLeafPose,inGateSweep} from './courtyardPropsData';
import {bellAngle} from './ritualMotion';
import {useReducedMotion} from './useReducedMotion';
import {NearbyOverlay} from './Environment';
import {toggleTempleGate} from './gateActions';
import {useCameraOccluder} from './cameraObstruction';
import {finishInstanceLayout} from './geometryBatch';

export function ImportedGate(){
  const model=useCourtyardProp('gate'),open=useStore(gateState,s=>s.open),reduced=useReducedMotion(),progress=useRef(open?1:0),bodies=useRef<(RapierRigidBody|null)[]>([null,null]),q=useRef(new THREE.Quaternion());
  const initialPoses=useRef([gateLeafPose(-1,progress.current),gateLeafPose(1,progress.current)]),applied=useRef<THREE.Group|null>(null);
  const leaves=useMemo(()=>({left:model.getObjectByName('Central_Door_Left')!,right:model.getObjectByName('Central_Door_Right')!,bar:model.getObjectByName('Door_Crossbar')!}),[model]);
  useLayoutEffect(()=>{applied.current=null;leaves.left.rotation.y=GATE.openAngle*progress.current;leaves.right.rotation.y=-GATE.openAngle*progress.current;leaves.bar.visible=progress.current<.01},[leaves]);
  useFrame((_,dt)=>{const target=open?1:0;if(progress.current===target&&applied.current===model)return;const s=useGame.getState();if(!open&&progress.current>.01&&(inGateSweep(s.position)||s.peers.some(p=>inGateSweep([p.x,p.z])))){gateState.setState({open:true});s.notify('Cổng mở lại để nhường lối cho người đang đi qua.');return;}progress.current=reduced?target:THREE.MathUtils.damp(progress.current,target,5,Math.min(dt,.05));if(Math.abs(progress.current-target)<.0001)progress.current=target;applied.current=model;const t=progress.current;leaves.left.rotation.y=GATE.openAngle*t;leaves.right.rotation.y=-GATE.openAngle*t;leaves.bar.visible=t<.01;
    for(let i=0;i<2;i++){const pose=gateLeafPose(i===0?-1:1,t),body=bodies.current[i];if(body){body.setNextKinematicTranslation({x:pose.x,y:pose.y,z:pose.z});q.current.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,pose.angle);body.setNextKinematicRotation(q.current);}}
  });
  return <group dispose={null}>
    <group position={[GATE.x,GATE.y,GATE.z]} scale={GATE.scale} onClick={e=>{if(e.delta>5)return;e.stopPropagation();toggleTempleGate();}}><primitive object={model}/></group>
    <GateCameraBounds open={open}/>
    <RigidBody type="fixed" colliders={false}>{gateMasonry.map((p,i)=><CuboidCollider key={i} position={[GATE.x+p.x*GATE.scale,GATE.y+p.y*GATE.scale,GATE.z+p.z*GATE.scale]} args={[p.w*GATE.scale/2,p.h*GATE.scale/2,p.d*GATE.scale/2]}/>)}</RigidBody>
    {([-1,1] as const).map((side,i)=>{const p=initialPoses.current[i];return <RigidBody key={side} ref={body=>{bodies.current[i]=body}} type="kinematicPosition" colliders={false} position={[p.x,p.y,p.z]} rotation={[0,p.angle,0]}><CuboidCollider args={[GATE.leafWidth*GATE.scale/2,GATE.leafHeight*GATE.scale/2,.16*GATE.scale]}/></RigidBody>})}
    <NearbyOverlay position={[GATE.x,GATE.y+5.84,GATE.z]} maxDistance={GATE.interactionRange} distanceFactor={7}><button className="npc-tag" onClick={toggleTempleGate}>{open?'Khép cổng tam quan':'Mở cổng tam quan'}<span>Chạm để {open?'đóng':'mở'} hai cánh cửa</span></button></NearbyOverlay>
  </group>;
}
function GateCameraBounds({open}:{open:boolean}){
  const ref=useRef<THREE.InstancedMesh>(null);
  useCameraOccluder(ref);
  useLayoutEffect(()=>{
    const mesh=ref.current!;
    const box=new THREE.Object3D();
    gateMasonry.forEach((part,i)=>{
      box.position.set(GATE.x+part.x*GATE.scale,GATE.y+part.y*GATE.scale,GATE.z+part.z*GATE.scale);
      box.scale.set(part.w*GATE.scale,part.h*GATE.scale,part.d*GATE.scale);
      box.updateMatrix();
      mesh.setMatrixAt(i,box.matrix);
    });
    box.position.set(GATE.x,GATE.y+(GATE.hingeY+GATE.leafHeight/2)*GATE.scale,GATE.z);
    box.scale.set(GATE.leafWidth*GATE.scale*2,GATE.leafHeight*GATE.scale,.32*GATE.scale);
    box.updateMatrix();
    mesh.setMatrixAt(gateMasonry.length,box.matrix);
    mesh.count=gateMasonry.length+(open?0:1);
    finishInstanceLayout(mesh);
  },[open]);
  return <instancedMesh ref={ref} args={[undefined,undefined,gateMasonry.length+1]} visible={false}>
    <boxGeometry/>
    <meshBasicMaterial side={THREE.DoubleSide}/>
  </instancedMesh>;
}
export function ImportedBell(){
  const model=useCourtyardProp('bell'),reduced=useReducedMotion(),bell=useMemo(()=>model.getObjectByName('Bell')!,[model]);
  useFrame(()=>{const s=useGame.getState(),at=s.worldBellAt||(s.ceremony?.type==='bell'?s.ceremony.at:0);bell.rotation.z=at?bellAngle(Date.now()-at,reduced):0;});
  return <group position={[0,.4,0]} scale={BELL_PROP.scale} dispose={null}><primitive object={model}/></group>;
}
export function ImportedDrum(){const model=useCourtyardProp('drum');return <group position={[0,.4,0]} scale={DRUM_PROP.scale} dispose={null}><primitive object={model}/></group>;}
