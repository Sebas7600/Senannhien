/** Aligned with Zoe's viewing axis in the supplied reference, between the two pond banks. */
export const QUAN_AM={x:43.5,z:25.25,ground:.06,rotation:-Math.PI/2,height:4.8,pedestalHeight:.56,incenseId:'quan-am',tableX:40.8,tableZ:25.25,ashY:1.36,spot:[39.35,25.25] as [number,number],approach:[38.9,25.25] as [number,number],range:2.0};
export function nearQuanAm(p:readonly number[]){return Math.hypot(p[0]-QUAN_AM.spot[0],p[1]-QUAN_AM.spot[1])<=QUAN_AM.range;}
export const quanAmObstacles=[{x:QUAN_AM.x,z:QUAN_AM.z,w:2.8,d:3.4,height:.62},{x:QUAN_AM.x,z:QUAN_AM.z,w:1.7,d:1.7,height:5.42},{x:QUAN_AM.tableX,z:QUAN_AM.tableZ,w:.9,d:2.3,height:1.15},...[-1,1].map(side=>({x:QUAN_AM.x-1.1,z:QUAN_AM.z+side*2.05,w:.75,d:.75,height:1.7}))];
