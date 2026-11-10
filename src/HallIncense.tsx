import {useGame} from './gameStore';
import {HALL_INCENSE} from './ritualStations.mjs';
import {INCENSE_BURN_MS} from './gameData';
import IncenseSticks from './IncenseSticks';
import AltarSmoke from './AltarSmoke';
import {NearbyOverlay} from './Environment';
export default function HallIncense(){
  const burning=useGame(s=>s.burningIncense),slots=useGame(s=>s.offeringSlots);useGame(s=>s.sessionSeconds);
  const times=burning.filter(at=>slots[at]===HALL_INCENSE.id).slice(-24),lit=times.some(at=>Date.now()-at<INCENSE_BURN_MS);
  return <group>
    {times.length>0&&<IncenseSticks times={times} origin={[HALL_INCENSE.urn[0],HALL_INCENSE.urn[2]]} ashY={HALL_INCENSE.urn[1]} radiusScale={.35} heightScale={.5}/>}
    <AltarSmoke lit={lit} position={[HALL_INCENSE.urn[0],HALL_INCENSE.urn[1]+.4,HALL_INCENSE.urn[2]]}/>
    <NearbyOverlay position={[HALL_INCENSE.urn[0],.97,-21.48]} maxDistance={6} distanceFactor={7}>
      <button className="npc-tag hall-incense-tag" aria-label="Dâng một nén tâm hương tại Trúc Lâm" onClick={()=>useGame.getState().perform('incense',HALL_INCENSE.id)}>LƯ HƯƠNG TRÚC LÂM</button>
    </NearbyOverlay>
  </group>;
}
