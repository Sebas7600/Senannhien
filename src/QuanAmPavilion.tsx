import * as T from 'three';
import {batchGeometry,coloredGeometry,taperTube} from './geometryBatch';
import {PAVILION_POSTS} from './quanAmData';

const wood:T.BufferGeometry[]=[],tiles:T.BufferGeometry[]=[];
const eave=5.68,radius=3.45;
const profile=[[radius,eave+.17],[3.18,eave+.09],[2.76,eave+.16],[2.22,eave+.35],
  [1.66,eave+.64],[1.04,eave+.97],[.45,eave+1.23],[.17,eave+1.30]];
const points=profile.map(([r,y])=>new T.Vector2(r,y));
tiles.push(coloredGeometry(new T.LatheGeometry(points,40),'#405455'));
for(let i=0;i<40;i++){
  const a=i/40*Math.PI*2;
  const ridge=profile.map(([r,y]):[number,number,number]=>[Math.sin(a)*r,y+.018,Math.cos(a)*r]);
  tiles.push(coloredGeometry(taperTube(ridge,[.031,.030,.026,.023,.021,.018,.015,.011],4),i%2?'#5b6761':'#52635e'));
}
function ring(r:number,y:number,tube:number,color:string,target:T.BufferGeometry[]){
  target.push(coloredGeometry(new T.TorusGeometry(r,tube,5,40),color,[0,y,0],[1,1,1],[Math.PI/2,0,0]));
}
ring(radius-.018,eave+.14,.057,'#4a4136',wood);
ring(2.8,eave-.18,.069,'#8b583e',wood);
ring(.20,eave+1.31,.028,'#b18c52',wood);
wood.push(coloredGeometry(new T.CylinderGeometry(.07,.17,.28,10),'#a17d49',[0,eave+1.48,0]));
wood.push(coloredGeometry(new T.SphereGeometry(.087,10,6),'#b28f55',[0,eave+1.66,0],[1,1.25,1]));
for(const {x,z} of PAVILION_POSTS){
  wood.push(coloredGeometry(new T.CylinderGeometry(.125,.155,eave-.43,9),'#835b44',[x,(eave+.03)/2,z]));
  wood.push(coloredGeometry(new T.CylinderGeometry(.20,.23,.23,9),'#a7a08c',[x,.115,z]));
  wood.push(coloredGeometry(new T.CylinderGeometry(.21,.15,.17,9),'#a17350',[x,eave-.27,z]));
}
const roofGeometry=batchGeometry(tiles),frameGeometry=batchGeometry(wood);

export default function QuanAmPavilion(){
  return <group name="Mai-tron-Quan-Am" dispose={null}>
    <mesh geometry={roofGeometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.86}/>
    </mesh>
    <mesh geometry={frameGeometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={.81}/>
    </mesh>
  </group>;
}
