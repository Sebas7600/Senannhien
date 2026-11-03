# Hai gốc cây nghỉ chân trong sân chùa

## Tham khảo thực tế

- [Ghế đá cổ ở chùa Phúc Linh — Phatgiao.org.vn, Đức Tuỳ, 07/09/2015](https://phatgiao.org.vn/ghe-da-co-o-chua-phuc-linh-d19400.html): bài ghi nhận trực tiếp các ghế nghỉ gắn với khoảng cây xanh trong khuôn viên. Ghế tại ngôi chùa này dùng đá cổ trên trụ xây, không phải mẫu granito của game. Tham khảo cách gắn chỗ nghỉ với bóng cây, không sao chép mẫu ghế.
- [Chùa Vĩnh Nghiêm — Cơ sở dữ liệu ngành Du lịch](https://csdl.vietnamtourism.gov.vn/dest/?item=6): tư liệu về tam quan, sân và các công trình trong quần thể. Dùng làm bối cảnh tham khảo; bản đồ game không phục dựng chùa Vĩnh Nghiêm.
- Ảnh J gửi là yêu cầu trực tiếp về vị trí hai cây, tán dạng khối và phân biệt cây có lư hương với cây có ghế.

Ba ghế mỗi cây, bố trí ba mặt vuông góc và các kích thước dưới đây là lựa chọn thiết kế cho game theo yêu cầu J; không phải quy chuẩn bố trí của mọi ngôi chùa Việt Nam. Không tải model/texture từ các trang tham khảo.

## Bố trí đã triển khai

- Cây dâng hương ở (-10, 0): nâng thành bồn từ 0,33 lên 0,56 m, thêm lớp đá nắp; đưa bàn thờ ra phía trước để mặt sen không bị thành bồn che. Giữ điểm đứng dâng hương (-10, 4,6). Không có ghế quanh cây này.
- Hai cây gần tam quan chuyển nhẹ vào sân tại (-11, 20), (11, 20), cách hàng đèn hơn vị trí cũ. Mỗi cây có thân loe, bảy rễ nổi, nhánh đỡ tán, đất trong bồn và thành đá cao 0,46 m, bán kính 2,05 m.
- Mỗi gốc có đúng ba băng ghế granito (xanh ngọc, trắng ngà, đỏ gạch), tâm ghế cách tâm cây 2,72 m; lưng quay vào cây, mặt hướng ra sân. Ghế kê gọn ba mặt Bắc/Nam/phía sân giữa; bỏ hoàn toàn mặt ngoài hướng hàng đèn. Mép sau ghế cách thành bồn khoảng 0,3 m; lối đi nằm phía trước ghế và ở khoảng góc, không luồn sau tựa. Chừa lối giữa tam quan và sân chính.
- Dời hai bồn hoa khỏi cụm ghế. Bản đồ nhỏ/đầy đủ thể hiện hai cây; danh sách ngồi tính số chỗ từ dữ liệu.
- Bảo toàn bốn ghế bên hồ/sen và các ID ghế cũ, thêm bốn ghế: toàn khuôn viên có 10 băng ghế đá/20 chỗ trên ghế đá, 88 chỗ ngồi tổng cộng.
- Lá xanh ô liu với màu đỉnh tán sáng hơn, mặt dưới trầm hơn; màu được ghi sẵn vào đỉnh mesh, không chạy hiệu ứng mỗi frame.

## Ngân sách render

- Hai gốc cây/bồn dùng một geometry chung, tán dùng geometry hiện có; mỗi loại là một InstancedMesh cho cả hai cây: **2 lượt vẽ base-pass**. Collider mỗi gốc là một hình trụ cố định, không mô phỏng rễ rời.
- Mỗi tán **1.840 tam giác**, opaque FrontSide, gồm tán khối và 14 cụm/56 lá nhỏ. UV và texture gân lá 256² dùng chung, có mipmap; một lần đọc texture mỗi pixel để thêm vân nhẹ. Geometry tăng so với tán 1.160 tam giác trước đó để thêm lá, nhưng vẫn thấp hơn tán lá rời ban đầu 3.120 tam giác. Không tăng số mesh/lượt vẽ cho cụm lá.
- Mười ghế vẫn tối đa **6 batch base-pass** theo 3 màu × 2 LOD, hoặc 3 nếu cùng LOD. Mỗi ghế gần 1.412 tam giác, xa 668. Không tạo mesh/material riêng cho từng ghế.
- Thân/rễ/bồn và các màu gộp một mesh. Không tạo animation gió hoặc rigid body cho từng lá/viên đá. Geometry được tạo một lần khi tải module, không cập nhật theo frame.
- Số liệu buffer ở `artifacts/optimization/asset-budget.json`, tạo lại bằng `npm run audit:assets`. Lượt vẽ trên chỉ tính tài nguyên nêu rõ, không gồm các vật thể khác/bóng; không suy diễn thành cam kết FPS.

## Kiểm tra

27 kiểm thử: vị trí ngồi hợp lệ, đường đến 20 chỗ ghế đá, ba ghế mỗi cây, hướng ghế/khoảng hở, lối giữa, bồn có chiều cao đúng và bàn thờ còn thấy mặt trước; các luồng game trước đây vẫn chạy. Build TypeScript/Vite; kiểm tra trình duyệt mô hình, ngồi ghế Tây 2 và Đông 3, xác nhận dâng hương ở bồ đề vẫn hiện thông báo thành công. Ảnh ở artifacts/courtyard. Bản Play đã nhận build mới; cấu hình donation.json giữ nguyên.

Xem mô hình: [Hai gốc sân](http://127.0.0.1:5174/?view=san-chua), [Bồ đề/bàn thờ](http://127.0.0.1:5174/?view=bo-de). Game chính: [Sân chùa](http://127.0.0.1:5174/).



Kiểm tra bản kê ghế ba mặt: ngồi ghế Đông 2 thành công, avatar không lọt vào bồn; phía hàng đèn trống. Kiểm tra shader thường/instancing trong preview và game không ghi lỗi console. Ảnh bản cập nhật ở artifacts/courtyard-refinement. 27/27 kiểm thử đạt, build production thành công.

