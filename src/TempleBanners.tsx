import {useMemo,useEffect} from 'react';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Static cloth folds and lotus emblems, with no cloth simulation or extra lights. */
export default function TempleBanners(){
 const geometry=useMemo(()=>{
  const cloth:T.BufferGeometry[]=[],trim:T.BufferGeometry[]=[];
  for(const x of [-9.6,9.6])for(const z of [-3,3.8]){
   const p:number[]=[],ix:number[]=[];
   for(let row=0;row<=12;row++)for(let col=0;col<=6;col++){
    const u=col/6,t=row/12,hem=t===1?.18*(1-Math.abs(u*2-1)):0;
    p.push(x+(u-.5)*.72,7.8-t*2.8+hem,z+Math.sin(u*Math.PI*4)*.028*t);
   }
   for(let row=0;row<12;row++)for(let col=0;col<6;col++){const a=row*7+col;ix.push(a,a+7,a+1,a+1,a+7,a+8)}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();cloth.push(g);
   trim.push(new T.CylinderGeometry(.025,.025,.95,8).rotateZ(Math.PI/2).translate(x,7.82,z));
   trim.push(new T.CylinderGeometry(.009,.009,1.95,5).translate(x,8.825,z));
   for(const side of [-1,1])trim.push(new T.BoxGeometry(.018,2.75,.012).translate(x+side*.32,6.42,z+.035));
   for(let i=0;i<6;i++){const a=i*Math.PI/3;trim.push(new T.SphereGeometry(1,8,4).scale(.055,.13,.012).rotateZ(-a).translate(x+Math.sin(a)*.10,6.6+Math.cos(a)*.10,z+.04));}
  }
  const result={cloth:mergeGeometries(cloth),trim:mergeGeometries(trim)};for(const g of [...cloth,...trim])g.dispose();return result;
 },[]);
 useEffect(()=>()=>{geometry.cloth.dispose();geometry.trim.dispose()},[geometry]);
 return <group><mesh geometry={geometry.cloth}><meshStandardMaterial color="#85372c" roughness={.95} side={T.DoubleSide}/></mesh><mesh geometry={geometry.trim}><meshStandardMaterial color="#cfad64" metalness={.25} roughness={.65}/></mesh></group>;
}
