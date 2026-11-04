export type SharedOfferingKind='incense'|'flower'|'candle'|'feed';
export type OfferingRequest={kind:SharedOfferingKind;station?:string;operation:string};
let transport:((request:OfferingRequest)=>Promise<void>)|null=null;
let pending=false;
export function setOfferingTransport(next:typeof transport){transport=next}
export function offeringPending(){return pending}
export async function submitOffering(request:OfferingRequest){if(!transport||pending)throw new Error('Chưa kết nối.');pending=true;try{await transport(request)}finally{pending=false}}
