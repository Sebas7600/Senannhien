# SenAnNhien
Chùa của MAC USA ONE - KPI hỏi Quang Võ

## Chạy trên Windows

Cài Node.js 18.20 trở lên, clone repo rồi nhấp đúp **Choi-Game.cmd**.
Trong bản nguồn, file CMD tự cài dependencies khi thiếu và build code mới nhất
trước khi mở game. Lần đầu cài dependencies cần kết nối Internet.

Giữ cửa sổ CMD mở khi chơi; nhấn Ctrl+C để dừng máy chủ. Để chơi trên điện thoại,
kết nối cùng Wi-Fi/LAN với máy tính, đặt mạng Windows thành **Private** và mở
địa chỉ được in trong cửa sổ CMD. Trình duyệt trên máy tính sẽ tự mở khi máy chủ
sẵn sàng. Bản Play có sẵn build vẫn chạy trực tiếp qua cùng file CMD.

## Chơi chung qua LAN

Mở một máy chủ bằng `Choi-Game.cmd`, rồi cho tất cả thiết bị truy cập **cùng địa chỉ LAN và cùng phòng** trong thanh chọn phòng. Mỗi máy tự mở một máy chủ riêng sẽ tạo các sân chùa riêng.

Các hoạt động chung gồm vị trí/động tác/trang bị nhân vật, chuông và trống, hoa đăng/lời nguyện, pháo hoa thường và logo, hương/hoa/đèn/mâm trái cây, cá và thức ăn, vườn rau, lá quét, cổng, lu nước, cùng hình ảnh bếp và NPC phục vụ. Người vào sau nhận trạng thái hiện tại của phòng; pháo hoa tiếp tục đúng thời điểm đang chạy. Chất lượng đồ họa thấp giảm số hạt pháo nhưng giữ đường bay và lịch bắn như PC.

Khi mất kết nối, các hoạt động thay đổi cảnh chung chờ kết nối lại để tránh trừ vật phẩm cho hiệu ứng chỉ xuất hiện trên một máy. Tiến trình cá nhân, túi đồ, camera, ngày/đêm và âm lượng vẫn theo từng người chơi.

Sau khi cập nhật bản đồng bộ này, đóng cửa sổ CMD máy chủ cũ, mở lại `Choi-Game.cmd` và tải lại trang trên các thiết bị. Máy chủ cũ sẽ được báo là không tương thích thay vì chạy hoạt động riêng lẻ.
