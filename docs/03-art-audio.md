# Hình ảnh và âm thanh

## Nhận diện

Tên hiển thị mặc định: **Sữa & Giòn**. Quán ven Hồ Xuân Hương, Đà Lạt vào ban đêm: trời xanh đậm, trăng và sao, đồi thông tối, ánh đèn vàng phản xuống hồ. Bờ đối diện có hoa dã quỳ vàng và nụ atisô xanh của quảng trường Lâm Viên, lấy bố cục từ ảnh tham khảo người dùng cung cấp. Hai quầy nhỏ có mái sọc xanh/kem và đèn ấm; sân bàn vẫn đủ sáng để nhìn khách và món. Màu cơ bản: trời `#101e30`, nước hồ `#153642`, kem `#fff1cc`, xanh quán `#203d37`, ánh đèn `#ffe2a1`.

## Overlay

- Không gian thiết kế 1080×1920, tự co theo cửa sổ, giữ tỷ lệ 9:16.
- Trên: tên quán, địa danh và thống kê ngắn trên nền trời; tiếp đến đồi thông, Lâm Viên và mặt hồ. Hai quầy nhỏ đặt hai bên bờ hồ, chừa khoảng giữa nhìn ra nước. Menu nằm ngay dưới quầy.
- Sân lát đá chiếm phần dưới, giữ 18 bàn hai chỗ theo hàng 4 + 4 + 4 + 4 + 2. Lối đi giữa quán không có bàn; hàng đầu chừa chỗ cho menu/bong bóng, hàng cuối nằm trên bảng chữ chân cảnh. Số chỗ và ID ghế giữ nguyên.
- Chừa biên phải/bottom cho giao diện TikTok; phải thử capture thực tế vì UI từng thiết bị có thể khác nhau.
- Tên khách có nền tương phản, rút gọn khi dài. Bong bóng bình luận có thời hạn, hiệu ứng có trần.
- Nhãn “MÔ PHỎNG” xuất hiện khi có khách/bot giả; không trình bày bot thành người xem thật.
- Menu hiển thị tên món tiếng Việt và hướng dẫn gõ tên để gọi, không cần `!`. Mỗi trang tối đa bốn món cùng nhóm, đổi mỗi 8 giây. Nút **Dừng menu** nằm cạnh nút âm thanh; giảm chuyển động mặc định dừng đổi trang. Bảng điều khiển có bộ chọn nhóm và vùng món cuộn được bằng bàn phím.

## Tài nguyên bản đầu

Nền tĩnh [xuan-huong.svg](../frontend/src/assets/xuan-huong.svg) tự vẽ cảnh hồ, địa danh, quầy và sân; được đóng gói cùng ứng dụng, không cần tải ảnh ngoài. Canvas chỉ vẽ bàn ghế, khách, món, khói và hiệu ứng, xóa lớp động mỗi khung hình để nền SVG luôn hiện phía dưới. Không sao chép ảnh/watermark trong ảnh tham khảo hoặc hình/nhạc repo tham khảo. Nhân vật có hoạt ảnh bước vào, chuyển động tay ăn/uống và nhún thở; chưa có sprite raster.

Món trên tay dùng kiểu hình trong danh mục: ly sữa theo màu, ly đá, hũ yogurt, panna cotta/flan với sốt, bánh tráng, bánh tiêu, quẩy, bánh đùi gà, bánh mì phô mai và khoai tây chiên. Các vị trong cùng nhóm dùng chung hình, đổi màu; không tạo 28 asset riêng.

## Âm thanh

- Web Audio tạo tiếng báo phục vụ/nhận quà nhẹ; mặc định tắt để tuân thủ autoplay. Chưa có bản ghi tiếng rót sữa hoặc tiếng nướng thực tế.
- Người vận hành bật tiếng trực tiếp trong cửa sổ được capture.
- Giọng cảm ơn dùng Web Speech API nếu trình duyệt có giọng tiếng Việt. Không có giọng thì hiện chữ; không báo là TTS đã được kiểm chứng.
- Không có nhạc thương mại hoặc dịch vụ AI trả phí trong runtime.
- Có nút tắt tiếng, điều khiển dùng được bằng bàn phím, focus rõ; giảm chuyển động khi hệ điều hành yêu cầu.

## QA hình ảnh

Kiểm tra tên tiếng Việt trên nền tối, độ tương phản chữ/menu, tên dài, 0/1/36 khách, lối đi giữa, khoảng hở menu/hàng đầu và bảng chữ/hàng cuối, bong bóng cùng lúc, quà liên tiếp, overlay 540×960 và cửa sổ ngang, màu/trạng thái món và khả năng đọc khi capture 1080×1920. Test tọa độ tự động không thay cho quan sát/capture thực tế.
