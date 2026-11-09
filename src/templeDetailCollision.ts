/** Temple-local solid details, measured from the imported geometry (root z=-27,y=.08). */
export const templeVaseSolids=[
 ...[-6.575,-2.825,-1.875,1.875,2.825,6.575].map(x=>({id:`altar-floor-vase-${x}`,x,y:2.689,z:-3.1,radius:.334,height:.979})),
 ...[-2.9,2.9].map(x=>({id:`decorative-front-vase-${x}`,x,y:2.495,z:-.35,radius:.195,height:.56})),
 ...[-5.7,-3.7,-1,1,3.7,5.7].map(x=>({id:`altar-table-vase-${x}`,x,y:3.045,z:-2.835,radius:.15,height:.41})),
 ...[-.76,.76].map(x=>({id:`low-table-vase-${x}`,x,y:2.94,z:-1.425,radius:.13,height:.26})),
];
// Boxes extend down to the solid stairs; the cap is .45m above the tread.
// A low thin tilted box allowed the character controller to step across the rail.
export const middleStairRails=Array.from({length:24},(_,i)=>{
 const z=16.303-(i+.5)*(6.806/24),top=(i+1)*2.175/24+.45;
 return [-1,1].map(side=>({x:side*1.715,y:top/2,z,halfWidth:.15,halfHeight:top/2,halfDepth:6.806/48+.002}));
}).flat();
