import {ArrowUpRight,X} from 'lucide-react';
import {CarryWater} from './practiceIcons';
import {useGame} from './gameStore';
import {WATER_TASK,WATER_JARS,jarUnits} from './waterTaskData';

export default function WaterTaskHUD(){
  const q=useGame(s=>s.waterQuest),pending=useGame(s=>s.pendingActivity),panel=useGame(s=>s.panel),started=useGame(s=>s.started),jars=useGame(s=>s.waterJars);
  // The game's existing one-second clock drives this small UI; no extra animation loop.
  useGame(s=>s.sessionSeconds);
  if(!started||panel||(!q&&pending!=='carryWater'))return null;
  const step=!q||q.phase==='drawing'?0:q.phase==='carrying'?1:2;
  const progress=q&&q.phase!=='carrying'?Math.min(100,Math.max(0,(Date.now()-q.phaseAt)/(q.phase==='drawing'?WATER_TASK.drawMs:WATER_TASK.pourMs)*100)):null;
  const cancel=()=>{const s=useGame.getState();if(q)s.cancelWaterTask();else s.set({destination:null,pendingActivity:null});};
  return <section className="water-task-card" aria-label="Nhiệm vụ gánh nước">
    <header><CarryWater size={22} strokeWidth={1.3}/><div><span>ĐÔI VAI CHĂM CHỈ</span><strong>Gánh nước cho bếp chay</strong></div><button onClick={cancel} aria-label={q?'Đặt gánh xuống, hủy chuyến':'Dừng đến giếng'} title="Hủy chuyến"><X size={16}/></button></header>
    <ol>{['Lấy nước','Gánh về bếp','Rót vào lu'].map((label,i)=><li key={label} className={i===step?'current':i<step?'done':''} aria-current={i===step?'step':undefined}><i>{i+1}</i>{label}</li>)}</ol>
    <p>{!q?'Đang đến giếng cạnh vườn rau…':q.phase==='drawing'?'Kéo gàu lên, chuẩn bị đôi thùng nước…':q.phase==='pouring'?`Đang rót nước vào lu ${(q.jar??0)+1}…`:'Mang đôi thùng tới hàng lu sau nhà ăn. Đến gần lu rồi nhấn E hoặc chạm vào lu.'}</p>
    {progress!==null&&<div className="water-task-progress" role="progressbar" aria-label={q?.phase==='drawing'?'Lấy nước':'Rót nước'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{width:`${progress}%`}}/></div>}
    <div className="water-task-jars" aria-label="Mức nước trong bốn lu">{WATER_JARS.map(j=><span key={j.id} className={q?.jar===j.id?'chosen':''} title={`Lu ${j.id+1}: ${jarUnits(jars[j.id])}/${WATER_TASK.jarCapacity} gánh`}><i style={{height:`${jarUnits(jars[j.id])/WATER_TASK.jarCapacity*100}%`}}/><b>{j.id+1}</b></span>)}<small>Giao xong <strong>+{WATER_TASK.reward}</strong> công đức</small></div>
    {q?.phase==='carrying'&&<button className="water-task-go" onClick={()=>useGame.getState().waterTask()}>Tới lu nhận nước <ArrowUpRight size={15}/></button>}
  </section>;
}
