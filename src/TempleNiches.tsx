import {useGame} from './gameStore';
import {useLayoutEffect,useMemo,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import niches from './templeNiches.json';

/** Bake the supplied Buddha once; all wall niches share one texture and draw call. */
export default function TempleNiches(){
 const {scene:source}=useGLTF('/assets/main-temple/buddha-open-halo.glb?v=complete-20261103-4');
 const gl=useThree(s=>s.gl),mesh=useRef<THREE.InstancedMesh>(null);
 const low=useGame(s=>s.quality==='low');const target=useMemo(()=>new THREE.WebGLRenderTarget(low?384:768,low?512:1024,{depthBuffer:true}),[low]);
 useLayoutEffect(()=>{
  const scene=new THREE.Scene(),buddha=source.clone(true),gold=new THREE.MeshStandardMaterial({color:'#dcb551',metalness:.35,roughness:.55});
  buddha.traverse(o=>{if(o instanceof THREE.Mesh)o.material=gold});
  buddha.rotation.y=Math.PI;buddha.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(buddha),centre=bounds.getCenter(new THREE.Vector3()),scale=1.2/bounds.getSize(new THREE.Vector3()).y;
  buddha.scale.setScalar(scale);buddha.position.set(-centre.x*scale,-centre.y*scale,-centre.z*scale);scene.add(buddha);
  scene.add(new THREE.HemisphereLight('#fff1d1','#52391b',2));
  const key=new THREE.DirectionalLight('#fff1ca',3);key.position.set(-2,3,4);scene.add(key);
  const camera=new THREE.OrthographicCamera(-.5,.5,2/3,-2/3,.1,10);camera.position.set(0,.015,4);camera.lookAt(0,0,0);
  const oldTarget=gl.getRenderTarget(),oldColor=gl.getClearColor(new THREE.Color()),oldAlpha=gl.getClearAlpha(),oldAuto=gl.autoClear,oldXr=gl.xr.enabled;
  try{gl.xr.enabled=false;gl.autoClear=true;gl.setClearColor('#000000',0);gl.setRenderTarget(target);gl.clear();gl.render(scene,camera)}
  finally{gl.setRenderTarget(oldTarget);gl.setClearColor(oldColor,oldAlpha);gl.autoClear=oldAuto;gl.xr.enabled=oldXr;gold.dispose()}
  if(mesh.current){const pose=new THREE.Object3D();niches.forEach((n,i)=>{
   pose.rotation.set(0,n.side?(n.x<0?Math.PI/2:-Math.PI/2):0,0);
   pose.position.set(n.x+(n.side?(n.x<0?-.015:.015):0),n.y+.34,n.z+(n.side?0:-.015));
   pose.scale.set(.48,.64,1);pose.updateMatrix();mesh.current!.setMatrixAt(i,pose.matrix);
  });mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()}
 },[source,gl,target]);
 useLayoutEffect(()=>()=>target.dispose(),[target]);
 return <instancedMesh ref={mesh} args={[undefined,undefined,niches.length]}><planeGeometry args={[1,1]}/><meshBasicMaterial map={target.texture} transparent alphaTest={.08} toneMapped={false} side={THREE.DoubleSide}/></instancedMesh>;
}
