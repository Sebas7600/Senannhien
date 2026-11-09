import {templeFixtures} from './templeFixtures';
import {centerStatueOnBase} from './statuePlacement';
import TempleDonationChest from './TempleDonationChest';

import {extendPorticoColumn,isPorticoColumn,removeLegacyStatueHalos,removeNavePosts,strayFacadeOrnament} from './templeLayout';
import TempleCeiling from './TempleCeiling';
import TempleCollision from './TempleCollision';
import {templeParts} from './templeGeometry';
import TempleNiches from './TempleNiches';
import TempleOfferingStations from './TempleOfferingStations';
import {detailTempleRoof,TempleRoofDetail} from './TempleRoofDetail';
/** Complete user-provided temple, at uniform scale. Other buildings remain independent. */
import {useMemo,useRef,useLayoutEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {useGame} from './gameStore';
import * as THREE from 'three';
const asset=(name:string)=>'/assets/main-temple/'+name+'?v=complete-20261103-4';
function prepare(scene:THREE.Group){const model=scene.clone(true);model.traverse(o=>{if(o instanceof THREE.Mesh){o.material=(o.material as THREE.MeshStandardMaterial).clone();o.material.side=THREE.DoubleSide;o.material.envMapIntensity=.85;o.castShadow=true;o.receiveShadow=true;}});return model;}
function TempleExterior(){
 const {scene}=useGLTF(asset('tam-the-complete.glb'));
 const parts=useMemo(()=>{
  const full=removeNavePosts(prepare(scene),templeParts),body=new THREE.Group(),top=new THREE.Group();
  full.traverse(o=>{
   if(!(o instanceof THREE.Mesh)||!o.geometry.index)return;
   const geometry=o.geometry.clone(),position=geometry.getAttribute('position');
   const material=o.material as THREE.MeshStandardMaterial,name=material.name;
   if(name==='plaza')return;
   const buckets:[number[],THREE.Group][]=[[[],body],[[],top]];
   for(const part of templeParts(geometry)){
    const size=part.box.getSize(new THREE.Vector3()).multiplyScalar(.5);
    const c=part.box.getCenter(new THREE.Vector3()).multiplyScalar(.5);
    if(strayFacadeOrnament(name,c,size))continue;
    const column=size.y>2.5&&size.x<.9&&size.z<.9;
    if(column&&name==='wood'&&isPorticoColumn(c.x,c.z))extendPorticoColumn(position,part.box,part.indices);
    const high=!column&&(name.startsWith('roof')||part.box.min.y>10.8);
    buckets[Number(high)][0].push(...part.indices);
   }
   for(const [indices,parent] of buckets)if(indices.length){
    const mesh=o.clone();
    mesh.geometry=geometry.clone();
    mesh.geometry.setIndex(indices);
    mesh.geometry.computeBoundingSphere();
    if(name==='roof_tile')detailTempleRoof(material);
    parent.add(mesh);
   }
   geometry.dispose();
  });
  return {body,top};
 },[scene]);
 return <group scale={.5}><primitive object={parts.body}/><group position={[0,3,0]}><primitive object={parts.top}/><TempleRoofDetail/></group></group>;
}
function KsitigarbhaStatue() {
 const low = useGame(s => s.quality === 'low');
 const {scene} = useGLTF('/assets/main-temple/center-ksitigarbha'+(low?'-low':'')+'.glb');
 const model = useMemo(() => {
   const statue = centerStatueOnBase(prepare(scene));
   statue.traverse(node => {
     if (node instanceof THREE.Mesh) {
       const material = node.material as THREE.MeshStandardMaterial;
       material.color.set('#e3b94f');
       material.metalness = .72;
       material.roughness = .38;
       material.envMapIntensity = 1.2;
     }
   });
   return statue;
 }, [scene]);
 return <primitive object={model}/>;
}

function TempleReferenceStatue({kind}: {kind:'quan-am'|'buddha'}) {
 const low=useGame(s=>s.quality==='low');
 const url=kind==='quan-am'
   ? '/assets/main-temple/seated-quan-am'+(low?'-low':'')+'.glb?v=seated-marble-no-lotus-3'
   : '/assets/main-temple/center-buddha.glb';
 const {scene}=useGLTF(url);
 const model=useMemo(()=>{
   const statue=prepare(scene);
   centerStatueOnBase(statue,kind==='buddha'?4.5:2.76);
   if(kind==='buddha'){statue.scale.x*=1.15;statue.scale.z*=1.12;statue.position.x*=1.15;statue.position.z*=1.12;}
   statue.traverse(node=>{
     if(!(node instanceof THREE.Mesh))return;
     const material=node.material as THREE.MeshStandardMaterial;
     material.vertexColors=false;
     material.color.set(kind==='quan-am'?'#dce6dc':'#e3b94f');
     material.metalness=kind==='quan-am'?.02:.72;
     material.roughness=kind==='quan-am'?.46:.38;
     material.envMapIntensity=kind==='quan-am'?.65:1.2;
     if(kind==='quan-am'&&!low){
       material.onBeforeCompile=shader=>{
         shader.vertexShader='varying vec3 vStonePoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStonePoint = position;');
         shader.fragmentShader='varying vec3 vStonePoint;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
         float vein=pow(max(0.,1.-abs(sin(vStonePoint.x*15.+vStonePoint.y*7.+sin(vStonePoint.z*9.+vStonePoint.y*3.)*2.))),18.);
         diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.44,.56,.48),vein*.20);`);
       };
       material.customProgramCacheKey=()=> 'quan-am-marble-1';
     }
   });
   return statue;
 },[scene]);
 return <primitive object={model}/>;
}

function HaloRays(){const mesh=useRef<THREE.InstancedMesh>(null);useLayoutEffect(()=>{if(!mesh.current)return;const pose=new THREE.Object3D();for(let i=0;i<32;i++){const a=i*Math.PI*2/32;pose.position.set(Math.sin(a)*1.34,Math.cos(a)*1.34,0);pose.rotation.z=-a;pose.updateMatrix();mesh.current.setMatrixAt(i,pose.matrix)}mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()},[]);return <instancedMesh ref={mesh} args={[undefined,undefined,32]}><boxGeometry args={[.009,.09,.009]}/><meshStandardMaterial color="#f2cd78" emissive="#cf9134" emissiveIntensity={.25}/></instancedMesh>}
function Halo(){const low=useGame(s=>s.quality==='low');return <group position={[0,2.75,-.72]}>{(low?[1.13]:[1.02,1.13,1.25]).map(radius=><mesh key={radius}><torusGeometry args={[radius,.015,6,low?48:80]}/><meshStandardMaterial color="#ffe193" metalness={.65} roughness={.3} emissive="#eab64a" emissiveIntensity={3.6}/></mesh>)}{!low&&<HaloRays/>}<mesh><planeGeometry args={[3.5,3.5]}/><shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float ring=exp(-pow((r-.66)*17.,2.))*.48;float core=pow(max(0.,1.-r),3.)*.23;gl_FragColor=vec4(1.,.68,.16,ring+core);}'}/></mesh></group>}

export default function MainTempleReference(){
 const low=useGame(s=>s.quality==='low');
 const night=useGame(s=>s.night);
 const {scene}=useGLTF(asset('tam-the-complete-interior.glb'));const interior=useMemo(()=>removeLegacyStatueHalos(removeNavePosts(prepare(scene),templeParts,true),templeParts),[scene]);
 return <group position={[0,.08,-27]}>
  <TempleExterior/>
  <TempleCeiling/>
  <TempleCollision/>
  <group scale={.5}><TempleNiches/></group>
  <TempleOfferingStations/>
  <TempleDonationChest/>
  <group scale={.5}><primitive object={interior}/></group>
  {[-4.7,0,4.7].map(x=><group key={x} position={[x,templeFixtures.statueDais.mount,templeFixtures.statueDais.z]}>{x<0?<TempleReferenceStatue kind='quan-am'/>:x===0?<TempleReferenceStatue kind='buddha'/>:<KsitigarbhaStatue/>}<group scale={x===0?1.2:x<0?.82:1}><Halo/></group></group>)}
  {(low?[0]:[-4.7,0,4.7]).map(x=><pointLight key={x} position={[x,5,-2.8]} color="#ffdfab" intensity={12} distance={9} decay={2}/>)}
 </group>;
}
