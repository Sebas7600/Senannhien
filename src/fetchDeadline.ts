// AbortSignal.timeout is absent in some Safari/WebView versions on LAN phones.
export async function fetchDeadline(url:string,options:RequestInit={},milliseconds=5000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),milliseconds);
  try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
}
