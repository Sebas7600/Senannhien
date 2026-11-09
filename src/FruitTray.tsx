import * as THREE from 'three';
import {coloredGeometry,batchGeometry} from './geometryBatch';
const fruitGeometry=batchGeometry(Array.from({length:6},(_,i)=>{
  const top=i===5,a=i*2.4,x=top?0:Math.sin(a)*.12,z=top?0:Math.cos(a)*.12;
  return coloredGeometry(new THREE.SphereGeometry(1,9,6),['#b4be69','#e0a24e','#a1b465'][i%3],[x,top?.21:.09,z],[.087,.095,.087]);
}));
const fruits=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65});
export default function FruitTray(){return <group dispose={null}><mesh position={[0,.025,0]}><cylinderGeometry args={[.245,.18,.05,20]}/><meshStandardMaterial color="#c0a467" metalness={.5} roughness={.4}/></mesh><mesh geometry={fruitGeometry} material={fruits}/></group>}
