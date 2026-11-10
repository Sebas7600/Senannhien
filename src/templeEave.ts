import * as T from 'three';
/** One continuous hip-roof ring: shared seams at all four corners. */
export const templeEave={innerX:12.4,innerZ:8.5,depth:2.4,thickness:.14};
export function eaveHeight(t:number){return 7.05-.96*t+.20*t**5;}
export function porticoSupportTop(x:number,z:number){const e=templeEave,t=Math.max(0,(Math.abs(x)-e.innerX)/e.depth,(Math.abs(z)-e.innerZ)/e.depth);return eaveHeight(t)-e.thickness+.015;}
export function eavePoint(side:number,u:number,t:number,underside=false):[number,number,number]{const e=templeEave,x=e.innerX+t*e.depth,z=e.innerZ+t*e.depth,y=eaveHeight(t)-(underside?e.thickness:0);return side===0?[u*x,y,z]:side===1?[x,y,-u*z]:side===2?[-u*x,y,-z]:[-x,y,u*z];}
export function eaveQuad(a:number[],b:number[],c:number[],d:number[]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));g.computeVertexNormals();return g;}
export function createEaveShell(){const pieces:T.BufferGeometry[]=[];for(let side=0;side<4;side++)for(let row=0;row<16;row++){const a=row/16,b=(row+1)/16;
 pieces.push(eaveQuad(eavePoint(side,-1,a,true),eavePoint(side,1,a,true),eavePoint(side,1,b,true),eavePoint(side,-1,b,true)));
 if(row===0)pieces.push(eaveQuad(eavePoint(side,-1,0),eavePoint(side,1,0),eavePoint(side,1,0,true),eavePoint(side,-1,0,true)));
 if(row===15)pieces.push(eaveQuad(eavePoint(side,-1,1,true),eavePoint(side,1,1,true),eavePoint(side,1,1),eavePoint(side,-1,1)));
 }return pieces;}
