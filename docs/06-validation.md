# Kết quả xác minh ứng dụng

## Đã kiểm tra

- Backend .NET 10 Release build và **27 xUnit test qua**, không có warning; gồm luật gameplay, API/Host/Origin, decoder connector và username.
- Frontend TypeScript/Vite build và **4 Vitest test qua** cho 24 chỗ ngồi, vị trí vào quán và snapshot tới sai thứ tự. Rollup có hai warning annotation `PURE` từ package SignalR; build hoàn tất.
- HTTP thực tế: backend health và frontend trả 200.
- Smoke test qua hai SignalR client thật: đồng bộ, ngắt/kết nối lại lấy snapshot, đơn món hoàn tất, combo quà, sự kiện lặp và giới hạn 24 chỗ. Script chạy với phiên thử có thể xóa; từ chối nếu đang có khách thật/TikTok đang kết nối.
- Đã publish ASP.NET Core kèm React build; `/`, `/overlay`, `/api/health` và hai file JS/CSS được HTML tham chiếu đều trả 200 từ `http://127.0.0.1:5186`. Smoke SignalR cũng qua trên bản publish.
- npm install báo 0 vulnerability; NuGet vulnerability check của backend, gồm transitive dependency, không có package bị cảnh báo trong nguồn hiện tại.

## Chưa kiểm tra

- Quan sát trực tiếp UI desktop/mobile, chất lượng hình ảnh và FPS: công cụ Computer Use dừng vì không xác định được URL trình duyệt Windows để thực thi policy. Không thay bằng tuyên bố “UI đã pass”.
- Âm thanh nghe thực tế, giọng Việt trên máy, capture OBS/TikTok LIVE Studio và vùng bị giao diện TikTok che.
- Sự kiện TikTok thật: xem [báo cáo connector](05-connector-verification.md).

## Lệnh chạy lại

```powershell
dotnet test backend/SoyCrunch.slnx
npm --prefix frontend test
npm --prefix frontend run build
# Backend cần đang chạy; script xóa phiên thử hiện tại.
npm --prefix frontend run test:integration
```

Hướng dẫn nghiệm thu thủ công: mở bảng điều khiển và overlay, mời 12 khách, gọi hai món với các tên khác nhau, thử tim/quà, ngưng nhận món, tải lại overlay và xác nhận hai cửa sổ cùng trạng thái. Reset chỉ thực hiện sau xác nhận mất dữ liệu phiên.
