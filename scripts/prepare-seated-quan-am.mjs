import fs from 'node:fs';import * as T from 'three';import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';import meshoptimizer from 'meshoptimizer';import {writeMeshoptGLB} from './write-meshopt-glb.mjs';
const {MeshoptEncoder,MeshoptSimplifier}=meshoptimizer;await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const root=new OBJLoader().parse(fs.readFileSync('C:/Users/admin/Documents/Codex/2026-11-03/Guan Yin/Guan Yin.obj','utf8')),pieces=[];root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const name of Object.keys(g.attributes))if(name!=='position')g.deleteAttribute(name);pieces.push(g)});let g=mergeVertices(mergeGeometries(pieces),.00001);// Plane fitted to 11,695 points of the scanned underside. Level the actual
// foundation instead of bending the sculpture or guessing a torso angle.
g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(.07100672368434846,.9400240625539732,.3336357400086783),new T.Vector3(0,1,0)));
g.computeBoundingBox();const b=g.boundingBox,scale=3.75/(b.max.y-b.min.y);g.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);g.scale(scale,scale,scale);
// Remove only the lotus plinth below the folded legs, then seal the support plane.
const cut=.99,vertices=[],rim=new Map(),pos=g.attributes.position,ix=g.index;
const vertex=i=>new T.Vector3().fromBufferAttribute(pos,i);
const push=(a,b,c)=>vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
for(let i=0;i<ix.count;i+=3){const input=[vertex(ix.getX(i)),vertex(ix.getX(i+1)),vertex(ix.getX(i+2))],poly=[];
 for(let j=0;j<3;j++){const a=input[j],b=input[(j+1)%3],inside=a.y>=cut,next=b.y>=cut;if(inside)poly.push(a);if(inside!==next){const p=a.clone().lerp(b,(cut-a.y)/(b.y-a.y));poly.push(p);rim.set(p.x.toFixed(5)+','+p.z.toFixed(5),p)}}
 for(let j=1;j<poly.length-1;j++)push(poly[0],poly[j],poly[j+1]);
}
const ring=[...rim.values()],centre=new T.Vector3();for(const p of ring)centre.add(p);centre.divideScalar(ring.length);ring.sort((a,b)=>Math.atan2(a.z-centre.z,a.x-centre.x)-Math.atan2(b.z-centre.z,b.x-centre.x));for(let i=0;i<ring.length;i++)push(centre,ring[i],ring[(i+1)%ring.length]);
const cropped=new T.BufferGeometry();cropped.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g=mergeVertices(cropped,.00001);g.translate(0,-cut,0);
for(const [suffix,target,error] of [['',35000,.003],['-low',12000,.008]]){const [indices]=MeshoptSimplifier.simplify(Uint32Array.from(g.index.array),g.attributes.position.array,3,target*3,error,[]);const [remap,count]=MeshoptEncoder.reorderMesh(indices,true,false),p=new Float32Array(count*3);for(let i=0;i<g.attributes.position.count;i++)if(remap[i]<count)p.set(g.attributes.position.array.subarray(i*3,i*3+3),remap[i]*3);const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(p,3));out.setIndex(new T.BufferAttribute(count<65536?Uint16Array.from(indices):indices,1));out.computeVertexNormals();console.log(await writeMeshoptGLB('public/assets/main-temple/seated-quan-am'+suffix+'.glb',[{name:'Quan_Am_Ngoi',material:0,geometry:out}],[{name:'Cam_Thach_Trang',pbrMetallicRoughness:{baseColorFactor:[.78,.83,.78,1],metallicFactor:.02,roughnessFactor:.46}}]));}
