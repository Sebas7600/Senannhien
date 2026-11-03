import * as THREE from 'three';
// One shared 256² data texture: R = soft surface variation, G = leaf veins.
// Generated once, repeatable and seamless. No bitmap downloads or per-frame work.
export const FOLIAGE_TEXTURE_SIZE=256;
const size=FOLIAGE_TEXTURE_SIZE,data=new Uint8Array(size*size*4);
let seed=9147;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size,v=(y+.5)/size,dx=Math.abs(u-.5);
  const main=Math.exp(-Math.pow(dx/.009,2));
  const branchPhase=v-dx*.78-dx*dx*.42;
  const branchDistance=Math.abs((branchPhase*7+.5)-Math.floor(branchPhase*7+.5)-.5)/7;
  const lateral=Math.exp(-Math.pow(branchDistance/.006,2))*THREE.MathUtils.smoothstep(.48-dx,0,.12);
  const grain=random(),variation=.5+.16*Math.sin(u*Math.PI*8)*Math.sin(v*Math.PI*6)+.10*Math.cos((u+v)*Math.PI*12)+(grain-.5)*.18;
  const i=(y*size+x)*4;data[i]=Math.round(THREE.MathUtils.clamp(variation,0,1)*255);data[i+1]=Math.round(Math.max(main,lateral*.75)*255);data[i+2]=0;data[i+3]=255;
}
export const foliageTexture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
foliageTexture.wrapS=foliageTexture.wrapT=THREE.RepeatWrapping;
foliageTexture.magFilter=THREE.LinearFilter;foliageTexture.minFilter=THREE.LinearMipmapLinearFilter;
foliageTexture.generateMipmaps=true;foliageTexture.needsUpdate=true;
