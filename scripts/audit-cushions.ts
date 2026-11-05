import fs from 'node:fs/promises';
import type {BufferGeometry} from 'three';
import {cushionNearGeometry,cushionFarGeometry} from '../src/cushionGeometry';
import {CUSHION} from '../src/cushionData';
import {seats,usesFloorSeat} from '../src/gameData';
const size=(g:BufferGeometry)=>({triangles:g.index!.count/3,bytes:Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+g.index!.array.byteLength});
const cushions=seats.filter(usesFloorSeat);
const result={name:'Bồ đoàn Liên Thủy',count:cushions.length,indoor:cushions.filter(s=>s.zone!=='bamboo').length,near:size(cushionNearGeometry),far:size(cushionFarGeometry),maxBasePassDrawCalls:2,selectionHaloDrawCalls:1,albedoAtlas:{width:1024,height:1024,fileBytes:(await fs.stat('public'+CUSHION.textureUrl)).size,gpuBaseBytes:1024*1024*4},sharedBump:{width:128,height:128,gpuBaseBytes:128*128*4,farEnabled:false},note:'Draw calls refer only to cushion batches in the base pass; shadow passes and other scene objects are excluded. GPU texture estimates exclude mipmaps. The richer cushion uses more triangles than the old flat discs, while instancing reduces draws. No FPS guarantee.'};
await fs.mkdir('artifacts/cushions',{recursive:true});await fs.writeFile('artifacts/cushions/asset-budget.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
