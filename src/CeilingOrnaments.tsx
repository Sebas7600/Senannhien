import {useMemo,useEffect} from 'react';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Nine coffered panels and lotus rosettes, batched into just two draw calls. */
export default function CeilingOrnaments(){
 const geometry=useMemo(()=>{
  const wood:T.BufferGeometry[]=[],gold:T.BufferGeometry[]=[];
  const box=(target:T.BufferGeometry[],x:number,y:number,z:number,w:number,h:number,d:number)=>target.push(new T.BoxGeometry(w,h,d).translate(x,y,z));
  for(const x of [-12,-4,4,12])box(wood,x,6.83,1,.18,.2,15.4);
  for(const z of [-6.5,-1.5,3.5,8.5])box(wood,0,6.83,z,24.3,.2,.18);
  for(const x of [-8,0,8])for(const z of [-4,1,6]){
   for(const side of [-1,1]){box(gold,x+side*3.65,6.83,z,.035,.035,4.3);box(gold,x,6.83,z+side*2.15,7.3,.035,.035);}
   for(let i=0;i<8;i++){const angle=i*Math.PI/4;gold.push(new T.SphereGeometry(1,8,4).scale(.10,.012,.31).rotateY(angle).translate(x+Math.sin(angle)*.3,6.82,z+Math.cos(angle)*.3));}
   gold.push(new T.CylinderGeometry(.13,.13,.025,12).translate(x,6.82,z));
  }
  // Break up the raised upper walls with a timber frieze and restrained gold rails.
  for(const side of [-1,1]){
   for(const y of [3.55,5.45,6.75]){box(wood,side*12.38,y,0,.12,.12,15.2);box(gold,side*12.30,y+.08,0,.025,.022,15.2);}
   for(const z of [-6,-3,0,3,6])box(wood,side*12.38,5.1,z,.12,3.15,.09);
  }
  for(const y of [3.55,5.45,6.75]){box(wood,0,y,-7.39,24.7,.12,.12);box(gold,0,y+.08,-7.31,24.7,.022,.025);}
  for(const x of [-12,-8,-4,0,4,8,12])box(wood,x,5.1,-7.39,.09,3.15,.12);
  // Entrance infill was raised too: decorate its inside faces above the lintel.
  for(const z of [7.24,8.69]){
   for(const y of [3.0,4.7,6.75]){box(wood,0,y,z,26.2,.13,.10);box(gold,0,y+.10,z-.065,26.2,.022,.022);}
   for(const x of [-12.5,-7.5,-2.5,2.5,7.5,12.5])box(wood,x,4.88,z,.10,3.65,.10);
   for(const x of [-10,-5,0,5,10]){
    for(const side of [-1,1]){box(gold,x+side*2.15,5.65,z-.065,.025,1.45,.018);box(gold,x,5.65+side*.725,z-.065,4.3,.025,.018);}
    for(let i=0;i<8;i++){const a=i*Math.PI/4;gold.push(new T.SphereGeometry(1,8,4).scale(.065,.18,.012).rotateZ(-a).translate(x+Math.sin(a)*.16,5.65+Math.cos(a)*.16,z-.085));}
   }
  }
  const result={wood:mergeGeometries(wood),gold:mergeGeometries(gold)};for(const part of [...wood,...gold])part.dispose();return result;
 },[]);
 useEffect(()=>()=>{geometry.wood.dispose();geometry.gold.dispose()},[geometry]);
 return <group><mesh geometry={geometry.wood}><meshStandardMaterial color="#683c27" roughness={.9}/></mesh><mesh geometry={geometry.gold}><meshStandardMaterial color="#bd9853" metalness={.35} roughness={.65}/></mesh></group>;
}
