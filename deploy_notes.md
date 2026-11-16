# 🚀 HƯỚNG DẪN DEPLOY WEBSITE LÊN VPS UBUNTU PRODUCTION

Tài liệu tóm tắt các thông số, cấu hình và lệnh vận hành hệ thống KAR HOBBY trên VPS Ubuntu.

---

## 1. CỔNG ĐANG LẮNG NGHE (PORT)
* **Cổng mặc định:** `3000` (hoặc lấy tự động từ biến môi trường `process.env.PORT`).
* **Đường dẫn truy cập nội bộ:** `http://localhost:3000`
* **Đường dẫn Admin Panel:** `http://localhost:3000/admin` (hoặc `http://localhost:3000/admin-index`)
* **Endpoint kiểm tra trạng thái:** `http://localhost:3000/api/health`

---

## 2. CÁC BIẾN MÔI TRƯỜNG (.env) CẦN CÓ TRÊN VPS

Khi clone code về thư mục trên VPS (ví dụ `/var/www/my-website`), tạo file `.env` bằng lệnh:
```bash
cp .env.example .env
nano .env
```

Điền đầy đủ các thông số sau:

```env
# Port máy chủ Node.js Express lắng nghe
PORT=3000

# Resend API Key để gửi chuỗi 3 email chào mừng & xác nhận cọc
RESEND_API_KEY=re_Je7X3Rgg_HhqYKBd6s9Q61FQLFkb1oaGu
RESEND_SENDER=KAR HOBBY <contact@karhobby.io.vn>
ADMIN_EMAIL=lenguyendangkha260304@gmail.com
DOMAIN=karhobby.io.vn

# Đường dẫn file database SQLite
DATABASE_PATH=brain.db

# Link CSV Google Sheet đồng bộ VietQR SePay
SEPAY_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv
```

---

## 3. LỆNH CÀI ĐẶT & CHẠY SERVER TRÊN VPS UBUNTU

### Bước 1: Cài đặt Node.js & Git (nếu VPS mới tinh)
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git sqlite3
```

### Bước 2: Kéo mã nguồn về VPS
```bash
cd /var/www
git clone https://github.com/kar2603/my-website.git
cd my-website
npm install
```

### Bước 3: Tạo file `.env` và copy `brain.db` vào thư mục
* Tạo file `.env` theo mục 2 ở trên.
* Đưa file `brain.db` lên thư mục `/var/www/my-website/brain.db` (qua SCP, SFTP hoặc tạo mới).

### Bước 4: Chạy server production liên tục 24/7 bằng PM2 (Khuyên dùng)
```bash
sudo npm install -g pm2
pm2 start server.js --name "kar-hobby"
pm2 save
pm2 startup
```

*Lệnh quản lý PM2:*
* Xem logs trực tiếp: `pm2 logs kar-hobby`
* Khởi động lại: `pm2 restart kar-hobby`
* Kiểm tra trạng thái: `pm2 status`

### (Tùy chọn) Chạy bằng Systemd Service:
```bash
sudo nano /etc/systemd/system/kar-hobby.service
```
Nội dung:
```ini
[Unit]
Description=KAR HOBBY Production Web Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/my-website
ExecStart=/usr/bin/node /var/www/my-website/server.js
Restart=always
RestartSec=5
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```
Kích hoạt:
```bash
sudo systemctl daemon-reload
sudo systemctl enable kar-hobby
sudo systemctl start kar-hobby
```

---

## 4. CẤU HÌNH NGINX REVERSE PROXY & SSL (PORT 80/443 -> 3000)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/kar-hobby
```

Nội dung:
```nginx
server {
    server_name karhobby.io.vn www.karhobby.io.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Bật site và cấp SSL Let's Encrypt tự động:
```bash
sudo ln -s /etc/nginx/sites-available/kar-hobby /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d karhobby.io.vn -d www.karhobby.io.vn
```
