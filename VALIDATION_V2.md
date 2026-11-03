# Kiểm tra bản V2

Kiểm tra ngày 03/11/2026 trên Windows, Node.js 18.20.2.

## Tự động

- TypeScript strict: đạt.
- `npm run build`: đạt, tạo static bundle trong `dist/`.
- `npm test`: 11/11 đạt, gồm dữ liệu 80 ghế, đường đi tới đủ 16 ghế ăn và các khu thiền, vòng đời cả 4 món, ngắt bữa, chiếm ghế, trồng/tưới/thu hoạch, vật phẩm, thưởng một lần, chuyển ngày và phòng/chat thật qua HTTP/SSE.
- API `/api/health`: phiên bản 2, 3 phòng.
- Kiểm tra cú pháp máy chủ Node: đạt.

## Kiểm tra trực tiếp bằng trình duyệt

- Bản dev và bản build sản xuất đều tải scene 3D.
- Camera theo nhân vật và toàn cảnh; sửa sương toàn cảnh và chuyển núi nền ra ngoài vùng chơi.
- Tự tìm đường tới nhà ăn và chọn ghế cụ thể; sửa bước lên mép sàn và hướng ngồi.
- Chọn bồ đoàn 15 trong chánh điện, ngồi đúng chỗ và bắt đầu thiền; bộ đếm tăng.
- Thực đơn đủ mì chay, cơm chay, hủ tiếu chay, bánh mì chay.
- Gọi cơm chay: món xuất hiện trên bàn, thao tác ăn hoàn thành và cộng tiến trình.
- Gọi bánh mì chay trên bản build: món hiện đúng phía bàn, ăn hoàn thành, cộng 2 điểm và 30 năng lượng (giới hạn 100).
- Mở hai cửa sổ: cùng phòng hiện 2 người; lời nhắn từ cửa sổ thứ hai nhận được ở cửa sổ thứ nhất.
- Desktop 1280 × 800 và mobile 390 × 844; kiểm tra joystick, HUD, minimap, bảng chọn chỗ và modal thích ứng. Kiểm tra mobile là bố cục trong trình duyệt, không phải kiểm thử trên điện thoại vật lý.
- Console bản build cuối: không thấy warning/error được ghi nhận trong phiên kiểm tra.

Ảnh tại `artifacts/v2/`: `overview.jpg`, `meditation.jpg`, `menu.jpg`, `dining.jpg`, `mobile.jpg`.

## Giới hạn

Đây là bản chạy cục bộ. Chưa có triển khai máy chủ Internet, tài khoản, cơ sở dữ liệu cloud hoặc chống gian lận. Tiến trình lưu riêng trong trình duyệt; phòng và chat là dữ liệu RAM máy chủ. Món ăn đang chuẩn bị và trạng thái ngồi không lưu qua lần tải lại. Vật phẩm, nhiệm vụ, món đã thưởng thức, cây trồng và dấu mốc được lưu.

Build có cảnh báo kích thước chunk vật lý do Rapier/WASM. Đây là cảnh báo bundle, không phải lỗi build. Có chế độ tiết kiệm tắt bóng đổ; chưa đo FPS trên từng dòng điện thoại hoặc máy cấu hình thấp.
