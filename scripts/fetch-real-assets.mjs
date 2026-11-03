import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
await fs.mkdir('tmp/asset-sources',{recursive:true});await fs.mkdir('public/assets/models',{recursive:true});await fs.mkdir('public/assets/textures',{recursive:true});
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw new Error(`${r.status}: ${url}`);return r;}
const uid='31857e30bf9249f788aed2dfe5eb6673';
await Promise.allSettled([
  (async()=>{const meta=await(await get(`https://api.sketchfab.com/v3/models/${uid}`)).json();await fs.writeFile('tmp/asset-sources/buddha-license.json',JSON.stringify(meta,null,2));console.log('Buddha source:',JSON.stringify({name:meta.name,license:meta.license,vertexCount:meta.vertexCount,faceCount:meta.faceCount}));const compressed=Buffer.from(await(await get('https://huggingface.co/datasets/allenai/objaverse/resolve/main/object-paths.json.gz')).arrayBuffer());const paths=JSON.parse(gunzipSync(compressed));const model=paths[uid];if(!model)throw new Error('Museum Buddha not present in Objaverse');const data=Buffer.from(await(await get(`https://huggingface.co/datasets/allenai/objaverse/resolve/main/${model}`)).arrayBuffer());await fs.writeFile('tmp/asset-sources/buddha-original.glb',data);console.log('Buddha downloaded:',model,data.length)})(),
  (async()=>{const catalog=await(await get('https://api.polyhaven.com/assets?type=textures')).json();await fs.writeFile('tmp/asset-sources/texture-catalog.json',JSON.stringify(catalog));console.log('Texture choices:',Object.entries(catalog).filter(([k])=>/sandstone|plaster|roof|wood.*floor|fabric/i.test(k)).slice(0,45).map(([id,x])=>({id,name:x.name})))})(),
]).then(results=>results.forEach(r=>{if(r.status==='rejected')console.error(String(r.reason))}));
