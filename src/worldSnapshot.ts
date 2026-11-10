import {gateState} from './gateState';
import type {GameState} from './gameStore';
export interface WorldSnapshot {bell:{at:number;readyAt:number}|null;drum:{at:number}|null;gateOpen:boolean;waterJars:{units:number;at:number}[];lanterns:{at:number;text:string}[];leaves:{epoch:number;revision:number;cleared:number[][]}}
export function createWorldSnapshotApplier(){let bell=-1,drum=-1,flights='';return (world:WorldSnapshot,serverTime:number)=>{
 const now=Date.now(),offset=now-serverTime,patch:Partial<GameState>={sharedWorld:{serverOffset:offset,leaves:world.leaves},waterJars:world.waterJars.map(j=>({...j,at:j.at+offset}))};
 gateState.setState({open:world.gateOpen});
 if(world.bell&&bell!==world.bell.at){bell=world.bell.at;patch.worldBellAt=bell+offset;patch.worldBellReadyAt=world.bell.readyAt+offset;}
 if(world.drum&&drum!==world.drum.at){drum=world.drum.at;patch.worldDrumAt=drum+offset;}
 const key=JSON.stringify(world.lanterns);if(key!==flights){flights=key;patch.flights=world.lanterns.map(l=>({text:l.text,at:l.at+offset,serverAt:l.at}));}
 return patch;
}}
