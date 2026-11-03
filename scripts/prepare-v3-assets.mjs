import fs from 'node:fs/promises';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
await fs.mkdir('public/assets/textures',{recursive:true});await fs.mkdir('public/assets/models',{recursive:true});
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error(`${r.status} ${url}`);return r}
await fs.copyFile('tmp/asset-sources/buddha-original.glb','public/assets/models/seated-buddha.glb');
const sources=[];
await Promise.all([
  ...['old_sandstone_02','grey_plaster','old_wood_floor','fabric_pattern_07','grey_roof_tiles'].map(async(id)=>{
    const files=await(await get(`https://api.polyhaven.com/files/${id}`)).json();await fs.writeFile(`tmp/asset-sources/${id}.json`,JSON.stringify(files,null,2));
    for(const [channel,out] of [['diff','color'],['nor_gl','normal'],['rough','roughness']]){
      const item=(files[channel]||files[{diff:'Diffuse',rough:'Rough'}[channel]]|| (channel==='diff'?files.col_1:null))?.['1k']?.jpg;if(!item){console.log('Missing map',id,channel);continue;}
      const bytes=Buffer.from(await(await get(item.url)).arrayBuffer());await fs.writeFile(`public/assets/textures/${id}-${out}.jpg`,bytes);sources.push({id,channel,url:item.url,license:'CC0-1.0'});
    }
  }),
  (async()=>{const url='https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/3dobjs/base.obj';const text=await(await get(url)).text();await fs.writeFile('tmp/asset-sources/makehuman-base.obj',text);const object=new OBJLoader().parse(text);console.log('Human body loaded:',object.getObjectByName('body')?.geometry?.attributes.position.count);})(),
]);
await fs.writeFile('tmp/asset-sources/pbr-sources.json',JSON.stringify(sources,null,2));console.log('PBR maps downloaded:',sources.length);

