import {useGame} from './gameStore';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import type {Vec3} from './gameData';

export type TemplePlaqueKind='tea'|'library'|'dining';
export const templePlaques={
  tea:{title:'Trà đình Vọng Sơn',lines:['Thưởng thức chén trà,','tâm an vạn sự']},
  library:{title:'Tàng Kinh Các',lines:['Đọc sách mở trí,','tĩnh tâm dưỡng đức']},
  dining:{title:'Nhà ăn Hương Thiền',lines:['Dùng bữa chánh niệm,','nuôi dưỡng thân tâm']},
} as const;

// The three signs share their frame geometry. Lettering is outlined in the SVG assets:
// no font download, canvas redraw, animation loop or per-letter 3D mesh is needed.
const outline=new THREE.Shape();
outline.moveTo(-1.94,-.5);outline.lineTo(1.94,-.5);outline.lineTo(2,-.44);outline.lineTo(2,.44);
outline.lineTo(1.94,.5);outline.lineTo(-1.94,.5);outline.lineTo(-2,.44);outline.lineTo(-2,-.44);outline.closePath();
const frameGeometry=new THREE.ExtrudeGeometry(outline,{depth:.09,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.012,bevelThickness:.015});
const faceGeometry=new THREE.PlaneGeometry(4,1);
const frameMaterial=new THREE.MeshStandardMaterial({color:'#3e2118',roughness:.65});

export function TemplePlaque({kind,position,width=7.2}:{kind:TemplePlaqueKind;position:Vec3;width?:number}){
  const night=useGame(s=>s.night);
  const texture=useTexture(`/art/signs/${kind}.svg`);
  texture.colorSpace=THREE.SRGBColorSpace;
  // Oblique views need a little filtering; cap it for inexpensive mobile sampling.
  texture.anisotropy=4;
  return <group name={`hoanh-phi-${kind}`} position={position} scale={width/4}>
    {[-1.65,1.65].map(x=><group key={x} position={[x,.62,.20]}>
      <mesh><boxGeometry args={[.34,.08,.15]}/><meshStandardMaterial color="#8c6b3f" roughness={.6}/></mesh>
      <mesh position={[0,-.045,.04]}><boxGeometry args={[.25,.018,.06]}/><meshStandardMaterial color="#e9d2a4" emissive={night?'#ffd18a':'#000000'} emissiveIntensity={night?1.1:0}/></mesh>
    </group>)}
    <mesh geometry={frameGeometry} material={frameMaterial} castShadow receiveShadow dispose={null}/>
    <mesh geometry={faceGeometry} position={[0,0,.107]} dispose={null}>
      <meshStandardMaterial map={texture} emissiveMap={texture} emissive={night?'#ffe6bb':'#000000'} emissiveIntensity={night?.55:0} alphaTest={.5} roughness={.8}/>
    </mesh>
  </group>;
}
