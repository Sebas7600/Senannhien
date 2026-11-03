import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {CUSHION,type CushionLOD} from './cushionData';
const resolution=128,pixels=new Uint8Array(resolution*resolution*4);
for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const row=Math.floor(y/16),col=Math.floor(x/16),over=(row+col)%4<2;
  const across=(over?y:x)%16/16,along=(over?x:y)%16/16;
  const ridge=Math.pow(Math.sin(across*Math.PI),.55),strand=.025*Math.sin(across*Math.PI*10)+.012*Math.cos(along*Math.PI*6);
  const h=Math.round(255*(.2+.65*ridge+strand)),i=(y*resolution+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=h;pixels[i+3]=255;
}
export const cushionWeaveBump=new THREE.DataTexture(pixels,resolution,resolution,THREE.RGBAFormat);
cushionWeaveBump.wrapS=cushionWeaveBump.wrapT=THREE.RepeatWrapping;cushionWeaveBump.repeat.set(24,24);
cushionWeaveBump.generateMipmaps=true;cushionWeaveBump.minFilter=THREE.LinearMipmapLinearFilter;cushionWeaveBump.magFilter=THREE.LinearFilter;cushionWeaveBump.needsUpdate=true;
const materials=new WeakMap<THREE.Texture,Record<CushionLOD,THREE.MeshStandardMaterial>>();
export function useCushionMaterial(lod:CushionLOD){const albedo=useTexture(CUSHION.textureUrl);let cached=materials.get(albedo);
  if(!cached){albedo.colorSpace=THREE.SRGBColorSpace;albedo.anisotropy=4;albedo.needsUpdate=true;
    cached={near:new THREE.MeshStandardMaterial({map:albedo,color:'#e5dbc7',vertexColors:true,roughness:.91,bumpMap:cushionWeaveBump,bumpScale:.0018}),far:new THREE.MeshStandardMaterial({map:albedo,color:'#e5dbc7',vertexColors:true,roughness:.94})};materials.set(albedo,cached);
  }
  return cached[lod];
}
