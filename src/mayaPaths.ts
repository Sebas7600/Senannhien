import revision from './mayaRevision.json';
import {BAMBOO_PAVILION,BAMBOO_PAVILION_STEP} from './bambooPavilionLayout';
import {bambooZoneBounds} from './courtyardZoneData';
export interface LayoutPath {id:string;x:number;z:number;length:number;width:number;rotation:number}
// Snap the rear link to the same paving grid as the side roads.
export const templeBackRoad:LayoutPath={id:'pCube3',x:0,z:-41.5,length:37,width:4,rotation:0};
/** World-space dimensions of the saved Maya path guides. */
export const mayaPaths:LayoutPath[]=[
 {id:'pCube1',x:-26.55125139716638,z:11.966240553586097,length:13.832953119351126,width:4.277375522244474,rotation:0},
 {id:'pCube2',x:-37.984489795182014,z:.9538245445068032,length:13.832953119351126,width:4.0233839092696115,rotation:-89.12623021279104*Math.PI/180},
 templeBackRoad,
 {id:'bamboo-turn',x:-35.67,z:11.29,length:4.7,width:2.1,rotation:-Math.atan2(-1.35,-4.41)},
];

// Snap the two Maya path ends to the paved roads, with a small overlap at each seam.
export const bambooPath={...revision.bambooPath,position:[...revision.bambooPath.position]};
const eastRoadX=-18.5,northRoadZ=-3.5,overlap=.06;
for(const end of [1,3])bambooPath.position[end*3]=eastRoadX+overlap;
for(const [end,side] of [[4,5],[6,7]]){
 const start=end*3,inside=side*3,z=northRoadZ-overlap;
 const t=(z-bambooPath.position[start+2])/(bambooPath.position[inside+2]-bambooPath.position[start+2]);
 bambooPath.position[start]+=(bambooPath.position[inside]-bambooPath.position[start])*t;
 bambooPath.position[start+2]=z;
}
export const bambooEntrances=[
 {axis:'x',edge:eastRoadX,from:bambooPath.position[11],to:bambooPath.position[5]},
 {axis:'z',edge:northRoadZ,from:bambooPath.position[12],to:bambooPath.position[18]},
] as const;
export function pathPoint(path:LayoutPath,x:number,z:number):[number,number]{const c=Math.cos(path.rotation),s=Math.sin(path.rotation);return [path.x+c*x+s*z,path.z-s*x+c*z];}
export function onLayoutPath(x:number,z:number,margin=0){const mesh=bambooPath;for(let i=0;i<mesh.index.length;i+=3){const p=mesh.index.slice(i,i+3).map(v=>[mesh.position[v*3],mesh.position[v*3+2]]);let positive=false,negative=false;for(let j=0;j<3;j++){const a=p[j],b=p[(j+1)%3],cross=(b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]);positive ||= cross>0;negative ||= cross<0;}if(!positive||!negative)return true;}return mayaPaths.some(path=>{const dx=x-path.x,dz=z-path.z,c=Math.cos(path.rotation),s=Math.sin(path.rotation);return Math.abs(dx*c-dz*s)<=path.length/2+margin&&Math.abs(dx*s+dz*c)<=path.width/2+margin;});}
const [west,east,north,south]=bambooZoneBounds;
function groveNoise(seed:number){const value=Math.sin(seed*127.1+311.7)*43758.5453;return value-Math.floor(value);}
export const bambooStalks=Array.from({length:36*35},(_,i)=>{
 const column=i%36,row=Math.floor(i/36);
 const x=west+.6+(column+groveNoise(i+1)*.78)*(east-west-1.2)/36;
 const z=north+.6+(row+groveNoise(i+81)*.78)*(south-north-1.2)/35;
 return {x,z,height:4.8+groveNoise(i+163)*3.0,lean:(groveNoise(i+319)-.5)*.05};
}).filter(({x,z})=>!onLayoutPath(x,z,1.25)&&
 ![BAMBOO_PAVILION,BAMBOO_PAVILION_STEP].some(area=>
  Math.abs(x-area.x)<area.w/2+1.55&&Math.abs(z-area.z)<area.d/2+1.55));
