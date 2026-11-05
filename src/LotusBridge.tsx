import {RigidBody,CuboidCollider} from '@react-three/rapier';
import {useSurface} from './materials';
import {LOTUS_POND,lotusBridgeSegments} from './lotusLayout';
import {lotusDeckGeometry,lotusRailingGeometry,lotusStringerGeometry,lotusAbutmentGeometry} from './lotusGeometry';

export default function LotusBridge(){
  const stone=useSurface('stone','#b5af9c'),wood=useSurface('wood','#bd9d68'),beam=useSurface('wood','#88724f');
  return <group name="Cau-cong-ho-sen" dispose={null}>
    <mesh geometry={lotusDeckGeometry} material={stone} receiveShadow castShadow/>
    <mesh geometry={lotusRailingGeometry} material={wood} castShadow receiveShadow/>
    <mesh geometry={lotusStringerGeometry} material={beam} castShadow/>
    <mesh geometry={lotusAbutmentGeometry} material={stone} castShadow receiveShadow/>
  </group>;
}
export function LotusBridgeCollision(){return <RigidBody type="fixed" colliders={false}>
  {lotusBridgeSegments.map((s,i)=><group key={i}>
    <CuboidCollider position={[s.deckX,s.deckY,LOTUS_POND.z]} rotation={[0,0,s.angle]} args={[(s.length+.008)/2,.07,LOTUS_POND.bridgeHalfWidth]}/>
    {[-1,1].map(side=><CuboidCollider key={side} position={[s.x,s.y+.45,LOTUS_POND.z+side*1.55]} rotation={[0,0,s.angle]} args={[(s.length+.012)/2,.5,.055]}/>)}
  </group>)}
</RigidBody>}
