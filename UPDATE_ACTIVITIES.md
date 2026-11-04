# Bản cập nhật sáu hoạt động — 03/11/2026

Tích hợp trên `main` tại `cfee532` (source đã chuyển ra thư mục gốc repository), nhánh `codex/temple-activities-mobile`. Bản làm việc trước tích hợp đã được sao lưu riêng; không đưa bản sao, node_modules, dist hoặc thông tin xác thực vào Git.

Giữ nguyên cập nhật mới của main: bồ đoàn Liên Thủy và độ nâng chỗ ngồi, 10 ghế đá/20 chỗ nghỉ, cây sân chùa và cây bồ đề, dâng hương ở gốc bồ đề, động tác lạy Phật theo timeline và âm chén đồng, camera tránh tán cây. Chỉ ghép thêm luồng sáu hoạt động và các sửa vật lý/giao diện liên quan.

## Kết quả hiện tại

| Khu vực | Thay đổi |
|---|---|
| Nhà ăn Hương Thiền | 5 bàn thấp, mỗi bàn 4 đệm ngồi, tổng 20 chỗ. Tư thế ngồi bệt áp dụng cho cả người chơi cục bộ và nhân vật từ mạng. Bàn, món ăn và ống đũa cùng dùng chiều cao mới. Quầy POS hai màn hình và Cô Tâm quay về cửa phía Nam. |
| Phục vụ món | Cô Tâm vào bếp trong khi món đang nấu, chờ tại điểm nhận món bên phải quầy, mang đến bàn rồi trở về lễ tân. Món trên quầy chỉ xuất hiện khi nấu xong. Các đường đi của 20 chỗ được kiểm tra tránh vật cản. Bánh mì cầm tay, mì/hủ tiếu dùng đũa, cơm dùng thìa. |
| Tàng kinh các | 20 bàn đơn với đệm ngồi và đèn nến nhỏ. Tủ sách “Một trang tĩnh lặng” chứa 4 trang gốc; có hình sách lật trang. |
| Trà đình Vọng Sơn | 10 bàn đôi, 20 ghế đối diện, mỗi bàn có ấm và chén trà. 3 tranh sen–trúc–sơn thủy trong khung gỗ viền đồng, góc cuốn; bảng gỗ ghi đúng “Thưởng thức chén trà, tâm an vạn sự”. |
| Lầu chuông | Thân chuông đồng sẫm, vai tròn, vành loe, đai hoa văn sen và quai đôi, khung gỗ đỏ theo dáng ảnh tham khảo. Xoay ở điểm treo, giảm dần trong 6 giây. Mái ẩn khi đến gần để nhìn rõ chuông. Nhân vật bước lên sàn và bị chặn trước thân chuông. Popup tiếng Việt rõ dấu, có nút đóng. |
| Thiền đường Trúc Lâm | Thêm hoa sen, mâm quả, năm chén nước, lư hương đồng và chân nến sen. Khói nhang chuyển động, lửa nến nhấp nháy. Nhạc nền ngũ cung riêng phát trong lúc tụng kinh; nút nhạc riêng không tắt tiếng chuông. Khép thời kinh dừng nhạc. |
| Hồ sen Nguyện ước | Đài viết lời nguyện ở đầu cầu. Đèn lồng dáng Hội An có nến, ngọn lửa và ánh sáng giấy lụa nhấp nháy; bay lên từ hồ trong 4,2 giây rồi chuyển động quanh hồ. Sen riêng trôi trên mặt nước. Popup sau khi đèn lên cao giữ hình sen bounce ngắn và lời vừa gửi. |

Tổng 126 chỗ: 46 bồ đoàn + 20 đệm ăn + 20 chỗ đọc + 20 ghế trà + 20 chỗ ghế đá từ main mới. Các cạnh không có tường của nhà ăn, thư viện, phòng trà và thiền đường cho phép đi ngang; tường thật, cột và đồ nội thất vẫn có va chạm.

## Hiệu năng và khả năng thay đồ họa

- Tối đa 8 đèn bay, tồn tại 120 giây; lịch sử riêng giữ 30 lời. Quỹ đạo lấy mẫu tại chỗ, không tạo mảng hay cập nhật React mỗi frame.
- Khói nhang 14 hạt dùng một instanced mesh; cánh hoa và các chi tiết chuông được gộp geometry. Đèn nến/ấm trà/ống đũa dùng hình học chung và instancing khi phù hợp.
- Lửa không tạo shadow map/point light cho mỗi đèn. Bàn thờ dùng một đèn ấm không đổ bóng. Có prefers-reduced-motion cho lửa, khói, đèn bay và minh họa.
- Bộ 3 tranh là một atlas WebP khoảng 381 KB. Nhạc PCM khoảng 1,02 MB, chuông MP3 khoảng 271 KB; chỉ khởi tạo media sau thao tác bật âm thanh. Tắt âm hoặc ẩn trang sẽ dừng playback.
- Thay đồ họa đèn tại src/LanternModel.tsx: LanternSkin gồm Model, flamePosition, flameScale, candleHeight. LanternPresentation ráp mẫu 3D và hiệu ứng; FlyingLantern chỉ phụ trách đường bay. Có thể truyền skin mới mà không sửa lời nguyện, quỹ đạo hoặc bộ đếm thời gian.
- Lửa và khói dùng chung ở src/FireEffects.tsx; dạng nhấp nháy là hàm thuần src/fireMotion.ts.
- Đổi bản ghi chuông/nhạc tại audioAssets trong src/audio.ts. Nguồn và giấy phép nằm trong public/audio/CREDITS.md; tranh và prompt nằm trong public/art/CREDITS.md. Ghi nguồn cũng hiển thị trong Cài đặt.

## Kiểm chứng

- TypeScript và production build đạt.
- 56/56 kiểm thử tự động đạt sau tích hợp main mới: đường đi mọi chỗ ngồi, va chạm Rapier thật ở sàn chuông, phục vụ đủ 20 chỗ, vật phẩm/tiến trình, giới hạn đèn, flicker, hủy âm thanh đang tải, không phát trùng, phòng và đồng bộ, MIME media và tải từng đoạn (HTTP Range) trên máy chủ.
- Trước khi tích hợp main mới, đã thao tác trực tiếp trên Edge với viewport tablet 820 × 1180 và điện thoại 390 × 844: chọn đệm ăn, gọi bánh mì và dùng bữa; uống trà; chuông và popup; tụng kinh và nút nhạc; đài viết lời nguyện.
- Trước khi tích hợp, bài kiểm tra âm thanh trên trình duyệt thật xác nhận MP3 và WAV phát được, thời gian media tiến, khép thời kinh dừng nhạc, không tạo media trùng, mute dừng mọi nguồn. Bản ghi OGG ban đầu được thay bằng MP3 và media trực tiếp sau khi đường tải/giải mã Web Audio không nhận được nội dung trong phiên remote.
- Ảnh bằng chứng trong artifacts/ (không đưa vào Git). Lượt remote tiếp nối bị công cụ dừng vì không xác minh được URL Edge; các chỉnh màu giấy lụa/ngọn lửa cuối cùng và mái chuông ẩn khi đến gần chưa được quan sát lại trên bản build cuối. Bản tích hợp main mới chưa được kiểm tra lại qua UI remote; kiểm chứng sau tích hợp gồm TypeScript, 56 kiểm thử, production build và audit:assets. Các ảnh cũ không được coi là bằng chứng hình ảnh cho bản tích hợp. Giả lập viewport không phải phép đo FPS trên điện thoại thật. Công cụ remote chưa hỗ trợ Cốc Cốc; kiểm tra được thực hiện trên Edge.

## Chạy dự án

```sh
npm run build
npm test
node server.mjs
```

Mặc định là cổng 5174; có thể đặt PORT để chạy bản thử riêng. Có sẵn package script test cho toàn bộ 56 kiểm thử. Cảnh báo build về physics 2,22 MB trước gzip (813 KB gzip) vẫn còn từ nền tảng hiện tại.

## Giới hạn còn lại

- Chuông và đồ cúng là mô hình tự dựng theo phong cách hiện có, chưa phải asset điêu khắc chi tiết do họa sĩ xuất GLB.
- Bản ghi chuông là của Jnn tại chùa Chōmei-ji ở Nhật, CC BY 2.1 Japan; không phải bản thu tại chùa Việt. Nhạc thời kinh là hòa âm nhạc cụ, không có giọng tụng của tăng sĩ.
- Cô Tâm phục vụ đơn trong phiên của mỗi người; chưa có hàng đợi NPC dùng chung toàn máy chủ. Lời nguyện và đèn vẫn riêng trên trình duyệt, chưa đồng bộ đèn/lời nguyện giữa người chơi.
