# Gánh nước cho bếp chay

Giếng đá đơn sơ đặt bên trái vườn rau, tâm `(23.7, -47.2)`. Bốn lu đất nung đặt dọc vách sau nhà ăn tại `x = 29.2, 32.4, 35.6, 38.8`, `z = -37.65`. Điểm đứng rót ở phía vườn, cách lu 1.5 m; không thể giao xuyên qua vách nhà ăn.

Chọn **Gánh nước** cạnh **Quét lá** để đi đến giếng. Cũng có thể nhấn E hoặc chạm nhãn giếng khi ở gần. Lấy nước trong 3 giây; nhân vật kéo dây gàu, sau đó xuất hiện đòn gánh tre và hai thùng. Người chơi tự đi hoặc chọn **Tới lu nhận nước**. Gần lu, nhấn E/chạm lu để rót 2.2 giây. Mỗi chuyến hoàn tất cộng **8 công đức**, tăng tiến độ và công đức tích lũy một lần. Nhấn Esc/nút × để hủy; hủy không thưởng.

Mỗi lu chứa 4 gánh; bếp dùng một gánh mỗi 180 giây, tính bằng mốc thời gian, không có vòng lặp mô phỏng riêng. Lu đầy không nhận thêm. Mực nước phản ánh sức chứa. Khi gánh nước, không chạy nhanh/đến nhanh/ngồi/làm hoạt động khác; đi bộ vẫn bình thường. Chuyển phòng hoặc tải lại trang hủy chuyến dở. Lượng nước trong lu được lưu cùng tiến độ trên máy; nội dung lu và nhiệm vụ chưa phải trạng thái đồng bộ chung giữa người chơi. Các tư thế lấy/gánh/rót được truyền tới người cùng phòng qua cơ chế avatar có sẵn.

Tài sản dựng trực tiếp bằng hình học và màu đỉnh, không tải ảnh/GLB mới. Bốn lu dùng chung một geometry và một instanced mesh; mặt nước giếng và lu dùng một instanced mesh. Đòn gánh/thùng/mặt nước dùng ba mesh đã gộp; rót thêm một tia nước hình học nhỏ. Không dùng thùng/dây vật lý, đèn động hoặc bóng đổ riêng. Vật cản đơn giản dùng hệ thống Rapier và lưới tìm đường có sẵn. Chỉ bộ phận gàu và đòn gánh cập nhật khi chạy frame; không tạo geometry hay cập nhật Zustand mỗi frame.

Chạy `npm run audit:water` để đo số tam giác, bộ nhớ geometry và số lượt vẽ bổ sung; `npm test` kiểm tra lối đi, lấy/giao/hủy, bấm lặp, sức chứa, đổi phòng, lưu tiến độ và truyền tư thế qua server. `npm run build` kiểm tra TypeScript và tạo bản chạy. Các kiểm tra này không thay thế phép đo FPS thực tế trong trình duyệt.
