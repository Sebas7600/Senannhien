import fs from 'node:fs/promises';
import type {BufferGeometry} from 'three';
import {cushionNearGeometry,cushionFarGeometry} from '../src/cushionGeometry';
import {CUSHION} from '../src/cushionData';
import {cushionSeats} from '../src/cushionPlacement';
const size=(g:BufferGeometry)=>({triangles:g.index!.count/3,bytes:Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+g.index!.array.byteLength});
const cushions=cushionSeats;
const result={name:'Bồ đoàn Liên Thủy',count:cushions.length,byZone:Object.fromEntries(['temple','hall','bamboo','dining','library','terrace'].map(zone=>[zone,cushions.filter(s=>s.zone===zone).length])),indoor:cushions.filter(s=>s.zone!=='bamboo').length,near:size(cushionNearGeometry),far:size(cushionFarGeometry),maxBasePassDrawCalls:2,lowQualityBasePassDrawCalls:1,selectionHaloDrawCalls:1,albedoAtlas:{width:1024,height:1024,fileBytes:(await fs.stat('public'+CUSHION.textureUrl)).size,gpuBaseBytes:1024*1024*4},sharedBump:{width:128,height:128,gpuBaseBytes:128*128*4,farEnabled:false},note:'All floor seats share the same texture and two LOD geometries. Low quality uses only the far batch, retaining the pattern without bump. Draw calls exclude shadows and other scene objects; GPU bytes exclude mipmaps. No FPS guarantee.'};
await fs.mkdir('artifacts/cushions',{recursive:true});await fs.writeFile('artifacts/cushions/asset-budget.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
