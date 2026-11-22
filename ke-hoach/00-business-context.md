<!-- 00-business-context.md | Business Context của KAR HOBBY Workshop -->
# Business Context — KAR HOBBY Workshop

## 1. Sản phẩm / dịch vụ chính
- **Tên sản phẩm:** Dịch vụ Custom Xe Mô Hình Diecast 1:64 & Ráp Weathering Gunpla Thủ Công (Sản phẩm mũi nhọn: *Gói Độ Xe Diecast 1:64 Stance & Wheels Swap / Full Paint Độc Bản* và sản phẩm mồi số *Cẩm Nang & Checklist Tự Custom Diecast 1:64 Cho Người Mới Bắt Đầu*).
- **Dạng:** **Hybrid** (Dịch vụ chế tác thủ công theo yêu cầu Bespoke Service + Sản phẩm vật lý Diorama + Sản phẩm số Digital Guide).
- **Đang ở giai đoạn:** **Đã bán vài đơn / Đã nghiệm thu luồng bán hàng & thanh toán thực tế** (Hệ thống `brain.db` đã ghi nhận 24 khách hàng tiềm năng/leads và 25 đơn hàng với 11 đơn thanh toán thành công qua Sepay).
- **Giá hiện tại:**
  - *Dịch vụ độ cơ bản (Thay mâm, hạ gầm JDM, decal cá nhân):* **180.000 VNĐ / xe**
  - *Dịch vụ độ chuyên sâu (Full sơn đổi màu Chameleon/Candy 2K, căn camber):* **380.000 VNĐ / xe**
  - *Sa bàn Diorama Garage 1:64 LED USB & hộp mica:* **450.000 VNĐ**
  - *Gói hoàn thiện trọn gói xe độ 1-of-1 (bao phôi Mini GT chính hãng):* **890.000 VNĐ**
  - *Cẩm nang & checklist tự độ xe (Sản phẩm số):* **79.000 VNĐ**
- **Link sản phẩm (nếu có):** [https://karhobby.io.vn](https://karhobby.io.vn) *(Trang quản trị: [https://karhobby.io.vn/admin-index](https://karhobby.io.vn/admin-index))*.

---

## 2. Khách hàng đang có
- **Đã bán cho ai:** 
  1. *Nam giới (24 – 35 tuổi), dân văn phòng / công nghệ:* Thích sưu tầm xe mô hình tĩnh JDM (Mini GT, Hot Wheels) để bàn làm việc giải tỏa áp lực, mê xe độc bản nhưng bận rộn không có thời gian và thiết bị chuyên dụng để tự sơn độ.
  2. *Người đam mê Gunpla / cơ khí:* Muốn mô hình của mình mang phong cách sa trường chiến trận (weathering rỉ sét, ám khói súng, kẻ line) nhưng sợ tự làm hỏng phôi kit đắt tiền.
  3. *Khách đặt quà tặng cao cấp:* Muốn làm xe có biển số phong thủy, màu sơn hoặc tem xe độc quyền để tặng bạn bè, đối tác.
- **Họ tìm đến qua kênh nào:** Facebook Fanpage / Ads (nội dung organic khoe xe độ và bài viết đánh trúng nỗi đau người chơi), kênh Zalo tư vấn 1-1 và Landing Page chính thức.
- **Họ trả tiền vì điều gì (Core Insight):**
  - Khách không trả tiền cho một món đồ chơi nhựa hàng loạt — họ trả tiền cho **sự an tâm tuyệt đối và cảm xúc sở hữu tác phẩm độc bản**:
  - Không lo hít mùi sơn độc hại hay đầu tư máy nén khí, airbrush cồng kềnh.
  - Được nghiệm thu 1-1 qua ảnh macro và video Zalo từng công đoạn trước khi giao.
  - Được bảo hiểm vận chuyển 100% với hộp xốp định hình 3 lớp chống sốc, gãy vỡ đền mới.

---

## 3. Tài sản đã có sau 19 ngày
- **Website chạy trên VPS với:**
  - VPS Ubuntu 24 (`103.97.126.38`) chạy reverse proxy Nginx + chứng chỉ HTTPS SSL tự động.
  - Cổng thanh toán quét mã VietQR tự động qua **Sepay Webhook** (bắn thông báo và cập nhật trạng thái đơn tức thì).
  - Cơ sở dữ liệu SQLite `brain.db` hoàn chỉnh (lưu trữ: `knowledge`, `brand_voice`, `business`, `products`, `customers`, `orders`).
  - Hệ thống Agent chạy nền trên VPS qua **goClaw Gateway + Telegram Bot Daemon** (nhóm làm việc *KAR HOBBY - Studio Team* gồm: Bot Bé Yêu - Agent chính, Bot Cây Bút, Bot Họa Sĩ).
  - Cron job tự động quét đơn hàng và báo cáo doanh thu mỗi sáng.
- **Bộ skills đã có:**
  1. `kar-facebook-writer` / `assp-ad-copy-machine`: Viết bài quảng cáo, kịch bản phễu Hook - Body - CTA chuẩn phong cách storytelling.
  2. `daily-social-planner`: Lên kế hoạch và lịch đăng bài 7 ngày đa kênh.
  3. `karhobby-custom-advisor`: Chuyên gia tư vấn kỹ thuật, gợi ý phối màu/mâm và tự động xuất bảng báo giá chi tiết cho khách.
  4. `tao-creative-fb`: Tự động sinh ý tưởng ảnh qua AI, viết caption Facebook và gửi preview duyệt qua Telegram.
  5. `tao-video-ai`: Dây chuyền tạo video AI thương mại 15–25s (KP3/Higgsfield & Kling 3.0) từ ảnh sản phẩm.
- **Brand voice đã định hình trong `brain.db`:** **Yes** *(9 quy tắc cốt lõi: Xưng hô "KAR HOBBY / Xưởng mình" với "Anh em / Bác"; giọng nam tính, đam mê, am hiểu thuật ngữ camber, hạ gầm, stance, weathering; dùng từ khóa signature: "thật ra", "dù sao thì", "đơn giản thôi", "thử xem"; cấm dùng từ sáo rỗng văn phòng).*

---

## 4. Mục tiêu kinh doanh 12 tháng tới
- **Mô hình kinh doanh tôi muốn xây:** **Hybrid Business Model** — Lõi lợi nhuận cao (High-ticket) đến từ Dịch vụ Custom Độc bản & Sa bàn Diorama theo đơn đặt hàng, kết hợp sản phẩm đóng gói (Phôi xe + Kit mâm phụ kiện + Digital Guide) và hệ thống vận hành tự động hóa bằng AI Agent.
- **Doanh thu mong muốn 12 tháng:** **360.000.000 VNĐ – 500.000.000 VNĐ / năm** *(trung bình 30 – 45 triệu VNĐ/tháng khi quy trình thợ xưởng và hệ thống chốt sale tự động đi vào quỹ đạo ổn định)*.
- **1 năm nữa tôi muốn vị trí của mình trên thị trường VN là:** Trở thành **Xưởng Chế Tác & Độ Xe Mô Hình Diecast 1:64 / Sa Bàn Nghệ Thuật Top 1 về uy tín thủ công và dịch vụ cá nhân hóa tại Việt Nam** — điểm đến đầu tiên người chơi mô hình nghĩ tới khi cần một tác phẩm độc bản 1-of-1 mang phong cách cá nhân, vận hành tinh gọn với sự hỗ trợ của đội ngũ AI Agent từ sáng tạo nội dung đến chăm sóc khách hàng.
