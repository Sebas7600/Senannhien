import fs from 'node:fs';
import * as g from '../src/waterTaskGeometry';
import {WATER_JARS} from '../src/waterTaskData';
import type {BufferGeometry} from 'three';
const triangles=(geometry:BufferGeometry)=>(geometry.index?.count??geometry.attributes.position.count)/3;
const budget=JSON.parse(fs.readFileSync('public/assets/water-task/asset-budget.json','utf8'));
const dynamic=triangles(g.wellRopeLineGeometry)+triangles(g.wellBucketGeometry)+triangles(g.waterDiscGeometry)*6;
const carried=[g.yokeWoodGeometry,g.yokeBucketGeometry,g.yokeWaterGeometry].reduce((n,v)=>n+triangles(v),0);
const variants=budget.assets.map((asset:{file:string;parts:{name:string;triangles:number}[]})=>{
 const count=(name:string)=>asset.parts.find(part=>part.name===name)!.triangles;
 return {file:asset.file,staticTriangles:count('Well_Stone')+count('Well_Arch')+count('Jar_Body')*WATER_JARS.length+dynamic};
});
console.log(JSON.stringify({variants,carriedTriangles:carried,staticDrawCalls:7,carriedDrawCalls:3,jarGeometryCopies:1,waterSurfaceDrawCalls:1,highDownloadBytes:budget.highDownloadBytes,lowDownloadBytes:budget.lowDownloadBytes,textureGpuBytesWithMipmaps:budget.textureGpuBytesWithMipmaps},null,2));
if(variants[0].staticTriangles>=16000||variants[1].staticTriangles>=10000||carried>=1200||budget.highDownloadBytes>=500000)throw Error('Water task exceeds its budget');
