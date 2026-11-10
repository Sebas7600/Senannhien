import {useLayoutEffect,useRef} from 'react';
import * as T from 'three';
import {useGame} from './gameStore';
import {fruitAltars,cleanFruitOfferings} from './fruitOfferingData';
import {batchGeometry,coloredGeometry,finishInstanceLayout} from './geometryBatch';
const sphere=new T.SphereGeometry(1,9,6),plate=new T.CylinderGeometry(.23,.18,.026,16);
const geometry=batchGeometry([
 coloredGeometry(plate,'#dbd6c2',[0,.014,0]),
 ...[-1,0,1].map((side,i)=>coloredGeometry(sphere,['#e5b24d','#a6b45e','#c36e4b'][i],[side*.105,.104,i===1?-.06:.025],[.09,.10,.09])),
 coloredGeometry(sphere,'#879951',[0,.204,-.055],[.035,.008,.017]),
]);sphere.dispose();plate.dispose();
const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.67});
export default function FruitOfferings(){
 const offerings=useGame(s=>s.fruitOfferings),seconds=useGame(s=>s.sessionSeconds),mesh=useRef<T.InstancedMesh>(null);
 useLayoutEffect(()=>{const object=new T.Object3D();let count=0;for(const offering of cleanFruitOfferings(offerings)){const altar=fruitAltars.find(a=>a.id===offering.altar);if(!altar)continue;object.position.set(...altar.plate);object.updateMatrix();mesh.current!.setMatrixAt(count++,object.matrix);}mesh.current!.count=count;finishInstanceLayout(mesh.current);},[offerings,seconds]);
 return <instancedMesh name="Mam-trai-cay-dang-le" ref={mesh} args={[geometry,material,4]} receiveShadow dispose={null}/>;
}
