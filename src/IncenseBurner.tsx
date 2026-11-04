import {useMemo,useRef,useLayoutEffect} from 'react';
import * as THREE from 'three';
import {incenseSpot} from './gameData';
export const INCENSE_ASH_Y=.875;
export function incensePlacement(at:number){
  const random=(salt:number)=>{const n=Math.sin(at*.001+salt*127.1)*43758.5453;return n-Math.floor(n)};
  const angle=random(1)*Math.PI*2,radius=Math.sqrt(random(2))*.39;
  return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,leanX:(random(3)-.5)*.24,leanZ:(random(4)-.5)*.24,length:.7+random(5)*.2};
}
export default function IncenseBurner(){
  const profile=useMemo(()=>[[.28,.19],[.39,.24],[.51,.39],[.57,.59],[.58,.77],[.56,.86],[.51,.86],[.51,.77],[.49,.62],[.42,.4],[.27,.25]].map(([r,y])=>new THREE.Vector2(r,y)),[]);
  const sand=useMemo(()=>{
    const size=128,data=new Uint8Array(size*size*4);let seed=27183;
    for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=(seed/4294967296-.5)*65;data[i*4]=153+grain;data[i*4+1]=127+grain;data[i*4+2]=87+grain;data[i*4+3]=255;}
    const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.needsUpdate=true;return texture;
  },[]);
  return <group position={[incenseSpot[0],.065,incenseSpot[1]]}>
    <mesh castShadow receiveShadow><latheGeometry args={[profile,64]}/><meshStandardMaterial color="#71553a" metalness={.72} roughness={.4} side={THREE.DoubleSide}/></mesh>
    {[.77,.85].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.555,.025,12,64]}/><meshStandardMaterial color="#ac8551" metalness={.8} roughness={.32}/></mesh>)}
    <mesh position={[0,.79,0]} receiveShadow><cylinderGeometry args={[.51,.48,.035,64]}/><meshStandardMaterial map={sand} bumpMap={sand} bumpScale={.018} color="#b39a70" roughness={1}/></mesh>
    <SandGrains/>
    {[0,1,2].map(i=>{const a=i*Math.PI*2/3;return <mesh key={i} position={[Math.cos(a)*.31,.14,Math.sin(a)*.31]} rotation={[Math.sin(a)*.22,0,-Math.cos(a)*.22]} castShadow><capsuleGeometry args={[.065,.16,6,12]}/><meshStandardMaterial color="#705237" metalness={.75} roughness={.4}/></mesh>})}
    {[-1,1].map(side=><mesh key={side} position={[side*.62,.62,0]} castShadow><torusGeometry args={[.14,.035,12,32]}/><meshStandardMaterial color="#a07b46" metalness={.8} roughness={.35}/></mesh>)}
    {[.36,.42].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[y===.36?.49:.52,.012,8,64]}/><meshStandardMaterial color="#ab854f" metalness={.7} roughness={.45}/></mesh>)}
  </group>;
}

/** Sand detail shares geometry/material instead of allocating 90 separate meshes. */
function SandGrains(){const ref=useRef<THREE.InstancedMesh>(null);useLayoutEffect(()=>{if(!ref.current)return;const pose=new THREE.Object3D();for(let i=0;i<90;i++){const a=i*2.39996,r=Math.sqrt((i+.5)/90)*.48,size=.006+(i%4)*.002;pose.position.set(Math.cos(a)*r,.814,Math.sin(a)*r);pose.scale.set(size,size*.45,size);pose.updateMatrix();ref.current.setMatrixAt(i,pose.matrix);ref.current.setColorAt(i,new THREE.Color(['#8e7959','#bdac87','#76634b','#a7926c'][i%4]))}ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere()},[]);return <instancedMesh ref={ref} args={[undefined,undefined,90]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color="#ffffff" roughness={1}/></instancedMesh>}
