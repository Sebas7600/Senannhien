import {gardenSoilTexture} from './gardenSoil';
import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {gardenPlots,distance} from './gameData';
import {useGame,type PlotState} from './gameStore';
import {gardenStatus} from './gardenStatus';
function bedGeometry(){const s=new THREE.Shape(),w=1.25,h=1.1,r=.07;s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:2});g.rotateX(-Math.PI/2);return g}
/** Curved, tapered blade with scalloped edges and a pale raised central vein. */
function leafGeometry(){const vertices:number[]=[],colors:number[]=[],indices:number[]=[];for(let row=0;row<=8;row++){const t=row/8,width=Math.pow(Math.sin(t*Math.PI),.8)*.29*(row%2?.94:1),height=t*.8,curve=t*t*.48;for(let col=0;col<3;col++){vertices.push((col-1)*width,height,curve+(col===1?.025:0));const green=col===1?new THREE.Color('#b6cc85'):new THREE.Color(row%2?'#83a96a':'#91b373');colors.push(green.r,green.g,green.b)}}for(let row=0;row<8;row++)for(let col=0;col<2;col++){const a=row*3+col,b=a+3;indices.push(a,b,a+1,a+1,b,b+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g}
const GardenBatches=memo(function GardenBatches({plots,tick}:{plots:Record<string,PlotState>;tick:number}){
 const beds=useRef<THREE.InstancedMesh>(null),soil=useRef<THREE.InstancedMesh>(null),leaves=useRef<THREE.InstancedMesh>(null),bamboo=useRef<THREE.InstancedMesh>(null),stems=useRef<THREE.InstancedMesh>(null),clods=useRef<THREE.InstancedMesh>(null);
 const soilTexture=useMemo(gardenSoilTexture,[]);const geometry=useMemo(bedGeometry,[]),leaf=useMemo(leafGeometry,[]);
 useLayoutEffect(()=>{const o=new THREE.Object3D(),color=new THREE.Color(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();let leafIndex=0,bambooIndex=0,stemIndex=0;
 const culm=(a:[number,number,number],b:[number,number,number],radius:number,c:string)=>{direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);o.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);o.quaternion.setFromUnitVectors(up,direction.clone().normalize());o.scale.set(radius,direction.length(),radius);o.updateMatrix();bamboo.current!.setMatrixAt(bambooIndex,o.matrix);bamboo.current!.setColorAt(bambooIndex++,color.set(c))};
 gardenPlots.forEach((p,index)=>{const state=plots[p.id],g=gardenStatus(state).growth;
 o.rotation.set(0,0,0);o.position.set(p.x,.06,p.z);o.scale.set(1,.17,1);o.updateMatrix();beds.current!.setMatrixAt(index,o.matrix);beds.current!.setColorAt(index,color.set('#b09a7d'));
 o.position.y=.22;o.scale.set(.94,.035,.94);o.updateMatrix();soil.current!.setMatrixAt(index,o.matrix);soil.current!.setColorAt(index,color.set(state?.wateredAt&&!state.harvested?'#4c3426':'#bd9b75'));
 for(const side of [-1,1]){
  culm([p.x-1.22,.25,p.z+side*1.07],[p.x+1.22,.25,p.z+side*1.07],.045,'#a99763');
  culm([p.x+side*1.22,.25,p.z-1.07],[p.x+side*1.22,.25,p.z+1.07],.045,'#a99763');
  for(const k of [-.75,0,.75]){culm([p.x+k-.018,.25,p.z+side*1.07],[p.x+k+.018,.25,p.z+side*1.07],.053,'#756d45');culm([p.x+side*1.22,.25,p.z+k-.018],[p.x+side*1.22,.25,p.z+k+.018],.053,'#756d45')}
  for(const edge of [-1,1])culm([p.x+edge*1.2,.08,p.z+side*1.05],[p.x+edge*1.2,.34,p.z+side*1.05],.037,'#8b8255');
 }
 for(let k=0;k<48;k++){const noise=(Math.sin(index*93+k*37.71)*43758.5453)%1,dx=(k%8-3.5)*.27+noise*.045,dz=(Math.floor(k/8)-2.5)*.31; o.position.set(p.x+dx,.26,p.z+dz);o.rotation.set(k*.37,k*2.4,noise);o.scale.set(.055+Math.abs(noise)*.035,.016+Math.abs(noise)*.017,.055+Math.abs(noise)*.025);o.updateMatrix();clods.current!.setMatrixAt(index*48+k,o.matrix);clods.current!.setColorAt(index*48+k,color.set(state?.wateredAt&&!state.harvested?(k%2?'#553a29':'#3e2b20'):(k%2?'#ab845b':'#c29a6b')));}
 if(g<=0)return;
 for(let j=0;j<6;j++){const x=p.x+(j%3-1)*.66,z=p.z+(j<3?-.48:.48),size=.18+.82*g;
 o.rotation.set(0,0,0);o.position.set(x,.255+.08*size,z);o.scale.set(.022*size,.16*size,.022*size);o.updateMatrix();stems.current!.setMatrixAt(stemIndex++,o.matrix);
 for(let k=0;k<7;k++){const angle=k*Math.PI*2/7+j*.47,outer=k<5,scale=size*(outer?.48:.38);o.position.set(x,.27,z);o.rotation.set(outer?.35:-.12,angle,0);o.scale.set(scale*(outer?1:.85),scale,scale);o.updateMatrix();leaves.current!.setMatrixAt(leafIndex,o.matrix);leaves.current!.setColorAt(leafIndex++,color.set(k%3===0?'#77945b':k%3===1?'#90a86c':'#a4b87b'))}
 }
 });
 leaves.current!.count=leafIndex;bamboo.current!.count=bambooIndex;stems.current!.count=stemIndex;
 for(const ref of [beds,soil,leaves,bamboo,stems,clods]){ref.current!.instanceMatrix.needsUpdate=true;if(ref.current!.instanceColor)ref.current!.instanceColor!.needsUpdate=true}
 },[plots,tick]);
 return <><instancedMesh ref={clods} args={[undefined,undefined,576]} frustumCulled={false}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={1}/></instancedMesh><instancedMesh ref={beds} args={[geometry,undefined,12]} frustumCulled={false} receiveShadow><meshStandardMaterial map={soilTexture} bumpMap={soilTexture} bumpScale={.045} roughness={1}/></instancedMesh><instancedMesh ref={soil} args={[geometry,undefined,12]} frustumCulled={false} receiveShadow><meshStandardMaterial map={soilTexture} bumpMap={soilTexture} bumpScale={.12} roughness={1}/></instancedMesh><instancedMesh ref={bamboo} args={[undefined,undefined,240]} frustumCulled={false}><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial roughness={.95}/></instancedMesh><instancedMesh ref={stems} args={[undefined,undefined,72]} frustumCulled={false}><cylinderGeometry args={[1,1,1,5]}/><meshStandardMaterial color="#a2b281" roughness={1}/></instancedMesh><instancedMesh ref={leaves} args={[leaf,undefined,504]} frustumCulled={false}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1}/></instancedMesh></>
});
export default function TempleGarden(){const plots=useGame(s=>s.plots),tick=useGame(s=>s.sessionSeconds),position=useGame(s=>s.position),pending=useGame(s=>s.gardenPending);
 const closest=gardenPlots.reduce((a,b)=>distance(position,[a.x,a.z])<distance(position,[b.x,b.z])?a:b),near=distance(position,[closest.x,closest.z])<=3;
 const state=plots[closest.id],status=gardenStatus(state),index=Number(closest.id.slice(5));
 return <group><mesh position={[36,.075,-50]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[19,15]}/><meshStandardMaterial color="#b09c7a" map={gardenSoilTexture()} bumpMap={gardenSoilTexture()} bumpScale={.025} roughness={1}/></mesh><GardenBatches plots={plots} tick={tick}/>
 {gardenPlots.map(p=><mesh key={p.id} position={[p.x,.27,p.z]} onClick={e=>{e.stopPropagation();useGame.getState().garden(p.id)}}><boxGeometry args={[2.5,.5,2.2]}/><meshBasicMaterial visible={false}/></mesh>)}
 {near&&<Html position={[closest.x,.85,closest.z]} center distanceFactor={10} zIndexRange={[3,0]}><button className={'garden-plot temple-plot '+(status.action==='harvest'?'ready':'')} disabled={pending!==null} aria-label={'Luống '+(index+1)+' · '+status.label} onClick={()=>useGame.getState().garden(closest.id)}><strong>Rau cải · Luống {index+1}</strong><span>{pending===closest.id?'Đang chăm cây…':status.label}</span>{state?.by&&<small>{state.harvested?'Thu hoạch':'Chăm gần nhất'}: {state.by}</small>}</button></Html>}
 </group>
}
