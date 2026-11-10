import {memo,useLayoutEffect,useMemo,useRef} from 'react';
import {useTexture} from '@react-three/drei';
import type {ThreeEvent} from '@react-three/fiber';
import * as T from 'three';
import {finishInstanceLayout} from './geometryBatch';
import {buildCheckoutShell,buildCheckoutScreens,checkoutPose,checkoutScreenStall,CHECKOUT_SCREEN_IMAGES} from './marketCheckout';
import {souvenirStalls} from './souvenirData';
import {openSouvenirStall} from './souvenirActions';

const shell=buildCheckoutShell(),screens=buildCheckoutScreens();
const shellMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.56,metalness:.12});
export default memo(function MarketTerminals(){
 const instances=useRef<T.InstancedMesh>(null);
 const [staff,guest]=useTexture([CHECKOUT_SCREEN_IMAGES.staff,CHECKOUT_SCREEN_IMAGES.guest]);
 const screenMaterials=useMemo(()=>[guest,staff].map(map=>new T.MeshBasicMaterial({map,toneMapped:false})),[guest,staff]);
 useLayoutEffect(()=>{
  for(const texture of [staff,guest]){texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;texture.needsUpdate=true;}
  souvenirStalls.forEach((stall,i)=>instances.current!.setMatrixAt(i,checkoutPose(stall)));finishInstanceLayout(instances.current);
 },[staff,guest]);
 useLayoutEffect(()=>()=>{screenMaterials.forEach(material=>material.dispose());},[screenMaterials]);
 const open=(event:ThreeEvent<MouseEvent>,index:number)=>{if(event.delta>5||!souvenirStalls[index])return;event.stopPropagation();openSouvenirStall(souvenirStalls[index].id);};
 return <group name="ATT900-quay-luu-niem" dispose={null}>
  <instancedMesh ref={instances} args={[shell,shellMaterial,souvenirStalls.length]} receiveShadow onClick={event=>open(event,event.instanceId??-1)}/>
  <mesh geometry={screens} material={screenMaterials} onClick={event=>open(event,checkoutScreenStall(event.faceIndex??-1))}/>
 </group>;
});
