import {incenseSpot,type Vec2} from './gameData';
import {QUAN_AM} from './quanAmData';
import {BODHI_INCENSE,HALL_INCENSE} from './ritualStations.mjs';
export function incenseHeading(position:Vec2,station?:string){
  const target=station===BODHI_INCENSE.id?[BODHI_INCENSE.urn[0],BODHI_INCENSE.urn[2]]:station===HALL_INCENSE.id?[HALL_INCENSE.urn[0],HALL_INCENSE.urn[2]]:station===QUAN_AM.incenseId?[QUAN_AM.tableX,QUAN_AM.tableZ]:incenseSpot;
  return Math.atan2(target[0]-position[0],target[1]-position[1]);
}
