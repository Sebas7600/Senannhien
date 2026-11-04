import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {flameFlicker} from './fireMotion';
import {useReducedMotion} from './useReducedMotion';
import type {Vec3} from './gameData';

const flameGeometry=new THREE.SphereGeometry(1,8,8);
const outer=new THREE.MeshBasicMaterial({color:'#f4a436',transparent:true,opacity:.65,depthWrite:false});
const inner=new THREE.MeshBasicMaterial({color:'#fff2bd'});
const halo=new THREE.MeshBasicMaterial({color:'#ffad40',transparent:true,opacity:.065,depthWrite:false,blending:THREE.AdditiveBlending});

/** Reusable candle flame. No shadow maps or per-flame point lights on mobile. */
export function SacredFlame({position=[0,0,0],scale=1,seed=0}:{position?:Vec3;scale?:number;seed?:number}){
  const ref=useRef<THREE.Group>(null),reduced=useReducedMotion();
  useFrame(({clock})=>{if(!ref.current)return;const t=clock.elapsedTime,f=flameFlicker(t,seed,reduced);ref.current.scale.set(scale*(2-f),scale*f,scale*(2-f));ref.current.rotation.z=reduced?0:Math.sin(t*5.3+seed)*.055;});
  return <group position={position}><group ref={ref} scale={scale} dispose={null}>
    <mesh position={[0,.055,0]} scale={[.035,.095,.035]} geometry={flameGeometry} material={outer}/>
    <mesh position={[0,.025,0]} scale={[.018,.05,.018]} geometry={flameGeometry} material={inner}/>
    <mesh position={[0,.06,0]} scale={[.16,.22,.16]} geometry={flameGeometry} material={halo}/>
  </group></group>;
}

const smokeGeometry=new THREE.SphereGeometry(1,7,5);
const smokeMaterial=new THREE.MeshBasicMaterial({color:'#e4dbce',transparent:true,opacity:.075,depthWrite:false});
export function IncenseSmoke({position=[0,0,0]}:{position?:Vec3}){
  const ref=useRef<THREE.InstancedMesh>(null),particle=useRef(new THREE.Object3D()),reduced=useReducedMotion();
  useFrame(({clock})=>{if(!ref.current)return;const p=particle.current;for(let i=0;i<14;i++){const t=reduced?i/14:(clock.elapsedTime*.16+i/14)%1;p.position.set(Math.sin(t*9+i*.13)*t*.18,t*1.15,Math.cos(t*7)*t*.055);p.scale.set(.025+t*.085,.085+t*.16,.025+t*.07);p.updateMatrix();ref.current.setMatrixAt(i,p.matrix);}ref.current.instanceMatrix.needsUpdate=true;});
  return <instancedMesh ref={ref} position={position} args={[smokeGeometry,smokeMaterial,14]} frustumCulled={false} dispose={null}/>;
}
