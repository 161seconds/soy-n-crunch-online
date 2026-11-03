# Kết quả xác minh ứng dụng

## Đã kiểm tra — 03/11/2026

- **272 xUnit test qua**, không warning, với `dotnet test backend/SoyCrunch.slnx -c Release --artifacts-path artifacts/validation`. Bao phủ menu 28 món, chu kỳ bếp, 49 chỗ, validation, chống trùng; thêm alias quà/Unicode, giữ thưởng theo điểm, mời món qua luật chung, cooldown khi bếp nhanh, thời hạn boost/làm mới/reset và mốc điểm cộng dồn. Fixture protobuf đi qua decoder thư viện thật, kiểm tra combo Rose chỉ nhận cuối chuỗi và không lặp thưởng.
- **51 Vitest test qua**, TypeScript/Vite build thành công. Kiểm tra layout/menu, snapshot tới sai thứ tự và cả chín lệnh vẽ quà: tọa độ/alpha hợp lệ, trần hạt, combo, kết quả giống nhau giữa client, hạn 7 giây, dữ liệu cũ/tương lai, mốc cộng đồng và giảm chuyển động. Canvas dùng context giả, không chứng minh chất lượng ảnh thực tế. Build còn hai warning `PURE` từ package SignalR như trước; không thêm dependency.
- **Smoke test API/SignalR qua trên bản publish mới**, dùng phiên riêng cổng **5187**: hai client thật đồng bộ, ngắt/kết nối lại lấy snapshot, đơn hoàn tất, ba tier và sáu chủ đề quà, mời món, deadline tăng tốc, mốc 100 điểm/chống phát lại, 49 chỗ và đủ 28 tên món tiếng Việt. `/api/menu` và `/api/gifts` khớp JSON dùng chung. Script tự dọn phiên thử; server 5187 đã dừng sau kiểm tra.
- Build Release mặc định và publish `artifacts/app` thành công, không warning. Lần build Release ban đầu gặp khóa `SoyCrunch.Api.exe` bởi BE đang chạy; đã kiểm thử bằng output riêng rồi build lại mặc định thành công sau khi thay runtime.
- **BE mới đang chạy cổng 5186**, FE/Vite cổng **5176**. `/`, `/overlay`, health và hai đường `/api/gifts` trực tiếp/qua proxy trả đúng dữ liệu. JS/CSS phục vụ qua HTTP có SHA-256 khớp `frontend/dist`; bundle có câu mời bình luận, chín chủ đề và bộ thử combo. Bằng chứng runtime: `artifacts/evidence/gift-interactions-runtime.json`.
- Trước restart, phiên cũ không có khách/đơn và TikTok idle; có **111 điểm thử**. Đã lưu snapshot tại `artifacts/evidence/pre-gift-upgrade-session.json`, giữ tên **Sữa & Bánh** và trạng thái nhận món. Theo luật lưu trong RAM, restart mở phiên mới với thống kê 0; không phát lại điểm/quà cũ thành tương tác mới.
- Nền vẫn một xe ở giữa, 25 bàn/49 chỗ và lời mời bình luận. Thanh mục tiêu quà thay dòng trang trí chân cảnh. `git diff --check` sạch. Không có thay đổi dependency so với lần kiểm tra bảo mật trước.

## Chưa kiểm tra

- Quan sát UI desktop/mobile, chất lượng ảnh và FPS: browser host vẫn báo `The browser access host is unavailable`. Build, Canvas giả và asset HTTP không thay cho quan sát thực tế.
- Âm thanh/giọng Việt nghe thực tế, capture OBS/TikTok LIVE Studio và vùng bị giao diện TikTok che.
- Quà/bình luận/tim TikTok thật: probe mới lúc **05:11 UTC, 03/11/2026** vẫn trả `LiveStream for HostID could not be found. Is the Host online?` cho `@one61secondz`, cả bốn bộ đếm đều 0. Không kết luận người dùng có/không LIVE chỉ từ lỗi thư viện. Đã lưu `artifacts/evidence/gift-interactions-connector.json`, đưa connector về idle; chưa có bằng chứng nhận quà thật. Xem thêm [báo cáo connector trước](05-connector-verification.md). Alias theo tên có thể cần bổ sung theo vùng; tên lạ dùng hiệu ứng theo điểm.

## Lệnh chạy lại

```powershell
dotnet test backend/SoyCrunch.slnx -c Release --artifacts-path artifacts/validation
npm --prefix frontend test
npm --prefix frontend run build

# Phiên thử riêng, không chiếm BE đang dùng ở 5186:
dotnet artifacts/app/SoyCrunch.Api.dll --urls http://127.0.0.1:5187
# Terminal khác; script xóa phiên thử ở 5187:
$env:SOYCRUNCH_API = 'http://127.0.0.1:5187'
npm --prefix frontend run test:integration
```

Thử thủ công tại **Quà TikTok · 9 kiểu tương tác**: chọn từng quà, số lượng combo rồi **Thử quà**; thử Rose ×100 để vượt mốc, GG để tăng tốc, Ice Cream khi đang có món/đóng bếp và Swan khi gần đầy. Mở hai overlay, bật giảm chuyển động, tải lại giữa hiệu ứng để kiểm tra hết hạn. Các điểm thử không phải bảng giá TikTok.
