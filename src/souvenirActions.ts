import {useGame} from './gameStore';
import {souvenirStalls,stallApproach,atSouvenirStall,type SouvenirId} from './souvenirData';
import {shopProducts} from './shopData';
export function openSouvenirStall(id:SouvenirId){
 const stall=souvenirStalls.find(s=>s.id===id)!,s=useGame.getState();
 if(s.waterQuest){s.notify('Mời bạn đặt gánh nước xuống trước khi ghé quầy.');return;}
 s.set({souvenirFocus:id,shopFocus:shopProducts.find(product=>product.id===s.shopFocus)?.stall===id?s.shopFocus:null});
 s.stand();
 if(!atSouvenirStall(s.position,stall)){s.set({panel:null,destination:stallApproach(stall)});s.notify('Đang đến quầy lưu niệm. Đến gần rồi bấm E để xem nhé.');return;}
 s.set({panel:'souvenirs',souvenirFocus:id,destination:null});
}
