import {porticoSupportTop} from './templeEave';
import * as THREE from 'three';
export function removedTemplePost(x:number,z:number){
 const inNave=Math.abs(x)<9&&[1,4.9].some(row=>Math.abs(z-row)<.65);
 const redundantPortico=isPorticoColumn(x,z)&&(closeTo(Math.abs(x),10.5)||(
  closeTo(Math.abs(x),13)&&[3,6].some(row=>closeTo(Math.abs(z),row))));
 return inNave||redundantPortico;
}
export const templeFrontWall={innerX:5.9,outerX:12.6,z:7.45,depth:.36};

export function isTempleDoorCollider({kind,position}:{kind:string;position:readonly number[]}){
 const [x,y,z]=position;
 return kind==='cylinder'&&Math.abs(y-3.5)<.02&&Math.abs(z-7.5)<.07&&Math.abs(x)>2.6&&Math.abs(x)<6.8;
}

/** The two front door assemblies are baked into the wood and gold material batches. */
export function isTempleDoorPart(material:string,center:THREE.Vector3,size:THREE.Vector3){
 const x=Math.abs(center.x);
 if(x<=2.6||x>=6.8||center.z<7.36||center.z>7.64)return false;
 if(material==='wood')return Math.abs(center.y-3.5)<.02&&size.y>2.6&&size.z<.18;
 if(material==='wood_warm')return Math.abs(center.z-7.555)<.015&&center.y>2.18&&center.y<4.8&&size.z<.06;
 return /^gold(?:_light)?$/.test(material)&&center.y>3.4&&center.y<4.5&&size.z<.08;
}
// Each original column meets the underside of the gallery roof.
const closeTo=(value:number,target:number)=>Math.abs(value-target)<.03;
export function isPorticoColumn(x:number,z:number){
 const onFrontOrBack=closeTo(Math.abs(z),8.725)&&[2.35,7,10.5,13].some(at=>closeTo(Math.abs(x),at));
 const onSide=closeTo(Math.abs(x),13)&&[0,3,6].some(at=>closeTo(Math.abs(z),at));
 return onFrontOrBack||onSide;
}

export function isPorticoColumnPart(material:string,center:THREE.Vector3,size:THREE.Vector3){
 return ['wood','wood_dark','wood_warm','stone_dark'].includes(material)&&
  isPorticoColumn(center.x,center.z)&&center.y>2.18&&center.y<5.73&&size.x<1.05&&size.z<1.05;
}

export function extendPorticoColumn(positions:THREE.BufferAttribute|THREE.InterleavedBufferAttribute,box:THREE.Box3,indices:number[]){
 const base=box.min.y,height=box.max.y-base,scale=(porticoSupportTop((box.min.x+box.max.x)/4,(box.min.z+box.max.z)/4)*2-base)/height;
 for(const i of new Set(indices))positions.setY(i,base+(positions.getY(i)-base)*scale);
 positions.needsUpdate=true;
}
/** Both gold materials have separate components: strip only the stray flat door motifs. */
export function strayFacadeOrnament(material:string,centre:THREE.Vector3,size:THREE.Vector3){
 if(!/^gold(?:_light)?$/.test(material))return false;
 const onBrick=Math.abs(centre.x)>5.9&&Math.abs(centre.z-7.59)<.055&&centre.y>2.4&&centre.y<5&&size.y<.3&&size.z<.08;
 const floatingFront=centre.z>8.8&&centre.y<6.2&&size.y<.3&&size.z<.12;
 return onBrick||floatingFront;
}
export function navePostOrnament(material:string,centre:THREE.Vector3,size:THREE.Vector3){
 const onPost=[2.35,7.025].some(x=>Math.abs(Math.abs(centre.x)-x)<.18);
 const onFront=[-3.075,1.325].some(z=>Math.abs(centre.z-z)<.03);
 return /^gold(?:_light)?$/.test(material)&&onPost&&onFront&&centre.y>2.42&&centre.y<5.28&&size.y<.16&&size.z<.065;
}
export function removeNavePosts(scene:THREE.Group,parts:(g:THREE.BufferGeometry)=>{box:THREE.Box3;indices:number[]}[],interior=false){
 scene.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  const material=o.material as THREE.Material;
  if(!/wood|stone|gold/.test(material.name))return;
  const keep:number[]=[];
  for(const part of parts(o.geometry)){
   const c=part.box.getCenter(new THREE.Vector3()).multiplyScalar(.5);
   const size=part.box.getSize(new THREE.Vector3()).multiplyScalar(.5);
   if((removedTemplePost(c.x,c.z)&&size.x<1.5&&size.z<1.5)||(interior&&navePostOrnament(material.name,c,size)))continue;
   keep.push(...part.indices);
  }
  o.geometry=o.geometry.clone();
  o.geometry.setIndex(keep);
 });
 return scene;
}

/** Remove only the imported lotus-shaped back aureoles, preserving altar trim and niches. */
export function removeLegacyStatueHalos(scene:THREE.Group,parts:(g:THREE.BufferGeometry)=>{box:THREE.Box3;indices:number[]}[]){
 scene.traverse(o=>{if(!(o instanceof THREE.Mesh)||!/^gold(?:_light)?$/.test((o.material as THREE.Material).name))return;
  const keep:number[]=[];for(const part of parts(o.geometry)){const c=part.box.getCenter(new THREE.Vector3()).multiplyScalar(.5);
   const halo=c.z> -6.62&&c.z< -6.35&&c.y>2.55&&[-4.7,0,4.7].some(x=>Math.abs(c.x-x)<2.1);
   if(!halo)keep.push(...part.indices);
  }
  o.geometry=o.geometry.clone();o.geometry.setIndex(keep);
 });return scene;
}
