import {test,beforeEach,afterEach} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {GLTFLoader,MeshoptDecoder} from 'three-stdlib';
import {QUAN_AM,quanAmObstacles} from '../src/quanAmData';import {seats,walkable,INCENSE_DURATION,INCENSE_BURN_MS,INCENSE_STUB_MS,incenseApproach} from '../src/gameData';import {stoneBenches} from '../src/stoneBenchData';import {findPath,clearLine} from '../src/navigation';import {setOfferingTransport} from '../src/offeringTransport';import {quanAmVeinTexture} from '../src/quanAmMaterials';import * as altar from '../src/quanAmAltarGeometry';
import {webcrypto} from 'node:crypto';
import {GATE_ENTRY} from '../src/courtyardPropsData';
import {BRIDGE_ROAD,ISLAND} from '../src/pondLayout';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const memory=new Map<string,string>();Object.defineProperty(globalThis,'window',{value:{localStorage:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}}});
const {useGame,emptyProgress}=await import('../src/gameStore');const defaults=useGame.getInitialState(),realNow=Date.now;let now=1800000000000;
beforeEach(()=>{now=1800000000000;Date.now=()=>now;useGame.setState({...defaults,connection:'offline',position:[...QUAN_AM.approach],inventory:{...defaults.inventory,incense:3},progress:emptyProgress(),lifetime:emptyProgress()},true)});afterEach(()=>{Date.now=realNow;setOfferingTransport(null)});
async function load(file:string){const b=fs.readFileSync('public/assets/quan-am/'+file),loader=new GLTFLoader();loader.setMeshoptDecoder(typeof MeshoptDecoder==='function'?MeshoptDecoder():MeshoptDecoder);return (await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
test('Quan Am web models keep face and hand detail, three materials, bounded geometry and no external textures',async()=>{
 const report=JSON.parse(fs.readFileSync('public/assets/quan-am/asset-budget.json','utf8'));assert.equal(report.source,'Quan_Am_Converted.fbx');assert.equal(report.sourceMeshes,1389);assert.equal(report.sourceTriangles,164066);const boxes=[];
 for(const a of report.assets){const scene=await load(a.file);let triangles=0,draws=0;scene.traverse(o=>{if(!(o instanceof T.Mesh))return;draws++;triangles+=o.geometry.index!.count/3;for(const name of ['position','normal','color','uv'])assert.ok(Array.from(o.geometry.attributes[name].array).every(Number.isFinite));});assert.equal(triangles,a.triangles);assert.equal(draws,4);assert.ok(scene.getObjectByName('Dien_tuong_tay_chan'));assert.ok(a.bytes<550000);boxes.push(new T.Box3().setFromObject(scene));}
 assert.ok(report.assets[0].triangles<50000);assert.ok(report.assets[1].triangles<24000);assert.ok(report.assets[1].bytes<270000);assert.ok(boxes[0].getSize(new T.Vector3()).y>4.79&&boxes[0].getSize(new T.Vector3()).y<4.81);assert.ok(boxes[0].max.distanceTo(boxes[1].max)<.025);assert.ok(boxes[0].min.distanceTo(boxes[1].min)<.025);
 const texture=quanAmVeinTexture.image;assert.equal(texture.width,128);assert.equal(texture.height,128);assert.equal(texture.data.byteLength,65536);
 let triangles=0;for(const value of Object.values(altar))if(value instanceof T.BufferGeometry){triangles+=(value.index?.count??value.attributes.position.count)/3;assert.ok(Array.from(value.attributes.position.array).every(Number.isFinite));}assert.ok(triangles<8000,`${triangles} altar triangles`);
});
test('the island shrine is reachable from the gate, both shores and the wish station',()=>{
 assert.deepEqual([QUAN_AM.x,QUAN_AM.z],[ISLAND.x,ISLAND.z]);
 assert.equal(stoneBenches.some(b=>b.id===3),false);assert.equal(seats.some(s=>s.id.startsWith('bench-3-')),false);assert.equal(seats.length,138);assert.ok(walkable(...QUAN_AM.approach));assert.equal(quanAmObstacles.length,11);
 for(const start of [GATE_ENTRY,[15,15],[16.4,38.5],[BRIDGE_ROAD.x,18]] as [number,number][]){const path=findPath(start,QUAN_AM.approach);assert.ok(path.length,`${start}`);let from=start;for(const p of path){assert.ok(clearLine(from,p));from=p;}assert.deepEqual(from,QUAN_AM.approach);}
 assert.equal(walkable(QUAN_AM.x,QUAN_AM.z),false);assert.equal(walkable(QUAN_AM.tableX,QUAN_AM.tableZ),false);
});
test('Quan Am incense routes to its own altar, waits three seconds and consumes/rewards exactly once',()=>{
 useGame.setState({position:[0,22]});useGame.getState().perform('incense',QUAN_AM.incenseId);assert.deepEqual(useGame.getState().destination,QUAN_AM.approach);assert.equal(useGame.getState().inventory.incense,3);
 useGame.setState({position:[...QUAN_AM.approach]});useGame.getState().perform('incense',QUAN_AM.incenseId);assert.equal(useGame.getState().event?.target,QUAN_AM.incenseId);for(let i=0;i<10;i++)useGame.getState().perform('incense',QUAN_AM.incenseId);
 now+=INCENSE_DURATION-1;useGame.getState().tick();assert.equal(useGame.getState().merit,0);now++;useGame.getState().tick();useGame.getState().tick();const s=useGame.getState();assert.equal(s.inventory.incense,2);assert.equal(s.progress.incense,1);assert.equal(s.merit,2);assert.equal(s.burningIncense.length,1);assert.equal(s.offeringSlots[s.burningIncense[0]],QUAN_AM.incenseId);assert.equal(s.bodhiIncense,0);
 useGame.getState().tick();assert.equal(useGame.getState().offeringSlots[s.burningIncense[0]],QUAN_AM.incenseId,'location survives cleanup while incense is alive');
 now+=INCENSE_BURN_MS+INCENSE_STUB_MS;useGame.getState().tick();useGame.getState().tick();assert.equal(useGame.getState().burningIncense.length,0);assert.equal(Object.keys(useGame.getState().offeringSlots).length,0);
});
test('empty bags, cancelling and leaving Quan Am altar cannot consume incense or grant merit',()=>{
 useGame.setState({inventory:{...defaults.inventory,incense:0}});useGame.getState().perform('incense',QUAN_AM.incenseId);assert.equal(useGame.getState().action,'walk');assert.equal(useGame.getState().panel,'bag');
 useGame.setState({panel:null,inventory:{...defaults.inventory,incense:3}});useGame.getState().perform('incense',QUAN_AM.incenseId);useGame.getState().stand();now+=4000;useGame.getState().tick();assert.equal(useGame.getState().merit,0);
 useGame.getState().perform('incense',QUAN_AM.incenseId);useGame.setState({position:[0,22]});now+=4000;useGame.getState().tick();assert.equal(useGame.getState().inventory.incense,3);assert.equal(useGame.getState().burningIncense.length,0);
});
test('main temple incense remains independent and is not assigned to Quan Am',()=>{
 useGame.setState({position:[...incenseApproach]});useGame.getState().perform('incense');now+=INCENSE_DURATION;useGame.getState().tick();const s=useGame.getState();assert.equal(s.merit,2);assert.equal(s.burningIncense.length,1);assert.equal(s.offeringSlots[s.burningIncense[0]],undefined);
});
test('shared Quan Am incense sends the station, waits for acknowledgement and preserves supplies on rejection',async()=>{
 let accept!:()=>void,requests=0;setOfferingTransport(async request=>{assert.equal(request.station,QUAN_AM.incenseId);requests++;await new Promise<void>(r=>{accept=r});});useGame.setState({connection:'online'});useGame.getState().perform('incense',QUAN_AM.incenseId);now+=INCENSE_DURATION;useGame.getState().tick();useGame.getState().tick();assert.equal(requests,1);assert.equal(useGame.getState().inventory.incense,3);assert.equal(useGame.getState().merit,0);
 accept();await new Promise(r=>setTimeout(r,0));assert.equal(useGame.getState().merit,2);assert.equal(useGame.getState().inventory.incense,2);
 setOfferingTransport(async()=>{throw Error('offline')});useGame.getState().perform('incense',QUAN_AM.incenseId);now+=INCENSE_DURATION;useGame.getState().tick();await new Promise(r=>setTimeout(r,0));assert.equal(useGame.getState().inventory.incense,2);assert.equal(useGame.getState().merit,2);
});

test('Quan Am urn has an opaque sand cap visible through its mouth',async()=>{
 const T=await import('three');const {quanAmAshGeometry,altarAshMaterial}=await import('../src/quanAmAltarGeometry');
 const sand=new T.Mesh(quanAmAshGeometry,altarAshMaterial);sand.updateMatrixWorld();
 const ray=new T.Raycaster(new T.Vector3(0,3,2.7),new T.Vector3(0,-1,0));
 const hits=ray.intersectObject(sand);assert.ok(hits.length>0);assert.ok(hits[0].point.y>1.34);assert.equal(altarAshMaterial.transparent,false);
});
