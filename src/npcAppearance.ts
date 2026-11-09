import {CARRY_FRONT,TRAY_GRIP_BACK,type ServeFrame} from './mealService';
export const NPC_CHIBI_SCALE=1.3;
// Reach toward a surface only; carrying never pushes the body into the tray.
export function npcServiceLead(frame:ServeFrame){return Math.max(0,Math.min(.22,frame.handZ-(CARRY_FRONT-TRAY_GRIP_BACK)))*(1-frame.release);}
export function npcAppearance(n:{id:string;robe:string}){
  return {npc:true,robe:n.robe,gender:n.id==='cook'||n.id==='chef'?'female' as const:'male' as const,apron:n.id==='chef'};
}
