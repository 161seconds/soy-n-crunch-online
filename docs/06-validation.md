# Kết quả xác minh ứng dụng

## Đã kiểm tra — cập nhật 03/11/2026

- Backend .NET 10 Release build và **238 xUnit test qua**, không có warning; gồm tên tiếng Việt của cả 28 món, tên gọi tắt không cần `!`, lệnh cũ, hoa/thường, có/không dấu, Unicode tổ hợp, khoảng trắng, câu trò chuyện không tạo đơn và chu kỳ xử lý từng món. Decoder connector cũng nhận đúng tên tiếng Việt qua fixture protobuf; luật gameplay, API/Host/Origin và username vẫn qua.
- Frontend TypeScript/Vite build và **37 Vitest test qua** cho 49 chỗ ngồi tại 25 bàn (24 bàn đôi, một bàn đơn), khoảng cách giữa các hàng, lối đi giữa, khoảng hở menu/hàng đầu và chân cảnh/hàng cuối, vị trí vào quán, snapshot tới sai thứ tự, danh mục, phân trang đúng nhóm không lặp/thiếu món và lệnh vẽ của cả 28 món. Test backend xác nhận ID ghế 0–48, từ chối khách thứ 50, khách đã có chỗ vẫn bình luận/gọi món khi đầy. Kiểm tra Canvas dùng ngữ cảnh giả, không phải kiểm chứng ảnh thực tế. Rollup có hai warning annotation `PURE` từ package SignalR; build hoàn tất.
- Đã đổi nền thành một xe sữa/bánh ở giữa, dời hai đèn sang hai bên và khói về đúng nồi sữa. XML SVG hợp lệ, chỉ còn một tham chiếu xe và mọi tham chiếu nội bộ đều tồn tại. Phần đầu dùng CSS Grid xếp dọc địa danh, tên, phụ đề, thống kê và lời mời; bỏ các mốc vị trí tuyệt đối riêng gây đè chữ. Menu tách dưới xe. Đã chạy lại 37 test FE và build sau thay đổi này.
- HTTP thực tế: backend health và frontend trả 200.
- Smoke test qua hai SignalR client thật: đồng bộ, ngắt/kết nối lại lấy snapshot, đơn món hoàn tất, combo quà, sự kiện lặp, giới hạn 49 chỗ và gọi đủ 28 món bằng tên tiếng Việt không cần `!`. Danh mục API khớp JSON dùng chung. Script chạy với phiên thử có thể xóa; từ chối nếu đang có khách thật/TikTok đang kết nối.
- Đã publish backend 49 chỗ vào `artifacts/app`; frontend mới được cập nhật cả ở đó và `backend/SoyCrunch.Api/wwwroot`. `/overlay` trên BE đang chạy trả HTML tham chiếu đúng JS/CSS mới; SHA-256 của hai asset phục vụ qua HTTP khớp bản build. Bundle chứa đúng câu **“hãy comment để đặt món và vào bàn nhé”**. Thông báo là phần tử HTML luôn hiện dưới thống kê, chữ kem trên nền xanh tối; đã bỏ dòng lời mời trên sân.
- Lần kiểm tra dependency trước không phát hiện vulnerability từ npm/NuGet, gồm dependency transitive; đợt cập nhật này không thay dependency.

## Chưa kiểm tra

- Quan sát trực tiếp UI desktop/mobile, chất lượng hình ảnh và FPS: lần kiểm tra bố cục một xe nhận lỗi `The browser access host is unavailable`. Các kiểm tra build, SVG và asset HTTP không thay cho quan sát giao diện thực tế.
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
