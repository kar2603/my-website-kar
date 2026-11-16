# 🛠️ MCP FUNCTIONS ĐƯỢC CHỌN CHO AI AGENT (KAR HOBBY)

Tài liệu đặc tả 3 MCP Function cốt lõi được chọn để tích hợp vào AI Agent (goClaw / Telegram) của xưởng KAR HOBBY. Các function này kết nối trực tiếp với cơ sở dữ liệu `brain.db`, luồng cọc VietQR SePay và hệ thống email Resend.

---

## 1. `get_daily_summary` — Báo Cáo Tình Hình Xưởng Hàng Ngày

* **Tên function:** `get_daily_summary`
* **Mô tả:** Tổng hợp nhanh số liệu khách mới điền form, số đơn đã thanh toán cọc thành công, tổng tiền cọc thu được và các đơn hàng đang chờ xử lý trong ngày.
* **Input params:**
  * `date` (*string*, tùy chọn): Ngày cần xem theo định dạng `YYYY-MM-DD` hoặc các từ khóa `today`, `yesterday` (mặc định: `today`).
* **Output dự kiến:**
  ```json
  {
    "date": "2026-11-16",
    "new_leads_count": 3,
    "paid_deposits_count": 2,
    "total_revenue_today": 4000,
    "pending_orders_count": 5,
    "recent_paid_orders": [
      {
        "code": "KH3079",
        "customer": "Minh Tuấn",
        "amount": 2000,
        "service": "Custom Diecast 1:64"
      }
    ],
    "message": "Hôm nay xưởng có 3 khách mới điền form, 2 đơn đã thanh toán cọc thành công (thu về 4.000đ)."
  }
  ```
* **Tình huống dùng hàng ngày:** Sáng thức dậy hoặc tối trước khi đi ngủ, bạn chỉ cần mở Telegram hỏi tình hình để nắm trọn số khách mới và tiền cọc thực tế đã về tài khoản.
* **Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Hôm nay xưởng thế nào em?"*
  * *"Báo cáo tình hình hôm nay"*
  * *"Hôm nay có mấy đơn cọc rồi?"*
  * *"Doanh thu cọc hôm nay được bao nhiêu?"*
  * *"Hôm qua có bao nhiêu khách điền form vậy bé?"*
* **Độ ưu tiên:** ⭐⭐⭐⭐⭐ (**5/5** - Bắt buộc có)

---

## 2. `lookup_order_info` — Tra Cứu Khách Hàng & Đơn Hàng Siêu Tốc

* **Tên function:** `lookup_order_info`
* **Mô tả:** Tìm kiếm chi tiết đơn hàng, thông tin liên hệ của khách hàng, dịch vụ/sản phẩm yêu cầu, số tiền cọc, trạng thái thanh toán và ghi chú kỹ thuật.
* **Input params:**
  * `query` (*string*, bắt buộc): Từ khóa tìm kiếm — Mã đơn hàng (ví dụ: `KH5621`), Số điện thoại khách (ví dụ: `0905138105`), hoặc Tên khách hàng.
* **Output dự kiến:**
  ```json
  {
    "found": true,
    "order_code": "KH5621",
    "customer_name": "Lê Nguyễn Đăng Kha",
    "customer_phone": "0905138105",
    "customer_email": "khale@gmail.com",
    "service_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "deposit_amount": 2000,
    "status": "success",
    "order_date": "2026-11-14 16:58:33",
    "note": "Hạ gầm xe Nissan GT-R màu xám, thay mâm TE37 màu đồng",
    "email_sent": true
  }
  ```
* **Tình huống dùng hàng ngày:** Đang bận làm xe tại bàn thợ mà khách nhắn tin hối tiến độ hoặc hỏi thông tin, bạn nhắn Telegram để AI tra cứu thông tin và ghi chú của khách ngay lập tức.
* **Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Check giúp anh đơn KH5621"*
  * *"Khách sđt 0905138105 đặt xe gì vậy em?"*
  * *"Đơn của anh Kha đã thanh toán cọc chưa?"*
  * *"Xem thông tin đơn KH3079 khách có dặn dò gì không"*
  * *"Tìm khách hàng tên Minh Tuấn"*
* **Độ ưu tiên:** ⭐⭐⭐⭐⭐ (**5/5** - Cực kỳ thường dùng)

---

## 3. `sync_sepay_deposits` — Đối Soát & Kích Hoạt Cọc Tự Động

* **Tên function:** `sync_sepay_deposits`
* **Mô tả:** Đối soát giao dịch chuyển khoản mới nhất từ ngân hàng (VietinBank qua Google Sheet SePay) với các đơn hàng đang chờ (`pending`). Nếu khớp nội dung chuyển khoản, tự động cập nhật trạng thái đơn thành `success` và kích hoạt gửi email xác nhận cọc qua Resend.
* **Input params:**
  * `order_code` (*string*, tùy chọn): Mã đơn cụ thể cần kiểm tra gấp (ví dụ: `KH3208`). Nếu để trống, hệ thống sẽ tự động quét và đối soát tất cả các giao dịch mới nhất.
* **Output dự kiến:**
  ```json
  {
    "success": true,
    "new_synced_orders": 1,
    "matched_orders": [
      {
        "code": "KH3208",
        "amount": 2000,
        "customer": "Khách SePay (KH3208)",
        "time": "16:07:28"
      }
    ],
    "email_confirmation_triggered": true,
    "message": "Đã khớp thành công 1 đơn cọc mới #KH3208 (2.000đ), đã tự động kích hoạt gửi Email xác nhận cọc qua Resend!"
  }
  ```
* **Tình huống dùng hàng ngày:** Khi khách nhắn *"Anh chuyển khoản cọc rồi nhé"* hoặc khi bạn muốn kiểm tra xem có ai vừa chuyển khoản cọc mà hệ thống chưa kịp ghi nhận hay không.
* **Ví dụ câu nhắn Telegram sẽ trigger function này:**
  * *"Quét tiền cọc giúp anh"*
  * *"Check tiền cọc đơn KH3208"*
  * *"Khách bảo vừa chuyển khoản rồi, em kiểm tra tài khoản xem tiền về chưa"*
  * *"Đồng bộ giao dịch SePay mới nhất"*
  * *"Đối soát tiền cọc hôm nay"*
* **Độ ưu tiên:** ⭐⭐⭐⭐☆ (**4/5** - Rất hữu ích)
