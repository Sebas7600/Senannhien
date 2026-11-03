// Shared by placement, navigation, physics and the preview. Units are metres.
export const COURTYARD_TREE={radius:2.05,wallHeight:.46,benchRadius:2.72,ground:.06} as const;
export const courtyardTrees=[{id:'west',x:-11,z:20},{id:'east',x:11,z:20}] as const;
export const restingBenches=courtyardTrees.flatMap((tree,index)=>[0,1,2].map(side=>{
  // North, south and the side facing the courtyard. Leave the lamp side empty.
  const angle=side===0?0:side===2?Math.PI:tree.x<0?Math.PI/2:-Math.PI/2;
  return {id:side===0?4+index:6+index*2+side-1,x:tree.x+Math.sin(angle)*COURTYARD_TREE.benchRadius,z:tree.z+Math.cos(angle)*COURTYARD_TREE.benchRadius,rotation:angle,zone:'courtyard' as const,finish:side===0?'jade' as const:side===1?'ivory' as const:'brick' as const,name:`Ghế đá ${index===0?'sân Tây':'sân Đông'} ${side+1}`,treeId:tree.id};
}));
