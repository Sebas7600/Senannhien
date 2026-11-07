import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import meshoptimizer from 'meshoptimizer';
import {writeMeshoptGLB} from './write-meshopt-glb.mjs';

const input = process.argv[2];
if (!input) throw new Error('Pass the statue STL path.');
const {MeshoptEncoder,MeshoptSimplifier} = meshoptimizer;
await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const source = new STLLoader().parse(Uint8Array.from(fs.readFileSync(input)).buffer);
source.deleteAttribute('normal');
let geometry = mergeVertices(source, .00001);
geometry.computeBoundingBox();
const box = geometry.boundingBox;
const scale = 3.75/(box.max.y-box.min.y);
geometry.translate(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
geometry.scale(scale,scale,scale);
const output = 'public/assets/main-temple';
fs.mkdirSync(output,{recursive:true});
const materials = [{
  name:'Dia_Tang_Vang_Dong',
  pbrMetallicRoughness:{baseColorFactor:[.78,.51,.12,1],metallicFactor:.72,roughnessFactor:.38},
}];
for (const [suffix,target,error] of [['',42000,.0025],['-low',16000,.008]]) {
  const indices = Uint32Array.from(geometry.index.array);
  const [simplified] = MeshoptSimplifier.simplify(indices,geometry.attributes.position.array,3,target*3,error,[]);
  const [remap,count] = MeshoptEncoder.reorderMesh(simplified,true,false);
  const positions = new Float32Array(count*3);
  for(let i=0;i<geometry.attributes.position.count;i++) {
    if(remap[i]<count) positions.set(geometry.attributes.position.array.subarray(i*3,i*3+3),remap[i]*3);
  }
  const reduced = new T.BufferGeometry();
  reduced.setAttribute('position',new T.BufferAttribute(positions,3));
  reduced.setIndex(new T.BufferAttribute(count<65536?Uint16Array.from(simplified):simplified,1));
  reduced.computeVertexNormals();
  const report = await writeMeshoptGLB(path.join(output,'center-ksitigarbha'+suffix+'.glb'),[{name:'Dia_Tang_Center',material:0,geometry:reduced}],materials);
  console.log(report);
}
