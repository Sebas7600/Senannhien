import {souvenirStalls,stallPoint,type SouvenirId} from './souvenirData';
const profiles:Record<SouvenirId,{name:string;gender:'male'|'female';robe:string;skin:string;apron:string;greeting:string;offset:number}>={
 mala:{name:'Cô Liên',gender:'female',robe:'#75836a',skin:'#cda181',apron:'#d7d4b7',greeting:'Mời bạn xem tràng hạt. Cứ thong thả chọn một chuỗi vừa ý nhé.',offset:-.58},
 buddha:{name:'Chú Phúc',gender:'male',robe:'#94714e',skin:'#bd9271',apron:'#cdb991',greeting:'Những pho tượng nhỏ được bày riêng trên đế sen. Mời bạn ngắm kỹ từng món.',offset:.62},
 pendant:{name:'Cô Ngọc',gender:'female',robe:'#6d8990',skin:'#d1a585',apron:'#d2d5c5',greeting:'Mặt Phật xanh ngọc và màu ngà ở đây. Bạn có thể xoay mô hình để xem gần hơn.',offset:-.60},
 bracelet:{name:'Cô Mai',gender:'female',robe:'#946c63',skin:'#c89a7a',apron:'#e0cfb0',greeting:'Vòng hạt gỗ, ngọc và ngà đã được xếp thành từng khay. Mời bạn chọn nhé.',offset:.60},
 sutra:{name:'Chú Trí',gender:'male',robe:'#677b83',skin:'#b88b69',apron:'#cdc9b4',greeting:'Một cuốn sách nhỏ, một lời nhắc sống chậm. Bạn có thể ghé Tàng kinh các để đọc kinh.',offset:.62},
 necklace:{name:'Cô Hạnh',gender:'female',robe:'#968367',skin:'#cda081',apron:'#dcd0b2',greeting:'Dây chuyền liên hoa và dây tơ được bày trên giá. Mời bạn xem từng mẫu.',offset:-.60},
 fruit:{name:'Cô Thu',gender:'female',robe:'#73875c',skin:'#c49774',apron:'#e3d0a8',greeting:'Có trái cây để dâng lễ hoặc dùng, hoa tươi, cám cá và hạt giống đây. Bạn cần món nào cứ xem nhé.',offset:0},
 incensePack:{name:'Chú Bình',gender:'male',robe:'#a47b52',skin:'#c09372',apron:'#dbc6a0',greeting:'Nhang, nến sáp và hoa đăng đã chuẩn bị gọn gàng. Mỗi bộ có 5 phần, dùng dần trong Túi vải.',offset:.63},
};
export const merchants=souvenirStalls.map((stall,index)=>{
 const profile=profiles[stall.id],position=stallPoint(stall,profile.offset,.045);
 return {...profile,id:`merchant-${stall.id}`,stallId:stall.id,x:position[0],z:position[1],y:.142,heading:stall.rotation,phase:index*1.731};
});
export type Merchant=typeof merchants[number];
export const merchantFor=(id:SouvenirId)=>merchants.find(merchant=>merchant.stallId===id)!;
export type MerchantHeadPose={yaw:number;pitch:number};
export function sampleMerchantHead(merchant:Merchant,position:readonly number[],seconds:number,reduced:boolean,out:MerchantHeadPose){
 const dx=position[0]-merchant.x,dz=position[1]-merchant.z,distanceSquared=dx*dx+dz*dz;
 if(reduced||distanceSquared>18*18){out.yaw=0;out.pitch=0;return out;}
 const localX=dx*Math.cos(merchant.heading)-dz*Math.sin(merchant.heading),localZ=dx*Math.sin(merchant.heading)+dz*Math.cos(merchant.heading);
 const front=localZ>0;
 out.yaw=front?Math.max(-.42,Math.min(.42,Math.atan2(localX,localZ))):0;
 out.pitch=front?.025+Math.sin(seconds*.92+merchant.phase)*.022:0;
 return out;
}
