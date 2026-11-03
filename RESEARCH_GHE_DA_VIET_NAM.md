# Ghế đá Việt Nam · nghiên cứu và triển khai

Đối tượng: ghế nghỉ sân chùa, công viên và sân trường, thay cho sáu băng ghế gỗ ngoài sân của Sen An Nhiên. Đây là mô hình 3D dựng riêng từ tham khảo sản phẩm thật; ảnh xưởng chỉ dùng quan sát, không đưa vào game.

## Những đặc điểm đã đối chiếu

| Đặc điểm | Tư liệu thực tế | Cách áp dụng vào game |
|---|---|---|
| Kết cấu | Cát, xi măng, đá/sỏi, có cốt thép; sản phẩm được đúc và mài bóng. | Hai chân đúc dày, mặt ngồi liền khối, tấm tựa có độ dày; bỏ các thanh gỗ và bốn chân mảnh. |
| Kích thước | Mẫu phổ biến của Ghế Đá Sài Gòn dài 120 cm, sâu khoảng 50 cm, cao ngồi 40–42 cm và cao tựa 72–75 cm. Các mẫu khác có kích thước khác. | Chọn phiên bản dài 180 cm để dùng hai vị trí ngồi trong game, cao mặt khoảng 45 cm, cao tựa khoảng 89 cm. Đây là lựa chọn tỷ lệ của game, không phải kích thước chuẩn của mọi ghế đá VN. |
| Đá mài hai màu | Ảnh xưởng có mảng xanh ngọc/đỏ ở giữa, hai đầu trắng, kèm sọc trắng mảnh. | Ba hoàn thiện: xanh ngọc–trắng ngà, đỏ gạch–trắng ngà và trắng ngà. Giữ các mảng và sọc chạy đồng bộ giữa mặt ngồi với tựa. |
| Biên dạng | Mặt ngồi, mép và phần trên tựa có đường bo; ghế liền lưng có đường cong thay cho ghép thanh. | Mặt ngồi hơi lõm, mũi ghế cuộn nhẹ, tựa nghiêng và bo đỉnh, cạnh vát tròn. |
| Bề mặt | Hạt đá sáng/tối phân bố trong nền xi măng màu; bề mặt mài có độ phản sáng. | Vật liệu PBR granito tạo bằng shader theo đơn vị mét, hạt khoáng không đều, phản sáng vừa và độ nhám biến thiên. Chi tiết hạt mờ dần khi nhìn xa để giảm nhiễu. |
| Chân và tuổi vật liệu | Chân đúc liên kết mặt–tựa, hình dáng khác nhau giữa các xưởng; ghế dùng ngoài trời. | Chân dạng vòm có phần đỡ tựa, gót chân rộng. Vệt ngả màu nhẹ ở chân sát đất là lựa chọn mỹ thuật để ghế bớt cảm giác mới tinh. |
| Chữ trên tựa | Xưởng có dịch vụ in chữ và logo theo yêu cầu. | Bảng chữ màu đỏ nâu “SEN AN NHIÊN / MỘT CHÚT BÌNH YÊN” được dựng trong vật liệu của ghế. Không dùng tên nhà tài trợ, số điện thoại hay watermark của xưởng. |

## Nguồn chính

1. [Ghế Đá Sài Gòn — kích thước, màu sắc, mẫu granito hai màu và in chữ](https://ghedasaigon.com/gia-bo-ban-ghe-da/). Đối chiếu ảnh mẫu trắng–xanh và trắng–đỏ, không dùng giá bán làm căn cứ thiết kế.
2. [Ghế Đá Giá Xưởng — ghế liền lưng trắng](https://ghedagiaxuong.vn/ghe-da-lien-lung-mau-trang). Mô tả kết cấu đúc từ cát, xi măng, đá/sỏi, cốt thép; mài/đánh bóng; mẫu dài 1 m, cao ngồi 40 cm, tựa 75 cm.
3. [Đại Việt Sport — ghế đá mài một màu có tựa](https://daivietsport.com/ghe-da-mai-1-mau-loai-thang-co-tua-lung-p487.html). Đối chiếu nhóm vật liệu và các màu trắng, đỏ, xanh, vàng, đen, ghi.

Các thông số và mô tả trên là thông tin của từng nhà sản xuất, không phải tiêu chuẩn quốc gia hay kết luận về toàn bộ ghế đá Việt Nam.

## Chi tiết kỹ thuật và tương tác

- Mười băng ghế ngoài sân/hồ, mỗi băng là một mô hình liên tục có hai điểm ngồi. Tổng số chỗ ngồi của game là 88.
- Điểm ngồi được xoay từ hệ trục của ghế ra bản đồ; tránh lỗi đảo trái/phải ở ghế quay 90°/180°.
- Giữ ID chỗ ngồi cũ để cơ chế chọn ghế và đồng bộ phòng tiếp tục hoạt động. Tên chỗ ngồi phân biệt vị trí 1/2.
- Hông/đùi được căn lại với mặt ghế; bàn chân gần mặt đất. Ghế nhà ăn và ghế trà giữ loại nội thất hiện tại.
- Không thêm yêu cầu tải texture ngoài hoặc thư viện mới. Mô hình dùng chung geometry/material; chữ nằm trên bề mặt 3D và nhận ánh sáng.

Mã: `VietnameseBench.tsx`, `benchGeometry.ts`, `terrazzo.ts`, `stoneBenchData.ts`. Kiểm tra: đường tới 12 vị trí, tọa độ sau xoay, khoảng cách hai người ngồi và raycast mặt ghế so với độ cao điểm ngồi.

## Xem mô hình chi tiết

Khi server game đang chạy, mở [góc xem 3D](http://127.0.0.1:5174/?view=ghe-da). Kéo để xoay, cuộn để phóng gần và chọn ba màu ở cuối màn hình. Góc xem này không thay đổi màu của các ghế đã bố trí trong sân. Trên điện thoại, camera tự lùi để giữ trọn mô hình trong khung hình.

Build TypeScript/Vite và 18 kiểm thử tự động đã qua. Đã xem trực tiếp mô hình trong sân, chọn/ngồi ghế xanh và đỏ, xoay mặt sau ở góc xem riêng, chuyển ba màu, kiểm tra bố cục 390 × 844 không tràn ngang. Ảnh kiểm tra nằm trong `artifacts/stone-benches`.

