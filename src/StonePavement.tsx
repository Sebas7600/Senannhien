import {useLayoutEffect,useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as T from 'three';
import {pavementGeometry} from './pondGeometry';
import {POND} from './pondLayout';

const root='/assets/textures/pavement-8-';
const maps=[root+'color.webp',root+'normal.webp',root+'orm.webp'];
const normalScale=new T.Vector2(.55,.55);

export default function StonePavement(){
  const [color,normal,surface]=useTexture(maps);
  const colorGain=useMemo(()=>new T.Color('#fff5e7').multiplyScalar(1.62),[]);
  useLayoutEffect(()=>{
    color.colorSpace=T.SRGBColorSpace;
    for(const map of [color,normal,surface]){
      map.wrapS=map.wrapT=T.RepeatWrapping;
      map.anisotropy=4;
      map.needsUpdate=true;
    }
  },[color,normal,surface]);
  return <mesh geometry={pavementGeometry} position-y={POND.bankY} receiveShadow>
    <meshStandardMaterial color={colorGain} map={color} normalMap={normal}
      normalScale={normalScale} roughnessMap={surface} aoMap={surface} aoMapIntensity={.62}/>
  </mesh>;
}
