import {seats,usesFloorSeat,type Seat} from './gameData';
import {CUSHION} from './cushionData';
/** Every floor seat has the same woven atlas; dining/reading keep their low profile. */
export const cushionSeats=seats.filter(usesFloorSeat);
export const LOW_CUSHION={radius:.62,height:.11,scaleXZ:.62/CUSHION.radius,scaleY:.11/CUSHION.height} as const;
export function cushionBaseY(seat:Seat){return seat.position[1]-(seat.kind==='cushion'?CUSHION.seatLift:0);}
export function cushionScale(seat:Seat):[number,number,number]{return seat.kind==='cushion'?[1,1,1]:[LOW_CUSHION.scaleXZ,LOW_CUSHION.scaleY,LOW_CUSHION.scaleXZ];}
