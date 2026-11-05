# Lá rụng trong sân — 04/11/2026

- Bỏ sáu chậu cây tròn nhỏ tại x = ±7,2, z = -8/0/8 như ảnh J gửi. Giữ cây đa, gốc/vành đá, ghế quanh hai cây, cây bồ đề và các khu vườn khác.
- Nguồn lá: bồ đề (-10, 0), đa sân Tây (-11, 20) và đa sân Đông (11, 20). Rơi khoảng chín giây từ tán; đọng ngoài gốc, tránh ghế và các vùng không đi được.
- Quét trong phạm vi 1,8 m: gom/thu nhỏ trong 650 ms, biến mất và chỉ tính tiến trình một lần. Gộp số lá gom trong frame thành một lần cập nhật tiến trình; kiểm tra quét tối đa 10 lần/giây.
- Mỗi lá có chu kỳ 150 giây so le. Lá đã quét đợi ít nhất 90 giây và chu kỳ kế tiếp rồi trở lại từ tán, không hiện đột ngột dưới đất. Giới hạn không tăng khi chạy lâu hoặc chuyển tab.
- 60 lá/cây ở Chi tiết (180 tổng), 30 lá/cây ở Tiết kiệm (90 tổng). Một InstancedMesh, một geometry 10 tam giác, một material opaque hai mặt; không ảnh texture, không alpha map, không bóng đổ riêng và không rigid body cho lá. Ngân sách chính tối đa 1 lượt vẽ, 1.800/900 tam giác, chưa tính các vật khác.
- Thay cả ba hệ cũ: lá sàn, lá bay trang trí và 28 rigid body lá. PhysicalLeaves.tsx cũ không còn được import vào game. Không tăng pool riêng cho mỗi lần rơi.
- Dùng lại pose/vector/matrix; chỉ ghi ma trận của lá đang động hoặc vừa đổi trạng thái. Lá tĩnh không ghi lại mỗi frame. Tab ẩn dừng cập nhật; quay lại tính pha theo thời gian hiện tại. Reduced motion giữ lá sàn và quét, ẩn chuyển động trên không.
- Lá và tiến trình quét tiếp tục là mô phỏng riêng từng trình duyệt như phiên bản trước; không thêm đồng bộ lá vào máy chủ phòng.

Kiểm chứng: 93 kiểm thử, TypeScript và production build. Kiểm tra đủ ba nguồn, pool giới hạn khi giả lập mười giờ, điểm rơi ngoài gốc/ghế, chuyển tiếp rơi–đọng liên tục, không quét giữa không trung/không đếm hai lần, chu kỳ hồi lá và reduced motion. Chưa kiểm tra lại hình ảnh trên trình duyệt (Local browser use đang tắt trong Work settings), chưa đo FPS thiết bị thật.
