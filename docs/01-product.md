# Soy & Crunch — Phạm vi sản phẩm

## Mục tiêu

Quán sữa đậu nành và bánh tráng nướng ảo trên TikTok LIVE. Người xem bình luận để có nhân vật trong quán, gọi món và xem nhân vật ăn/uống. Máy phát chạy ứng dụng .NET + React; OBS/TikTok LIVE Studio phát hình overlay, người xem không cần mở website.

## MVP

- Một quán buổi tối, một phiên live, tối đa 24 khách, 12 bàn hai chỗ.
- Hai món: sữa đậu nành (`!sua`, `!sữa`) và bánh tráng nướng (`!banh`, `!bánh`). Lệnh phải khớp toàn bộ bình luận, không phân biệt hoa/thường.
- Bình luận đầu tiên hoặc sự kiện vào phòng tạo khách nếu còn chỗ. Bình luận thường hiện bong bóng, không đọc thành tiếng.
- Mỗi khách có tối đa một món đang xử lý; cooldown gọi món 8 giây. Quán đầy không thay khách đang ăn và không ưu tiên đẩy khách chưa tặng quà.
- Một bếp xử lý tuần tự: sữa 2 giây, bánh 4 giây; phục vụ 1 giây; ăn/uống 6 giây. Bộ mô phỏng dùng cùng luật với TikTok thật.
- Khách không có món được dọn sau 120 giây không tương tác. Vào phòng và thả tim không tự tạo đơn.
- Tim được cộng vào tổng phiên, hiệu ứng hiển thị được giới hạn. Quà tạo banner cảm ơn, điểm ủng hộ và hiệu ứng; không phải thanh toán mua đồ ăn thật.
- Combo quà chỉ ghi nhận khi kết thúc. Sự kiện trùng không cộng điểm/lượt phục vụ lần nữa.
- Bảng điều khiển: trạng thái phiên, danh sách đơn/khách, thử sự kiện, bot mô phỏng, ngưng nhận món, reset phiên, mở overlay và kết nối/ngắt TikTok.

## Luồng chính

1. Người xem bình luận; server tạo khách với ID ổn định, tên hiển thị và chỗ ngồi.
2. Người xem gửi lệnh món; server kiểm tra chỗ, trạng thái nhận món, cooldown và món đang xử lý.
3. Đơn chờ bếp, chế biến, phục vụ; nhân vật ăn/uống rồi trở lại ngồi.
4. Quà/tim làm cảnh sinh động; mất kết nối overlay được phục hồi bằng snapshot đầy đủ.
5. Người vận hành ngưng nhận món hoặc reset bằng hành động xác nhận rõ ràng.

## Tiêu chí nghiệm thu

- Không có TikTok vẫn chạy được toàn bộ luồng bằng sự kiện giả, có nhãn mô phỏng.
- Hai cửa sổ nhận cùng số khách, đơn, lượt phục vụ và điểm phiên.
- 24 khách có chỗ riêng; khách thứ 25 nhận kết quả đầy quán.
- Lệnh lặp, combo quà và sự kiện gửi lại không tạo đơn/điểm ngoài luật.
- Sau tải lại overlay, phiên đang chạy tiếp tục; sau restart backend, phiên bắt đầu mới.
- Có thể capture overlay 1080×1920; người vận hành bật tiếng bằng thao tác trực tiếp.
- Trạng thái lỗi kết nối TikTok hiển thị đúng, không được báo “đã kiểm chứng live” chỉ từ fixture hoặc build.

## Ngoài phạm vi

Tài khoản người xem, bán đồ ăn thật, thanh toán, database, nhiều kênh đồng thời, bảng xếp hạng qua nhiều phiên, 3D/game engine, AI sinh hình trực tiếp và đọc toàn bộ bình luận.
