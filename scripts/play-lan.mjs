import {execFileSync,spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createGameServer} from '../server-runtime.mjs';

// Select a private Windows LAN, preferring Wi-Fi; never bind Hamachi/Public adapters.
function findLan(){
  const command=`$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; @(Get-NetIPConfiguration | Where-Object { $_.NetProfile.NetworkCategory -eq 'Private' } | ForEach-Object { $config=$_; foreach($address in $config.IPv4Address) { [pscustomobject]@{address=$address.IPAddress; wifi=($config.NetAdapter.NdisPhysicalMedium -eq 9 -or $config.InterfaceAlias -match 'Wi-?Fi|Wireless'); gateway=($null -ne $config.IPv4DefaultGateway)} } }) | ConvertTo-Json -Compress`;
  const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',windowsHide:true,timeout:15000}).trim();
  const result=output?JSON.parse(output):[],adapters=Array.isArray(result)?result:[result];
  const privateIPv4=/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  return adapters.filter(a=>privateIPv4.test(a.address)).sort((a,b)=>Number(b.wifi)-Number(a.wifi)||Number(b.gateway)-Number(a.gateway))[0]?.address;
}

function showAddress(url,reused){
  console.log(`\n  SEN AN NHIEN - CHOI QUA LAN\n\n  Dien thoai / tablet / may khac mo:\n  ${url}\n\n  Cac thiet bi can cung Wi-Fi/LAN voi may nay.\n  Neu Windows hoi tuong lua, cho phep Node.js tren mang Private.\n  ${reused?'May chu voi cung ban build da chay san.':'Giu cua so nay mo. Nhan Ctrl+C de dung may chu.'}\n`);
  if(!process.argv.includes('--no-open')){
    // The URL only contains the validated IPv4 address and numeric port.
    const browser=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Start-Process -FilePath '${url}'`],{windowsHide:true,stdio:'ignore'});
    browser.on('error',()=>console.log(`Mo trinh duyet va nhap ${url}`));browser.unref();
  }
}

async function main(){
  let index;
  try{index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');}
  catch{throw new Error('Khong tim thay ban build. Chay npm install va npm run build truoc.');}
  const port=Number(process.env.PORT||5174);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT phai la so tu 1 den 65535.');
  const host=findLan();
  if(!host)throw new Error('Khong tim thay IPv4 tren mang Private. Ket noi Wi-Fi/LAN va chon cau hinh mang Private trong Windows, roi mo lai file CMD.');
  const url=`http://${host}:${port}`,server=createGameServer();
  try{
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
    server.removeAllListeners('error');
    server.on('error',error=>{console.error(error.message);process.exitCode=1;});
    showAddress(url,false);
  }catch(error){
    if(error.code!=='EADDRINUSE')throw error;
    // Repeated double-clicks reuse this build, rather than starting a second game.
    try{
      const health=await fetch(`${url}/api/health`,{signal:AbortSignal.timeout(2000)});
      const page=await fetch(url,{signal:AbortSignal.timeout(2000)});
      const info=await health.json();
      if(!health.ok||!info.ok||info.version!==4||!page.ok||(await page.text())!==index)throw new Error('different server');
    }catch{throw new Error(`Cong ${port} dang duoc chuong trinh hoac ban game khac su dung. Dong may chu cu hoac dat PORT khac roi thu lai.`);}
    showAddress(url,true);
  }
}
main().catch(error=>{console.error(`\nKhong mo duoc LAN: ${error.message}`);process.exitCode=1;});
