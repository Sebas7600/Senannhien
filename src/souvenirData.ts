export const souvenirCatalog=[
 {id:'mala',name:'Tràng hạt mộc',short:'TRÀNG HẠT',material:'Gỗ nâu · dây tơ · tua chỉ',cost:12,color:'#835438',description:'Chuỗi hạt gỗ tông nâu ấm, một hạt đầu chuỗi lớn và tua chỉ đỏ đất. Từng hạt được bày trên khay vải, cạnh các chuỗi treo dài.',detail:'Lấy cảm hứng từ chuỗi niệm Phật. Một món lưu niệm nhắc mình chậm lại, theo từng hơi thở.'},
 {id:'buddha',name:'Tượng Phật an nhiên',short:'TƯỢNG PHẬT',material:'Đồng cổ · đế sen',cost:24,color:'#b99a54',description:'Tượng ngồi trên đài sen hai lớp, dáng áo rủ, búi tóc và gương mặt tĩnh tại. Bày trên các bục gỗ cao thấp, với phiên bản màu đồng và ngà.',detail:'Tượng thu nhỏ dành cho bộ sưu tập trong game, đặt trang trọng trên bục riêng.'},
 {id:'pendant',name:'Mặt Phật ngọc',short:'MẶT PHẬT',material:'Ngọc xanh · viền đồng',cost:16,color:'#709886',description:'Mặt Phật nhỏ trong khung bầu dục xanh ngọc, móc treo màu đồng và dây đeo nâu. Mỗi mặt được đặt trên nền nhung sẫm để nổi rõ hình dáng.',detail:'Các mặt ngọc có biến thể xanh ngọc, ngà và hổ phách, cùng một đường viền mảnh.'},
 {id:'bracelet',name:'Vòng hạt bình an',short:'VÒNG HẠT',material:'Hạt gỗ · ngọc · điểm nhấn đồng',cost:8,color:'#9b6150',description:'Vòng hạt tròn xếp trên khay tre nông. Hạt nâu gỗ, xanh ngọc và kem ngà xen một hạt điểm màu đồng.',detail:'Các vòng có kích thước và sắc độ khác nhau, trưng bày thành từng bộ nhỏ gọn.'},
 {id:'sutra',name:'Sách kinh bỏ túi',short:'SÁCH KINH',material:'Bìa vải · giấy ngà · chỉ đóng gáy',cost:6,color:'#536b71',description:'Bìa chàm, đỏ trầm và kem, họa tiết sen ép vàng. Gáy sách có đường chỉ đóng, ruột giấy ngà và thẻ đánh dấu bằng sợi tơ.',detail:'Bộ sách được bày nằm và dựng trên kệ nghiêng. Đây là vật phẩm lưu niệm; phần đọc kinh nằm tại Tàng kinh các.'},
 {id:'necklace',name:'Dây chuyền liên hoa',short:'DÂY CHUYỀN',material:'Dây tơ · mặt sen · đồng ấm',cost:14,color:'#b99a54',description:'Dây chuyền nằm trên khay vải, mặt sen hướng lên và dây tơ nâu uốn mềm. Các mẫu khác được treo trên bảng gỗ phía sau.',detail:'Thiết kế nhẹ và thanh, phối cùng vòng hạt và các mặt Phật của quầy bên cạnh.'},
 {id:'fruit',name:'Giỏ trái cây theo mùa',short:'HOA QUẢ',material:'Cam · táo · chuối · thanh long',cost:4,color:'#c98842',quantity:1,inventoryItem:'fruit',description:'Cam vàng, táo đỏ và xanh, nải chuối cùng thanh long được chia vào giỏ tre, khay gỗ và sọt xếp tầng. Lá xanh, cuống quả và giấy gói làm rõ từng loại.',detail:'Mỗi giỏ mua thêm được lưu trong Túi vải. Dùng một phần trái cây để hồi 8 năng lượng.'},
 {id:'incensePack',name:'Bó nhang tâm hương',short:'NHANG TÂM HƯƠNG',material:'Thân nhang nâu · chân đỏ · áo giấy',cost:6,color:'#a55e43',quantity:5,inventoryItem:'incense',description:'Bó nhang chân đỏ buộc giấy vàng, ống đựng nhang bằng gốm nâu, hộp trầm và nhang vòng được bày trên kệ gỗ. Các bó nhỏ có đai giấy đỏ và dấu sen.',detail:'Mỗi bó thêm 5 nén vào Túi vải, dùng với hoạt động Dâng hương hiện có tại các bàn thờ trong chùa.'},
] as const;
export type SouvenirId=typeof souvenirCatalog[number]['id'];
export const souvenirCollectibles=souvenirCatalog.filter(item=>!('inventoryItem' in item));
export type SouvenirStall={id:SouvenirId;x:number;z:number;rotation:number;cloth:string;number:string};
// Two plots immediately inside the tam quan. Leave the centre avenue, lake and stupa untouched.
export const souvenirStalls:SouvenirStall[]=souvenirCatalog.map((item,i)=>{
 const east=i<3||item.id==='incensePack';
 return {id:item.id,x:east?10.6:-10.6,z:i<6?43.5+i%3*6.8:36.7,rotation:east?-Math.PI/2:Math.PI/2,cloth:['#344f59','#86604c','#66745c','#8b5146','#3e5865','#b2986b','#586f49','#9a6741'][i],number:`0${i+1}`};
});
export const souvenirPlots=[souvenirStalls.filter(stall=>stall.x>0),souvenirStalls.filter(stall=>stall.x<0)];
export const SOUVENIR_ATLAS={columns:2,rows:5,bookUpright:8,bookFlat:9} as const;
export const STALL={width:5.5,depth:3.6,roofHeight:3.7,counterZ:1.24,counterHeight:.98};
export const STALL_PLAQUE={width:2.50,height:.56,y:3.18,z:2.18} as const;
export const COUNTER_LAYOUT={surfaceY:1.060,traySurfaceY:1.059,productX:[-.47,.67,1.81],fruitX:[-.55,.35,1.25,2.08],terminal:{x:-1.70,y:1.061,z:1.23,scale:.92}} as const;
export function stallPoint(stall:SouvenirStall,x:number,z:number):[number,number]{const c=Math.cos(stall.rotation),s=Math.sin(stall.rotation);return [stall.x+c*x+s*z,stall.z-s*x+c*z];}
export const stallApproach=(stall:SouvenirStall)=>stallPoint(stall,0,2.9);
export function nearestSouvenirStall(position:readonly number[]){return souvenirStalls.reduce((a,b)=>{const pa=stallApproach(a),pb=stallApproach(b);return Math.hypot(position[0]-pa[0],position[1]-pa[1])<Math.hypot(position[0]-pb[0],position[1]-pb[1])?a:b;});}
export function atSouvenirStall(position:readonly number[],stall:SouvenirStall,range=3.1){const p=stallApproach(stall);return Math.hypot(position[0]-p[0],position[1]-p[1])<range;}
export const souvenirSolids=souvenirStalls.map(s=>({id:`souvenir-${s.id}`,x:s.x,z:s.z,w:STALL.depth,d:STALL.width,height:2.7}));
// Camera sees only the solid surfaces, leaving the space above the counter open.
export const souvenirCameraParts:{position:[number,number,number];size:[number,number,number];rotation:[number,number,number]}[]=[
 {position:[0,1.42,-1.56],size:[5,2.37,.09],rotation:[0,0,0]},
 {position:[0,.55,1.17],size:[4.94,.90,.70],rotation:[0,0,0]},
 ...[-1,1].map(side=>({position:[side*2.5,1.515,0] as [number,number,number],size:[.09,2.75,3.2] as [number,number,number],rotation:[0,0,0] as [number,number,number]})),
 ...[-1,1].map(side=>({position:[0,3.31,side*.94] as [number,number,number],size:[5.95,.07,2.22] as [number,number,number],rotation:[side*.34,0,0] as [number,number,number]})),
];
