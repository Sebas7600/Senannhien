import {useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import * as T from 'three';
import {cachedTempleRoofTemplate} from './templeRoofTemplate';
import {detailTempleRoof} from './TempleRoofDetail';

export default function ChanhDienRoof({y,width,depth}:{y:number;width:number;depth:number}){
 const {scene}=useGLTF('/assets/main-temple/tam-the-complete.glb?v=complete-20261103-4');
 const model=useMemo(()=>{const template=cachedTempleRoofTemplate(scene);const clone=template.clone(true);clone.traverse(node=>{if(!(node instanceof T.Mesh))return;const material=(node.material as T.MeshStandardMaterial).clone();material.side=T.DoubleSide;material.envMapIntensity=.85;if(material.name==='roof_tile')detailTempleRoof(material);node.material=material;});return clone;},[scene]);
 return <group name="Mai-dong-bo-Chanh-Dien" position={[0,y,0]} scale={[width,Math.max(width,depth),depth]} dispose={null}><primitive object={model}/></group>;
}
