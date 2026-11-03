import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CuboidCollider,type RapierRigidBody} from '@react-three/rapier';
import * as THREE from 'three';
import {useGame} from './gameStore';
import {BODHI} from './bodhiData';
function PhysicalLeaf({index}:{index:number}){
  const body=useRef<RapierRigidBody>(null),mesh=useRef<THREE.Mesh>(null),collectedAt=useRef(0);
  const start=useMemo(()=>{const a=index*2.399,r=4.0+(index%8)*.45;return {x:BODHI.x+Math.sin(a)*r,z:BODHI.z+Math.cos(a)*r}},[index]);
  useFrame(()=>{if(!body.current||!mesh.current)return;const now=Date.now(),elapsed=now-collectedAt.current;
    if(collectedAt.current){if(elapsed>90000){body.current.setEnabled(true);body.current.setTranslation({x:start.x,y:.22,z:start.z},true);body.current.setLinvel({x:0,y:0,z:0},true);mesh.current.visible=true;collectedAt.current=0;}else if(elapsed>1300){mesh.current.visible=false;body.current.setEnabled(false);}return;}
    const s=useGame.getState();if(s.action!=='sweep')return;const p=body.current.translation();if(Math.hypot(p.x-s.position[0],p.z-s.position[1])<1.8){collectedAt.current=now;body.current.applyImpulse({x:(-11-p.x)*.0018,y:.007,z:(6-p.z)*.0018},true);s.record('sweep');}
  });
  return <RigidBody ref={body} position={[start.x,.18,start.z]} type="dynamic" colliders={false} mass={.012} linearDamping={1.8} angularDamping={3} enabledRotations={[false,true,false]}><CuboidCollider args={[.15,.015,.08]}/><mesh ref={mesh} rotation={[-Math.PI/2,0,index]} scale={[.26,.13,1]}><circleGeometry args={[1,5]}/><meshStandardMaterial color={index%2?'#ae9760':'#ba9b64'} side={THREE.DoubleSide}/></mesh></RigidBody>;
}
export default function PhysicalLeaves(){return <>{Array.from({length:28},(_,i)=><PhysicalLeaf key={i} index={i}/>)}</>}
