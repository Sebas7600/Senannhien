import {createLucideIcon, type IconNode} from 'lucide-react';

// Open, optically spaced 24 px symbols. Small UI sizes use a 1.4 px stroke;
// avoid doubled contours and dense interior details that fill in at 21–28 px.
export const KneelingSit = createLucideIcon('KneelingSit', [
  ['circle',{cx:'10.5',cy:'4.5',r:'2',key:'head'}],
  ['path',{d:'M9 8.5c-1 2-1.4 4-.8 6l6.2 2.7c1.5.7 1.2 2.8-.5 2.8H7c-1.6 0-2.3-1.3-1.4-2.5',key:'seiza'}],
  ['path',{d:'m12 9-.5 3.3 3.5 2.3M8.2 14.5l3.3 3H8',key:'hands-and-legs'}],
]);

export const PrayerHands = createLucideIcon('PrayerHands', [
  ['path',{d:'M12 3.2v10.3c0 1.7-1 3.1-2.4 4L6 20l-2-2.5 4-4.1 2.1-8.8c.3-1.2 1.9-1.7 1.9-1.4Z',key:'left-palm'}],
  ['path',{d:'M12 3.2c0-.3 1.6.2 1.9 1.4l2.1 8.8 4 4.1-2 2.5-3.6-2.5c-1.4-.9-2.4-2.3-2.4-4',key:'right-palm'}],
]);

export const Prostration = createLucideIcon('Prostration', [
  ['circle',{cx:'16.5',cy:'10.5',r:'2',key:'bowed-head'}],
  ['path',{d:'M4 20h6.5c1.3 0 1.8-1.6.7-2.3l-3.5-2.2 1.4-4.2c.6-1.7 2-2.1 3.3-1.2',key:'kneeling-body'}],
  ['path',{d:'m12 13.3 1.4 5.2 5.6 1M7.7 15.5H5',key:'lowered-arms'}],
]);

const beads:IconNode=Array.from({length:8},(_,i)=>{
  const angle=-Math.PI/2+i*Math.PI/4;
  return ['circle',{cx:(12+Math.cos(angle)*7).toFixed(2),cy:(9.7+Math.sin(angle)*6.6).toFixed(2),r:'1.3',key:`bead-${i}`}];
});
export const PrayerBeads = createLucideIcon('PrayerBeads', [
  ...beads,
  ['path',{d:'M12 18.5v3',key:'tassel'}],
]);

export const SweepLeaves = createLucideIcon('SweepLeaves', [
  ['path',{d:'m18 3-7.5 10',key:'handle'}],
  ['path',{d:'m8.7 11.7 3.6 2.7c-.8 2.1-1 4.2-.7 6.6-3 .1-5.5-.9-8-3.2 2.1-1.5 3.7-3.5 5.1-6.1Z',key:'broom'}],
  ['path',{d:'m7.8 15.6-2 3.4M10 16.5l-1.1 3.9',key:'bristles'}],
]);

export const SeatedMeditation = createLucideIcon('SeatedMeditation', [
  ['circle',{cx:'12',cy:'4.5',r:'2',key:'head'}],
  ['path',{d:'m9 9-1.5 4.5-3 2M15 9l1.5 4.5 3 2',key:'relaxed-arms'}],
  ['path',{d:'M12 18c-3.8-3.6-6.5-3.2-8.2-1.1-1.2 1.5-.2 3.1 1.7 3.1h13c1.9 0 2.9-1.6 1.7-3.1-1.7-2.1-4.4-2.5-8.2 1.1ZM9 20l5.5-2.5',key:'crossed-legs'}],
]);
