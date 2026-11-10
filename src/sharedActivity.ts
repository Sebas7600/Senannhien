import type {GameState} from './gameStore';

/** A LAN session must wait for acknowledgement rather than create private scene changes. */
export function sharedActivityBlocked(state:Pick<GameState,'roomSync'|'connection'|'notify'>){
 if(!state.roomSync||state.connection==='online')return false;
 state.notify('Đang kết nối lại phòng LAN. Vui lòng đợi kết nối rồi thử lại.');
 return true;
}

export function sharedEventAge(localAt:number,serverAt:number|undefined,serverOffset:number|undefined,now=Date.now()){
 return serverAt===undefined||serverOffset===undefined?now-localAt:now-serverOffset-serverAt;
}
