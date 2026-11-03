import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const values=new Map<string,string>();let writes=0;
const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{writes++;values.set(key,value)},removeItem:(key:string)=>values.delete(key)} as Storage;
Object.defineProperty(globalThis,'window',{value:{localStorage:storage}});
const {useGame}=await import('../src/gameStore.ts');
const {createBufferedStorage}=await import('../src/saveStorage.ts');
const {normalizeDonationNote}=await import('../src/DonationPanel.tsx');
const defaults=useGame.getInitialState();
beforeEach(()=>useGame.setState({...defaults},true));
test('rapid prayer toggles always return a standing character to walking, even during event cooldown',()=>{
  useGame.setState({event:{type:'bell',at:Date.now(),x:0,z:0}});
  for(let i=0;i<30;i++){useGame.getState().perform('pray');assert.equal(useGame.getState().action,i%2===0?'pray':'walk');assert.equal(useGame.getState().seated,null)}
});
test('prayer toggles on a real seat retain the seat and return to sitting',()=>{
  useGame.setState({seated:'temple-0',action:'sit'});useGame.getState().perform('pray');assert.equal(useGame.getState().action,'pray');useGame.getState().perform('pray');assert.equal(useGame.getState().action,'sit');assert.equal(useGame.getState().seated,'temple-0');
});
test('new and migrated V2 journeys open character selection without losing progress',async()=>{
  assert.equal(defaults.characterConfigured,false);
  const migrate=useGame.persist.getOptions().migrate!;
  const old:any=await migrate({name:'Sen',started:true,merit:125,inventory:{feed:7},progress:{meal:2}},2);
  const merged={...defaults,...old};assert.equal(merged.characterConfigured,false);assert.equal(merged.merit,125);assert.equal(merged.inventory.feed,7);assert.equal(merged.progress.meal,2);
  const partialize=useGame.persist.getOptions().partialize!;
  const saved:any=partialize({...defaults,gender:'female',robe:'#79868c',skin:'#b58a66',robeStyle:'cross',characterConfigured:true});assert.equal(saved.gender,'female');assert.equal(saved.characterConfigured,true);assert.equal(saved.skin,'#b58a66');assert.ok(!('position' in saved));
});
test('movement snapshots do not write storage, while changed preferences are buffered and latest state wins',async()=>{
  const key='sen-v3-buffer-test',buffer=createBufferedStorage(()=>storage),pause=()=>new Promise(resolve=>setTimeout(resolve,550));
  await pause();const start=writes;
  buffer.setItem(key,'A');for(let i=0;i<100;i++)buffer.setItem(key,'A');assert.equal(writes,start);await pause();assert.equal(writes,start+1);
  for(let i=0;i<100;i++)buffer.setItem(key,'A');await pause();assert.equal(writes,start+1);
  buffer.setItem(key,'B');buffer.setItem(key,'C');await pause();assert.equal(values.get(key),'C');assert.equal(writes,start+2);
  buffer.setItem(key,'D');buffer.setItem(key,'C');await pause();assert.equal(values.get(key),'C');assert.equal(writes,start+2);
});
test('donation ships without any recipient or active QR and normalizes optional bank note',async()=>{
  const config=JSON.parse(await readFile(new URL('../public/donation.json',import.meta.url),'utf8'));
  assert.equal(config.enabled,false);assert.equal(config.accountNumber,'');assert.equal(config.recipientName,'');assert.ok(config.qrImage.startsWith('/donate/'));
  assert.equal(normalizeDonationNote('An Nhiên Đỗ!'),'An Nhien Do');assert.equal(normalizeDonationNote('a'.repeat(40)).length,20);
});
