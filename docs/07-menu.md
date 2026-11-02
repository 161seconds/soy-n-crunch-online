# Thực đơn và lệnh gọi món

Tham khảo ảnh menu người dùng cung cấp, bỏ toàn bộ phần tàu hủ. Chỉ hiển thị tên món và hướng dẫn gõ tên để gọi; không hiển thị giá.

Danh mục chuẩn: [menu.json](../menu.json). Có 28 món thuộc ba nhóm. Gõ trực tiếp tên món hoặc alias, không cần `!`. Không phân biệt hoa/thường, dấu tiếng Việt, khoảng trắng hay Unicode tổ hợp. Toàn bộ bình luận phải khớp tên/alias; câu như `mình thích sữa đậu xanh` không tạo đơn. Lệnh cũ vẫn dùng được.

## Sữa hạt

| Tên món (gõ trực tiếp) | Lệnh cũ (tùy chọn) | Chuẩn bị |
|---|---|---|
| Sữa đậu nành | `!sua` | 2 giây |
| Đậu nành bạc hà | `!bacha` | 2 giây |
| Đậu nành Milo | `!milo` | 2 giây |
| Đậu nành hạt chia | `!hatchia` | 2 giây |
| Sữa gạo | `!gao` | 2 giây |
| Gạo bạc hà | `!gaobacha` | 2 giây |
| Gạo Milo | `!gaomilo` | 2 giây |
| Gạo matcha | `!gaomatcha` | 2 giây |
| Gạo macchiato trân châu | `!gaomacchiato` | 2 giây |
| Sữa bắp | `!bap` | 2 giây |
| Sữa mè đen | `!meden` | 2 giây |
| Sữa đậu xanh | `!dauxanh` | 2 giây |
| Sữa đậu phộng | `!dauphong` | 2 giây |
| Sữa thập cẩm | `!thapcam` | 2 giây |

## Món lạnh

| Tên món (gõ trực tiếp) | Lệnh cũ (tùy chọn) | Chuẩn bị |
|---|---|---|
| Panna cotta chanh dây | `!panna` | 1 giây |
| Panna cotta kiwi | `!pannakiwi` | 1 giây |
| Panna cotta dâu | `!pannadau` | 1 giây |
| Panna cotta đào | `!pannadao` | 1 giây |
| Yogurt hũ | `!yogurt` | 1 giây |
| Yogurt đá | `!yogurtda` | 1 giây |
| Yogurt thạch dừa | `!yogurtdua` | 1 giây |
| Bánh flan caramel | `!flan` | 1 giây |

## Bánh & ăn vặt

| Tên món (gõ trực tiếp) | Lệnh cũ (tùy chọn) | Chuẩn bị |
|---|---|---|
| Bánh tráng nướng | `!banh` | 4 giây |
| Bánh tiêu | `!tieu` | 3 giây |
| Quẩy nóng | `!quay` | 3 giây |
| Bánh đùi gà | `!duiga` | 3 giây |
| Bánh mì phô mai | `!phomai` | 3 giây |
| Khoai tây chiên | `!khoaitay` | 4 giây |

## Cách dùng

- Trên bảng điều khiển: nhập tên khách, chọn nhóm món, bấm món. Mỗi khách chỉ có một món đang xử lý.
- Trên TikTok LIVE: bình luận tên món. Ví dụ: `sữa đậu xanh`, `panna cotta`, `yogurt đá`, `bánh tráng nướng`. Có thể gõ không dấu như `sua dau xanh`.
- Alias thông dụng: `sữa`, `đậu xanh`, `bánh`, `pana cotta`, `yaourt`, `yaourt đá`, `sữa chua`. `panna cotta`/`pana cotta` mặc định chọn vị chanh dây; gõ tên đầy đủ để chọn vị khác. Lệnh/alias trong JSON dùng được cả có và không có `!`.
- Overlay hiển thị tối đa bốn món cùng nhóm mỗi trang, có tên nhóm và số trang riêng. Chạy hết nhóm sữa hạt rồi đến món lạnh và bánh/ăn vặt; trang cuối ít món vẫn giữ riêng, không ghép món nhóm tiếp theo. Trang đổi mỗi 8 giây. Nút Dừng menu/Chạy menu nằm cạnh điều khiển âm thanh; giảm chuyển động mặc định dừng menu.
- Phục vụ 1 giây, ăn/uống 6 giây sau khi chuẩn bị. Bếp làm lần lượt; nhiều khách có thể ăn cùng lúc.
- Bot mô phỏng gọi ngẫu nhiên trong toàn bộ danh mục.

## Món thêm ngoài ảnh

Giữ bánh tráng nướng của ý tưởng ban đầu; thêm bánh flan caramel, bánh mì phô mai và khoai tây chiên.
