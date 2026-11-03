# Lạy Phật và tiếng chén đồng

## Động tác

- **Từ đứng:** chắp tay, hạ gối trong 0,95 giây; sau khi đã quỳ mới cúi lạy, mở hai tay chống sàn, giữ một nhịp, ngẩng lên và đứng lại. Tổng một lượt 4,8 giây.
- **Trên bồ đoàn:** bắt đầu cúi ngay, giữ nguyên ID chỗ ngồi, lạy trước đệm rồi trở về tư thế ngồi. Tổng một lượt 3,05 giây.
- Tay có mục tiêu tiếp xúc sàn, khuỷu mở theo động tác; chân chuyển sang gập gối và nếp áo hạ theo hông. Không thêm mô phỏng vải hoặc physics cho các khớp.
- Click lạy liên tiếp trong cùng một lượt được bỏ qua: giữ nguyên đồng hồ động tác và một lần ghi công đức. Đi lại/đứng dậy/chắp tay hủy lượt đang thực hiện; không để hẹn giờ cũ đổi lại tư thế về sau.
- Nếu đang ngồi ghế cao, nhân vật đứng xuống sàn trước khi thực hiện luồng quỳ. Bồ đoàn được nhận diện riêng.

## Âm thanh theo video J gửi

Video tham khảo: `20261103-0830-30.8241048.mp4`. Đã kiểm tra khung hình và phân tích phổ âm thanh. Các đỉnh ngân khoảng 864 Hz, 2.347/2.361 Hz, 4.297 Hz và 6.619 Hz được dùng để tái tạo một tiếng chén đồng riêng bằng tổng hợp cộng: các mode hơi lệch nhau tạo rung ngân, phần dùi gõ ngắn và phản xạ nhỏ tạo độ sống. Đây là âm được tái tạo theo sắc âm video, không phải trích nguyên soundtrack phim.

- File runtime `public/assets/audio/bow-bowl.mp3`: **51.870 byte (~50,7 KiB)**, mono 22.050 Hz, 64 kb/s, khoảng 6,4 giây.
- Synth được render trước khi build; trình duyệt tải/giải mã một lần, sau đó dùng chung AudioBuffer. Không chạy bộ tổng hợp nhiều oscillator cho từng lần lạy.
- Tiếng gõ được hẹn bằng đồng hồ Web Audio ở 85% pha cúi: khoảng 1,885 giây từ đứng, 0,935 giây từ bồ đoàn. Một mã lượt chỉ phát một lần; bỏ tiếng đã quá trễ thay vì phát lệch động tác.
- Hủy trước nhịp gõ thì bỏ tiếng chờ. Sau khi tiếng đã gõ, đuôi ngân tự tắt. Nút tắt âm thanh dừng cả tiếng đang ngân.
- Tối đa hai tiếng ngân cùng lúc; khi vượt mức, đuôi cũ giảm âm nhẹ trước khi dừng. Các source/gain được ngắt khi kết thúc; dùng chung một AudioContext với âm thanh hiện có.
- AudioBuffer được trình duyệt giải mã theo sample rate của máy; khoảng 1,17 MiB tại 48 kHz, chưa tính bộ nhớ của các âm thanh khác. Không suy diễn thành cam kết FPS.

Tham số và nguồn tạo âm nằm trong `src/bowlSynthesis.ts`; chạy `node --import tsx scripts/render-bowl.ts` để tạo WAV trong artifacts, sau đó dùng FFmpeg mã hóa MP3 mono 64 kb/s/22.050 Hz. FFmpeg chỉ là công cụ xử lý khi phát triển, không được đóng gói vào game.

## Kiểm tra

37 kiểm thử đạt: thứ tự quỳ trước cúi, timeline liên tục, lạy trực tiếp từ bồ đoàn, quay lại đứng/ngồi, bấm lặp, hủy, không lưu lượt lạy dở, tín hiệu hữu hạn/không clipping, kích thước MP3, cache decode, mute và hủy tiếng hẹn. Các kiểm thử game trước vẫn chạy.

[Xem và nghe thử hai tư thế](http://127.0.0.1:5174/?view=lay-phat). Có thanh tiến trình để xem từng giai đoạn; bấm **Lạy một lần** để chạy với tiếng chén đồng. Trong game, dùng nút **Lạy Phật**; bật biểu tượng loa nếu đang tắt âm thanh.

Kiểm tra trình duyệt trong điện: lạy từ đứng kết thúc về đứng; trên bồ đoàn 16, hai lần bấm liên tiếp chỉ tăng một lượt công đức và kết thúc vẫn có nút Đứng dậy tại chỗ. Các ảnh tư thế nằm trong artifacts/bow. Build TypeScript/Vite thành công.


## Lạy tự do tại chỗ

Lạy Phật không còn gắn với khu vực chánh điện. Có thể lạy ngay tại nơi đang đứng hoặc trên bồ đoàn ở Thiền Đường Trúc Lâm, rừng trúc và các khu vực khác. Mô tả hoạt động đã đổi thành lạy tại chỗ. Giữ nguyên vị trí, hướng, độ cao và ID bồ đoàn; xóa đường đi/ghế đang chờ trước khi lạy. Hai kiểm thử hồi quy bao phủ 13 khu vực và đủ 46 bồ đoàn, bao gồm 20 chỗ trong Trúc Lâm. Không thêm logic tìm đường, tài nguyên hoặc xử lý mỗi frame.


Kiểm tra trực tiếp bản chạy: tại Trúc Lâm, lạy khi đứng vẫn ở Trúc Lâm; chọn bồ đoàn 18, lạy xong vẫn ngồi đúng bồ đoàn, không sinh đường về chánh điện. Ảnh: artifacts/free-bow/truc-lam-after-bow.jpg.

