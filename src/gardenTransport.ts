export type GardenAction='plant'|'water'|'harvest';
export interface GardenRequest{plot:string;action:GardenAction;revision:number;operation:string}
let transport:((request:GardenRequest)=>Promise<void>)|null=null;
export function setGardenTransport(next:typeof transport){transport=next}
export async function submitGarden(request:GardenRequest){if(!transport)throw new Error('Chưa kết nối phòng.');await transport(request)}
