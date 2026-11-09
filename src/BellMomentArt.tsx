import {Suspense,useMemo} from 'react';
import {Canvas} from '@react-three/fiber';
import {Box3,Vector3} from 'three';
import {useCourtyardProp} from './courtyardModels';
import {BellArt} from './RitualArt';

function BellModel(){
  // useGLTF shares the already-loaded courtyard asset, including quality level.
  // Only the scene transforms are cloned; the popup cannot move the outdoor bell.
  const model=useCourtyardProp('bell');
  const layout=useMemo(()=>{
    const bounds=new Box3().setFromObject(model),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
    return {scale:3/Math.max(size.x,size.y,size.z),position:center.multiplyScalar(-1).toArray() as [number,number,number]};
  },[model]);
  return <group scale={layout.scale} dispose={null}><group position={layout.position}><primitive object={model}/></group></group>;
}

export default function BellMomentArt(){
  return <div className="bell-model-art" aria-hidden="true">
    <Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[2,1.2,6.8],fov:30}} gl={{alpha:true,antialias:true}} fallback={<BellArt/>}>
      <ambientLight intensity={1.6}/><directionalLight position={[3,6,5]} intensity={2.7}/><directionalLight position={[-4,2,-2]} intensity={1.1}/>
      <Suspense fallback={null}><BellModel/></Suspense>
    </Canvas>
  </div>;
}
