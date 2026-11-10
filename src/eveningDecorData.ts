export const eveningPosts=[...[-6.4,6.4].flatMap(x=>[-4,14,35,53].map(z=>({x,z}))),...[-16,16].map(x=>({x,z:-16})),{x:20,z:22},{x:20,z:42},
 // Stand on the shoulders of the west/east lanes, clear of each junction.
 ...[-15.5,15.5].flatMap(x=>[-39,-30,-9,24,30,49].map(z=>({x,z})))
];
