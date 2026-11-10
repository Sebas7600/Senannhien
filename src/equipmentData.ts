import type {SouvenirId} from './souvenirData';
export type EquipmentSlot='neck'|'wrist'|'hand';
export type Equipment=Record<EquipmentSlot,SouvenirId|null>;
export const equipmentSlots:Record<EquipmentSlot,{label:string;items:readonly SouvenirId[]}>= {
 neck:{label:'Đeo cổ',items:['pendant','necklace']},wrist:{label:'Đeo tay',items:['bracelet']},hand:{label:'Cầm hai tay',items:['buddha','mala','sutra']},
};
export const emptyEquipment=():Equipment=>({neck:null,wrist:null,hand:null});
export function equipmentSlot(id:string){return (Object.keys(equipmentSlots) as EquipmentSlot[]).find(slot=>equipmentSlots[slot].items.includes(id as SouvenirId));}
export function cleanEquipment(value:unknown,owned?:readonly string[]):Equipment{
 const result=emptyEquipment(),raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 for(const slot of Object.keys(equipmentSlots) as EquipmentSlot[]){const id=raw[slot];if(typeof id==='string'&&equipmentSlots[slot].items.includes(id as SouvenirId)&&(!owned||owned.includes(id)))result[slot]=id as SouvenirId;}
 return result;
}
export function canDisplayHandItem(action:string,seated:boolean){return !seated&&action==='walk';}
