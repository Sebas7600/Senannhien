# Sen An Nhiên 3

## Mở game

Giải nén `SenAnNhien_V3_Play.zip`, bấm đôi **Choi-Game.cmd**. Cần Node.js 18.20+ đã cài sẵn. Game mở tại http://127.0.0.1:5174 . Giữ cửa sổ máy chủ trong lúc chơi. Gói Play có bản build và toàn bộ mô hình/texture, không cần npm install.

Bản nguồn: `npm ci`, `npm run build`, rồi `node server.mjs`. Phát triển: chạy `node server.mjs` và `npm run dev` trong hai cửa sổ; mở http://127.0.0.1:5173 . `npm test` chạy kiểm thử trạng thái, lưu dữ liệu và máy chủ phòng.

## Năm thay đổi chính

1. **Di chuyển:** vật lý bước cố định 60 Hz, Rapier nội suy vị trí. Camera đọc trực tiếp vị trí đang render mỗi khung hình thay vì tọa độ giao diện 8 Hz. Bỏ dịch chuyển cưỡng bức 1 cm mỗi bước, gom việc lưu dữ liệu và bỏ bản lưu trùng. Nhân vật từ xa nội suy độc lập với các snapshot phòng.
2. **Chọn nhân vật:** nam/nữ, 6 màu áo, 2 kiểu áo, 4 sắc da và pháp danh; xem trước 3D, kéo để xoay. Tiến trình V2 cũ cũng mở màn chọn này một lần. Chỉnh lại trong Cài đặt → Chỉnh nhân vật 3D. Lựa chọn tự lưu trên trình duyệt hiện tại.
3. **Chắp tay:** bấm lần nữa để hạ tay. Đang đứng thì trở về đứng; đang ở bồ đoàn/ghế thì vẫn ngồi đúng chỗ. Không còn ép nhân vật vào tư thế ngồi khi chưa chọn chỗ. Chuyển động tay chuyển tiếp mượt.
4. **Đồ họa:** tượng Phật quét 3D của bảo tàng, đầu người từ mesh giải phẫu MakeHuman, bàn tay có ngón, áo có nếp và rig tay/chân. Thêm vật liệu PBR đá/gỗ/tường/ngói/vải, ánh sáng môi trường và tán cây bằng lá. Đây vẫn là game web với trang phục/animation được dựng bằng code; không phải toàn bộ asset đều là bản quét ảnh. Nguồn và giấy phép ở **ASSET_LICENSES.md**.
5. **Ủng hộ:** nút trái tim ở thanh trên và đường dẫn `/#/ung-ho`. Số tiền mẫu/tùy tâm, lời nhắn không dấu, thu/phóng QR và sao chép thông tin. Mặc định chưa cấu hình người nhận hoặc QR.

Vẫn có 13 khu vực, 88 chỗ ngồi và 4 món chay: mì chay, cơm chay, hủ tiếu chay, bánh mì chay. Xem README_V2.md cho phần bản đồ, ngồi, gọi món, vườn rau và chat.

## J thay QR sau như thế nào?

Trong **gói Play đã giải nén**:

1. Chép ảnh QR thật của J vào `dist/donate/qr.png`.
2. Mở `dist/donation.json` bằng trình soạn thảo văn bản. Điền `recipientName`, `bankName`, `accountNumber`; đổi `enabled` thành `true`.
3. Sửa `title`, `purpose`, `disclosure`, `transferPrefix` theo nơi thực sự nhận tiền. Mặc định là ủng hộ phát triển game; nếu nhận cho một ngôi chùa, ghi đúng tên chùa và mục đích thực tế. Không dùng thông tin ngân hàng của website tham khảo.
4. Giữ `qrImage` là `/donate/qr.png` hoặc đổi sang đường dẫn ảnh mới. `bankAppUrl` là tùy chọn, chỉ chấp nhận địa chỉ HTTPS; để trống vẫn dùng QR bình thường.
5. Đóng/mở lại mục Ủng hộ trong game. Cấu hình được tải lại mỗi lần mở. Kiểm tra tên, số tài khoản và QR có cùng người nhận.

Trong **bản nguồn**, chỉnh tương tự ở `public/donation.json`, ảnh tại `public/donate/qr.png`, rồi chạy `npm run build` để cập nhật dist. Chỉ sửa `dist` mà build lại sẽ bị ghi đè; hãy sửa `public` nếu tiếp tục phát triển.

QR là ảnh tĩnh: lựa chọn số tiền/lời nhắn cung cấp nội dung để sao chép, không sửa nội dung QR. Game không kết nối API thanh toán hoặc tự xác nhận chuyển khoản; không yêu cầu mật khẩu/OTP. Ủng hộ không cộng công đức hoặc vật phẩm.

## Kiểm tra và hiệu năng

37 kiểm thử tự động bao gồm các món chay, đường đến ghế, vườn, phần thưởng, chắp tay liên tiếp, di trú tiến trình V2, lưu nhân vật, bộ đệm lưu và đồng bộ phòng/trang phục/chat. TypeScript và build production đã kiểm tra. Ảnh kiểm tra trình duyệt ở `artifacts/v3` trong bản nguồn.

Chế độ Chi tiết bật bóng đổ và DPR tối đa 1.3; chế độ Tiết kiệm tắt bóng đổ, DPR 1. FPS phụ thuộc GPU, độ phân giải và trình duyệt. Các lỗi nhịp camera/vật lý đã được xử lý; không cam kết 60 FPS trên mọi máy. Thử Cài đặt → Hình ảnh → Tiết kiệm trên máy yếu.

Máy chủ mặc định chỉ lắng nghe localhost. Phòng/chat hoạt động giữa các cửa sổ cùng máy chủ; đây chưa phải máy chủ công khai. Tiến trình và ngoại hình lưu cục bộ; chat không lưu sau khi tắt server.

## Ghế đá Việt Nam

Mười băng ghế ngoài sân/hồ đã thay bằng ghế granito đúc liền, hai vị trí ngồi trên mỗi băng. Có màu xanh ngọc, đỏ gạch và trắng ngà, mặt/tựa bo cong, sọc hai màu, hạt đá PBR và chữ đỏ. Mở http://127.0.0.1:5174/?view=ghe-da để xoay mô hình và so sánh ba hoàn thiện. Nguồn tham khảo và tỷ lệ: [RESEARCH_GHE_DA_VIET_NAM.md](RESEARCH_GHE_DA_VIET_NAM.md).

## Bồ đề tán khối và tối ưu tài nguyên

Hai cây gần tam quan có gốc/rễ và bồn đá riêng, mỗi cây ba băng ghế, chừa lối đi ở giữa. Cây dâng hương không đặt ghế; thành bồn được nâng lên 56 cm. Xem [Hai gốc sân](http://127.0.0.1:5174/?view=san-chua) và [nghiên cứu/bố trí sân chùa](RESEARCH_SAN_CHUA.md).

Cây chính có rễ nổi, rễ phụ, bồn đá và bàn thờ lư hương; có thể dâng hương tại chỗ. Xem toàn cây hoặc cận gốc tại http://127.0.0.1:5174/?view=bo-de . Ghế đá được gộp mesh, instancing theo màu, hai LOD và texture hạt dùng chung; giữ đủ các vị trí ngồi. Báo cáo số liệu và cách kiểm tra nằm trong [OPTIMIZATION_BODE_GHEDA.md](OPTIMIZATION_BODE_GHEDA.md).


Ghế quanh hai gốc cây hiện kê sát ba mặt, bỏ mặt hướng về hàng đèn. Tán cây có thêm cụm lá nổi, UV/gân lá và vân màu nhẹ; geometry/texture dùng chung, không thêm lượt vẽ riêng cho lá.


## Bồ đoàn Liên Thủy

Toàn bộ bồ đoàn dùng mặt mây đan sen xoáy, thân bo và nẹp bện; nhân vật ngồi ở độ cao khớp mặt đệm. 46 gối dùng chung atlas, instancing hai LOD. Xem http://127.0.0.1:5174/?view=bo-doan và BO_DOAN_LIEN_THUY.md cho thiết kế, số liệu và kiểm tra.


## Lạy Phật và chén đồng

Từ đứng sẽ quỳ rồi mới lạy; đang ngồi bồ đoàn thì cúi ngay, kết thúc về chỗ ngồi. Tiếng chén đồng tái tạo theo video J gửi, đồng bộ một lần cho mỗi lượt; dùng chung audio buffer, hỗ trợ tắt tiếng và hủy lượt. Xem http://127.0.0.1:5174/?view=lay-phat và LAY_PHAT_CHEN_DONG.md.


Lạy Phật thực hiện tự do tại chỗ, kể cả Thiền Đường Trúc Lâm; không tự chạy về chánh điện. Giữ nguyên bồ đoàn đang ngồi và hủy đường đi cũ khi bắt đầu lạy.

