/** Offline: node scripts/prepare-water-assets.mjs [extracted archive directory] [ffmpeg] */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three-stdlib';
import {mergeGeometries,mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import meshoptimizer from 'meshoptimizer';
import {writeMeshoptGLB} from './write-meshopt-glb.mjs';

const root=path.resolve(process.argv[2]||'tmp/water-imports');
const ffmpeg=path.resolve(process.argv[3]||'tmp/audio-tools/package/ffmpeg.exe');
const out=path.resolve('public/assets/water-task');
fs.mkdirSync(out,{recursive:true});
const {MeshoptEncoder,MeshoptSimplifier}=meshoptimizer;
await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const textures=[],sources=[];
async function read(file,prefix){
  const bytes=fs.readFileSync(path.join(root,file)),length=bytes.readUInt32LE(12);
  const json=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);
  const loader=new GLTFLoader();
  loader.register(()=>({name:'OfflineTexture',loadTexture:async()=>new T.Texture()}));
  const {scene}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.updateMatrixWorld(true);
  for(let i=0;i<json.images.length;i++){
    const image=json.images[i],view=json.bufferViews[image.bufferView],kind=['color','roughness','normal'][i%3];
    const material=i<3?prefix:'well-arch',size=kind==='color'?512:256;
    const temporary=path.join(root,`${material}-${kind}-source.${image.mimeType==='image/png'?'png':'jpg'}`);
    fs.writeFileSync(temporary,bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));
    const name=`${material}-v1-${kind}.webp`;
    const args=['-v','error','-y','-i',temporary,'-vf',`scale=${size}:${size}:flags=lanczos`,'-c:v','libwebp','-compression_level','6','-q:v',kind==='color'?'86':'94',path.join(out,name)];
    const result=spawnSync(ffmpeg,args,{encoding:'utf8',windowsHide:true});
    if(result.status!==0)throw Error(result.error?.message||result.stderr);
    textures.push({file:name,bytes:fs.statSync(path.join(out,name)).size,width:size,height:size,kind});
  }
  sources.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles:json.meshes.reduce((n,m)=>n+m.primitives.reduce((s,p)=>s+json.accessors[p.indices].count/3,0),0)});
  return scene;
}
const well=await read('Gieng_Da/Gieng_Da.glb','well-stone');
const jar=await read('Chum_Nuoc_Men_Nau/Chum_Nuoc.glb','jar-glaze');
const stone=[],arch=[];
well.traverse(mesh=>{
  if(!mesh.isMesh||['Long_Gieng','Mat_Nuoc'].includes(mesh.name))return;
  const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  if(mesh.name==='Day_Thung'){
    // Replace the long central rope with one animated six-sided cylinder.
    const p=g.attributes.position,indices=g.index.array,kept=[];
    for(let i=0;i<indices.length;i+=3){
      const ids=[indices[i],indices[i+1],indices[i+2]];
      const x=ids.reduce((s,id)=>s+p.getX(id),0)/3,y=ids.reduce((s,id)=>s+p.getY(id),0)/3;
      if(x>-.015&&y<2.36)continue;
      kept.push(...ids);
    }
    g.setIndex(kept);
  }
  (mesh.material.name==='Van_Vom'?arch:stone).push(g);
});
const jarMesh=jar.getObjectByName('Than_Chum'),jarGeometry=jarMesh.geometry.clone().applyMatrix4(jarMesh.matrixWorld);
jarGeometry.computeBoundingBox();
const box=jarGeometry.boundingBox,scale=1.12/(box.max.y-box.min.y);
jarGeometry.translate(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2).scale(scale,scale,scale);
const interior=new T.Mesh(jarGeometry,new T.MeshBasicMaterial({side:T.DoubleSide}));
interior.updateMatrixWorld();
const waterLevels=[];
for(const fill of [0,.25,.5,.75,1]){
  const height=.18+fill*.74;let radius=Infinity;
  for(let i=0;i<48;i++){
    const angle=i/48*Math.PI*2,direction=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
    const hit=new T.Raycaster(new T.Vector3(0,height,0),direction,0,1).intersectObject(interior)[0];
    if(!hit)throw Error(`Open jar section at ${height}`);
    radius=Math.min(radius,hit.distance);
  }
  waterLevels.push({fill,height,radius:Math.floor((radius-.012)*10000)/10000});
}
function merged(parts){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());const welded=mergeVertices(merged,1e-5);merged.dispose();return welded;}
const originals=[merged(stone),merged(arch),mergeVertices(jarGeometry,1e-5)];
function reduce(source,ratio,error){
  const g=source.clone();let indices=Uint32Array.from(g.index.array);
  indices=MeshoptSimplifier.simplify(indices,g.attributes.position.array,3,Math.floor(indices.length*ratio/3)*3,error,[])[0];
  const [remap,count]=MeshoptEncoder.reorderMesh(indices,true,false),result=new T.BufferGeometry();
  for(const [name,a] of Object.entries(g.attributes)){
    if(!['position','normal','uv'].includes(name))continue;
    const values=new Float32Array(count*a.itemSize);
    for(let i=0;i<a.count;i++)if(remap[i]<count)for(let k=0;k<a.itemSize;k++)values[remap[i]*a.itemSize+k]=a.array[i*a.itemSize+k];
    result.setAttribute(name,new T.BufferAttribute(values,a.itemSize));
  }
  result.setIndex(new T.BufferAttribute(count<65536?Uint16Array.from(indices):indices,1));g.dispose();return result;
}
const names=['Well_Stone','Well_Arch','Jar_Body'],assets=[];
// Maps are loaded once through useTexture, shared by both geometry LODs and all four jars.
const materials=names.map(name=>({name,pbrMetallicRoughness:{roughnessFactor:.9,metallicFactor:0}}));
for(const low of [false,true]){
  const meshes=originals.map((geometry,i)=>({name:names[i],material:i,geometry:reduce(geometry,i===2?(low?.065:.16):(low?.18:.40),i===2?(low?.006:.0035):(low?.006:.0025))}));
  const probe=new T.Mesh(meshes[2].geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));
  probe.updateMatrixWorld();
  // Include the simplified inner wall in the fit: low LOD can move inward slightly.
  for(const level of waterLevels)for(let i=0;i<192;i++){
    const angle=i/192*Math.PI*2;
    const hit=new T.Raycaster(new T.Vector3(0,level.height,0),new T.Vector3(Math.sin(angle),0,Math.cos(angle)),0,1).intersectObject(probe)[0];
    if(!hit)throw Error(`Simplification opened the jar at ${level.height}`);
    level.radius=Math.min(level.radius,Math.floor((hit.distance-.008)*10000)/10000);
  }
  probe.material.dispose();
  const report=await writeMeshoptGLB(path.join(out,`water-stations-v1${low?'-low':''}.glb`),meshes,materials);
  report.parts=meshes.map(m=>({name:m.name,triangles:m.geometry.index.count/3}));
  assets.push(report);meshes.forEach(m=>m.geometry.dispose());
}
const layout=`/** Measured from the supplied water assets by scripts/prepare-water-assets.mjs. */\nexport const JAR_WATER_LEVELS=${JSON.stringify(waterLevels)} as const;\nexport const WELL_VISUAL={waterY:.23,waterRadius:.63,pulleyY:2.43,ropeX:.025,ropeZ:-.065,bucketLow:.17,bucketHigh:1.12} as const;\n`;
fs.writeFileSync('src/waterAssetLayout.ts',layout);
const textureBytes=textures.reduce((n,t)=>n+t.bytes,0);
const report={sources,assets,textures,waterLevels,highDownloadBytes:assets[0].bytes+textureBytes,lowDownloadBytes:assets[1].bytes+textureBytes,textureGpuBytesWithMipmaps:textures.reduce((n,t)=>n+t.width*t.height*4*4/3,0),jarGeometryCopies:1,jarDrawCalls:1,wellDrawCalls:2};
fs.writeFileSync(path.join(out,'asset-budget.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
