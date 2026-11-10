import {useEffect} from 'react';
import {ZoomIn,ZoomOut} from 'lucide-react';
import {useGame} from './gameStore';
import {clampOverviewZoom,OVERVIEW_ZOOM_MIN,useOverviewZoomMax} from './cameraZoomLimits';
export default function CameraZoom(){
  const mode=useGame(s=>s.camera),followZoom=useGame(s=>s.cameraZoom),overviewZoom=useGame(s=>s.cameraOverviewZoom),panel=useGame(s=>s.panel),ready=useGame(s=>s.characterConfigured);
  const overviewMax=useOverviewZoomMax();
  useEffect(()=>{if(overviewZoom>overviewMax)useGame.getState().set({cameraOverviewZoom:overviewMax});},[overviewZoom,overviewMax]);
  if(!ready||panel)return null;
  const overview=mode==='overview',zoom=overview?clampOverviewZoom(overviewZoom,overviewMax):followZoom,min=overview?OVERVIEW_ZOOM_MIN:3,max=overview?overviewMax:14;
  return <div className="camera-zoom" onPointerDown={e=>e.stopPropagation()} aria-label="Thu phóng camera">
    <ZoomIn size={15}/><input type="range" min={min} max={max} step="0.1" value={zoom} aria-label={overview?'Thu phóng toàn cảnh':'Khoảng cách camera'} aria-valuetext={`${zoom.toFixed(1)} mét`} onChange={e=>useGame.getState().set(overview?{cameraOverviewZoom:clampOverviewZoom(Number(e.target.value),overviewMax)}:{cameraZoom:Number(e.target.value)})}/><ZoomOut size={15}/>
  </div>;
}
