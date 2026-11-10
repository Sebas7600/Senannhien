/** The main urn has no station tag; never treat another tagged altar as main. */
export function incenseAtStation(times:number[],slots:Record<string,string>,station:string|null=null){return times.filter(at=>(slots[at]??null)===station);}
/** Stable per-room ambient sticks; restart each staggered burn cycle so old rooms never look empty. */
export function initialIncenseTimes(epoch:number,station:string,count=15,now=epoch,burnMs=170000){let salt=0;for(const c of station)salt=(Math.imul(salt,31)+c.charCodeAt(0))>>>0;return Array.from({length:count},(_,i)=>{const v=Math.sin((epoch%1000000)*.001+salt*.001+i*127.1)*43758.5453,random=v-Math.floor(v);const first=epoch-Math.floor(10000+random*115000)-i;return first+Math.max(0,Math.floor((now-first)/burnMs))*burnMs;});}
