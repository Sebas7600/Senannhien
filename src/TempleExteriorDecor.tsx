import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createEaveShell,eavePoint,eaveQuad} from './templeEave';
import {useGame} from './gameStore';
import {useMemo} from 'react';
import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
// A lower wrap-around eave breaks up the raised hall without lowering its ceiling.
const wood:T.BufferGeometry[]=[],tiles:T.BufferGeometry[]=[],trim:T.BufferGeometry[]=[],lotus:T.BufferGeometry[]=[];
const box=new T.BoxGeometry(1,1,1);
// Hip corners share the same vertices; the solid soffit closes the tile joints.
for(const g of createEaveShell())wood.push(coloredGeometry(g,'#492a1e'));
for(let side=0;side<4;side++)for(let row=0;row<16;row++)for(let col=0;col<(side%2?44:64);col++){
 const count=side%2?44:64,a=row/16,b=(row+1)/16,u=-1+2*col/count,v=-1+2*(col+1)/count;
 const g=eaveQuad(eavePoint(side,u,a),eavePoint(side,v,a),eavePoint(side,v,b),eavePoint(side,u,b));
 tiles.push(coloredGeometry(g,col%3?'#91462f':'#a55339'));g.dispose();
}
// Ornament faces must sit beyond the raised facade (outer face z=9.05).
for(const x of [-10.5,-6.5,6.5,10.5]){
 wood.push(coloredGeometry(box,'#642e22',[x,8.25,9.17],[3.45,1.72,.16]));
 for(const y of [7.44,9.06])trim.push(coloredGeometry(box,'#a98547',[x,y,9.30],[3.28,.045,.04]));
 for(const side of [-1,1])trim.push(coloredGeometry(box,'#a98547',[x+side*1.63,8.25,9.30],[.045,1.66,.04]));
 for(let petal=0;petal<7;petal++){
  const a=(petal-3)*.32;
  lotus.push(coloredGeometry(new T.SphereGeometry(1,8,5),'#c6a25c',[x+Math.sin(a)*.47,8.11+Math.cos(a)*.12,9.34],[.13,.36,.035],[0,0,-a]));
 }
 for(const side of [-1,1])for(let j=0;j<7;j++){
  const dx=side*(.58+j*.13),y=8.13+Math.sin(j*.55)*.12;
  lotus.push(coloredGeometry(box,'#a98547',[x+dx,y,9.33],[.17,.045,.045],[0,0,side*Math.cos(j*.55)*.35]));
 }
}
box.dispose();
const roofs=batchGeometry(tiles),beams=batchGeometry(wood),gold=batchGeometry(trim),flowers=batchGeometry(lotus);
const glowPieces=[-10.5,-6.5,6.5,10.5].map(x=>new T.PlaneGeometry(2.8,1.25).translate(x,8.28,9.40));
const lotusGlow=mergeGeometries(glowPieces)!;glowPieces.forEach(g=>g.dispose());
export default function TempleExteriorDecor(){const night=useGame(s=>s.night);return <group><FacadeInscription/>
 <mesh geometry={roofs} castShadow receiveShadow><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.85}/></mesh>
 <mesh geometry={beams} castShadow><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.83}/></mesh>
 <mesh geometry={gold}><meshStandardMaterial vertexColors roughness={.5} metalness={.3} emissive="#c69b4e" emissiveIntensity={night?.3:0}/></mesh>
 <mesh geometry={flowers}><meshStandardMaterial vertexColors color="#fff3cb" emissive="#ffd67b" emissiveIntensity={night?1.8:.15} toneMapped={false} roughness={.6}/></mesh>
 {night&&<mesh geometry={lotusGlow} renderOrder={2}><shaderMaterial transparent depthWrite={false} blending={T.AdditiveBlending} toneMapped={false} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'} fragmentShader={'varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*4.)*(1.-smoothstep(.6,1.,length(p)));gl_FragColor=vec4(1.,.66,.25,a*.24);}'}/></mesh>}
 </group>}

function FacadeInscription(){const night=useGame(s=>s.night);const map=useMemo(()=>{
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const c=canvas.getContext('2d')!;
 c.fillStyle='#622a21';c.fillRect(0,0,2048,512);c.strokeStyle='#c6a25c';c.lineWidth=14;c.strokeRect(22,22,2004,468);c.lineWidth=3;c.strokeRect(45,45,1958,422);
 c.fillStyle='#ead29a';c.font='bold 120px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ĐẠI HÙNG BẢO ĐIỆN',1024,265);
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
 },[]);return <group>{[-3.6,3.6].map(x=><FacadeLantern key={x} x={x}/>)}<mesh position={[0,8.25,9.29]}><planeGeometry args={[5.9,1.48]}/><meshStandardMaterial map={map} emissiveMap={map} emissive={night?'#ffe8c3':'#000000'} emissiveIntensity={night?.65:0} roughness={.8}/></mesh></group>}

function FacadeLantern({x}:{x:number}){const night=useGame(s=>s.night);return <group position={[x,8.24,9.62]}>
 <mesh position={[0,.74,0]}><cylinderGeometry args={[.012,.012,.68,6]}/><meshStandardMaterial color="#a18245"/></mesh>
 <mesh scale={[.25,.39,.25]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#e6a641" emissive="#e99b2e" emissiveIntensity={night?1.5:.2} roughness={.7}/></mesh>
 {[-.38,.38].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.11,.13,.06,10]}/><meshStandardMaterial color="#bd9551" metalness={.4}/></mesh>)}
 <mesh position={[0,-.56,0]}><coneGeometry args={[.045,.27,7]}/><meshStandardMaterial color="#9b362a"/></mesh>
 </group>}
