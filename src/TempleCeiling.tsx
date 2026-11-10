import {useGame} from './gameStore';
import {templeFixtures} from './templeFixtures';
import TempleBanners from './TempleBanners';
import CeilingOrnaments from './CeilingOrnaments';
import {useMemo,useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
function Inscription(){const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const c=canvas.getContext('2d')!;c.fillStyle='#69251d';c.fillRect(0,0,2048,512);c.strokeStyle='#d7b264';c.lineWidth=12;c.strokeRect(24,24,2000,464);c.lineWidth=3;c.strokeRect(46,46,1956,420);c.fillStyle='#f3d58a';c.textAlign='center';c.textBaseline='middle';c.font='bold 145px Georgia, serif';c.fillText('TỪ BI HỶ XẢ',1024,266);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map},[]);return <mesh position={[0,6.15,-6.8]}><boxGeometry args={[6.2,1.4,.12]}/><meshStandardMaterial map={texture} roughness={.8}/></mesh>}
function HangingLamp({x,z}:{x:number;z:number}){const night=useGame(s=>s.night);return <group position={[x,7.1,z]}><mesh position={[0,-1.4,0]}><cylinderGeometry args={[.012,.012,2.8,6]}/><meshStandardMaterial color='#b98d3c' metalness={.6}/></mesh><mesh position={[0,-3.05,0]} scale={[.32,.45,.32]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color='#e7a33e' emissive='#e99424' emissiveIntensity={night?1.8:.45} roughness={.6}/></mesh>{[-2.64,-3.46].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.13,.15,.07,16]}/><meshStandardMaterial color='#c5a45b' metalness={.7}/></mesh>)}<mesh position={[0,-3.64,0]}><coneGeometry args={[.045,.3,8]}/><meshStandardMaterial color='#993326'/></mesh></group>}

const pendantPositions=[[-8,-2.5],[0,-2.5],[8,-2.5],[-8,3.8],[0,3.8],[8,3.8]];
function PendantSet(){
 const rings=useRef<THREE.InstancedMesh>(null),wires=useRef<THREE.InstancedMesh>(null),beads=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{if(!rings.current||!wires.current||!beads.current)return;const p=new THREE.Object3D();let wi=0,bi=0;
 for(let r=0;r<pendantPositions.length;r++){const [x,z]=pendantPositions[r];p.position.set(x,5.35,z);p.rotation.set(Math.PI/2,0,0);p.scale.set(1,1,1);p.updateMatrix();rings.current.setMatrixAt(r,p.matrix);
 for(let k=0;k<3;k++){const a=k*Math.PI*2/3;p.rotation.set(0,0,0);p.position.set(x+Math.sin(a)*.85,6.2,z+Math.cos(a)*.85);p.scale.set(.007,1.7,.007);p.updateMatrix();wires.current.setMatrixAt(wi++,p.matrix)}
 for(let k=0;k<12;k++){const a=k*Math.PI/6,length=.22+(k%3)*.07,bx=x+Math.sin(a)*.85,bz=z+Math.cos(a)*.85;p.position.set(bx,5.35-length/2,bz);p.scale.set(.005,length,.005);p.updateMatrix();wires.current.setMatrixAt(wi++,p.matrix);p.position.set(bx,5.35-length-.026,bz);p.scale.set(.027,.033,.027);p.updateMatrix();beads.current.setMatrixAt(bi++,p.matrix)}
 }for(const m of [rings.current,wires.current,beads.current]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()}},[]);
 return <group><instancedMesh ref={rings} args={[undefined,undefined,6]}><torusGeometry args={[.85,.018,6,48]}/><meshStandardMaterial color="#d9b75f" metalness={.65} roughness={.4}/></instancedMesh><instancedMesh ref={wires} args={[undefined,undefined,90]}><cylinderGeometry args={[1,1,1,4]}/><meshStandardMaterial color="#c5a45b" metalness={.5}/></instancedMesh><instancedMesh ref={beads} args={[undefined,undefined,72]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#ffe5a5" emissive="#e4b35c" emissiveIntensity={1.1}/></instancedMesh></group>;
}
export default function TempleCeiling(){return <group><UpperWalls/><UpperPosts/><TempleBanners/><group position={[0,templeFixtures.ceiling.assemblyOffset,0]}><CeilingOrnaments/><Inscription/>{[-10,-7,7,10].map(x=><HangingLamp key={x} x={x} z={3.4}/>)}<PendantSet/>{[-9,0,9].map(x=><mesh key={x} position={[x,6.85,0]}><boxGeometry args={[.18,.3,17.5]}/><meshStandardMaterial color='#48281f'/></mesh>)}<mesh position={[0,7.05,0]}><boxGeometry args={[29,.4,20.5]}/><meshStandardMaterial color='#43271e' roughness={1}/></mesh></group></group>}

/** Close the raised roof against the existing walls and entrance lintels. */
function UpperWalls(){return <group>{[-1,1].map(side=><mesh key={side} position={[side*12.6,8.05,0]}><boxGeometry args={[.34,3.8,15.7]}/><meshStandardMaterial color="#572d24" roughness={.9}/></mesh>)}<mesh position={[0,8.05,-7.625]}><boxGeometry args={[25.55,3.8,.34]}/><meshStandardMaterial color="#572d24" roughness={.9}/></mesh>{[7.45,8.9].map(z=><mesh key={z} position={[0,7.7,z]}><boxGeometry args={[26.5,4.5,.3]}/><meshStandardMaterial color="#43271e" roughness={.9}/></mesh>)}</group>}

function UpperPosts(){const points=[-11.5,-7.025,-2.35,2.35,7.025,11.5].flatMap(x=>[-6.75,-3.4].map(z=>[x,z]));return <group>{points.map(([x,z],i)=><mesh key={i} position={[x,7.85,z]}><cylinderGeometry args={[.29,.30,3.8,12]}/><meshStandardMaterial color="#48281f" roughness={.9}/></mesh>)}</group>}
