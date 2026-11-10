import FlagClothMaterial from './FlagClothMaterial';
import * as T from 'three';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
import {avenueFlagRows,avenueFlagPoles,avenueFlagHalfSpan} from './avenueFlagsData';
const ropes:T.BufferGeometry[]=[],poles:T.BufferGeometry[]=[],flags:T.BufferGeometry[]=[];
const palette=['#17469c','#edc83d','#c73b35','#f2eddc','#e98c3d'];
const flag=new T.PlaneGeometry(.63,.85,6,10).toNonIndexed(),p=flag.getAttribute('position'),colors:number[]=[];
for(let i=0;i<p.count;i+=3){const v=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3/.85+.5,c=new T.Color(palette[Math.min(4,Math.floor((1-v)*5))]);for(let j=0;j<3;j++){const n=i+j,x=p.getX(n),y=p.getY(n);p.setZ(n,Math.sin(x*8+y*5)*.045*(.5-y/.85));colors.push(c.r,c.g,c.b);}}
flag.setAttribute('color',new T.Float32BufferAttribute(colors,3));flag.computeVertexNormals();
const height=(x:number)=>5.6-.55*(1-(x/avenueFlagHalfSpan)**2);
for(const z of avenueFlagRows){
 const points=Array.from({length:17},(_,i)=>{const x=-avenueFlagHalfSpan+i*avenueFlagHalfSpan*2/16;return [x,height(x),z] as [number,number,number]});
 ropes.push(coloredGeometry(taperTube(points,points.map(()=>.012),4),'#77705b'));
 for(let i=0;i<9;i++){const x=(i-4)*(avenueFlagHalfSpan*2-.8)/8;flags.push(coloredGeometry(flag,'#ffffff',[x,height(x)-.43,z],[1,1,1],[0,Math.sin(i+z)*.16,0]));const g=flags[flags.length-1];g.setAttribute('color',flag.getAttribute('color').clone());}
}
for(const {x,z}of avenueFlagPoles)poles.push(coloredGeometry(new T.CylinderGeometry(.04,.065,5.6,6),'#8c7451',[x,2.8,z]));
flag.dispose();const cords=batchGeometry(ropes),posts=batchGeometry(poles),cloth=batchGeometry(flags);
// Recover each flag's local attachment height after merging the static geometry.
const windData:number[]=[];const vertices=cloth.getAttribute('position'),spacing=(avenueFlagHalfSpan*2-.8)/8;
for(let i=0;i<vertices.count;i++){
 const x=vertices.getX(i),center=Math.round(x/spacing)*spacing;
 const row=avenueFlagRows.reduce((best,z)=>Math.abs(z-vertices.getZ(i))<Math.abs(best-vertices.getZ(i))?z:best,avenueFlagRows[0]);
 windData.push(T.MathUtils.clamp((height(center)-.005-vertices.getY(i))/.85,0,1),center*.7+row*.31);
}
cloth.setAttribute('flagWind',new T.Float32BufferAttribute(windData,2));cloth.boundingSphere!.radius+=.25;
export default function AvenueFlags(){return <group>
 <mesh geometry={cords}><meshStandardMaterial vertexColors roughness={.9}/></mesh>
 <mesh geometry={posts}><meshStandardMaterial vertexColors roughness={.8}/></mesh>
 <mesh geometry={cloth}><FlagClothMaterial hanging/></mesh>
 </group>}
