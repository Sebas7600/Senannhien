import {barkTube,batchGeometry} from './geometryBatch';

type Point=[number,number,number];
function branchPoint([x,y,z]:Point,angle:number,reach:number,rise:number):Point{
  return [x+Math.sin(angle)*reach,y+rise,z+Math.cos(angle)*reach];
}

export function forkedLimb(start:Point,angle:number,reach:number,rise:number,radius:number,sides=8){
  const elbow=branchPoint(start,angle-.12,reach*.31,rise*.24);
  const fork=branchPoint(start,angle+.04,reach*.67,rise*.57);
  const tip=branchPoint(start,angle+.16,reach,rise);
  const geometry=[barkTube([start,elbow,fork,tip],[radius,radius*.77,radius*.48,radius*.09],sides)];
  for(const [root,turn,length,lift,thickness] of [[elbow,-.76,.62,.65,.39],[fork,.78,.46,.40,.27]] as const){
    geometry.push(barkTube([
      root,
      branchPoint(root,angle+turn,reach*length*.49,rise*lift*.36),
      branchPoint(root,angle+turn*.83,reach*length,rise*lift),
    ],[radius*thickness,radius*thickness*.62,radius*.035],Math.max(4,sides-2)));
  }
  return {geometry,fork,tip};
}

const trunks=[
  barkTube([[0,0,0],[-.1,.9,.04],[.08,1.8,-.05],[.23,2.75,.04],[.46,4.45,-.13]],[.37,.31,.24,.16,.036],7),
  barkTube([[0,0,0],[.08,1.25,-.06],[-.12,2.5,.15],[-.27,3.5,.06],[-.21,5.15,.19]],[.31,.26,.17,.11,.03],7),
];
const deciduous=[
  [1.3,1.73,1.85,.23],[3.3,1.4,1.95,.18],[5.28,1.72,1.77,.21],[.28,1.12,1.28,.15],
];
const upright=[
  [.7,1.03,1.8,.17],[2.8,1.24,1.75,.16],[4.4,1.05,1.39,.14],[5.9,.78,1.33,.11],
];

export const woodlandBarkGeometries=[deciduous,upright].map((limbs,index)=>batchGeometry([
  trunks[index],
  ...limbs.flatMap(([angle,reach,rise,radius],i)=>
    forkedLimb([0,1.36+i*.41,0],angle,reach,rise,radius,5).geometry),
]));
