# Ba hoành phi Sen An Nhiên

Mẫu chung: nền son trầm, khung gỗ nâu, nẹp vàng hai lớp, góc hồi văn và hoa sen. Các họa tiết được dựng bằng SVG, lấy cảm hứng từ ảnh hoành phi người dùng cung cấp; không sử dụng pixel của ảnh tham khảo.

- Trà đình Vọng Sơn: “Thưởng thức chén trà, tâm an vạn sự”.
- Tàng Kinh Các: “Đọc sách mở trí, tĩnh tâm dưỡng đức”.
- Nhà ăn Hương Thiền: “Dùng bữa chánh niệm, nuôi dưỡng thân tâm”.

Chữ Palatino Linotype Bold được xuất thành đường nét từ font có sẵn trên Windows. Không phân phối file font và không tải font khi chạy. Mỗi bảng dùng hai draw call ở lượt vẽ chính, không có cập nhật theo frame. Tổng ba SVG khoảng 121 KB, dùng chung geometry khung. Ba bảng được treo trên tường sau; tranh phòng trà được hạ xuống để tránh chạm bảng.

Thay lời tại `scripts/create-temple-signs.ps1` rồi chạy trên Windows với font Palatino Linotype đã cài:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/create-temple-signs.ps1
```

Commit các SVG đã xuất. Các máy khác chỉ cần build bình thường, không cần PowerShell hay font này. Mẫu 3D dùng chung ở `src/TemplePlaque.tsx`.
