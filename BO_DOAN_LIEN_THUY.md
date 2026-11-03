# Bồ đoàn Liên Thủy

Thiết kế mới dựa trên chất mây/cói đan trong ảnh tham khảo J gửi: mặt tròn phồng nhẹ, tâm yên tĩnh, cánh sen xoáy bằng các dải đan tương phản, viền nâu bện. Không lấy ảnh sản phẩm làm texture trực tiếp. Mặt đan được tạo bằng imagegen theo brief riêng, sau đó đóng gói vào atlas với thân đệm đan chéo tạo bằng code.

## Áp dụng

- Đủ 18 bồ đoàn chánh điện + 20 bồ đoàn thiền đường; 8 tọa cụ rừng trúc cũng dùng chung bộ tài nguyên. Giữ nguyên ID, hàng/lối đi và tổng 88 chỗ ngồi.
- Đệm đường kính 1,26 m, cao 22 cm, mặt vồng, thân bo và nẹp vòng có hình khối. Đây là tỷ lệ phục vụ nhân vật game, không phải quy chuẩn kích thước bồ đoàn thực tế.
- Điểm gốc nhân vật khi ngồi nâng 19,5 cm; đáy chân tư thế ngồi chạm gần mặt đệm 22 cm. Đứng dậy trả về sàn bằng luồng hiện có.
- Click trực tiếp từng đệm hoặc chọn trong danh sách đều đi đến đúng chỗ. Giữ kiểm tra chỗ có người ngồi; đệm của mình có vòng sáng mảnh và màu ấm nhẹ.

## Ngân sách web

| Tài nguyên | Chi phí |
|---|---:|
| Geometry nhìn gần | 960 tam giác / 30.620 byte |
| Geometry nhìn xa | 480 tam giác / 15.420 byte |
| Atlas chung, mặt + thân | JPEG 1024², 301.238 byte tải xuống (~294 KiB) |
| Bump sợi đan chung | 128², 65.536 byte GPU cơ bản, sinh một lần |
| Batches cho cả 46 đệm | Tối đa 2 lượt vẽ base-pass, 1 khi cùng LOD |
| Vòng chọn | Chỉ tạo một vòng khi đang ngồi bồ đoàn |

Atlas dùng mipmap và anisotropy 4 để giảm nhấp nháy sợi nhỏ khi nhìn xiên. GPU atlas khoảng 4 MiB chưa tính mipmap. Hai mức chi tiết dùng chung atlas; xa bỏ bump và bóng đổ riêng. Chế độ Tiết kiệm chuyển LOD sớm hơn. Chỉ xét LOD mỗi 0,3 giây, có khoảng trễ; ma trận instance chỉ ghi lại khi nhóm/chỗ ngồi thay đổi. Không có rigid body hoặc animation cho từng sợi.

Geometry nhiều hơn các đĩa trơn trước đây để có độ phồng và viền; tối ưu bằng gộp mesh, instancing, texture chung và LOD. Số lượt vẽ trên không bao gồm các vật thể khác/bóng. Không suy diễn thành cam kết FPS.

## Xem và tái tạo

- [Xem bồ đoàn, hoa văn và dãy gối](http://127.0.0.1:5174/?view=bo-doan).
- Ảnh tạo ban đầu: `artifacts/cushions/lien-thuy-original.png`. Texture runtime chỉ dùng JPEG atlas trong `public/assets/textures/cushion`.
- Tái đóng gói atlas trên Windows: `./scripts/pack-cushion-texture.ps1 -InputImage artifacts/cushions/lien-thuy-original.png`.
- `npm run audit:assets` tạo `artifacts/cushions/asset-budget.json` và báo cáo các tài nguyên trước.

Kiểm tra: 30/30 kiểm thử đạt, gồm ngân sách LOD/texture, UV tâm mặt đệm, bề mặt đỡ chân nhân vật và đường đi đến đủ 46 đệm. Kiểm tra trình duyệt: xem đơn lẻ/cả dãy, ngồi trong chánh điện, chọn trực tiếp đúng bồ đoàn 14 bằng chuột.
