import {QUAN_AM} from './quanAmData';
import {GATE_ENTRY} from './courtyardPropsData';
import {WATER_WELL,WATER_JARS} from './waterTaskData';
import {ISLAND,POND,POND_BRIDGES} from './pondLayout';
import { useState } from 'react';
import { ArrowUpRight, Footprints, LocateFixed, MapPin } from 'lucide-react';
import { places,WISH_APPROACH, type PlaceId, type Vec2 } from './gameData';
import { floorAt, useGame } from './gameStore';
import {courtyardTrees,restingBenches} from './courtyardData';
const entries:Record<PlaceId,Vec2>={gate:GATE_ENTRY,courtyard:[0,6],temple:[0,-18],hall:[-33,-9],bell:[-19,-9],pond:[POND_BRIDGES[0].start,POND_BRIDGES[0].z],dining:[34,-17],library:[-34,-35],garden:[28,-45],terrace:[0,-50],lotus:WISH_APPROACH,stupa:[-35,49],bamboo:[-38,12]};
export function travel(id:PlaceId){const s=useGame.getState(),p=entries[id];if(s.waterQuest){s.notify('Đang gánh nước: đi bộ tới lu hoặc đặt gánh xuống trước khi đến nhanh nhé.');return;}s.stand();const heading=id==='lotus'?Math.atan2(ISLAND.x-p[0],ISLAND.z-p[1]):id==='pond'?Math.PI/2:Math.PI;s.set({position:p,height:floorAt(...p)+.1,destination:null,panel:null,teleport:{position:[p[0],floorAt(...p)+.1,p[1]],heading,at:Date.now()},cameraReset:s.cameraReset+1});s.notify(`Đã đến ${places.find(v=>v.id===id)!.name}.`);}
export function MapArtwork({mini=false,onSelect}:{mini?:boolean;onSelect?:(id:PlaceId)=>void}){const position=useGame(s=>s.position),heading=useGame(s=>s.heading),peers=useGame(s=>s.peers),visited=useGame(s=>s.visited);
  return <svg className={mini?'map-art mini':'map-art'} viewBox="-66 -72 132 140" role="img" aria-label="Bản đồ toàn khuôn viên chùa">
    <defs><pattern id={mini?'grid-mini':'grid-big'} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="#97ad7913" strokeWidth=".3"/></pattern></defs>
    <rect x="-65" y="-71" width="130" height="138" rx="5" fill="#dce5cf"/><rect x="-60" y="-66" width="120" height="128" rx="2" fill={`url(#${mini?'grid-mini':'grid-big'})`} stroke="#a4b28d" strokeWidth=".5"/>
    <path d={`M0 ${GATE_ENTRY[1]}V-55 M-45 -6H45 M-43 -32H45 M-17 -55V48 M17 -55V48 M-35 42H28 M34 -50V-6`} stroke="#d2c7a4" strokeWidth="4" fill="none"/>
    <rect x="-14" y="-17" width="28" height="44" fill="#e6ddbe"/>
    <ellipse cx={POND.x} cy={POND.z} rx={POND.rx} ry={POND.rz} fill="#92b5a4"/>
    {POND_BRIDGES.map(bridge=><path key={bridge.z} d={`M${bridge.start} ${bridge.z}H${bridge.end}`} stroke="#bda881" strokeWidth="2.7"/>)}
    <circle cx={ISLAND.x} cy={ISLAND.z} r={ISLAND.radius} fill="#cfbf9b"/>
    {[{x:-11,z:-36,w:22,d:18},{x:-43,z:-25,w:20,d:16},{x:22.5,z:-36,w:23,d:18},{x:-42.5,z:-50,w:17,d:14},{x:-8,z:-61,w:16,d:10}].map((r,i)=><rect key={i} x={r.x} y={r.z} width={r.w} height={r.d} rx=".7" fill="#879d81" stroke="#6c876b" strokeWidth=".5"/>)}
    <rect x="28" y="-56" width="16" height="13" rx="1" fill="#9eac7c"/>{Array.from({length:4},(_,i)=><path key={i} d={`M${30+i*3.2} -55V-44`} stroke="#c6ce9f" strokeWidth="1.6"/>)}
    <circle cx="-10" cy="0" r="4.5" fill="#83a075"/><circle cx="-35" cy="42" r="4" fill="#b8aa7c"/><ellipse cx="-38" cy="12" rx="8" ry="10" fill="#8fa98188"/>
    {courtyardTrees.map(t=><circle key={t.id} cx={t.x} cy={t.z} r="2.7" fill="#78965f" stroke="#c1c4ac" strokeWidth=".5"/>)}
    {!mini&&restingBenches.map(b=><path key={b.id} transform={`translate(${b.x},${b.z}) rotate(${-b.rotation*180/Math.PI})`} d="M-.9 0H.9" stroke="#5c7b70" strokeWidth=".6"/>)}
    {!mini&&places.map(p=><g key={p.id} onClick={()=>onSelect?.(p.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')onSelect?.(p.id)}} aria-label={`Chọn ${p.name}`} className="map-marker"><circle cx={p.x} cy={p.z} r="2.1" fill={visited.includes(p.id)?'#526f4b':'#f6f1df'} stroke="#526f4b" strokeWidth=".6"/><text x={p.x} y={p.z+(p.id==='temple'?7:5)} textAnchor="middle" fill="#405d3c" fontSize="2.4" fontFamily="Be Vietnam Pro, sans-serif">{p.name}</text></g>)}
    <circle cx={WATER_WELL.x} cy={WATER_WELL.z} r={mini?1.4:1.1} fill="#779c91" stroke="#f6efda" strokeWidth=".5"/>{WATER_JARS.map(j=><circle key={j.id} cx={j.x} cy={j.z} r={mini?.65:.6} fill="#9f7650"/>)}
    {!mini&&<text x={WATER_WELL.x-2} y={WATER_WELL.z-2.5} textAnchor="end" fill="#577d6b" fontSize="2.2">Giếng nước</text>}
    <circle cx={QUAN_AM.x} cy={QUAN_AM.z} r={mini?1.6:1.3} fill="#bba675" stroke="#faf4df" strokeWidth=".5"/>{!mini&&<text x={QUAN_AM.x+2} y={QUAN_AM.z+1} fill="#7d744f" fontSize="2.2">Quan Âm</text>}
    {peers.map(p=><circle key={p.id} cx={p.x} cy={p.z} r={mini?1.8:1.1} fill="#b18766" stroke="#f8f3df" strokeWidth=".6"/>)}
    <g transform={`translate(${position[0]},${position[1]}) rotate(${-heading*180/Math.PI})`}><circle r={mini?3.3:2.1} fill="#f8f4de"/><path d="M0 2.2L-1.5 -1.5L0 -.7L1.5 -1.5Z" fill="#466c40"/></g>
    {!mini&&<text x="55" y="-59" fill="#7f906c" fontSize="3">BẮC ↑</text>}
  </svg>;
}
export function MapPanel(){const [selected,setSelected]=useState<PlaceId>('temple');const visited=useGame(s=>s.visited),p=places.find(p=>p.id===selected)!;return <div className="large-map-layout"><div><MapArtwork onSelect={setSelected}/><div className="map-legend"><span><i className="you-dot"/> Bạn đang ở đây</span><span><i/>Đã ghé {visited.length}/13 nơi</span></div></div><div className="destination-list">{places.map(v=><button key={v.id} className={v.id===selected?'selected':''} onClick={()=>setSelected(v.id)}><MapPin size={15}/><span>{v.name}<small>{v.subtitle}</small></span>{visited.includes(v.id)&&<i className="visited-check">✓</i>}</button>)}</div><div className="destination-actions"><div><strong>{p.name}</strong><small>{p.subtitle}</small></div><button className="button ghost" onClick={()=>useGame.getState().go(p.id)}><Footprints size={15}/>Đi bộ</button><button className="button primary" onClick={()=>travel(p.id)}><LocateFixed size={15}/>Đến nhanh<ArrowUpRight size={14}/></button></div></div>}
