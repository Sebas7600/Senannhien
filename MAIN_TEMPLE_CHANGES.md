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
