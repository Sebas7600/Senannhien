export const BODHI={x:-10,z:0,ground:.06,radius:3.22,wallHeight:.56,altarZ:3.28,altarHeight:.84,offeringPoint:[-10,4.6] as [number,number],incensePosition:[-10,1.12,3.28] as [number,number,number]} as const;
export function nearBodhiAltar(position:readonly[number,number]){return Math.hypot(position[0]-BODHI.offeringPoint[0],position[1]-BODHI.offeringPoint[1])<3.3;}
