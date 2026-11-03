# V3 validation · 2026-11-03

- `npm test`: 16/16 passed. Ten gameplay/navigation tests, five V3 regression/storage/migration/donation tests, one live SSE room/chat/profile integration test.
- `npm run build`: TypeScript strict check and Vite production build passed. Rapier physics chunk is 2.22 MB raw / 813 KB gzip; Vite reports a size warning, not a build failure.
- Production server tested at `http://127.0.0.1:5174`. Dev preview at 5173.
- Existing V2 save showed creator once; male/female, robe color/style and skin controls operated. Reload retained selected profile and skipped creator. Editing profile remained available in Settings.
- Standing prayer double-click returned the button to `aria-pressed=false`. Seated prayer second click returned `false` while the actual stand-up control remained present. Thirty rapid toggles also covered in unit test.
- Held W for 5.5 seconds on production in high quality. Browser-reported sample: 58 FPS, p95 frame interval 23 ms, requested viewport 1440×900. This is a single environment/sample, not a guarantee across devices. Idle/background browser throttling is excluded from this reported movement sample.
- Selected an actual temple cushion through the seat panel, reached it and sat; photographed prayer before the scanned Buddha. Halo corrected to a vertical plane.
- In dining hall: selected chair, ordered hủ tiếu chay, dish appeared on table, started eating, observed completion and +40 energy/+2 game merit. Four dish lifecycles remain covered in unit tests.
- Donation: preset amount, optional Vietnamese note normalization, copy feedback, disabled recipient/QR placeholder, custom/static config, desktop and 390×844 layout. Page scroll width remained 390, dialog about 363 px. No real payment attempted.
- Browser console: no captured errors/warnings in the final production scene checks.
- Local screenshot evidence: `artifacts/v3/character.jpg`, `temple.jpg`, `dining.jpg`, `donate.jpg`, `mobile-donate.jpg`.
- All 17 model/texture files are bundled locally: about 13.9 MiB. CC0 sources and modifications recorded in ASSET_LICENSES.md.

Limitations: character clothes/rig remain procedural rather than scanned, FPS depends on hardware, QR needs the owner's recipient configuration, and localhost rooms are not a public multiplayer deployment. No payment verification backend is included.
