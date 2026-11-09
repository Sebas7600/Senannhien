import {useMemo} from 'react';
import * as THREE from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {buildingPlanters,courtyardZones,fenceDepth,zoneFences,type CourtyardZone} from './courtyardZoneData';
import {POND} from './pondLayout';
import {pondEdge} from './pondGeometry';
import {useOutdoorSurface} from './materials';

const box=new THREE.BoxGeometry();
const fenceGeometry=batchGeometry(zoneFences.flatMap(span=>{
  const rustic=span.id==='bamboo'||span.id==='garden'||span.id==='stupa';
  const timber=rustic?'#897451':'#665045',stone=rustic?'#9b8c70':'#a39d87';
  const pieces:THREE.BufferGeometry[]=[];
  function piece(at:number,y:number,length:number,height:number,depth:number,color:string){
    pieces.push(coloredGeometry(box,color,
      span.horizontal?[at,y,span.fixed]:[span.fixed,y,at],
      span.horizontal?[length,height,depth]:[depth,height,length]));
  }
  const mid=(span.from+span.to)/2;
  piece(mid,.105,span.length,.21,fenceDepth,stone);
  piece(mid,.245,span.length,.075,.22,rustic?'#9d8b66':'#b0aa92');
  for(const y of [.40,.65])piece(mid,y,span.length,.074,.115,timber);
  const bays=Math.max(1,Math.ceil(span.length/2.65));
  for(let i=0;i<=bays;i++){
    // One of the two runs owns the post at each shared corner.
    if(!span.horizontal&&(i===0&&!span.entryStart||i===bays&&!span.entryEnd))continue;
    const at=span.from+span.length*i/bays;
    const entrance=i===0&&span.entryStart||i===bays&&span.entryEnd;
    const width=entrance?.29:.21;
    const top=entrance?.92:.79;
    piece(at,top/2,width,top,width,entrance?stone:timber);
    piece(at,top-.06,width+.085,.08,width+.085,entrance?'#c4b69b':stone);
  }
  const pickets=Math.max(0,Math.round(span.length/.64)-1);
  for(let i=1;i<=pickets;i++){
    const at=span.from+span.length*i/(pickets+1);
    piece(at,.485,rustic?.065:.055,.405,.075,timber);
  }
  return pieces;
}));

const potBody=new THREE.LatheGeometry([
  [0,0],[.60,0],[.64,.055],[.65,.13],[.84,.30],[.98,.53],
  [1,.69],[.93,.78],[.82,.79],[.77,.72],[.74,.56],[0,.56],
].map(([radius,y])=>new THREE.Vector2(radius,y)),20);
const rim=new THREE.TorusGeometry(1,.045,6,20).rotateX(Math.PI/2);
const soilDisk=new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2);
const stem=new THREE.CylinderGeometry(.024,.046,1,6);
const leaf=new THREE.BufferGeometry();
leaf.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0, -.26,.29,.22, 0,.52,.39, .26,.29,.22, 0,.29,.11,
],3));
leaf.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);
leaf.computeVertexNormals();
const potColors=['#a36850','#638478','#b6a18a'];
const leafColors=['#416443','#6b8853','#8b9f67'];
const planterGeometry=batchGeometry(buildingPlanters.flatMap(p=>{
  const y=.064,scale=p.radius;
  const potHeight=scale*1.4;
  const pieces=[
    coloredGeometry(potBody,potColors[p.variant],[p.x,y,p.z],[scale,potHeight,scale]),
    coloredGeometry(rim,p.variant===1?'#8da291':'#c4a28a',[p.x,y+potHeight*.69,p.z],[scale,scale,scale]),
    coloredGeometry(soilDisk,'#584936',[p.x,y+potHeight*.60,p.z],[scale*.74,1,scale*.74]),
    coloredGeometry(stem,'#656b42',[p.x,y+potHeight+.15,p.z],[1,.66,1]),
  ];
  for(let i=0;i<13;i++){
    const angle=p.angle+i*2.399,level=i%3,spread=.10+level*.09;
    const size=(1.18-level*.18)*(1+.08*Math.sin(i+p.angle));
    pieces.push(coloredGeometry(leaf,leafColors[(i+p.variant)%3],
      [p.x+Math.sin(angle)*spread,y+potHeight+.32-level*.10,p.z+Math.cos(angle)*spread],
      [size,size,size],[.16+level*.14,angle,0]));
  }
  return pieces;
}));

const groundPatches=courtyardZones.filter(zone=>zone.surface&&zone.id!=='pond'&&zone.id!=='lotus').map(zone=>{
  const [west,east,north,south]=zone.bounds;
  const shape=new THREE.Shape([
    new THREE.Vector2(west,-south),new THREE.Vector2(east,-south),
    new THREE.Vector2(east,-north),new THREE.Vector2(west,-north),
  ]);
  if(zone.id==='lotus'){
    const {x,z,rx,rz}=POND;
    const opening=new THREE.Path();
    opening.absellipse(x,-z,rx,rz,0,Math.PI*2,true);
    shape.holes.push(opening);
  }
  const geometry=new THREE.ShapeGeometry(shape,80).rotateX(-Math.PI/2);
  if(zone.surface==='clay'){
    const uv=geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.65,uv.getY(i)/2.65);
  }
  return {zone,geometry};
});

function groundMaterial(zone:CourtyardZone,source:THREE.MeshStandardMaterial){
  const material=source.clone();
  material.color.set(zone.tint??'#ffffff');
  material.onBeforeCompile=source.onBeforeCompile;
  material.customProgramCacheKey=source.customProgramCacheKey;
  if(zone.surface==='clay'){
    material.bumpMap=source.map;
    material.bumpScale=.027;
  }
  return material;
}

export function CourtyardZoneGround(){
  const stone=useOutdoorSurface('flagstone'),clay=useOutdoorSurface('brick-edge'),soil=useOutdoorSurface('bamboo-soil');
  const materials=useMemo(()=>groundPatches.map(({zone})=>groundMaterial(zone,
    zone.surface==='stone'?stone:zone.surface==='clay'?clay:soil)),[stone,clay,soil]);
  return <group position={[0,.028,0]} dispose={null}>
    {groundPatches.map(({zone,geometry},i)=><mesh key={zone.id} geometry={geometry} material={materials[i]} receiveShadow/>)}
  </group>;
}

export function CourtyardZoneDecor(){
  return <group dispose={null}>
    <mesh geometry={fenceGeometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={.94}/>
    </mesh>
    <mesh geometry={planterGeometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={.8} side={THREE.DoubleSide}/>
    </mesh>
  </group>;
}
