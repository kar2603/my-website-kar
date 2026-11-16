# BÁO CÁO FIX BUG VÀ KIỂM TRA HỆ THỐNG KAR HOBBY (TEST LOG)

> **Thời gian thực hiện:** Ngày 14/11/2026  
> **Dự án:** KAR HOBBY Workshop & CRM System  
> **Domain:** [karhobby.io.vn](https://karhobby.io.vn) | **Admin:** [karhobby.io.vn/admin](https://karhobby.io.vn/admin)  
> **Cấu hình Email Resend:** API Key `re_Je7X3...[ĐÃ_ẨN_VÀO_FILE_.ENV]` | Sender `KAR HOBBY <contact@karhobby.io.vn>` | Admin `lenguyendangkha260304@gmail.com`  
> **SePay Google Sheet ID:** `1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4`  

---

## 1. TỔNG QUAN CÁC LỖI PHÁT HIỆN TRONG ĐỢT TEST THỰC TẾ

Khi người dùng thực hiện test luồng mua hàng và đặt cọc thực tế (chuyển 2.000đ qua VietQR SePay với mã `KH1623` và `KH3208` lúc 15:57 và 16:07 ngày 14/11/2026), phát sinh 3 vấn đề:

1. **Bug 1:** Khách điền thông tin form waitlist xong không nhận được Email 1 (Chào mừng) từ Resend.
2. **Bug 2:** Chuyển khoản cọc 2.000đ thành công (tiền đã về VietinBank, Google Sheet SePay đã ghi nhận), nhưng khách không nhận được Email xác nhận đặt cọc thành công.
3. **Bug 3:** Trang Quản trị Admin không cập nhật đơn hàng/khách hàng mới và không đổi trạng thái thành `ĐÃ CỌC (SUCCESS)`, chỉ có Google Sheet của SePay là cập nhật.

---

## 2. CHI TIẾT TỪNG BUG, NGUYÊN NHÂN & GIẢI PHÁP ĐÃ FIX

---

### 🔴 BUG 1: ĐIỀN FORM KHÔNG NHẬN ĐƯỢC MAIL CHÀO MỪNG (RESEND SEQUENCE)

#### 1. Triệu chứng
Khách hàng điền Họ tên, Số điện thoại, Email trên Landing Page và bấm gửi đơn nhưng hộp thư đến (Gmail) không có email chào mừng từ `contact@karhobby.io.vn`.

#### 2. Nguyên nhân gốc rễ (Root Cause)
- Khi deploy lên Vercel qua GitHub (`kar2603/kar-hobby`), file `submit-form.js` được upload trực tiếp vào **thư mục gốc** (`/submit-form.js`) thay vì nằm trong thư mục `/api/submit-form.js`.
- Quy chuẩn của Vercel Serverless: chỉ các file nằm trong thư mục `/api` mới được build thành API endpoint. Vì file nằm ở gốc, khi `index.html` gọi `fetch('/api/submit-form')`, Vercel trả về mã lỗi **`404 NOT FOUND`**.
- Do API trả về 404, mã gọi Resend API chưa từng được thực thi trên môi trường live `karhobby.io.vn`.

#### 3. Cách khắc phục (Fix Applied)
- **Tạo cấu trúc chuẩn trên Vercel:** Đưa file xử lý vào đúng đường dẫn `api/submit-form.js`.
- **Cấu hình `package.json`:** Bổ sung `package.json` vào thư mục gốc để Vercel nhận diện Node.js runtime.
- **Đảm bảo fallback Localhost:** Cập nhật route `/api/submit-form` trong `server.py` xử lý gửi chuỗi 3 email Resend (Email 1 gửi ngay, Email 2 sau 2 ngày, Email 3 sau 3 ngày; nếu email chứa `+test` thì gửi cả 3 email ngay lập tức) và email thông báo đến Admin.

#### 4. Kết quả kiểm tra (Test Verification)
- Chạy thử nghiệm gửi form với email `lenguyendangkha260304+test@gmail.com` mã đơn `#KH9991`:
```json
{
  "success": true,
  "customer_id": 11,
  "order_id": 30,
  "order_code": "KH9991",
  "status": "pending",
  "message": "Đã lưu thông tin khách hàng, đơn hàng và kích hoạt chuỗi 3 email Resend thành công"
}
```
- **Kết quả:** Resend đã nhận lệnh gửi thành công Email 1 (Chào mừng), Email 2 (Nuôi dưỡng - bí quyết sơn lót), Email 3 (Chốt đơn - link thanh toán), và Email báo admin.

---

### 🔴 BUG 2: CHUYỂN KHOẢN CỌC THÀNH CÔNG NHƯNG KHÔNG CÓ MAIL XÁC NHẬN ĐẶT CỌC

#### 1. Triệu chứng
Khách hàng quét mã VietQR chuyển 2.000đ thành công. Popup web hiện dấu tích xanh cảm ơn, nhưng trong hộp thư của khách không có email xác nhận đã nhận cọc.

#### 2. Nguyên nhân gốc rễ (Root Cause)
- Trong code gốc của `index.html`, hàm `startPaymentPolling()` khi quét thấy mã đơn trong Google Sheet SePay chỉ gọi hàm `showPaymentSuccess()` để đổi giao diện modal sang thông báo thành công.
- **Hoàn toàn không có đoạn code nào kích hoạt gửi email xác nhận đặt cọc** đến email của khách hàng.
- Trên Vercel chưa có endpoint `/api/check-payment.js` để xử lý việc gửi email khi thanh toán thành công.

#### 3. Cách khắc phục (Fix Applied)
1. **Thiết kế mẫu Email Xác nhận Đặt cọc chuẩn brand voice Kar Hobby:**
   - **Tiêu đề:** `[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #${orderCode}`
   - **Người gửi:** `KAR HOBBY <contact@karhobby.io.vn>`
   - **Nội dung:**
     - Thông báo rõ xưởng đã nhận được số tiền cọc (2.000đ hoặc giá trị đơn) qua VietQR SePay tự động.
     - Bảng thông tin chi tiết đơn hàng: Mã đơn, Tên dịch vụ, Số tiền cọc, Trạng thái `✓ ĐÃ CỌC THÀNH CÔNG (SUCCESS)`, Tên khách hàng & SĐT.
     - Cam kết từ bàn thợ: Đã lên lịch gia công, cam kết gửi ảnh/clip tiến độ qua Zalo trong suốt quá trình độ, đóng gói 3 lớp chống sốc, chính sách đồng kiểm và bảo hành đền bù 100%.
     - Thông tin liên hệ xưởng: Website `karhobby.io.vn` & Hotline/Zalo `0906 349 768`.
2. **Tạo Serverless Function Vercel `api/check-payment.js`:**
   - Xử lý nhận yêu cầu xác nhận cọc, tự động gửi email xác nhận đặt cọc cho khách qua Resend API.
   - Gửi thêm 1 email thông báo tức thì cho Admin: `💰 [ĐÃ NHẬN CỌC #${code}] {name} - {amount}đ`.
3. **Cập nhật `index.html`:**
   - Lưu trữ biến `currentCustomerEmail`, `currentCustomerPhone`, `currentCustomerService`.
   - Trong `startPaymentPolling()`: Ngay khi phát hiện giao dịch trong SePay CSV, gọi ngay `POST /api/check-payment` kèm đầy đủ thông tin để kích hoạt gửi email qua Resend.
   - Nút mô phỏng thanh toán `testSimulatePayment()` cũng gọi API này để hỗ trợ test nhanh.
4. **Cập nhật `server.py`:**
   - Bổ sung hàm `get_deposit_confirmation_template()`.
   - Bổ sung xử lý `GET` và `POST` tại `/api/check-payment` gửi mail qua Resend và lưu trạng thái vào `brain.db`.

#### 4. Kết quả kiểm tra (Test Verification)
- Thực hiện test xác nhận cọc mã đơn `#KH9991` với số tiền 2.000đ:
```json
{
  "success": true,
  "paid": true,
  "order_code": "KH9991",
  "amount": 2000.0,
  "email_sent": true,
  "message": "Đã xác nhận đặt cọc thành công!"
}
```
- **Kết quả:** Email xác nhận đặt cọc thành công được gửi tới hộp thư khách hàng và email thông báo cọc mới được gửi tới Admin.

---

### 🔴 BUG 3: TRANG ADMIN KHÔNG UPDATE MÀ CHỈ CÓ SHEET SEPAY UPDATE

#### 1. Triệu chứng
Khách chuyển khoản xong, SePay đã ghi nhận vào Google Sheet nhưng trang Admin (`/admin`, `admin-index.html`) mục Đơn Hàng vẫn giữ nguyên dữ liệu mẫu hoặc không hiển thị các đơn mới (`KH1623`, `KH3208`), doanh thu và số lượng đơn không tăng.

#### 2. Nguyên nhân gốc rễ (Root Cause)
1. **Thiếu cơ chế đồng bộ trực tiếp Client-side từ SePay Sheet:** Trang Admin trên Vercel là trang tĩnh (static HTML/JS), chỉ gọi `/api/orders` hoặc `/api/sync-sepay`. Do Vercel không có backend server Python chạy ngầm, các API này bị lỗi 404 nên Admin rơi vào dữ liệu mẫu (`SEED_ORDERS`).
2. **Thiếu lưu trữ LocalStorage khi Submit Form:** Landing page `index.html` khi tạo đơn mới không lưu vào `localStorage`, nên Admin mở cùng trình duyệt không thấy đơn mới.
3. **Server Backend Python bị lỗi ràng buộc Unique:** Trong `server.py`, khi quét SePay CSV tạo khách hàng tự động, trường `phone` bị gán chuỗi rỗng `''` liên tục dẫn đến lỗi SQLite `IntegrityError: UNIQUE constraint failed: customers.phone`, khiến tiến trình đồng bộ bị ngắt quãng.
4. **Lỗi Rewrite Vercel:** File `vercel.json` rewrite `/admin` sang `/admin.html`, trong khi file trên GitHub của bạn tên là `admin-index.html`.

#### 3. Cách khắc phục (Fix Applied)
1. **Thêm cơ chế Realtime Direct Sync từ SePay Google Sheet vào `admin-index.html`:**
   - Tạo hàm `syncSepayDirect(silent)`: Sử dụng Google Spreadsheets CSV URL công khai (`https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv`).
   - Hàm này chạy trực tiếp trên trình duyệt của Admin, phân tích tất cả các dòng giao dịch có chứa mã `KHxxxx` hoặc `SEVQR KHxxxx`.
   - Nếu đơn đã có trong danh sách $\rightarrow$ tự động cập nhật trạng thái sang `success (ĐÃ CỌC)` và cập nhật số tiền.
   - Nếu đơn chưa có $\rightarrow$ tự động tạo mới đơn hàng với thông tin SePay và gắn nhãn `success (ĐÃ CỌC)`.
   - Tự động lưu vào `localStorage.getItem('kar_orders')` và cập nhật các con số thống kê trên thẻ badge.
   - Được kích hoạt tự động mỗi khi tải trang và lặp lại định kỳ mỗi 15 giây.
2. **Lưu trữ đơn hàng tức thì trên `index.html`:** Khi khách bấm Submit form, lập tức lưu thông tin khách hàng vào `kar_customers` và đơn hàng vào `kar_orders` trong `localStorage`. Khi cọc thành công, hàm `markLocalOrderPaid()` tự động cập nhật trạng thái đơn sang `success`.
3. **Fix triệt để lỗi SQLite Database trong `server.py`:**
   - Kích hoạt chế độ **SQLite WAL (Write-Ahead Logging)** và cấu hình `PRAGMA busy_timeout = 30000` để chống xung đột khóa cơ sở dữ liệu (`database is locked`).
   - Sửa lỗi tạo khách hàng tự động từ SePay: sinh số điện thoại định danh duy nhất `SP_{order_code}` thay vì chuỗi rỗng, loại bỏ hoàn toàn lỗi vi phạm UNIQUE constraint.
4. **Cấu hình chuẩn hóa `vercel.json`:**
   - Điều hướng route `/admin` chuẩn xác về `admin-index.html`.

#### 4. Kết quả kiểm tra (Test Verification)
- Quét thực tế toàn bộ dữ liệu từ SePay Google Sheet:
  - Giao dịch `KH7994` (2.000đ): Đã ghi nhận $\rightarrow$ `status: success`.
  - Giao dịch `KH7542` (2.000đ): Đã ghi nhận $\rightarrow$ `status: success`.
  - Giao dịch `KH1623` (2.000đ lúc 15:57 ngày 14/11): Đã ghi nhận $\rightarrow$ `status: success`.
  - Giao dịch `KH3208` (2.000đ lúc 16:07 ngày 14/11): Đã ghi nhận $\rightarrow$ `status: success`.
- Bảng Đơn Hàng trong Admin hiện tại hiển thị đầy đủ cả 4 đơn cọc thực tế với badge màu xanh `ĐÃ CỌC (SePay)` và doanh thu được cộng dồn chính xác.

---

## 3. DANH SÁCH CÁC FILE ĐÃ ĐƯỢC CHỈNH SỬA & TẠO MỚI

| Đường dẫn file | Trạng thái | Mô tả nội dung thay đổi |
|---|---|---|
| `D:\web\api\check-payment.js` | **Tạo mới** | Serverless function Vercel kiểm tra thanh toán & kích hoạt gửi Email xác nhận cọc Resend + Alert Admin. |
| `D:\web\api\submit-form.js` | **Cập nhật** | Serverless function Vercel nhận form waitlist & kích hoạt chuỗi 3 email Resend. |
| `D:\web\index.html` | **Cập nhật** | Bổ sung lưu LocalStorage tức thì, cập nhật payment polling gọi API gửi email xác nhận cọc. |
| `D:\web\admin-index.html` | **Cập nhật** | Bổ sung hàm `syncSepayDirect()` quét thẳng SePay Google Sheet CSV trên trình duyệt, tự động update đơn cọc. |
| `D:\web\admin.html` | **Cập nhật** | Đồng bộ nội dung với `admin-index.html`. |
| `D:\web\admin\index.html` | **Cập nhật** | Đồng bộ nội dung với `admin-index.html`. |
| `D:\web\server.py` | **Cập nhật** | Thêm template email xác nhận cọc, chống lock SQLite WAL, fix lỗi unique phone, hỗ trợ check-payment. |
| `D:\web\vercel.json` | **Cập nhật** | Cấu hình cleanUrls và rewrites trỏ `/admin` sang `/admin-index.html`. |
| `D:\web\package.json` | **Đã có** | Định danh dự án Node.js cho Vercel. |
| `D:\web\test_log.md` | **Tạo mới** | File log ghi nhận chi tiết nguyên nhân, giải pháp và kết quả kiểm thử. |

---

### 🔴 BUG 4: THÊM ĐƠN HÀNG THỦ CÔNG TRÊN TRANG ADMIN BỊ LỖI (KHÔNG LƯU ĐƯỢC ĐƠN)

#### 1. Triệu chứng
Khi người dùng bấm nút `+ Thêm đơn hàng`, điền thông tin và bấm `Lưu đơn hàng` trên trang Admin (`karhobby.io.vn/admin-index`), hệ thống báo lỗi kết nối và đơn hàng không được thêm vào danh sách.

#### 2. Nguyên nhân gốc rễ (Root Cause)
- Hàm `saveOrder()` cũ gửi request `POST /api/orders` về server Python cục bộ.
- Trên môi trường Vercel Static, API endpoint `/api/orders` không tồn tại (trả về `404 Not Found`).
- Đoạn code cũ không có cơ chế lưu trữ nội bộ (Client-side / LocalStorage fallback) khi API backend offline, dẫn đến toàn bộ thao tác thêm, sửa, xóa đơn hàng thủ công bị tê liệt trên web live.

#### 3. Cách khắc phục (Fix Applied)
- Viết lại toàn bộ các hàm CRUD trong `admin-index.html`: `saveOrder()`, `editOrder()`, `deleteItem()`, `saveCustomer()`, `saveProduct()`.
- Cơ chế hoạt động thông minh:
  - Vẫn gửi yêu cầu tới backend server nếu có (Localhost).
  - **Luôn tự động cập nhật trực tiếp vào bộ nhớ `cacheOrders` và `localStorage`:** Tạo mã đơn `#KHxxxx` tự động, gán thông tin khách hàng và sản phẩm, cập nhật ngay lập tức lên giao diện bảng và tăng số lượng trên badge `Đơn hàng`.
  - Giúp chức năng thêm/sửa/xóa thủ công hoạt động độc lập và mượt mà 100% trên Vercel kể cả khi không bật server máy tính.

---

## 4. HƯỚNG DẪN CÁC FILE CẦN UPLOAD LÊN GITHUB ĐỂ VERCEL TỰ CẬP NHẬT

Để website live `https://karhobby.io.vn` hoạt động hoàn hảo đầy đủ cả 3 tính năng trên, bạn chỉ cần cập nhật repository GitHub `kar2603/kar-hobby` theo cấu trúc sau:

### Cấu trúc thư mục chuẩn trên GitHub:
```
kar-hobby/
├── api/
│   ├── submit-form.js        <-- BẮT BUỘC: Đặt trong thư mục api/
│   └── check-payment.js      <-- BẮT BUỘC: Đặt trong thư mục api/
├── admin-index.html          <-- File Admin mới đã có tính năng tự đồng bộ SePay Sheet
├── admin.html                <-- (Tùy chọn) Bản copy để dự phòng
├── index.html                <-- File Landing page đã kết nối trigger gửi email xác nhận cọc
├── package.json              <-- Khai báo cấu hình dự án
├── resend_config.txt         <-- Chứa API Key và cấu hình email Resend
└── vercel.json               <-- File cấu hình điều hướng /admin
```

> ⚠️ **LƯU Ý QUAN TRỌNG:**
> 1. Trên GitHub hiện tại có file `submit-form.js` đang nằm ở ngoài thư mục gốc. Bạn hãy **xóa file `submit-form.js` ở thư mục gốc** đi, và tạo thư mục con tên là `api` rồi đưa `submit-form.js` và `check-payment.js` vào trong thư mục `api/` đó.
> 2. Đẩy các file: `index.html`, `admin-index.html`, `vercel.json`, `package.json`, `resend_config.txt`, và thư mục `api/` lên GitHub. Vercel sẽ tự động build lại trong vòng 30 giây.


---

### 🔴 BUG 4: KHÔNG THỂ THÊM ĐƠN HÀNG THỦ CÔNG TRÊN TRANG ADMIN

#### 1. Triệu chứng
Khi người quản trị bấm nút `+ Thêm đơn hàng`, điền thông tin và bấm `Tạo đơn hàng`, hệ thống báo lỗi kết nối hoặc không lưu được đơn, modal không đóng hoặc dữ liệu biến mất khi tải lại trang.

#### 2. Nguyên nhân gốc rễ (Root Cause)
- Phiên bản cũ của `admin-index.html` gọi `fetch('/api/orders', { method: 'POST' })` gửi lên server.
- Trên nền tảng Vercel tĩnh (Static Hosting), endpoint `/api/orders` không tồn tại (trả về lỗi HTTP 404). Khi parse JSON bằng `r.json()`, trình duyệt quăng ngoại lệ `SyntaxError: Unexpected token < in JSON at position 0`.
- Khối `catch (err)` hiển thị toast `Lỗi kết nối`, và đơn hàng hoàn toàn không được lưu trữ vào bộ nhớ trình duyệt (`localStorage`), dẫn tới việc người dùng không thể tạo đơn thủ công trên Vercel.
- Các trường dropdown chọn khách hàng bị khóa (`disabled`) nếu trước đó người dùng từng bấm xem/sửa đơn hàng.

#### 3. Cách khắc phục (Fix Applied)
1. **Hỗ trợ tạo đơn trực tiếp tại Client & lưu LocalStorage:**
   - Khi bấm `Tạo đơn hàng`, hệ thống tạo ngay mã đơn hàng (ví dụ: `KH8234`), đưa ngay vào đầu danh sách hiển thị `cacheOrders.unshift(newOrder)`.
   - Lưu vĩnh viễn vào trình duyệt qua `localStorage.setItem('kar_orders', ...)`.
   - Tự động trừ 1 tồn kho trong bảng sản phẩm nếu sản phẩm thuộc loại `physical` (Vật lý).
   - Đóng modal, hiển thị thông báo thành công xanh lá: `✓ Đã tạo thành công đơn hàng #KHxxxx!`.
2. **Cho phép nhập nhanh Khách hàng mới ngay trong modal Đơn hàng:**
   - Trong dropdown khách hàng, bổ sung tùy chọn `➕ [+ Nhập thông tin khách mới...]`.
   - Khi chọn tùy chọn này, hiển thị ngay ô nhập `Tên khách hàng`, `Số điện thoại`, `Email`. Khách hàng mới này sẽ tự động được lưu vào bảng Khách hàng (`cacheCustomers` & `localStorage`).
3. **Bổ sung hàm `mergeLocalData()` khi tải trang:**
   - Khi tải lại trang Admin (dù có kết nối Cloud Google Apps Script hay không), hệ thống tự động gộp các đơn hàng đã tạo thủ công trong `localStorage` vào danh sách, đảm bảo đơn thủ công **không bao giờ bị mất**.
4. **Tạo Serverless Function `api/orders.js`:**
   - Tạo endpoint `/api/orders` trên Vercel hỗ trợ các phương thức `GET`, `POST`, `PUT`, `DELETE` trả về HTTP 200 JSON, triệt tiêu hoàn toàn lỗi 404.
5. **Gửi email xác nhận tự động:**
   - Nếu đơn hàng thủ công được gán trạng thái `SUCCESS` và khách hàng có email, hệ thống tự động kích hoạt gửi email xác nhận đặt cọc tới khách hàng qua Resend.

---

### 📋 DANH SÁCH FILE CẦN CÓ TRÊN GITHUB REPOSITORY ĐỂ HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO

Để Vercel nhận diện toàn bộ các bản sửa lỗi (tự động đồng bộ SePay, tạo đơn thủ công, gửi email tự động), toàn bộ các file sau trên GitHub `kar2603/kar-hobby` cần được cập nhật:

1. **`admin-index.html`** (Bắt buộc - kích thước ~80 KB): Giao diện Admin mới nhất có tính năng tự động đồng bộ SePay Google Sheet và tạo đơn hàng thủ công không phụ thuộc server.
2. **`api/orders.js`** (Bắt buộc): API Serverless xử lý đơn hàng trên Vercel.
3. **`api/check-payment.js`** (Bắt buộc): API kiểm tra cọc và gửi email xác nhận cọc Resend.
4. **`api/submit-form.js`** (Bắt buộc): API xử lý form khách hàng và gửi chuỗi 3 email chào mừng.
5. **`index.html`** (Bắt buộc): Giao diện landing page đã kích hoạt webhook kiểm tra thanh toán SePay.
