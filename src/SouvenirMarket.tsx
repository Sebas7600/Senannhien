import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {finishInstanceLayout} from './geometryBatch';
import {buildSouvenirPlot} from './souvenirGeometry';
import {souvenirCatalog,souvenirStalls,souvenirPlots,SOUVENIR_ATLAS} from './souvenirData';
import {useGame} from './gameStore';
import {openSouvenirStall} from './souvenirActions';
import MarketVendors from './MarketVendors';
import MarketTerminals from './MarketTerminals';
import {drawSouvenirPlaque} from './souvenirSignArt';

const plots=souvenirPlots.map(stalls=>buildSouvenirPlot(stalls));
let materialCache:ReturnType<typeof createMaterials>|undefined;
function createMaterials(){
 function texture(wood:boolean){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=wood?512:256;const c=canvas.getContext('2d')!;
  c.fillStyle=wood?'#eadcc6':'#eee9dc';c.fillRect(0,0,canvas.width,canvas.height);
  let seed=81;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  if(wood)for(let i=0;i<420;i++){
   const x=rand()*256;c.strokeStyle=`rgba(83,59,33,${.03+rand()*.12})`;c.lineWidth=.3+rand()*1.5;c.beginPath();
   for(let y=0;y<=512;y+=12){const xx=x+Math.sin(y*.018+i)*2.9;if(y===0)c.moveTo(xx,y);else c.lineTo(xx,y);}c.stroke();
  }else for(let i=0;i<256;i+=2){c.fillStyle=i%4?'#dad5c644':'#fff9ed55';c.fillRect(i,0,1,256);c.fillRect(0,i,256,1);}
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
 }
 const wood=texture(true),cloth=texture(false);
 const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=1024;const c=atlas.getContext('2d')!;
 const cell=(index:number,draw:()=>void)=>{c.save();c.translate(index%SOUVENIR_ATLAS.columns*512,Math.floor(index/SOUVENIR_ATLAS.columns)*1024/SOUVENIR_ATLAS.rows);c.scale(1,1024/SOUVENIR_ATLAS.rows/256);draw();c.restore();};
 souvenirCatalog.forEach((item,i)=>cell(i,()=>drawSouvenirPlaque(c,item.short,souvenirStalls[i].cloth,item.material)));
 // Books retain their own cells when the new produce and incense signs are added.
 for(let i=0;i<2;i++)cell(SOUVENIR_ATLAS.bookUpright+i,()=>{
  c.fillStyle=i?'#4d6669':'#81634d';c.fillRect(0,0,512,256);c.strokeStyle='#c5ae77';c.lineWidth=3;c.strokeRect(20,13,472,230);
  c.save();c.translate(256,125);c.strokeStyle='#dac799';c.lineWidth=3;
  for(const side of [-1,1]){c.beginPath();c.moveTo(0,51);c.bezierCurveTo(side*70,41,side*80,-7,side*8,27);c.stroke();}
  c.beginPath();c.moveTo(0,42);c.bezierCurveTo(-30,3,-28,-26,0,-44);c.bezierCurveTo(28,-26,30,3,0,42);c.stroke();c.restore();
  c.fillStyle='#d0bd89';c.font='15px "Segoe UI",sans-serif';c.textAlign='center';c.fillText('TÂM AN · SEN AN NHIÊN',256,218);
  for(let j=0;j<8;j++){c.fillStyle='#bda67d';c.fillRect(10,25+j*27,17,3);}
 });
 const signage=new T.CanvasTexture(atlas);signage.colorSpace=T.SRGBColorSpace;signage.anisotropy=4;
 return {
  wood:new T.MeshStandardMaterial({map:wood,vertexColors:true,roughness:.83,bumpMap:wood,bumpScale:.012}),
  cloth:new T.MeshStandardMaterial({map:cloth,vertexColors:true,roughness:.97,bumpMap:cloth,bumpScale:.008}),
  metal:new T.MeshStandardMaterial({vertexColors:true,roughness:.47,metalness:.55}),
  goods:new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.13}),
  paper:new T.MeshStandardMaterial({map:cloth,vertexColors:true,roughness:1}),
  glow:new T.MeshStandardMaterial({vertexColors:true,emissive:'#ffd99b',emissiveIntensity:.45,roughness:.8}),
  signs:new T.MeshStandardMaterial({map:signage,roughness:1,emissiveMap:signage,emissive:'#ffffff',emissiveIntensity:.18}),
  bead:new T.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:.002,roughness:.37,metalness:.10}),
 };
}
export function souvenirMaterials(){return materialCache??(materialCache=createMaterials());}
export function signGeometry(plot:typeof plots[number]){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 plot.signs.forEach(({p,width,height,rotation,index,pitch=0},i)=>{
  const c=Math.cos(rotation),s=Math.sin(rotation);
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const dx=x*width/2,dy=y*height/2,dz=dy*Math.sin(pitch);positions.push(p[0]+dx*c+dz*s,p[1]+dy*Math.cos(pitch),p[2]-dx*s+dz*c);}
  const u=index%SOUVENIR_ATLAS.columns/SOUVENIR_ATLAS.columns,v=1-Math.floor(index/SOUVENIR_ATLAS.columns)/SOUVENIR_ATLAS.rows,h=1/SOUVENIR_ATLAS.rows;
  uv.push(u,v-h,u+.5,v-h,u,v,u+.5,v);indices.push(i*4,i*4+1,i*4+2,i*4+2,i*4+1,i*4+3);
 });
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const signMeshes=plots.map(signGeometry),beadGeometry=new T.SphereGeometry(1,6,4),lowBeadGeometry=new T.SphereGeometry(1,6,3);
function Plot({index}:{index:number}){
 const plot=plots[index],details=useRef<T.Group>(null),beads=useRef<T.InstancedMesh>(null),elapsed=useRef(0),quality=useGame(s=>s.quality);
 const materials=useMemo(souvenirMaterials,[]);
 useLayoutEffect(()=>{const pose=new T.Object3D(),color=new T.Color();plot.beads.forEach((b,i)=>{pose.position.set(...b.p);pose.scale.setScalar(b.size);pose.updateMatrix();beads.current!.setMatrixAt(i,pose.matrix);beads.current!.setColorAt(i,color.set(b.color));});finishInstanceLayout(beads.current);},[plot,quality]);
 useFrame(({camera},dt)=>{elapsed.current+=dt;if(elapsed.current<.25)return;elapsed.current=0;if(details.current){const dx=camera.position.x-(index? -10.6:10.6),dz=camera.position.z-46.9;details.current.visible=dx*dx+dz*dz<(quality==='low'?38:64)**2;}});
 return <group name={index?'Luu-niem-Tay':'Luu-niem-Dong'} dispose={null}>
  {(['wood','cloth','glow'] as const).map(kind=><mesh key={kind} geometry={plot.geometry[kind]} material={materials[kind]} castShadow={kind!=='glow'} receiveShadow/>)}
  <mesh geometry={signMeshes[index]} material={materials.signs}/>
  <group ref={details}>
   {(['metal','goods','paper'] as const).map(kind=><mesh key={kind} geometry={plot.geometry[kind]} material={materials[kind]} receiveShadow/>)}
   <instancedMesh ref={beads} args={[quality==='low'?lowBeadGeometry:beadGeometry,materials.bead,plot.beads.length]}/>
  </group>
  {souvenirPlots[index].map(stall=><mesh key={stall.id} position={[stall.x,1.4,stall.z]} rotation={[0,stall.rotation,0]} onClick={event=>{if(event.delta>5)return;event.stopPropagation();openSouvenirStall(stall.id);}}>
   <boxGeometry args={[5.5,2.7,3.6]}/><meshBasicMaterial visible={false}/>
  </mesh>)}
 </group>;
}
export default memo(function SouvenirMarket(){return <group name="Pho-luu-niem-An-Nhien"><Plot index={0}/><Plot index={1}/><MarketVendors/><MarketTerminals/></group>;});
