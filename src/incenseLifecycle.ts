import {INCENSE_BURN_MS,INCENSE_STUB_MS} from './gameData';
export function incenseLife(at:number,now:number){
 const age=Math.max(0,now-at);
 return {remaining:Math.max(0,1-age/INCENSE_BURN_MS),burning:age<INCENSE_BURN_MS,retained:age<INCENSE_BURN_MS+INCENSE_STUB_MS};
}
