import * as THREE from 'three';
import {benchTextures} from './benchTextures';
import type {BenchLOD} from './benchGeometry';
export type BenchFinish='jade'|'brick'|'ivory';
const pigments:Record<BenchFinish,string>={jade:'#397f72',brick:'#a04d40',ivory:'#d4d0bb'};
const materials=new Map<string,THREE.MeshStandardMaterial>();
// One shared aggregate lookup replaces the previous per-pixel hash/noise work.
// Slab, feet, fasteners and lettering share a single indexed mesh and material.
export function terrazzoMaterial(finish:BenchFinish,lod:BenchLOD='near'){const key=finish+lod,cached=materials.get(key);if(cached)return cached;
const textures=benchTextures();const mat=lod==='near'?new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.36,clearcoat:.28,clearcoatRoughness:.34}):new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.4});
mat.onBeforeCompile=shader=>{shader.uniforms.benchPigment={value:new THREE.Color(pigments[finish])};shader.uniforms.benchIvory={value:new THREE.Color('#e3dfcb')};shader.uniforms.benchAggregate={value:textures.aggregate};shader.uniforms.benchLettering={value:textures.lettering};
shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
attribute float benchPart;varying vec3 vBenchP;varying vec3 vBenchN;varying float vBenchPart;varying vec2 vBenchUV;`).replace('#include <begin_vertex>',`#include <begin_vertex>
vBenchP=transformed;vBenchN=normal;vBenchPart=benchPart;vBenchUV=uv;`);
shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vBenchP;varying vec3 vBenchN;varying float vBenchPart;varying vec2 vBenchUV;
uniform vec3 benchPigment;uniform vec3 benchIvory;uniform sampler2D benchAggregate;uniform sampler2D benchLettering;`).replace('#include <color_fragment>',`#include <color_fragment>
float benchFrame=step(.5,vBenchPart),benchBolt=step(1.5,vBenchPart),benchPrint=step(2.5,vBenchPart);
vec3 benchN=abs(normalize(vBenchN));vec2 benchUV=benchN.y>benchN.x&&benchN.y>benchN.z?vBenchP.xz:(benchN.z>benchN.x?vBenchP.xy:vBenchP.zy);
vec3 benchGrain=texture2D(benchAggregate,benchUV*2.).rgb;
float benchX=abs(vBenchP.x);float benchBorder=max(smoothstep(.673,.679,benchX),1.-smoothstep(.010,.014,abs(benchX-.623)));
vec3 benchBase=mix(benchPigment,benchIvory,max(benchBorder,benchFrame));
benchBase=mix(benchBase,vec3(.78,.75,.65),benchGrain.r*.72);benchBase=mix(benchBase,benchBase*.28,benchGrain.g*.72);
benchBase*=.98+(benchGrain.b-.5)*.05;
float benchFoot=(1.-smoothstep(.025,.14,vBenchP.y))*benchFrame;
benchBase*=mix(vec3(1),vec3(.88,.90,.83),benchFoot);
benchBase=mix(benchBase,vec3(.22,.21,.17),benchBolt);
if(benchPrint>.5){vec4 ink=texture2D(benchLettering,vBenchUV);if(ink.a<.2)discard;benchBase=ink.rgb;}
diffuseColor.rgb*=benchBase;`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=mix(.36,.68,benchFrame)+(benchGrain.b-.5)*.12;roughnessFactor=mix(roughnessFactor,.58,benchPrint);`).replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
metalnessFactor=benchBolt*(1.-benchPrint)*.5;`);
};mat.customProgramCacheKey=()=>`vn-bench-baked-v1-${key}`;materials.set(key,mat);return mat;}
