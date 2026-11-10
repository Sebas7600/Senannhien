import fs from 'node:fs';
import {createLeafPool,leafSources,LEAVES} from '../src/leafSimulation';
import {GATE,BELL_PROP,DRUM_PROP} from '../src/courtyardPropsData';
import {WATER_TASK,WATER_WELL,WATER_JARS} from '../src/waterTaskData';
import {WISH_STATION} from '../src/gameData';
import {fruitAltars} from '../src/fruitOfferingData';
fs.writeFileSync(new URL('../src/sharedWorldLayout.json',import.meta.url),JSON.stringify({leafSources,leaves:LEAVES,slots:createLeafPool(0),gate:GATE,bell:BELL_PROP,drum:DRUM_PROP,water:{task:WATER_TASK,well:WATER_WELL,jars:WATER_JARS},wish:WISH_STATION,fruitAltars}));
