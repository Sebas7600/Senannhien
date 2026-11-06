import {seats,usesFloorSeat,type Seat} from './gameData';
import {CUSHION} from './cushionData';
/** All floor seats keep the same Truc Lam model, size and seated surface. */
export const cushionSeats=seats.filter(usesFloorSeat);
export function cushionBaseY(seat:Seat){return seat.position[1]-CUSHION.seatLift;}
export function cushionScale(_seat:Seat):[number,number,number]{return [1,1,1];}
