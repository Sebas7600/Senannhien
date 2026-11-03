import fs from 'node:fs/promises';
import {renderBowlSamples,BOWL_SAMPLE_RATE} from '../src/bowlSynthesis';
await fs.mkdir('artifacts/bow',{recursive:true});
const samples=renderBowlSamples(),wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(BOWL_SAMPLE_RATE,24);wav.writeUInt32LE(BOWL_SAMPLE_RATE*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);samples.forEach((s,i)=>wav.writeInt16LE(Math.round(s*32767),44+i*2));await fs.writeFile('artifacts/bow/bowl-synth.wav',wav);console.log({seconds:samples.length/BOWL_SAMPLE_RATE,bytes:wav.length});
