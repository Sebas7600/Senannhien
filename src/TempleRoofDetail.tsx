import * as THREE from 'three';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
import type {Vec3} from './gameData';

export const roofNightUniform={value:0};

/** Ceramic tile relief follows each hip face in the coordinates of the original GLB. */
export function detailTempleRoof(material:THREE.MeshStandardMaterial){
  material.customProgramCacheKey=()=> 'temple-roof-ceramic-uplight-2';
  material.onBeforeCompile=shader=>{
    shader.uniforms.uRoofNight=roofNightUniform;
    shader.vertexShader='varying vec3 roofPoint; varying vec3 roofFacing;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      roofPoint=position;
      roofFacing=normal;
    `);
    shader.fragmentShader='uniform float uRoofNight; varying vec3 roofPoint; varying vec3 roofFacing;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      float faceAlongZ=step(abs(roofFacing.x),abs(roofFacing.z));
      vec2 tilePoint=mix(vec2(roofPoint.z,abs(roofPoint.x)),vec2(roofPoint.x,abs(roofPoint.z)),faceAlongZ)/vec2(.77,.91);
      vec2 tile=fract(tilePoint);
      float grain=fract(sin(dot(floor(tilePoint),vec2(21.171,78.299)))*43758.54);
      float seam=1.0-smoothstep(.025,.11,min(tile.y,1.0-tile.y));
      float roll=pow(.5+.5*cos(tile.x*6.2831853),2.2);
      float tileDetail=1.0-smoothstep(.18,.65,max(length(dFdx(tilePoint)),length(dFdy(tilePoint))));
      diffuseColor.rgb*=mix(vec3(1.0),vec3(1.07,.98,.89)*(.88+.20*roll+.15*grain-.23*seam),tileDetail);
      float ceramicRelief=(.055*roll+.016*smoothstep(.07,.32,tile.y)-.016*seam)*tileDetail;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float roofWash=.08+.15*pow(max(0.,roofFacing.y),.65);
      totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.74,.40)*uRoofNight*roofWash;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
      #include <normal_fragment_maps>
      vec3 roofDx=dFdx(-vViewPosition),roofDy=dFdy(-vViewPosition);
      vec3 roofR1=cross(roofDy,normal),roofR2=cross(normal,roofDx);
      float roofDet=dot(roofDx,roofR1)*faceDirection;
      vec3 roofGradient=dFdx(ceramicRelief)*roofR1+dFdy(ceramicRelief)*roofR2;
      normal=normalize(max(abs(roofDet),1e-7)*normal-sign(roofDet)*roofGradient*.5);
    `);
  };
}

const endTile=new THREE.CylinderGeometry(1,1,1,10).rotateX(Math.PI/2);
const boss=new THREE.SphereGeometry(1,10,6);
export const roofTiers=[
  {halfX:29.55,halfZ:20.25,y:11.54,lift:2.10},
  {halfX:24.20,halfZ:13.15,y:19.53,lift:1.63},
  {halfX:20.45,halfZ:9.42,y:25.15,lift:1.93},
];
const clay=['#8b4433','#a4563d','#b26a48','#965440'];
const ridge='#8a543a',gold='#b6814a';
const eaves=roofTiers.flatMap(tier=>[-1,1].flatMap(side=>[true,false].flatMap(front=>{
  const extent=front?tier.halfX:tier.halfZ,edge=front?tier.halfZ:tier.halfX;
  const count=Math.floor(extent*2/.79);
  return Array.from({length:count-1},(_,i)=>{
    const along=extent*(2*(i+1)/count-1);
    const y=tier.y+.075+tier.lift*Math.pow(Math.max(0,(Math.abs(along)/extent-.32)/.68),3.1);
    const at:Vec3=front?[along,y,side*(edge+.10)]:[side*(edge+.10),y,along];
    const rotation:Vec3=[0,front?0:Math.PI/2,0];
    const cap=coloredGeometry(endTile,clay[i%clay.length],at,[.235,.205,.20],rotation);
    const inset:Vec3=front?[at[0],at[1],at[2]+side*.115]:[at[0]+side*.115,at[1],at[2]];
    const button=coloredGeometry(endTile,i%4===0?gold:'#784437',inset,[.092,.094,.026],rotation);
    return [cap,button];
  }).flat();
})));

function ridgeSweep(points:Vec3[],radii:number[],color:string){
  const tube=taperTube(points,radii,8);
  const result=coloredGeometry(tube,color);
  tube.dispose();
  return result;
}

const crest:THREE.BufferGeometry[]=[];
for(const side of [-1,1]){
  crest.push(ridgeSweep([[side*.65,32.68,0],[side*6,32.70,0],[side*11.5,32.73,0],
    [side*13.65,32.82,0],[side*14.22,33.07,0],[side*14.46,33.48,0]],[.10,.11,.11,.16,.16,.055],ridge));
  crest.push(coloredGeometry(boss,gold,[side*14.44,33.38,0],[.14,.23,.14]));
}
for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  crest.push(coloredGeometry(boss,i%2===0?gold:ridge,
    [Math.sin(a)*.38,33.17,Math.cos(a)*.38],[.15,.43,.18],[.42,a,0]));
}
crest.push(coloredGeometry(boss,'#b97e4d',[0,33.77,0],[.23,.25,.23]));
const roofDetail=batchGeometry([...eaves,...crest]);

export function TempleRoofDetail(){
  return <mesh geometry={roofDetail} castShadow receiveShadow dispose={null}>
    <meshStandardMaterial vertexColors roughness={.78}/>
  </mesh>;
}
