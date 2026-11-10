import {useLayoutEffect,useMemo,useRef} from 'react';
import * as T from 'three';
import {varyGroundTiles} from './materials';
import {bambooEntrances,bambooPath} from './mayaPaths';
const earthSurface=new T.BufferGeometry();earthSurface.setAttribute('position',new T.Float32BufferAttribute(bambooPath.position.map((v,i)=>i%3===1?.077:v),3));earthSurface.setIndex(bambooPath.index);earthSurface.computeVertexNormals();const uv=new Float32Array(bambooPath.position.length/3*2);for(let i=0;i<uv.length/2;i++){uv[i*2]=bambooPath.position[i*3]/2.4;uv[i*2+1]=bambooPath.position[i*3+2]/2.4;}earthSurface.setAttribute('uv',new T.BufferAttribute(uv,2));
const edges: {x:number;z:number;length:number;rotation:number}[]=[];
const boundary=new Map<string,{a:number[];b:number[];count:number}>();
for(let i=0;i<bambooPath.index.length;i+=3)for(let j=0;j<3;j++){const ai=bambooPath.index[i+j]*3,bi=bambooPath.index[i+(j+1)%3]*3,a=[bambooPath.position[ai],bambooPath.position[ai+2]],b=[bambooPath.position[bi],bambooPath.position[bi+2]],key=[a.map(v=>v.toFixed(4)).join(','),b.map(v=>v.toFixed(4)).join(',')].sort().join('|');const old=boundary.get(key);if(old)old.count++;else boundary.set(key,{a,b,count:1});}
for(const {a,b,count} of boundary.values())if(count===1){
 const atEntrance=bambooEntrances.some(({axis,edge})=>{const component=axis==='x'?0:1;return Math.abs(a[component]-edge)<.1&&Math.abs(b[component]-edge)<.1;});
 if(atEntrance)continue;
 const dx=b[0]-a[0],dz=b[1]-a[1];edges.push({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,length:Math.hypot(dx,dz),rotation:-Math.atan2(dz,dx)});}
function gravelTexture(earth=false){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d')!;c.fillStyle=earth?'#967951':'#96988b';c.fillRect(0,0,512,512);
 let seed=817;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 if(earth)for(let i=0;i<20000;i++){const shade=90+Math.floor(rand()*70);c.fillStyle=`rgba(${shade+18},${shade},${shade-28},.22)`;c.fillRect(rand()*512,rand()*512,1+rand()*4,1+rand()*4);}
 for(let i=0;i<(earth?1900:12000);i++){const x=rand()*512,y=rand()*512,r=.6+rand()*(earth?1.8:3);const shade=115+Math.floor(rand()*65);c.fillStyle=`rgb(${shade+5},${shade+3},${shade-8})`;c.beginPath();c.ellipse(x,y,r,r*(.5+rand()*.5),rand()*Math.PI,0,Math.PI*2);c.fill();}
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export default function MayaPaths(){const border=useRef<T.InstancedMesh>(null);
 const earth=useMemo(()=>{
  const map=gravelTexture(true);
  const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,roughness:1});
  varyGroundTiles(material,'bamboo-soil');
  return material;
 },[]);
 useLayoutEffect(()=>{const pose=new T.Object3D();edges.forEach((edge,i)=>{pose.position.set(edge.x,.125,edge.z);pose.rotation.set(0,edge.rotation,0);pose.scale.set(edge.length,.13,.18);pose.updateMatrix();border.current!.setMatrixAt(i,pose.matrix)});border.current!.instanceMatrix.needsUpdate=true;border.current!.computeBoundingSphere();},[]);
 return <group name="Duong-soi-theo-pCube-Maya"><mesh geometry={earthSurface} material={earth} receiveShadow/><instancedMesh ref={border} args={[undefined,undefined,edges.length]} receiveShadow castShadow><boxGeometry/><meshStandardMaterial color="#b8b0a0" roughness={.92}/></instancedMesh></group>;
}
