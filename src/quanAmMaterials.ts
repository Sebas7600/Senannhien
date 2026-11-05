import * as T from 'three';
const size=128,data=new Uint8Array(size*size*4);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size*Math.PI*2,v=y/size*Math.PI*2,warp=Math.sin(u+Math.sin(v)*1.3)*1.8+Math.sin(v*2)*.6,vein=Math.exp(-Math.abs(Math.sin(u*3+v*2+warp))*25),grain=Math.sin(x*73.23+y*127.7)*Math.sin(y*39.4-x*11.8)*2,n=250-vein*20+grain,i=(y*size+x)*4;data[i]=n;data[i+1]=n;data[i+2]=n-1;data[i+3]=255;}
export const quanAmVeinTexture=new T.DataTexture(data,size,size,T.RGBAFormat);quanAmVeinTexture.wrapS=quanAmVeinTexture.wrapT=T.RepeatWrapping;quanAmVeinTexture.repeat.set(3,4);quanAmVeinTexture.needsUpdate=true;
export const quanAmMarbleMaterial=new T.MeshStandardMaterial({vertexColors:true,map:quanAmVeinTexture,bumpMap:quanAmVeinTexture,bumpScale:.0018,roughness:.43,metalness:.025});
export const quanAmGoldMaterial=new T.MeshStandardMaterial({vertexColors:true,metalness:.68,roughness:.43});
export const quanAmLotusMaterial=new T.MeshStandardMaterial({vertexColors:true,map:quanAmVeinTexture,roughness:.57,metalness:0});
