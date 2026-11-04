import {useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {Box} from './models';

function signTexture(){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=512;
  const c=canvas.getContext('2d')!;
  c.fillStyle='#d7bd8c';c.fillRect(0,0,1536,512);
  // Quiet wood grain keeps the exact Vietnamese lettering easy to read.
  for(let y=0;y<512;y+=3){c.strokeStyle=`rgba(104,66,33,${.018+.022*(1+Math.sin(y*1.8))})`;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(420,y+18,1000,y-18,1536,y+5);c.stroke();}
  c.strokeStyle='#697b40';c.lineWidth=5;c.beginPath();c.roundRect(24,24,1488,464,20);c.stroke();
  c.fillStyle='#284e32';c.textAlign='center';c.textBaseline='middle';c.font='italic 76px Georgia, serif';
  c.fillText('Thưởng thức chén trà,',768,198);c.fillText('tâm an vạn sự',768,308);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/** Three paintings share one atlas. Frames have dark wood, gold liners and corner scrolls. */
export function TeaGallery(){
  const atlas=useTexture('/art/tea-triptych.webp');
  const paintings=useMemo(()=>[0,1,2].map(i=>{const t=atlas.clone();t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(1/3,1);t.offset.set(i/3,0);t.needsUpdate=true;return t}),[atlas]);
  const sign=useMemo(signTexture,[]);
  return <group position={[0,0,-6.17]}>
    {[-6,0,6].map((x,i)=><group key={x} position={[x,2.48,0]}>
      <Box position={[0,0,0]} scale={[1.9,2.5,.12]} color="#633b28"/>
      <Box position={[0,0,.075]} scale={[1.71,2.31,.045]} color="#b3975d"/>
      <mesh position={[0,0,.105]}><planeGeometry args={[1.58,2.18]}/><meshBasicMaterial map={paintings[i]}/></mesh>
      {[-1,1].flatMap(a=>[-1,1].map(b=><group key={`${a}-${b}`} position={[a*.86,b*1.16,.11]}>
        <mesh rotation={[0,0,a*b*Math.PI/2]}><torusGeometry args={[.085,.015,4,12,Math.PI*1.5]}/><meshStandardMaterial color="#c0a263" metalness={.5}/></mesh>
      </group>))}
    </group>)}
    <group position={[0,4.08,.05]}>
      <Box position={[0,0,0]} scale={[6.1,1.09,.13]} color="#6c432c"/>
      <mesh position={[0,0,.075]}><planeGeometry args={[5.92,.98]}/><meshBasicMaterial map={sign}/></mesh>
    </group>
  </group>;
}
