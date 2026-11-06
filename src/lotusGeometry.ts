import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {LOTUS_POND as p,lotusBridgeSegments,lotusBridgeHeight} from './lotusLayout';

function ground(width:number,depth:number,z:number){
  const shape=new THREE.Shape();shape.moveTo(-width/2,-depth/2-z);shape.lineTo(width/2,-depth/2-z);shape.lineTo(width/2,depth/2-z);shape.lineTo(-width/2,depth/2-z);shape.closePath();
  const hole=new THREE.Path();hole.absellipse(p.x,-p.z,p.rx,p.rz,0,Math.PI*2,true);shape.holes.push(hole);
  const geometry=new THREE.ShapeGeometry(shape,80);geometry.rotateX(-Math.PI/2);return geometry;
}
export const outerGroundGeometry=ground(350,350,0),courtyardGroundGeometry=ground(124,132,-2);
const bankVertices:number[]=[],bankIndices:number[]=[];
for(let ring=0;ring<3;ring++)for(let i=0;i<=80;i++){
  const a=i/80*Math.PI*2,rx=[p.rx+.10,p.rx-.08,p.rx-.32][ring],rz=[p.rz+.10,p.rz-.08,p.rz-.32][ring];
  bankVertices.push(p.x+Math.cos(a)*rx,[.012,-.16,p.waterY-.14][ring],p.z+Math.sin(a)*rz);
  if(ring<2&&i<80){const j=ring*81+i;bankIndices.push(j,j+81,j+1,j+1,j+81,j+82);}
}
export const lotusBankGeometry=new THREE.BufferGeometry();lotusBankGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bankVertices,3));lotusBankGeometry.setIndex(bankIndices);lotusBankGeometry.computeVertexNormals();
function box(w:number,h:number,d:number,x:number,y:number,z:number,angle=0){return new THREE.BoxGeometry(w,h,d).rotateZ(angle).translate(x,y,z);}
function merge(parts:THREE.BufferGeometry[]){const geometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;}
export const lotusDeckGeometry=merge(lotusBridgeSegments.map(s=>box(s.length-.008,.14,3,s.deckX,s.deckY,p.z,s.angle)));
export const lotusRailingGeometry=merge([-1,1].flatMap(side=>[
  ...lotusBridgeSegments.flatMap(s=>[.48,.90].map(h=>box(s.length+.012,.07,.075,s.x,s.y+h,p.z+side*1.55,s.angle))),
  ...Array.from({length:15},(_,i)=>{const x=p.x-p.bridgeHalfLength+i*27/14;return box(.11,1.04,.11,x,lotusBridgeHeight(x)+.47,p.z+side*1.55);}),
]));
export const lotusStringerGeometry=merge([-1,1].flatMap(side=>lotusBridgeSegments.map(s=>box(s.length+.014,.20,.16,s.x,s.y-.19,p.z+side*1.27,s.angle))));
export const lotusAbutmentGeometry=merge([-1,1].flatMap(side=>Array.from({length:3},(_,row)=>{
  const x=p.x+side*12.4;return box(1.3+(2-row)*.15,.18,3.15+(2-row)*.12,x,lotusBridgeHeight(x)-.59+row*.18,p.z);
})));
