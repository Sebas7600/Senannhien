import InitialIncense from './InitialIncense';
import {incenseAtStation} from './incenseStations';
import IncenseSticks from './IncenseSticks';
import {BODHI_INCENSE} from './ritualStations.mjs';
import {INCENSE_BURN_MS} from './gameData';
import AltarSmoke from './AltarSmoke';
import {memo,useMemo,useRef} from 'react';
import {RigidBody,CylinderCollider,CuboidCollider} from '@react-three/rapier';
import * as THREE from 'three';
import {canopyGeometry,foliageMaterial} from './foliage';
import {bodhiBarkGeometry,bodhiStoneGeometry,bodhiMetalGeometry,bodhiOfferingsGeometry} from './bodhiGeometry';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {useGame} from './gameStore';
import {useCameraOccluder} from './cameraObstruction';
import {useOutdoorSurface} from './materials';
const stoneMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87}),metalMaterial=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.55,roughness:.51}),fruitMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
function IncenseSmoke({lit}:{lit:boolean}){return <AltarSmoke position={[0,1.4,BODHI.altarZ]} lit={lit}/>;}
function BodhiTree({interactive=true}:{interactive?:boolean}){const crown=useRef<THREE.Mesh>(null);useCameraOccluder(crown);const burning=useGame(s=>s.burningIncense),slots=useGame(s=>s.offeringSlots);useGame(s=>s.sessionSeconds);
  const times=useMemo(()=>interactive?incenseAtStation(burning,slots,BODHI_INCENSE.id).slice(-12):[],[interactive,burning,slots]),lit=times.some(at=>Date.now()-at<INCENSE_BURN_MS);
  const barkMaterial=useOutdoorSurface('bark');
  const offer=()=>{const s=useGame.getState();if(!nearBodhiAltar(s.position)){s.stand();s.set({destination:[...BODHI.offeringPoint]});s.notify('Đến trước bàn thờ bồ đề để dâng hương.')}else s.perform('incense',BODHI_INCENSE.id)};
  return <group name="Bo-de-tan-khoi" dispose={null}>
    <mesh geometry={bodhiBarkGeometry} material={barkMaterial} castShadow={!interactive} receiveShadow/>
    <mesh ref={crown} position={[0,.5,0]} scale={[1.9,1.55,1.9]} geometry={canopyGeometry} material={foliageMaterial} castShadow={!interactive} receiveShadow/>
    <group onClick={interactive?e=>{if(e.delta>5)return;e.stopPropagation();offer()}:undefined}>
      <mesh geometry={bodhiStoneGeometry} material={stoneMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiMetalGeometry} material={metalMaterial} castShadow receiveShadow/>
      <mesh geometry={bodhiOfferingsGeometry} material={fruitMaterial} castShadow receiveShadow/>
    </group>
    {<InitialIncense station={interactive?BODHI_INCENSE.id:'bodhi-right'} origin={[0,BODHI.altarZ]} ashY={1.084} radiusScale={.2} heightScale={.45} thicknessScale={.7}/>}
    {interactive&&times.length>0&&<IncenseSticks times={times} origin={[0,BODHI.altarZ]} ashY={1.084} radiusScale={.2} heightScale={.45} thicknessScale={.7}/>}
    <IncenseSmoke lit={lit}/>
    {interactive&&<RigidBody type="fixed" colliders={false}><CylinderCollider position={[0,BODHI.wallHeight/2,0]} args={[BODHI.wallHeight/2,BODHI.radius]}/><CylinderCollider position={[0,2,0]} args={[2,1.0]}/><CuboidCollider position={[0,.46,BODHI.altarZ]} args={[.84,.42,.40]}/></RigidBody>}
  </group>;
}
export default memo(BodhiTree);
