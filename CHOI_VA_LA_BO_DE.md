# Chổi cán gỗ và lá bồ đề · 05/11/2026

Dùng hai ZIP J cung cấp: **Choi_Can_Go_Web (2).zip** và **La_Bo_De_Texture (2).zip**. ZIP và file Maya gốc giữ nguyên, chỉ bản web được đặt trong `public/assets/sweeping`. Thay chổi hình trụ/hình nón và lá màu đơn cũ.

## Cầm và quét

Chổi nguồn cao khoảng 1,25 m; vùng cán gỗ từ y = 0,355 tới 1,236. Tay trái nắm đoạn 1,10, tay phải nắm đoạn 0,84. Một bộ tính chuyển động dùng chung điều khiển cán, hai điểm nắm và vùng tiếp xúc đầu chổi. Chuyển hai điểm nắm về tọa độ thân trên, tính khuỷu tay bằng hai đoạn cố định 31/30 cm, bù độ nghiêng thân và tỉ lệ nhân vật nam/nữ. Các ngón tay ở tư thế vòng ôm cán; lòng bàn tay/wrist lệch khỏi trục cán, không để cả tay mở xuyên vào cán.

Nhát quét trái/phải có chu kỳ 1,5 giây. Đầu chổi tách riêng, điểm xoay ở chỗ buộc y = 0,39. Khi vùng đầu chổi chạm lá trên mặt đất, lá trượt/đảo nhẹ theo hướng quét rồi gom, đầu chổi có rung đàn hồi tắt dần trong dưới 0,65 giây. Không dùng rigid body cho từng sợi hoặc từng lá. Reduced motion bỏ rung đầu chổi và lá bay, giữ tiếp xúc/gameplay. Khi chưa tải được chổi thì chưa gom lá.

Tiếp xúc dùng đoạn đường đi của đầu chổi giữa hai mẫu. Vùng gom có bán trục 28 cm ngang và 41 cm dọc đầu chổi, cộng mép lá. Không hút lá sau lưng hay chỉ vì nhân vật đứng gần. Dùng vị trí render thực của chân và hướng nhân vật, thay cho snapshot vị trí trễ. Khi nhảy vị trí trên 45 cm giữa hai mẫu hoặc mẫu trễ trên 150 ms, bỏ đoạn nối để không quét xuyên bản đồ. Tiếp xúc và rung nằm ngoài Zustand; chỉ cập nhật tiến độ khi thật sự gom được lá. Lá gom trượt về mép gốc cây trong khoảng 1,15 giây. Cứ 10 lá mới được 1 công đức, số lá lẻ được lưu cho lần quét tiếp. Lá và rung va chạm vẫn riêng từng trình duyệt; peer nhìn thấy tư thế cầm/quét, không đồng bộ từng chiếc lá/rung đầu chổi qua mạng.

## Ngân sách

| Asset | Chi tiết | Tiết kiệm |
|---|---:|---:|
| Chổi GLB | 201.344 byte / 9.001 tam giác | 82.872 byte / 2.988 tam giác |
| Lượt vẽ chổi | 3 | 3 |
| Texture gỗ dùng chung | 116.984 byte, 512² JPEG | cùng texture/cache |
| Lá | 180 lá / 1.440 tam giác | 90 lá / 720 tam giác |

Chổi nguồn 947.436 byte / 21.856 tam giác. Bản web gộp cán, chi tiết buộc/quai và đầu chổi, nén Meshopt; không thêm decoder CDN hay thư viện runtime. Tải một model theo cài đặt đồ họa. Tắt bóng đổ riêng của chổi, giữ nhận bóng; model và vật liệu được cache khi nhiều nhân vật quét.

Ba PNG lá nguồn 1.254² tổng 2.854.879 byte được cắt viền alpha và ghép thành một atlas WebP **512² / 37.106 byte**. Bốn ô 256² (vàng, đỏ vàng, xanh, ô lặp chống lọt màu), viền đệm 4 px. Hình học giữ đúng tỉ lệ dài/rộng của lá, gấp sống nhẹ, chỉ 8 tam giác. Mỗi instance chọn ô atlas trong vertex shader; cả ba màu dùng **một lượt vẽ**. Màu texel được nhân với alpha trước khi lọc để tránh viền trắng. Alpha-test 0,39 và depth-write giữ lá trong lượt vẽ đục. Bộ nhớ texture RGBA gồm mipmap khoảng 1,4 MB. Lá nằm im không ghi lại ma trận mỗi frame, pool và mảng tiếp tục được tái dùng.

## Tái tạo và kiểm tra

Trích hai ZIP vào `tmp/sweep-imports`. Chạy `npm run prepare:broom`, rồi `./scripts/pack-bodhi-leaves.ps1 -WebPEncoder "đường dẫn FFmpeg có libwebp"`. FFmpeg hiện ở `tmp/audio-tools/package/ffmpeg.exe`, là công cụ dev đã có từ lần xử lý âm thanh; không đóng gói vào game. PNG atlas trung gian nằm trong tmp. Báo cáo/hash nguồn: `broom-budget.json` và `leaves-budget.json` cạnh asset.

Kiểm thử kiểm tra giải mã hai LOD, kích thước/điểm xoay, vùng nắm thật trên cán, hai đoạn tay không kéo giãn qua nhiều pha/giới tính, vùng tiếp xúc mọi hướng, bỏ teleport, chỉ gom lá đất một lần, rung tắt dần, reduced motion, alpha/atlas và ngân sách. Thử trực tiếp trong trình duyệt thấy chổi, lá mới, hai tay giữ cán và công đức tăng 18 → 20 khi quét; không có lỗi console trong lần kiểm tra. Chưa đo FPS trên thiết bị di động thật.

Kết quả cuối: npm test đạt 111 kiểm thử client và 5 kiểm thử server (116 tổng); TypeScript và production build đạt. Đã thử cả Chi tiết/Tiết kiệm trong trình duyệt, khôi phục Chi tiết, tải lại bản build cuối và quét tiếp thấy công đức 20 → 22. Không có lỗi console. HTTP xác nhận đủ bốn asset runtime trả 200 đúng kích thước. Kiểm thử server JavaScript chạy trực tiếp bằng Node thay vì qua tsx để tránh giữ tiến trình sau khi test hoàn tất.
