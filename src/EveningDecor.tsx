import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {eveningPosts} from './eveningDecorData';
import {useGame} from './gameStore';
const metal:T.BufferGeometry[]=[],glass:T.BufferGeometry[]=[],pools:T.BufferGeometry[]=[];
const box=new T.BoxGeometry(1,1,1),shaft=new T.CylinderGeometry(.06,.08,1,8);
for(const {x,z} of eveningPosts){
 metal.push(coloredGeometry(box,'#64503a',[x,.13,z],[.36,.26,.36]),coloredGeometry(shaft,'#54402e',[x,1.3,z],[1,2.4,1]),coloredGeometry(box,'#99744c',[x,2.47,z],[.45,.08,.45]),coloredGeometry(new T.ConeGeometry(.39,.24,4,1,false,Math.PI/4),'#584332',[x,2.98,z]));
 glass.push(coloredGeometry(box,'#ffe2a0',[x,2.71,z],[.32,.43,.32]));
 for(const a of [-1,1])for(const b of [-1,1])metal.push(coloredGeometry(box,'#806343',[x+a*.18,2.71,z+b*.18],[.035,.47,.035]));
 pools.push(coloredGeometry(new T.PlaneGeometry(5,5),'#ffffff',[x,.08,z],[1,1,1],[-Math.PI/2,0,0]));
}
box.dispose();shaft.dispose();const frames=batchGeometry(metal),panes=batchGeometry(glass),lightPools=batchGeometry(pools);
export default function EveningDecor(){const night=useGame(s=>s.night);return <group>
 <mesh geometry={frames} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.8}/></mesh>
 <mesh geometry={panes}><meshStandardMaterial vertexColors color={night?'#fff4ce':'#d8d1b0'} emissive={night?'#ffd393':'#000000'} emissiveIntensity={night?1.3:0} roughness={.6}/></mesh>
 {night&&<mesh geometry={lightPools} renderOrder={1}><shaderMaterial transparent depthWrite={false} blending={T.AdditiveBlending} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'} fragmentShader={'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float glow=exp(-r*r*4.)*(1.-smoothstep(.6,1.,r));gl_FragColor=vec4(1.,.65,.30,glow*.17);}'}/></mesh>}
 </group>}
