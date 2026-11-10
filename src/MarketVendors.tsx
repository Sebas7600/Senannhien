import {useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as T from 'three';
import {merchants,sampleMerchantHead} from './merchantData';
import {useGame} from './gameStore';
import {useReducedMotion} from './useReducedMotion';
import {finishInstanceLayout} from './geometryBatch';
import {openSouvenirStall} from './souvenirActions';
import budget from '../public/assets/characters/merchants/vendor-budget.json';
import {sampleMerchantMotion,merchantMotionAttributes,merchantPositionMotion,merchantNormalMotion} from './merchantMotion';
const femaleMerchants=merchants.filter(merchant=>merchant.gender==='female');
const hairSlots=merchants.map(merchant=>femaleMerchants.findIndex(female=>female.id===merchant.id));

/** Eight shopkeepers share three instanced meshes. No runtime skeleton or animation mixer. */
export default function MarketVendors(){
 const quality=useGame(s=>s.quality),reduced=useReducedMotion();
 const {scene}=useGLTF(`/assets/characters/merchants/market-vendors${quality==='low'?'-low':''}.glb?v=${budget.revision}`);
 const body=useRef<T.InstancedMesh>(null),heads=useRef<T.InstancedMesh>(null),hair=useRef<T.InstancedMesh>(null),root=useRef<T.Group>(null);
 const geometries=useMemo(()=>['VendorBody','VendorHead','VendorHair'].map((name,part)=>{
  const geometry=(scene.getObjectByName(name) as T.Mesh).geometry.clone();
  const instances=part===2?femaleMerchants:merchants;
  geometry.setAttribute('merchantArmWeight',geometry.attributes.uv??new T.BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
  geometry.setAttribute('merchantBodyMask',new T.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(part===0?1:0),1));
  geometry.setAttribute('merchantMotion',new T.InstancedBufferAttribute(new Float32Array(instances.length*4),4));
  const rotations=new Float32Array(instances.length*4);instances.forEach((_,i)=>{rotations[i*4]=rotations[i*4+2]=1;});
  geometry.setAttribute('merchantArmRotation',new T.InstancedBufferAttribute(rotations,4));
  for(const [key,field] of [['merchantRobe','robe'],['merchantSkin','skin'],['merchantApron','apron']] as const){
   const values=new Float32Array(instances.length*3);instances.forEach((merchant,i)=>new T.Color(merchant[field]).toArray(values,i*3));geometry.setAttribute(key,new T.InstancedBufferAttribute(values,3));
  }
  return geometry;
 }),[scene]);
 const material=useMemo(()=>{
  const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.83});
  m.onBeforeCompile=shader=>{
   shader.uniforms.merchantRightPivot={value:new T.Vector3(...budget.rightElbow as [number,number,number])};
   shader.uniforms.merchantLeftPivot={value:new T.Vector3(...budget.leftElbow as [number,number,number])};
   shader.vertexShader='attribute vec3 merchantRobe;\nattribute vec3 merchantSkin;\nattribute vec3 merchantApron;\n'+merchantMotionAttributes+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
    if(abs(color.r-.65)<.01){vColor.rgb=merchantSkin;}
    else if(abs(color.r-.16)<.005&&abs(color.g-.05)<.007){vColor.rgb=merchantRobe;}
    else if(color.g>.7&&color.r<.06){vColor.rgb=merchantApron;}`);
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+merchantPositionMotion).replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n'+merchantNormalMotion);
  };
  m.customProgramCacheKey=()=>'market-vendor-motion-v2';return m;
 },[]);
 const state=useRef({step:1,visibilityTime:1,poses:merchants.map(()=>({yaw:0,pitch:0})),motions:merchants.map(()=>({sway:0,breath:0,right:0,left:0})),shown:merchants.map(()=>true),object:new T.Object3D(),head:new T.Object3D(),pivot:new T.Vector3(...budget.headPivot as [number,number,number]),clock:0});
 useEffect(()=>()=>material.dispose(),[material]);
 useLayoutEffect(()=>{
  const meshes=[body.current!,heads.current!,hair.current!],work=state.current;
  for(const mesh of meshes)mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  merchants.forEach((merchant,i)=>{
   work.object.position.set(merchant.x,merchant.y,merchant.z);work.object.rotation.set(0,merchant.heading,0);work.object.scale.setScalar(1);work.object.updateMatrix();body.current!.setMatrixAt(i,work.object.matrix);
   work.head.position.copy(work.pivot).applyAxisAngle(T.Object3D.DEFAULT_UP,merchant.heading).add(work.object.position);work.head.rotation.set(0,merchant.heading,0);work.head.scale.setScalar(1);work.head.updateMatrix();heads.current!.setMatrixAt(i,work.head.matrix);
   if(hairSlots[i]>=0)hair.current!.setMatrixAt(hairSlots[i],work.head.matrix);
   work.poses[i].yaw=work.poses[i].pitch=0;work.shown[i]=true;
   work.motions[i].sway=work.motions[i].breath=work.motions[i].right=work.motions[i].left=0;
  });
  for(const mesh of meshes){finishInstanceLayout(mesh);mesh.boundingSphere!.radius+=.45;mesh.boundingBox!.expandByScalar(.45);}
  work.step=work.visibilityTime=1;
  return()=>{meshes.forEach(mesh=>mesh.dispose());geometries.forEach(geometry=>geometry.dispose());};
 },[geometries]);
 useFrame(({camera},dt)=>{
  const s=state.current;s.step+=dt;s.visibilityTime+=dt;s.clock+=dt;
  if(s.step<(quality==='low'?1/15:1/24))return;
  const delta=Math.min(s.step,.12),blend=1-Math.exp(-delta*5);s.step=0;
  const position=useGame.getState().position,visibility=s.visibilityTime>=.25,range=quality==='low'?48:76;
  if(visibility){s.visibilityTime=0;root.current!.visible=Math.hypot(camera.position.x,camera.position.z-46.9)<range+18;}
  let bodyChanged=false,headChanged=false,motionChanged=false;
  merchants.forEach((merchant,i)=>{
   const shown=visibility?Math.hypot(camera.position.x-merchant.x,camera.position.z-merchant.z)<range:s.shown[i],changed=shown!==s.shown[i];
   if(changed){s.shown[i]=shown;s.object.position.set(merchant.x,merchant.y,merchant.z);s.object.rotation.set(0,merchant.heading,0);s.object.scale.setScalar(shown?1:0);s.object.updateMatrix();body.current!.setMatrixAt(i,s.object.matrix);bodyChanged=true;}
   if(!shown&&!changed)return;
   const motion=s.motions[i],previousSway=motion.sway,previousBreath=motion.breath,previousRight=motion.right,previousLeft=motion.left;
   sampleMerchantMotion(merchant,position,s.clock,reduced,motion);
   const moving=Math.abs(motion.sway-previousSway)+Math.abs(motion.breath-previousBreath)+Math.abs(motion.right-previousRight)+Math.abs(motion.left-previousLeft)>.00001;
   if(moving){(geometries[0].attributes.merchantMotion as T.InstancedBufferAttribute).setXYZW(i,motion.sway,motion.breath,0,0);(geometries[0].attributes.merchantArmRotation as T.InstancedBufferAttribute).setXYZW(i,Math.cos(motion.right),Math.sin(motion.right),Math.cos(motion.left),Math.sin(motion.left));motionChanged=true;}
   const pose=s.poses[i],previousYaw=pose.yaw,previousPitch=pose.pitch;sampleMerchantHead(merchant,position,s.clock,reduced,pose);pose.yaw=previousYaw+(pose.yaw-previousYaw)*blend;pose.pitch=previousPitch+(pose.pitch-previousPitch)*blend;
   if(!changed&&!moving&&Math.abs(pose.yaw-previousYaw)<.00005&&Math.abs(pose.pitch-previousPitch)<.00005)return;
   s.object.position.set(merchant.x,merchant.y,merchant.z);s.head.position.copy(s.pivot);s.head.position.x+=motion.sway;s.head.position.y+=motion.breath;s.head.position.applyAxisAngle(T.Object3D.DEFAULT_UP,merchant.heading).add(s.object.position);s.head.rotation.set(pose.pitch,merchant.heading+pose.yaw,0,'YXZ');s.head.scale.setScalar(shown?1:0);s.head.updateMatrix();heads.current!.setMatrixAt(i,s.head.matrix);
   if(hairSlots[i]>=0)hair.current!.setMatrixAt(hairSlots[i],s.head.matrix);headChanged=true;
  });
  if(bodyChanged)body.current!.instanceMatrix.needsUpdate=true;
  if(motionChanged){(geometries[0].attributes.merchantMotion as T.InstancedBufferAttribute).needsUpdate=true;(geometries[0].attributes.merchantArmRotation as T.InstancedBufferAttribute).needsUpdate=true;}
  if(headChanged)heads.current!.instanceMatrix.needsUpdate=hair.current!.instanceMatrix.needsUpdate=true;
 });
 const greet=(event:ThreeEvent<MouseEvent>)=>{if(event.delta>5||event.instanceId===undefined)return;event.stopPropagation();const merchant=(event.object===hair.current?femaleMerchants:merchants)[event.instanceId];if(merchant)openSouvenirStall(merchant.stallId);};
 return <group ref={root} name="Nguoi-ban-hang-An-Nhien" dispose={null}>
  <instancedMesh ref={body} args={[geometries[0],material,merchants.length]} onClick={greet} receiveShadow/>
  <instancedMesh ref={heads} args={[geometries[1],material,merchants.length]} onClick={greet} receiveShadow/>
  <instancedMesh ref={hair} args={[geometries[2],material,femaleMerchants.length]} onClick={greet} receiveShadow/>
 </group>;
}
