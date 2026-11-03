import {Suspense,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {ContactShadows,Environment,Lightformer,OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {ArrowLeft,Flower2,Move3D} from 'lucide-react';
import {cushionNearGeometry} from './cushionGeometry';
import {useCushionMaterial} from './cushionMaterial';
import './bench-preview.css';
type View='single'|'top'|'rows';
function Cushions({rows}:{rows:boolean}){const mesh=useRef<THREE.InstancedMesh>(null),material=useCushionMaterial('near');
  useLayoutEffect(()=>{const o=new THREE.Object3D();mesh.current!.count=rows?9:1;for(let i=0;i<mesh.current!.count;i++){o.position.set(rows?(i%3-1)*1.65:0,0,rows?(Math.floor(i/3)-1)*1.65:0);o.rotation.y=rows?(i%3)*.22:0;o.updateMatrix();mesh.current!.setMatrixAt(i,o.matrix)}mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.computeBoundingSphere()},[rows]);
  return <instancedMesh ref={mesh} args={[cushionNearGeometry,material,9]} castShadow receiveShadow dispose={null}/>;
}
function Camera({view}:{view:View}){const{camera,size}=useThree(),controls=useRef<Controls>(null),mobile=size.width<700;
  useEffect(()=>{camera.position.set(...(view==='rows'?(mobile?[7,7,10]:[5,4.8,6]):view==='top'?[0,mobile?4.4:3.1,.01]:mobile?[2.4,2.4,3.4]:[1.65,1.65,2.3]) as [number,number,number]);camera.lookAt(0,.1,0);controls.current?.target.set(0,.1,0);controls.current?.update()},[camera,view,mobile]);
  return <OrbitControls ref={controls} target={[0,.1,0]} minDistance={1.2} maxDistance={15} minPolarAngle={.01} maxPolarAngle={Math.PI/2-.04} enablePan={false}/>;
}
function Stats(){const elapsed=useRef(0);useFrame(({gl},dt)=>{elapsed.current+=dt;if(elapsed.current<1)return;elapsed.current=0;document.documentElement.dataset.assetPerformance=JSON.stringify({calls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures})});return null;}
export default function CushionPreview(){const[view,setView]=useState<View>('single');return <main className="bench-preview-page">
  <Canvas shadows dpr={[1,1.5]} camera={{position:[1.65,1.65,2.3],fov:35}}>
    <color attach="background" args={['#e6e4d9']}/><ambientLight intensity={.6}/><hemisphereLight args={['#fff7e9','#8d9480',.8]}/>
    <directionalLight position={[-3,6,4]} intensity={2.1} castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0002} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5}/>
    <Environment frames={1} resolution={64}><Lightformer position={[0,5,0]} rotation={[Math.PI/2,0,0]} scale={[10,10,1]} intensity={.7}/></Environment>
    <Suspense fallback={null}><Cushions rows={view==='rows'}/><ContactShadows position={[0,.001,0]} scale={view==='rows'?9:4} opacity={.3} blur={2} far={1} resolution={512}/></Suspense>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color="#d8d7c9" roughness={1}/></mesh><Camera view={view}/><Stats/>
  </Canvas>
  <header className="bench-preview-title"><a href="/" className="bench-return"><ArrowLeft size={15}/>Về sân chùa</a><span className="bench-eyebrow"><Flower2 size={19} strokeWidth={1}/>SEN AN NHIÊN · NẾP ĐAN THỦ CÔNG</span><h1>Bồ đoàn Liên Thủy.</h1><p>Sợi mây ôm một vòng sen.<br/>Ngồi xuống, để lòng chậm lại.</p></header>
  <div className="bench-preview-note"><span>MÂY MẬT ONG · NÂU TRẦM</span><p>Mặt phồng mềm · Viền bện<br/>Cánh sen xoáy · Nếp đan nổi</p></div>
  <footer className="bench-preview-footer"><span className="bench-orbit-hint"><Move3D size={17} strokeWidth={1.3}/>Kéo để xoay · Cuộn để xem sợi đan</span><div className="bench-finish-picker" role="group" aria-label="Góc xem bồ đoàn"><button aria-pressed={view==='single'} onClick={()=>setView('single')}>Bồ đoàn</button><button aria-pressed={view==='top'} onClick={()=>setView('top')}>Hoa văn</button><button aria-pressed={view==='rows'} onClick={()=>setView('rows')}>Dãy bồ đoàn</button></div></footer>
</main>}
