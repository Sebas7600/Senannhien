import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createClientId} from '../src/clientIds';

const uuidV4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const serverId=/^[\w-]{8,80}$/;
function withCrypto(source:unknown,work:()=>void){
  const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'crypto',{value:source,configurable:true});
  try{work();}finally{if(original)Object.defineProperty(globalThis,'crypto',original);else Reflect.deleteProperty(globalThis,'crypto');}
}

test('secure-context identifiers retain native UUID behavior and method binding',()=>{
  const source={randomUUID(){assert.equal(this,source);return '4bc5a6d0-fc49-4df5-9e85-d16cc3a4a792';}};
  withCrypto(source,()=>assert.equal(createClientId(),source.randomUUID()));
});

test('LAN HTTP without randomUUID still produces distinct valid player and operation IDs',()=>{
  const source={getRandomValues(array:Uint8Array){assert.equal(this,source);return webcrypto.getRandomValues(array);}};
  withCrypto(source,()=>{
    const ids=new Set<string>();
    for(let i=0;i<2000;i++){const id=createClientId();assert.match(id,uuidV4);assert.match(id,serverId);ids.add(id);}
    assert.equal(ids.size,2000);
  });
});

test('a denied native UUID API falls back without interrupting startup',()=>{
  withCrypto({randomUUID(){throw new Error('Unavailable');},getRandomValues:(array:Uint8Array)=>webcrypto.getRandomValues(array)},()=>assert.match(createClientId(),uuidV4));
});

test('restricted WebViews without crypto keep distinct IDs accepted by the game protocol',()=>{
  for(const source of [undefined,{getRandomValues(){throw new Error('Unavailable');}}])withCrypto(source,()=>{
    const ids=Array.from({length:100},()=>createClientId());
    ids.forEach(id=>assert.match(id,serverId));assert.equal(new Set(ids).size,ids.length);
  });
});
