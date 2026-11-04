import * as THREE from 'three';
let texture:THREE.DataTexture|undefined;
export function gardenSoilTexture(){if(texture)return texture;const size=128,data=new Uint8Array(size*size*4);let seed=173;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296,clod=Math.sin(x*.31+Math.cos(y*.23)*2)*Math.cos(y*.28),furrow=Math.pow(Math.max(0,Math.cos(y/size*Math.PI*8)),12),v=.74+n*.33+clod*.10-furrow*.15;const i=(y*size+x)*4;data[i]=Math.min(255,167*v);data[i+1]=Math.min(255,135*v);data[i+2]=Math.min(255,99*v);data[i+3]=255}
 texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture}
