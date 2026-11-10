import {submitWorld} from './worldTransport';
import {createClientId} from './clientIds';
import {useGame} from './gameStore';
import {gateState} from './gateState';
import {inGateSweep,nearGate} from './courtyardPropsData';
export function toggleTempleGate(){const s=useGame.getState();if(!nearGate(s.position)){s.notify('Đến gần cổng tam quan để mở hoặc đóng cửa nhé.');return;}if(inGateSweep(s.position)||s.peers.some(p=>inGateSweep([p.x,p.z]))){s.notify('Mời bạn lùi khỏi khoảng xoay của cánh cổng rồi thử lại nhé.');return;}if(s.connection==='online'){void submitWorld({kind:'gate',open:!gateState.getState().open,operation:createClientId()}).catch(e=>s.notify(e.message));return;}gateState.setState({open:!gateState.getState().open});}
