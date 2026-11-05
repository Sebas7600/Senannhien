import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {flameFlicker} from './fireMotion';
import {useReducedMotion} from './useReducedMotion';
import type {Vec3} from './gameData';

const flameGeometry=new THREE.SphereGeometry(1,8,8);
const outer=new THREE.MeshBasicMaterial({color:'#f4a436',transparent:true,opacity:.65,depthWrite:false});
const inner=new THREE.MeshBasicMaterial({color:'#fff2bd'});
const halo=new THREE.MeshBasicMaterial({color:'#ffad40',transparent:true,opacity:.065,depthWrite:false,blending:THREE.AdditiveBlending});

export interface FlamePoint {position:Vec3;scale?:number;seed?:number}
const flameLayers=[{material:outer,y:.055,x:.035,h:.095},{material:inner,y:.025,x:.018,h:.05},{material:halo,y:.06,x:.16,h:.22}];
/** The altar's three-layer flame and warm halo, batched for all twenty reading desks. */
export function SacredFlames({points}:{points:FlamePoint[]}){
  const refs=useRef<(THREE.InstancedMesh|null)[]>([]),object=useRef(new THREE.Object3D()),parent=useRef(new THREE.Object3D()),matrix=useRef(new THREE.Matrix4()),reduced=useReducedMotion();
  function update(t:number){
    points.forEach(({position,scale=1,seed=0},i)=>{
      const f=flameFlicker(t,seed,reduced),root=parent.current,m=object.current;root.position.set(...position);root.scale.set(scale*(2-f),scale*f,scale*(2-f));root.rotation.z=reduced?0:Math.sin(t*5.3+seed)*.055;root.updateMatrix();
      flameLayers.forEach((layer,j)=>{m.position.set(0,layer.y,0);m.scale.set(layer.x,layer.h,layer.x);m.updateMatrix();matrix.current.multiplyMatrices(root.matrix,m.matrix);refs.current[j]?.setMatrixAt(i,matrix.current);});
    });
    refs.current.forEach(mesh=>{if(mesh)mesh.instanceMatrix.needsUpdate=true;});
  }
  useLayoutEffect(()=>{update(0);refs.current.forEach(mesh=>mesh?.computeBoundingSphere());},[points,reduced]);
  useFrame(({clock})=>{if(!reduced)update(clock.elapsedTime)});
  return <group dispose={null}>{flameLayers.map((layer,i)=><instancedMesh key={i} ref={mesh=>{refs.current[i]=mesh}} args={[flameGeometry,layer.material,points.length]} frustumCulled={false}/>)}</group>;
}
/** No shadow maps or per-flame point lights on mobile. */
export function SacredFlame({position=[0,0,0],scale=1,seed=0}:Partial<FlamePoint>){return <SacredFlames points={[{position,scale,seed}]}/>;}
const waxGeometry=new THREE.CylinderGeometry(1,1,1,12),wickGeometry=new THREE.CylinderGeometry(.008,.008,.025,5);
const waxMaterial=new THREE.MeshStandardMaterial({color:'#f5deb0',emissive:'#c67e2b',emissiveIntensity:.10,roughness:.8}),wickMaterial=new THREE.MeshBasicMaterial({color:'#50342a'});
/** Base-anchored candle, shared by the altar, floating lotus and replaceable lantern skin. */
export function SacredCandle({position=[0,0,0],height=.18,radius=.055,flameScale=1,seed=0}:{position?:Vec3;height?:number;radius?:number;flameScale?:number;seed?:number}){return <group position={position} dispose={null}>
  <mesh position={[0,height/2,0]} scale={[radius,height,radius]} geometry={waxGeometry} material={waxMaterial}/>
  <mesh position={[0,height+.007,0]} geometry={wickGeometry} material={wickMaterial}/>
  <SacredFlame position={[0,height+.009,0]} scale={flameScale} seed={seed}/>
</group>}

const smokeGeometry=new THREE.SphereGeometry(1,7,5);
const smokeMaterial=new THREE.MeshBasicMaterial({color:'#e4dbce',transparent:true,opacity:.075,depthWrite:false});
export function IncenseSmoke({position=[0,0,0]}:{position?:Vec3}){
  const ref=useRef<THREE.InstancedMesh>(null),particle=useRef(new THREE.Object3D()),reduced=useReducedMotion();
  useFrame(({clock})=>{if(!ref.current)return;const p=particle.current;for(let i=0;i<14;i++){const t=reduced?i/14:(clock.elapsedTime*.16+i/14)%1;p.position.set(Math.sin(t*9+i*.13)*t*.18,t*1.15,Math.cos(t*7)*t*.055);p.scale.set(.025+t*.085,.085+t*.16,.025+t*.07);p.updateMatrix();ref.current.setMatrixAt(i,p.matrix);}ref.current.instanceMatrix.needsUpdate=true;});
  return <instancedMesh ref={ref} position={position} args={[smokeGeometry,smokeMaterial,14]} frustumCulled={false} dispose={null}/>;
}
