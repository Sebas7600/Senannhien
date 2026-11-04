# Chính điện nguyên bản — bản mở rộng

Theo yêu cầu mới, bỏ giới hạn kích thước cũ và dùng nguyên mô hình trong Dien_Tam_The_Web. Tỷ lệ đồng nhất 0.5, đặt tại (0, 0.08, -27). Mái cao khoảng 17.07; khuôn viên mô hình rộng 40, sâu 39. Không thay đổi mã dựng những ngôi nhà khác.

## Mô hình

- public/assets/main-temple/tam-the-complete.glb: bản sao nguyên byte Tam_The_Exterior.glb mới; đầy đủ sân, móng, thang, lan can, cột, cửa, mái và bảng hiệu.
- tam-the-complete-interior.glb: đồ thờ tham chiếu, bỏ ba tấm nền đỏ kín phía sau tượng và phần gỗ che camera.
- buddha-open-halo.glb: tượng FBX đã bỏ tear_shape_low và back_circles_low; quay 180 độ trong component và dùng vật liệu vàng đồng.
- Component dựng thêm ba vòng tròn đồng tâm và các tia nhỏ sau mỗi tượng, không có mặt phẳng nền kín.

## Các file mã cần ghép

- src/MainTempleReference.tsx: toàn bộ điện mới, tượng, hào quang và va chạm theo lưới mô hình.
- src/Environment.tsx: MainTemple gọi component mới; bỏ sàn/cầu thang va chạm và bộ dựng điện cũ. Những hàm dựng nhà khác giữ nguyên.
- src/gameData.ts: cao độ 18 bồ đoàn chính điện 2.28; tường bao mới; lư hương dời xuống trước cầu thang tại (0,-8.7), điểm đứng (0,-7.1).
- src/gameStore.ts: floorAt cập nhật nền cao và đoạn thang của chính điện.
- src/WorldV2.tsx: nâng vị trí hiển thị hoa/nến theo bàn thờ mới.
- scripts/prepare-main-temple.mjs: đọc được folder GLB mới đặt trực tiếp trong Dien_Tam_The_Web hoặc cấu trúc lồng cũ.

Khi ghép nhóm, chỉ áp dụng các thay đổi liên quan chính điện trong file dùng chung, không chép đè cả file nếu thành viên khác đã chỉnh. Kích thước mới có thể cần sắp xếp lại khoảng cách với các khu vực bên cạnh ở lần ghép bản đồ sau.

## Kiểm tra

TypeScript/production build thành công, 20 kiểm thử hiện có đạt. Mô hình ngoại thất sao chép nguyên byte; không sửa dữ liệu gốc ngoài dự án.

## Sửa nội thất và dâng lễ

- templeGeometry.ts phân nhóm theo khối liên thông, không cắt tam giác giữa thân cột khi ẩn mái.
- Bộ chuẩn bị nội thất giữ cột nguyên khối và các tấm hốc tường; chỉ loại các khối nền kín và xà che camera.
- TempleNiches.tsx + templeNiches.json thêm 520 tượng nhỏ dạng instanced vào các hốc tham chiếu.
- Tượng giữa sửa hai tay chắp trước ngực; tượng phải phản chiếu tư thế tượng trái.
- 32 bồ đoàn, chia hai bên, lối giữa thoáng; thêm vật cản cột cho A*. Tổng số chỗ ngồi toàn game 94.
- Chú tiểu Hương An ở bên phải lư, tại (3,-8.7). Nhân vật An Nhiên từ cửa sổ khác là người chơi cùng phòng, không phải NPC.
- Bàn hoa ở (-10,-28.5), bàn đèn ở (10,-28.5). Đến gần trong 1.8 đơn vị, thực hiện 3 giây, hoàn tất mới trừ vật phẩm. Có thể hủy. Mỗi bàn tối đa 8 lễ vật; hoa lưu 5 phút, đèn cháy 2 phút; hết hạn không mất tiến trình đã nhận.
- TempleOfferingStations.tsx hiển thị đúng bàn riêng; bỏ hiệu ứng hoa/nến cũ đặt rải trên sàn.
- Thêm action flower/candle vào đồng bộ phòng; cần dùng server-runtime.mjs mới.

Kiểm tra cập nhật: build TypeScript/production thành công; 24 kiểm thử đạt, gồm bố trí bồ đoàn và thời gian/giới hạn/hủy dâng lễ.

Kiểm tra giao diện: dâng hoa tại bàn trái giảm 8→7, hiện 1/8; dâng đèn tại bàn phải giảm 8→7, hiện 1/8; không có lỗi console trong quá trình thử. Các tượng nhỏ hiện trong hốc tường.

## Va chạm, hình học và mobile

- Bỏ ép y của nhân vật theo floorAt khi đi bộ; nhân vật dùng trọng lực và bộ điều khiển Rapier. Bước tự leo giảm còn 0.25 để không tự leo lên lan can.
- TempleCollision.tsx và templeCollisionData.ts dùng 48 khối va chạm đơn giản (sàn, dốc thang, cột, tường, lan can, vùng bàn thờ); không dùng lưới tam giác của mái/đồ trang trí để tính vật lý.
- Chỉ tự ẩn mái khi chế độ theo nhân vật và đứng thực sự trong điện; góc toàn cảnh giữ mái.
- Tay tượng giữa dùng capsule và các khớp kín; closeCutSurface vá biên hở trên thân tượng sau bỏ tư thế tay cũ.
- mobile.css tăng kích thước chạm, cho nhãn dài xuống dòng, bỏ minimap thường trực và các lớp phủ phụ trên màn hình nhỏ; bản đồ vẫn mở được bằng nút Bản đồ.
- Thiết bị pointer:coarse mới mặc định quality low, vẫn tôn trọng lựa chọn đã lưu. Chế độ low tắt bóng, DPR 1, giảm chi tiết tượng nhỏ, một vòng hào quang, một đèn điểm khu điện, bỏ lá vật lý/trang trí rơi.
- Tia hào quang gộp 96 draw calls thành 3 ở high, 0 ở low. Nhóm 520 tượng nhỏ giữ đủ số lượng, tam giác từ 291200 xuống 74880 ở low. Ba file mô hình điện dùng khoảng 6.87 MB trước nén HTTP, chưa gồm shared JS/WASM và asset chung. Không cam kết FPS mobile khi chưa đo trên thiết bị thật. Báo cáo: artifacts/mobile-performance-audit.json.
- Kiểm tra cập nhật: production build và 26 kiểm thử đạt; có mô phỏng vật lý lên dốc, đứng ngoài nền, chặn lan can và kiểm tra biên hình học kín.

Kiểm tra responsive thực tế trong trình duyệt: khung dọc 390×844 và ngang 844×390. Bản ngang trước sửa có main cao 550 px vượt viewport; bản sửa main cao theo viewport (~354.5 px), thanh thao tác kết thúc trước mép dưới, joystick 92 px và không tràn ngang. Bản desktop đã kiểm tra chuyển V từ trong điện: mái vẫn hiện đủ trong toàn cảnh. Khôi phục lựa chọn đồ họa cũ sau kiểm tra.

## Giữ tường/cửa/thang và dâng lễ trên án thờ

Mặt tiền không còn tự ẩn theo vị trí người chơi; chỉ mái cao được ẩn để nhìn nội thất. Cầu thang và tường luôn hiển thị. Hitbox bổ sung 104 khối từ các khối liên thông của mô hình, gồm cửa, bình gốm và đồ thờ; bỏ các chi tiết trang trí nhỏ. scripts/prepare-temple-colliders.mjs tái tạo src/templeObjectColliders.json. Hai bàn rời được bỏ; hoa và đèn đặt lên hai phần mặt án thờ, điểm đứng mới (-3.2,-27.9)/(3.2,-27.9). Tượng nhỏ thêm tóc, mũi, hai tay và bàn tay đặt trước bụng; vẫn instancing. Tay tượng lớn không chỉnh trong lần này theo yêu cầu chờ tài nguyên.

## Trần cố định, vùng ngồi rộng và ánh sáng đền

Bỏ hoàn toàn cơ chế ẩn khi vào điện; nâng phần mái 1.5 đơn vị. Giới hạn camera trong điện thấp hơn trần và gần nhân vật để không xuyên lên mái. Thêm trần gỗ, hoành phi CanvasTexture 2048×512, đèn lồng và đèn vòng treo (không bóng riêng). Hai hàng cột tại z cục bộ 1 và 4.9 được bỏ cùng trang trí chân/cột và collider; giữ cột sát tường/khu thờ. 48 bồ đoàn, tổng toàn game 110 chỗ ngồi. Tượng nhỏ giảm chiều sâu còn 22%, lùi vào hốc thay vì lồi ra ngoài; vẫn dùng instancing. Hào quang thêm lớp shader cộng sáng mềm, không dùng bloom toàn màn hình. Tay tượng lớn không thay đổi.

## 2026-11-04: measured fixture and shell corrections
- Flower stems now enter the existing altar vase at local (-3.7, 3.25, -2.835); no added floating vases. Eight lamps sit on the existing right altar tabletop at y=2.843.
- Replaced nine primitive batches with one batch of 520 recessed Buddha images, baked once at 768x1024 from the supplied Buddha model. The images are shallow relief substitutes and do not have full 3D parallax.
- Joined raised ceiling to side/rear walls and entrance lintels; expanded ceiling coverage; removed stray low front gold fittings. Hanging lamps moved away from the altar sightline.
- Foundation now ends at local z=9.775; solid 24-step colliders follow stair width 14.45 and z=9.497..16.303. Side rail collisions and navigation boundaries follow the same footprint.
- Build passes; 48 tests pass, including walking up stairs, no phantom floor beside stairs/porch, blocked stair underside, and table bounds.

## Multiple offerings and merit chest
- All 16 reference ceramic vases and all 3 main altar tables are selectable. Click a vase/table to choose it; approach and duration checks remain in force. Each station holds up to 8 offerings independently. Timestamp-to-station metadata persists and expires with the offering; legacy offerings retain their previous default location. Flower rendering uses 2 instanced batches.
- Niche sprites reduced to 0.48 x 0.64 source units and lowered so the head sits within the arch.
- Six pendant rings, 90 support/drop wires and 72 luminous beads use 3 instanced batches with no added dynamic lights.
- Merit chest at temple-local (10.6,2.2,-4.6), with collision, sign and E/click/mobile interaction. It opens the existing donate panel; donation configuration and balances are unchanged.
- Build succeeds and all 51 tests pass, including every station, independent capacity, persistence/expiry and chest routing/panel behavior.

## Lifetimes, decorative vases and rendering budget
- The two front bouquet vases are decoration only; their hit targets are removed and stale selection IDs cannot consume flowers. Existing saved offerings in those vases resolve to an interior altar vase. Fourteen interior vases remain interactive.
- Flowers and lamps last 480 seconds. Incense burns for 170 seconds, exposing a red bamboo foot with a cooled ash tip after burning; the feet are retained for up to 480 additional seconds, capped at 72 saved sticks. Smoke and embers stop at burnout.
- Facade cleanup now handles BOTH gold and gold_light at the actual door edge z=7.59. Regression test reads the reference GLB and verifies removal of 4 gold + 20 gold-light components on brick while keeping 16 inner door motifs.
- Rendering changes: 90 sand-grain meshes become 1 instanced batch; up to 24 lamps (216 meshes) become 3 batches with one throttled flame update; all retained incense uses 4 batches. Flower/lamp batches are memoized. Invisible vase/table hit targets use a non-rendered material while retaining raycasting. Niche bake targets are 384x512 in low quality and 768x1024 in high quality. These are draw-call/memory reductions, not a measured mobile FPS guarantee.

## Shared room offerings (2026-11-04)
Temple incense, altar flowers and lamps now use server-owned room snapshots. SSE carries surviving offerings to other players and late joiners; room changes replace decorations instead of merging private saves. Completion posts use idempotent operation IDs, distance/station validation, shared capacity and bounded incense retention. Supplies and merit update only after server acknowledgement. Unchanged offering snapshots reuse existing render arrays. Lifetimes remain 170 seconds for burning incense plus 480 seconds for its red foot, and 480 seconds for flowers/lamps. Room offerings currently live in server memory and reset on server restart. Offline practice remains local.
## Cho cá ăn — 2026-11-04
- Điểm tương tác [18,5], phạm vi 2,5m; đứng xa được dẫn tới bờ và chưa trừ thức ăn.
- Thời gian chờ 3 giây ở client, máy chủ giới hạn 2,5 giây; gửi trùng không tạo thêm thức ăn.
- Dùng trạng thái phòng/SSE sẵn có; thức ăn và phản ứng cá tồn tại 12 giây, người vào sau cũng nhận được khi còn hạn.
- Chỉ trừ thức ăn/cộng tiến trình sau xác nhận máy chủ. Chế độ offline giữ tương tác cục bộ.
- Giữ 15 cá hiện có, không thêm ánh sáng hoặc mô hình. Cá tụ quanh vị trí thức ăn trong hồ.
- Build thành công, 59/59 tests đạt. Chưa commit/push theo yêu cầu cuối buổi.

## Koi pond / bridge follow-up
Lowered koi water to -0.18 and clipped courtyard ground at the ellipse. Bridge now uses matching 2m entrance ramps and physical rails. Pond navigation and manual movement use ellipse clearance with a bridge corridor, replacing square koi obstacles. Added 12 bank + 6 bridge feeding stations, server-validated targets and per-player cooldown; up to 12 concurrent feeds, 96 instanced pellets in one draw call. Koi divide across active targets, feeding arm animation is broadcast as avatar action. Build and 60 tests passed before final pellet batching. Browser visual validation blocked because local browser use is disabled in Work settings.

## Correction: move pond outward, do not lower beneath paths
Moved koi pond, bridge, collisions, fish, labels, feed stations and three pond benches by +5m X/+5m Z, away from the main walkway. Restored visible water level .085 and removed courtyard clipping. Lotus pond unchanged.

## Bridge rail and shore visibility fix
Fixed local/world height mismatch in bridge posts after pond relocation. Replaced rail pieces with three continuous endpoint-aligned beams per side, matching entrance ramps. Recomputed instance bounds for shore rocks and disabled frustum culling for these two small fixed batches to prevent disappearing borders when turning the camera.

## Shared garden — 2026-11-04
12 plots now use room-owned server state with revision-checked plant/water/harvest transitions and operation deduplication. Conflicting harvests award only the first successful contributor; client supplies/progress update after acknowledgement. Room snapshots support late joining and isolate gardens between rooms; unchanged plot state keeps object identity. Offline practice stays local. Plants need watering, mature after 60 seconds and yield 3 vegetables. Plot buttons show stage/countdown, last contributor and pending requests; contextual action + E target nearest plot within 3m. Reuses existing low-poly plant geometry, no additional lights. Server room gardens currently reset on server restart. Tests: 62/62 pass. No commit/push until end of session as requested.
## Chibi garden visual redesign — 2026-11-04
Replaced simple beds and blob plants with rounded pastel raised beds and four stylized vegetable silhouettes (carrot, leafy greens, pink radish, pumpkin). Types are cosmetic: all use existing seed inventory and yield three generic vegetables. Geometry is shared: 12 bed instances + 12 soil instances + one 600-capacity low-poly crop batch; updates once per session tick or plot change, no new textures/lights. Only the nearest plot within 3m displays its detailed action label, keeping mobile view clear; all beds remain clickable for approach. Existing room-owned lifecycle and single-harvest validation preserved. Browser visual validation remains unavailable due to local browser permission error. No commit/push yet.
## Temple vegetable garden replaces chibi treatment — 2026-11-04
User requested a restrained temple garden. Renamed ChibiGarden to TempleGarden, removed pastel borders, decorative coloured markers and cartoon crop types. All beds now grow leafy mustard greens with tapered scalloped curved leaf geometry, a raised pale centre vein, and natural green variation. Earth beds have dry/watered soil colours and bamboo borders with visible nodes and corner pegs. Batch capacities: 12 earth + 12 soil instances, 240 bamboo culms/nodes/pegs, 72 stems and 504 low-poly leaf blades. No added lights/textures; no per-frame crop updates. Only nearest bed within 3m shows an action label. Same 12 plot IDs, positions, room protocol, timing, seeds and yield remain unchanged. Build successful; visual confirmation pending while browser tooling is blocked.
## Soil and gardening actions — 2026-11-04
Raised the garden ground plane from .02 to .075 above the courtyard surface. Added deterministic 128x128 shared soil albedo/bump texture (grain, clods and furrow variation), retaining darker watered soil. Added plant/water/harvest avatar poses, plot-facing heading and brief movement lock; server accepts these poses for remote avatars. Watering includes a low-poly watering can and seven animated water droplets. Existing server acknowledgement, revision checks and rewards unchanged. Build passed; 62/62 functional tests passed. Browser visual validation still pending.
## Gardening duration and stronger soil relief — 2026-11-04
Online plant/water/harvest now wait 2000ms before submitting the revision-checked operation. Pending operation prevents repeated activation, holds the avatar pose, and cancels before submit if room/action/event/connection/proximity changed. Inventory/rewards still wait for server acknowledgement. Corrected missing albedo/bump on topsoil (previous texture only covered bed sides). Added 48 low-poly clods per bed in a single 576-instance draw, stronger topsoil bump and much darker wet earth/clod colours. Build successful; 62/62 tests passed, including the delayed operation check.
