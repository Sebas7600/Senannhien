import {CUSHION} from '../src/cushionData';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seats,usesFloorSeat,diningTables,npcs,RECEPTION,RECEPTION_HEADING,walkable,surfaceHeight} from '../src/gameData';
import {flameFlicker} from '../src/fireMotion';

test('dining floor posture clears cushions and low tabletops; local and remote avatars share the posture rule',()=>{
  for(const s of seats.filter(s=>s.kind==='dining')){
    assert.ok(usesFloorSeat(s));assert.equal(s.position[1],surfaceHeight(s.position[0],s.position[2])+CUSHION.seatLift);
    const t=s.table!;assert.ok(Math.abs(s.position[0]-t[0])-.36>1.25,'Crossed legs clear the table edge');
    assert.ok(t[1]-s.position[1]>.25&&t[1]-s.position[1]<.35);
  }
  assert.equal(diningTables.length,5);assert.equal(seats.filter(s=>s.kind==='dining').length,20);
  assert.ok(seats.filter(s=>s.kind==='tea').every(s=>usesFloorSeat(s)));
});
test('reception staff stands behind the desk facing the open entrance with a reachable guest side',()=>{
  const cook=npcs.find(n=>n.id==='cook')!;assert.equal(RECEPTION[0],34,'Reception is centered on the dining hall');assert.equal(cook.x,RECEPTION[0]);assert.ok(cook.z<RECEPTION[1]-.8);assert.equal(RECEPTION_HEADING,0);
  assert.ok(walkable(cook.x,cook.z));assert.ok(walkable(RECEPTION[0],RECEPTION[1]+1.2));
});
test('candle flicker stays bounded, continuous and stable with reduced motion',()=>{
  for(let seed=0;seed<8;seed++)for(let t=0;t<90;t+=.02){const f=flameFlicker(t,seed);assert.ok(f>=.86&&f<=1.14);assert.ok(Math.abs(f-flameFlicker(t+.001,seed))<.002);assert.equal(flameFlicker(t,seed,true),1)}
});
