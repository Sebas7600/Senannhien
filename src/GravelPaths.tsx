import {useLayoutEffect,useMemo,useRef} from 'react';
import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useOutdoorSurface,varyGroundTiles} from './materials';
import {bambooEntrances,bambooPath,mayaPaths,pathPoint,onLayoutPath} from './mayaPaths';
const pathGeometry=(paths:typeof mayaPaths)=>mergeGeometries(paths.map(path=>{
 const g=new T.PlaneGeometry(path.length,path.width).rotateX(-Math.PI/2).rotateY(path.rotation).translate(path.x,.076,path.z);
 const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/2.4,pos.getZ(i)/2.4);return g;
}));
const earthSurface=new T.BufferGeometry();earthSurface.setAttribute('position',new T.Float32BufferAttribute(bambooPath.position.map((v,i)=>i%3===1?.077:v),3));earthSurface.setIndex(bambooPath.index);earthSurface.computeVertexNormals();const uv=new Float32Array(bambooPath.position.length/3*2);for(let i=0;i<uv.length/2;i++){uv[i*2]=bambooPath.position[i*3]/2.4;uv[i*2+1]=bambooPath.position[i*3+2]/2.4;}earthSurface.setAttribute('uv',new T.BufferAttribute(uv,2));
const gravelSurface=pathGeometry(mayaPaths.filter(path=>path.id==='pCube3'));
const edges: {x:number;z:number;length:number;rotation:number}[]=[];
for(const path of mayaPaths.filter(path=>path.id==='pCube3'))for(const [axis,side] of [[0,-1],[0,1],[1,-1],[1,1]]){
 const length=axis===0?path.length:path.width,steps=Math.ceil(length/.24),step=length/steps;
 let start:number|null=null;
 for(let i=0;i<=steps;i++){
  const at=-length/2+(i+.5)*step,local=axis===0?[at,side*(path.width/2+.09)]:[side*(path.length/2+.09),at];
  const [x,z]=pathPoint(path,local[0],local[1]);
  const exposed=i<steps&&!onLayoutPath(x,z,-.025);
  if(exposed&&start===null)start=i;
  if(!exposed&&start!==null){const center=-length/2+(start+i)*step/2;const [cx,cz]=pathPoint(path,axis===0?center:side*(path.length/2+.09),axis===0?side*(path.width/2+.09):center);edges.push({x:cx,z:cz,length:(i-start)*step,rotation:path.rotation+(axis===0?0:Math.PI/2)});start=null;}
 }
}
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
export default function MayaPaths(){const paving=useOutdoorSurface('herringbone'),border=useRef<T.InstancedMesh>(null);
 const earth=useMemo(()=>{
  const map=gravelTexture(true);
  const material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,roughness:1});
  varyGroundTiles(material,'bamboo-soil');
  return material;
 },[]);
 useLayoutEffect(()=>{const pose=new T.Object3D();edges.forEach((edge,i)=>{pose.position.set(edge.x,.125,edge.z);pose.rotation.set(0,edge.rotation,0);pose.scale.set(edge.length,.13,.18);pose.updateMatrix();border.current!.setMatrixAt(i,pose.matrix)});border.current!.instanceMatrix.needsUpdate=true;border.current!.computeBoundingSphere();},[]);
 return <group name="Duong-soi-theo-pCube-Maya"><mesh geometry={earthSurface} material={earth} receiveShadow/><mesh geometry={gravelSurface} material={paving} receiveShadow/><instancedMesh ref={border} args={[undefined,undefined,edges.length]} receiveShadow castShadow><boxGeometry/><meshStandardMaterial color="#b8b0a0" roughness={.92}/></instancedMesh></group>;
}
