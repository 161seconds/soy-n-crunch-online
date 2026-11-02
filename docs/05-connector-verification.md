# Kiểm chứng connector TikTok

## Kết luận

Đã tích hợp connector C# `TikTokLive_Sharp` **1.2.3** vào ASP.NET Core .NET 10. Thư viện đích .NET Standard 2.0; tiến trình kiểm chứng chạy .NET **10.0.11**. Không thêm bridge Node vào backend.

**Chưa xác nhận nhận sự kiện từ live thật.** Lần thử `@one61secondz` trả `LiveNotFoundException`. Ngoại lệ chỉ chứng minh thư viện không tìm được phòng trong lần thử; không đủ để kết luận tài khoản chắc chắn offline hoặc mọi phần của giao thức hiện tại còn hoạt động.

Lần chạy lại qua API của bản publish cũng chưa tìm được phòng; xem [JSON bằng chứng](evidence/connector-one61secondz.json). Bộ đếm chat/like/gift/join đều bằng 0, `lastEventAt` là null. Chưa có căn cứ để thêm một runtime Node dự phòng chỉ từ lỗi không tìm thấy phòng này.

## Bằng chứng hiện có

| Mức kiểm chứng | Kết quả |
|---|---|
| Restore và chạy connector trong .NET 10 | Đạt |
| Decoder protobuf thật của NuGet xử lý fixture chat/like | Đạt, tạo đúng khách/đơn và 7 tim |
| Fixture combo quà: RepeatCount=3, ComboCount=1, 10 điểm/quà | Đạt, tổng 30; chờ kết thúc mới cộng |
| Hai thông báo kết thúc cùng group ID, message ID khác | Đạt, không cộng trùng |
| Sự kiện thiếu message ID | Bỏ qua |
| Username không hợp lệ/URL tùy ý | Bị từ chối |
| Kết nối phòng `@one61secondz` | Chưa đạt: `LiveNotFoundException` |
| Chat, tim, quà thật từ kênh này | Chưa quan sát được |

Kết quả probe trực tiếp trước tích hợp:

```json
{
  "library": "TikTokLive_Sharp 1.2.3",
  "runtime": "10.0.11",
  "username": "one61secondz",
  "roomId": null,
  "connected": false,
  "chat": 0,
  "likes": 0,
  "gifts": 0,
  "error": "LiveNotFoundException: LiveStream for HostID could not be found. Is the Host online?"
}
```

## Chạy lại

1. Chạy backend và frontend theo README; bật LIVE trên kênh `@one61secondz`.
2. Nhập username trong bảng điều khiển, bấm **Kết nối**. Trạng thái “đã kết nối” chỉ được đặt khi thư viện xác nhận socket hoạt động và trả room ID.
3. Quan sát lời nhắn lỗi cụ thể nếu chưa vào được phòng. Không cần nhập mật khẩu, cookie hoặc session TikTok.
4. Để ghi kết quả bằng chương trình:

   ```powershell
   npm --prefix frontend run test:connector -- one61secondz
   ```

   Exit 0: kết nối được phòng; exit 2: chưa kết nối. Sau kết nối, chương trình quan sát 30 giây, in trạng thái và bộ đếm từng loại. Exit 0 không đồng nghĩa đã nhận đủ chat/like/gift.

5. Người kiểm thử tự tạo bình luận `sữa đậu xanh`, `bánh tráng nướng` và lượt tim trên TikTok; xác nhận khách/món/thống kê thay đổi ở overlay. Lệnh cũ như `!sua` vẫn dùng được. Kiểm tra quà bằng sự kiện được người dùng cho phép; ứng dụng không gửi bình luận/quà thay người dùng.
6. Ngắt kết nối hoặc mất mạng phải hiện trạng thái tương ứng; mở lại overlay phải khôi phục snapshot.

## Giới hạn

- Đây là thư viện cộng đồng. Không đảm bảo thay đổi giao thức TikTok hoặc dịch vụ ký kết nối luôn tương thích. Không tự thêm API key/trả phí hay thu thập cookie để vượt lỗi.
- Chưa kiểm chứng lượt follow/share; MVP không ánh xạ hai loại này.
- Không tự reconnect TikTok vô hạn; người vận hành có thể thử lại. SignalR giữa app và overlay có reconnect và snapshot.
- Số lượng sự kiện nhận không phải doanh thu; combo trung gian có thể tăng bộ đếm thông báo, điểm chỉ cộng ở kết thúc và chống trùng.
