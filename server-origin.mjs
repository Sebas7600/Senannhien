const loopback=new Set(['localhost','127.0.0.1','[::1]']);
/** Browsers on the Wi-Fi address must have the same authority as the server.
 * Keep Vite's loopback proxy working without allowing foreign web origins. */
export function allowedBrowserOrigin(origin,host){
  if(!origin)return true;
  try{
    const source=new URL(origin),target=new URL(`http://${host}`);
    if(source.protocol!=='http:'||source.username||source.password||source.pathname!=='/'||source.search||source.hash)return false;
    return source.host===target.host||(loopback.has(source.hostname)&&loopback.has(target.hostname));
  }catch{return false;}
}
