import * as T from 'three';
import {PAVILION_POSTS} from './quanAmData';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
export const PAVILION_ROOF={y:5.68,width:6.9,depth:6.9};
/** Sample the real curved soffit once, rather than assuming a flat roof height. */
export function pavilionSupportHeights(template:T.Group){
 const roof=template.clone(true),materials:T.Material[]=[];
 roof.position.y=PAVILION_ROOF.y;roof.scale.set(PAVILION_ROOF.width,PAVILION_ROOF.width,PAVILION_ROOF.depth);
 roof.traverse(node=>{if(node instanceof T.Mesh){node.material=(node.material as T.Material).clone();node.material.side=T.DoubleSide;materials.push(node.material);}});roof.updateMatrixWorld(true);
 const heights=PAVILION_POSTS.map(({x,z})=>new T.Raycaster(new T.Vector3(x,PAVILION_ROOF.y-1,z),new T.Vector3(0,1,0)).intersectObject(roof,true)[0]?.point.y??PAVILION_ROOF.y);
 materials.forEach(m=>m.dispose());return heights;
}
export function createPavilionFrame(template:T.Group){const heights=pavilionSupportHeights(template);return batchGeometry(PAVILION_POSTS.flatMap(({x,z},i)=>{
 const top=heights[i],next=PAVILION_POSTS[(i+1)%PAVILION_POSTS.length],nextTop=heights[(i+1)%heights.length];
 return [coloredGeometry(new T.CylinderGeometry(.125,.155,top-.35,9),'#835b44',[x,(.20+top-.15)/2,z]),
 coloredGeometry(new T.CylinderGeometry(.20,.23,.23,9),'#a7a08c',[x,.115,z]),
 coloredGeometry(new T.CylinderGeometry(.21,.15,.22,9),'#a17350',[x,top-.10,z]),
 coloredGeometry(taperTube([[x,top-.17,z],[next.x,nextTop-.17,next.z]],[.095,.095],6),'#79523b')];
 }));}
