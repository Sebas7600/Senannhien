CAU HINH QR UNG HO

1. Dat ma QR THAT cua J vao thu muc nay, dat ten qr.png.
2. Sua file public/donation.json:
   - enabled: true
   - recipientName, bankName, accountNumber: thong tin that.
   - purpose va disclosure: muc dich nhan tien dung voi thuc te.
   - qrImage: /donate/qr.png (hoac duong dan file QR cua J).
3. Chay npm run build de cap nhat ban Play.

Neu dang sua GOI PLAY da build: dat QR vao dist/donate/qr.png
va sua dist/donation.json. KHONG can build lai.

Mac dinh chua cau hinh, khong co tai khoan gia va khong dung
so tai khoan cua chuasen.com.

QR tinh khong tu thay doi so tien/noi dung. Nguoi ung ho can
nhap hoac dan so tien va noi dung trong ung dung ngan hang.
Game khong tu xac nhan giao dich, khong cong diem hay cap do
tu nut da chuyen, va khong yeu cau mat khau/OTP/the.

bankAppUrl la tuy chon. Chi dien lien ket chinh thuc cua J.
