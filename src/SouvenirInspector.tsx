import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as OrbitControlsType} from 'three-stdlib';
import {RotateCcw,RotateCw,Move3D} from 'lucide-react';
import * as T from 'three';
import {souvenirProduct} from './souvenirGeometry';
import {souvenirMaterials,signGeometry} from './SouvenirMarket';
import {finishInstanceLayout} from './geometryBatch';
import {souvenirCatalog,type SouvenirId} from './souvenirData';
import {useGame} from './gameStore';

const beadGeometry=new T.SphereGeometry(1,12,8);
const signatures=new Map<SouvenirId,T.BufferGeometry>();
function Item({id,yaw}:{id:SouvenirId;yaw:number}){
 const product=useMemo(()=>souvenirProduct(id),[id]),materials=useMemo(souvenirMaterials,[]),beads=useRef<T.InstancedMesh>(null);
 const fit=useMemo(()=>{
  const bounds=new T.Box3();
  for(const g of Object.values(product.geometry)){g.computeBoundingBox();bounds.union(g.boundingBox!);}
  for(const bead of product.beads){bounds.expandByPoint(new T.Vector3(...bead.p).addScalar(bead.size));bounds.expandByPoint(new T.Vector3(...bead.p).addScalar(-bead.size));}
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  return {center,scale:1.45/Math.max(size.x,size.y,size.z)};
 },[product]);
 const signature=useMemo(()=>{if(!product.signs.length)return null;let g=signatures.get(id);if(!g){g=signGeometry(product);signatures.set(id,g);}return g;},[id,product]);
 useLayoutEffect(()=>{const mesh=beads.current;if(!mesh)return;const pose=new T.Object3D(),color=new T.Color();product.beads.forEach((bead,i)=>{pose.position.set(...bead.p);pose.scale.setScalar(bead.size);pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);mesh.setColorAt(i,color.set(bead.color));});finishInstanceLayout(mesh);},[product]);
 return <group rotation={[0,yaw,0]} scale={fit.scale} dispose={null}><group position={fit.center.clone().negate()}>
  {Object.entries(product.geometry).map(([kind,g])=><mesh key={kind} geometry={g} material={materials[kind as keyof typeof materials]}/>)}
  {signature&&<mesh geometry={signature} material={materials.signs}/>}
  {product.beads.length>0&&<instancedMesh ref={beads} args={[beadGeometry,materials.bead,product.beads.length]}/>}
 </group></group>;
}
export default function SouvenirInspector({id}:{id:SouvenirId}){
 const [yaw,setYaw]=useState(0),controls=useRef<OrbitControlsType>(null),low=useGame(s=>s.quality==='low'),name=souvenirCatalog.find(item=>item.id===id)!.name;
 return <div className="souvenir-inspector">
  <div className="souvenir-inspector-canvas" role="img" aria-label={`Mô hình 3D ${name}. Kéo để xoay hoặc dùng các nút bên dưới.`}>
   <Canvas frameloop="demand" dpr={low?1:[1,1.3]} gl={{antialias:!low,alpha:true}} camera={{position:[1.6,1.2,2.7],fov:40,near:.05,far:20}}>
    <ambientLight intensity={.8}/><hemisphereLight args={['#fff5df','#879785',1.1]}/><directionalLight position={[-2,4,4]} intensity={2.4} color="#ffedca"/><directionalLight position={[3,1,-2]} intensity={1.2} color="#dbe9f0"/>
    <Item id={id} yaw={yaw}/><OrbitControls ref={controls} enablePan={false} enableZoom={false} minPolarAngle={.15} maxPolarAngle={Math.PI-.15}/>
   </Canvas>
  </div>
  <div className="souvenir-inspector-controls"><button aria-label="Xoay vật phẩm sang trái" onClick={()=>setYaw(v=>v-Math.PI/6)}><RotateCcw size={15}/></button><span><Move3D size={13}/>Kéo để xoay 360°</span><button aria-label="Xoay vật phẩm sang phải" onClick={()=>setYaw(v=>v+Math.PI/6)}><RotateCw size={15}/></button><button aria-label="Đặt lại góc nhìn vật phẩm" onClick={()=>{setYaw(0);controls.current?.reset();}}>Đặt lại</button></div>
 </div>;
}
