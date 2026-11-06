import {useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {Box} from './models';
import {TemplePlaque} from './TemplePlaque';

/** Three paintings share one atlas. Frames have dark wood, gold liners and corner scrolls. */
export function TeaGallery(){
  const atlas=useTexture('/art/tea-triptych.webp');
  const paintings=useMemo(()=>[0,1,2].map(i=>{const t=atlas.clone();t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(1/3,1);t.offset.set(i/3,0);t.needsUpdate=true;return t}),[atlas]);
  return <><TemplePlaque kind="tea" position={[0,3.82,-6.14]}/><group position={[0,0,-6.17]}>
    {[-6,0,6].map((x,i)=><group key={x} position={[x,1.7,0]} scale={[1,.88,1]}>
      <Box position={[0,0,0]} scale={[1.9,2.5,.12]} color="#633b28"/>
      <Box position={[0,0,.075]} scale={[1.71,2.31,.045]} color="#b3975d"/>
      <mesh position={[0,0,.105]}><planeGeometry args={[1.58,2.18]}/><meshBasicMaterial map={paintings[i]}/></mesh>
      {[-1,1].flatMap(a=>[-1,1].map(b=><group key={`${a}-${b}`} position={[a*.86,b*1.16,.11]}>
        <mesh rotation={[0,0,a*b*Math.PI/2]}><torusGeometry args={[.085,.015,4,12,Math.PI*1.5]}/><meshStandardMaterial color="#c0a263" metalness={.5}/></mesh>
      </group>))}
    </group>)}
  </group></>;
}
