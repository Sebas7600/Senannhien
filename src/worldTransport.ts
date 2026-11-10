export type WorldRequest={kind:'bell'|'drum'|'lantern'|'gate'|'water'|'fireworks'|'fruit';operation:string;text?:string;open?:boolean;jar?:number;command?:'start'|'stop';companyPresentationEnabled?:boolean;altar?:string};
export type WorldResult={at:number;serverTime:number;readyAt?:number};
export type SweepRequest={operation:string;seeds:number[];contact:{fromX:number;fromZ:number;x:number;z:number;ground:number;radius:number;forwardX:number;forwardZ:number;depthScale:number}};
let world:((request:WorldRequest)=>Promise<WorldResult>)|null=null,sweep:((request:SweepRequest)=>Promise<number>)|null=null;
export function setWorldTransport(next:typeof world){world=next}
export function setSweepTransport(next:typeof sweep){sweep=next}
export async function submitWorld(request:WorldRequest){if(!world)throw Error('Chưa kết nối phòng.');return world(request)}
export async function submitSweep(request:SweepRequest){if(!sweep)throw Error('Chưa kết nối phòng.');return sweep(request)}
