import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import meshoptimizer from 'meshoptimizer';
import {createChibiPose} from '../src/chibiPose';
import {coloredGeometry} from '../src/geometryBatch';
import {NPC_CHIBI_SCALE} from '../src/npcAppearance';
// @ts-ignore Existing static GLB writer is shared by the courtyard asset pipelines.
import {writeMeshoptGLB} from './write-meshopt-glb.mjs';
const {MeshoptEncoder,MeshoptSimplifier}=meshoptimizer;
await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const sourcePath='public/assets/characters/thay-chua-chibi.glb',bytes=fs.readFileSync(sourcePath);
const {scene,animations}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const root=new T.Group(),visual=new T.Group();root.scale.setScalar(NPC_CHIBI_SCALE);root.add(visual);visual.position.y=-.025;visual.add(scene);scene.scale.set(1.08,1,1.10);scene.getObjectByName('Dau')!.scale.set(1,.91,1.13);
const mixer=new T.AnimationMixer(scene);mixer.clipAction(animations.find(clip=>clip.name==='Idle')!).play();const rig=createChibiPose(scene);
for(let i=0;i<20;i++){rig.restore();mixer.setTime(.4);rig.update('vendor',false,false,1/30);}
root.updateMatrixWorld(true);
const head=scene.getObjectByName('Dau')!,pivot=head.getWorldPosition(new T.Vector3()),p=new T.Vector3(),n=new T.Vector3(),skinMatrix=new T.Matrix4(),bone=new T.Matrix4(),normalMatrix=new T.Matrix3(),worldNormal=new T.Matrix3();
const parts:{body:T.BufferGeometry[];head:T.BufferGeometry[]}={body:[],head:[]};let feet=Infinity;
scene.traverse(object=>{
 if(!(object instanceof T.SkinnedMesh))return;object.skeleton.update();
 const geometry=object.geometry,skin=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight,count=geometry.attributes.position.count;
 const positions=new Float32Array(count*3),normals=new Float32Array(count*3),colors=new Float32Array(count*3),armWeights=new Float32Array(count*2),belongs:number[]=[];worldNormal.getNormalMatrix(object.matrixWorld);
 for(let i=0;i<count;i++){
  object.getVertexPosition(i,p);object.localToWorld(p);positions.set(p.toArray(),i*3);feet=Math.min(feet,p.y);
  let best=0;for(let j=1;j<4;j++)if(weights.getComponent(i,j)>weights.getComponent(i,best))best=j;
  belongs[i]=object.skeleton.bones[skin.getComponent(i,best)].name==='Dau'?1:0;
  for(let j=0;j<4;j++){const name=object.skeleton.bones[skin.getComponent(i,j)].name,weight=weights.getComponent(i,j);if(name==='Khuyu_R'||name==='Co_Tay_R')armWeights[i*2]+=weight;if(name==='Khuyu_L'||name==='Co_Tay_L')armWeights[i*2+1]+=weight;}
  skinMatrix.elements.fill(0);
  for(let j=0;j<4;j++){const weight=weights.getComponent(i,j);if(!weight)continue;bone.fromArray(object.skeleton.boneMatrices,skin.getComponent(i,j)*16);for(let k=0;k<16;k++)skinMatrix.elements[k]+=bone.elements[k]*weight;}
  skinMatrix.premultiply(object.bindMatrixInverse).multiply(object.bindMatrix);normalMatrix.getNormalMatrix(skinMatrix);
  n.fromBufferAttribute(geometry.attributes.normal,i).applyNormalMatrix(normalMatrix).applyNormalMatrix(worldNormal);normals.set(n.toArray(),i*3);
  const color=geometry.attributes.color;colors.set([color.getX(i),color.getY(i),color.getZ(i)],i*3);
 }
 const lists=[[],[]] as number[][],indices=geometry.index!;
 for(let i=0;i<indices.count;i+=3){const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);lists[belongs[a]+belongs[b]+belongs[c]>=2?1:0].push(a,b,c);}
 for(let part=0;part<2;part++){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('color',new T.BufferAttribute(colors,3));g.setAttribute('uv',new T.BufferAttribute(armWeights,2));g.setIndex(lists[part]);parts[part?'head':'body'].push(g);
 }
});
// Bake a short linen apron into the shared body. Green is a shader marker, not a visible colour.
const torso=scene.getObjectByName('Than')!;
const apron=coloredGeometry(new T.BoxGeometry(),'#ffffff',[0,-.10,.174],[.31,.35,.018]);
const pocket=coloredGeometry(new T.BoxGeometry(),'#ffffff',[0,-.10,.188],[.15,.10,.012]);
for(const g of [apron,pocket]){g.applyMatrix4(torso.matrixWorld);const color=g.attributes.color;for(let i=0;i<color.count;i++)color.setXYZ(i,.05,.8,.05);g.setAttribute('uv',new T.BufferAttribute(new Float32Array(color.count*2),2));parts.body.push(mergeVertices(g,1e-5));}
const body=mergeGeometries(parts.body)!,headGeometry=mergeGeometries(parts.head)!;body.translate(0,-feet,0);headGeometry.translate(-pivot.x,-pivot.y,-pivot.z);
const hairPieces:T.BufferGeometry[]=[];
const hair=(source:T.BufferGeometry,position:[number,number,number],scale:[number,number,number],rotation:[number,number,number]=[0,0,0])=>hairPieces.push(coloredGeometry(source,'#30271f',position,scale,rotation));
hair(new T.SphereGeometry(1,16,10,0,Math.PI*2,0,1.38),[0,.23,-.015],[.278,.285,.235]);
for(const side of [-1,1]){hair(new T.SphereGeometry(1,10,8),[side*.243,.23,-.015],[.052,.18,.17]);hair(new T.SphereGeometry(1,12,6),[side*.105,.401,.155],[.139,.07,.055],[0,0,side*.28]);}
hair(new T.SphereGeometry(1,12,8),[0,.16,-.235],[.14,.115,.105]);
hairPieces.push(coloredGeometry(new T.TorusGeometry(.089,.012,5,12),'#9d8260',[0,.16,-.29],[1,1,1],[Math.PI/2,0,0]));
const hairGeometry=mergeVertices(mergeGeometries(hairPieces)!,1e-5).applyMatrix4(head.matrixWorld).translate(-pivot.x,-pivot.y,-pivot.z);
function reduce(source:T.BufferGeometry,ratio:number,error:number){
 let indices=Uint32Array.from(source.index!.array);indices=MeshoptSimplifier.simplify(indices,source.attributes.position.array as Float32Array,3,Math.floor(indices.length*ratio/3)*3,error,['LockBorder'])[0];
 const [remap,count]=MeshoptEncoder.reorderMesh(indices,true,false),geometry=new T.BufferGeometry();
 for(const [key,a] of Object.entries(source.attributes)){const out=new Float32Array(count*a.itemSize);for(let i=0;i<a.count;i++)if(remap[i]<count)for(let j=0;j<a.itemSize;j++)out[remap[i]*a.itemSize+j]=a.array[i*a.itemSize+j];geometry.setAttribute(key,new T.BufferAttribute(out,a.itemSize));}
 geometry.setIndex(new T.BufferAttribute(Uint16Array.from(indices),1));geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
const output='public/assets/characters/merchants';fs.mkdirSync(output,{recursive:true});
const assets=[];
for(const low of [false,true]){
 const meshes=[{name:'VendorBody',material:0,geometry:reduce(body,low?.30:.60,low?.004:.001)},{name:'VendorHead',material:0,geometry:reduce(headGeometry,low?.34:.65,low?.002:.0007)},{name:'VendorHair',material:0,geometry:reduce(hairGeometry,low?.35:.70,low?.005:.002)}];
 assets.push(await writeMeshoptGLB(`${output}/market-vendors${low?'-low':''}.glb`,meshes,[{name:'Chibi_Vertex_Colours',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],roughnessFactor:.82,metallicFactor:0}}]));
}
const elbow=(side:string)=>{const position=scene.getObjectByName('Khuyu_'+side)!.getWorldPosition(new T.Vector3());position.y-=feet;return position.toArray();};
const report={revision:2,source:sourcePath,sourceSha256:createHash('sha256').update(bytes).digest('hex'),sourceTriangles:16864,npcScale:NPC_CHIBI_SCALE,headPivot:[pivot.x,pivot.y-feet,pivot.z],rightElbow:elbow('R'),leftElbow:elbow('L'),standingFloor:0,assets};
fs.writeFileSync(`${output}/vendor-budget.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
