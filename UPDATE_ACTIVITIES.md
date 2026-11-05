# Bản cập nhật sáu hoạt động — 04/11/2026

Khôi phục nhánh `codex/temple-activities-mobile` lên `main` mới nhất tại `604ab35`, nhánh tích hợp `codex/restore-activities-latest`. Giữ chánh điện mới, 48 bồ đoàn trong chánh điện, hồ cá/cầu mới và đồng bộ đồ cúng/vườn rau của main. Bản làm việc trước tích hợp được giữ riêng; không đưa bản sao, node_modules, dist hoặc thông tin xác thực vào Git.

Giữ nguyên cập nhật mới của main: bồ đoàn Liên Thủy và độ nâng chỗ ngồi, 10 ghế đá/20 chỗ nghỉ, cây sân chùa và cây bồ đề, dâng hương ở gốc bồ đề, động tác lạy Phật theo timeline và âm chén đồng, camera tránh tán cây. Chỉ ghép thêm luồng sáu hoạt động và các sửa vật lý/giao diện liên quan.

## Kết quả hiện tại

| Khu vực | Thay đổi |
|---|---|
| Nhà ăn Hương Thiền | 5 bàn thấp, mỗi bàn 4 đệm ngồi, tổng 20 chỗ. Tư thế ngồi bệt áp dụng cho cả người chơi cục bộ và nhân vật từ mạng. Bàn, món ăn và ống đũa cùng dùng chiều cao mới. Quầy POS hai màn hình và Cô Tâm quay về cửa phía Nam. |
| Phục vụ món | Cô Tâm vào bếp trong khi món đang nấu, nhận khay bên phải quầy rồi mang đến điểm phục vụ ở đầu bàn. Đường đi tránh cả 20 đệm ngồi. Cô dừng, quay vào bàn, hạ khay và rút tay trong 2,4 giây trước khi về lễ tân. Cùng một khay/món/ly nước chuyển động liên tục từ quầy qua tay xuống bàn, không đổi kích thước hoặc tạo lại khi đơn sẵn sàng. Bánh mì cầm tay, mì/hủ tiếu dùng đũa, cơm dùng thìa. |
| Cô An · Phụ trách bếp | Đứng ở giữa bếp khi rảnh, có tạp dề và khăn đầu. Nhận đơn thì đảo nồi với hơi nóng và ánh bếp trong đúng 3 giây; sau đó mang khay theo lối phía sau quầy đến bên phải, đặt xuống rồi trở về bếp. Cô Tâm chờ khay được đặt và Cô An rút tay xong mới lấy món. |
| Tàng kinh các | 20 bàn đơn với đệm ngồi và đèn nến nhỏ. Tủ sách “Một trang tĩnh lặng” chứa 4 trang gốc; có hình sách lật trang. |
| Trà đình Vọng Sơn | 10 bàn đôi, 20 ghế đối diện, mỗi bàn có ấm và chén trà. 3 tranh sen–trúc–sơn thủy trong khung gỗ viền đồng, góc cuốn; bảng gỗ ghi đúng “Thưởng thức chén trà, tâm an vạn sự”. |
| Lầu chuông | Thân chuông đồng sẫm, vai tròn, vành loe, đai hoa văn sen và quai đôi, khung gỗ đỏ theo dáng ảnh tham khảo. Xoay ở điểm treo, giảm dần trong 6 giây. Mái ẩn khi đến gần để nhìn rõ chuông. Nhân vật bước lên sàn và bị chặn trước thân chuông. Popup tiếng Việt rõ dấu, có nút đóng. |
| Thiền đường Trúc Lâm | Thêm hoa sen, mâm quả, năm chén nước, lư hương đồng và chân nến sen. Khói nhang chuyển động, lửa nến nhấp nháy. Nhạc nền ngũ cung riêng phát trong lúc tụng kinh; nút nhạc riêng không tắt tiếng chuông. Khép thời kinh dừng nhạc. |
| Hồ sen Nguyện ước | Đài viết lời nguyện ở đầu cầu. Đèn lồng dáng Hội An có nến, ngọn lửa và ánh sáng giấy lụa nhấp nháy; bay lên từ hồ trong 4,2 giây rồi chuyển động quanh hồ. Sen riêng trôi trên mặt nước. Popup sau khi đèn lên cao giữ hình sen bounce ngắn và lời vừa gửi. |

Tổng 156 chỗ: 76 bồ đoàn + 20 đệm ăn + 20 chỗ đọc + 20 ghế trà + 20 chỗ ghế đá. Các cạnh không có tường của nhà ăn, thư viện, phòng trà và thiền đường cho phép đi ngang; tường thật, cột và đồ nội thất vẫn có va chạm.

## Hiệu năng và khả năng thay đồ họa

Hoành phi ngày 04/11: Trà đình, Tàng Kinh Các và nhà ăn dùng chung mẫu nền son, nẹp vàng, khung gỗ, hoa sen và chữ Palatino đậm xuất thành vector. Nội dung hai bảng mới là “Đọc sách mở trí, tĩnh tâm dưỡng đức” và “Dùng bữa chánh niệm, nuôi dưỡng thân tâm”. Tranh phòng trà được hạ xuống để không chạm khung bảng. Ba SVG tổng khoảng 121 KB; mỗi bảng dùng hai draw call ở lượt vẽ chính và không có animation loop. Production build đạt. Đã xem mẫu chữ trên màn hình điện thoại và đến cả ba khu vực trong game bằng trình duyệt; kiểm tra thêm nhà ăn ở viewport tablet 820 × 1180. Ảnh mẫu và ảnh trong game nằm trong artifacts/ (không commit). Đây là kiểm tra hiển thị, không phải phép đo FPS trên thiết bị thật. Hướng dẫn thay chữ nằm trong public/art/signs/README.md.

Phục vụ món ngày 04/11: điểm phục vụ và vị trí khay đặt lấy theo bàn/chỗ ngồi trong src/mealService.ts. Bộ lấy mẫu dùng lại object qua mỗi frame; tay nhân vật và khay dùng chung dữ liệu chuyển động. Một model khay của người chơi cục bộ được giữ suốt từ lúc món chín đến khi ăn xong, kể cả lúc NPC đã rời bàn. Mặt dưới khay chạm đúng mặt bàn; món của người chơi từ mạng dùng cùng điểm đặt. Đã kiểm tra tự động đủ 20 chỗ, khoảng cách tránh đệm ngồi, tính liên tục ở các mốc giao món, độ cao tiếp xúc và khay đứng yên khi NPC quay về. Toàn bộ 83/83 kiểm thử và production build đạt. Đã gọi mì chay trực tiếp trong game, quan sát mang món, dừng/quay, hạ khay và trở về; ảnh ở artifacts/meal-arrival.jpg, meal-placing.jpg và meal-on-table.jpg. Kiểm tra hiển thị ở khung điện thoại và tablet 1180 × 820, chưa đo FPS trên máy điện thoại thật.

Cô An ngày 04/11: thời gian nấu thay thành 3.000 ms. Mốc `counterReadyAt` tách lúc nấu xong khỏi lúc khay đã đặt lên quầy; máy chủ giữ mốc này khi đồng bộ, vẫn nhận đơn từ client cũ chưa có trường đó. Đường Cô An nằm sau quầy, tách điểm đứng của Cô Tâm. Cùng một model khay tiếp tục từ tay Cô An qua quầy, tay Cô Tâm và bàn ăn. Quầy, nồi, tay và va chạm cùng dùng chiều cao mới để nhìn rõ nhân vật; nhãn bếp được dời sang trái, bảng tên Cô An nâng lên. Lịch chuyển động được cache tối đa tám đơn, cập nhật bằng ref; hiệu ứng bếp không tạo đèn đổ bóng riêng. Toàn bộ 86/86 kiểm thử và production build đạt. Đã thử gọi cơm và mì trong trình duyệt ở viewport tablet 1180 × 820 và điện thoại ngang 960 × 500, quan sát đầy đủ nấu, đặt khay, nhận món, phục vụ và trở về vị trí nghỉ. Ảnh bản cuối trong artifacts/co-an-cooking-final.jpg, co-an-pass-final.jpg và co-an-co-tam-final.jpg (không commit); các ảnh này được cắt từ screenshot để nhìn rõ khu bếp. Chưa đo FPS trên điện thoại thật.

- Tối đa 8 đèn bay, tồn tại 120 giây; lịch sử riêng giữ 30 lời. Quỹ đạo lấy mẫu tại chỗ, không tạo mảng hay cập nhật React mỗi frame.
- Khói nhang 14 hạt dùng một instanced mesh; cánh hoa và các chi tiết chuông được gộp geometry. Đèn nến/ấm trà/ống đũa dùng hình học chung và instancing khi phù hợp.
- Lửa không tạo shadow map/point light cho mỗi đèn. Bàn thờ dùng một đèn ấm không đổ bóng. Có prefers-reduced-motion cho lửa, khói, đèn bay và minh họa.
- Bộ 3 tranh là một atlas WebP khoảng 381 KB. Nhạc PCM khoảng 1,02 MB, chuông MP3 khoảng 271 KB. Khi cần âm thanh, tải từng bản ghi qua JavaScript chunk riêng và phát bằng data URL để tránh IDM chặn URL media; không tải những chunk này trong HTML ban đầu. Tắt âm hoặc ẩn trang sẽ dừng playback. Âm chén đồng được tổng hợp ngay trên máy, không fetch MP3.
- Thay đồ họa đèn tại src/LanternModel.tsx: LanternSkin gồm Model, flamePosition, flameScale, candleHeight. LanternPresentation ráp mẫu 3D và hiệu ứng; FlyingLantern chỉ phụ trách đường bay. Có thể truyền skin mới mà không sửa lời nguyện, quỹ đạo hoặc bộ đếm thời gian.
- Lửa và khói dùng chung ở src/FireEffects.tsx; dạng nhấp nháy là hàm thuần src/fireMotion.ts.
- Đổi bản ghi chuông/nhạc trong public/audio rồi chạy npm run build; scripts/embed-ritual-audio.mjs tạo lại các module trong src/generated (không commit). Các script dev, test và build đều tự chạy bước này. Nguồn và giấy phép nằm trong public/audio/CREDITS.md; tranh và prompt nằm trong public/art/CREDITS.md. Ghi nguồn cũng hiển thị trong Cài đặt.

Sửa dáng đặt khay ngày 05/11: thân trên trước đây dịch về phía trước trong khi vạt áo và chân đứng yên, tạo khe hở ngang eo ở cả Cô An và Cô Tâm. Vạt áo riêng của từng NPC nay nối khít với vòng eo của thân trên, uốn theo hông và đầu gối; hai chân gập với chiều dài cố định và bàn chân giữ trên sàn. Tư thế cúi, hạ hông và đứng lên được chuyển tiếp mềm. Geometry trang phục dùng chung của các nhân vật khác không bị sửa; geometry riêng được tái sử dụng, bỏ qua cập nhật khi tư thế không đổi và giải phóng khi NPC bị tháo. Toàn bộ 90/90 kiểm thử và production build đạt, gồm kiểm tra đường nối áo, chân và chuyển tiếp ở bước thời gian tương ứng 15/30/60 FPS. Đã xem cận cảnh cả hai NPC bằng trình duyệt với chính model và bộ lấy mẫu chuyển động của game; ảnh ở artifacts/co-tam-rig-fixed.jpg và co-an-rig-fixed.jpg (không commit). Đây là kiểm tra tư thế trong cảnh thử riêng, chưa phải đo FPS trên điện thoại thật hay chạy lại toàn bộ quy trình gọi món.

Đồng bộ bồ đoàn, nến và hồ sen ngày 05/11: 20 ghế trà được thay bằng bồ đoàn ngồi bệt đối diện nhau; bàn trà hạ còn cao 0,77. Toàn bộ 136 chỗ ngồi bệt (chánh điện, thiền đường, rừng trúc, nhà ăn, thư viện và trà đình) dùng chung mẫu Liên Thủy của Trúc Lâm, chia hai LOD và tối đa hai lượt vẽ chính. Các ID chỗ ngồi được giữ, điểm ngồi nhà ăn/thư viện/trà nâng theo mặt bồ đoàn và dùng cùng quy tắc tư thế cho người chơi cục bộ/từ mạng. Sơ đồ chỗ ngồi và hướng dẫn gọi món dùng tên bồ đoàn.

Nến Trúc Lâm, nến trong sen nổi và nến trong lồng đèn dùng chung SacredCandle; 20 nến đọc sách dùng cùng hiệu ứng SacredFlames ba lớp (lõi sáng, lửa vàng và quầng ấm), gom thành ba instanced mesh. Tim nến, nhấp nháy và chế độ giảm chuyển động được dùng chung; không thêm point light hoặc bóng đổ cho từng nến. LanternSkin tiếp tục giữ các điểm neo để thay mẫu lồng đèn sau này.

Mặt hồ sen hạ 0,56 đơn vị, tương đương khoảng một phần ba chiều cao nhân vật. Hai lớp nền đất được khoét lòng hồ và có bờ dốc; gạch lối đi không còn lấn ra mặt nước. Sen tĩnh, sen mang nến và điểm đèn bắt đầu bay cùng theo mặt nước mới, đèn vẫn lên đến độ cao cũ trước khi mở popup. Cầu mới có hai hàng lan can uốn, mố đá và ván mặt cầu theo vòm nhẹ: đỉnh cao hơn hai đầu 0,72 đơn vị. Mặt cầu hiển thị, va chạm Rapier, hỗ trợ bước lên và floorAt dùng chung profile; hai đầu nối sân ở cao độ 0,06. Chặn lòng hồ theo hình ellipse và giữ lối đi giữa cầu.

Kiểm chứng bản này: 94/94 kiểm thử đạt, TypeScript/production build và audit:assets đạt. Kiểm thử gồm raycast qua lòng hồ, đo mặt cầu thật bằng raycast, capsule Rapier đi qua cầu cả hai chiều, lối đi đến đủ 136 bồ đoàn, giữ 20 điểm phục vụ món và sen/đèn theo mặt nước mới. Đã trực tiếp ngồi uống trà, đọc sách, ngồi ăn, đi lên cầu và thả đèn trong game; xem khung điện thoại 390 × 844, điện thoại ngang 960 × 540 và tablet 1180 × 820. Đã xem cận cảnh ba mẫu nến bằng source thật trong cảnh thử riêng. Ảnh lưu trong artifacts/ với hậu tố 20261105; không commit ảnh hoặc cảnh thử. Chưa đo FPS trên điện thoại thật.

Tích hợp main ngày 05/11: nhận main `58f45e6`, gồm cổng/chuông/trống GLB, tối ưu lá rơi, nhiệm vụ gánh nước và khu Quan Âm. Giữ hai NPC bếp/phục vụ cùng khay liên tục, sửa nối áo, hoành phi, nến dùng chung, bồ đoàn trà và hồ/cầu cong. Nhận bố trí mới 40 bồ đoàn chánh điện và 9 ghế đá từ main; tổng hiện tại 128 bồ đoàn + 18 chỗ ghế đá = 146 chỗ. Áp dụng tối ưu một batch bồ đoàn ở chất lượng thấp, đồng thời giữ kích thước và độ nâng chỗ ngồi theo mẫu Trúc Lâm. Giữ đường âm thanh qua JavaScript chunk/data URL và âm chén đồng tổng hợp để tránh IDM bắt link media. Kiểm chứng: 123/123 kiểm thử, production build, audit:assets và audit:water đạt; lần này chưa kiểm tra lại UI remote.

## Kiểm chứng

- TypeScript và production build đạt.
- 81/81 kiểm thử tự động đạt sau tích hợp main 604ab35: đường đi mọi chỗ ngồi, va chạm Rapier thật ở sàn chuông, phục vụ đủ 20 chỗ, vật phẩm/tiến trình, giới hạn đèn, flicker, hủy âm thanh đang tải, không phát trùng, âm thanh không fetch URL media, phòng và đồng bộ đồ cúng/vườn rau, MIME media và tải từng đoạn (HTTP Range) trên máy chủ.
- Trước khi tích hợp main mới, đã thao tác trực tiếp trên Edge với viewport tablet 820 × 1180 và điện thoại 390 × 844: chọn đệm ăn, gọi bánh mì và dùng bữa; uống trà; chuông và popup; tụng kinh và nút nhạc; đài viết lời nguyện.
- Trước khi tích hợp, bài kiểm tra âm thanh trên trình duyệt thật xác nhận MP3 và WAV phát được, thời gian media tiến, khép thời kinh dừng nhạc, không tạo media trùng, mute dừng mọi nguồn. Bản ghi OGG ban đầu được thay bằng MP3 và media trực tiếp sau khi đường tải/giải mã Web Audio không nhận được nội dung trong phiên remote.
- Ảnh bằng chứng trước đây trong artifacts/ (không đưa vào Git). Bản tích hợp main 604ab35 chưa được kiểm tra lại qua UI remote; kiểm chứng hiện tại gồm TypeScript, 81 kiểm thử, production build và audit:assets. Các ảnh cũ không được coi là bằng chứng hình ảnh cho bản tích hợp. Giả lập viewport không phải phép đo FPS trên điện thoại thật. Công cụ remote chưa hỗ trợ Cốc Cốc; các lần kiểm tra trực quan trước đây được thực hiện trên Edge.

## Chạy dự án

```sh
npm run build
npm test
node server.mjs
```

Mặc định là cổng 5174; có thể đặt PORT để chạy bản thử riêng. Có sẵn package script test cho toàn bộ 94 kiểm thử. Build còn cảnh báo kích thước chunk physics 2,22 MB và chunk nhạc tải riêng 1,37 MB trước gzip.

## Giới hạn còn lại

- Chuông và đồ cúng là mô hình tự dựng theo phong cách hiện có, chưa phải asset điêu khắc chi tiết do họa sĩ xuất GLB.
- Bản ghi chuông là của Jnn tại chùa Chōmei-ji ở Nhật, CC BY 2.1 Japan; không phải bản thu tại chùa Việt. Nhạc thời kinh là hòa âm nhạc cụ, không có giọng tụng của tăng sĩ.
- Cô An và Cô Tâm xử lý đơn trong phiên của mỗi người; chưa có hàng đợi NPC dùng chung toàn máy chủ. Lời nguyện và đèn vẫn riêng trên trình duyệt, chưa đồng bộ đèn/lời nguyện giữa người chơi.
