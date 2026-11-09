import AltarSmoke from './AltarSmoke';
import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody,CylinderCollider,CuboidCollider} from '@react-three/rapier';
import * as THREE from 'three';
import {canopyGeometry,foliageMaterial} from './foliage';
import {bodhiBarkGeometry,bodhiStoneGeometry,bodhiMetalGeometry,bodhiOfferingsGeometry,incenseStickGeometry} from './bodhiGeometry';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {useGame} from './gameStore';
import {useCameraOccluder} from './cameraObstruction';
import {useOutdoorSurface} from './materials';
const stoneMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87}),metalMaterial=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.55,roughness:.51}),fruitMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}),stickMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
function IncenseSmoke({lit}:{lit:boolean}){return <AltarSmoke position={[0,1.4,BODHI.altarZ]} lit={lit}/>;}
function BodhiTree({interactive=true}:{interactive?:boolean}){const crown=useRef<THREE.Mesh>(null);useCameraOccluder(crown);const offerings=useGame(s=>s.bodhiIncense),sticks=useRef<THREE.InstancedMesh>(null),lit=interactive?offerings>0:true;
  const barkMaterial=useOutdoorSurface('bark');
  useLayoutEffect(()=>{if(!sticks.current)return;const object=new THREE.Object3D(),count=3+Math.min(offerings,9);sticks.current.count=count;for(let i=0;i<count;i++){const angle=i*2.399,r=.02+(i%3)*.025;object.position.set(Math.sin(angle)*r,1.08,BODHI.altarZ+Math.cos(angle)*r);object.rotation.set(Math.sin(i)*.07,0,Math.cos(i)*.07);object.updateMatrix();sticks.current.setMatrixAt(i,object.matrix)}sticks.current.instanceMatrix.needsUpdate=true;sticks.current.computeBoundingSphere()},[offerings]);
  const offer=()=>{const s=useGame.getState();if(!nearBodhiAltar(s.position)){s.stand();s.set({destination:[...BODHI.offeringPoint]});s.notify('Đến trước bàn thờ bồ đề để dâng hương.')}else s.perform('incense')};
  return <group name="Bo-de-tan-khoi" dispose={null}>
    <mesh geometry={bodhiBarkGeometry} material={barkMaterial} castShadow={!interactive} receiveShadow/>
    <mesh ref={crown} position={[0,.5,0]} scale={[1.9,1.55,1.9]} geometry={canopyGeometry} material={foliageMaterial} castShadow={!interactive} receiveShadow/>
    <group onClick={interactive?e=>{if(e.delta>5)return;e.stopPropagation();offer()}:undefined}>
      <mesh geometry={bodhiStoneGeometry} material={stoneMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiMetalGeometry} material={metalMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiOfferingsGeometry} material={fruitMaterial} castShadow receiveShadow/>
      <instancedMesh ref={sticks} args={[incenseStickGeometry,stickMaterial,12]} castShadow/>
    </group>
    <IncenseSmoke lit={lit}/>
    {interactive&&<RigidBody type="fixed" colliders={false}><CylinderCollider position={[0,BODHI.wallHeight/2,0]} args={[BODHI.wallHeight/2,BODHI.radius]}/><CylinderCollider position={[0,2,0]} args={[2,1.0]}/><CuboidCollider position={[0,.46,BODHI.altarZ]} args={[.84,.42,.40]}/></RigidBody>}
  </group>;
}
export default memo(BodhiTree);
