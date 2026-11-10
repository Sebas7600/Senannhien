# PR #12 conflict resolution

Target: integrate `main` at `0e66a17` into `Wayne-Update` at `fbb0a52`, without replacing either branch wholesale. Dante's temple, pagoda, statue and mountain scenery improvements are preserved alongside Wayne's market and character work.

| Conflict | Reviewed resolution |
| --- | --- |
| `server-runtime.mjs` | Keep sanitized equipment replication and the expanded map bounds, shared-world action tracking and authoritative fish simulation. |
| `network.ts` | Reset shared room state on room entry and send equipment with player state. Preserve all world, garden, offering and chat transports. |
| `TreeLeaves.tsx` | Keep server-owned leaf collection and duplicate protection; use the current chibi broom pose for collision. Sample the broom with the client animation clock while leaf timing follows the server clock. |
| `WorldV2.tsx` | Keep the opaque canvas that prevents leaf fringes, current player/NPCs, stalls and fruit offerings. Accept the mountain backdrop and longer far plane. |
| `courtyardCollisionData.ts` | Combine stall colliders with new flag/lantern proxies and trunk positions matching the actual updated scenery. Drop the superseded fixed forest proxy layout. |
| `Waters.tsx` / `fishFeeding.ts` | Use the same server-authoritative fish simulation online and offline; remove the duplicate client-only swimming implementation. Preserve scattered initial positions and independent patrol destinations. Keep all 23 fish visible for consistent feeding; low quality limits matrix uploads to 30 Hz. |
| `gameStore.ts` | Preserve catalogue purchases, consumables, equipment, fruit offerings and version 6 save migration. Combine these with shared activities, room state and timed Bodhi incense. Restocking remains at the stalls. |

Automatic merges were also reviewed. The calibrated prayer, standing/cushion bow, two-handed broom and bucket animation fixes remain intact. The incoming tea/incense adjustments and fuller female hair cap are preserved. The cushion collision regression now instantiates the hair component's actual supplied geometry as well as its sphere and torus children.

Fish regressions exercise the production shared simulation: initial four-quadrant distribution, independent turns in both directions, most fish visiting at least three quadrants, continuous shoreline/island clearance, all 35 feeding stations, meal reservations and resuming patrol after expiry. Existing deterministic synchronization, multiple food piles, purchases/equipment, save migration, two-player world actions and full-cycle ritual geometry checks remain enabled.

This resolution updates the PR branch only. It does not merge PR #12 into `main`.
