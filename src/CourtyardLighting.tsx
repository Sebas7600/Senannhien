import NightMoon from './NightMoon';
import {useLayoutEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Stars} from '@react-three/drei';
import * as T from 'three';


import {useGame} from './gameStore';
import {playerMotion} from './runtime';
import {COURTYARD_SUN,TREE_SHADOW_STRENGTH,createTreeShadowAtlas,createTreeShadowMaterial} from './treeShadowAtlas';

const sun=COURTYARD_SUN;
const horizon='#e5ece8';
const nightSky='#122437';
const skyGeometry=new T.SphereGeometry(1,24,12);
let skyMap:T.DataTexture|undefined;

function makeSky(){
  const width=256,height=128,pixels=new Uint8Array(width*height*4);
  const low=new T.Color(horizon),high=new T.Color('#78b3e2'),white=new T.Color('#fffdf4'),color=new T.Color();
  const clouds=[[.22,.62,.10,.032],[.52,.66,.075,.023],[.72,.59,.09,.02],[.89,.73,.08,.027]];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/(width-1),v=y/(height-1);
    color.copy(low).lerp(high,T.MathUtils.smoothstep(v,.47,.67));
    let cloud=0;
    const ripple=.12*Math.sin(u*174+v*52)+.08*Math.cos(u*333-v*83);
    for(const [cx,cy,rx,ry] of clouds){
      const dx=(u-cx)/rx,dy=(v-cy)/ry;
      cloud=Math.max(cloud,1-T.MathUtils.smoothstep(dx*dx+dy*dy+ripple,.05,1));
    }
    color.lerp(white,cloud*.88).convertLinearToSRGB();
    const i=(y*width+x)*4;
    pixels[i]=color.r*255;pixels[i+1]=color.g*255;pixels[i+2]=color.b*255;pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,width,height);
  texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearFilter;
  texture.needsUpdate=true;
  return texture;
}

function MorningSky(){
  const map=skyMap??=makeSky();
  const sky=useRef<T.Mesh>(null);
  useFrame(({camera})=>sky.current?.position.copy(camera.position));
  return <mesh ref={sky} geometry={skyGeometry} scale={220} frustumCulled={false} renderOrder={100}>
    <meshBasicMaterial map={map} side={T.BackSide} fog={false} toneMapped={false} depthWrite={false}/>
  </mesh>;
}

export default function CourtyardLighting(){
  const night=useGame(s=>s.night),overview=useGame(s=>s.camera==='overview');
  const light=useRef<T.DirectionalLight>(null);
  const point=useRef(new T.Vector3());
  useFrame(()=>{
    const lamp=light.current;
    if(!lamp)return;
    const [x,z]=useGame.getState().position;
    if(playerMotion.object)playerMotion.object.getWorldPosition(point.current);
    else point.current.set(x,0,z);
    // Move the shadow window in small steps to keep edges stable as the player walks.
    const nextX=Math.round(point.current.x*2)/2,nextZ=Math.round(point.current.z*2)/2;
    if(lamp.target.position.x===nextX&&lamp.target.position.z===nextZ)return;
    lamp.target.position.set(nextX,0,nextZ);
    lamp.position.copy(lamp.target.position).add(sun);
    lamp.target.updateMatrixWorld();
  });
  return <>
    <color attach="background" args={[night?nightSky:horizon]}/>
    <fog attach="fog" args={[night?nightSky:horizon,overview?150:night?45:42,overview?340:night?135:158]}/>
    <ambientLight intensity={night?.3:.20} color={night?'#bdc4d0':'#fff4e5'}/>
    <hemisphereLight args={night?['#e0e7d0','#6e855e',.25]:['#e4f1ff','#a49c86',1.10]}/>
    <directionalLight ref={light} castShadow position={sun} intensity={night?.4:2.55} color={night?'#ffe3b4':'#ffe4b9'}
      shadow-mapSize={[2048,2048]} shadow-camera-left={-25} shadow-camera-right={25}
      shadow-camera-top={25} shadow-camera-bottom={-25} shadow-camera-far={112}
      shadow-bias={-.00025} shadow-normalBias={.035}/>
    {night?<><Stars radius={120} depth={30} count={1400} factor={3.5} fade/><NightMoon/></>:<MorningSky/>}
  </>;
}

let canopyShadows:ReturnType<typeof createTreeShadowAtlas>|undefined;
let canopyShadowMaterial:T.ShaderMaterial|undefined;
export function CourtyardDapple(){
  const night=useGame(s=>s.night),overview=useGame(s=>s.camera==='overview');
  const {geometry,map}=canopyShadows??=createTreeShadowAtlas();
  const material=canopyShadowMaterial??=createTreeShadowMaterial(map);
  useLayoutEffect(()=>{
    material.uniforms.strength.value=night?TREE_SHADOW_STRENGTH.night:TREE_SHADOW_STRENGTH.day;
    (material.uniforms.fogRange.value as T.Vector2).set(overview?150:night?45:42,overview?340:night?135:158);
  },[material,night,overview]);
  return <mesh name="Bong-tan-cay-mem" geometry={geometry} material={material} renderOrder={1} dispose={null}/>;
}
