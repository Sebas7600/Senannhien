import {useMemo} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {BODHI} from './bodhiData';
import {courtyardTrees} from './courtyardData';
import {POND as LOTUS_POND} from './pondLayout';
export type MaterialKind='stone'|'wood'|'plaster'|'roof'|'cloth';
const ids:Record<MaterialKind,string>={stone:'old_sandstone_02',wood:'old_wood_floor',plaster:'grey_plaster',roof:'grey_roof_tiles',cloth:'fabric_pattern_07'};
const cache=new Map<string,THREE.MeshStandardMaterial>();
export function useSurface(kind:MaterialKind,color='#ffffff'){
  const id=ids[kind],maps=useTexture([`/assets/textures/${id}-color.jpg`,`/assets/textures/${id}-normal.jpg`,`/assets/textures/${id}-roughness.jpg`]);
  return useMemo(()=>{const key=kind+color;let material=cache.get(key);if(material)return material;
    maps.forEach((t,i)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;if(kind==='cloth')t.repeat.set(3,3);else if(kind==='wood')t.repeat.set(1,2);t.needsUpdate=true});
    material=new THREE.MeshStandardMaterial({color,map:kind==='cloth'?null:maps[0],normalMap:maps[1],roughnessMap:maps[2],normalScale:new THREE.Vector2(kind==='cloth'?.025:.35,kind==='cloth'?.025:.35),roughness:kind==='wood'?.8:1,metalness:0,side:THREE.DoubleSide});cache.set(key,material);return material;
  },[kind,color,maps[0],maps[1],maps[2]]);
}
export function classifySurface(color:string):MaterialKind{const c=new THREE.Color(color);if(c.r>c.g*1.15&&c.g>c.b*1.08)return 'wood';if(c.r+c.g+c.b>1.48)return 'plaster';return 'stone';}

const outdoorSurfaces={
  herringbone:{repeat:1,roughness:.98},
  'brick-edge':{repeat:1,roughness:.92},
  flagstone:{repeat:1/3.6,roughness:.96},
  'bamboo-soil':{repeat:1/6.5,roughness:1},
  bark:{repeat:1,roughness:.96},
};
type OutdoorSurface=keyof typeof outdoorSurfaces;
const outdoorMaterialCache=new WeakMap<THREE.Texture,Map<string,THREE.MeshStandardMaterial>>();
const shadePatches=[
  new THREE.Vector4(BODHI.x+.8,BODHI.z-.9,6.3,8.2),
  ...courtyardTrees.map(tree=>new THREE.Vector4(tree.x+.6,tree.z-.9,4.8,5.9)),
  new THREE.Vector4(0,-36,15,3.8),
  new THREE.Vector4(-14,-24,3.3,10),
];
const lotusEdge=new THREE.Vector4(LOTUS_POND.x,LOTUS_POND.z,LOTUS_POND.rx,LOTUS_POND.rz);

const rotatedGround= `
  vec3 rotatedTile(vec2 point,vec2 tile,vec2 dx,vec2 dy){
    float seed=fract(sin(dot(tile,vec2(127.1,311.7)))*43758.5453);
    float angle=seed*6.2831853;
    mat2 rotation=mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
    vec2 offset=fract(seed*vec2(9.3,17.7));
    return textureGrad(map,rotation*(point-tile)+offset,rotation*dx,rotation*dy).rgb;
  }
  vec3 rotatedSurface(vec2 point,float fade){
    vec2 cell=floor(point);
    vec2 blend=smoothstep(vec2(fade),vec2(1.0-fade),fract(point));
    vec2 dx=dFdx(point),dy=dFdy(point);
    vec3 rowA=mix(rotatedTile(point,cell,dx,dy),rotatedTile(point,cell+vec2(1,0),dx,dy),blend.x);
    vec3 rowB=mix(rotatedTile(point,cell+vec2(0,1),dx,dy),rotatedTile(point,cell+vec2(1,1),dx,dy),blend.x);
    return mix(rowA,rowB,blend.y);
  }`;

const pavingMoss=`
  varying vec2 pavingWorld;
  uniform vec4 uShadePatches[${shadePatches.length}];
  uniform vec4 uLotusEdge;
  float pavingHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float pavingNoise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(pavingHash(i),pavingHash(i+vec2(1,0)),f.x),
      mix(pavingHash(i+vec2(0,1)),pavingHash(i+vec2(1,1)),f.x),f.y);
  }
  float pavingMossMask(vec2 p){
    float shade=0.0;
    for(int i=0;i<${shadePatches.length};i++){
      vec4 area=uShadePatches[i];
      shade=max(shade,1.0-smoothstep(.43,1.03,length((p-area.xy)/area.zw)));
    }
    float shore=abs(length((p-uLotusEdge.xy)/uLotusEdge.zw)-1.0);
    shade=max(shade,.94*(1.0-smoothstep(.03,.24,shore)));
    float wall=min(60.0-abs(p.x),min(p.y+66.0,62.0-p.y));
    shade=max(shade,.84*(1.0-smoothstep(.35,2.2,wall)));
    float mossPattern=pavingNoise(p*.98)*.72+pavingNoise(p*5.7)*.28;
    return max(shade*smoothstep(.27,.63,mossPattern),.12*smoothstep(.72,.88,mossPattern));
  }`;

export function varyGroundTiles(material:THREE.MeshStandardMaterial,kind:'bamboo-soil'|'flagstone'|'herringbone'){
  const rotating=kind!=='herringbone';
  material.customProgramCacheKey=()=>kind;
  material.onBeforeCompile=shader=>{
    shader.uniforms.uShadePatches={value:shadePatches};
    shader.uniforms.uLotusEdge={value:lotusEdge};
    shader.vertexShader='varying vec2 pavingWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
        vec4 pavingPosition=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          pavingPosition=instanceMatrix*pavingPosition;
        #endif
        pavingWorld=(modelMatrix*pavingPosition).xz;
        #include <project_vertex>`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_pars_fragment>',`
      #include <map_pars_fragment>
      ${rotating?rotatedGround:''}
      ${pavingMoss}`);
    const shadeStone=`
      float luminance=dot(surface,vec3(.2126,.7152,.0722));
      float joint=1.0-smoothstep(.17,.32,luminance);
      float olive=smoothstep(.014,.077,surface.g-surface.b)*(1.0-smoothstep(.025,.095,surface.r-surface.g));
      vec3 darkStone=vec3(.85,.93,1.0)*(.025+luminance*.129);
      vec3 dryJoint=vec3(.139,.134,.123)*(.74+luminance*.9);
      float damp=pavingMossMask(pavingWorld);
      float mossEdge=smoothstep(.38,.74,damp)*smoothstep(.30,.72,pavingNoise(pavingWorld*4.1));
      float jointGrowth=pavingNoise(pavingWorld*2.1)*.69+pavingNoise(pavingWorld*13.0)*.31;
      float sparseMoss=joint*smoothstep(.56,.79,jointGrowth)*.56;
      float green=max(max(joint*mix(.69,1.0,olive)*damp,mossEdge*.76),sparseMoss);
      vec3 liveMoss=vec3(.111,.218,.041)*(.65+pavingNoise(pavingWorld*26.0)*.57);
      surface=mix(mix(darkStone,dryJoint,joint*.93),liveMoss,green);
    `;
    const shadeSoil=`
      // Broad bare gaps separate the patches, while finer noise breaks up their edges.
      float patchSignal=pavingNoise(pavingWorld*.43)*.76+pavingNoise(pavingWorld*2.9)*.24;
      float coverage=smoothstep(.62,.79,patchSignal);
      float grain=pavingNoise(pavingWorld*15.0);
      vec3 mossColor=mix(vec3(.065,.106,.028),vec3(.155,.221,.060),grain);
      surface=mix(surface,mossColor,coverage*mix(.60,.90,grain));
    `;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 surface=${rotating?`rotatedSurface(vMapUv,${kind==='bamboo-soil'?'0.16':'0.38'})`:'texture2D(map,pavingWorld/1.85).rgb'};
      ${kind==='herringbone'?shadeStone:shadeSoil}
      diffuseColor.rgb*=surface;`);
  };
}

export function useOutdoorSurface(kind:OutdoorSurface){
  const texture=kind==='herringbone'||kind==='brick-edge'?'flagstone':kind==='flagstone'?'bamboo-soil':kind;
  const source=useTexture(`/assets/textures/outdoor/${texture}.webp`);
  return useMemo(()=>{
    const cached=outdoorMaterialCache.get(source)?.get(kind);
    if(cached)return cached;
    const map=source.clone();
    const {repeat,roughness}=outdoorSurfaces[kind];
    map.wrapS=map.wrapT=kind==='bamboo-soil'||kind==='flagstone'?THREE.MirroredRepeatWrapping:THREE.RepeatWrapping;
    map.colorSpace=THREE.SRGBColorSpace;
    map.repeat.setScalar(repeat);
    map.anisotropy=4;
    map.needsUpdate=true;
    const material=new THREE.MeshStandardMaterial({map,roughness,color:'#ffffff'});
    if(kind!=='bark'&&kind!=='brick-edge')varyGroundTiles(material,kind);
    let variants=outdoorMaterialCache.get(source);if(!variants){variants=new Map();outdoorMaterialCache.set(source,variants);}variants.set(kind,material);
    return material;
  },[kind,source]);
}
