# Đồng bộ sân chùa — 10/11/2026

Trạng thái dùng chung được tách theo phòng và gửi qua SSE. Người vào sau nhận trạng thái hiện tại.

| Phần | Cách xử lý |
| --- | --- |
| Cá và mồi | Server mô phỏng 23 cá; mồi hết 18 giây sau lần ăn đầu; client nội suy. |
| Hương, hoa, đèn | Server lưu lễ vật theo station, thời gian tồn tại và chống gửi trùng. |
| Vườn rau | Server kiểm tra revision khi gieo, tưới, thu hoạch; lịch cây hiển thị theo đồng hồ server. |
| Quét lá | Cùng bố trí và chu kỳ rơi; server kiểm tra tiếp xúc chổi, chỉ người gom thành công nhận công đức. Lá đã gom không xuất hiện lại với người vào sau. |
| Chuông | Server khóa lượt thỉnh; 6 giây thực hiện rồi nghỉ 10 giây. Tiếng chuông và chuyển động phát chung, không mở bảng thực tập trên máy người khác. |
| Trống | Server chặn lượt chồng nhau; tiếng trống chung; động tác người đánh theo peer. |
| Hoa đăng | Các chuyến bay chung; seed server giữ đường bay và kiểu hoa giống nhau. Bảng nhập lời nguyện vẫn riêng. |
| Cổng | Trạng thái mở/đóng chung; không đóng khi có người trong vùng xoay, tự mở để nhường đường. |
| Gánh nước | Động tác người chơi và mức nước trong lu chung. Server kiểm tra lấy nước, thời gian rót và chống giao trùng. |
| Người chơi và chỗ ngồi | Peer state chung; server chống trùng chỗ ngồi. |
| Cô Tâm/nhà ăn | Giữ luồng phục vụ món của từng người; không điều phối chung đường đi của Cô Tâm. |
| Tiến độ cá nhân, túi đồ, âm lượng, camera, giao diện thực tập | Giữ riêng theo người chơi. |

## Kiểm tra và bảo trì

- Các test server bao gồm hai người thao tác cùng lúc, người vào sau, tách phòng, chuông hết thời gian nghỉ và lá chỉ được gom một lần.
- Bố trí lá và vị trí tương tác được tạo từ source qua scripts/prepare-shared-world.ts trong prebuild; không sửa sharedWorldLayout.json bằng tay.
- Dữ liệu phòng hiện nằm trong bộ nhớ server như hệ thống phòng trước đó; khởi động lại server tạo sân chung mới.
