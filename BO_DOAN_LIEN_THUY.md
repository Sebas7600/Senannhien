# Bồ đoàn Liên Thủy

Thiết kế mới dựa trên chất mây/cói đan trong ảnh tham khảo J gửi: mặt tròn phồng nhẹ, tâm yên tĩnh, cánh sen xoáy bằng các dải đan tương phản, viền nâu bện. Không lấy ảnh sản phẩm làm texture trực tiếp. Mặt đan được tạo bằng imagegen theo brief riêng, sau đó đóng gói vào atlas với thân đệm đan chéo tạo bằng code.

## Áp dụng

- Bản hiện tại: 108 tọa cụ có hoa văn, gồm 40 chánh điện, 20 thiền đường, 8 rừng trúc, 20 đệm ăn và 20 đệm đọc sách. Giữ nguyên ID, vị trí, độ cao neo nhân vật và tổng 148 chỗ ngồi trong game.
- Đệm đường kính 1,26 m, cao 22 cm, mặt vồng, thân bo và nẹp vòng có hình khối. Đây là tỷ lệ phục vụ nhân vật game, không phải quy chuẩn kích thước bồ đoàn thực tế.
- Điểm gốc nhân vật khi ngồi nâng 19,5 cm; đáy chân tư thế ngồi chạm gần mặt đệm 22 cm. Đứng dậy trả về sàn bằng luồng hiện có.
- Đệm ăn/đọc giữ dáng thấp cao 11 cm, bán kính 62 cm bằng instance scale trên cùng geometry. Không nâng bàn hoặc đổi tư thế/độ cao nhân vật. Bỏ mẫu đĩa trơn/vòng viền cũ, không vẽ chồng hai bộ đệm.
- Click trực tiếp từng đệm hoặc chọn trong danh sách đều đi đến đúng chỗ. Giữ kiểm tra chỗ có người ngồi; đệm của mình có vòng sáng mảnh và màu ấm nhẹ.

## Ngân sách web

| Tài nguyên | Chi phí |
|---|---:|
| Geometry nhìn gần | 960 tam giác / 30.620 byte |
| Geometry nhìn xa | 480 tam giác / 15.420 byte |
| Atlas chung, mặt + thân | JPEG 1024², 301.238 byte tải xuống (~294 KiB) |
| Bump sợi đan chung | 128², 65.536 byte GPU cơ bản, sinh một lần |
| Batches cho cả 108 đệm | Tối đa 2 lượt vẽ base-pass; Tiết kiệm dùng 1 batch LOD xa |
| Vòng chọn | Chỉ tạo một vòng khi đang ngồi bồ đoàn |

Atlas dùng mipmap và anisotropy 4 để giảm nhấp nháy sợi nhỏ khi nhìn xiên. GPU atlas khoảng 4 MiB chưa tính mipmap. Hai mức chi tiết dùng chung atlas; xa bỏ bump và bóng đổ riêng. Chế độ Tiết kiệm dùng toàn bộ LOD xa, vẫn giữ hoa văn. Chỉ xét LOD mỗi 0,3 giây, có khoảng trễ; ma trận instance chỉ ghi lại khi nhóm/chỗ ngồi thay đổi. Không có rigid body hoặc animation cho từng sợi. Thêm hoa văn cho 40 đệm ăn/đọc không thêm ảnh texture; gộp 80 mesh đĩa/viền vào batches sẵn có và bỏ các vòng chọn vô hình.

Geometry nhiều hơn các đĩa trơn trước đây để có độ phồng và viền; tối ưu bằng gộp mesh, instancing, texture chung và LOD. Số lượt vẽ trên không bao gồm các vật thể khác/bóng. Không suy diễn thành cam kết FPS.

## Xem và tái tạo

- [Xem bồ đoàn, hoa văn và dãy gối](http://127.0.0.1:5174/?view=bo-doan).
- Ảnh tạo ban đầu: `artifacts/cushions/lien-thuy-original.png`. Texture runtime chỉ dùng JPEG atlas trong `public/assets/textures/cushion`.
- Tái đóng gói atlas trên Windows: `./scripts/pack-cushion-texture.ps1 -InputImage artifacts/cushions/lien-thuy-original.png`.
- `npm run audit:assets` tạo `artifacts/cushions/asset-budget.json` và báo cáo các tài nguyên trước.

Kiểm tra bản 04/11/2026: 89/89 kiểm thử, production build và audit asset đạt; gồm ngân sách LOD/texture, đầy đủ 108 tọa cụ, UV tâm hoa văn ở cả hai LOD/kích thước, độ cao đệm thấp và đường đi/ngồi/ăn/đọc. Chưa xem lại trên trình duyệt ở lượt này do Local browser use bị tắt trong Work settings. Các lần kiểm tra hình ảnh của bản đầu không phải bằng chứng cho bố cục mới.
