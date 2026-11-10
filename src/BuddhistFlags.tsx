import FlagClothMaterial from './FlagClothMaterial';
import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
// Standard six-panel design: https://www.nalanda.org.my/the-international-buddhist-flag/
const colors=['#17469c','#edc83d','#c73b35','#f2eddc','#e98c3d'];
const positions:number[]=[],shades:number[]=[],indices:number[]=[];
const nx=30,ny=15;
for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
 const u=x/nx,v=y/ny,color=new T.Color(colors[u<5/6?Math.min(4,Math.floor(u*6)):Math.min(4,Math.floor((1-v)*5))]);
 positions.push(u*1.2,v*.78,Math.sin(u*7-v*3)*.06*u);shades.push(color.r,color.g,color.b);
 if(x<nx&&y<ny){const n=y*(nx+1)+x;indices.push(n,n+1,n+nx+1,n+1,n+nx+2,n+nx+1);}
}
let cloth=new T.BufferGeometry();cloth.setAttribute('position',new T.Float32BufferAttribute(positions,3));cloth.setAttribute('color',new T.Float32BufferAttribute(shades,3));cloth.setIndex(indices);cloth.computeVertexNormals();cloth=cloth.toNonIndexed();
const cp=cloth.getAttribute('position'),cc=cloth.getAttribute('color');for(let i=0;i<cp.count;i+=3){const u=(cp.getX(i)+cp.getX(i+1)+cp.getX(i+2))/3/1.2,v=(cp.getY(i)+cp.getY(i+1)+cp.getY(i+2))/3/.78,c=new T.Color(colors[u<5/6?Math.min(4,Math.floor(u*6)):Math.min(4,Math.floor((1-v)*5))]);for(let j=0;j<3;j++)cc.setXYZ(i+j,c.r,c.g,c.b);}
const windData:number[]=[];for(let i=0;i<cp.count;i++)windData.push(cp.getX(i)/1.2,cp.getY(i)*3.2);cloth.setAttribute('flagWind',new T.Float32BufferAttribute(windData,2));cloth.computeBoundingSphere();cloth.boundingSphere!.radius+=.25;
export const flagMounts=[[-10,0,15.7],[10,0,15.7]] as const;
const poles=batchGeometry(flagMounts.map(([x,y,z])=>coloredGeometry(new T.CylinderGeometry(.035,.045,3.3,8),'#aa8b55',[x,y+1.65,z])));
export default function BuddhistFlags(){return <group><mesh geometry={poles}><meshStandardMaterial vertexColors metalness={.4} roughness={.65}/></mesh>{flagMounts.map(([x,y,z],i)=><mesh key={i} geometry={cloth} position={[x,y+2.42,z]} rotation={[0,x<0?-.16:Math.PI+.16,0]}><FlagClothMaterial/></mesh>)}</group>}
