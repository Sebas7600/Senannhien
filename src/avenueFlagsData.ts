export const avenueFlagRows=[-3.35,8,31,44,56];
export const avenueFlagHalfSpan=3.65;
export const avenueFlagPoles=avenueFlagRows.flatMap(z=>[-avenueFlagHalfSpan,avenueFlagHalfSpan].map(x=>({x,z})));
