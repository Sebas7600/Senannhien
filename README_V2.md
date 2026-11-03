# Sen An Nhiên 2 · Khuôn viên mở rộng

Bản nâng cấp giữ bảng màu xanh, kem và gỗ của phiên bản đầu, thay sân nhỏ bằng khuôn viên 120 × 128 mét. Mô hình, shader và trải nghiệm được xây riêng bằng TypeScript + React + Vite, không lấy mã nguồn hoặc tài nguyên của chuasen.com.

## Chơi ngay

Trên Windows đã có Node.js 18.20 trở lên: bấm đôi **Choi-Game.cmd**. Game mở tại **http://127.0.0.1:5174**. Giữ cửa sổ lệnh trong khi chơi, Ctrl+C hoặc đóng cửa sổ để dừng.

Gói `SenAnNhien_V2_Play.zip` có sẵn `dist/`, `server.mjs`, `server-runtime.mjs` và launcher, không cần `npm install`.

## Bản đồ và chỗ ngồi

13 nơi: cổng tam quan, sân bồ đề, đại hùng bảo điện, thiền đường Trúc Lâm, lầu chuông, hồ koi, nhà ăn Hương Thiền, tàng kinh các, vườn rau, trà đình Vọng Sơn, hồ sen, bảo tháp An Lạc và đường trúc.

80 chỗ ngồi thực sự:

- 18 bồ đoàn chánh điện, 20 bồ đoàn thiền đường, 8 tọa cụ rừng trúc.
- 16 ghế nhà ăn, gắn với 4 bàn.
- 6 ghế trà và 12 chỗ nghỉ quanh sân/hồ.

Chạm bồ đoàn/ghế trong 3D hoặc mở **Chọn chỗ ngồi** để chọn theo tên. Nhân vật tự tìm đường đến rồi ngồi đúng tọa độ và hướng của ghế. Không chọn được chỗ người khác đang ngồi trong cùng phòng. Mái nhà tự ẩn khi bước vào để thấy nội thất.

## Nhà ăn chay

1. Đi hoặc đến nhanh tới nhà ăn Hương Thiền.
2. Chọn một ghế; thực đơn tự mở khi ngồi.
3. Chọn **mì chay**, **cơm chay**, **hủ tiếu chay** hoặc **bánh mì chay**.
4. Gọi món, chờ bếp khoảng 6 giây. Phần ăn 3D xuất hiện đúng phía bàn tương ứng ghế, kèm hơi nóng.
5. Bấm **Dùng bữa**, hoàn thành khoảng 9 giây để hồi năng lượng và ghi nhận món đã thưởng thức.

Bữa ăn miễn phí trong game, không trừ công đức hoặc tiền thật. Không gọi chồng món trước khi ăn xong. Rời ghế khi đang ăn sẽ ngắt thao tác nhưng giữ phần ăn sẵn sàng để quay lại. Mỗi lần dùng xong chỉ thưởng một lần. Nhiệm vụ ngày và dấu mốc cả bốn món ghi nhận lâu dài.

## Những hoạt động khác

- Chắp tay, lạy Phật, thiền, tràng hạt, tụng niệm và gõ mõ; tư thế và dụng cụ riêng.
- Dâng hương, thắp nến, dâng hoa hiện trên bàn thờ; chuông và mõ có âm thanh tổng hợp.
- Quét 150 lá instanced và 28 lá vật lý Rapier; lá xuất hiện lại sau 90 giây.
- Cho đàn koi ăn; cá bơi về khu ăn. Hai hồ dùng GLSL shader mặt nước.
- Viết lời nguyện và thả hoa đăng; lời đã gửi được lưu trong trình duyệt.
- 12 luống rau: gieo hạt → tưới → đợi 60 giây → thu hoạch. Cây lớn theo thời gian thực kể cả khi tải lại trang.
- Đọc 4 bài thực tập ngắn viết riêng cho game trong tàng kinh các.
- 4 NPC có hội thoại và chỉ đường: chú tiểu Minh, thầy Thiện Tâm, cô Tâm và bác An.
- 6 nhiệm vụ mỗi ngày, 6 dấu mốc dài hạn, 7 loại vật phẩm, cấp độ, năng lượng và tĩnh tâm.
- Bản đồ trực tiếp, theo dõi nơi đã ghé, đi bộ bằng A* hoặc đến nhanh.
- Camera theo nhân vật/toàn cảnh, ngày/đêm, 6 màu áo, chế độ tiết kiệm, giao diện chuột/bàn phím/chạm.

## Phòng và lời nhắn

Máy chủ Node đi kèm phục vụ 3 phòng, tối đa 16 người/phòng. Vị trí, tư thế, ghế và phần ăn được đồng bộ bằng SSE + HTTP; người chơi cùng phòng có thể chat. Mở cùng địa chỉ trong cửa sổ/trình duyệt khác để cùng tham gia.

Máy chủ mặc định chỉ nghe **127.0.0.1** trên máy đang chạy. Đây là multiplayer cục bộ trên cùng máy chủ, **chưa phải dịch vụ Internet công khai**, chưa có tài khoản hoặc đồng bộ cloud. Chat/phòng nằm trong RAM và xóa khi tắt máy chủ. Tiến trình mỗi người lưu riêng trong localStorage của trình duyệt. Khi frontend chạy tĩnh không có API, game vẫn chơi được một mình.

## Điều khiển

| Thao tác | Điều khiển |
|---|---|
| Di chuyển | WASD / phím mũi tên / joystick |
| Đi nhanh | Giữ Shift |
| Đi tới điểm | Chạm/click sân |
| Tương tác gần / đứng dậy | E |
| Xoay camera | Giữ chuột phải và kéo; Q / C |
| Thu phóng | Cuộn chuột; hai ngón trên màn hình cảm ứng |
| Đặt lại camera | F |
| Theo nhân vật / toàn cảnh | V |
| Bản đồ / túi / hướng dẫn | M / B / H |
| Đóng cửa sổ | Esc |

## Phát triển

```sh
npm install
npm run build
node server.mjs
```

Dev HMR: chạy `node server.mjs` cho API trong một terminal, rồi `npm run dev` trong terminal khác. Vite ở cổng 5173 proxy `/api` về máy chủ cổng 5174.

`npm test` chạy 11 bài kiểm tra: dữ liệu chỗ ngồi, A* tới từng ghế ăn, bốn món và thời gian dùng bữa, ngắt bữa, ghế bị chiếm, chu trình vườn rau, nhiệm vụ/đổi vật phẩm, giữ tiến trình qua ngày mới, SSE/phòng/chat và tranh chấp chỗ ngồi.

## Tổ chức mã

- `src/gameData.ts`: khu vực, ghế, món ăn, NPC, luống rau và vật cản.
- `src/gameStore.ts`: Zustand persist, luật hoạt động, gọi/ăn món, cây trồng và tiến trình.
- `src/navigation.ts`: A* và rút gọn đường đi có kiểm tra vật cản.
- `src/WorldV2.tsx`: camera, kinematic character controller Rapier, người chơi và hiệu ứng.
- `src/Environment.tsx`, `src/models.tsx`, `src/Waters.tsx`: kiến trúc, cảnh quan, hồ và shader.
- `src/Character.tsx`, `src/Food.tsx`, `src/PhysicalLeaves.tsx`: nhân vật, món ăn và lá vật lý.
- `src/AppV2.tsx`, `src/PanelsV2.tsx`, `src/SeatingPlan.tsx`, `src/MapView.tsx`: HUD và các luồng tương tác.
- `src/network.ts`, `server-runtime.mjs`: đồng bộ phòng cục bộ và chat.
- `src/audio.ts`, `src/style.css`, `src/v2.css`: âm thanh và giao diện.

State v1 được migrate sang v2, giữ nhân vật, vật phẩm cũ và công đức. Font Google Fonts có font dự phòng khi mất mạng. Mô hình và món ăn đều dựng từ geometry; không cần tải bộ asset 3D bên ngoài. Bộ dựng vật lý có WASM nên bundle không phải loại vài KB.

Điểm và hoạt động là cơ chế trò chơi, không đại diện cho công đức hay giá trị tu tập ngoài đời. Các bài đọc được viết riêng làm hướng dẫn thực tập trong game, không tuyên bố là bản dịch kinh điển.
