import {useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Box} from './models';
import {SacredCandle,SacredFlames,IncenseSmoke} from './FireEffects';
import {readingTables,teaTables,diningTables,RECEPTION,type Vec3} from './gameData';

function transformed(g:THREE.BufferGeometry,p:Vec3=[0,0,0],r:Vec3=[0,0,0],scale:Vec3=[1,1,1]){
  const object=new THREE.Object3D();object.position.set(...p);object.rotation.set(...r);object.scale.set(...scale);object.updateMatrix();return g.applyMatrix4(object.matrix);
}
const ceramic=new THREE.MeshStandardMaterial({color:'#9eaf91',roughness:.42});
const wax=new THREE.MeshStandardMaterial({color:'#f0dfb3',roughness:.8});
const wood=new THREE.MeshStandardMaterial({color:'#9b7954',roughness:.85});
const candleGeometry=mergeGeometries([
  new THREE.CylinderGeometry(.055,.055,.18,10),
  transformed(new THREE.CylinderGeometry(.085,.085,.025,12),[0,-.09,0]),
]);
const wickGeometry=transformed(new THREE.CylinderGeometry(.006,.006,.025,5),[0,.102,0]);
const wickMaterial=new THREE.MeshBasicMaterial({color:'#50342a'});
const teapotGeometry=mergeGeometries([
  new THREE.LatheGeometry([[0,0],[.11,0],[.17,.08],[.18,.17],[.14,.26],[.08,.29]].map(([x,y])=>new THREE.Vector2(x,y)),18),
  transformed(new THREE.SphereGeometry(.1,12,6),[0,.29,0],[0,0,0],[1,.28,1]),
  transformed(new THREE.SphereGeometry(.028,8,6),[0,.34,0]),
  transformed(new THREE.TorusGeometry(.11,.024,6,14),[-.19,.16,0]),
  new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(.12,.12,0),new THREE.Vector3(.28,.12,0),new THREE.Vector3(.33,.28,0)),8,.035,6,false),
]);
const holderGeometry=new THREE.LatheGeometry([[.06,0],[.075,.02],[.085,.22],[.067,.22],[.06,.04]].map(([x,y])=>new THREE.Vector2(x,y)),12);
const chopsticksGeometry=mergeGeometries(Array.from({length:10},(_,i)=>transformed(new THREE.CylinderGeometry(.008,.008,.31,4),[Math.sin(i*2.4)*.045,.25,Math.cos(i*2.4)*.045],[Math.sin(i)*.11,0,Math.cos(i)*.11])));

/** Static accessories use shared geometries and instancing, not twenty animation loops. */
function Instances({points,geometry,material}:{points:Vec3[];geometry:THREE.BufferGeometry;material:THREE.Material}){
  const ref=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{const m=new THREE.Object3D();points.forEach((p,i)=>{m.position.set(...p);m.updateMatrix();ref.current!.setMatrixAt(i,m.matrix)});if(ref.current){ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();}},[points]);
  return <instancedMesh ref={ref} args={[geometry,material,points.length]} dispose={null}/>;
}
const readingCandles:Vec3[]=readingTables.map(t=>[t[0]+.5,t[1]+.10,t[2]-.1]);
const readingFlames=readingCandles.map((p,i)=>({position:[p[0],p[1]+.099,p[2]] as Vec3,scale:.8,seed:i*.73}));
const teapots:Vec3[]=teaTables.map(t=>[t[0]-.24,t[1]+.015,t[2]-.16]);
const chopsticks:Vec3[]=diningTables.map(t=>[t[0],t[1]+.01,t[2]-.82]);
export function TableAccessories(){return <group dispose={null}>
  <Instances points={readingCandles} geometry={candleGeometry} material={wax}/><Instances points={readingCandles} geometry={wickGeometry} material={wickMaterial}/><SacredFlames points={readingFlames}/>
  <Instances points={teapots} geometry={teapotGeometry} material={ceramic}/>
  <Instances points={chopsticks} geometry={holderGeometry} material={ceramic}/><Instances points={chopsticks} geometry={chopsticksGeometry} material={wood}/>
</group>}
const lotusPetals=mergeGeometries(Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return transformed(new THREE.SphereGeometry(1,8,6),[Math.sin(a)*.10,.09,Math.cos(a)*.10],[Math.cos(a)*.55,0,-Math.sin(a)*.55],[.065,.12,.055]);}));
const flowerPetals=mergeGeometries(Array.from({length:7},(_,j)=>{const a=j*Math.PI*2/7;return transformed(new THREE.SphereGeometry(1,8,6),[Math.sin(a)*.08,.01,Math.cos(a)*.08],[Math.cos(a)*.55,0,-Math.sin(a)*.55],[.055,.13,.055]);}));
function LotusCup({position,scale=1}:{position:Vec3;scale?:number}){return <group position={position} scale={scale}>
  <mesh position={[0,.02,0]}><cylinderGeometry args={[.16,.19,.045,16]}/><meshStandardMaterial color="#a68c54" metalness={.65} roughness={.4}/></mesh>
  <mesh geometry={lotusPetals} dispose={null}><meshStandardMaterial color="#b99e62" metalness={.55} roughness={.45}/></mesh>
</group>}
function AltarCandle({x}:{x:number}){return <group position={[x,0,.05]}>
  <LotusCup position={[0,0,0]}/>
  <SacredCandle position={[0,.1,0]} height={.46} radius={.067} flameScale={1.15} seed={x}/>
</group>}
function FlowerVase({x}:{x:number}){return <group position={[x,.02,-.10]}>
  <mesh><latheGeometry args={[[[.14,0],[.21,.05],[.25,.23],[.17,.43],[.10,.52],[.12,.55]].map(([a,b])=>new THREE.Vector2(a,b)),20]}/><meshStandardMaterial color="#a8b4aa" roughness={.32} metalness={.18}/></mesh>
  {[-1,0,1].map((s,i)=><group key={s} position={[s*.12,.5,0]}>
    <mesh position={[s*.05,.20+i*.06,0]} rotation={[0,0,-s*.22]}><cylinderGeometry args={[.009,.009,.55+i*.12,6]}/><meshStandardMaterial color="#748355"/></mesh>
    <group position={[s*.10,.47+i*.12,0]}>
      <mesh geometry={flowerPetals} dispose={null}><meshStandardMaterial color={i===1?'#e9c8b5':'#edddc6'}/></mesh>
      <mesh><sphereGeometry args={[.04,8,6]}/><meshStandardMaterial color="#d7b86d"/></mesh>
    </group>
  </group>)}
</group>}
export function AltarOfferings(){return <group position={[-33,1.16,-22]}>
  <Box position={[0,-.10,0]} scale={[6.1,.12,1.03]} color="#b49459"/>
  <Box position={[0,-.20,.45]} scale={[5.65,.18,.10]} color="#73442d"/>
  {[-2.45,2.45].map(x=><AltarCandle key={x} x={x}/>)}
  {[-1.9,1.9].map(x=><FlowerVase key={x} x={x}/>)}
  {[-1.12,1.12].map(x=><group key={x} position={[x,.07,.10]}>
    <mesh><cylinderGeometry args={[.31,.22,.07,20]}/><meshStandardMaterial color="#bca369" metalness={.55}/></mesh>
    {[-1,0,1].map((s,i)=><mesh key={s} position={[s*.13,.14,i===1?-.05:.08]} scale={[1,1.12,1]}><sphereGeometry args={[.12,12,8]}/><meshStandardMaterial color={i===1?'#dca65c':'#a6b46d'} roughness={.65}/></mesh>)}
    <mesh position={[0,.30,0]}><sphereGeometry args={[.12,12,8]}/><meshStandardMaterial color="#dcb464"/></mesh>
  </group>)}
  {/* Bronze censer: tripod feet, a generous bowl, rim and paired handles. */}
  <group position={[0,.04,-.08]}>
    {[0,1,2].map(i=><mesh key={i} position={[Math.sin(i*Math.PI*2/3)*.20,.07,Math.cos(i*Math.PI*2/3)*.20]}><sphereGeometry args={[.065,10,8]}/><meshStandardMaterial color="#8c774c" metalness={.65}/></mesh>)}
    <mesh position={[0,.22,0]}><sphereGeometry args={[.32,24,14,0,Math.PI*2,0,Math.PI*.76]}/><meshStandardMaterial color="#8b7954" metalness={.7} roughness={.4}/></mesh>
    <mesh position={[0,.40,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.265,.035,8,24]}/><meshStandardMaterial color="#c0a66c" metalness={.65}/></mesh>
    <mesh position={[0,.385,0]}><cylinderGeometry args={[.25,.25,.025,20]}/><meshStandardMaterial color="#88725c"/></mesh>
    <mesh position={[0,.23,.30]}><torusGeometry args={[.085,.018,6,18]}/><meshStandardMaterial color="#c5ab70" metalness={.7}/></mesh>
    <mesh position={[0,.23,.31]}><sphereGeometry args={[.045,10,8]}/><meshStandardMaterial color="#c5ab70" metalness={.7}/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*.34,.32,0]}><torusGeometry args={[.10,.026,6,16]}/><meshStandardMaterial color="#b59a60" metalness={.7}/></mesh>)}
    {[-.07,0,.07].map(x=><group key={x} position={[x,.40,0]}>
      <mesh position={[0,.23,0]}><cylinderGeometry args={[.006,.006,.46,5]}/><meshStandardMaterial color="#ab7049"/></mesh>
      <mesh position={[0,.46,0]}><sphereGeometry args={[.012,6,5]}/><meshBasicMaterial color="#eaa06b"/></mesh>
    </group>)}
    <IncenseSmoke position={[0,.86,0]}/>
  </group>
  {[-.6,-.3,0,.3,.6].map(x=><group key={x} position={[x,.05,.39]}><mesh><cylinderGeometry args={[.063,.042,.10,12]}/><meshStandardMaterial color="#d5caa8" roughness={.3}/></mesh><mesh position={[0,.052,0]}><cylinderGeometry args={[.052,.052,.004,12]}/><meshStandardMaterial color="#947751" roughness={.2}/></mesh></group>)}
  <pointLight position={[0,1.1,.6]} color="#ffd5a0" intensity={1.4} distance={5} decay={2}/>
</group>}
export function ReceptionDesk(){return <group position={[RECEPTION[0],.16,RECEPTION[1]]} rotation={[0,Math.PI,0]}>
  <Box position={[0,.06,0]} scale={[1.3,.12,.8]} color="#9b805b"/>
  <Box position={[0,.58,0]} scale={[1.12,.96,.63]} color="#aa8c64"/>
  <Box position={[0,1.1,0]} scale={[1.4,.12,.85]} rotation={[-.10,0,0]} color="#c4ad83"/>
  {/* POS terminal: two back-to-back displays, a pedestal and a card-reader slot. */}
  <mesh position={[0,1.22,0]}><boxGeometry args={[.57,.055,.39]}/><meshStandardMaterial color="#deded2"/></mesh>
  <mesh position={[0,1.4,0]} rotation={[-.13,0,0]}><boxGeometry args={[.18,.35,.14]}/><meshStandardMaterial color="#d2d5cb"/></mesh>
  {[-1,1].map(side=><group key={side} position={[0,1.65,side*.10]} rotation={[0,side===1?0:Math.PI,0]}>
    <mesh><boxGeometry args={[.82,.5,.075]}/><meshStandardMaterial color="#d5d8d0"/></mesh>
    <mesh position={[0,0,.043]}><boxGeometry args={[.73,.4,.012]}/><meshBasicMaterial color="#233e3a"/></mesh>
    <mesh position={[-.12,.085,.052]}><boxGeometry args={[.37,.033,.005]}/><meshBasicMaterial color="#c8d7ba"/></mesh>
    <mesh position={[-.08,.015,.052]}><boxGeometry args={[.44,.018,.005]}/><meshBasicMaterial color="#8fa995"/></mesh>
    <mesh position={[0,-.105,.052]}><boxGeometry args={[.33,.075,.005]}/><meshBasicMaterial color="#8cae77"/></mesh>
  </group>)}
  <mesh position={[.36,1.24,.20]} rotation={[-.25,0,0]}><boxGeometry args={[.16,.12,.19]}/><meshStandardMaterial color="#bec7bc"/></mesh>
</group>}
