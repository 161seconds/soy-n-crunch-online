# Kết quả xác minh ứng dụng

## Đã kiểm tra

- Backend .NET 10 Release build và **238 xUnit test qua**, không có warning; gồm tên tiếng Việt của cả 28 món, tên gọi tắt không cần `!`, lệnh cũ, hoa/thường, có/không dấu, Unicode tổ hợp, khoảng trắng, câu trò chuyện không tạo đơn và chu kỳ xử lý từng món. Decoder connector cũng nhận đúng tên tiếng Việt qua fixture protobuf; luật gameplay, API/Host/Origin và username vẫn qua.
- Frontend TypeScript/Vite build và **37 Vitest test qua** cho 36 chỗ ngồi tại 18 bàn, khoảng cách giữa các hàng, lối đi giữa, khoảng hở menu/hàng đầu và chân cảnh/hàng cuối, vị trí vào quán, snapshot tới sai thứ tự, danh mục, phân trang đúng nhóm không lặp/thiếu món và lệnh vẽ của cả 28 món. Kiểm tra Canvas dùng ngữ cảnh giả, không phải kiểm chứng ảnh thực tế. Nền Hồ Xuân Hương SVG hợp lệ, các hình tham chiếu nội bộ đều tồn tại. Rollup có hai warning annotation `PURE` từ package SignalR; build hoàn tất.
- HTTP thực tế: backend health và frontend trả 200.
- Smoke test qua hai SignalR client thật: đồng bộ, ngắt/kết nối lại lấy snapshot, đơn món hoàn tất, combo quà, sự kiện lặp, giới hạn 36 chỗ và gọi đủ 28 món bằng tên tiếng Việt không cần `!`. Danh mục API khớp JSON dùng chung. Script chạy với phiên thử có thể xóa; từ chối nếu đang có khách thật/TikTok đang kết nối.
- Đã publish ASP.NET Core kèm React build; `/`, `/overlay`, `/api/menu` và hai file JS/CSS được HTML tham chiếu đều trả 200 từ `http://127.0.0.1:5186`, nội dung khớp bản build mới. Smoke SignalR cũng qua trên bản publish. Sau đổi nền Hồ Xuân Hương sang ban đêm, đã cập nhật static build và kiểm tra lại `/`, `/overlay`, JS, CSS cùng SVG được CSS tham chiếu; nội dung khớp build/source. Chữ tên quán, phụ đề và menu đạt tỷ lệ tương phản từ 6:1 trên các màu nền đã chọn; chưa thay cho quan sát trình duyệt. Phiên hiện tại giữ nguyên, không restart backend.
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

Hướng dẫn nghiệm thu thủ công: mở bảng điều khiển và overlay, mời 12 khách, chọn từng nhóm menu và thử sữa đậu xanh, panna cotta, yogurt đá, bánh tráng với các tên khác nhau; dừng/chạy menu; thử tim/quà, ngưng nhận món, tải lại overlay và xác nhận hai cửa sổ cùng trạng thái. Reset chỉ thực hiện sau xác nhận mất dữ liệu phiên.
