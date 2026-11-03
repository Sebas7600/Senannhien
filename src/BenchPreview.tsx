import {Suspense,useState,useEffect} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {ContactShadows,Environment,Lightformer,OrbitControls} from '@react-three/drei';
import {ArrowLeft,Check,Flower2,Move3D} from 'lucide-react';
import VietnameseBench from './VietnameseBench';
import type {BenchFinish} from './terrazzo';
import './bench-preview.css';
const finishes:{id:BenchFinish;name:string;color:string}[]=[{id:'jade',name:'Xanh ngọc',color:'#397f72'},{id:'brick',name:'Đỏ gạch',color:'#a04d40'},{id:'ivory',name:'Trắng ngà',color:'#d4d0bb'}];
function CameraFraming(){const {camera,size}=useThree(),narrow=size.width<700;useEffect(()=>{camera.position.set(narrow?4.3:2.6,narrow?2:1.5,narrow?6:3.5);camera.lookAt(0,.43,0);camera.updateProjectionMatrix()},[camera,narrow]);return null;}
export default function BenchPreview(){const[finish,setFinish]=useState<BenchFinish>('jade');return <main className="bench-preview-page">
  <Canvas shadows dpr={[1,1.5]} gl={{antialias:true}} camera={{position:[2.6,1.5,3.5],fov:34}}>
    <color attach="background" args={['#e8e4d9']}/><fog attach="fog" args={['#e8e4d9',10,30]}/>
    <ambientLight intensity={.5}/><hemisphereLight args={['#fff5df','#a7ad98',.65]}/><directionalLight position={[-3,6,4]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.0002}/>
    <Environment frames={1} resolution={128}><Lightformer position={[0,5,1]} rotation={[Math.PI/2,0,0]} scale={[8,8,1]} intensity={1.5}/><Lightformer position={[3,2,-3]} rotation={[0,-Math.PI/4,0]} scale={[3,3,1]} intensity={1}/></Environment>
    <Suspense fallback={null}><VietnameseBench finish={finish}/><ContactShadows position={[0,0,0]} opacity={.38} blur={2.2} scale={7} far={2} resolution={512}/></Suspense>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.014,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#d9d5c9" roughness={.94}/></mesh>
    <CameraFraming/><OrbitControls target={[0,.43,0]} minDistance={1.6} maxDistance={10} minPolarAngle={.5} maxPolarAngle={Math.PI/2-.035} enablePan={false}/>
  </Canvas>
  <header className="bench-preview-title"><a href="/" className="bench-return"><ArrowLeft size={15}/>Về sân chùa</a><span className="bench-eyebrow"><Flower2 size={19} strokeWidth={1}/>SEN AN NHIÊN · CHI TIẾT KHÔNG GIAN</span><h1>Ghế đá sân chùa.</h1><p>Một chỗ ngồi quen thuộc.<br/>Một khoảng bình yên rất Việt Nam.</p></header>
  <div className="bench-preview-note"><span>GRANITO HAI MÀU</span><p>Cạnh bo mềm · Tựa cong nhẹ<br/>Chân đúc · Chữ đỏ trên nền ngà</p></div>
  <footer className="bench-preview-footer"><span className="bench-orbit-hint"><Move3D size={17} strokeWidth={1.3}/>Kéo để xoay · Cuộn để xem gần</span><div className="bench-finish-picker" role="group" aria-label="Màu ghế đá">{finishes.map(f=><button key={f.id} onClick={()=>setFinish(f.id)} aria-pressed={finish===f.id}><i style={{background:f.color}}>{finish===f.id&&<Check size={12}/>}</i>{f.name}</button>)}</div></footer>
</main>}
