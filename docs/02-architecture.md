# Kiến trúc và hợp đồng

## Stack

- ASP.NET Core .NET 10: HTTP API, SignalR, xử lý phiên và vòng cập nhật.
- React + TypeScript + Vite: bảng điều khiển và overlay. Canvas 2D dựng quán; animation dùng `requestAnimationFrame`, không cập nhật React mỗi frame.
- xUnit: luật gameplay và API; Vitest: tính toán vị trí/đồng bộ frontend.
- Trạng thái phiên trong RAM, không có repository/database giả để chuẩn bị cho tương lai.

## Ranh giới

`backend/SoyCrunch.Api` chứa endpoint, `GameService`, worker cập nhật, SignalR hub và adapter TikTok. `backend/SoyCrunch.Tests` kiểm thử nghiệp vụ/API. `frontend` chứa hai màn hình dùng chung snapshot. `docs` chứa phạm vi, thiết kế và bằng chứng kiểm chứng.

Server là nguồn trạng thái chuẩn. Mọi mutation đi qua `GameService` với khóa bảo vệ; client chỉ gửi lệnh, không tự cộng điểm hoặc xác nhận phục vụ. Snapshot có revision tăng đơn điệu; client bỏ snapshot cũ để tránh HTTP và SignalR tới sai thứ tự. Tick 250 ms chỉ phát khi có thay đổi; client nội suy hoạt ảnh.

`menu.json` tại root là danh mục chung của .NET và React, gồm ID ổn định, tên, nhóm, lệnh/alias, thời gian chuẩn bị, kiểu hình và màu. MSBuild sao chép vào output/publish; Vite nhập trực tiếp JSON. Menu không có giá; `FoodOrder.item` chứa ID trong danh mục.

## HTTP và SignalR

| Đường dẫn | Công dụng |
|---|---|
| `GET /api/health` | Tình trạng tiến trình |
| `GET /api/session` | Snapshot hiện tại |
| `GET /api/menu` | Danh mục 28 món và lệnh gọi |
| `POST /api/events` | Nhận sự kiện chuẩn hóa từ bộ mô phỏng/adapter |
| `POST /api/session/settings` | Đổi tên quán, bật/tắt nhận món |
| `POST /api/session/reset` | Xóa khách, đơn, thống kê và nhật ký trong RAM |
| `POST /api/demo` | Bật/tắt bot trong quán |
| `POST /api/tiktok/connect` | Kết nối username công khai đang LIVE |
| `POST /api/tiktok/disconnect` | Ngắt nguồn TikTok |
| `/hubs/live` | SignalR, sự kiện `session` chứa snapshot đầy đủ |

Màn điều khiển ở `/`; overlay ở `/overlay`. Khi phát triển, Vite proxy `/api` và `/hubs` về backend; khi publish, ASP.NET Core phục vụ frontend từ `wwwroot` cùng origin.

## Sự kiện đầu vào

```json
{
  "eventId": "demo-unique-id",
  "viewerId": "demo-minh",
  "name": "Minh",
  "type": "chat",
  "text": "sữa đậu nành",
  "demo": true
}
```

Loại: `join`, `chat`, `like`, `gift`. Quà có `giftName`, `diamondCount`, `repeatCount`, `giftType`, `repeatEnd`; tim có `likeCount`. Giới hạn độ dài, loại sự kiện và khoảng số được kiểm tra trước khi thay đổi phiên. Không nhận HTML. Tên/bình luận hiển thị bằng React text hoặc canvas.

Kết quả xử lý gồm snapshot và `outcome`: `accepted`, `duplicate`, `ignored`, `full`, `busy`, `cooldown`, `closed`. Sự kiện kết thúc combo mới được đưa vào bộ nhớ chống trùng. Bộ nhớ giới hạn 5.000 ID gần nhất; cần kho bền vững khi triển khai nhận lại sự kiện qua nhiều phiên.

## An toàn và vòng đời

- Mặc định chỉ bind `127.0.0.1`; kiểm tra Host và Origin, chỉ chấp nhận mutation JSON. Không đưa API điều khiển ra Internet khi chưa có xác thực.
- TikTok chỉ cần username công khai; không thu mật khẩu/cookie/session của người dùng.
- Danh sách/log có giới hạn; quà không tự đưa bình luận tùy ý vào giọng đọc.
- Khởi động lại backend hoặc reset làm mất phiên. UI cần thông báo và xác nhận trước reset.
- Kết nối lại SignalR phải lấy snapshot mới. Lỗi connector không dừng gameplay mô phỏng.
- Connector C# dùng NuGet `TikTokLive_Sharp` 1.2.3 trực tiếp trong backend; không cần Node ở runtime backend. Bộ đếm chat/like/gift/join và `LastEventAt` chỉ được cập nhật từ callback connector, không từ bộ mô phỏng. Kết quả kiểm chứng `@one61secondz` ghi trong `05-connector-verification.md`.
- ID người xem ưu tiên user ID số, fallback unique ID. Bỏ sự kiện thiếu message ID ổn định. Combo quà dùng group ID để chống tính trùng dù các thông báo kết thúc có message ID khác nhau; số quà lấy `RepeatCount`, không lấy `ComboCount`/`Amount`.

## Quyết định chưa mở rộng

Giữ một tiến trình backend và một phiên live. Chỉ thêm persistence khi có yêu cầu khôi phục phiên/lịch sử; chỉ tách dịch vụ khi nhiều máy hoặc nhiều kênh cần vận hành độc lập.
