# Hình ảnh và âm thanh

## Nhận diện

Tên hiển thị mặc định: **Sữa & Giòn**. Quán vỉa hè buổi tối, đèn vàng ấm, biển hiệu xanh lá, điểm nhấn cam của bếp nướng. Menu đọc rõ: sữa đậu nành và bánh tráng nướng. Màu cơ bản: kem `#fff6df`, nâu `#33251e`, xanh `#38654b`, cam `#e78c3f`.

## Overlay

- Không gian thiết kế 1080×1920, tự co theo cửa sổ, giữ tỷ lệ 9:16.
- Trên: biển hiệu và thống kê ngắn; giữa: quầy sữa, bếp, hướng dẫn gọi món; dưới: 12 bàn hai chỗ và khách.
- Chừa biên phải/bottom cho giao diện TikTok; phải thử capture thực tế vì UI từng thiết bị có thể khác nhau.
- Tên khách có nền tương phản, rút gọn khi dài. Bong bóng bình luận có thời hạn, hiệu ứng có trần.
- Nhãn “MÔ PHỎNG” xuất hiện khi có khách/bot giả; không trình bày bot thành người xem thật.

## Tài nguyên bản đầu

Canvas vẽ trực tiếp quán, bàn ghế, khách, ly sữa, bánh, khói và ánh sáng. Không sao chép hình/nhạc repo tham khảo. Nhân vật có hoạt ảnh bước vào, chuyển động tay ăn/uống và nhún thở; chưa có sprite raster. Chỉ thay bằng sprite khi phong cách hình ảnh được chốt; giữ nguyên tọa độ/điểm neo hiện có.

## Âm thanh

- Web Audio tạo tiếng báo phục vụ/nhận quà nhẹ; mặc định tắt để tuân thủ autoplay. Chưa có bản ghi tiếng rót sữa hoặc tiếng nướng thực tế.
- Người vận hành bật tiếng trực tiếp trong cửa sổ được capture.
- Giọng cảm ơn dùng Web Speech API nếu trình duyệt có giọng tiếng Việt. Không có giọng thì hiện chữ; không báo là TTS đã được kiểm chứng.
- Không có nhạc thương mại hoặc dịch vụ AI trả phí trong runtime.
- Có nút tắt tiếng, điều khiển dùng được bằng bàn phím, focus rõ; giảm chuyển động khi hệ điều hành yêu cầu.

## QA hình ảnh

Kiểm tra tên tiếng Việt, tên dài, 0/1/24 khách, bong bóng cùng lúc, quà liên tiếp, overlay 540×960 và cửa sổ ngang, màu/trạng thái món và khả năng đọc khi capture 1080×1920.
