import {createClientId} from './clientIds';

/** A page owns its identity. sessionStorage can be copied when a tab is duplicated. */
export function createPageIdentity(generate:()=>string=createClientId){return {id:generate()};}

export interface CourtyardEventSource {
  addEventListener(type:string,listener:(event:{data?:string})=>void):void;
  onerror:((event:Event)=>unknown)|null;
  close():void;
}
interface ConnectionOptions {
  health:()=>Promise<void>;
  openSource:()=>CourtyardEventSource;
  onSnapshot:(data:string,authoritative:boolean)=>void;
  onStatus:(status:'connecting'|'online'|'offline')=>void;
  sendState:()=>Promise<unknown>;
  setTimeout?:typeof globalThis.setTimeout;
  clearTimeout?:typeof globalThis.clearTimeout;
  setInterval?:typeof globalThis.setInterval;
  clearInterval?:typeof globalThis.clearInterval;
}

/** Owns exactly one stream, health retry and state heartbeat for a mounted room. */
export function createCourtyardConnection(options:ConnectionOptions){
  const later=options.setTimeout??globalThis.setTimeout,clearLater=options.clearTimeout??globalThis.clearTimeout;
  const repeat=options.setInterval??globalThis.setInterval,clearRepeat=options.clearInterval??globalThis.clearInterval;
  let closed=false,started=false,source:CourtyardEventSource|null=null;
  let retry:ReturnType<typeof setTimeout>|null=null,heartbeat:ReturnType<typeof setInterval>|null=null;
  let failures=0,authoritative=true,sending=false;
  const stopHeartbeat=()=>{if(heartbeat!==null){clearRepeat(heartbeat);heartbeat=null;}};
  const send=()=>{
    if(closed||sending)return;
    sending=true;void options.sendState().catch(()=>{}).finally(()=>{sending=false;});
  };
  const connect=async()=>{
    retry=null;
    try{
      await options.health();if(closed)return;
      source=options.openSource();failures=0;
      source.addEventListener('open',()=>{if(!closed)authoritative=true;});
      source.addEventListener('snapshot',event=>{
        if(closed||typeof event.data!=='string')return;
        try{options.onSnapshot(event.data,authoritative);}catch{return;}
        authoritative=false;options.onStatus('online');
        if(heartbeat===null){send();heartbeat=repeat(send,350);}
      });
      source.onerror=()=>{
        if(closed)return;
        authoritative=true;stopHeartbeat();options.onStatus('offline');
        // EventSource owns its reconnect backoff; its next snapshot replaces room state.
      };
    }catch{
      if(closed)return;
      options.onStatus('offline');
      retry=later(()=>{void connect();},Math.min(10000,1000*2**Math.min(failures++,4)));
    }
  };
  return {
    start(){if(started||closed)return;started=true;options.onStatus('connecting');void connect();},
    close(){closed=true;source?.close();source=null;stopHeartbeat();if(retry!==null){clearLater(retry);retry=null;}},
  };
}

/** HTTP rejection is final; only a failed fetch/timeout can retry an operation ID. */
export async function retryNetworkOperation<T>(request:()=>Promise<T>):Promise<T>{
  for(let attempt=0;;attempt++){
    try{return await request();}
    catch(error){
      const transport=error instanceof TypeError||error instanceof Error&&(error.name==='AbortError'||error.name==='TimeoutError');
      if(attempt===1||!transport)throw error;
    }
  }
}
