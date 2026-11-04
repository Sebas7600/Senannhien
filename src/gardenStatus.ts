import type {PlotState} from './gameStore';
export function gardenStatus(plot:PlotState|undefined,now=Date.now()){
 if(!plot||plot.harvested)return {action:'plant' as const,label:plot?.harvested?'Đã thu hoạch · Gieo vụ mới':'Đất trống · Gieo hạt',growth:0};
 if(plot.wateredAt===null)return {action:'water' as const,label:'Cần tưới nước',growth:.12};
 const remaining=Math.max(0,Math.ceil((60000-now+plot.wateredAt)/1000));
 return {action:remaining?null:'harvest' as const,label:remaining?'Đang lớn · '+remaining+'s':'Rau đã lớn · Thu hoạch',growth:Math.min(1,.12+.88*(now-plot.wateredAt)/60000)};
}
