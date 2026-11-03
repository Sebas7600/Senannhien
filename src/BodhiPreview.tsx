import {Suspense,useEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {ContactShadows,Environment,Lightformer,OrbitControls} from '@react-three/drei';
import type {OrbitControls as OrbitControlsType} from 'three-stdlib';
import {ArrowLeft,Flower2,Move3D} from 'lucide-react';
import BodhiTree from './BodhiTree';
import CourtyardTrees from './CourtyardTrees';
import BenchBatches from './BenchBatches';
import './bench-preview.css';
type Scene='whole'|'close'|'courtyard';
function Camera({scene}:{scene:Scene}){const {camera,size}=useThree(),controls=useRef<OrbitControlsType>(null),mobile=size.width<700;const target:[number,number,number]=scene==='courtyard'?[0,2.7,20]:scene==='close'?[0,1.2,1.3]:[0,4,0];useEffect(()=>{camera.position.set(...(scene==='courtyard'?(mobile?[12,24,90]:[18,13,43]):scene==='close'?(mobile?[12,4,18]:[5,2.7,8]):(mobile?[20,8,28]:[11,6.5,15])) as [number,number,number]);camera.lookAt(...target);controls.current?.target.set(...target);controls.current?.update()},[camera,scene,mobile]);return <OrbitControls ref={controls} target={target} minDistance={3} maxDistance={100} minPolarAngle={.25} maxPolarAngle={Math.PI/2-.03} enablePan={false}/>}
function AssetStats(){const elapsed=useRef(0);useFrame(({gl},dt)=>{elapsed.current+=dt;if(elapsed.current<1)return;elapsed.current=0;document.documentElement.dataset.assetPerformance=JSON.stringify({calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures})});return null;}
export default function BodhiPreview(){const[scene,setScene]=useState<Scene>(new URLSearchParams(location.search).get('view')==='san-chua'?'courtyard':'whole'),yard=scene==='courtyard';return <main className="bench-preview-page">
  <Canvas shadows dpr={[1,1.3]} gl={{antialias:true}} camera={{position:[11,6.5,15],fov:40}}>
    <color attach="background" args={['#dce2cc']}/><fog attach="fog" args={['#dce2cc',35,100]}/><ambientLight intensity={.6}/><hemisphereLight args={['#fff6e4','#7d886b',.8]}/><directionalLight position={[-8,14,9]} intensity={2.2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={10} shadow-camera-bottom={-7} shadow-bias={-.0003}/>
    <Environment frames={1} resolution={64}><Lightformer position={[0,12,0]} rotation={[Math.PI/2,0,0]} scale={[20,20,1]} intensity={.8}/></Environment>
    <Suspense fallback={null}>{yard?<><CourtyardTrees colliders={false}/><BenchBatches/></>:<BodhiTree interactive={false}/>}<ContactShadows position={yard?[0,-.015,20]:[0,-.015,0]} opacity={.32} scale={yard?40:24} far={10} blur={2} resolution={512}/></Suspense>
    <mesh position={[0,-.025,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#bec9a8" roughness={1}/></mesh><Camera scene={scene}/><AssetStats/>
  </Canvas>
  <header className="bench-preview-title"><a className="bench-return" href="/"><ArrowLeft size={15}/>Về sân chùa</a><span className="bench-eyebrow"><Flower2 size={19} strokeWidth={1}/>SEN AN NHIÊN · KHOẢNG LẶNG TRONG SÂN</span><h1>{yard?'Một khoảng nghỉ chân.':'Dưới tán bồ đề.'}</h1><p>{yard?<>Hai gốc cây. Sáu băng ghế.<br/>Bóng mát bên lối vào tam quan.</>:<>Gốc rễ vững vàng. Tán xanh yên tĩnh.<br/>Một nén hương, một niệm an lành.</>}</p></header>
  <div className="bench-preview-note"><span>{yard?'HAI GỐC CÂY SÂN CHÙA':'BỒ ĐỀ SÂN CHÙA'}</span><p>Tán khối · Rễ nổi · Bồn đá<br/>{yard?'Mỗi cây ba ghế · Chừa lối đi':'Bàn thờ nhỏ · Lư hương'}</p></div>
  <footer className="bench-preview-footer"><span className="bench-orbit-hint"><Move3D size={17} strokeWidth={1.3}/>Kéo để xoay · Cuộn để xem gần</span><div className="bench-finish-picker" role="group" aria-label="Góc xem cây sân chùa"><button aria-pressed={scene==='whole'} onClick={()=>setScene('whole')}>Bồ đề</button><button aria-pressed={scene==='close'} onClick={()=>setScene('close')}>Gốc & bàn thờ</button><button aria-pressed={yard} onClick={()=>setScene('courtyard')}>Hai gốc sân</button></div></footer>
</main>}
