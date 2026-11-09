import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {POND} from './pondLayout';
import {GATE_ENTRY} from './courtyardPropsData';

export const pondEdge=Array.from({length:POND.segments},(_,i)=>{
  const angle=i/POND.segments*Math.PI*2;
  return new T.Vector2(POND.x+Math.cos(angle)*POND.rx,-POND.z-Math.sin(angle)*POND.rz);
});

function rectangle(minX:number,maxX:number,minZ:number,maxZ:number,cutPond=false){
  const outline=new T.Shape([
    new T.Vector2(minX,-minZ),new T.Vector2(maxX,-minZ),
    new T.Vector2(maxX,-maxZ),new T.Vector2(minX,-maxZ),
  ]);
  if(cutPond)outline.holes.push(new T.Path(pondEdge));
  return new T.ShapeGeometry(outline).rotateX(-Math.PI/2);
}

export const pondTerrain=rectangle(-62,62,-68,64,true);

const pavedAreas=[
  rectangle(-14.5,14.5,-17.5,27.5),
  rectangle(-9,14.5,27.5,GATE_ENTRY[1]+1),
  rectangle(14.5,49,-2.5,50.5,true),
  ...[-6,-4,-32].flatMap(z=>[
    rectangle(-47.5,-14.5,z-1.5,z+.5),
    rectangle(14.5,47.5,z-1.5,z+.5),
  ]),
  rectangle(-18.5,-16.5,-57.5,-17.5),
  rectangle(-18.5,-16.5,27.5,47.5),
];
export const pavementGeometry=mergeGeometries(pavedAreas)!;
const uv=pavementGeometry.attributes.uv;
for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.85,uv.getY(i)/2.85);
pavedAreas.forEach(geometry=>geometry.dispose());
