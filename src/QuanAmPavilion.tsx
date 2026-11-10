import {useMemo,useEffect} from 'react';
import {useGLTF} from '@react-three/drei';
import {cachedTempleRoofTemplate} from './templeRoofTemplate';
import {createPavilionFrame,PAVILION_ROOF} from './quanAmPavilionFrame';
import ChanhDienRoof from './ChanhDienRoof';
export default function QuanAmPavilion(){
 const {scene}=useGLTF('/assets/main-temple/tam-the-complete.glb?v=complete-20261103-4');
 const frame=useMemo(()=>createPavilionFrame(cachedTempleRoofTemplate(scene)),[scene]);
 useEffect(()=>()=>frame.dispose(),[frame]);
 return <group name="Nha-Quan-Am-mai-Chanh-Dien" dispose={null}>
 <ChanhDienRoof {...PAVILION_ROOF}/>
 <mesh geometry={frame} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.81}/></mesh>
 </group>;
}
