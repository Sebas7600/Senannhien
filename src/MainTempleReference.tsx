import PrismaticHalo from './PrismaticHalo';
import TempleRoofLights from './TempleRoofLights';
import BuddhistFlags from './BuddhistFlags';
import TempleNightFill from './TempleNightFill';
import TempleExteriorDecor from './TempleExteriorDecor';
import {templeFixtures} from './templeFixtures';
import {centerStatueOnBase} from './statuePlacement';
import TempleDonationChest from './TempleDonationChest';

import {extendPorticoColumn,isPorticoColumnPart,isTempleDoorPart,removeLegacyStatueHalos,removeNavePosts,strayFacadeOrnament} from './templeLayout';
import {porticoSupportTop} from './templeEave';
import TempleCeiling from './TempleCeiling';
import TempleCollision from './TempleCollision';
import {templeParts} from './templeGeometry';
import TempleNiches from './TempleNiches';
import TempleOfferingStations from './TempleOfferingStations';
import {detailTempleRoof,TempleRoofDetail} from './TempleRoofDetail';
/** Complete user-provided temple, at uniform scale. Other buildings remain independent. */
import {useMemo,useRef,useLayoutEffect,useState,useCallback} from 'react';
import {useGLTF} from '@react-three/drei';
import {useGame} from './gameStore';
import * as THREE from 'three';
import {CompanyPresentation} from './FireworksShow';
const asset=(name:string)=>'/assets/main-temple/'+name+'?v=complete-20261103-4';
function prepare(scene:THREE.Group){const model=scene.clone(true);model.traverse(o=>{if(o instanceof THREE.Mesh){o.material=(o.material as THREE.MeshStandardMaterial).clone();o.material.side=THREE.DoubleSide;o.material.envMapIntensity=.85;o.castShadow=true;o.receiveShadow=true;}});return model;}
function TempleExterior({onRoofBounds}:{onRoofBounds:(bounds:THREE.Box3)=>void}){
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
    if(isTempleDoorPart(name,c,size)||strayFacadeOrnament(name,c,size))continue;
    const column=size.y>2.5&&size.x<.9&&size.z<.9;
    const portico=isPorticoColumnPart(name,c,size);
    if(portico){
     if(column)extendPorticoColumn(position,part.box,part.indices);
     else if(c.y>5.3){
      // Keep the carved capitals attached to the same posts at the new eave height.
      const lift=2*(porticoSupportTop(c.x,c.z)-5.725);
      for(const i of new Set(part.indices))position.setY(i,position.getY(i)+lift);
     }
    }
    const high=!column&&!portico&&(name.startsWith('roof')||part.box.min.y>10.8);
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
 useLayoutEffect(()=>{parts.top.updateMatrixWorld(true);onRoofBounds(new THREE.Box3().setFromObject(parts.top));},[parts,onRoofBounds]);
 return <group scale={.5}><primitive object={parts.body}/><group position={[0,templeFixtures.ceiling.roofLift,0]}><primitive object={parts.top}/><TempleRoofDetail/><TempleRoofLights/></group></group>;
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

export default function MainTempleReference(){
 const low=useGame(s=>s.quality==='low');
 const night=useGame(s=>s.night);const root=useRef<THREE.Group>(null);
 const show=useGame(s=>s.fireworksShow),[presentationAnchor,setPresentationAnchor]=useState<THREE.Vector3|null>(null);
 const placePresentationAnchor=useCallback((bounds:THREE.Box3)=>{const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());setPresentationAnchor(new THREE.Vector3(center.x*.5,(templeFixtures.ceiling.roofLift+bounds.max.y)*.5+Math.max(size.y*.15,1),center.z*.5));},[]);
 const {scene}=useGLTF(asset('tam-the-complete-interior.glb'));const interior=useMemo(()=>removeLegacyStatueHalos(removeNavePosts(prepare(scene),templeParts,true),templeParts),[scene]);
 return <group ref={root} position={[0,.08,-27]}><TempleNightFill root={root}/><BuddhistFlags/>
  <TempleExterior onRoofBounds={placePresentationAnchor}/><TempleExteriorDecor/>
  {show?.companyPresentationEnabled&&presentationAnchor&&<CompanyPresentation position={presentationAnchor} startAt={show.startAt}/>}
  <TempleCeiling/>
  <TempleCollision/>
  <group scale={.5}><TempleNiches/></group>
  <TempleOfferingStations/>
  <TempleDonationChest/>
  <group scale={.5}><primitive object={interior}/></group>
  {[-4.7,0,4.7].map(x=><group key={x} position={[x,templeFixtures.statueDais.mount,templeFixtures.statueDais.z]}>{x<0?<TempleReferenceStatue kind='quan-am'/>:x===0?<TempleReferenceStatue kind='buddha'/>:<KsitigarbhaStatue/>}<group scale={x===0?1.2:x<0?.82:1}><PrismaticHalo phase={x*2}/></group></group>)}
  {!night&&(low?[0]:[-4.7,0,4.7]).map(x=><pointLight key={x} position={[x,5,-2.8]} color="#ffdfab" intensity={night?3:12} distance={9} decay={2}/>)}
 </group>;
}
