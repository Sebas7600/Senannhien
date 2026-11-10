import {merchantFor} from './merchantData';
import {lazy,Suspense,useState,useEffect} from 'react';
import {ArrowRight,Check,Flower2,Store,Move3D} from 'lucide-react';
import {useGame} from './gameStore';
import {atSouvenirStall,nearestSouvenirStall,souvenirCatalog,souvenirStalls,souvenirCollectibles,type SouvenirId} from './souvenirData';
import {openSouvenirStall} from './souvenirActions';
import {shopProducts,productsAtStall,type ShopProduct} from './shopData';
import {equipmentSlot,equipmentSlots} from './equipmentData';
import {itemInfo} from './uiIcons';
import './souvenirs.css';
const SouvenirInspector=lazy(()=>import('./SouvenirInspector'));

export function ProductArt({id,color}:{id:SouvenirId;color:string}){
 const beadLoop=(x:number,y:number,r:number,n:number)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return <circle key={`${x}-${y}-${i}`} cx={x+Math.sin(a)*r} cy={y+Math.cos(a)*r} r={r*.135} fill={i===0?'#c5a461':color} stroke="#fff9e5" strokeOpacity=".23" strokeWidth=".7"/>;});
 const lotus=<g fill={color} stroke="#f7eace" strokeWidth="1.4"><path d="M120 134Q87 124 82 101Q112 100 120 126Q130 101 158 101Q154 126 120 134Z"/><path d="M120 128Q98 99 120 79Q142 99 120 128Z"/></g>;
 return <svg viewBox="0 0 240 180" role="img" aria-label={souvenirCatalog.find(i=>i.id===id)!.name}>
  <ellipse cx="120" cy="150" rx="63" ry="9" fill="#445745" opacity=".09"/>
  {id==='fruit'?<g><path d="M55 110H185L173 148H67Z" fill="#b79a67" stroke="#96764d" strokeWidth="2"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${74+i*23} 114L${77+i*21} 146`} stroke="#dbc295" strokeWidth="3"/>)}<circle cx="88" cy="101" r="23" fill="#dba449"/><circle cx="138" cy="105" r="24" fill="#b6674a"/><circle cx="115" cy="79" r="23" fill="#d5ae55"/><path d="M115 62Q123 41 139 55Q127 65 115 62Z" fill="#758a50"/><path d="M148 68Q182 102 178 117Q158 108 148 68Z" fill="#d4bd61"/></g>:id==='incensePack'?<g>{Array.from({length:11},(_,i)=><g key={i} transform={`rotate(${(i-5)*2.1} 120 132)`}><path d={`M${104+i*3.2} 38V119`} stroke={i%2?'#b9a17b':'#a78b62'} strokeWidth="2.3"/><path d={`M${104+i*3.2} 119V153`} stroke="#ac5340" strokeWidth="2.3"/></g>)}<path d="M98 94H144V125H98Z" fill="#b35c43"/><path d="M104 99H138V119H104Z" fill="#d0b27a"/>{<g transform="translate(81 82) scale(.32)">{lotus}</g>}</g>:id==='mala'?<g>{beadLoop(120,85,48,27)}<circle cx="120" cy="137" r="8" fill="#b29158"/><path d="M120 144V165M115 146L111 162M125 146L129 162" stroke="#a25d48" strokeWidth="3" strokeLinecap="round"/></g>:id==='bracelet'?<g>{beadLoop(98,109,35,18)}{beadLoop(145,85,32,18)}</g>:id==='sutra'?<g transform="rotate(-9 120 90)"><path d="M69 44H163V140H69Q56 140 56 131V53Q56 44 69 44Z" fill={color}/><path d="M68 47V135M75 54H155V129H75Z" fill="none" stroke="#c9b27b" strokeWidth="1.5"/><path d="M163 48L179 58V143L163 140Z" fill="#e7d7b3"/><path d="M169 60V135M174 65V138" stroke="#bcae8c"/>{lotus}<path d="M60 60H71M60 77H71M60 94H71M60 111H71M60 128H71" stroke="#ddcba4" strokeWidth="2"/></g>:id==='buddha'?<g fill={color} stroke="#7b6d50" strokeWidth="1"><path d="M87 124Q65 136 67 145H173Q174 135 151 124Z"/><path d="M119 78Q99 78 99 105L79 123Q81 139 119 129Q157 139 162 122L140 105Q140 78 119 78Z"/><ellipse cx="120" cy="62" rx="16" ry="21"/><path d="M104 50Q99 32 119 31Q141 32 136 50Z"/><circle cx="120" cy="29" r="7"/><path d="M109 61L115 62M126 62L132 61M115 73Q120 76 125 73M110 87Q110 110 136 118M104 116Q120 124 135 116" fill="none" stroke="#726047" strokeWidth="1.7"/><path d="M75 146H166L155 155H87Z"/></g>:<g><path d="M76 35Q81 97 120 123Q159 97 164 35" fill="none" stroke={id==='necklace'?'#baa06d':'#7b5b43'} strokeWidth="3"/><ellipse cx="120" cy="123" rx={id==='pendant'?25:22} ry="29" fill="#b99b62"/><ellipse cx="120" cy="123" rx="20" ry="24" fill={id==='pendant'?'#759b88':'#d9c698'}/>{id==='necklace'?lotus:<g fill="#e8dcb6"><circle cx="120" cy="111" r="6"/><path d="M115 119Q102 135 107 139H134Q136 132 125 119Z"/></g>}</g>}
 </svg>;
}
export function SouvenirContext(){const position=useGame(s=>s.position),started=useGame(s=>s.started),panel=useGame(s=>s.panel),quest=useGame(s=>s.waterQuest),stall=nearestSouvenirStall(position);if(!started||panel||quest||!atSouvenirStall(position,stall,4.8))return null;return <div className="souvenir-context"><button onClick={()=>openSouvenirStall(stall.id)}><Store size={18}/><span>Ghé quầy {souvenirCatalog.find(i=>i.id===stall.id)!.short.toLocaleLowerCase('vi')}<small>{merchantFor(stall.id).name} · Xem vật phẩm · E</small></span><ArrowRight size={16}/></button></div>;}
export function ShopProductArt({item}:{item:ShopProduct}){
 if(item.model)return <ProductArt id={item.model} color={item.color}/>;
 const Icon=itemInfo[item.inventoryItem!].icon;
 return <div className="supply-product-art" style={{color:item.color}}><span><Icon size={65} strokeWidth={1.2}/></span><small>+{item.quantity} · {itemInfo[item.inventoryItem!].name}</small></div>;
}
export default function SouvenirPanel(){
 const focus=useGame(s=>s.souvenirFocus),shopFocus=useGame(s=>s.shopFocus),[selected,setSelected]=useState(shopFocus??focus??'mala'),[browseAll,setBrowseAll]=useState(!focus),[inspect,setInspect]=useState(false);
 const merit=useGame(s=>s.merit),owned=useGame(s=>s.souvenirs),inventory=useGame(s=>s.inventory),equipment=useGame(s=>s.equipment),position=useGame(s=>s.position);
 useEffect(()=>{setSelected(shopFocus??focus??'mala');setBrowseAll(!focus);setInspect(false);},[focus,shopFocus]);
 const item=shopProducts.find(product=>product.id===selected)??shopProducts[0],merchant=merchantFor(focus??item.stall),stall=souvenirStalls.find(stall=>stall.id===item.stall)!,near=atSouvenirStall(position,stall);
 const supply=item.inventoryItem,has=!supply&&owned.includes(item.id as SouvenirId),slot=equipmentSlot(item.id),equipped=!!slot&&equipment[slot]===item.id;
 const products=focus&&!browseAll?productsAtStall(focus):shopProducts;
 return <div className="souvenir-shop">
  <div className="souvenir-intro"><span><Store size={16}/> PHỐ HÀNG AN NHIÊN</span><p>Chọn vừa đủ, mang theo bình an.</p><div><Flower2 size={15}/><strong>{merit}</strong> công đức</div></div>
  <div className="merchant-welcome"><span className="merchant-initial" style={{background:merchant.robe}}>{merchant.name.split(' ').at(-1)?.[0]}</span><div><strong>{merchant.name}<small>{focus&&!browseAll?'Đang xem hàng tại quầy':'Danh mục các quầy'}</small></strong><p>{merchant.greeting}</p></div></div>
  <div className="shop-browse-bar"><span>{focus&&!browseAll?'Mặt hàng của quầy này':'Tất cả trang bị và vật phẩm tiêu hao'}</span><button className="text-btn" onClick={()=>setBrowseAll(value=>!value)} disabled={!focus}>{browseAll?'Về quầy đang ghé':'Xem tất cả quầy'} <ArrowRight size={13}/></button></div>
  <div className="souvenir-layout"><div className="souvenir-grid" aria-label="Hàng hóa cửa hàng">
   {products.map(product=><button key={product.id} className={selected===product.id?'selected':''} aria-pressed={selected===product.id} onClick={()=>{setSelected(product.id);setInspect(false);}}><div className="souvenir-art"><ShopProductArt item={product}/>{!product.inventoryItem&&owned.includes(product.id as SouvenirId)&&<span className="souvenir-owned"><Check size={12}/>Đã sở hữu</span>}</div><strong>{product.name}</strong><small>{product.inventoryItem?`Tiêu hao · +${product.quantity} vào túi`:equipmentSlots[equipmentSlot(product.id)!].label}</small><span className="souvenir-price"><Flower2 size={13}/>{product.cost} công đức</span></button>)}
  </div><article className={'souvenir-detail'+(inspect?' inspecting':'')} aria-live="polite"><span className="souvenir-detail-eyebrow">{supply?'VẬT PHẨM TIÊU HAO':'TRANG BỊ CỦA BẠN'}</span>
   {inspect&&item.model?<Suspense fallback={<ShopProductArt item={item}/>}><SouvenirInspector key={item.id} id={item.model}/></Suspense>:<div className="souvenir-detail-art"><ShopProductArt item={item}/></div>}
   {item.model&&<button className="souvenir-inspect-toggle" aria-pressed={inspect} onClick={()=>setInspect(v=>!v)}><Move3D size={14}/>{inspect?'Trở về hình minh họa':'Xem mô hình 3D · 360°'}</button>}
   <h3>{item.name}</h3><span className="souvenir-material">{item.material}</span><p>{item.description}</p><p>{item.detail}</p>
   {supply?<div className="souvenir-stock">Trong túi: <strong>{inventory[supply]}</strong><small>Mỗi lần mua +{item.quantity} · Dùng mỗi lần trừ một đơn vị</small></div>:<div className="souvenir-stock">{slot&&equipmentSlots[slot].label}<small>Mua một lần · Trang bị và cất đồ trong Túi vải{slot==='hand'?' · Tạm cất khi làm việc hoặc làm lễ':''}</small></div>}
   {has?<button className="button primary" onClick={()=>useGame.getState().equipSouvenir(item.id)}><Check size={16}/>{equipped?'Cất vào Túi vải':slot&&equipmentSlots[slot].label}</button>:near?<button className="button primary" disabled={merit<item.cost} onClick={()=>useGame.getState().buySouvenir(item.id)}><Flower2 size={16}/>Mua · {item.cost} công đức</button>:<button className="button primary" onClick={()=>{useGame.getState().set({shopFocus:item.id});openSouvenirStall(item.stall);}}>Đến đúng quầy {stall.number}<ArrowRight size={16}/></button>}
   {!has&&near&&merit<item.cost&&<small className="souvenir-balance">Cần thêm {item.cost-merit} công đức.</small>}
   <small className="souvenir-note">{near?'Bạn đang ở đúng quầy bán món này.':'Chỉ mua được khi đến gần đúng quầy.'} Bữa chay ở nhà ăn vẫn miễn phí.</small>
  </article></div>
 </div>;
}
