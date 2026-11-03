import { create } from 'zustand';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {bowDuration,type BowSession} from './bowTimeline';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createBufferedStorage } from './saveStorage';
import { surfaceHeight, dishes, distance, gardenPlots, nearestSeat, place, places, seats, seatExit, scriptures, zoneAt, type DishId, type PlaceId, type Vec2, type Vec3 } from './gameData';
import {BELL_DURATION, LANTERN_RISE, LANTERN_LIFETIME, MAX_LANTERNS, WISH_STATION, WISH_APPROACH} from './ritualMotion';
import {serviceTimes} from './mealService';
export type Activity='pray'|'bow'|'sweep'|'meditate'|'feed'|'bell'|'lantern'|'incense'|'beads'|'chant'|'mok'|'candle'|'flower'|'read'|'plant'|'water'|'harvest'|'meal'|'tea'|'walk';
export type Action='walk'|'sit'|'eat'|'pray'|'bow'|'sweep'|'meditate'|'beads'|'chant'|'mok'|'read'|'tea';
export type Item='feed'|'lantern'|'incense'|'candle'|'flower'|'seed'|'vegetable';
export type Reflection='teaMoment'|'chantMoment'|'bellMoment'|'lanternMoment';
export type Panel='journey'|'bag'|'map'|'settings'|'help'|'activities'|'donate'|'seats'|'menu'|'library'|'dialogue'|'wish'|'chat'|Reflection|null;
export const activities:{id:Activity;name:string;hint:string;zone?:PlaceId}[]=[
  {id:'pray',name:'Chắp tay',hint:'Một niệm an lành'}, {id:'bow',name:'Lạy Phật',hint:'Lạy ngay tại chỗ đang đứng hoặc ngồi'},
  {id:'meditate',name:'Ngồi thiền',hint:'Chọn bồ đoàn gần nhất'}, {id:'chant',name:'Tụng kinh',hint:'Ngồi trong thiền đường',zone:'hall'},
  {id:'mok',name:'Gõ mõ',hint:'Giữ nhịp chậm rãi',zone:'hall'}, {id:'beads',name:'Tràng hạt',hint:'Lần từng hạt trên tay'},
  {id:'sweep',name:'Quét lá',hint:'Gom lá dưới gốc bồ đề'}, {id:'incense',name:'Dâng hương',hint:'Một nén tâm hương',zone:'temple'},
  {id:'candle',name:'Thắp nến',hint:'Một ánh sáng nhỏ',zone:'temple'}, {id:'flower',name:'Dâng hoa',hint:'Đặt hoa lên bàn thờ',zone:'temple'},
  {id:'bell',name:'Thỉnh chuông',hint:'Lắng nghe âm vang',zone:'bell'}, {id:'feed',name:'Cho cá ăn',hint:'Đàn koi bên hồ',zone:'pond'},
  {id:'lantern',name:'Thả hoa đăng',hint:'Gửi một lời nguyện',zone:'lotus'}, {id:'read',name:'Đọc sách',hint:'Tàng kinh các',zone:'library'},
  {id:'meal',name:'Dùng bữa chay',hint:'Bốn món ở Hương Thiền',zone:'dining'}, {id:'tea',name:'Uống trà',hint:'Ngắm núi ở vọng đình',zone:'terrace'},
];
export function localDay(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
export const emptyProgress=():Record<Activity,number>=>Object.fromEntries(['pray','bow','sweep','meditate','feed','bell','lantern','incense','beads','chant','mok','candle','flower','read','plant','water','harvest','meal','tea','walk'].map(k=>[k,0])) as Record<Activity,number>;
export const dailyTasks=[
  {id:'sweep',title:'Sân chùa sạch lá',desc:'Gom 15 chiếc lá',target:15,reward:35},
  {id:'feed',title:'Chăm đàn cá nhỏ',desc:'Cho cá koi ăn 3 lần',target:3,reward:25},
  {id:'meditate',title:'Một phút trở về',desc:'Thiền trên bồ đoàn 60 giây',target:60,reward:40},
  {id:'meal',title:'Ăn trong chánh niệm',desc:'Dùng trọn một bữa chay',target:1,reward:25},
  {id:'harvest',title:'Rau xanh cho bếp',desc:'Thu hoạch 2 luống rau',target:2,reward:35},
  {id:'incense',title:'Một nén tâm hương',desc:'Dâng hương tại một bàn thờ',target:1,reward:15},
] as const;
export const achievements=[
  {id:'explorer',title:'Một vòng an nhiên',desc:'Khám phá đủ 13 khu vực',target:13,reward:100,metric:'visits'},
  {id:'seeker',title:'Tâm như mặt hồ',desc:'Tích lũy 300 giây thiền',target:300,reward:100,metric:'meditate'},
  {id:'diner',title:'Bốn vị thanh đạm',desc:'Thưởng thức cả 4 món chay',target:4,reward:100,metric:'dishes'},
  {id:'gardener',title:'Đôi tay vun trồng',desc:'Thu hoạch 12 luống rau',target:12,reward:80,metric:'harvest'},
  {id:'caretaker',title:'Lá về cội',desc:'Gom 100 chiếc lá',target:100,reward:80,metric:'sweep'},
  {id:'reader',title:'Trang sách mở',desc:'Đọc đủ 4 bài thực tập',target:4,reward:60,metric:'books'},
] as const;
export interface MealOrder {dish:DishId;seatId:string;status:'preparing'|'ready'|'eating'|'finished';readyAt:number;orderedAt?:number;cookedAt?:number;kitchenAt?:number;deliveryAt?:number;homeAt?:number;eatUntil?:number}
export interface PlotState {plantedAt:number;wateredAt:number|null;harvested:boolean}
export interface Wish {text:string;at:number}
export interface Peer {id:string;name:string;robe:string;gender?:'male'|'female';skin?:string;robeStyle?:'traditional'|'cross';x:number;y:number;z:number;heading:number;action:Action;seat:string|null;meal?:MealOrder|null}
export interface ChatMessage {id:string;name:string;text:string;at:number;system?:boolean}
export interface GameState {
  bow:BowSession|null;finishBow:()=>void;
  name:string;robe:string;gender:'male'|'female';skin:string;robeStyle:'traditional'|'cross';characterConfigured:boolean;merit:number;peace:number;experience:number;energy:number;day:string;started:boolean;
  progress:Record<Activity,number>;lifetime:Record<Activity,number>;inventory:Record<Item,number>;claimed:string[];badges:string[];
  visited:PlaceId[];readBooks:string[];tasted:DishId[];plots:Record<string,PlotState>;wishes:Wish[];
  action:Action;panel:Panel;night:boolean;sound:boolean;chantMusic:boolean;quality:'high'|'low';camera:'follow'|'overview';cameraYaw:number;cameraReset:number;
  position:Vec2;height:number;heading:number;destination:Vec2|null;seated:string|null;pendingSeat:string|null;pendingAction:Action;
  teleport:{position:Vec3;heading:number;at:number}|null;event:{type:Activity;at:number;x:number;z:number}|null;toast:{text:string;id:number}|null;
  meal:MealOrder|null;npc:string|null;scripture:string;sessionSeconds:number;bodhiIncense:number;
  pendingActivity:Activity|null;ceremony:{type:'bell'|'lantern';at:number;text?:string}|null;flights:Wish[];reflectionWish:string;
  connection:'connecting'|'online'|'offline';room:string;peers:Peer[];messages:ChatMessage[];chatUnread:number;playerId:string;
  set:(v:Partial<GameState>)=>void;notify:(text:string)=>void;record:(activity:Activity,amount?:number)=>void;checkDay:()=>void;
  go:(id:PlaceId)=>void;sit:(id?:string,action?:Action)=>void;stand:()=>void;perform:(activity:Activity)=>void;
  orderMeal:(id:DishId)=>void;eat:()=>void;tick:()=>void;garden:(id:string)=>void;buy:(item:Item)=>void;claim:(id:string)=>void;claimBadge:(id:string)=>void;
  read:(id:string)=>void;releaseWish:(text:string)=>void;arriveSeat:(id:string)=>void;closePanel:()=>void;
}
const timed:Action[]=['meditate','beads','chant','mok','pray'];
export function achievementValue(s:Pick<GameState,'visited'|'tasted'|'readBooks'|'lifetime'>,metric:string){return metric==='visits'?s.visited.length:metric==='dishes'?s.tasted.length:metric==='books'?s.readBooks.length:s.lifetime[metric as Activity]||0;}
export const floorAt=surfaceHeight;
export const useGame=create<GameState>()(persist((set,get)=>({
  name:'An Nhiên',robe:'#9b704a',gender:'male',skin:'#c99c79',robeStyle:'traditional',characterConfigured:false,merit:0,peace:0,experience:0,energy:80,day:localDay(),started:false,
  progress:emptyProgress(),lifetime:emptyProgress(),inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0},claimed:[],badges:[],visited:[],readBooks:[],tasted:[],plots:{},wishes:[],
  action:'walk',panel:null,night:false,sound:false,chantMusic:true,quality:'high',camera:'follow',cameraYaw:0,cameraReset:0,
  position:[0,22],height:.06,heading:Math.PI,destination:null,seated:null,pendingSeat:null,pendingAction:'sit',teleport:null,event:null,toast:null,meal:null,npc:null,scripture:'breath',sessionSeconds:0,bodhiIncense:0,bow:null,
  pendingActivity:null,ceremony:null,flights:[],reflectionWish:'',
  connection:'connecting',room:'an-nhien',peers:[],messages:[],chatUnread:0,playerId:'',
  set,notify:text=>set({toast:{text,id:Date.now()}}),
  closePanel:()=>{const s=get();set({panel:null});if(s.action==='tea'||s.action==='chant')set({action:s.seated?'sit':'walk'});},
  checkDay:()=>{if(get().day!==localDay())set({day:localDay(),progress:emptyProgress(),claimed:[]});},
  record:(activity,amount=1)=>{get().checkDay();set(s=>({progress:{...s.progress,[activity]:(s.progress[activity]||0)+amount},lifetime:{...s.lifetime,[activity]:(s.lifetime[activity]||0)+amount},experience:s.experience+amount,merit:s.merit+(['meditate','chant','walk','pray','beads','mok'].includes(activity)?0:amount*2),peace:Math.min(100,s.peace+amount*(activity==='walk'?.025:timed.includes(activity as Action)?.15:1))}));},
  go:id=>{get().stand();const p=place(id);set({destination:[p.x,p.z],pendingSeat:null,action:'walk',panel:null});get().notify(`Đang đi đến ${p.name.toLowerCase()} · Giữ Shift để bước nhanh`);},
  stand:()=>{const s=get();if(s.seated){const seat=seats.find(c=>c.id===s.seated);if(seat){const [x,z]=seatExit(seat);set({teleport:{position:[x,floorAt(x,z)+.08,z],heading:seat.rotation,at:Date.now()}});}}set({seated:null,pendingSeat:null,pendingActivity:null,action:'walk',destination:null,bow:null});if(s.meal?.status==='eating')set({meal:{...s.meal,status:'ready',eatUntil:undefined}});},
  finishBow:()=>{const s=get();if(s.action==='bow'&&s.bow&&Date.now()-s.bow.at>=bowDuration(s.bow.mode)*1000)set({action:s.seated?'sit':'walk',bow:null});},
  sit:(id,action='sit')=>{const s=get();if(s.seated&&!id){if(action==='sit'){s.stand();return;}set({action,bow:null});return;}const seat=id?seats.find(c=>c.id===id):nearestSeat(s.position,action==='meditate'||action==='chant'||action==='mok'?['cushion']:['cushion','bench','tea']);if(!seat)return;
    if(s.peers.some(p=>p.seat===seat.id)){s.notify('Chỗ này đang có người ngồi. Bạn chọn chỗ bên cạnh nhé.');return;}
    if(s.seated===seat.id){set({action,bow:null});return;}s.stand();set({pendingSeat:seat.id,pendingAction:seat.kind==='reading'?'read':action,destination:[seat.position[0],seat.position[2]],panel:null});s.notify(`Đến ${seat.label.toLowerCase()} · Nhấn E để đứng dậy`);
  },
  arriveSeat:id=>{const s=get(),seat=seats.find(c=>c.id===id);if(!seat)return;if(s.peers.some(p=>p.seat===id)){set({pendingSeat:null,pendingActivity:null,destination:null});s.notify('Chỗ này đang có người ngồi.');return;}
    const activity=s.pendingActivity;set({seated:id,pendingSeat:null,pendingActivity:null,destination:null,action:s.pendingAction,position:[seat.position[0],seat.position[2]],height:seat.position[1],heading:seat.rotation,panel:seat.kind==='dining'&&(!s.meal||s.meal.status==='finished')?'menu':seat.kind==='reading'?'library':null});
    if(activity==='tea'||activity==='chant')get().perform(activity);
  },
  perform:activity=>{const s=get();if(activity==='bow'&&s.action==='bow'&&s.bow&&Date.now()-s.bow.at<bowDuration(s.bow.mode)*1000)return;if(activity==='pray'||activity==='beads'){set({action:s.action===activity?(s.seated?'sit':'walk'):activity,destination:null,pendingSeat:null,pendingActivity:null,bow:null});return;}if((activity==='bell'||activity==='lantern')&&s.ceremony){s.notify('Mời bạn lắng lại cùng khoảnh khắc đang diễn ra.');return;}if(s.event&&Date.now()-s.event.at<900&&!['tea','read','chant','meditate','mok','meal'].includes(activity))return;
    if(activity==='meditate'||activity==='chant'||activity==='mok'){
      if(activity==='chant'&&s.seated&&seats.find(c=>c.id===s.seated)?.zone==='hall'){set({action:'chant',panel:'chantMoment',destination:null});return;}
      if(s.action===activity){s.stand();return;}const target=activity==='chant'||activity==='mok'?seats.find(c=>c.zone==='hall'&&!s.peers.some(p=>p.seat===c.id)):seats.filter(c=>c.kind==='cushion'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];
      if(!target){s.notify('Các chỗ đang có người ngồi. Mời bạn chọn chỗ khác.');return;}s.sit(target.id,activity==='chant'?'sit':activity);if(activity==='chant')set({pendingActivity:'chant'});return;}
    if(activity==='meal'){if(s.seated&&seats.find(c=>c.id===s.seated)?.kind==='dining'){set({panel:'menu'});}else{const seat=seats.filter(c=>c.kind==='dining'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(!seat){s.notify('Nhà ăn đang đầy. Mời bạn chọn ghế sau nhé.');return;}s.sit(seat.id,'sit');s.notify('Mời bạn đến nhà ăn, ngồi vào ghế rồi mở thực đơn.');}return;}
    if(activity==='tea'){if(!s.seated||seats.find(c=>c.id===s.seated)?.kind!=='tea'){const seat=seats.filter(c=>c.kind==='tea'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(!seat){s.notify('Bàn trà đang đầy. Mời bạn quay lại sau.');return;}s.sit(seat.id);set({pendingActivity:'tea'});return;}if(s.action!=='tea'){s.record('tea');set({energy:Math.min(100,s.energy+10),event:{type:activity,at:Date.now(),x:s.position[0],z:s.position[1]}});}set({action:'tea',panel:'teaMoment'});return;}
    if(activity==='read'){if(seats.find(c=>c.id===s.seated)?.kind==='reading'){set({action:'read',panel:'library'});return;}const seat=seats.filter(c=>c.kind==='reading'&&!s.peers.some(p=>p.seat===c.id)).sort((a,b)=>distance(s.position,[a.position[0],a.position[2]])-distance(s.position,[b.position[0],b.position[2]]))[0];if(seat)s.sit(seat.id,'read');else s.notify('Bàn đọc đang đầy. Mời bạn chọn chỗ sau nhé.');return;}
    if(activity==='bell'&&s.ceremony?.type==='bell')return;
    const atBodhi=activity==='incense'&&nearBodhiAltar(s.position);const zone=atBodhi?undefined:activities.find(a=>a.id===activity)?.zone;
    const anchor:Vec2=activity==='feed'?[18,5]:activity==='lantern'?WISH_STATION:zone?[place(zone).x,place(zone).z]:s.position;
    if(zone&&distance(s.position,anchor)>(activity==='incense'||activity==='flower'||activity==='candle'?13:activity==='bell'?6:activity==='lantern'?4:9)){s.stand();set({destination:activity==='lantern'?WISH_APPROACH:anchor,pendingActivity:activity==='lantern'||activity==='bell'?activity:null});s.notify(`Đang đến ${place(zone).name.toLowerCase()}.`);return;}
    if(activity==='lantern'){set({panel:'wish'});return;}
    const consumable=(['feed','incense','candle','flower'] as string[]).includes(activity)?activity as Item:null;
    if(consumable){if(s.inventory[consumable]<=0){set({panel:'bag'});s.notify('Vật phẩm đã hết. Ghé túi vải để đổi thêm.');return;}set({inventory:{...s.inventory,[consumable]:s.inventory[consumable]-1}});}
    if(activity==='sweep'){s.stand();set({action:s.action==='sweep'?'walk':'sweep'});}else if(['pray','beads'].includes(activity))set({action:s.action===activity?'sit' as Action:activity as Action});else if(activity==='bow'){const cushion=!!s.seated&&seats.find(c=>c.id===s.seated)?.kind==='cushion';if(!cushion)s.stand();set({action:'bow',bow:{at:Date.now(),mode:cushion?'cushion':'standing'},destination:null,pendingSeat:null});}
    set({event:{type:activity,at:Date.now(),x:atBodhi?BODHI.x:s.position[0],z:atBodhi?BODHI.altarZ:s.position[1]},...(atBodhi?{bodhiIncense:s.bodhiIncense+1}:{})});
    if(activity==='bell')set({ceremony:{type:'bell',at:Date.now()}});
    if(!['sweep','pray','beads'].includes(activity))s.record(activity);
    s.notify(activity==='sweep'?'Đi gần lá rụng để gom lá. Lá được tạo thêm theo thời gian.':activity==='feed'?'Đàn koi đang bơi về phía bữa ăn nhỏ.':activity==='bell'?'Nghe một tiếng chuông, trở về khoảnh khắc này.':activity==='bow'?'Một lạy thành tâm.':activity==='incense'?'Nén hương đã được đặt lên lư hương.':activity==='candle'?'Một ngọn nến vừa được thắp trên bàn thờ.':activity==='flower'?'Bình hoa đã được dâng lên chánh điện.':'Thả lỏng vai, chậm lại cùng hơi thở.');
  },
  orderMeal:id=>{const s=get();const seat=seats.find(c=>c.id===s.seated);if(!seat||seat.kind!=='dining'){s.notify('Bạn cần ngồi vào một ghế trong nhà ăn để gọi món.');return;}if(s.meal&&s.meal.status!=='finished'){s.notify('Bạn đang có một phần ăn. Dùng xong rồi gọi món tiếp nhé.');return;}if(s.meal?.homeAt&&Date.now()<s.meal.homeAt){s.notify('Cô Tâm đang trở về quầy, mời bạn đợi một chút nhé.');return;}if(!dishes.some(d=>d.id===id))return;set({meal:{dish:id,seatId:seat.id,status:'preparing',...serviceTimes(seat.id,Date.now())},panel:null,action:'sit'});s.notify(`Bếp đang chuẩn bị ${dishes.find(d=>d.id===id)!.name.toLowerCase()}. Món sẽ tới bàn trong giây lát.`);},
  eat:()=>{const s=get();if(!s.meal||s.meal.status!=='ready')return;if(s.seated!==s.meal.seatId){s.sit(s.meal.seatId);return;}set({meal:{...s.meal,status:'eating',eatUntil:Date.now()+9000},action:'eat'});s.notify('Ăn chậm, trân trọng từng hương vị.');},
  tick:()=>{const s=get();s.checkDay();const zone=zoneAt(s.position);if(!s.visited.includes(zone.id)&&distance(s.position,[zone.x,zone.z])<12)set({visited:[...s.visited,zone.id]});set({sessionSeconds:s.sessionSeconds+1});if(s.flights.some(f=>Date.now()-f.at>=LANTERN_LIFETIME))set({flights:s.flights.filter(f=>Date.now()-f.at<LANTERN_LIFETIME)});
    if(!s.panel&&s.ceremony&&Date.now()-s.ceremony.at>=(s.ceremony.type==='bell'?BELL_DURATION:LANTERN_RISE)){set({panel:s.ceremony.type==='bell'?'bellMoment':'lanternMoment',reflectionWish:s.ceremony.text||'',ceremony:null});}
    if(s.meal?.status==='preparing'&&Date.now()>=s.meal.readyAt){set({meal:{...s.meal,status:'ready'}});s.notify('Bữa chay đã được đặt lên bàn. Chúc bạn ăn ngon miệng!');}
    if(s.meal?.status==='eating'&&s.action==='eat'&&s.seated===s.meal.seatId&&Date.now()>=(s.meal.eatUntil||Infinity)){const dish=dishes.find(d=>d.id===s.meal!.dish)!;s.record('meal');set({meal:{...s.meal,status:'finished'},action:'sit',energy:Math.min(100,s.energy+dish.energy),tasted:s.tasted.includes(dish.id)?s.tasted:[...s.tasted,dish.id]});s.notify(`Bữa ${dish.name.toLowerCase()} đã hoàn thành. +${dish.energy} năng lượng · +2 công đức`);}
  },
  garden:id=>{const s=get(),plot=gardenPlots.find(p=>p.id===id);if(!plot)return;if(distance(s.position,[plot.x,plot.z])>3){s.stand();set({destination:[plot.x,plot.z+1]});s.notify('Đến gần luống rau rồi bấm lại để chăm cây.');return;}const p=s.plots[id];if(!p||p.harvested){if(s.inventory.seed<1){set({panel:'bag'});s.notify('Bạn đã hết hạt giống.');return;}set({plots:{...s.plots,[id]:{plantedAt:Date.now(),wateredAt:null,harvested:false}},inventory:{...s.inventory,seed:s.inventory.seed-1}});s.record('plant');s.notify('Hạt giống đã được gieo. Bấm vào luống lần nữa để tưới.');}else if(!p.wateredAt){set({plots:{...s.plots,[id]:{...p,wateredAt:Date.now()}}});s.record('water');s.notify('Đã tưới nước. Cây sẽ sẵn sàng thu hoạch sau 60 giây.');}else if(Date.now()-p.wateredAt>=60000){set({plots:{...s.plots,[id]:{...p,harvested:true}},inventory:{...s.inventory,vegetable:s.inventory.vegetable+3}});s.record('harvest');s.notify('Thu hoạch được 3 bó rau. +2 công đức');}else s.notify(`Cây đang lớn. Còn ${Math.ceil((60000-Date.now()+p.wateredAt)/1000)} giây nữa.`);},
  buy:item=>{const s=get();if(item==='vegetable')return;const cost=item==='lantern'?12:6,qty=item==='feed'?10:item==='seed'?8:5;if(s.merit<cost){s.notify(`Cần ${cost} công đức để đổi thêm.`);return;}set({merit:s.merit-cost,inventory:{...s.inventory,[item]:s.inventory[item]+qty}});s.notify(`Đã thêm ${qty} vật phẩm vào túi.`);},
  claim:id=>{get().checkDay();const s=get(),t=dailyTasks.find(t=>t.id===id);if(!t||s.claimed.includes(id)||s.progress[t.id]<t.target)return;set({claimed:[...s.claimed,id],merit:s.merit+t.reward});s.notify(`Nhận ${t.reward} công đức từ việc lành hôm nay.`);},
  claimBadge:id=>{const s=get(),a=achievements.find(a=>a.id===id);if(!a||s.badges.includes(id)||achievementValue(s,a.metric)<a.target)return;set({badges:[...s.badges,id],merit:s.merit+a.reward});s.notify(`Dấu mốc mới: ${a.title}. +${a.reward} công đức`);},
  read:id=>{if(!scriptures.some(b=>b.id===id))return;const s=get();set({scripture:id});if(!s.readBooks.includes(id)){set({readBooks:[...s.readBooks,id]});s.record('read');}},
  releaseWish:text=>{const s=get();if(s.ceremony)return;if(distance(s.position,WISH_STATION)>4){s.notify('Mời bạn đến đài hoa đăng bên hồ để gửi lời nguyện.');return;}if(s.inventory.lantern<1){set({panel:'bag'});s.notify('Bạn đã hết hoa đăng.');return;}const clean=text.trim().slice(0,160)||'Cầu mong mọi người đều được bình an.',at=Math.max(Date.now(),(s.wishes[0]?.at||0)+1),wish={text:clean,at};set({inventory:{...s.inventory,lantern:s.inventory.lantern-1},wishes:[wish,...s.wishes].slice(0,30),flights:[wish,...s.flights].slice(0,MAX_LANTERNS),ceremony:{type:'lantern',at,text:clean},event:{type:'lantern',at,x:28,z:35.5},panel:null,destination:null,pendingActivity:null});s.record('lantern');s.notify('Hoa đăng đang nâng lời nguyện của bạn lên từ hồ sen…');},
}),{name:'sen-an-nhien-v1',storage:createJSONStorage(()=>createBufferedStorage(()=>window.localStorage)),version:3,migrate:(stored:any)=>({...stored,inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0,...stored.inventory},progress:{...emptyProgress(),...stored.progress},lifetime:{...emptyProgress(),...stored.progress,...stored.lifetime}}),
  partialize:s=>({bodhiIncense:s.bodhiIncense,name:s.name,robe:s.robe,gender:s.gender,skin:s.skin,robeStyle:s.robeStyle,characterConfigured:s.characterConfigured,merit:s.merit,peace:s.peace,experience:s.experience,energy:s.energy,day:s.day,started:s.started,progress:s.progress,lifetime:s.lifetime,inventory:s.inventory,claimed:s.claimed,badges:s.badges,visited:s.visited,readBooks:s.readBooks,tasted:s.tasted,plots:s.plots,wishes:s.wishes,night:s.night,sound:s.sound,chantMusic:s.chantMusic,quality:s.quality,camera:s.camera}),
}));






