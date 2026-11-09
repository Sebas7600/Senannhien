import {ZoomIn,ZoomOut} from 'lucide-react';
import {useGame} from './gameStore';
export default function CameraZoom(){
  const zoom=useGame(s=>s.cameraZoom),panel=useGame(s=>s.panel),ready=useGame(s=>s.characterConfigured);
  if(!ready||panel)return null;
  return <div className="camera-zoom" onPointerDown={e=>e.stopPropagation()} aria-label="Thu phóng camera">
    <ZoomIn size={15}/><input type="range" min="3" max="14" step="0.1" value={zoom} aria-label="Khoảng cách camera" aria-valuetext={`${zoom.toFixed(1)} mét`} onChange={e=>useGame.getState().set({cameraZoom:Number(e.target.value)})}/><ZoomOut size={15}/>
  </div>;
}
