# Triển khai và nghiệm thu

## Thứ tự được yêu cầu

1. Viết tài liệu sản phẩm, kiến trúc, hình ảnh/âm thanh.
2. Code backend .NET 10 và frontend React; chạy được bằng sự kiện mô phỏng.
3. Build, test, mở giao diện thật; sửa lỗi tích hợp.
4. Sau đó kiểm chứng connector với `@one61secondz`, tích hợp đường nhận sự kiện thật và ghi bằng chứng cùng giới hạn.

## Chặng 1 — Phiên và hợp đồng

Backend có validation, chỗ ngồi, đơn món, cooldown, chống trùng, chu kỳ chế biến/phục vụ/ăn và snapshot. Viết xUnit cho đầy quán, lệnh đúng/sai, đơn trùng, combo quà, reset và thời gian xử lý. HTTP có kiểm tra local origin và lỗi đầu vào.

## Chặng 2 — Hai màn hình

React có bảng điều khiển và overlay 9:16; dùng chung dữ liệu SignalR. Bộ mô phỏng gửi cùng loại sự kiện với adapter. Canvas dựng cảnh không cần asset bên ngoài. Kiểm tra vị trí 36 chỗ tại 18 bàn, đồng bộ snapshot cũ/mới, build TypeScript và UI thật.

Danh mục 28 món dùng chung `menu.json`. Khi đổi món phải kiểm tra cả lệnh/alias, tên trong nhật ký/bếp, thời gian chuẩn bị, bot mô phỏng, hình trên tay và menu overlay. Không có nhóm tàu hủ hoặc giá bán.

## Chặng 3 — Vận hành

Có trạng thái server/TikTok, bật tiếng, ngưng nhận món, reset có xác nhận, danh sách khách/đơn và nhật ký có giới hạn. Tải lại overlay không reset backend. Tài liệu chạy local và publish khớp lệnh thực tế.

## Chặng 4 — Connector

- Kiểm tra connector C# hiện có: framework, build, API và khả năng kết nối thực.
- Không tự viết lại giao thức TikTok nếu thư viện hoạt động.
- Nếu C# không hoạt động, bridge Node chỉ đọc sự kiện và chuyển về backend; phải ghi rõ runtime bổ sung và license, không giấu trong bản phát hành.
- Kiểm chứng phân biệt ba mức: fixture chuẩn hóa; kết nối phòng; nhận được chat/like/gift thật. Kết nối thành công không chứng minh cả ba loại đã chạy.
- Kênh không LIVE hoặc dịch vụ ngoài từ chối: lưu lỗi cụ thể, không ghi kiểm chứng live thành công. Không tự gửi bình luận/quà lên TikTok.

## Lệnh xác minh

```powershell
dotnet test backend/SoyCrunch.slnx
npm --prefix frontend test
npm --prefix frontend run build
```

Lệnh chạy và địa chỉ được duy trì trong README. Mốc cuối có backend và frontend đang chạy để kiểm tra trực tiếp; không commit/push nếu chưa được yêu cầu.
