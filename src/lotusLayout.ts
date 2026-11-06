// One height profile drives the visible deck, collision and walking/teleport heights.
export const LOTUS_POND={x:28,z:39,rx:12,rz:9,waterY:.085-.56,bridgeHalfLength:13.5,bridgeHalfWidth:1.5,bridgeRise:.72,bridgeEndY:.06,segments:54} as const;
const profile=(x:number)=>{const t=Math.min(1,Math.abs(x-LOTUS_POND.x)/LOTUS_POND.bridgeHalfLength);return LOTUS_POND.bridgeEndY+LOTUS_POND.bridgeRise*(1-t*t);};
export const lotusBridgeSegments=Array.from({length:LOTUS_POND.segments},(_,i)=>{
  const a=LOTUS_POND.x-LOTUS_POND.bridgeHalfLength+i*.5,b=a+.5,ya=profile(a),yb=profile(b);
  const angle=Math.atan2(yb-ya,b-a),x=(a+b)/2,y=(ya+yb)/2;
  return {a,b,ya,yb,x,y,angle,length:Math.hypot(b-a,yb-ya),deckX:x+Math.sin(angle)*.07,deckY:y-Math.cos(angle)*.07};
});
export function onLotusBridge(x:number,z:number){return Math.abs(x-LOTUS_POND.x)<=LOTUS_POND.bridgeHalfLength&&Math.abs(z-LOTUS_POND.z)<=LOTUS_POND.bridgeHalfWidth;}
export function lotusBridgeHeight(x:number){
  const index=Math.max(0,Math.min(lotusBridgeSegments.length-1,Math.floor((x-LOTUS_POND.x+LOTUS_POND.bridgeHalfLength)/.5))),s=lotusBridgeSegments[index];
  const t=Math.max(0,Math.min(1,(x-s.a)/(s.b-s.a)));return s.ya+(s.yb-s.ya)*t;
}
export function lotusWaterBlocked(x:number,z:number,margin=.3){
  return ((x-LOTUS_POND.x)/(LOTUS_POND.rx+margin))**2+((z-LOTUS_POND.z)/(LOTUS_POND.rz+margin))**2<1&&Math.abs(z-LOTUS_POND.z)>LOTUS_POND.bridgeHalfWidth-margin;
}
