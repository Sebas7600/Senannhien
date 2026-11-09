import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useGame,type Wish} from './gameStore';
import {lanternPose,floatingLotusPose,LANTERN_LIFETIME,WISH_STATION} from './ritualMotion';
import {LanternPresentation} from './LanternModel';
import {SacredCandle} from './FireEffects';
import {useReducedMotion} from './useReducedMotion';
import {NearbyOverlay} from './Environment';

const lotusPetals=mergeGeometries(Array.from({length:8},(_,i)=>{
  const angle=i*Math.PI/4,object=new THREE.Object3D();object.position.set(Math.cos(angle)*.22,.12,Math.sin(angle)*.22);object.rotation.set(Math.sin(angle)*.75,0,-Math.cos(angle)*.75);object.scale.set(.11,.26,.11);object.updateMatrix();return new THREE.SphereGeometry(1,10,8).applyMatrix4(object.matrix);
}));
const lotusBase=new THREE.CylinderGeometry(.36,.32,.07,16);
const petalMaterial=new THREE.MeshStandardMaterial({color:'#edbea8',emissive:'#ba6651',emissiveIntensity:.25,roughness:.7});
const baseMaterial=new THREE.MeshStandardMaterial({color:'#9a9965'});
export function LotusLantern(){return <group dispose={null}>
  <mesh geometry={lotusBase} material={baseMaterial}/><mesh geometry={lotusPetals} material={petalMaterial}/>
  <SacredCandle position={[0,.055,0]} height={.15} radius={.055} flameScale={1.15}/>
</group>}

function FlyingLantern({wish}:{wish:Wish}){
  const ref=useRef<THREE.Group>(null),reduced=useReducedMotion();
  const pose=useRef({position:[0,0,0] as [number,number,number],rotation:0,scale:1});
  useFrame(()=>{if(!ref.current)return;const age=Date.now()-wish.at;lanternPose(age,wish.at,reduced,pose.current);ref.current.visible=age>=0&&age<LANTERN_LIFETIME;ref.current.position.set(...pose.current.position);ref.current.rotation.z=pose.current.rotation;ref.current.scale.setScalar(pose.current.scale*1.2);});
  return <group ref={ref}><LanternPresentation variant={wish.at%4}/></group>;
}
export function FlyingLanterns(){const flights=useGame(s=>s.flights);return <>{flights.map(w=><FlyingLantern key={w.at} wish={w}/>)}</>}
function DriftingLotus({index}:{index:number}){const ref=useRef<THREE.Group>(null),reduced=useReducedMotion(),point=useRef<[number,number,number]>([0,0,0]);useFrame(({clock})=>{if(!ref.current)return;floatingLotusPose(reduced?0:clock.elapsedTime,index,point.current);ref.current.position.set(...point.current);ref.current.rotation.y=reduced?index:clock.elapsedTime*.025+index;});return <group ref={ref}><LotusLantern/></group>}
export function FloatingLotuses(){return <>{Array.from({length:6},(_,i)=><DriftingLotus index={i} key={i}/>)}</>}
export function WishStation(){return <group position={[WISH_STATION[0],.08,WISH_STATION[1]]} onClick={e=>{e.stopPropagation();useGame.getState().perform('lantern')}}>
  <mesh position={[0,.28,0]}><cylinderGeometry args={[.65,.78,.5,16]}/><meshStandardMaterial color="#a69a74"/></mesh>
  <group position={[0,.85,0]} scale={.65}><LanternPresentation/></group>
  <NearbyOverlay position={[0,1.65,0]} distanceFactor={6.5} maxDistance={13}><button className="wish-station-tag" onClick={()=>useGame.getState().perform('lantern')}><span>✧</span> Viết lời nguyện<small>Đài hoa đăng · Hồ sen</small></button></NearbyOverlay>
</group>}
