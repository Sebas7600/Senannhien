export const NPC_CHIBI_SCALE=1.3;
export const NPC_SERVICE_LEAD=.4;
export function npcAppearance(n:{id:string;robe:string}){
  return {npc:true,robe:n.robe,gender:n.id==='cook'||n.id==='chef'?'female' as const:'male' as const,apron:n.id==='chef'};
}
