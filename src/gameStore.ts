import { create } from 'zustand';
import {BODHI,nearBodhiAltar} from './bodhiData';
import {bowDuration,type BowSession} from './bowTimeline';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createBufferedStorage } from './saveStorage';
import { templeOffering, OFFERING_RANGE, OFFERING_DURATION, OFFERING_CAPACITY, dishes, distance, incenseSpot, incenseApproach, INCENSE_CLEARANCE, INCENSE_RANGE, INCENSE_DURATION, INCENSE_BURN_MS, gardenPlots, nearestSeat, place, places, seats, scriptures, zoneAt, type DishId, type PlaceId, type Vec2, type Vec3 } from './gameData';
export type Activity='pray'|'bow'|'sweep'|'meditate'|'feed'|'bell'|'lantern'|'incense'|'beads'|'chant'|'mok'|'candle'|'flower'|'read'|'plant'|'water'|'harvest'|'meal'|'tea'|'walk';
export type Action='flower'|'candle'|'incense'|'walk'|'sit'|'eat'|'pray'|'bow'|'sweep'|'meditate'|'beads'|'chant'|'mok';
export type Item='feed'|'lantern'|'incense'|'candle'|'flower'|'seed'|'vegetable';
export type Panel='journey'|'bag'|'map'|'settings'|'help'|'activities'|'donate'|'seats'|'menu'|'library'|'dialogue'|'wish'|'chat'|null;
export const activities:{id:Activity;name:string;hint:string;zone?:PlaceId}[]=[
  {id:'pray',name:'Chắp tay',hint:'Một niệm an lành'}, {id:'bow',name:'Lạy Phật',hint:'Lạy ngay tại chỗ đang đứng hoặc ngồi'},
  {id:'meditate',name:'Ngồi thiền',hint:'Chọn bồ đoàn gần nhất'}, {id:'chant',name:'Tụng kinh',hint:'Ngồi trong thiền đường',zone:'hall'},
  {id:'mok',name:'Gõ mõ',hint:'Giữ nhịp chậm rãi',zone:'hall'}, {id:'beads',name:'Tràng hạt',hint:'Lần từng hạt trên tay'},
  {id:'sweep',name:'Quét lá',hint:'Gom lá dưới gốc bồ đề'}, {id:'incense',name:'Dâng hương',hint:'Một nén tâm hương',zone:'temple'},
  {id:'candle',name:'Dâng đèn',hint:'Một ánh sáng nhỏ',zone:'temple'}, {id:'flower',name:'Dâng hoa',hint:'Đặt hoa lên bàn thờ',zone:'temple'},
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
export interface MealOrder {dish:DishId;seatId:string;status:'preparing'|'ready'|'eating'|'finished';readyAt:number;eatUntil?:number}
export interface PlotState {plantedAt:number;wateredAt:number|null;harvested:boolean}
export interface Wish {text:string;at:number}
export interface Peer {id:string;name:string;robe:string;gender?:'male'|'female';skin?:string;robeStyle?:'traditional'|'cross';x:number;y:number;z:number;heading:number;action:Action;seat:string|null;meal?:MealOrder|null}
export interface ChatMessage {id:string;name:string;text:string;at:number;system?:boolean}
export interface GameState {
  bow:BowSession|null;finishBow:()=>void;
  name:string;robe:string;gender:'male'|'female';skin:string;robeStyle:'traditional'|'cross';characterConfigured:boolean;merit:number;peace:number;experience:number;energy:number;day:string;started:boolean;
  progress:Record<Activity,number>;lifetime:Record<Activity,number>;inventory:Record<Item,number>;claimed:string[];badges:string[];
  visited:PlaceId[];readBooks:string[];tasted:DishId[];plots:Record<string,PlotState>;wishes:Wish[];
  offerings:{flower:number[];candle:number[]};burningIncense:number[];action:Action;panel:Panel;night:boolean;sound:boolean;quality:'high'|'low';camera:'follow'|'overview';cameraYaw:number;cameraReset:number;
  position:Vec2;height:number;heading:number;destination:Vec2|null;seated:string|null;pendingSeat:string|null;pendingAction:Action;
  teleport:{position:Vec3;heading:number;at:number}|null;event:{type:Activity;at:number;x:number;z:number}|null;toast:{text:string;id:number}|null;
  meal:MealOrder|null;npc:string|null;scripture:string;sessionSeconds:number;bodhiIncense:number;
  connection:'connecting'|'online'|'offline';room:string;peers:Peer[];messages:ChatMessage[];chatUnread:number;playerId:string;
  set:(v:Partial<GameState>)=>void;notify:(text:string)=>void;record:(activity:Activity,amount?:number)=>void;checkDay:()=>void;
  go:(id:PlaceId)=>void;sit:(id?:string,action?:Action)=>void;stand:()=>void;perform:(activity:Activity)=>void;
  orderMeal:(id:DishId)=>void;eat:()=>void;tick:()=>void;garden:(id:string)=>void;buy:(item:Item)=>void;claim:(id:string)=>void;claimBadge:(id:string)=>void;
  read:(id:string)=>void;releaseWish:(text:string)=>void;
}
const timed:Action[]=['meditate','beads','chant','mok','pray'];
export function achievementValue(s:Pick<GameState,'visited'|'tasted'|'readBooks'|'lifetime'>,metric:string){return metric==='visits'?s.visited.length:metric==='dishes'?s.tasted.length:metric==='books'?s.readBooks.length:s.lifetime[metric as Activity]||0;}
export function floorAt(x:number,z:number){if(x>17&&x<39&&z>2.5&&z<5.5)return .44;if(x>14.5&&x<41.5&&z>37.5&&z<40.5)return .44;if(Math.abs(x)<14.1&&z< -16.05&&z> -36.5)return 2.28;if(Math.abs(x)<9.2&&z>= -16.05&&z< -10.5)return .08+Math.min(1,(-10.5-z)/5.55)*2.2;if(x>-43&&x<-23&&z<-9&&z>-25)return .4;if(x>-43&&x<-25&&z<-36&&z>-50)return .35;if(x>22.5&&x<45.5&&z<-17&&z>-36)return .16;if(Math.abs(x)<8&&z<-51)return .3;return .06;}
export const useGame=create<GameState>()(persist((set,get)=>({
  name:'An Nhiên',robe:'#9b704a',gender:'male',skin:'#c99c79',robeStyle:'traditional',characterConfigured:false,merit:0,peace:0,experience:0,energy:80,day:localDay(),started:false,
  progress:emptyProgress(),lifetime:emptyProgress(),inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0},claimed:[],badges:[],visited:[],readBooks:[],tasted:[],plots:{},wishes:[],
  offerings:{flower:[],candle:[]},burningIncense:[],action:'walk',panel:null,night:false,sound:false,quality:typeof window!=='undefined'&&window.matchMedia?.('(pointer: coarse)').matches?'low':'high',camera:'follow',cameraYaw:0,cameraReset:0,
  position:[0,22],height:.06,heading:Math.PI,destination:null,seated:null,pendingSeat:null,pendingAction:'sit',teleport:null,event:null,toast:null,meal:null,npc:null,scripture:'breath',sessionSeconds:0,bodhiIncense:0,bow:null,
  connection:'connecting',room:'an-nhien',peers:[],messages:[],chatUnread:0,playerId:'',
  set,notify:text=>set({toast:{text,id:Date.now()}}),
  checkDay:()=>{if(get().day!==localDay())set({day:localDay(),progress:emptyProgress(),claimed:[]});},
  record:(activity,amount=1)=>{get().checkDay();set(s=>({progress:{...s.progress,[activity]:(s.progress[activity]||0)+amount},lifetime:{...s.lifetime,[activity]:(s.lifetime[activity]||0)+amount},experience:s.experience+amount,merit:s.merit+(['meditate','chant','walk','pray','beads','mok'].includes(activity)?0:amount*2),peace:Math.min(100,s.peace+amount*(activity==='walk'?.025:timed.includes(activity as Action)?.15:1))}));},
  go:id=>{get().stand();const p=place(id);set({destination:[p.x,p.z],pendingSeat:null,action:'walk',panel:null});get().notify(`Đang đi đến ${p.name.toLowerCase()} · Giữ Shift để bước nhanh`);},
  stand:()=>{const s=get();if(s.seated){const seat=seats.find(c=>c.id===s.seated)!;const x=seat.position[0]+Math.sin(seat.rotation)*1.1,z=seat.position[2]+Math.cos(seat.rotation)*1.1;set({teleport:{position:[x,floorAt(x,z)+.08,z],heading:seat.rotation,at:Date.now()}});}set({seated:null,pendingSeat:null,action:'walk',destination:null,bow:null});if(s.meal?.status==='eating')set({meal:{...s.meal,status:'ready',eatUntil:undefined}});},
  finishBow:()=>{const s=get();if(s.action==='bow'&&s.bow&&Date.now()-s.bow.at>=bowDuration(s.bow.mode)*1000)set({action:s.seated?'sit':'walk',bow:null});},
  sit:(id,action='sit')=>{const s=get();if(s.seated&&!id){if(action==='sit'){s.stand();return;}set({action,bow:null});return;}const seat=id?seats.find(c=>c.id===id):nearestSeat(s.position,action==='meditate'||action==='chant'||action==='mok'?['cushion']:['cushion','bench','tea']);if(!seat)return;
    if(s.peers.some(p=>p.seat===seat.id)){s.notify('Chỗ này đang có người ngồi. Bạn chọn chỗ bên cạnh nhé.');return;}
    if(s.seated===seat.id){set({action,bow:null});return;}s.stand();set({pendingSeat:seat.id,pendingAction:action,destination:[seat.position[0],seat.position[2]],panel:null});s.notify(`Đến ${seat.label.toLowerCase()} · Nhấn E để đứng dậy`);
  },
  perform:activity=>{const s=get();if(activity==='bow'&&s.action==='bow'&&s.bow&&Date.now()-s.bow.at<bowDuration(s.bow.mode)*1000)return;if(['incense','flower','candle'].includes(s.action))return;
    if(activity==='flower'||activity==='candle'){
      const config=templeOffering[activity];if(distance(s.position,config.spot)>OFFERING_RANGE){s.stand();set({destination:config.approach,panel:null});s.notify('Đến bàn '+(activity==='flower'?'dâng hoa trên bàn thờ':'dâng đèn trên bàn thờ')+' rồi bấm lại để thực hiện.');return;}
      if(s.inventory[activity]<1){set({panel:'bag'});s.notify('Vật phẩm đã hết. Mở túi vải để đổi thêm.');return;}
      if(s.offerings[activity].filter(at=>Date.now()-at<config.lifetime).length>=OFFERING_CAPACITY){s.notify('Bàn đã đủ lễ vật. Mời bạn đợi một chút rồi quay lại.');return;}
      s.stand();set({action:activity,panel:null,event:{type:activity,at:Date.now(),x:s.position[0],z:s.position[1]}});s.notify(activity==='flower'?'Đang thành tâm dâng hoa…':'Đang châm đèn sen…');return;
    }
    if(activity==='incense'&&nearBodhiAltar(s.position)){if(s.event&&Date.now()-s.event.at<900)return;if(s.inventory.incense<1){set({panel:'bag'});return;}set({inventory:{...s.inventory,incense:s.inventory.incense-1},bodhiIncense:s.bodhiIncense+1,event:{type:'incense',at:Date.now(),x:BODHI.x,z:BODHI.altarZ}});s.record('incense');return;}
    if(activity==='incense'){
      if(distance(s.position,incenseSpot)>INCENSE_RANGE||distance(s.position,incenseSpot)<INCENSE_CLEARANCE){s.stand();set({destination:incenseApproach,panel:null});s.notify('Đến trước lư hương, rồi nhấn E để dâng hương.');return;}
      if(s.inventory.incense<1){set({panel:'bag'});s.notify('Bạn đã hết hương. Mở túi vải để đổi thêm.');return;}
      s.stand();set({action:'incense',destination:null,pendingSeat:null,panel:null,event:{type:'incense',at:Date.now(),x:s.position[0],z:s.position[1]}});s.notify('Thành tâm dâng một nén hương…');return;
    }
if(activity==='pray'||activity==='beads'){set({action:s.action===activity?(s.seated?'sit':'walk'):activity,destination:null,pendingSeat:null,bow:null});return;}if(s.event&&Date.now()-s.event.at<900)return;
    if(activity==='meditate'||activity==='chant'||activity==='mok'){if(s.action===activity){s.stand();return;}const target=activity==='chant'||activity==='mok'?seats.find(c=>c.zone==='hall'&&!s.peers.some(p=>p.seat===c.id)):undefined;s.sit(target?.id,activity);return;}
    if(activity==='meal'){if(s.seated&&seats.find(c=>c.id===s.seated)?.kind==='dining'){set({panel:'menu'});}else{const seat=nearestSeat(s.position,['dining']);s.sit(seat.id,'sit');s.notify('Mời bạn đến nhà ăn, ngồi vào ghế rồi mở thực đơn.');}return;}
    if(activity==='tea'){if(!s.seated||seats.find(c=>c.id===s.seated)?.kind!=='tea'){s.sit(nearestSeat(s.position,['tea']).id);return;}s.record('tea');set({energy:Math.min(100,s.energy+10),event:{type:activity,at:Date.now(),x:s.position[0],z:s.position[1]}});s.notify('Một tách trà ấm. +10 năng lượng');return;}
    if(activity==='read'){if(zoneAt(s.position).id!=='library'){s.go('library');return;}set({panel:'library'});return;}
    const atBodhi=false;const zone=activities.find(a=>a.id===activity)?.zone;
    const anchor:Vec2=activity==='feed'?[18,5]:activity==='lantern'?[16,37]:zone?[place(zone).x,place(zone).z]:s.position;
    if(zone&&distance(s.position,anchor)>(activity==='bell'?6:9)){s.stand();set({destination:anchor});s.notify(`Đến gần ${place(zone).name.toLowerCase()} để thực hiện.`);return;}
    if(activity==='lantern'){set({panel:'wish'});return;}
    const consumable=(['feed','incense','candle','flower'] as string[]).includes(activity)?activity as Item:null;
    if(consumable){if(s.inventory[consumable]<=0){set({panel:'bag'});s.notify('Vật phẩm đã hết. Ghé túi vải để đổi thêm.');return;}set({inventory:{...s.inventory,[consumable]:s.inventory[consumable]-1}});}
    if(activity==='sweep'){s.stand();set({action:s.action==='sweep'?'walk':'sweep'});}else if(['pray','beads'].includes(activity))set({action:s.action===activity?'sit' as Action:activity as Action});else if(activity==='bow'){const cushion=!!s.seated&&seats.find(c=>c.id===s.seated)?.kind==='cushion';if(!cushion)s.stand();set({action:'bow',bow:{at:Date.now(),mode:cushion?'cushion':'standing'},destination:null,pendingSeat:null});}
    set({event:{type:activity,at:Date.now(),x:atBodhi?BODHI.x:s.position[0],z:atBodhi?BODHI.altarZ:s.position[1]},...(atBodhi?{bodhiIncense:s.bodhiIncense+1}:{})});
    if(!['sweep','pray','beads'].includes(activity))s.record(activity);
    s.notify(activity==='sweep'?'Đi gần lá rụng để gom lá. Lá được tạo thêm theo thời gian.':activity==='feed'?'Đàn koi đang bơi về phía bữa ăn nhỏ.':activity==='bell'?'Nghe một tiếng chuông, trở về khoảnh khắc này.':activity==='bow'?'Một lạy thành tâm.':'Thả lỏng vai, chậm lại cùng hơi thở.');
  },
  orderMeal:id=>{const s=get();const seat=seats.find(c=>c.id===s.seated);if(!seat||seat.kind!=='dining'){s.notify('Bạn cần ngồi vào một ghế trong nhà ăn để gọi món.');return;}if(s.meal&&s.meal.status!=='finished'){s.notify('Bạn đang có một phần ăn. Dùng xong rồi gọi món tiếp nhé.');return;}if(!dishes.some(d=>d.id===id))return;set({meal:{dish:id,seatId:seat.id,status:'preparing',readyAt:Date.now()+5500},panel:null,action:'sit'});s.notify(`Bếp đang chuẩn bị ${dishes.find(d=>d.id===id)!.name.toLowerCase()}. Món sẽ tới bàn trong giây lát.`);},
  eat:()=>{const s=get();if(!s.meal||s.meal.status!=='ready')return;if(s.seated!==s.meal.seatId){s.sit(s.meal.seatId);return;}set({meal:{...s.meal,status:'eating',eatUntil:Date.now()+9000},action:'eat'});s.notify('Ăn chậm, trân trọng từng hương vị.');},
  tick:()=>{const s=get();s.checkDay();
    const fresh={flower:s.offerings.flower.filter(at=>Date.now()-at<templeOffering.flower.lifetime),candle:s.offerings.candle.filter(at=>Date.now()-at<templeOffering.candle.lifetime)};
    if(fresh.flower.length!==s.offerings.flower.length||fresh.candle.length!==s.offerings.candle.length)set({offerings:fresh});
    if((s.action==='flower'||s.action==='candle')&&s.event?.type===s.action&&Date.now()-s.event.at>=OFFERING_DURATION){const kind=s.action;
      if(distance(s.position,templeOffering[kind].spot)<=OFFERING_RANGE&&s.inventory[kind]>0&&fresh[kind].length<OFFERING_CAPACITY){set({action:'walk',inventory:{...s.inventory,[kind]:s.inventory[kind]-1},offerings:{...fresh,[kind]:[...fresh[kind],Date.now()]}});s.record(kind);s.notify(kind==='flower'?'Hoa đã được đặt lên bàn. +2 công đức':'Đèn sen đã được thắp. +2 công đức');}else set({action:'walk'});
    }

    const burning=s.burningIncense.filter(at=>Date.now()-at<INCENSE_BURN_MS);if(burning.length!==s.burningIncense.length)set({burningIncense:burning});
    if(s.action==='incense'&&s.event?.type==='incense'&&Date.now()-s.event.at>=INCENSE_DURATION){
      if(distance(s.position,incenseSpot)<=INCENSE_RANGE&&s.inventory.incense>0){set({inventory:{...s.inventory,incense:s.inventory.incense-1},burningIncense:[...burning,Date.now()],action:'walk'});s.record('incense');s.notify('Đã dâng một nén hương. +2 công đức');}else set({action:'walk'});
    }
const zone=zoneAt(s.position);if(!s.visited.includes(zone.id)&&distance(s.position,[zone.x,zone.z])<12)set({visited:[...s.visited,zone.id]});set({sessionSeconds:s.sessionSeconds+1});
    if(s.meal?.status==='preparing'&&Date.now()>=s.meal.readyAt){set({meal:{...s.meal,status:'ready'}});s.notify('Bữa chay đã được đặt lên bàn. Chúc bạn ăn ngon miệng!');}
    if(s.meal?.status==='eating'&&s.action==='eat'&&s.seated===s.meal.seatId&&Date.now()>=(s.meal.eatUntil||Infinity)){const dish=dishes.find(d=>d.id===s.meal!.dish)!;s.record('meal');set({meal:{...s.meal,status:'finished'},action:'sit',energy:Math.min(100,s.energy+dish.energy),tasted:s.tasted.includes(dish.id)?s.tasted:[...s.tasted,dish.id]});s.notify(`Bữa ${dish.name.toLowerCase()} đã hoàn thành. +${dish.energy} năng lượng · +2 công đức`);}
  },
  garden:id=>{const s=get(),plot=gardenPlots.find(p=>p.id===id);if(!plot)return;if(distance(s.position,[plot.x,plot.z])>3){s.stand();set({destination:[plot.x,plot.z+1]});s.notify('Đến gần luống rau rồi bấm lại để chăm cây.');return;}const p=s.plots[id];if(!p||p.harvested){if(s.inventory.seed<1){set({panel:'bag'});s.notify('Bạn đã hết hạt giống.');return;}set({plots:{...s.plots,[id]:{plantedAt:Date.now(),wateredAt:null,harvested:false}},inventory:{...s.inventory,seed:s.inventory.seed-1}});s.record('plant');s.notify('Hạt giống đã được gieo. Bấm vào luống lần nữa để tưới.');}else if(!p.wateredAt){set({plots:{...s.plots,[id]:{...p,wateredAt:Date.now()}}});s.record('water');s.notify('Đã tưới nước. Cây sẽ sẵn sàng thu hoạch sau 60 giây.');}else if(Date.now()-p.wateredAt>=60000){set({plots:{...s.plots,[id]:{...p,harvested:true}},inventory:{...s.inventory,vegetable:s.inventory.vegetable+3}});s.record('harvest');s.notify('Thu hoạch được 3 bó rau. +2 công đức');}else s.notify(`Cây đang lớn. Còn ${Math.ceil((60000-Date.now()+p.wateredAt)/1000)} giây nữa.`);},
  buy:item=>{const s=get();if(item==='vegetable')return;const cost=item==='lantern'?12:6,qty=item==='feed'?10:item==='seed'?8:5;if(s.merit<cost){s.notify(`Cần ${cost} công đức để đổi thêm.`);return;}set({merit:s.merit-cost,inventory:{...s.inventory,[item]:s.inventory[item]+qty}});s.notify(`Đã thêm ${qty} vật phẩm vào túi.`);},
  claim:id=>{get().checkDay();const s=get(),t=dailyTasks.find(t=>t.id===id);if(!t||s.claimed.includes(id)||s.progress[t.id]<t.target)return;set({claimed:[...s.claimed,id],merit:s.merit+t.reward});s.notify(`Nhận ${t.reward} công đức từ việc lành hôm nay.`);},
  claimBadge:id=>{const s=get(),a=achievements.find(a=>a.id===id);if(!a||s.badges.includes(id)||achievementValue(s,a.metric)<a.target)return;set({badges:[...s.badges,id],merit:s.merit+a.reward});s.notify(`Dấu mốc mới: ${a.title}. +${a.reward} công đức`);},
  read:id=>{if(!scriptures.some(b=>b.id===id))return;const s=get();set({scripture:id});if(!s.readBooks.includes(id)){set({readBooks:[...s.readBooks,id]});s.record('read');}},
  releaseWish:text=>{const s=get();if(s.inventory.lantern<1){set({panel:'bag'});s.notify('Bạn đã hết hoa đăng.');return;}const clean=text.trim().slice(0,160);set({inventory:{...s.inventory,lantern:s.inventory.lantern-1},wishes:[{text:clean||'Cầu mong mọi người đều được bình an.',at:Date.now()},...s.wishes].slice(0,30),event:{type:'lantern',at:Date.now(),x:s.position[0],z:s.position[1]},panel:null});s.record('lantern');s.notify('Lời nguyện đã theo ánh hoa đăng trôi trên hồ sen.');},
}),{name:'sen-an-nhien-v1',storage:createJSONStorage(()=>createBufferedStorage(()=>window.localStorage)),version:3,migrate:(stored:any)=>({...stored,inventory:{feed:20,lantern:5,incense:10,candle:8,flower:8,seed:12,vegetable:0,...stored.inventory},progress:{...emptyProgress(),...stored.progress},lifetime:{...emptyProgress(),...stored.progress,...stored.lifetime}}),
  partialize:s=>({bodhiIncense:s.bodhiIncense,offerings:s.offerings,burningIncense:s.burningIncense,name:s.name,robe:s.robe,gender:s.gender,skin:s.skin,robeStyle:s.robeStyle,characterConfigured:s.characterConfigured,merit:s.merit,peace:s.peace,experience:s.experience,energy:s.energy,day:s.day,started:s.started,progress:s.progress,lifetime:s.lifetime,inventory:s.inventory,claimed:s.claimed,badges:s.badges,visited:s.visited,readBooks:s.readBooks,tasted:s.tasted,plots:s.plots,wishes:s.wishes,night:s.night,sound:s.sound,quality:s.quality,camera:s.camera}),
}));
