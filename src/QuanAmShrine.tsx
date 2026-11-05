import {memo,useMemo} from 'react';import {useGLTF} from '@react-three/drei';import * as T from 'three';import {useGame} from './gameStore';import {NearbyOverlay} from './Environment';import {QUAN_AM,nearQuanAm} from './quanAmData';import {quanAmMarbleMaterial,quanAmGoldMaterial,quanAmLotusMaterial} from './quanAmMaterials';import {quanAmStoneGeometry,quanAmBronzeGeometry,quanAmCeramicGeometry,quanAmFlowersGeometry,quanAmGreenGeometry,altarStoneMaterial,altarBronzeMaterial,altarCeramicMaterial,altarFlowerMaterial} from './quanAmAltarGeometry';import IncenseSticks from './IncenseSticks';import {INCENSE_BURN_MS} from './gameData';import AltarSmoke from './AltarSmoke';
function QuanAmShrine(){const low=useGame(s=>s.quality==='low'),burning=useGame(s=>s.burningIncense),slots=useGame(s=>s.offeringSlots);useGame(s=>s.sessionSeconds);const {scene}=useGLTF(`/assets/quan-am/quan-am-v1${low?'-low':''}.glb`,false,true);
 const model=useMemo(()=>{const root=scene.clone(true);root.traverse(o=>{if(!(o instanceof T.Mesh))return;const name=(o.material as T.Material).name;o.material=name==='Vang_tram'?quanAmGoldMaterial:name==='Dai_sen_hong_da'?quanAmLotusMaterial:quanAmMarbleMaterial;o.castShadow=!low;o.receiveShadow=true;});return root},[scene,low]);
 const times=useMemo(()=>burning.filter(at=>slots[at]===QUAN_AM.incenseId).slice(-24),[burning,slots]),lit=times.some(at=>Date.now()-at<INCENSE_BURN_MS),offer=()=>useGame.getState().perform('incense',QUAN_AM.incenseId);
 return <group name="Quan-The-Am-Bo-Tat" dispose={null}>
  <group position={[QUAN_AM.x,QUAN_AM.ground,QUAN_AM.z]} rotation={[0,QUAN_AM.rotation,0]}>
   <group position={[0,QUAN_AM.pedestalHeight,0]}><primitive object={model}/></group>
   <mesh geometry={quanAmStoneGeometry} material={altarStoneMaterial} receiveShadow/>
   <group onClick={e=>{if(e.delta>5)return;e.stopPropagation();offer()}}><mesh geometry={quanAmBronzeGeometry} material={altarBronzeMaterial}/></group>
   <mesh geometry={quanAmCeramicGeometry} material={altarCeramicMaterial}/><mesh geometry={quanAmFlowersGeometry} material={altarFlowerMaterial}/><mesh geometry={quanAmGreenGeometry} material={altarFlowerMaterial}/>
  </group>
  {times.length>0&&<IncenseSticks times={times} origin={[QUAN_AM.tableX,QUAN_AM.tableZ]} ashY={QUAN_AM.ashY} radiusScale={.4} heightScale={.5}/>}
  <AltarSmoke position={[QUAN_AM.tableX,QUAN_AM.ashY+.4,QUAN_AM.tableZ]} lit={lit}/>
  <NearbyOverlay position={[QUAN_AM.tableX,2.2,QUAN_AM.z]} maxDistance={13}><button className="npc-tag" onClick={offer}><strong>QUÁN THẾ ÂM BỒ TÁT</strong><span>{nearQuanAm(useGame.getState().position)?'Dâng một nén hương · E':'Ghé bàn hương · Một niệm an lành'}</span></button></NearbyOverlay>
 </group>;
}
export default memo(QuanAmShrine);
