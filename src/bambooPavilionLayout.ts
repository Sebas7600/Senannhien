export const BAMBOO_PAVILION={x:-27.8,z:5.65,w:8.4,d:7.4,height:.34};
const {x,z,d}=BAMBOO_PAVILION;
export const BAMBOO_PAVILION_STEP={x,z:z+d/2+.41,w:3.2,d:1.24,height:.22};
export const bambooPavilionBenches=[-2.05,2.05].flatMap(dx=>[-1.9,.85].map(dz=>({x:x+dx,z:z+dz})));
export const BAMBOO_BENCH_HEIGHT=.45;
