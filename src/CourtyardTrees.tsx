import {memo,useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {RigidBody,CylinderCollider} from '@react-three/rapier';
import {courtyardTrees,COURTYARD_TREE} from './courtyardData';
import {courtyardTreeGeometry,courtyardTreeMaterial} from './courtyardTreeGeometry';
import {canopyGeometry,foliageMaterial} from './foliage';
import {useCameraOccluder} from './cameraObstruction';
function CourtyardTrees({colliders=true}:{colliders?:boolean}){
  const bases=useRef<THREE.InstancedMesh>(null),crowns=useRef<THREE.InstancedMesh>(null);useCameraOccluder(crowns);
  useLayoutEffect(()=>{const o=new THREE.Object3D();for(const [i,t] of courtyardTrees.entries()){
    o.position.set(t.x,COURTYARD_TREE.ground,t.z);o.scale.set(1,1,1);o.rotation.y=i*.7;o.updateMatrix();bases.current!.setMatrixAt(i,o.matrix);
    o.position.y+=.7;o.scale.set(1.3,1.15,1.3);o.updateMatrix();crowns.current!.setMatrixAt(i,o.matrix);
  }for(const mesh of [bases.current!,crowns.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere()}},[]);
  return <group name="Hai-goc-cay-nghi-chan" dispose={null}>
    <instancedMesh ref={bases} args={[courtyardTreeGeometry,courtyardTreeMaterial,2]} castShadow receiveShadow/>
    <instancedMesh ref={crowns} args={[canopyGeometry,foliageMaterial,2]} castShadow receiveShadow/>
    {colliders&&<RigidBody type="fixed" colliders={false}>{courtyardTrees.map(t=><CylinderCollider key={t.id} position={[t.x,COURTYARD_TREE.ground+COURTYARD_TREE.wallHeight/2,t.z]} args={[COURTYARD_TREE.wallHeight/2,COURTYARD_TREE.radius]}/>)}</RigidBody>}
  </group>;
}
export default memo(CourtyardTrees);
