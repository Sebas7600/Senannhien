# Quán Thế Âm Bồ Tát · khoảng tĩnh giữa hai hồ

Tượng dùng file `Quan_Am_Converted.fbx` do J cung cấp; file gốc không bị sửa. Bỏ riêng ghế xanh ngọc số 4 tại `(37, 28)` cùng hai điểm ngồi của ghế, và bồn hoa tại `(44, 24)`. Các ghế/bồn hoa khác giữ nguyên. Tổng số chỗ ngồi còn **146**.

Tượng đặt tại `(43.5, 25.25)`, quay về phía Tây (lối đi giữa hồ koi và hồ sen). Đã dịch cả cụm 1,25 m về bên phải theo ảnh chụp trục nhìn của Zoe; giữ hướng nhìn thẳng vào lối đi. Tượng và đài sen cao 4,8 m, bệ đá thêm 0,56 m. Bàn thờ ở `(40.8, 25.25)`; điểm đứng lễ `(39.35, 25.25)`, điểm tìm đường `(38.9, 25.25)`. Hai bình gốm vẽ hoa văn xanh, hoa hồng phấn/kem đặt hai bên, không chắn mặt tượng. Bệ và bàn có chi tiết hoa sen, lư hương đồng trầm, cát và hai quai. Collider hộp đơn giản dùng chung dữ liệu với lưới tìm đường; không tạo collider theo từng tam giác của tượng.

## Model và bề mặt

FBX có 1.389 mesh, 164.066 tam giác, không có UV. Pipeline áp biến đổi thế giới, đưa gốc về chân tượng, chỉnh trục nhìn và chuẩn hóa chiều cao. Gộp thành bốn mesh: áo ngọc, trang sức, đài sen, khuôn mặt/tay/chân. Giữ normal FBX cho phần tượng để tránh mặt bị mảng tam giác; mặt/tay dùng mức sai số chặt hơn áo và trang sức. Đài sen nguồn rất dày được dựng lại bằng cánh sen kín dạng khối nhẹ, giữ mặt đỡ dưới chân. Tạo UV mới cho vân bề mặt; nén EXT_meshopt_compression dùng decoder đã có trong game.

| Chế độ | GLB | Tam giác | Mesh |
|---|---:|---:|---:|
| Chi tiết | 520.960 byte | 49.414 | 4 |
| Tiết kiệm | 249.824 byte | 21.832 | 4 |

Giảm tải model lần lượt khoảng 94% và 97% so với FBX 8.995.984 byte; không tải FBX, trình FBXLoader hay meshoptimizer encoder trong game. Chỉ chọn một GLB theo chất lượng. Ba vật liệu dùng chung: ngọc trắng, vàng trầm, hồng đá. Một DataTexture 128² tự sinh cho vân ngọc (64 KB dữ liệu RGBA trước mipmap), không thêm ảnh tải mạng. Bump ngọc rất nhẹ, không dùng transmission, phản xạ động hay đèn mới. Bàn/bệ, đồng, gốm, hoa và lá được gộp thành năm geometry tĩnh theo vật liệu. Khói tối đa tám điểm, tắt khi xa 25 m hoặc bật giảm chuyển động. Nhang dùng lại bốn instanced mesh và vòng đời có sẵn.

## Dâng hương

Đến trước bàn và nhấn E, chạm nhãn hoặc lư hương. Xa bàn thì tự đi đến điểm lễ; không chuyển về chánh điện. Dâng hương mất 3 giây, trừ một nén và thưởng +2 công đức sau khi hoàn tất. Hủy/đi xa/hết nhang không thưởng. Nhang cháy 170 giây, giữ chân nhang nguội thêm 480 giây như lư chánh điện.

Station `quan-am` đi qua cùng `/api/offerings` hiện có. Server kiểm tra vị trí, giới hạn nhịp và chống gửi trùng. Trong phòng chung, người vào sau cũng thấy nhang đúng bàn thờ; các phòng độc lập. Lưu mã station cùng dấu thời gian, lọc riêng nhang Quan Âm và nhang chánh điện để không xuất hiện nhầm ở cả hai lư. Mã station được giữ trong suốt vòng đời nhang. Giữ logic bàn bồ đề và các bàn hoa/đèn hiện tại.

## Tái tạo và kiểm tra

Chạy `npm run prepare:quan-am -- "đường dẫn tới Quan_Am_Converted.fbx"`, sau đó `npm test` và `npm run build`. Báo cáo kích thước/hash nguồn nằm ở `public/assets/quan-am/asset-budget.json`. Ảnh kiểm tra model bằng phép chiếu offline ở `tmp/quan-am/model-inspection.png`, không phải screenshot của game. Kiểm tra thực tế trình duyệt/FPS chưa thực hiện vì Local browser use đang tắt trong Work settings.

Kết quả sau tích hợp: **110/110 kiểm thử đạt**, TypeScript và production build đạt; đã cập nhật server đang chạy ở cổng 5174. HTTP kiểm tra trang chính khớp bản build mới, cả hai model trả 200 với đúng kích thước, log lỗi server trống.
