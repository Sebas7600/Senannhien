import {souvenirCatalog,type SouvenirId} from './souvenirData';
import type {Item} from './gameStore';
export type ShopProduct={id:string;stall:SouvenirId;name:string;material:string;description:string;detail:string;color:string;cost:number;inventoryItem?:Exclude<Item,'vegetable'>;quantity:number;model?:SouvenirId};
export const shopProducts:ShopProduct[]=[
 ...souvenirCatalog.map(item=>({id:item.id,stall:item.id,name:item.name,material:item.material,description:item.description,detail:item.detail,color:item.color,cost:item.cost,quantity:'quantity' in item?item.quantity:1,...('inventoryItem' in item?{inventoryItem:item.inventoryItem}:{}),model:item.id})),
 {id:'feed',stall:'fruit',name:'Túi cám cá koi',material:'Hạt cám nhỏ · túi giấy',description:'Cám hạt được chia thành từng phần nhỏ cho đàn koi. Một túi đủ 10 lần cho ăn.',detail:'Ghé cầu bên hồ và chọn Cho cá ăn. Mỗi lần dùng một phần cám; đàn cá vẫn tìm đến điểm rải cám như trước.',color:'#a38b59',cost:6,inventoryItem:'feed',quantity:10},
 {id:'seed',stall:'fruit',name:'Gói hạt giống',material:'Hạt rau · giấy nâu',description:'Hạt rau được gói trong giấy kraft, dùng cho những luống rau phía sau nhà ăn.',detail:'Một gói có 8 lượt gieo. Đến vườn rau, gieo hạt rồi tưới và chờ cây lớn. Rau thu hoạch không bán ở cửa hàng.',color:'#819358',cost:6,inventoryItem:'seed',quantity:8},
 {id:'flower',stall:'fruit',name:'Bó hoa dâng Phật',material:'Hoa tươi · lá xanh · dây buộc',description:'Hoa được bó gọn, dành để dâng vào các bình hoa trên bàn thờ.',detail:'Mỗi bó thêm 5 lượt dâng hoa vào Túi vải. Mỗi lần dâng dùng một lượt và tuân theo sức chứa của bình hoa.',color:'#c88d9c',cost:6,inventoryItem:'flower',quantity:5},
 {id:'candle',stall:'incensePack',name:'Bộ nến sáp',material:'Sáp ngà · bấc bông',description:'Năm cây nến nhỏ màu ngà, đặt gọn trong khay giấy để mang đến bàn dâng đèn.',detail:'Mỗi lần dâng đèn dùng một nến, vẫn áp dụng thời gian cháy và vị trí bàn thờ hiện có.',color:'#dfc997',cost:6,inventoryItem:'candle',quantity:5},
 {id:'lantern',stall:'incensePack',name:'Bộ hoa đăng',material:'Cánh sen giấy · nến nhỏ',description:'Năm hoa đăng xếp cánh sen, dùng để gửi lời nguyện bên hồ.',detail:'Mang đến đài hoa đăng, viết lời nguyện rồi thả. Mỗi lần thả dùng một hoa đăng.',color:'#ceae83',cost:12,inventoryItem:'lantern',quantity:5},
];
export const supplyProduct=(item:Item)=>shopProducts.find(product=>product.inventoryItem===item);
export const productsAtStall=(stall:SouvenirId)=>shopProducts.filter(product=>product.stall===stall);
