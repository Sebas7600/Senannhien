import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
// Scenery stays outside the playable walls. Static batches, no new lights or ticks.
const grove:T.BufferGeometry[]=[];
const crown=new T.IcosahedronGeometry(1,1),trunk=new T.CylinderGeometry(.35,.55,1,5);
for(let i=0;i<100;i++){
 const a=i/100*Math.PI*2,r=83/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))+Math.sin(i*5.7)*4,x=Math.cos(a)*r,z=Math.sin(a)*r,h=3.2+i%5*.55;
 grove.push(coloredGeometry(trunk,'#655b42',[x,h/2,z],[1,h,1]));
 for(let j=0;j<3;j++)grove.push(coloredGeometry(crown,['#536e48','#637e50','#738958'][(i+j)%3],[x+Math.sin(j*2.4)*1.4,h+j*.7,z+Math.cos(j*2.4)*1.4],[2.3,1.9,2.1]));
}
crown.dispose();trunk.dispose();
const trees=batchGeometry(grove);
// Continuous rolling ridges grow out of the ground instead of floating domes.
const vertices:number[]=[],colors:number[]=[],indices:number[]=[];
const segments=144,rings=18;
for(let ring=0;ring<=rings;ring++)for(let i=0;i<=segments;i++){
 const a=i/segments*Math.PI*2,t=ring/rings,r=(96+t*175)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
 const ridge=Math.pow(Math.sin(t*Math.PI),1.8),height=ridge*(15+8*Math.sin(a*5+.5)+5*Math.sin(a*11+1.3))-.2;
 vertices.push(Math.cos(a)*r,height,Math.sin(a)*r);
 const c=new T.Color().lerpColors(new T.Color('#718267'),new T.Color('#9eafa2'),t);colors.push(c.r,c.g,c.b);
 if(ring<rings&&i<segments){const n=ring*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
}
const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(vertices,3));terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();
export default function OuterLandscape(){return <group>
 <mesh geometry={terrain}><meshStandardMaterial vertexColors roughness={1}/></mesh>
 <mesh geometry={trees}><meshStandardMaterial vertexColors roughness={1}/></mesh>
 </group>}
