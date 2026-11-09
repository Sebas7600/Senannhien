import {useState} from 'react';
import {ArrowLeft,ArrowRight,Armchair,BookOpen,Check,ChevronLeft,ChevronRight,Flower2} from 'lucide-react';
import {seats,scriptures} from './gameData';
import {useGame} from './gameStore';
import {BookArt} from './RitualArt';

// Add future books here with their own page data, without flattening the catalogue.
export const libraryBooks=[{id:'stillness',title:'Một trang tĩnh lặng',description:'Bốn bài thực tập nhỏ, để mang sự bình yên vào từng ngày.',pages:scriptures}];
export default function ReadingLibrary(){
  const s=useGame(),[bookId,setBook]=useState<string|null>(null),[pageId,setPage]=useState<string|null>(null);
  const book=libraryBooks.find(b=>b.id===bookId),page=book?.pages.find(p=>p.id===pageId),index=book?.pages.findIndex(p=>p.id===pageId)??-1;
  const seat=seats.find(c=>c.id===s.seated),open=(id:string)=>{setPage(id);s.read(id);};
  return <div className="reading-library">
    <div className="reading-seat"><Armchair size={18}/><span>{seat?.kind==='reading'?`${seat.label} · Bạn đang ngồi đọc`:'20 bàn đơn · Mỗi người một khoảng lặng'}</span><button className="text-btn" onClick={()=>s.set({panel:'seats'})}>Đổi bàn</button></div>
    {!book?<><span className="catalogue-label">TỦ SÁCH TÀNG KINH CÁC</span><div className="book-catalogue">{libraryBooks.map(b=><button className="catalogue-book" aria-label={`Mở sách ${b.title}`} key={b.id} onClick={()=>{setBook(b.id);setPage(null)}}><div className="book-cover"><BookArt/><span>SEN AN NHIÊN</span><strong>{b.title}</strong><i>Chậm một trang, nhẹ một lòng.</i><Flower2 className="cover-flower" size={24} aria-hidden="true"/></div><div className="book-details"><span className="eyebrow">THỰC TẬP · {b.pages.length} TRANG</span><h3>{b.title}</h3><p>{b.description}</p><span className="book-open-link">Mở sách <ArrowRight size={18}/></span></div></button>)}</div><p className="catalogue-note">Chọn một cuốn sách để xem các trang bên trong.</p></>:<>
      <div className="book-toolbar"><button className="text-btn" onClick={()=>{setBook(null);setPage(null)}}><ArrowLeft size={16}/>Tủ sách</button><span>{book.title}</span></div>
      <div className="book-preview"><BookArt/><span>Lật một trang, trở về với mình.</span></div>
      <div className="library-layout"><div className="book-list" aria-label="Các trang trong sách">{book.pages.map((p,i)=><button key={p.id} className={p.id===pageId?'selected':''} aria-pressed={p.id===pageId} onClick={()=>open(p.id)}><BookOpen size={18}/><div><small>TRANG {String(i+1).padStart(2,'0')}</small><strong>{p.title}</strong></div>{s.readBooks.includes(p.id)&&<Check size={14}/>}</button>)}</div>
        {page?<article className="reading-page" key={page.id}><span className="eyebrow">{page.source}</span><h3>{page.title}</h3>{page.paragraphs.map((p,i)=><p key={i}>{p}</p>)}<div className="page-navigation"><button className="button ghost" disabled={index<=0} onClick={()=>open(book.pages[index-1].id)}><ChevronLeft size={17}/>Trang trước</button><span>{index+1} / {book.pages.length}</span><button className="button ghost" disabled={index===book.pages.length-1} onClick={()=>open(book.pages[index+1].id)}>Trang sau<ChevronRight size={17}/></button></div></article>:<div className="reading-placeholder"><BookOpen size={36} strokeWidth={1}/><h3>Một khoảng lặng cho bạn</h3><p>Chọn một trang ở danh sách để bắt đầu đọc.</p></div>}
      </div>
    </>}
  </div>;
}
