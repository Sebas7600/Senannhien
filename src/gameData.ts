import {quanAmObstacles} from './quanAmData';
import {WATER_WELL,WATER_JARS} from './waterTaskData';
import {templeSurfaceHeight} from './templeFixtures';
import {POND_BRIDGES,pondSurface,pondBlocked} from './pondLayout';
import {removedTemplePost} from './templeLayout';
import templeObjectShapes from './templeObjectColliders.json';
import {stoneBenches,benchSeatWorld} from './stoneBenchData';
import {BODHI} from './bodhiData';
import {CUSHION} from './cushionData';
import {courtyardTrees,COURTYARD_TREE} from './courtyardData';
import {GATE,gateMasonry} from './courtyardPropsData';
import {gateBlocked} from './gateState';
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export const CHARACTER_RADIUS=.28;
export const CHARACTER_HALF_SEGMENT=.54;
export const CHARACTER_OFFSET=CHARACTER_RADIUS+CHARACTER_HALF_SEGMENT;
export const WISH_STATION:Vec2=[16.7,37];
export const WISH_APPROACH:Vec2=[16.4,38.5];
export const incenseSpot:Vec2=[0,-8.7];
export const incenseApproach:Vec2=[0,-7.1];
export const INCENSE_CLEARANCE=1.1;
export function outsideIncenseBurner(x:number,z:number):Vec2{
  const dx=x-incenseSpot[0],dz=z-incenseSpot[1],length=Math.hypot(dx,dz);
  if(length>=INCENSE_CLEARANCE)return [x,z];
  if(length<.001)return [...incenseApproach];
  return [incenseSpot[0]+dx/length*INCENSE_CLEARANCE,incenseSpot[1]+dz/length*INCENSE_CLEARANCE];
}
export const templeOffering={flower:{spot:[-3.7,-29.5] as Vec2,approach:[-3.7,-28] as Vec2,label:'Dâng hoa',lifetime:480000},candle:{spot:[4.7,-29.5] as Vec2,approach:[4.7,-28] as Vec2,label:'Dâng đèn',lifetime:480000}};
export const OFFERING_RANGE=1.8, OFFERING_DURATION=3000, OFFERING_CAPACITY=8;
export const INCENSE_RANGE=2;
export const INCENSE_DURATION=3000;
export const INCENSE_BURN_MS=170000;
export const INCENSE_STUB_MS=480000,INCENSE_MAX_STICKS=72;

export const WORLD = { minX: -60, maxX: 60, minZ: -66, maxZ: 62 };
export const places = [
  { id:'gate', name:'Cổng tam quan', subtitle:'Bắt đầu một hành trình mới', x:GATE.x, z:GATE.z, icon:'gate' },
  { id:'courtyard', name:'Sân bồ đề', subtitle:'Quét lá · Chắp tay · Đi dạo', x:0, z:6, icon:'tree' },
  { id:'temple', name:'Đại hùng bảo điện', subtitle:'Lễ Phật · Dâng hương · 40 bồ đoàn', x:0, z:-24, icon:'temple' },
  { id:'hall', name:'Thiền đường Trúc Lâm', subtitle:'Ngồi thiền · Tụng kinh · Gõ mõ', x:-33, z:-17, icon:'meditate' },
  { id:'bell', name:'Lầu chuông', subtitle:'Thỉnh chuông · Lắng nghe', x:-19, z:-9, icon:'bell' },
  { id:'pond', name:'Hồ cá koi', subtitle:'Cho cá ăn · Ghế đá bên hồ', x:POND_BRIDGES[0].start+2, z:POND_BRIDGES[0].z, icon:'fish' },
  { id:'dining', name:'Nhà ăn Hương Thiền', subtitle:'Mì · Cơm · Hủ tiếu · Bánh mì chay', x:34, z:-26, icon:'meal' },
  { id:'library', name:'Tàng kinh các', subtitle:'Đọc kinh · Trò chuyện cùng thầy', x:-34, z:-43, icon:'book' },
  { id:'garden', name:'Vườn rau từ tâm', subtitle:'Gieo hạt · Tưới cây · Thu hoạch', x:36, z:-50, icon:'plant' },
  { id:'terrace', name:'Trà đình Vọng Sơn', subtitle:'Uống trà · Ngắm núi · Ngồi nghỉ', x:0, z:-56, icon:'tea' },
  { id:'lotus', name:'Hồ sen nguyện ước', subtitle:'Thả hoa đăng · Viết lời nguyện', x:WISH_APPROACH[0], z:WISH_APPROACH[1], icon:'lotus' },
  { id:'stupa', name:'Bảo tháp An Lạc', subtitle:'Khám phá · Chiêm ngưỡng', x:-35, z:42, icon:'stupa' },
  { id:'bamboo', name:'Đường trúc tĩnh tâm', subtitle:'Thiền hành giữa rừng trúc', x:-38, z:12, icon:'bamboo' },
] as const;
export type PlaceId = typeof places[number]['id'];
export function place(id: PlaceId) { return places.find(p=>p.id===id)!; }
export function distance(a:Vec2,b:Vec2) { return Math.hypot(a[0]-b[0],a[1]-b[1]); }
export function zoneAt(p:Vec2) { return [...places].sort((a,b)=>distance(p,[a.x,a.z])-distance(p,[b.x,b.z]))[0]; }
export interface Seat {id:string; label:string; zone:PlaceId; position:Vec3; rotation:number; kind:'cushion'|'bench'|'dining'|'tea'|'reading'; table?:Vec3; floorSeat?:boolean}
export const readingTables:Vec3[]=Array.from({length:20},(_,i)=>[-40+(i%5)*3,.76,-46.8+Math.floor(i/5)*3]);
export const teaTables:Vec3[]=Array.from({length:10},(_,i)=>[(i%5-2)*3.6,.98,-59.3+Math.floor(i/5)*5.5]);
export const diningTables:Vec3[]=[[27.5,.64,-28.4],[39.5,.64,-28.4],[27.5,.64,-21.4],[39.5,.64,-21.4],[34,.64,-25]];
export const KITCHEN_PICKUP:Vec2=[43.3,-33.1];
export const PICKUP_PLATE:Vec3=[42.15,1.49,-33.1];
export const RECEPTION:Vec2=[43,-19];
export const RECEPTION_HEADING=0;
export function usesFloorSeat(seat:Seat|undefined){return !!seat&&(seat.floorSeat===true||seat.kind==='cushion'||seat.kind==='reading');}
export const pavilionLayouts=[{x:-33,z:-17,w:20,d:16,height:.4},{x:-34,z:-43,w:17,d:14,height:.35},{x:34,z:-27,w:23,d:18,height:.16},{x:0,z:-56,w:20,d:13,height:.3}];
export const floorSurfaces=[
  ...pavilionLayouts,
  {x:-19,z:-13,w:5,d:5,height:.4},{x:19,z:-13,w:5,d:5,height:.4},
];
export function surfaceHeight(x:number,z:number){const lakeFloor=pondSurface(x,z);if(lakeFloor!==null)return lakeFloor;const temple=templeSurfaceHeight(x,z+27);if(temple>0)return temple+.08;let height=.06;for(const s of floorSurfaces)if(Math.abs(x-s.x)<=s.w/2&&Math.abs(z-s.z)<=s.d/2)height=Math.max(height,s.height);return height;}
// A capsule meets a step before its centre crosses the floor edge.
export function stepAssistHeight(x:number,z:number,dx:number,dz:number,bodyY:number){
  const length=Math.hypot(dx,dz),lead=length>.0001?.34/length:0;
  const platform=(x:number,z:number)=>floorSurfaces.reduce((h,s)=>Math.abs(x-s.x)<=s.w/2&&Math.abs(z-s.z)<=s.d/2?Math.max(h,s.height):h,.06);
  const top=Math.max(platform(x+dx,z+dz),platform(x+dx+dx*lead,z+dz+dz*lead));
  const desired=top+CHARACTER_OFFSET+.02,climb=desired-bodyY;
  return climb>.08&&climb<.8?desired+.015:bodyY;
}
export function seatExit(seat:Seat):Vec2 { const offset=seat.table?-.85:1.1;return [seat.position[0]+Math.sin(seat.rotation)*offset,seat.position[2]+Math.cos(seat.rotation)*offset]; }
export const seats:Seat[] = [
  // Two mirrored blocks: clear space between cushions, altar access and an open central aisle.
  ...Array.from({length:40},(_,i)=>({id:`temple-${i}`,label:`Bồ đoàn ${i+1} · Chánh điện`,zone:'temple' as const,position:[[-10.1,-8.2,-6.3,-4.4,4.4,6.3,8.2,10.1][i%8],2.28+CUSHION.seatLift,-27.9+Math.floor(i/8)*1.8] as Vec3,rotation:Math.PI,kind:'cushion' as const})),
  ...Array.from({length:20},(_,i)=>({id:`hall-${i}`,label:`Bồ đoàn ${i+1} · Thiền đường`,zone:'hall' as const,position:[-33+(i%5-2)*2.4,.4+CUSHION.seatLift,-19+Math.floor(i/5)*2.4] as Vec3,rotation:Math.PI,kind:'cushion' as const})),
  ...Array.from({length:8},(_,i)=>({id:`bamboo-${i}`,label:`Tọa cụ ${i+1} · Rừng trúc`,zone:'bamboo' as const,position:[-38+Math.cos(i/8*Math.PI*2)*4,.06+CUSHION.seatLift,12+Math.sin(i/8*Math.PI*2)*4] as Vec3,rotation:-i/8*Math.PI*2-Math.PI/2,kind:'cushion' as const})),
  ...diningTables.flatMap((table,i)=>Array.from({length:4},(_,side)=>({id:`dining-${i*4+side}`,label:`Bàn ${i+1}${i===4?' trung tâm':''} · Đệm ${side+1}`,zone:'dining' as const,position:[table[0]+(side%2===0?-1.85:1.85),.16,table[2]+(side<2?-.8:.8)] as Vec3,rotation:side%2===0?Math.PI/2:-Math.PI/2,kind:'dining' as const,floorSeat:true,table}))),
  ...readingTables.map((table,i)=>({id:`reading-${i}`,label:`Bàn đọc ${i+1}`,zone:'library' as const,position:[table[0],.35,table[2]+1] as Vec3,rotation:Math.PI,kind:'reading' as const,table})),
  ...teaTables.flatMap((table,i)=>[-1,1].map((side,j)=>({id:`tea-${i*2+j}`,label:`Bàn trà ${i+1} · Ghế ${j+1}`,zone:'terrace' as const,position:[table[0],.83,table[2]+side*1.35] as Vec3,rotation:side<0?0:Math.PI,kind:'tea' as const,table}))),
  ...stoneBenches.flatMap(b=>[0,1].map(side=>({id:`bench-${b.id}-${side}`,label:`${b.name} · Chỗ ${side+1}`,zone:b.zone,position:benchSeatWorld(b,side),rotation:b.rotation,kind:'bench' as const}))),
];
export const dishes = [
  {id:'noodles',name:'Mì chay',description:'Mì vàng, nấm hương, đậu hũ và cải xanh trong nước dùng thanh.',color:'#d5b55c',energy:35,icon:'🍜'},
  {id:'rice',name:'Cơm chay',description:'Cơm nóng cùng rau theo mùa, đậu hũ kho và nấm xào.',color:'#f0e3c2',energy:45,icon:'🍚'},
  {id:'soup',name:'Hủ tiếu chay',description:'Sợi hủ tiếu mềm, củ cải, nấm và rau thơm trong nước dùng ngọt.',color:'#e8dcc1',energy:40,icon:'🥣'},
  {id:'bread',name:'Bánh mì chay',description:'Bánh mì giòn kẹp đậu hũ, nấm, dưa leo và rau ngò.',color:'#c79751',energy:30,icon:'🥖'},
] as const;
export type DishId=typeof dishes[number]['id'];
export const scriptures = [
  {id:'breath',title:'Trở về hơi thở',source:'Bài thực tập trong game',paragraphs:['Ngồi ngay ngắn, buông lỏng hai vai. Đặt đôi tay thật nhẹ trên đầu gối.','Hít vào, biết mình đang hít vào. Thở ra, biết mình đang thở ra.','Một hơi thở, một lần trở về. Không cần đuổi theo suy nghĩ; chỉ nhẹ nhàng nhận ra rồi quay lại.','Mang sự chậm rãi này vào bước chân kế tiếp, vào bữa ăn, vào cách ta chăm sóc một người.']},
  {id:'kindness',title:'Một việc lành nhỏ',source:'Lời nhắc ở sân chùa',paragraphs:['Nhặt một chiếc lá, tưới một luống rau, nhường một chỗ ngồi.','Những điều rất nhỏ có thể khiến một không gian trở nên dễ chịu hơn.','Hôm nay, chọn một việc vừa sức và làm với sự chú tâm. Không cần ai nhìn thấy, không cần vội nhận lại.']},
  {id:'meal',title:'Ăn trong chánh niệm',source:'Thực tập tại nhà ăn',paragraphs:['Trước bữa ăn, dành một khoảnh khắc nhìn vào phần ăn trước mặt.','Nhớ đến hạt giống, đất, nước, nắng và những người đã góp phần làm nên bữa ăn.','Ăn chậm, nhai kỹ, cảm nhận hương vị. Lấy vừa đủ và trân trọng thức ăn.']},
  {id:'walking',title:'Từng bước an nhiên',source:'Thực tập thiền hành',paragraphs:['Đi chậm hơn một chút so với thường ngày. Cảm nhận bàn chân chạm đất.','Có thể bước một bước khi hít vào, một bước khi thở ra. Không bắt buộc nhịp thở phải giống ai.','Đích đến của bước chân này chính là nơi bàn chân đang đặt xuống.']},
];
export const npcs = [
  {id:'guide',name:'Chú tiểu Minh',role:'Người đón khách',x:-3,z:24,robe:'#859786',lines:['Chào bạn! Qua cổng tam quan là sân bồ đề. Đi thẳng sẽ tới chánh điện.','Bạn có thể bấm vào từng bồ đoàn để ngồi. Khi muốn đứng dậy, nhấn E hoặc phím di chuyển.','Nhà ăn Hương Thiền nằm phía đông bắc. Cô Tâm có bốn món chay đợi bạn đấy.']},
  {id:'master',name:'Thầy Thiện Tâm',role:'Trông tàng kinh các',x:-26.8,z:-46.6,robe:'#a2794d',lines:['Cứ thong thả. Tu tập trong game bắt đầu từ sự chú ý với những điều nhỏ quanh mình.','Mời bạn chọn một bàn đọc. Một trang tĩnh lặng gồm bốn bài thực tập ngắn.','Hành trình có nhiều dấu mốc: ghé các khu vực, chăm cây và ngồi thiền mỗi ngày.']},
  {id:'cook',name:'Cô Tâm',role:'Đón khách · Bếp chay Hương Thiền',x:43,z:-20.15,robe:'#9b8067',lines:['Mời bạn vào dùng một bữa chay. Hôm nay có mì, cơm, hủ tiếu và bánh mì chay.','Chọn một ghế ở bàn, mở thực đơn rồi gọi món. Cô sẽ mang phần ăn tới đúng bàn của bạn.','Bữa ăn ở đây được tặng miễn phí. Cứ ăn chậm, đủ no rồi cùng chăm lại sân chùa nhé.']},
  {id:'keeper',name:'Chú tiểu Hương An',role:'Hướng dẫn dâng hương',x:3,z:-8.7,robe:'#a97b44',lines:['Mời bạn đứng trước lư hương để dâng hương. Tôi đứng bên phải để nhường lối vào điện.','Bạn có thể mở túi vải để chuẩn bị hương, hoa và đèn. Bàn dâng hoa ở bên trái trong điện, bàn dâng đèn ở bên phải.']},

  {id:'gardener',name:'Bác An',role:'Chăm vườn rau',x:27,z:-48,robe:'#657b5d',lines:['Gieo hạt vào một luống đất trống, tưới nước rồi đợi cây lớn.','Sau khoảng một phút kể từ khi tưới, bạn có thể thu hoạch. Rau thu được thêm vào hành trang của bạn.','Cây cối vẫn lớn khi bạn đi dạo. Thử ghé trà đình, rồi quay lại nhìn xem nhé.']},
] as const;
export const flowerSpots:Vec3[]=[[-4,.3,-30],[4,.3,-30]];
export const gardenPlots=Array.from({length:12},(_,i)=>({id:`plot-${i}`,x:31+(i%4)*3.1,z:-53+Math.floor(i/4)*3.1}));

export interface Obstacle { x:number; z:number; w:number; d:number; height?:number; base?:number; navigationOnly?:boolean }
export const obstacles:Obstacle[]=[
  ...quanAmObstacles,
  ...POND_BRIDGES.flatMap(bridge=>[-1,1].map(side=>({
    x:(bridge.start+bridge.end)/2,z:bridge.z+side*bridge.halfWidth,
    w:bridge.end-bridge.start,d:.12,navigationOnly:true,
  }))),
  {x:WATER_WELL.x,z:WATER_WELL.z,w:2.4,d:2.4,height:WATER_WELL.height+.06},
  ...WATER_JARS.map(j=>({x:j.x,z:j.z,w:j.radius*2,d:j.radius*2,height:j.height+.06})),
  ...gateMasonry.filter(p=>p.y-p.h/2<1.7).map(p=>({x:GATE.x+p.x*GATE.scale,z:GATE.z+p.z*GATE.scale,w:p.w*GATE.scale,d:p.d*GATE.scale,navigationOnly:true})),
  {x:WISH_STATION[0],z:WISH_STATION[1],w:1.1,d:1.1},
 {x:10.6,z:-31.6,w:1,d:.74,navigationOnly:true},
 ...templeObjectShapes.filter(s=>!removedTemplePost(s.position[0],s.position[2])).filter(s=>s.position[1]+s.args[0]>2.6&&s.position[1]-s.args[0]<4).filter(s=>s.kind==='cylinder').map(s=>({x:s.position[0],z:s.position[2]-27,w:s.args[1]*2,d:s.args[1]*2,navigationOnly:true})),
  {x:-7.45,z:-19.55,w:10.3,d:.36,navigationOnly:true},{x:7.45,z:-19.55,w:10.3,d:.36,navigationOnly:true},
  ...[-11.5,-7.025,-2.35,2.35,7.025,11.5].flatMap(x=>[-33.75,-30.4].map(z=>({x,z,w:.6,d:.6,navigationOnly:true}))),
  {x:0,z:-30.6,w:7.8,d:1.7,navigationOnly:true},
  {x:incenseSpot[0],z:incenseSpot[1],w:1.3,d:1.3},
  {x:0,z:-34.625,w:25.25,d:.3,navigationOnly:true},{x:-12.6,z:-27,w:.316,d:15.4,navigationOnly:true},{x:12.6,z:-27,w:.316,d:15.4,navigationOnly:true},
  ...[-1,1].flatMap(side=>[{x:side*14,z:-27,w:.24,d:19.55,navigationOnly:true},{x:side*10.8,z:-17.35,w:6.24,d:.24,navigationOnly:true},{x:side*7.325,z:-14.035,w:.24,d:6.806,navigationOnly:true}]),
  // Only the visible back walls and the six visible posts block an open pavilion.
  ...pavilionLayouts.flatMap(p=>[
    {x:p.x,z:p.z-p.d/2+.15,w:p.w,d:.2,height:4.3},
    ...[-1,1].flatMap(side=>[-1,0,1].map(row=>({x:p.x+side*(p.w/2-.4),z:p.z+row*(p.d/2-.5),w:.3,d:.3,height:4.4}))),
  ]),
  ...[-19,19].flatMap(x=>[-1,1].flatMap(side=>[-1,1].map(row=>({x:x+side*1.8,z:-13+row*1.8,w:.25,d:.25,height:4.2})))),
  {x:-19,z:-13,w:1.85,d:1.85,base:.55,height:2.6},
  {x:19,z:-13,w:2.05,d:2.02,base:.4,height:2.75},

  {x:BODHI.x,z:BODHI.z,w:BODHI.radius*2,d:BODHI.radius*2,navigationOnly:true},{x:-35,z:42,w:6,d:6},
  ...courtyardTrees.map(t=>({x:t.x,z:t.z,w:COURTYARD_TREE.radius*2,d:COURTYARD_TREE.radius*2,navigationOnly:true})),
  ...[-1,1].map(side=>({x:-19+side*1.08,z:-13,w:.32,d:.65,height:3.42,base:.4})),
  ...diningTables.map(t=>({x:t[0],z:t[2],w:2.5,d:2.8,height:.64})),
  {x:34,z:-33.1,w:17.3,d:1.8,height:1.47},
  {x:RECEPTION[0],z:RECEPTION[1],w:1.4,d:.85,height:1.36},
  ...readingTables.map(t=>({x:t[0],z:t[2],w:1.4,d:.7,height:.76})),
  ...[-40,-36,-32,-28].map(x=>({x,z:-48.3,w:2.7,d:.7,height:2.85})),
  {x:-33,z:-22,w:6,d:.9,height:1.15},
  ...teaTables.map(t=>({x:t[0],z:t[2],w:1.6,d:1.2,height:.98})),
];
export function walkable(x:number,z:number,margin=.5) {return x>WORLD.minX+1&&x<WORLD.maxX-1&&z>WORLD.minZ+1&&z<WORLD.maxZ-1&&!gateBlocked(x,z,margin)&&!pondBlocked(x,z,margin)&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin);}
export function nearestSeat(p:Vec2,kinds:Seat['kind'][]=['cushion','bench','tea','dining','reading']) {return seats.filter(s=>kinds.includes(s.kind)).sort((a,b)=>distance(p,[a.position[0],a.position[2]])-distance(p,[b.position[0],b.position[2]]))[0];}
