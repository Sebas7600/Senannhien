import {useMemo,useRef} from 'react';
import {useGame} from './gameStore';
import {INCENSE_BURN_MS} from './gameData';
import {initialIncenseTimes} from './incenseStations';
import IncenseSticks from './IncenseSticks';
export default function InitialIncense({station,...props}:{station:string;origin?:[number,number];ashY?:number;radiusScale?:number;heightScale?:number;thicknessScale?:number}){
 const fallback=useRef(Date.now()),epoch=useGame(s=>s.sharedWorld?.leaves.epoch??fallback.current),offset=useGame(s=>s.sharedWorld?.serverOffset??0);
 useGame(s=>s.sessionSeconds);
 const second=Math.floor((Date.now()-offset)/1000);
 const times=useMemo(()=>initialIncenseTimes(epoch,station,15,second*1000,INCENSE_BURN_MS),[epoch,station,second]);
 return <IncenseSticks {...props} times={times} clockOffset={offset}/>;
}
