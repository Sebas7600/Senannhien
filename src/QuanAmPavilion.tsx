import * as T from 'three';
import {batchGeometry,coloredGeometry} from './geometryBatch';
import {PAVILION_POSTS} from './quanAmData';
import ChanhDienRoof from './ChanhDienRoof';
const eave=5.68;
const frameGeometry=batchGeometry(PAVILION_POSTS.flatMap(({x,z})=>[
 coloredGeometry(new T.CylinderGeometry(.125,.155,eave-.43,9),'#835b44',[x,(eave+.03)/2,z]),
 coloredGeometry(new T.CylinderGeometry(.20,.23,.23,9),'#a7a08c',[x,.115,z]),
 coloredGeometry(new T.CylinderGeometry(.21,.15,.17,9),'#a17350',[x,eave-.27,z]),
]));
export default function QuanAmPavilion(){return <group name="Nha-Quan-Am-mai-Chanh-Dien" dispose={null}>
 <ChanhDienRoof y={eave} width={6.9} depth={6.9}/>
 <mesh geometry={frameGeometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.81}/></mesh>
</group>;}
