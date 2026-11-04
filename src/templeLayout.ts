import * as THREE from 'three';
export function removedTemplePost(x:number,z:number){return Math.abs(x)<9&&[1,4.9].some(row=>Math.abs(z-row)<.65)}
/** Both gold materials have separate components: strip only the stray flat door motifs. */
export function strayFacadeOrnament(material:string,centre:THREE.Vector3,size:THREE.Vector3){
 if(!/^gold(?:_light)?$/.test(material))return false;
 const onBrick=Math.abs(centre.x)>5.9&&Math.abs(centre.z-7.59)<.055&&centre.y>2.4&&centre.y<5&&size.y<.3&&size.z<.08;
 const floatingFront=centre.z>8.8&&centre.y<6.2&&size.y<.3&&size.z<.12;
 return onBrick||floatingFront;
}
export function removeNavePosts(scene:THREE.Group,parts:(g:THREE.BufferGeometry)=>{box:THREE.Box3;indices:number[]}[]){scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const material=o.material as THREE.Material;if(!/wood|stone|gold/.test(material.name))return;const keep:number[]=[];for(const part of parts(o.geometry)){const c=part.box.getCenter(new THREE.Vector3()).multiplyScalar(.5),size=part.box.getSize(new THREE.Vector3()).multiplyScalar(.5);if(removedTemplePost(c.x,c.z)&&size.x<1.5&&size.z<1.5)continue;keep.push(...part.indices)}o.geometry=o.geometry.clone();o.geometry.setIndex(keep);});return scene;}
