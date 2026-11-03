# Tương tác quà TikTok

## Nghiên cứu — 03/11/2026

- [TikFinity Actions & Events](https://tikfinity.zerody.one/tiktok/actionsandevents): gắn một quà với hành động/animation trong overlay. Áp dụng mô hình này trực tiếp vào Canvas và luật quán, không cần cài TikFinity.
- [TikFinity Goal Overlays](https://tikfinity.zerody.one/tiktok/goals): mục tiêu cộng đồng hiển thị bằng tiến trình. Quán dùng mục tiêu điểm quà; đây là luật game tự chọn, không phải mục tiêu mặc định của TikFinity.
- [TikTokLiveSharp GiftMessage](https://github.com/frankvHoof93/TikTokLiveSharp/blob/main/TikTokLiveSharp/Events/GiftMessage.cs): `RepeatCount` là số cộng dồn; `Amount` lấy từ `ComboCount`; `StreakEnd` lấy từ `RepeatEnd`; `GiftId` và `GroupId` phân biệt chuỗi quà. Giữ xử lý duy nhất ở cuối combo, chống phát lại trước khi thưởng.
- [TikTok Virtual Items Policy](https://www.tiktok.com/legal/page/global/virtual-items-policy/en): giá/quy đổi quà do nền tảng hiển thị và quản lý. Không gán giá tiền hay ID TikTok cố định cho các ví dụ bên dưới. `diamondCount` chỉ được dùng làm điểm game theo dữ liệu connector.

## Luật chọn

`gifts.json` dùng chung cho backend, overlay và bộ thử. Tên quà khớp toàn bộ alias, không phân biệt dấu, hoa/thường, khoảng trắng hoặc Unicode tổ hợp. Tên chưa biết dùng ba ngưỡng điểm cũ; không đoán loại bằng chuỗi con. Alias là danh sách thủ công, chưa phải danh mục toàn bộ quà theo từng vùng TikTok.

| Nhóm | Ví dụ tên quà | Hiệu ứng / tác động |
| --- | --- | --- |
| Quà nhỏ | Tên chưa biết, dưới 10 điểm | Tim bay |
| Quà vừa | Tên chưa biết, 10–99 điểm | Pháo hoa; giảm nửa thời gian còn lại của món đang nấu |
| Quà lớn | Tên chưa biết, từ 100 điểm | Lễ hội; mời tối đa hai khách mô phỏng nếu còn chỗ |
| Hoa | Rose / Hoa hồng | Cánh hoa rơi |
| Mời món | Ice Cream / Kem / Coffee | Mời người tặng một yogurt đá; vẫn kiểm tra chỗ ngồi, nhận món, món đang có và cooldown 8 giây |
| Bếp rực lửa | GG / Fire / Lửa | Bếp nhanh gấp đôi trong 20 giây; giảm nửa thời gian còn lại của món đang nấu |
| Thiên nga | Swan / Thiên nga | Hai thiên nga lướt hồ; mời tối đa hai khách mô phỏng |
| Vũ điệu | Music Note / Disco Ball | Nốt nhạc và khách nhún nhảy |
| Ngân hà | Galaxy / Sao băng | Sao băng trên hồ |

Mọi quà vẫn nhận thưởng theo tổng `diamondCount × repeatCount`: từ 10 điểm giảm nửa thời gian món đang nấu, từ 100 điểm mời tối đa hai khách. Thưởng mời khách theo tên và điểm không cộng dồn thành bốn khách. Không đẩy khách thật, không vượt 49 chỗ, không tăng lượt đã phục vụ trước khi ăn xong.

Mỗi mốc **100 điểm cộng dồn** mở lễ hội và bếp nhanh 20 giây. Một combo vượt nhiều mốc chỉ mở một lễ hội; quà phát lại không mở lại. Bếp nhanh được làm mới đến 20 giây tính từ quà mới, không cộng thời gian vô hạn. Món mới bắt đầu trong thời gian này có thời gian chuẩn bị bằng một nửa. Reset xóa cả tiến trình và tăng tốc.

## Hiển thị và bộ thử

- Tối đa ba hiệu ứng gần nhất, mỗi hiệu ứng 7 giây; combo tăng mật độ hạt có giới hạn. Mọi client vẽ theo ID/thời gian server, kết nối lại chỉ tiếp tục phần còn hạn.
- Người tặng có hào quang và ngôi sao bên nhân vật trong 7 giây. Banner hiện tên, số combo và tác động thực tế.
- Thanh mục tiêu dùng `progress` có nhãn; trạng thái bếp có thời gian còn lại. Giảm chuyển động tắt hạt/nhún nhảy, giữ banner và tiến trình. Không có chớp toàn màn hình.
- Bảng điều khiển có bộ chọn chín tương tác và số lượng combo. Điểm trong bộ thử là giá trị giả, không phải bảng giá TikTok; tất cả sự kiện/khách thử đều có nhãn mô phỏng, không gửi quà lên TikTok.

## Giới hạn kiểm chứng

Fixture protobuf, API/SignalR và kiểm tra Canvas xác minh luồng nội bộ; chỉ được xác nhận TikTok thật sau khi nhận quà thật trong phòng LIVE. Thay đổi danh mục/tên quà TikTok có thể cần bổ sung alias; quà chưa khớp luôn còn hiệu ứng theo điểm.
