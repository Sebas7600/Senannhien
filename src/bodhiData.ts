import {MAYA_LEVEL} from './mayaLevel';
export const BODHI={x:-10,z:MAYA_LEVEL.bodhiZ,ground:.06,radius:3.22,wallHeight:.56,altarZ:3.28,altarHeight:.84,offeringPoint:[-10,4.6+MAYA_LEVEL.bodhiZ] as [number,number],incensePosition:[-10,1.12,3.28+MAYA_LEVEL.bodhiZ] as [number,number,number]} as const;
export function nearBodhiAltar(position:readonly[number,number]){return Math.hypot(position[0]-BODHI.offeringPoint[0],position[1]-BODHI.offeringPoint[1])<3.3;}
