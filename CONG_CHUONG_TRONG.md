# Cổng tam quan, chuông đồng và trống rồng

## Cập nhật: Cổng mới từ Cong_Moi.zip

Cổng hiện dùng `Cong_Bai_Dinh_Dong.glb` và góc mở đo từ `Cong_Bai_Dinh_Mo.glb` trong **Cong_Moi.zip** J cung cấp. Giữ vị trí `(0, 29)`, tỉ lệ 1,4, kích thước và bản lề của mẫu mới; giữ đóng/mở bằng E, chống kẹp người và lối cửa phụ. Collider cột chính sâu 1,95 đơn vị và cột phụ sâu 1,70 để bao phần cột gỗ mới. Những số liệu cổng cũ ở phần lịch sử bên dưới đã được thay bằng bảng này.

| Cổng mới | Chi tiết | Tiết kiệm |
|---|---:|---:|
| Tam giác | 39.092 (giữ nguyên nguồn) | 17.062 |
| Primitive / lượt vẽ khi đóng | 18 | 18 |
| GLB nén | 669.632 byte | 374.516 byte |
| GLB + 5 texture dùng chung | 983.250 byte | 688.134 byte |

Từ 81 primitive và 21 vật liệu nguồn, gộp vật liệu giống hệt nhau còn 12, gom phần tĩnh theo vật liệu còn 18 primitive tổng cộng. Giảm 78% lượt vẽ so với model nguồn; bản nhẹ giảm 56% tam giác. Giữ 5 JPEG gạch, gỗ, viền gỗ, hoa văn và ngói **768 × 768** gốc (313.618 byte tổng cộng), không giảm thêm độ nét. Cả hai mức dùng cùng URI texture và cache material. Chỉ tải một model cổng theo chất lượng, không tải model mở riêng. Nén EXT_meshopt_compression bằng decoder có sẵn trong game, không thêm thư viện runtime.

Tên `gate-bai-dinh-v1.glb`, `gate-bai-dinh-v1-low.glb` và tiền tố texture `bai-dinh-v1-` tách cache khỏi mẫu cũ. Sáu file runtime của cổng cũ được lưu trong `tmp/new-gate/previous-runtime` rồi bỏ khỏi public để không đóng gói thừa. Model chuông và trống giữ nguyên.

Tái tạo cổng mới sau pipeline nhập chuông/trống cũ (nếu cần): trích Cong_Moi.zip vào `tmp/new-gate`, chạy `node scripts/prepare-gate-assets.mjs tmp/new-gate/Cong_Moi`. Báo cáo riêng tại `public/assets/courtyard/gate-budget.json`, báo cáo toàn bộ asset tại `asset-budget.json`. Không chạy lại pipeline cổng cũ sau bước thay mới. Maya/preview/source PNG vẫn chỉ nằm trong tmp, không phục vụ cho game.

Kiểm tra gồm giải mã high/low, toàn bộ UV/normal hữu hạn, khớp kích thước và đầu mái giữa hai LOD, đủ 5 texture, bản lề khớp **mọi primitive** cửa ở GLB mở nguồn, ngân sách tải/lượt vẽ, lối đi đóng/mở và capsule Rapier thực. Chưa đo FPS hay kiểm tra hình ảnh trong game vì Local browser use đang tắt trong Work settings.

Sau thay cổng mới: **103/103 kiểm thử đạt**, TypeScript và production build đạt. Server đang chạy tiếp tục phục vụ thư mục dist mới; thay asset này không cần khởi động lại phòng chung.

## Lịch sử nhập bộ asset ban đầu

Tích hợp ngày 04/11/2026 từ ba ZIP J cung cấp: Cong_Tam_Quan_Hai_Trang_Thai.zip, Chuong_Dong_Bong.zip, Trong_Dinh_Rong.zip. Bản Maya, preview và texture nguồn được trích xuất vào tmp/temple-imports, không đóng gói vào game. Các ZIP nguồn không bị thay đổi.

## Vị trí và tương tác

- Cổng thay mẫu cũ tại (0, 29), chân 0,06 m, tỉ lệ đồng nhất 1,4. Rộng khoảng 14,3 m, cao khoảng 8,74 m; vẫn nằm giữa hai cây và không chạm bồn gốc.
- Mặc định mở. Đến gần, bấm nút Khép/Mở cổng hoặc E. Hai cánh xoay 89° theo GLB mở, thanh gài chỉ hiện lúc đóng. Không tải thêm một cổng nguyên khối cho trạng thái thứ hai.
- Cột/tường dùng collider hộp; hai cánh dùng collider kinematic theo bản lề. Tìm đường cập nhật khi đổi trạng thái; cửa chính đóng vẫn có lối qua cửa phụ.
- Không cho đổi trạng thái khi người chơi/peer đứng trong vùng xoay; cổng mở lại nếu có người đi vào trong lúc đóng. Trạng thái cổng hiện riêng từng trình duyệt, chưa đồng bộ theo phòng.
- Chuông thay mẫu cũ trong lầu phía Tây (-19, -13), tỉ lệ 0,47, khung đặt trên sàn 0,4 m. Giữ khung, xích, dây, chày gỗ của file gốc; chỉ thân chuông chuyển động tại điểm treo. Giữ luồng Thỉnh chuông và âm thanh hiện tại.
- Trống thay mẫu trụ trong lầu phía Đông (19, -13), tỉ lệ 1,12. Giữ giá, mặt da, hoa văn và dùi. Thay asset trống; không thêm hoạt động/âm thanh đánh trống mới.
- Giữ hai lầu, mái và sàn hiện có. Bỏ khung chuông phụ để không chồng hai bộ giá đỡ. Cập nhật collider theo kích thước mới.

## Ngân sách asset

Số đo đầy đủ: public/assets/courtyard/asset-budget.json.

| Phần | Chi tiết | Tiết kiệm |
|---|---:|---:|
| Cổng | 37.680 tam giác / 26 primitive | 18.950 tam giác / 26 primitive |
| Chuông | 13.644 tam giác / 11 primitive | 7.264 tam giác / 11 primitive |
| Trống | 7.440 tam giác / 9 primitive | 3.892 tam giác / 9 primitive |

- Hình học nén EXT_meshopt_compression, dùng decoder sẵn trong drei; không tải decoder Draco từ CDN.
- Bản Chi tiết giữ toàn bộ tam giác gốc. Bản Tiết kiệm giảm tam giác với sai số 0,003 và khóa biên để giữ mép/UV, chọn theo cài đặt đồ họa.
- Texture high/low dùng chung URI; cache material dùng chung GPU texture khi đổi chất lượng. Cạnh dài nhất 1.024 px; normal map giữ PNG, ảnh màu lớn giảm bằng bicubic/JPEG 88. Các ảnh nhỏ hơn giữ nguyên.
- Ba model Chi tiết + chín texture: 2.174.239 byte (~2,17 MB); Tiết kiệm: 1.791.523 byte. Bộ bốn GLB nguồn gồm cổng đóng/mở: 5.440.024 byte. Giảm khoảng 60% ở lần tải bộ Chi tiết; không tính asset khác, HTTP headers hoặc cache.
- Gộp phần tĩnh cùng vật liệu: cổng đóng từ 63 primitive còn 26. Cánh cửa và thân chuông tách riêng để hoạt ảnh đúng.
- Không cập nhật React mỗi frame. Cổng đứng yên bỏ qua cập nhật ma trận/kinematic. Tiết kiệm tắt đổ bóng ba model; giữ frustum culling. Đây không phải phép đo FPS thiết bị thật.

## Tái tạo và kiểm chứng

Trích ba ZIP vào tmp/temple-imports rồi chạy:

```sh
node scripts/prepare-courtyard-assets.mjs tmp/temple-imports
powershell -NoProfile -File scripts/pack-courtyard-textures.ps1
node scripts/prepare-courtyard-assets.mjs tmp/temple-imports
npm test
npm run build
```

Lần đầu lấy texture nhúng; PowerShell tạo texture web; lần cuối đóng gói nén. Meshoptimizer 0.18.1 khai báo trong devDependencies.

88 kiểm thử đạt, gồm giải mã cả sáu GLB, texture, bản lề, ngân sách tam giác/dung lượng, tìm đường khi đóng/mở và capsule Rapier đi qua cửa mở/bị chặn khi đóng. TypeScript và production build đạt. Chưa kiểm tra hình ảnh trên trình duyệt vì Local browser use đang tắt trong Work settings; chưa đo FPS trên điện thoại thật.
