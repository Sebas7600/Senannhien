import TempleDonationChest from './TempleDonationChest';
import {removeNavePosts,strayFacadeOrnament} from './templeLayout';
import TempleCeiling from './TempleCeiling';
import TempleCollision from './TempleCollision';
import {templeParts,closeCutSurface} from './templeGeometry';
import TempleNiches from './TempleNiches';
import TempleOfferingStations from './TempleOfferingStations';
/** Complete user-provided temple, at uniform scale. Other buildings remain independent. */
import {useMemo,useRef,useLayoutEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {useGame} from './gameStore';
import * as THREE from 'three';
const asset=(name:string)=>'/assets/main-temple/'+name+'?v=complete-20261103-4';
function prepare(scene:THREE.Group){const model=scene.clone(true);model.traverse(o=>{if(o instanceof THREE.Mesh){o.material=(o.material as THREE.MeshStandardMaterial).clone();o.material.side=THREE.DoubleSide;o.material.envMapIntensity=.85;o.castShadow=true;o.receiveShadow=true;}});return model;}
function TempleExterior(){
 const {scene}=useGLTF(asset('tam-the-complete.glb')),roof=useRef<THREE.Group>(null),front=useRef<THREE.Group>(null);
 const parts=useMemo(()=>{const full=removeNavePosts(prepare(scene),templeParts),body=new THREE.Group(),top=new THREE.Group(),entrance=new THREE.Group();full.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const p=o.geometry.attributes.position,ix=o.geometry.index;if(!ix)return;const buckets:[number[],THREE.Group][]=[[[],body],[[],top],[[],entrance]];
 for(const part of templeParts(o.geometry)){const size=part.box.getSize(new THREE.Vector3()),name=(o.material as THREE.Material).name;const column=size.y>5&&size.x<1.8&&size.z<1.8;const c=part.box.getCenter(new THREE.Vector3()).multiplyScalar(.5);if(strayFacadeOrnament(name,c,size.clone().multiplyScalar(.5)))continue;const high=!column&&(name.startsWith('roof')||part.box.min.y>10.8);const nearFront=false;buckets[high?1:nearFront?2:0][0].push(...part.indices)}
 for(const [indices,parent]of buckets)if(indices.length){const mesh=o.clone();mesh.geometry=o.geometry.clone();mesh.geometry.setIndex(indices);parent.add(mesh)}});return {body,top,entrance}},[scene]);

 return <group scale={.5}><primitive object={parts.body}/><group ref={roof} position={[0,3,0]}><primitive object={parts.top}/></group><group ref={front}><primitive object={parts.entrance}/></group></group>;
}
function ReferenceBuddha({pose}:{pose:'left'|'center'|'right'}){
 const {scene}=useGLTF(asset('buddha-open-halo.glb'));
 const model=useMemo(()=>{const clone=prepare(scene);
 if(pose==='center')clone.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.startsWith('Buddah')){const geometry=o.geometry.clone(),p=geometry.attributes.position;const ids=geometry.index?Array.from(geometry.index.array):Array.from({length:p.count},(_,i)=>i),keep=[];for(let i=0;i<ids.length;i+=3){const tri=ids.slice(i,i+3),arm=tri.some(id=>Math.abs(p.getX(id))>43&&p.getY(id)>242&&p.getY(id)<375);if(!arm)keep.push(...tri)}geometry.setIndex(keep);o.geometry=closeCutSurface(geometry);}});
 if(pose==='center'){const gold=new THREE.MeshStandardMaterial({color:'#e3b94f',metalness:.78,roughness:.35});for(const sign of [-1,1]){const points=[new THREE.Vector3(sign*52,337,-6),new THREE.Vector3(sign*66,279,-36),new THREE.Vector3(sign*7,318,-66)];for(let i=0;i<2;i++){const from=points[i],to=points[i+1],dir=to.clone().sub(from),arm=new THREE.Mesh(new THREE.CapsuleGeometry(i?16:25,Math.max(0,dir.length()-(i?32:50)),6,16),gold);arm.position.copy(from).add(to).multiplyScalar(.5);arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());clone.add(arm)}for(const [centre,radius] of [[points[0],27],[points[1],22]] as const){const joint=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),gold);joint.position.copy(centre);clone.add(joint)}const sleeve=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),gold);sleeve.position.set(sign*40,285,0);sleeve.scale.set(25,46,32);clone.add(sleeve);const hand=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),gold);hand.scale.set(6,18,9);hand.position.set(sign*6,330,-67);clone.add(hand)}}
 clone.rotation.y=Math.PI;clone.updateMatrixWorld(true);clone.traverse(o=>{if(o instanceof THREE.Mesh){const base=/bottom|base_|beam/.test(o.name);o.material=new THREE.MeshStandardMaterial({color:base?'#b48532':o.name.includes('petal')?'#cca044':'#e3b94f',metalness:.78,roughness:.35,envMapIntensity:1.2})}});const b=new THREE.Box3().setFromObject(clone),center=b.getCenter(new THREE.Vector3()),scale=3.75/b.getSize(new THREE.Vector3()).y;clone.scale.set(pose==='right'?-scale:scale,scale,scale);clone.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);return clone},[scene,pose]);return <primitive object={model}/>;
}
function HaloRays(){const mesh=useRef<THREE.InstancedMesh>(null);useLayoutEffect(()=>{if(!mesh.current)return;const pose=new THREE.Object3D();for(let i=0;i<32;i++){const a=i*Math.PI*2/32;pose.position.set(Math.sin(a)*1.34,Math.cos(a)*1.34,0);pose.rotation.z=-a;pose.updateMatrix();mesh.current.setMatrixAt(i,pose.matrix)}mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()},[]);return <instancedMesh ref={mesh} args={[undefined,undefined,32]}><boxGeometry args={[.009,.09,.009]}/><meshStandardMaterial color="#f2cd78" emissive="#cf9134" emissiveIntensity={.25}/></instancedMesh>}
function Halo(){const low=useGame(s=>s.quality==='low');return <group position={[0,2.75,-.72]}>{(low?[1.13]:[1.02,1.13,1.25]).map(radius=><mesh key={radius}><torusGeometry args={[radius,.015,6,low?48:80]}/><meshStandardMaterial color="#ffe193" metalness={.65} roughness={.3} emissive="#eab64a" emissiveIntensity={2.5}/></mesh>)}{!low&&<HaloRays/>}<mesh><planeGeometry args={[3.5,3.5]}/><shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float ring=exp(-pow((r-.66)*17.,2.))*.35;float core=pow(max(0.,1.-r),3.)*.18;gl_FragColor=vec4(1.,.68,.16,ring+core);}'}/></mesh></group>}

export default function MainTempleReference(){
 const low=useGame(s=>s.quality==='low');
 const {scene}=useGLTF(asset('tam-the-complete-interior.glb'));const interior=useMemo(()=>removeNavePosts(prepare(scene),templeParts),[scene]);
 return <group position={[0,.08,-27]}>
  <TempleExterior/>
  <TempleCeiling/>
  <TempleCollision/>
  <group scale={.5}><TempleNiches/></group>
  <TempleOfferingStations/>
  <TempleDonationChest/>
  <group scale={.5}><primitive object={interior}/></group>
  {[-4.7,0,4.7].map(x=><group key={x} position={[x,2.48,-5.35]}><ReferenceBuddha pose={x===0?'center':x<0?'left':'right'}/><Halo/></group>)}
  {(low?[0]:[-4.7,0,4.7]).map(x=><pointLight key={x} position={[x,5,-2.8]} color="#ffdfab" intensity={12} distance={9} decay={2}/>)}
 </group>;
}
