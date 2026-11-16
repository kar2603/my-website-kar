# 🏎️ KAR HOBBY — WORKSHOP & CRM MANAGEMENT SYSTEM

Hệ thống Landing Page bán hàng, tiếp nhận dịch vụ độ xe Diecast 1:64 / Gundam, kết nối cổng thanh toán tự động VietQR SePay và hệ thống CRM quản trị đơn hàng, tích hợp gửi email Resend tự động.

---

## 📁 1. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
D:\web/
├── api/                           # Vercel Serverless Functions
│   ├── check-payment.js           # Kiểm tra giao dịch SePay & gửi mail xác nhận cọc
│   ├── submit-form.js             # Nhận form đăng ký & gửi chuỗi 3 email Resend
│   └── orders.js                  # API RESTful xử lý đơn hàng trên Vercel
├── backups/                       # Thư mục chứa các bản sao lưu database an toàn
│   ├── brain_backup_latest.db     # Bản backup mới nhất
│   └── brain_backup_*.db          # Các bản backup theo mốc thời gian
├── admin-index.html               # Trang Quản trị CRM (Quản lý Sản phẩm, Khách hàng, Đơn hàng)
├── index.html                     # Landing Page chính thức cho khách hàng đặt lịch & cọc VietQR
├── brain.db                       # Database SQLite trung tâm (Sản phẩm, Khách hàng, Đơn hàng)
├── server.py                      # Backend Python HTTP Server (cho Localhost & VPS)
├── vercel.json                    # Cấu hình định tuyến & rewrite URLs trên Vercel
├── package.json                   # Khai báo cấu hình dự án Node.js
├── .env                           # File chứa API Key & cấu hình bảo mật (ĐÃ BẢO MẬT)
├── .env.example                   # File mẫu cấu hình biến môi trường
├── .gitignore                     # Cấu hình bỏ qua file bí mật & file thừa khi push Git
├── email_sequence.md              # Kịch bản 3 Email chăm sóc & Brand Voice
└── test_log.md                    # Nhật ký kiểm tra & khắc phục toàn bộ lỗi hệ thống
```

---

## 🔐 2. CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)

Hệ thống đã được thiết kế bảo mật, tách toàn bộ API Key và thông tin nhạy cảm ra file `.env`.

Tạo file `.env` tại thư mục gốc từ file `.env.example`:

```bash
cp .env.example .env
```

Nội dung file `.env`:

```env
# ================================================================
# RESEND EMAIL CONFIGURATION
# ================================================================
RESEND_API_KEY=re_Je7X3Rgg_HhqYKBd6s9Q61FQLFkb1oaGu
RESEND_SENDER=KAR HOBBY <contact@karhobby.io.vn>
ADMIN_EMAIL=lenguyendangkha260304@gmail.com
DOMAIN=karhobby.io.vn

# ================================================================
# DATABASE & SEPAY CONFIGURATION
# ================================================================
DATABASE_PATH=brain.db
SEPAY_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv
PORT=8000
```

> ⚠️ **LƯU Ý:** File `.env` và `resend_config.txt` đã được thêm vào `.gitignore` để **không bao giờ bị lộ ra ngoài** khi tải code lên GitHub.

---

## 🚀 3. HƯỚNG DẪN DEPLOY TRÊN VERCEL (KHUYÊN DÙNG)

Vercel là nền tảng phù hợp nhất cho dự án này (chạy 24/7, tự động cấp phát SSL miễn phí, hỗ trợ Serverless Functions trong thư mục `api/`).

### Bước 1: Đẩy mã nguồn lên GitHub
1. Khởi tạo kho lưu trữ GitHub (Private Repository) hoặc sử dụng repo hiện tại `kar2603/kar-hobby`.
2. Đảm bảo các file sau đã có trên GitHub:
   - `index.html`
   - `admin-index.html`
   - `vercel.json`
   - `package.json`
   - Thư mục `api/` (chứa `check-payment.js`, `submit-form.js`, `orders.js`)
   - `.gitignore` và `.env.example`

### Bước 2: Import dự án vào Vercel
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Bấm **Add New...** → **Project** → Chọn repository `kar-hobby`.
3. Trong mục **Build and Output Settings**: Giữ nguyên mặc định (Framework Preset: Other).

### Bước 3: Cài đặt Biến Môi Trường (Environment Variables)
Tại trang cài đặt dự án trên Vercel:
1. Vào tab **Settings** → **Environment Variables**.
2. Thêm các biến sau:
   - `RESEND_API_KEY`: `re_Je7X3Rgg_HhqYKBd6s9Q61FQLFkb1oaGu`
   - `RESEND_SENDER`: `KAR HOBBY <contact@karhobby.io.vn>`
   - `ADMIN_EMAIL`: `lenguyendangkha260304@gmail.com`
   - `SEPAY_SHEET_CSV_URL`: `https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv`
3. Bấm **Save** và thực hiện **Redeploy** để Vercel nạp các biến này.

### Bước 4: Cấu hình Tên Miền Riêng (Custom Domain)
1. Vào **Settings** → **Domains**.
2. Thêm domain: `karhobby.io.vn`.
3. Cấu hình bản ghi DNS theo hướng dẫn của Vercel (bản ghi A hoặc CNAME).

---

## 🖥️ 4. HƯỚNG DẪN DEPLOY TRÊN MÁY CHỦ RIÊNG (VPS LINUX / UBUNTU)

Nếu bạn muốn tự chạy server riêng trên VPS (DigitalOcean, Linode, AWS EC2, Viettel IDC...):

### Bước 1: Cài đặt môi trường trên VPS
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip git nginx certbot python3-certbot-nginx
```

### Bước 2: Tải mã nguồn & Cài đặt cấu hình
```bash
cd /var/www
git clone https://github.com/kar2603/kar-hobby.git
cd kar-hobby
cp .env.example .env
nano .env # Điền API Key và cấu hình thực tế
```

### Bước 3: Thiết lập chạy nền tự động (Systemd Service)
Tạo file service để server tự khởi động cùng hệ thống:
```bash
sudo nano /etc/systemd/system/karhobby.service
```

Nội dung:
```ini
[Unit]
Description=KAR HOBBY Backend Service
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/kar-hobby
ExecStart=/usr/bin/python3 /var/www/kar-hobby/server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Kích hoạt và khởi chạy service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable karhobby
sudo systemctl start karhobby
sudo systemctl status karhobby
```

### Bước 4: Cấu hình Nginx & Chứng chỉ SSL miễn phí (Let's Encrypt)
Tạo cấu hình Nginx:
```bash
sudo nano /etc/nginx/sites-available/karhobby
```

Nội dung:
```nginx
server {
    server_name karhobby.io.vn www.karhobby.io.vn;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Bật site và cấp SSL:
```bash
sudo ln -s /etc/nginx/sites-available/karhobby /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d karhobby.io.vn -d www.karhobby.io.vn
```

---

## ⚙️ 5. CÁC LUỒNG HOẠT ĐỘNG CHÍNH

### 1. Luồng Tiếp nhận Form & Chuỗi 3 Email Resend
- Khách hàng điền Họ tên, Số điện thoại (bắt buộc đúng 10 số đầu 03, 05, 07, 08, 09), Email (bắt buộc đúng cú pháp chuẩn) trên Landing Page.
- Hệ thống gửi dữ liệu về `/api/submit-form`:
  - **Email 1:** Gửi ngay tức thì để chào mừng và giới thiệu xưởng.
  - **Email 2:** Tự động xếp lịch gửi sau 2 ngày (Chia sẻ bí quyết kỹ thuật sơn lót & độ xe).
  - **Email 3:** Tự động xếp lịch gửi sau 3 ngày (Gửi bảng giá chi tiết & link thanh toán cọc).
  - *Chế độ TEST:* Nếu email chứa `+test` (ví dụ `tenminh+test@gmail.com`), hệ thống gửi cả 3 email ngay lập tức.

### 2. Luồng Thanh toán Cọc VietQR SePay & Xác nhận Đơn
- Khách điền form xong, hệ thống tạo mã đơn dạng `KHxxxx` và hiển thị mã QR VietQR (2.000đ hoặc số tiền cọc quy định).
- Trình duyệt tự động polling kiểm tra Google Sheet của SePay mỗi 3 giây.
- Khi khách chuyển khoản thành công:
  - Hệ thống gọi `/api/check-payment` kích hoạt gửi Email xác nhận cọc thành công từ `contact@karhobby.io.vn` kèm hướng dẫn nhận hàng.
  - Gửi thông báo có đơn mới tới email Admin (`lenguyendangkha260304@gmail.com`).
  - Giao diện Admin Panel lập tức cập nhật đơn hàng thành trạng thái `SUCCESS (ĐÃ CỌC)`.

### 3. Luồng Quản trị CRM Admin (`/admin-index`)
- Quản lý 3 đối tượng chính: Sản phẩm, Khách hàng, Đơn hàng.
- Nút **`🔄 Đồng Bộ SePay`** hỗ trợ quét trực tiếp dữ liệu từ Google Sheet.
- Tạo đơn hàng thủ công: Cho phép chọn khách cũ hoặc nhập nhanh khách mới, lưu trực tiếp tại client & `localStorage` giúp thao tác 100% không bị phụ thuộc server.
- Tự động trừ tồn kho khi tạo đơn hàng vật lý (`physical`).

---

## 💾 6. SAO LƯU & PHỤC HỒI DATABASE (BACKUP & RESTORE)

Hệ thống lưu trữ toàn bộ dữ liệu thực trong file SQLite `brain.db`.

### Sao lưu (Backup)
Chạy script sao lưu an toàn (sử dụng SQLite Online Backup API không bị lock database):
```bash
python -c "
import sqlite3, datetime, os
os.makedirs('backups', exist_ok=True)
now = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
src = sqlite3.connect('brain.db')
b_file = sqlite3.connect(f'backups/brain_backup_{now}.db')
b_latest = sqlite3.connect('backups/brain_backup_latest.db')
src.backup(b_file)
src.backup(b_latest)
b_file.close()
b_latest.close()
src.close()
print('Backup thành công!')
"
```

### Phục hồi (Restore)
Để khôi phục database từ bản backup:
```bash
cp backups/brain_backup_latest.db brain.db
```

---

## 📞 HỖ TRỢ KỸ THUẬT

- **Xưởng chế tác:** KAR HOBBY
- **Website:** [karhobby.io.vn](https://karhobby.io.vn)
- **Admin Panel:** [karhobby.io.vn/admin](https://karhobby.io.vn/admin)
- **Email quản trị:** `contact@karhobby.io.vn` | `lenguyendangkha260304@gmail.com`
