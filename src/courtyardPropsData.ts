/** Measured from the supplied GLBs. Asset-local units; uniform scales preserve the artwork. */
export const GATE={x:0,y:.06,z:51,scale:1.4,hingeX:1.275,hingeY:.13,leafWidth:1.255,leafHeight:3.04,openAngle:89*Math.PI/180,interactionRange:6,highFile:'gate-bai-dinh-v1.glb',lowFile:'gate-bai-dinh-v1-low.glb'};
export const GATE_ENTRY:[number,number]=[GATE.x,GATE.z+4.5];
export const COURTYARD_SPAWN_Z=GATE.z-7;
export const gateAvenueTrees=[-1,1].flatMap(side=>[GATE.z-14,GATE.z-8,GATE.z-2.9].map((z,i)=>({
  x:side*8.2,z,scale:[.79,.85,.74][i],
})));
// Lamp pairs mark thresholds and bridge approaches. Open paths between them are moonlit.
export const pathLamps=[
  ...[-1,1].flatMap(side=>[
    {x:GATE.x+side*4.3,z:GATE.z+2.75},
    {x:GATE.x+side*4.3,z:GATE.z-2.9},
    {x:side*8.55,z:-10.15},
    {x:side*12.5,z:-7.45},
    {x:side*4.55,z:24},
  ]),
  {x:21.0,z:6.75},{x:21.0,z:11.25},
  {x:14.1,z:36.7},{x:14.1,z:41.3},
];
export const BELL_PROP={x:-19,y:.4,z:-13,scale:.47,pivotY:5.45,frameTop:7.275};
export const DRUM_PROP={x:19,y:.4,z:-13,scale:1.12,height:2.438};
export const gateMasonry=[
  {x:-4.37,y:.92,z:0,w:1.48,h:1.84,d:.75},
  {x:4.37,y:.92,z:0,w:1.48,h:1.84,d:.75},
  {x:-1.8,y:2.1,z:0,w:1.05,h:4.2,d:1.95},
  {x:1.8,y:2.1,z:0,w:1.05,h:4.2,d:1.95},
  {x:-3.75,y:1.4,z:0,w:.4,h:2.8,d:1.70},
  {x:3.75,y:1.4,z:0,w:.4,h:2.8,d:1.70},
  {x:0,y:3.75,z:0,w:2.55,h:.9,d:1.63},
  {x:-2.985,y:2.52,z:0,w:1.25,h:.54,d:1.63},
  {x:2.985,y:2.52,z:0,w:1.25,h:.54,d:1.63},
];
export function gateLeafPose(side:-1|1,open:number){const angle=-side*GATE.openAngle*open,offset=-side*GATE.leafWidth/2;return {angle,x:GATE.x+(side*GATE.hingeX+Math.cos(angle)*offset)*GATE.scale,y:GATE.y+(GATE.hingeY+GATE.leafHeight/2)*GATE.scale,z:GATE.z-Math.sin(angle)*offset*GATE.scale};}
export function nearGate(p:readonly number[]){return Math.hypot(p[0]-GATE.x,p[1]-GATE.z)<GATE.interactionRange;}
/** Leave enough room for both swept doors, not just their final positions. */
export function inGateSweep(p:readonly number[]){return Math.abs(p[0]-GATE.x)<2.6&&p[1]>GATE.z-2.5&&p[1]<GATE.z+.65;}
