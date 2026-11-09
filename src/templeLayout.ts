import * as THREE from 'three';
export function removedTemplePost(x:number,z:number){return Math.abs(x)<9&&[1,4.9].some(row=>Math.abs(z-row)<.65)}
// The portico stayed at its authored floor height when the roof assembly was lifted.
export const porticoColumnTop=7.04;
const closeTo=(value:number,target:number)=>Math.abs(value-target)<.03;
export function isPorticoColumn(x:number,z:number){
 const onFrontOrBack=closeTo(Math.abs(z),8.725)&&[2.35,7,10.5,13].some(at=>closeTo(Math.abs(x),at));
 const onSide=closeTo(Math.abs(x),13)&&[0,3,6].some(at=>closeTo(Math.abs(z),at));
 return onFrontOrBack||onSide;
}

export function extendPorticoColumn(positions:THREE.BufferAttribute|THREE.InterleavedBufferAttribute,box:THREE.Box3,indices:number[]){
 const base=box.min.y,height=box.max.y-base,scale=(porticoColumnTop*2-base)/height;
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
