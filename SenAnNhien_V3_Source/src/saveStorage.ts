import type {StateStorage} from 'zustand/middleware';
import {performanceStats} from './runtime';
export function createBufferedStorage(getStorage:()=>Storage):StateStorage{
  let last='',pending:{name:string;value:string}|null=null,timer:ReturnType<typeof setTimeout>|null=null;
  const flush=()=>{if(!pending)return;try{getStorage().setItem(pending.name,pending.value);performanceStats.storageWrites++;last=pending.value;}catch{/* Keep gameplay usable when private mode or quota prevents saving. */}pending=null;if(timer){clearTimeout(timer);timer=null}};
  if(typeof window!=='undefined'&&window.addEventListener){window.addEventListener('pagehide',flush);window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()})}
  return {getItem:name=>{try{const value=getStorage().getItem(name);last=value||'';return value}catch{return null}},setItem:(name,value)=>{if(value===pending?.value)return;if(value===last){pending=null;if(timer)clearTimeout(timer);timer=null;return;}pending={name,value};if(!timer)timer=setTimeout(flush,500)},removeItem:name=>{pending=null;if(timer)clearTimeout(timer);timer=null;last='';try{getStorage().removeItem(name)}catch{}}};
}
