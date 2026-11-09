let sequence=0;

/** Session/operation identifiers, not authentication credentials. Works over LAN HTTP. */
export function createClientId():string {
  const source=globalThis.crypto;
  if(typeof source?.randomUUID==='function'){
    try{return source.randomUUID();}catch{/* Try the API also available outside secure contexts. */}
  }
  if(typeof source?.getRandomValues==='function'){
    try{
      const bytes=source.getRandomValues(new Uint8Array(16));
      bytes[6]=(bytes[6]&0x0f)|0x40;
      bytes[8]=(bytes[8]&0x3f)|0x80;
      const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }catch{/* A restricted WebView can still keep a distinct local session. */}
  }
  return `local-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2,12)}`;
}
