# Cây bồ đề, bàn thờ và tối ưu ghế đá

## Cây và bàn thờ mới

- Cây chính ở sân bồ đề dùng tán khối đặc, màu xanh ô liu phân sắc sáng/tối theo chiều cao và các cụm lá nhấn nhỏ theo ảnh J cung cấp. Các cây lá rời cùng loại trong sân cũng chuyển sang tán khối dùng chung geometry.
- Thân có nhánh lớn, rễ nổi mở rộng ở gốc, rễ phụ rủ và một số dải màu nhỏ. Rễ/thân được gộp vào một mesh; tán là một mesh opaque, không dùng thẻ lá trong suốt hoặc material hai mặt.
- Bồn đá tròn có mạch ghép, bàn thờ nhỏ với phù điêu sen, lư hương hai quai, chân đế, đĩa quả và que hương.
- Có va chạm cho thân, bồn và bàn thờ. Tìm đường tránh vùng gốc mở rộng; điểm đứng dâng hương nằm ở trước bàn thờ.
- Bấm bàn thờ để đi tới; khi tới gần có nút **Dâng hương dưới bồ đề**, hoặc nhấn **E**. Mỗi lần hợp lệ dùng một nén hương trong túi, ghi tiến trình và thêm hương/khói nhẹ. Khi hết hương, game mở túi; không phát sinh giao dịch tiền thật.
- Hương ở bồ đề được lưu riêng để không tự bật hiệu ứng hương ở chánh điện. Khói chỉ có 10 điểm mềm, ẩn khi nhìn quá xa.

## Kết quả tối ưu đo từ geometry

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Tam giác mỗi ghế nhìn gần | 5.058 | 1.412 — giảm 72,1% |
| Tam giác mỗi ghế nhìn xa | 5.058 | 668 — giảm 86,8% |
| Mesh mỗi ghế | 7 | 1 |
| Lượt vẽ base-pass (6 ghế cũ → 10 ghế mới) | 42 | Tối đa 6; 3 khi cùng mức chi tiết |
| Buffer geometry ghế dùng chung | 315.264 byte | 154.176 byte cho cả hai LOD — giảm 51,1% |
| Tam giác mỗi tán cây dùng chung | 3.120 | 1.840 gồm lá chi tiết — giảm 41,0% |
| Buffer mỗi tán | 159.120 byte | 88.320 byte gồm UV/lá chi tiết — giảm 44,5% |
| Texture ghế dùng chung, chưa tính mipmap | 2.359.296 byte | 2.097.152 byte — giảm 11,1% |

Các con số tam giác/byte được đọc từ BufferGeometry, không phải ước lượng FPS. Lượt vẽ là ngân sách mesh/batch của riêng ghế trong pass chính; chưa cộng bóng đổ hoặc các vật thể khác. Cây mới có thêm rễ, bồn và bàn thờ, nên giảm tam giác ở **tán cây** không đồng nghĩa toàn bộ cụm mới nhẹ hơn cùng tỷ lệ.

Chạy `npm run audit:assets` để tạo lại `artifacts/optimization/asset-budget.json`.

## Giữ chất lượng ghế

- Giữ mặt ngồi cong, tựa nghiêng, mép bo, chân đúc và ba hoàn thiện xanh ngọc/đỏ gạch/trắng ngà.
- Giảm phân đoạn ở các đường cong nhỏ, dùng index để chia sẻ đỉnh. Hai mức chi tiết giữ cùng kích thước và vị trí ngồi; chỉ đổi khi đủ xa, có khoảng trễ để hạn chế đổi qua lại.
- Gộp mặt, tựa, chân, chi tiết chốt và chữ thành một mesh/material. Mười ghế được instancing theo màu và mức chi tiết.
- Hạt granito được tạo một lần vào texture 512² dùng chung. Shader không còn tính hash/noise cho từng pixel; texture có mipmap và lọc nghiêng.
- Chữ dùng texture 1024 × 256 dùng chung, bám theo đường cong của tựa để tránh bị che/cắt chữ. Chế độ gần giữ clearcoat; xa dùng PBR đơn giản hơn và không đổ thêm bóng riêng.
- Tổng 88 chỗ ngồi, gồm 20 chỗ trên 10 ghế đá. Sáu ID ghế cũ được giữ; thêm bốn ghế mới cho hai cụm cây gần tam quan.

## Xem trực tiếp

- [Toàn cây và gốc/bàn thờ](http://127.0.0.1:5174/?view=bo-de)
- [Ghế đá sau tối ưu](http://127.0.0.1:5174/?view=ghe-da)

Nguồn hình dáng cây: ảnh tham khảo J gửi trong chat. Mô hình/texture mới được dựng bằng code của dự án; không lấy model hay texture từ website tham khảo.

Camera tự thu gần khi tia nhìn gặp tán cây đặc và trở về khoảng cách người chơi chọn khi hết bị che. Chỉ kiểm tra các mesh tán đã đăng ký; không làm tán trong suốt. Nhãn tên nhân vật giữ kích thước trên màn hình khi camera thu gần.

Kiểm chứng: 27 kiểm thử tự động; build TypeScript/Vite thành công. Kiểm tra trình duyệt gồm xem toàn cây/gốc, dâng hương bằng nút và phím E (số hương giảm 3 → 2), đi tới/ngồi ghế và kiểm tra chữ ở cả hai LOD.


Texture gân lá mới: 256 × 256 RGBA (262.144 byte chưa tính mipmap), dùng chung cho các cây tán khối. Chi tiết lá được gộp vào mesh tán và không thêm draw call. Ghế quanh hai gốc cây kê ba mặt vuông góc, bỏ phía đèn; xem RESEARCH_SAN_CHUA.md.

