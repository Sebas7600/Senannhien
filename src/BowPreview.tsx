import {Suspense,useEffect,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {ContactShadows,OrbitControls,Environment,Lightformer} from '@react-three/drei';
import {ArrowLeft,Flower2,Volume2,VolumeX,Play} from 'lucide-react';
import Character from './PlayerAvatar';
import {CUSHION} from './cushionData';
import {cushionNearGeometry} from './cushionGeometry';
import {useCushionMaterial} from './cushionMaterial';
import {bowDuration,type BowMode} from './bowTimeline';
import {bindSound,scheduleBowBowl,setAmbient} from './audio';
import './bench-preview.css';
function Cushion(){return <mesh geometry={cushionNearGeometry} material={useCushionMaterial('near')} castShadow receiveShadow dispose={null}/>}
export default function BowPreview(){const[mode,setMode]=useState<BowMode>('standing'),[playing,setPlaying]=useState(false),[at,setAt]=useState(0),[progress,setProgress]=useState(0),[sound,setSound]=useState(true),soundRef=useRef(sound),cancel=useRef<()=>void>(()=>{});soundRef.current=sound;
  useEffect(()=>{bindSound(()=>soundRef.current);return()=>{cancel.current();setAmbient(false)}},[]);
  useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{setPlaying(false);setProgress(100)},bowDuration(mode)*1000);return()=>clearTimeout(timer)},[playing,at,mode]);
  function select(next:BowMode){cancel.current();setPlaying(false);setMode(next);setProgress(0)}
  function play(){if(playing)return;const time=Date.now();setAt(time);setProgress(0);setPlaying(true);cancel.current=scheduleBowBowl({at:time,mode})}
  const active=playing||progress>0;
  return <main className="bench-preview-page"><Canvas shadows dpr={[1,1.3]} camera={{position:[2.7,1.6,3.8],fov:34}}>
    <color attach="background" args={['#e2e5d8']}/><ambientLight intensity={.7}/><hemisphereLight args={['#fff6df','#89967a',.7]}/><directionalLight position={[-3,7,4]} intensity={2} castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0003}/>
    <Environment frames={1} resolution={64}><Lightformer position={[0,6,0]} rotation={[Math.PI/2,0,0]} scale={[10,10,1]} intensity={.5}/></Environment>
    <Suspense fallback={null}>{mode==='cushion'&&<Cushion/>}<group position={[0,mode==='cushion'?CUSHION.seatLift:0,0]}><Character key={mode} robe="#8b967f" seated={mode==='cushion'} pose={active?'bow':mode==='cushion'?'sit':'walk'} bowMode={mode} bowStartedAt={at} bowElapsed={playing?undefined:progress/100*bowDuration(mode)}/></group><ContactShadows position={[0,.002,0]} scale={6} far={3} blur={2} opacity={.3} resolution={512}/></Suspense>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color="#ccd1bd" roughness={1}/></mesh><OrbitControls target={[0,.75,0]} enablePan={false} minDistance={1.4} maxDistance={12} maxPolarAngle={Math.PI/2-.03}/>
  </Canvas><header className="bench-preview-title"><a className="bench-return" href="/"><ArrowLeft size={15}/>Về sân chùa</a><span className="bench-eyebrow"><Flower2 size={19} strokeWidth={1}/>SEN AN NHIÊN · MỘT LẠY THÀNH TÂM</span><h1>Cúi mình, lắng lòng.</h1><p>{mode==='standing'?'Chắp tay. Quỳ xuống. Cúi lạy.':'Từ bồ đoàn, cúi lạy an nhiên.'}<br/>Tiếng chén đồng ngân theo một nhịp.</p></header>
  <div className="bench-preview-note"><span>THỰC TẬP LỄ PHẬT</span><p>Kéo để đổi góc nhìn<br/>Chọn một tư thế để xem</p></div>
  <footer className="bow-preview-controls"><div className="bench-finish-picker"><button aria-pressed={mode==='standing'} onClick={()=>select('standing')}>Từ đứng</button><button aria-pressed={mode==='cushion'} onClick={()=>select('cushion')}>Trên bồ đoàn</button></div><label>Tiến trình động tác<input aria-label="Tiến trình động tác" type="range" min="0" max="100" value={progress} onChange={e=>{cancel.current();setPlaying(false);setProgress(Number(e.target.value))}}/></label><button className="button primary" disabled={playing} onClick={play}><Play size={15}/>{playing?'Đang lạy…':'Lạy một lần'}</button><button className="icon-btn" aria-label={sound?'Tắt tiếng chén đồng':'Bật tiếng chén đồng'} onClick={()=>{setSound(!sound);if(sound)setAmbient(false)}}>{sound?<Volume2 size={20}/>:<VolumeX size={20}/>}</button></footer>
  </main>;
}
