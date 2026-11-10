import type {LeafSlot,BroomContact} from './leafSimulation';
export function createSharedLeaves(epoch:number):LeafSlot[];
export function advanceLeaf(slot:LeafSlot,now:number):void;
export function collectLeaf(slot:LeafSlot,now:number,contact:BroomContact):boolean;
