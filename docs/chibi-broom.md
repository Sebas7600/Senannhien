# Chibi broom grip

The sweep prop, arm IK and local leaf contact use the same chibi-specific analytic pose from `sweepMotion.ts`. The previous adult-rig trajectory placed its grips beyond the chibi forearms while the chibi used independent arm rotations. The shaft now passes between the shoulders, with grip distances 0.66 and 0.82 m along the existing supplied handle. Grip targets convert through the GLB's 1.08 × 1 × 1.10 scale before the existing two-link solver runs.

`PlayerAvatar` samples the pose once before the prop's frame update and passes that same object to `ChibiBroom`. Only sweeping uses the earlier frame priority; kitchen, dining and other poses retain their update order. Vertical visual offsets for standing and stairs are compensated so the bristle tips remain close to ground level. The adult preview sampler remains unchanged.

`TreeLeaves` uses the matching chibi trajectory, retaining the existing generous contact capsule, leaf return-to-tree logic and ten-leaves-per-merit reward. Contact only flexes the broom head, never the shaft or either grip. No extra meshes, texture downloads, physics bodies or per-frame allocations are added, and the redundant independent broom sampler is removed.

Verification in `tests/sweep-broom.test.ts` loads the actual player GLB, runs Idle/Walk/Run clips over complete sweep cycles, verifies both hand joints against the grips within 3 mm under world rotation and standing/stair offsets, checks pickup trajectory and head-shake isolation, and decodes both broom LODs to check visible bristle tip clearance within 2 cm. Existing broom budgets and leaf simulation tests remain covered.
