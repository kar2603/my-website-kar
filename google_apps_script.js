/**
 * =========================================================================
 * KAR HOBBY - GOOGLE APPS SCRIPT BACKEND API (SERVERLESS 24/7)
 * Dành cho hệ thống CRM & Cổng thanh toán SePay tự động
 * Website: https://www.karhobby.io.vn/
 * Admin:   https://www.karhobby.io.vn/admin
 * =========================================================================
 */

// CẤU HÌNH ID BẢNG TÍNH GOOGLE SHEET
const SEPAY_SHEET_ID = "1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4"; // Sheet biến động SePay
const FORM_SHEET_ID  = "1eFQw9EEkfeYWHRmAA9ohyVXYciWQ8G5La15FRiWc0JM"; // Sheet câu trả lời Google Form

// DỮ LIỆU ĐỒNG BỘ GỐC TỪ CRM (17 Khách hàng & 17 Đơn hàng)
const INITIAL_CUSTOMERS = [
  {
    "id": 8,
    "name": "A",
    "phone": "0971986215",
    "zalo": "0971986215",
    "registered_at": "05/11/2026 17:23:05"
  },
  {
    "id": 9,
    "name": "B",
    "phone": "0976548425",
    "zalo": "0976548425",
    "registered_at": "05/11/2026 17:43:40"
  },
  {
    "id": 10,
    "name": "Thanh Hà",
    "phone": "0933126122",
    "zalo": "0933126122",
    "registered_at": "06/11/2026 9:56:25"
  },
  {
    "id": 11,
    "name": "Nguyễn Đăng Kha Lê",
    "phone": "0906349768",
    "zalo": "0906349768",
    "registered_at": "08/11/2026 18:21:09"
  },
  {
    "id": 12,
    "name": "Ân",
    "phone": "0934565333",
    "zalo": "0934565333",
    "registered_at": "08/11/2026 18:22:21"
  },
  {
    "id": 13,
    "name": "bi",
    "phone": "0988989098",
    "zalo": "0988989098",
    "registered_at": "10/11/2026 15:53:47"
  },
  {
    "id": 14,
    "name": "Quang",
    "phone": "0998877444",
    "zalo": "0998877444",
    "registered_at": "11/11/2026 12:17:37"
  },
  {
    "id": 15,
    "name": "Nguyễn Đăng Kha Lê",
    "phone": "0767897654",
    "zalo": "0767897654",
    "registered_at": "12/11/2026 16:13:13"
  },
  {
    "id": 16,
    "name": "Lê Nguyễn Đăng Kha",
    "phone": "0905138105",
    "zalo": "0905138105",
    "registered_at": "12/11/2026 17:05:08"
  },
  {
    "id": 17,
    "name": "Test Bot",
    "phone": "0900000000",
    "zalo": "0900000000",
    "registered_at": "12/11/2026 17:13:04"
  },
  {
    "id": 18,
    "name": "Mỹ",
    "phone": "0909675456",
    "zalo": "0909675456",
    "registered_at": "12/11/2026 17:35:25"
  },
  {
    "id": 19,
    "name": "test 99",
    "phone": "09615164631",
    "zalo": "09615164631",
    "registered_at": "12/11/2026 17:45:24"
  },
  {
    "id": 20,
    "name": "teo",
    "phone": "0976456789",
    "zalo": "0976456789",
    "registered_at": "12/11/2026 20:50:51"
  },
  {
    "id": 21,
    "name": "minh tuấn",
    "phone": "0845192139",
    "zalo": "0845192139",
    "registered_at": "12/11/2026 20:57:13"
  },
  {
    "id": 22,
    "name": "tèo",
    "phone": "0987678945",
    "zalo": "0987678945",
    "registered_at": "12/11/2026 21:12:22"
  },
  {
    "id": 23,
    "name": "Thuỷ",
    "phone": "0978675434",
    "zalo": "0978675434",
    "registered_at": "12/11/2026 21:54:39"
  },
  {
    "id": 24,
    "name": "ly",
    "phone": "0987656789",
    "zalo": "0987656789",
    "registered_at": "12/11/2026 22:24:36"
  }
];
const INITIAL_ORDERS = [
  {
    "id": 2,
    "customer_id": 8,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "05/11/2026 17:23:05",
    "order_code": "KH5423",
    "customer_name": "A",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 3,
    "customer_id": 9,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "05/11/2026 17:43:40",
    "order_code": "KH3187",
    "customer_name": "B",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 4,
    "customer_id": 10,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "06/11/2026 9:56:25",
    "order_code": "KH8610",
    "customer_name": "Thanh Hà",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 5,
    "customer_id": 11,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "08/11/2026 18:21:09",
    "order_code": "KH3754",
    "customer_name": "Nguyễn Đăng Kha Lê",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 6,
    "customer_id": 12,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "08/11/2026 18:22:21",
    "order_code": "KH7754",
    "customer_name": "Ân",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 7,
    "customer_id": 13,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "10/11/2026 15:53:47",
    "order_code": "KH3634",
    "customer_name": "bi",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 8,
    "customer_id": 14,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "11/11/2026 12:17:37",
    "order_code": "KH8771",
    "customer_name": "Quang",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 9,
    "customer_id": 15,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 16:13:13",
    "order_code": "KH5855",
    "customer_name": "Nguyễn Đăng Kha Lê",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 10,
    "customer_id": 16,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 17:05:08",
    "order_code": "KH2131",
    "customer_name": "Lê Nguyễn Đăng Kha",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 11,
    "customer_id": 17,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 17:13:04",
    "order_code": "KH3310",
    "customer_name": "Test Bot",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 12,
    "customer_id": 18,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 17:35:25",
    "order_code": "KH6724",
    "customer_name": "Mỹ",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 13,
    "customer_id": 19,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 17:45:24",
    "order_code": "KH4005",
    "customer_name": "test 99",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 14,
    "customer_id": 20,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 20:50:51",
    "order_code": "KH2157",
    "customer_name": "teo",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 15,
    "customer_id": 21,
    "product_id": 1,
    "amount": 2000.0,
    "status": "success",
    "order_date": "12/11/2026 20:57:13",
    "order_code": "KH3957",
    "customer_name": "minh tuấn",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 16,
    "customer_id": 22,
    "product_id": 1,
    "amount": 2000.0,
    "status": "success",
    "order_date": "12/11/2026 21:12:22",
    "order_code": "KH9067",
    "customer_name": "tèo",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 17,
    "customer_id": 23,
    "product_id": 1,
    "amount": 2000.0,
    "status": "success",
    "order_date": "12/11/2026 21:54:39",
    "order_code": "KH2101",
    "customer_name": "Thuỷ",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  },
  {
    "id": 18,
    "customer_id": 24,
    "product_id": 1,
    "amount": 2000.0,
    "status": "pending",
    "order_date": "12/11/2026 22:24:36",
    "order_code": "KH2695",
    "customer_name": "ly",
    "product_name": "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)",
    "product_type": "service"
  }
];

/**
 * XỬ LÝ YÊU CẦU GET TỪ WEBSITE & ADMIN PANEL
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'getData';

  try {
    // 1. KIỂM TRA TRẠNG THÁI THANH TOÁN (Dành cho Popup Website khi khách quét QR)
    if (action === 'checkPayment') {
      const code = (params.code || '').trim().toUpperCase();
      const result = checkSepayPayment(code);
      return jsonResponse(result);
    }

    // 2. LẤY TOÀN BỘ DỮ LIỆU CRM (Sản phẩm, Khách hàng, Đơn hàng, Biến động SePay)
    if (action === 'getData') {
      const data = getAllCrmData();
      return jsonResponse(data);
    }

    // 3. LẤY DANH SÁCH SẢN PHẨM
    if (action === 'getProducts') {
      return jsonResponse({ success: true, products: getProductsList() });
    }

    return jsonResponse({ error: 'Action không hợp lệ' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * XỬ LÝ YÊU CẦU POST TỪ WEBSITE & ADMIN PANEL (Hoặc Webhook từ SePay)
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || (e && e.parameter ? e.parameter.action : '');

    // 1. Nhận đơn hàng mới từ Website (Khi khách điền form)
    if (action === 'submitLead' || action === 'createOrder') {
      const res = recordNewLead(body);
      return jsonResponse(res);
    }

    // 2. Thêm/Sửa sản phẩm
    if (action === 'saveProduct') {
      const res = saveProduct(body);
      return jsonResponse(res);
    }

    // 3. Webhook trực tiếp từ SePay (Nếu cấu hình Webhook trong my.sepay.vn)
    if (body.gateway || body.transferType || body.content) {
      const res = handleSepayWebhook(body);
      return jsonResponse(res);
    }

    return jsonResponse({ success: true, message: 'Đã nhận dữ liệu' });
  } catch (err) {
    return jsonResponse({ error: err.toString() }, 500);
  }
}

/**
 * HÀM HELPER TRẢ VỀ JSON CHUẨN CORS CHO TRÌNH DUYỆT
 */
function jsonResponse(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * LẤY TOÀN BỘ DỮ LIỆU ĐỂ HIỂN THỊ LÊN TRANG ADMIN
 */
function getAllCrmData() {
  const sepayTx = getSepayTransactions();
  const customersAndOrders = getCustomersAndOrdersFromForm(sepayTx);
  const products = getProductsList();

  return {
    success: true,
    products: products,
    customers: (customersAndOrders.customers && customersAndOrders.customers.length > 0) ? customersAndOrders.customers : INITIAL_CUSTOMERS,
    orders: (customersAndOrders.orders && customersAndOrders.orders.length > 0) ? customersAndOrders.orders : INITIAL_ORDERS,
    sepayTransactions: sepayTx,
    updatedAt: new Date().toISOString()
  };
}

/**
 * ĐỌC BIẾN ĐỘNG SỐ DƯ TỪ GOOGLE SHEET SEPAY
 */
function getSepayTransactions() {
  const list = [];
  try {
    const ss = SpreadsheetApp.openById(SEPAY_SHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return list;

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    let colDesc = -1, colAmount = -1, colDate = -1, colBank = -1, colAcc = -1;

    for (let i = 0; i < headers.length; i++) {
      if (headers[i].includes('nội dung')) colDesc = i;
      else if (headers[i].includes('số tiền')) colAmount = i;
      else if (headers[i].includes('ngày')) colDate = i;
      else if (headers[i].includes('ngân hàng')) colBank = i;
      else if (headers[i].includes('số tài khoản')) colAcc = i;
    }

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[0]) continue;
      const desc = colDesc !== -1 ? String(row[colDesc]) : '';
      const amount = colAmount !== -1 ? Number(row[colAmount]) || 0 : 0;
      const date = colDate !== -1 ? String(row[colDate]) : '';

      list.push({
        bank: colBank !== -1 ? String(row[colBank]) : 'VietinBank',
        account: colAcc !== -1 ? String(row[colAcc]) : '105879570545',
        date: date,
        description: desc,
        amount: amount
      });
    }
  } catch (e) {
    Logger.log('Lỗi đọc Sheet SePay: ' + e);
  }
  return list;
}

/**
 * ĐỌC KHÁCH HÀNG & ĐƠN HÀNG TỪ SHEET CÂU TRẢ LỜI FORM
 * TỰ ĐỘNG KHỚP TRẠNG THÁI VỚI SEPAY (SUCCESS nếu đã chuyển khoản)
 */
function getCustomersAndOrdersFromForm(sepayTx) {
  const customers = [];
  const orders = [];
  const phoneMap = {};

  try {
    const ss = SpreadsheetApp.openById(FORM_SHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { customers, orders };

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    let colTime = -1, colName = -1, colPhone = -1, colService = -1, colNote = -1;

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (h.includes('thời gian') || h.includes('timestamp')) colTime = i;
      else if (h.includes('họ tên') || h.includes('tên')) colName = i;
      else if (h.includes('điện thoại') || h.includes('phone') || h.includes('sđt') || h.includes('zalo')) colPhone = i;
      else if (h.includes('dịch vụ') || h.includes('sản phẩm') || h.includes('bạn cần')) colService = i;
      else if (h.includes('mô tả') || h.includes('ghi chú')) colNote = i;
    }

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[colName]) continue;

      const timeVal = colTime !== -1 ? String(row[colTime]) : '';
      const name = colName !== -1 ? String(row[colName]).trim() : 'Khách hàng';
      const phone = colPhone !== -1 ? String(row[colPhone]).trim() : '';
      const service = colService !== -1 ? String(row[colService]).trim() : 'Dịch vụ chế tác';
      const note = colNote !== -1 ? String(row[colNote]).trim() : '';

      // Mã đơn hàng KHxxxx
      const codeHash = Math.abs(hashCode(phone + timeVal)).toString().slice(0, 4);
      const orderCode = 'KH' + codeHash.padStart(4, '0');

      // Khách hàng (loại trùng số điện thoại)
      if (!phoneMap[phone]) {
        const custId = customers.length + 1;
        phoneMap[phone] = custId;
        customers.push({
          id: custId,
          name: name,
          phone: phone,
          zalo: phone,
          registered_at: timeVal || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss')
        });
      }

      const custId = phoneMap[phone];

      // Kiểm tra xem đơn hàng này đã thanh toán cọc trong SePay chưa
      let isPaid = false;
      let paidAmount = 2000;
      if (sepayTx && sepayTx.length > 0) {
        for (let t = 0; t < sepayTx.length; t++) {
          const desc = sepayTx[t].description.toUpperCase();
          if (desc.includes(orderCode) || (phone && desc.includes(phone))) {
            isPaid = true;
            paidAmount = sepayTx[t].amount || 2000;
            break;
          }
        }
      }

      orders.push({
        id: orders.length + 1,
        order_code: orderCode,
        customer_id: custId,
        customer_name: name,
        product_name: service,
        amount: paidAmount,
        status: isPaid ? 'success' : 'pending',
        order_date: timeVal || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss'),
        note: note
      });
    }
  } catch (e) {
    Logger.log('Lỗi đọc Sheet Form: ' + e);
  }

  return { customers, orders };
}

/**
 * KIỂM TRA MÃ ĐƠN TRONG SHEET SEPAY (Realtime)
 */
function checkSepayPayment(orderCode) {
  if (!orderCode) return { paid: false };
  const tx = getSepayTransactions();
  for (let i = 0; i < tx.length; i++) {
    const desc = (tx[i].description || '').toUpperCase();
    if (desc.includes(orderCode)) {
      return {
        paid: true,
        status: 'success',
        order_code: orderCode,
        amount: tx[i].amount,
        bank: tx[i].bank,
        date: tx[i].date
      };
    }
  }
  return { paid: false, order_code: orderCode };
}

/**
 * DANH SÁCH SẢN PHẨM MẶC ĐỊNH CỦA XƯỞNG KAR HOBBY
 */
function getProductsList() {
  // Có thể lưu và đọc từ một sheet tên "SanPham" nếu muốn tự do thêm sửa xóa
  return [
    { id: 1, name: "Độ xe Diecast 1:64 Cơ bản (Stance & Wheels Swap)", type: "service", price: 180000, stock_quantity: 0, description: "Hạ gầm stance fitment, thay mâm độ cao su real riders" },
    { id: 2, name: "Độ xe Diecast 1:64 Chuyên sâu (Full Paint & Camber)", type: "service", price: 380000, stock_quantity: 0, description: "Tẩy sơn cũ, sơn đổi màu Candy/Chameleon, hạ gầm camber góc nghiêng" },
    { id: 3, name: "Ráp & Weathering Gunpla HG/RG 1/144", type: "service", price: 390000, stock_quantity: 0, description: "Gọt ghẻ tỉ mỉ, kẻ lằn panel line, sơn chi tiết kim loại, tạo hiệu ứng rỉ sét" },
    { id: 4, name: "Ráp & Sơn Phủ Cao Cấp Gunpla MG 1/100", type: "service", price: 850000, stock_quantity: 0, description: "Lắp ráp toàn bộ khung xương & giáp, sơn airbrush chi tiết, dán decal nước và phủ topcoat" },
    { id: 5, name: "Mini Diorama Đỗ Xe JDM 1:64 (Có Đèn LED USB)", type: "physical", price: 290000, stock_quantity: 12, description: "Sa bàn mini góc phố Nhật Bản thu nhỏ, có hệ thống đèn LED cắm cổng USB" },
    { id: 6, name: "Hộp Trưng Bày Chống Bụi Có Đèn LED 1:64", type: "physical", price: 120000, stock_quantity: 25, description: "Hộp mica acrylic trong suốt cao cấp tích hợp thanh LED chiếu sáng" },
    { id: 7, name: "File 3D STL Mâm Xe Độ Custom 1:64 (Bộ 10 Mẫu)", type: "digital", price: 99000, stock_quantity: 0, description: "Gói tải về 10 file 3D định dạng STL chuẩn để tự in nhựa 3D resin" }
  ];
}

/**
 * HÀM TẠO MÃ HASH ĐƠN GIẢN TỪ CHUỖI
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
