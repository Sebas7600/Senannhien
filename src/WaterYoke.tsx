import {useRef} from 'react';import {useFrame} from '@react-three/fiber';import * as T from 'three';
import {yokeWoodGeometry,yokeBucketGeometry,yokeWaterGeometry,wellWoodMaterial,bucketMaterial} from './waterTaskGeometry';
const surface=new T.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.08});
const streamGeometry=new T.CylinderGeometry(.016,.009,.32,5),streamMaterial=new T.MeshBasicMaterial({color:'#99bdba'});
export default function WaterYoke({pouring,moving,reduced,anchor=[.18,.45,0]}:{pouring:boolean;moving:boolean;reduced:boolean;anchor?:[number,number,number]}){
  const root=useRef<T.Group>(null);useFrame(({clock})=>{if(!root.current)return;root.current.rotation.x=pouring?-.35:reduced?0:Math.sin(clock.elapsedTime*5.2)*(moving?.025:.006);root.current.position.y=anchor[1]+(pouring?.22:0);});
  return <group ref={root} position={anchor} dispose={null}><mesh geometry={yokeWoodGeometry} material={wellWoodMaterial}/><mesh geometry={yokeBucketGeometry} material={bucketMaterial}/><mesh geometry={yokeWaterGeometry} material={surface}/>{pouring&&<mesh geometry={streamGeometry} material={streamMaterial} position={[0,-.73,1.14]} rotation={[.35,0,0]}/>}</group>;
}
