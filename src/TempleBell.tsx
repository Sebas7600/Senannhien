import {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Box} from './models';

const profile=[[.78,-1.92],[.86,-1.87],[.84,-1.75],[.72,-1.68],[.70,-.65],[.65,-.47],[.48,-.31],[.18,-.22],[.13,-.16]];
const body=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),48);
const gold=new THREE.MeshStandardMaterial({color:'#b39a62',metalness:.7,roughness:.5});
const bronze=new THREE.MeshStandardMaterial({color:'#3d3429',metalness:.72,roughness:.5});
const rings=mergeGeometries([[-.48,.64],[-.82,.704],[-.88,.706],[-1.45,.71],[-1.52,.72],[-1.78,.835],[-1.89,.82]].map(([y,r])=>new THREE.TorusGeometry(r,.015,6,48).rotateX(Math.PI/2).translate(0,y,0)));
const dragons=mergeGeometries([-1,1].flatMap(s=>[
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s*.02,-.22,0),new THREE.Vector3(s*.25,-.11,0),new THREE.Vector3(s*.24,.045,0),new THREE.Vector3(s*.07,.055,0)]),14,.045,7,false),
  new THREE.SphereGeometry(.07,10,8).scale(1.3,.7,.7).translate(s*.1,.04,.025),
  new THREE.ConeGeometry(.022,.11,6).rotateZ(s*.5).translate(s*.16,.11,0),
]));
function bellTexture(){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d')!;
  c.fillStyle='#302b23';c.fillRect(0,0,1024,1024);c.strokeStyle='#b09b6b';c.fillStyle='#b09b6b';
  // Repeated lotus medallions, cloud curls and panel borders, not invented script.
  for(let panel=0;panel<8;panel++){
    const x=panel*128+64;c.lineWidth=2;c.strokeRect(x-53,275,106,329);
    for(const y of [180,352,530,750]){
      c.save();c.translate(x,y);c.lineWidth=2.5;
      for(let k=0;k<8;k++){c.rotate(Math.PI/4);c.beginPath();c.ellipse(0,-16,8,17,0,0,Math.PI*2);c.stroke();}
      c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();c.restore();
    }
    for(const y of [240,640,835]){c.beginPath();c.moveTo(x-52,y);c.bezierCurveTo(x-20,y-35,x+20,y+35,x+52,y);c.stroke();}
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** Đại hồng chung silhouette: rounded shoulder, long barrel, flared lip and double suspension. */
export function TempleBell(){
  const map=useMemo(bellTexture,[]);
  return <group dispose={null}>
    <mesh geometry={body} castShadow><meshStandardMaterial map={map} metalness={.72} roughness={.48} side={THREE.DoubleSide}/></mesh>
    <mesh geometry={rings} material={gold}/><mesh geometry={dragons} material={bronze}/>
    {[0,1,2,3].map(i=><group rotation={[0,i*Math.PI/2,0]} key={i}>
      <mesh position={[0,-1.18,.706]} rotation={[Math.PI/2,0,0]} material={gold}><cylinderGeometry args={[.10,.11,.025,20]}/></mesh>
      <mesh position={[0,-1.18,.725]} material={bronze}><sphereGeometry args={[.07,12,8]}/></mesh>
    </group>)}
  </group>;
}

export function BellFrame(){return <group>
  {[-1,1].map(s=><group key={s}>
    <Box position={[s*1.38,2.12,0]} scale={[.28,3.44,.42]} color="#703b29"/>
    <Box position={[s*1.38,.52,0]} scale={[.7,.23,1.25]} color="#633827"/>
    <Box position={[s*1.38,3.8,0]} scale={[.5,.22,.58]} color="#8a4d31"/>
    {[.85,3.5].map(y=><mesh key={y} position={[s*1.38,y,.24]} rotation={[0,0,s*Math.PI/3]}><torusGeometry args={[.19,.055,6,20,Math.PI*1.4]}/><meshStandardMaterial color="#955b38"/></mesh>)}
    <mesh position={[s*1.09,3.43,0]} rotation={[0,0,s*-.7]}><boxGeometry args={[.14,.75,.22]}/><meshStandardMaterial color="#75432c"/></mesh>
  </group>)}
  <Box position={[0,3.91,0]} scale={[3.65,.34,.52]} color="#743e29"/>
  <Box position={[0,.75,-.12]} scale={[2.5,.33,.20]} color="#74442c"/>
  {[-.8,0,.8].map(x=><mesh key={x} position={[x,3.91,.28]}><torusGeometry args={[.10,.025,5,16]}/><meshStandardMaterial color="#b59763" metalness={.4}/></mesh>)}
</group>}
