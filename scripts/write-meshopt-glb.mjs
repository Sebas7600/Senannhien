import fs from 'node:fs';
import * as T from 'three';
import meshoptimizer from 'meshoptimizer';
const {MeshoptEncoder}=meshoptimizer;
/** Export pre-batched static meshes. The existing drei decoder reads this without a CDN. */
export async function writeMeshoptGLB(file,meshes,materials,{images,textures,samplers}={}){
  await MeshoptEncoder.ready;
  const j={asset:{version:'2.0',generator:'Sen An Nhien static asset pipeline'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials,images,textures,samplers,accessors:[],bufferViews:[],buffers:[],extensionsUsed:['EXT_meshopt_compression'],extensionsRequired:['EXT_meshopt_compression']},chunks=[];
  let length=0,fallback=0,triangles=0;
  function accessor(a,type,mode){const raw=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength),stride=a.itemSize*a.array.BYTES_PER_ELEMENT,encoded=MeshoptEncoder.encodeGltfBuffer(raw,a.count,stride,mode),off=length;chunks.push(Buffer.from(encoded));length+=encoded.length;const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}fallback=(fallback+3)&~3;
    const view=j.bufferViews.length;j.bufferViews.push({buffer:1,byteOffset:fallback,byteLength:raw.length,extensions:{EXT_meshopt_compression:{buffer:0,byteOffset:off,byteLength:encoded.length,byteStride:stride,count:a.count,mode,filter:'NONE'}}});fallback+=raw.length;
    const def={bufferView:view,componentType:a.array instanceof Float32Array?5126:a.array instanceof Uint16Array?5123:5125,count:a.count,type};if(type==='VEC3'){const b=new T.Box3().setFromBufferAttribute(a);def.min=b.min.toArray();def.max=b.max.toArray();}j.accessors.push(def);return j.accessors.length-1;
  }
  for(const m of meshes){const g=m.geometry,attributes={};for(const [name,semantic,type] of [['position','POSITION','VEC3'],['normal','NORMAL','VEC3'],['uv','TEXCOORD_0','VEC2'],['color','COLOR_0','VEC3']])if(g.attributes[name])attributes[semantic]=accessor(g.attributes[name],type,'ATTRIBUTES');triangles+=g.index.count/3;const mesh=j.meshes.length;j.meshes.push({name:m.name,primitives:[{attributes,indices:accessor(g.index,'SCALAR','TRIANGLES'),material:m.material}]});j.nodes.push({name:m.name,mesh,...(m.translation?{translation:m.translation}:{})});j.scenes[0].nodes.push(mesh);}
  j.buffers=[{byteLength:length},{byteLength:fallback,extensions:{EXT_meshopt_compression:{fallback:true}}}];let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),h=Buffer.alloc(20),bh=Buffer.alloc(8);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+bin.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);const bytes=Buffer.concat([h,json,bh,bin]);fs.writeFileSync(file,bytes);return {file:file.replaceAll('\\','/').split('/').at(-1),bytes:bytes.length,triangles,draws:meshes.length,decodedGeometryBytes:fallback};
}
