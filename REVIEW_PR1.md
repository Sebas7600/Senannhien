# Review và xử lý conflict PR #1 — 04/11/2026

PR: https://github.com/leovo158/SenAnNhien/pull/1

Ghép `main` tại `604ab35` vào nhánh Sebas `codex/temple-activities-mobile` tại `bd49078`. Giải quyết từng phần trong 13 file conflict; không dùng lựa chọn toàn bộ incoming/ours. Bản này cập nhật nhánh PR, không tự merge PR vào main.

## Các quyết định

| Phần | Kết quả review |
|---|---|
| Nhà ăn, thư viện, trà | Giữ 5 bàn/20 đệm ăn, phục vụ món theo đường đi, 20 bàn đọc, 10 bàn trà đôi, tư thế đọc/uống trà và dụng cụ theo món. Giữ thông tin phục vụ trong đồng bộ nhân vật. |
| Chuông, hoa đăng, tụng kinh | Giữ mô hình, quỹ đạo giới hạn 8 đèn/120 giây, giao diện lời nguyện, tranh trà, nhạc thời kinh riêng và chế độ giảm chuyển động. |
| Chánh điện | Giữ GLB, vị trí, bậc thang, cột, lan can, hòm công đức và 48 bồ đoàn từ main. Không đưa lại sàn chánh điện phẳng cũ hoặc tường vô hình ở cạnh các đình mở. |
| Di chuyển | Giữ trọng lực và va chạm thực từ main, bảo vệ lư hương và hồ koi mới. Thêm hỗ trợ bước lên sàn đình/lầu chuông; không áp dụng cách kẹp độ cao theo toàn bản đồ vì có thể nâng người chơi qua thành nền chánh điện. |
| Hồ koi | Giữ vị trí mới (33, 9), cầu dốc, điểm cho cá ăn, thức ăn và cá được đồng bộ của main. Chỉ thay hoa đăng ở hồ sen bằng bản mới. |
| Lễ vật và vườn | Giữ toàn bộ API, xác nhận máy chủ trước khi trừ đồ, chống gửi trùng, phân phòng và revision cây của main. Không thay bằng trạng thái riêng cũ. |
| Thao tác chính | Giữ nút Chắp tay, Lạy Phật, Quét lá, Ngồi thiền và Bữa chay của main; các hoạt động mới truy cập từ Hoạt động hoặc tương tác tại chỗ. |
| Nhân vật | Ghép hoạt ảnh/dụng cụ ăn, đọc, trà và phục vụ với dụng cụ dâng lễ/chăm vườn. Giữ lạy Phật tự do, timeline quỳ/lạy, chén đồng và hủy đường đi khi bắt đầu lạy. |
| Âm thanh | Giữ cơ chế media và HTTP Range mới. Khôi phục tải trước chén đồng sau bật âm; vô hiệu hóa cả tiếng lạy còn chờ tải khi tắt âm/ẩn trang. |
| Mobile | Nạp cả rituals.css và mobile.css, để bố cục điều khiển hiện tại của main ưu tiên sau cùng. Giữ chất lượng tiết kiệm mặc định cho con trỏ cảm ứng. |
| Chỗ ngồi | 156 chỗ duy nhất: 76 bồ đoàn (48 điện, 20 thiền đường, 8 trúc), 20 đệm ăn, 20 bàn đọc, 20 ghế trà, 20 chỗ ghế đá. Tính số bồ đoàn từ dữ liệu. Nâng neo bồ đoàn điện thêm độ dày tọa cụ trên mặt nền mới để tránh chìm vào nền. |
| Kiểm thử | Giữ cả test main và Sebas. Bổ sung Web Crypto vào môi trường Node 18 ESM để kiểm thử đúng API của trình duyệt; không thay kiểm tra xác nhận máy chủ bằng giả định thành công. Kiểm tra vật lý dùng kích thước capsule và hỗ trợ bước hiện tại. |

## Kiểm chứng

- `npm test`: 82/82 đạt, gồm đường đi tới mọi chỗ ngồi, phục vụ 20 chỗ, va chạm Rapier, lạy Phật tại chỗ, âm thanh, giới hạn hoa đăng, phòng/chat, lễ vật và vườn chung, MIME/HTTP Range.
- `npm run build`: TypeScript và bản production đạt.
- `npm run audit:assets`: kiểm tra ngân sách asset/geometry/texture.
- Không còn dấu conflict trong mã nguồn và không còn file unmerged.

Lượt này thực hiện bằng Git theo yêu cầu. Chưa kiểm tra lại hình ảnh/UI trên trình duyệt hoặc đo FPS trên thiết bị di động; các kiểm thử tự động không được coi là bằng chứng trực quan hay đo hiệu năng thiết bị thật. Các ghi nhận UI và số 126 chỗ/56 test trong UPDATE_ACTIVITIES.md mô tả bản Sebas trước khi ghép main mới.

Nhạc thời kinh là hòa âm không giọng; bản thu chuông có nguồn Jnn/CC BY 2.1 Japan trong public/audio/CREDITS.md. Các giới hạn phục vụ NPC và lời nguyện riêng từng người của nhánh Sebas vẫn được nêu trong UPDATE_ACTIVITIES.md.
