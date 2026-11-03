export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export const WORLD = { minX: -60, maxX: 60, minZ: -66, maxZ: 62 };
export const places = [
  { id:'gate', name:'Cổng tam quan', subtitle:'Bắt đầu một hành trình mới', x:0, z:29, icon:'gate' },
  { id:'courtyard', name:'Sân bồ đề', subtitle:'Quét lá · Chắp tay · Đi dạo', x:0, z:6, icon:'tree' },
  { id:'temple', name:'Đại hùng bảo điện', subtitle:'Lễ Phật · Dâng hương · 18 bồ đoàn', x:0, z:-24, icon:'temple' },
  { id:'hall', name:'Thiền đường Trúc Lâm', subtitle:'Ngồi thiền · Tụng kinh · Gõ mõ', x:-33, z:-17, icon:'meditate' },
  { id:'bell', name:'Lầu chuông', subtitle:'Thỉnh chuông · Lắng nghe', x:-19, z:-9, icon:'bell' },
  { id:'pond', name:'Hồ cá koi', subtitle:'Cho cá ăn · Ghế đá bên hồ', x:27, z:4, icon:'fish' },
  { id:'dining', name:'Nhà ăn Hương Thiền', subtitle:'Mì · Cơm · Hủ tiếu · Bánh mì chay', x:34, z:-26, icon:'meal' },
  { id:'library', name:'Tàng kinh các', subtitle:'Đọc kinh · Trò chuyện cùng thầy', x:-34, z:-43, icon:'book' },
  { id:'garden', name:'Vườn rau từ tâm', subtitle:'Gieo hạt · Tưới cây · Thu hoạch', x:36, z:-50, icon:'plant' },
  { id:'terrace', name:'Trà đình Vọng Sơn', subtitle:'Uống trà · Ngắm núi · Ngồi nghỉ', x:0, z:-56, icon:'tea' },
  { id:'lotus', name:'Hồ sen nguyện ước', subtitle:'Thả hoa đăng · Viết lời nguyện', x:27, z:39, icon:'lotus' },
  { id:'stupa', name:'Bảo tháp An Lạc', subtitle:'Khám phá · Chiêm ngưỡng', x:-35, z:42, icon:'stupa' },
  { id:'bamboo', name:'Đường trúc tĩnh tâm', subtitle:'Thiền hành giữa rừng trúc', x:-38, z:12, icon:'bamboo' },
] as const;
export type PlaceId = typeof places[number]['id'];
export function place(id: PlaceId) { return places.find(p=>p.id===id)!; }
export function distance(a:Vec2,b:Vec2) { return Math.hypot(a[0]-b[0],a[1]-b[1]); }
export function zoneAt(p:Vec2) { return [...places].sort((a,b)=>distance(p,[a.x,a.z])-distance(p,[b.x,b.z]))[0]; }
export interface Seat {id:string; label:string; zone:PlaceId; position:Vec3; rotation:number; kind:'cushion'|'bench'|'dining'|'tea'; table?:Vec3}
export const seats:Seat[] = [
  ...Array.from({length:18},(_,i)=>({id:`temple-${i}`,label:`Bồ đoàn ${i+1} · Chánh điện`,zone:'temple' as const,position:[(i%6-2.5)*2.5,.58,-25+Math.floor(i/6)*2.6] as Vec3,rotation:Math.PI,kind:'cushion' as const})),
  ...Array.from({length:20},(_,i)=>({id:`hall-${i}`,label:`Bồ đoàn ${i+1} · Thiền đường`,zone:'hall' as const,position:[-33+(i%5-2)*2.4,.4,-19+Math.floor(i/5)*2.4] as Vec3,rotation:Math.PI,kind:'cushion' as const})),
  ...Array.from({length:8},(_,i)=>({id:`bamboo-${i}`,label:`Tọa cụ ${i+1} · Rừng trúc`,zone:'bamboo' as const,position:[-38+Math.cos(i/8*Math.PI*2)*4,.12,12+Math.sin(i/8*Math.PI*2)*4] as Vec3,rotation:-i/8*Math.PI*2-Math.PI/2,kind:'cushion' as const})),
  ...Array.from({length:16},(_,i)=>{const table=Math.floor(i/4),side=i%4;const tx=30+(table%2)*8,tz=-28+Math.floor(table/2)*8;return {id:`dining-${i}`,label:`Bàn ${table+1} · Ghế ${side+1}`,zone:'dining' as const,position:[tx+(side%2===0?-1.8:1.8),.53,tz+(side<2?-1:1)] as Vec3,rotation:side%2===0?Math.PI/2:-Math.PI/2,kind:'dining' as const,table:[tx,.96,tz] as Vec3}}),
  ...Array.from({length:6},(_,i)=>({id:`tea-${i}`,label:`Chỗ trà ${i+1}`,zone:'terrace' as const,position:[(i%3-1)*3,.55,-55+(i<3?-1.8:1.8)] as Vec3,rotation:i<3?0:Math.PI,kind:'tea' as const,table:[(i%3-1)*3,.8,-55] as Vec3})),
  ...([{x:17,z:-2,rotation:Math.PI/2},{x:17,z:10,rotation:Math.PI/2},{x:37,z:13,rotation:Math.PI},{x:37,z:28,rotation:Math.PI},{x:-11,z:17,rotation:0},{x:10,z:19,rotation:0}] as const).flatMap((b,i)=>[-.65,.65].map((offset,j)=>({id:`bench-${i}-${j}`,label:`Ghế nghỉ ${i+1}`,zone:(i<3?'pond':i===3?'lotus':'courtyard') as PlaceId,position:[b.x+(b.rotation===0||b.rotation===Math.PI?offset:0),.55,b.z+(b.rotation===Math.PI/2?offset:0)] as Vec3,rotation:b.rotation,kind:'bench' as const}))),
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
  {id:'master',name:'Thầy Thiện Tâm',role:'Trông tàng kinh các',x:-28,z:-37,robe:'#a2794d',lines:['Cứ thong thả. Tu tập trong game bắt đầu từ sự chú ý với những điều nhỏ quanh mình.','Tàng kinh các có các bài thực tập ngắn. Bạn có thể đọc rồi tìm một bồ đoàn yên tĩnh để trải nghiệm.','Hành trình có nhiều dấu mốc: ghé các khu vực, chăm cây và ngồi thiền mỗi ngày.']},
  {id:'cook',name:'Cô Tâm',role:'Bếp chay Hương Thiền',x:40,z:-33,robe:'#9b8067',lines:['Mời bạn vào dùng một bữa chay. Hôm nay có mì, cơm, hủ tiếu và bánh mì chay.','Chọn một ghế ở bàn, mở thực đơn rồi gọi món. Bếp sẽ chuẩn bị và mang phần ăn tới đúng chỗ bạn.','Bữa ăn ở đây được tặng miễn phí. Cứ ăn chậm, đủ no rồi cùng chăm lại sân chùa nhé.']},
  {id:'gardener',name:'Bác An',role:'Chăm vườn rau',x:27,z:-48,robe:'#657b5d',lines:['Gieo hạt vào một luống đất trống, tưới nước rồi đợi cây lớn.','Sau khoảng một phút kể từ khi tưới, bạn có thể thu hoạch. Rau thu được thêm vào hành trang của bạn.','Cây cối vẫn lớn khi bạn đi dạo. Thử ghé trà đình, rồi quay lại nhìn xem nhé.']},
] as const;
export const flowerSpots:Vec3[]=[[-4,.3,-30],[4,.3,-30]];
export const gardenPlots=Array.from({length:12},(_,i)=>({id:`plot-${i}`,x:31+(i%4)*3.1,z:-53+Math.floor(i/4)*3.1}));

export interface Obstacle { x:number; z:number; w:number; d:number }
export const obstacles:Obstacle[]=[
  {x:28,z:-1.6,w:14,d:7.8}, {x:28,z:9.6,w:14,d:7.8}, {x:28,z:34.7,w:20,d:4.4}, {x:28,z:43.3,w:20,d:4.4},
  {x:0,z:-35.8,w:22,d:.7},{x:-10.8,z:-27,w:.6,d:17},{x:10.8,z:-27,w:.6,d:17},
  {x:-33,z:-24.7,w:20,d:.5},{x:-43,z:-17,w:.5,d:15},{x:-23,z:-17,w:.5,d:15},
  {x:-34,z:-49.5,w:17,d:.5},{x:-42.5,z:-43,w:.5,d:13},{x:-25.5,z:-43,w:.5,d:13},
  {x:34,z:-35.7,w:23,d:.6},{x:22.5,z:-27,w:.5,d:18},{x:45.5,z:-27,w:.5,d:18},
  {x:-19,z:-13,w:4,d:4},{x:19,z:-13,w:4,d:4},
  {x:-10,z:0,w:3,d:3},{x:-35,z:42,w:6,d:6},
  ...[0,1,2,3].map(i=>({x:30+(i%2)*8,z:-28+Math.floor(i/2)*8,w:2.5,d:3.8})),
];
export function walkable(x:number,z:number,margin=.5) {return x>WORLD.minX+1&&x<WORLD.maxX-1&&z>WORLD.minZ+1&&z<WORLD.maxZ-1&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin);}
export function nearestSeat(p:Vec2,kinds:Seat['kind'][]=['cushion','bench','tea','dining']) {return seats.filter(s=>kinds.includes(s.kind)).sort((a,b)=>distance(p,[a.position[0],a.position[2]])-distance(p,[b.position[0],b.position[2]]))[0];}



