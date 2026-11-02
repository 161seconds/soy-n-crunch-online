# Soy & Crunch — Phạm vi sản phẩm

## Mục tiêu

Quán sữa hạt, món lạnh và bánh ăn vặt ảo trên TikTok LIVE. Người xem bình luận để có nhân vật trong quán, gọi món và xem nhân vật ăn/uống. Máy phát chạy ứng dụng .NET + React; OBS/TikTok LIVE Studio phát hình overlay, người xem không cần mở website.

## MVP

- Một quán ven Hồ Xuân Hương, Đà Lạt vào ban đêm, một phiên live, tối đa 36 khách, 18 bàn hai chỗ.
- 28 món thuộc 3 nhóm: 14 món sữa hạt, 8 món lạnh và 6 món bánh/ăn vặt. Có sữa đậu xanh, panna cotta bốn vị và yogurt đá; không có tàu hủ. Danh sách/lệnh gọi tại [thực đơn](07-menu.md).
- Gọi món bằng tên tiếng Việt hoặc tên gọi tắt, không cần `!`: `sữa đậu xanh`, `đậu xanh`, `panna cotta`, `yogurt đá`, `bánh tráng nướng`. Không phân biệt hoa/thường, dấu tiếng Việt, khoảng trắng hay Unicode tổ hợp; toàn bộ bình luận phải khớp tên/alias. Giữ lệnh cũ như `!sua`, `!banh`. Menu chỉ hiện tên món và hướng dẫn gõ tên, không hiện giá.
- Bình luận đầu tiên hoặc sự kiện vào phòng tạo khách nếu còn chỗ. Bình luận thường hiện bong bóng, không đọc thành tiếng.
- Mỗi khách có tối đa một món đang xử lý; cooldown gọi món 8 giây. Quán đầy không thay khách đang ăn và không ưu tiên đẩy khách chưa tặng quà.
- Một bếp xử lý tuần tự: món lạnh chuẩn bị 1 giây, sữa 2 giây, bánh/ăn vặt 3–4 giây theo danh mục; phục vụ 1 giây; ăn/uống 6 giây. Bộ mô phỏng dùng cùng luật với TikTok thật và chọn ngẫu nhiên trong đủ 28 món.
- Khách không có món được dọn sau 120 giây không tương tác. Vào phòng và thả tim không tự tạo đơn.
- Tim được cộng vào tổng phiên, hiệu ứng hiển thị được giới hạn. Quà tạo banner cảm ơn, điểm ủng hộ và hiệu ứng; không phải thanh toán mua đồ ăn thật.
- Combo quà chỉ ghi nhận khi kết thúc. Sự kiện trùng không cộng điểm/lượt phục vụ lần nữa.
- Bảng điều khiển: trạng thái phiên, danh sách đơn/khách, thử sự kiện, bot mô phỏng, ngưng nhận món, reset phiên, mở overlay và kết nối/ngắt TikTok.

## Luồng chính

1. Người xem bình luận; server tạo khách với ID ổn định, tên hiển thị và chỗ ngồi.
2. Người xem bình luận tên món; server kiểm tra chỗ, trạng thái nhận món, cooldown và món đang xử lý.
3. Đơn chờ bếp, chế biến, phục vụ; nhân vật ăn/uống rồi trở lại ngồi.
4. Quà/tim làm cảnh sinh động; mất kết nối overlay được phục hồi bằng snapshot đầy đủ.
5. Người vận hành ngưng nhận món hoặc reset bằng hành động xác nhận rõ ràng.

## Tiêu chí nghiệm thu

- Không có TikTok vẫn chạy được toàn bộ luồng bằng sự kiện giả, có nhãn mô phỏng.
- Hai cửa sổ nhận cùng số khách, đơn, lượt phục vụ và điểm phiên.
- Cả 28 món gọi được bằng tên tiếng Việt không cần `!`, hoàn tất đúng chu kỳ; menu overlay chia trang tối đa bốn món cùng nhóm, đổi mỗi 8 giây, có nút dừng và mặc định dừng khi bật giảm chuyển động.
- 36 khách có chỗ riêng; khách thứ 37 nhận kết quả đầy quán.
- Lệnh lặp, combo quà và sự kiện gửi lại không tạo đơn/điểm ngoài luật.
- Sau tải lại overlay, phiên đang chạy tiếp tục; sau restart backend, phiên bắt đầu mới.
- Có thể capture overlay 1080×1920; người vận hành bật tiếng bằng thao tác trực tiếp.
- Trạng thái lỗi kết nối TikTok hiển thị đúng, không được báo “đã kiểm chứng live” chỉ từ fixture hoặc build.

## Ngoài phạm vi

Tài khoản người xem, bán đồ ăn thật, thanh toán, database, nhiều kênh đồng thời, bảng xếp hạng qua nhiều phiên, 3D/game engine, AI sinh hình trực tiếp và đọc toàn bộ bình luận.
