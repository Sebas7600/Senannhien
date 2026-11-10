import {useState} from 'react';
import {ArrowUpRight,Check,Flower2,MapPin,Store} from 'lucide-react';
import {useGame,type Item,type Activity} from './gameStore';
import {souvenirCollectibles} from './souvenirData';
import {shopProducts,supplyProduct} from './shopData';
import {equipmentSlot,equipmentSlots} from './equipmentData';
import {openSouvenirStall} from './souvenirActions';
import {itemInfo} from './uiIcons';
import {ShopProductArt} from './SouvenirPanel';
import './souvenirs.css';
export default function InventoryBag(){
 const inventory=useGame(s=>s.inventory),owned=useGame(s=>s.souvenirs),equipment=useGame(s=>s.equipment),energy=useGame(s=>s.energy),merit=useGame(s=>s.merit),[tab,setTab]=useState<'equipment'|'supplies'>('supplies');
 const visit=(item:Item)=>{const product=supplyProduct(item);if(!product)return;useGame.getState().set({shopFocus:product.id});openSouvenirStall(product.stall);};
 const use=(id:Item)=>{const s=useGame.getState();if(id==='seed'){s.go('garden');return;}s.set({panel:null});s.perform(id as Activity);};
 return <div className="inventory-bag"><div className="bag-balance"><Flower2 size={18}/>{merit} công đức<span>Mua thêm tại quầy · Túi dùng để cất và sử dụng đồ</span></div>
  <div className="panel-tabs" role="tablist" aria-label="Ngăn Túi vải"><button role="tab" aria-selected={tab==='supplies'} className={tab==='supplies'?'selected':''} onClick={()=>setTab('supplies')}>Vật phẩm tiêu hao</button><button role="tab" aria-selected={tab==='equipment'} className={tab==='equipment'?'selected':''} onClick={()=>setTab('equipment')}>Trang bị <span>{owned.length}/{souvenirCollectibles.length}</span></button></div>
  {tab==='equipment'?<><p className="inventory-hint">Một món đeo cổ, một vòng tay và một món cầm hai tay. Đồ cầm tự cất tạm khi thực hiện hoạt động.</p><div className="equipment-grid">{souvenirCollectibles.map(item=>{const product=shopProducts.find(p=>p.id===item.id)!,has=owned.includes(item.id),slot=equipmentSlot(item.id)!,active=equipment[slot]===item.id;return <article key={item.id} className={'equipment-card'+(active?' equipped':'')}><ShopProductArt item={product}/><h3>{item.name}</h3><p>{equipmentSlots[slot].label}</p>{has?<button className="button ghost" aria-pressed={active} onClick={()=>useGame.getState().equipSouvenir(item.id)}>{active?<><Check size={14}/>Cất vào túi</>:equipmentSlots[slot].label}</button>:<button className="text-btn" onClick={()=>{useGame.getState().set({shopFocus:item.id});openSouvenirStall(item.id);}}><MapPin size={14}/>Đến quầy mua</button>}</article>;})}</div></>:<><p className="inventory-hint">Dùng một lần trừ một đơn vị. Mỗi món có quầy bán riêng; rau đã hái nhận từ vườn.</p><div className="bag-grid">{(Object.keys(itemInfo) as Item[]).map(id=>{const item=itemInfo[id],Icon=item.icon,count=inventory[id]??0;return <article className="bag-item" key={id}><div className="bag-item-icon"><Icon size={26}/><span>{count}</span></div><div><h3>{item.name}</h3><p>{id==='fruit'?'Dâng lên bàn thờ hoặc dùng để hồi 8 năng lượng':item.desc}</p><div className="bag-item-actions">{id==='fruit'?<><button className="text-btn" disabled={!count} onClick={()=>useGame.getState().offerFruit()}>Dâng trái cây <ArrowUpRight size={13}/></button><button className="text-btn" disabled={!count||energy>=100} onClick={()=>useGame.getState().eatFruit()}>Dùng trái cây</button></>:id!=='vegetable'&&<button className="text-btn" disabled={!count} onClick={()=>use(id)}>{id==='seed'?'Ghé vườn rau':'Sử dụng'} <ArrowUpRight size={13}/></button>}</div>{id!=='vegetable'&&<button className="bag-visit-shop" onClick={()=>visit(id)}><Store size={12}/>Đến quầy mua thêm</button>}</div></article>;})}</div></>}
 </div>;
}
