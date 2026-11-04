export const FISH_FEED_SPOT:[number,number]=[18,5];
export const FISH_FEED_RANGE=2.5;
export const FISH_FEED_LIFETIME=12000;
export function koiTarget(index:number,seconds:number,feeding:boolean):[number,number]{
 const t=seconds*.13+index*1.31;
 return feeding?[22+Math.cos(t)*(.5+index%4*.24),6+Math.sin(t)*(.6+index%3*.3)]:[28+Math.cos(t)*(4+index%3*.7),4+Math.sin(t*.85)*(6+index%4*.5)];
}
