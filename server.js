/**
 * Express Production Server - KAR HOBBY & CRM System
 * Tự động wrap giao diện tĩnh, kết nối SQLite brain.db, hỗ trợ /admin và các API Endpoints
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, process.env.DATABASE_PATH || 'brain.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. KẾT NỐI DATABASE SQLITE
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối database SQLite:', err.message);
  } else {
    console.log(`✅ Đã kết nối cơ sở dữ liệu SQLite: ${DB_PATH}`);
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA busy_timeout = 30000;");
    initDbSchema();
  }
});

// Helper Promise wrappers cho SQLite
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
  });
});

// Khởi tạo bảng nếu chưa có
async function initDbSchema() {
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'service',
      price REAL NOT NULL,
      description TEXT,
      stock_quantity INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      zalo TEXT,
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      email TEXT
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      product_id INTEGER,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      order_code TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`);
  } catch (err) {
    console.warn('Cảnh báo khởi tạo schema:', err.message);
  }
}

// 2. HỖ TRỢ GỬI EMAIL RESEND
async function sendResendEmail(to, subject, html, scheduledAt = null) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_SENDER || 'KAR HOBBY <contact@karhobby.io.vn>';
  if (!apiKey || !to) return null;

  const payload = {
    from: sender,
    to: [to],
    subject: subject,
    html: html
  };
  if (scheduledAt) payload.scheduled_at = scheduledAt;

  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ raw: body }); }
      });
    });
    req.on('error', (e) => {
      console.error('Lỗi gửi email Resend:', e.message);
      resolve(null);
    });
    req.write(data);
    req.end();
  });
}

// 3. API ENDPOINTS

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Express', port: PORT, timestamp: new Date().toISOString() });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, type, price, description, stock_quantity } = req.body;
    const result = await dbRun(
      "INSERT INTO products (name, type, price, description, stock_quantity) VALUES (?, ?, ?, ?, ?)",
      [name, type || 'service', price || 0, description || '', stock_quantity || 0]
    );
    res.json({ success: true, id: result.id, message: 'Đã thêm sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, type, price, description, stock_quantity } = req.body;
    await dbRun(
      "UPDATE products SET name = ?, type = ?, price = ?, description = ?, stock_quantity = ? WHERE id = ?",
      [name, type, price, description, stock_quantity, req.params.id]
    );
    res.json({ success: true, message: 'Đã cập nhật sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await dbRun("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM customers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, zalo, email } = req.body;
    const result = await dbRun(
      "INSERT INTO customers (name, phone, zalo, email) VALUES (?, ?, ?, ?)",
      [name, phone, zalo || phone, email || '']
    );
    res.json({ success: true, id: result.id, message: 'Đã thêm khách hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, zalo, email } = req.body;
    await dbRun(
      "UPDATE customers SET name = ?, phone = ?, zalo = ?, email = ? WHERE id = ?",
      [name, phone, zalo || phone, email, req.params.id]
    );
    res.json({ success: true, message: 'Đã cập nhật khách hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await dbRun("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa khách hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const sql = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             p.name as product_name, p.type as product_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.id DESC
    `;
    const rows = await dbAll(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_id, product_id, amount, status, order_code } = req.body;
    const code = order_code || ('KH' + Math.floor(1000 + Math.random() * 9000));
    const orderDate = new Date().toLocaleString('vi-VN');

    // Trừ kho nếu là sản phẩm vật lý
    const prod = await dbGet("SELECT * FROM products WHERE id = ?", [product_id]);
    if (prod && prod.type === 'physical' && prod.stock_quantity > 0) {
      await dbRun("UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = ?", [product_id]);
    }

    const result = await dbRun(
      "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, ?, ?, ?, ?, ?)",
      [customer_id, product_id, amount || 0, status || 'pending', orderDate, code]
    );

    res.json({
      success: true,
      id: result.id,
      order_code: code,
      message: `Đã tạo đơn hàng #${code} thành công!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { amount, status } = req.body;
    await dbRun(
      "UPDATE orders SET amount = ?, status = ? WHERE id = ?",
      [amount, status, req.params.id]
    );
    res.json({ success: true, message: 'Đã cập nhật đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await dbRun("DELETE FROM orders WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Form (Waitlist / Lead Capture) API
app.post('/api/submit-form', async (req, res) => {
  try {
    const { name, phone, email, service, note, notes, obstacle } = req.body || {};
    const customerName = (name || '').trim();
    const customerPhone = (phone || '').trim();
    const customerEmail = (email || '').trim();
    const orderCode = 'KH' + Math.floor(1000 + Math.random() * 9000);

    // Lưu vào database nếu có thông tin
    if (customerName && customerPhone) {
      let cust = await dbGet("SELECT id FROM customers WHERE phone = ?", [customerPhone]);
      let custId = cust ? cust.id : null;
      if (!custId) {
        const r = await dbRun(
          "INSERT INTO customers (name, phone, email, registered_at) VALUES (?, ?, ?, ?)",
          [customerName, customerPhone, customerEmail, new Date().toLocaleString('vi-VN')]
        );
        custId = r.id;
      }

      await dbRun(
        "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, 2000, 'pending', ?, ?)",
        [custId, new Date().toLocaleString('vi-VN'), orderCode]
      );
    }

    // Gửi chuỗi 3 Email nếu có Email
    if (customerEmail && process.env.RESEND_API_KEY) {
      const isTest = customerEmail.includes('+test');
      const subject1 = `[Kar Hobby] Xác nhận thông tin & lời chào từ góc bàn thợ 1:64 (Mã: #${orderCode})`;
      const html1 = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #fff;">
        <h2>Chào ${customerName},</h2>
        <p>Xưởng Kar Hobby đã tiếp nhận thông tin yêu cầu dịch vụ của bạn (Mã: #${orderCode}).</p>
        <p>Chúng mình sẽ liên hệ lại sớm nhất để tư vấn chi tiết!</p>
      </div>`;

      await sendResendEmail(customerEmail, subject1, html1);

      // Email 2 & Email 3
      const subject2 = `[Kar Hobby] 3 bí quyết hoàn thiện một chiếc xe 1:64 chuẩn xưởng`;
      const html2 = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #fff;">
        <h2>Bí quyết hoàn thiện xe 1:64 chuẩn xưởng</h2>
        <p>Chia sẻ kỹ thuật sơn lót và xử lý bề mặt từ thợ Kar Hobby.</p>
      </div>`;

      const subject3 = `[Kar Hobby] Bảng báo giá chi tiết & Xác nhận cọc dự án #${orderCode}`;
      const html3 = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #fff;">
        <h2>Bảng báo giá dự án #${orderCode}</h2>
        <p>Hoàn tất đặt cọc 2.000đ để xưởng bắt đầu lên bản vẽ tiến độ!</p>
      </div>`;

      if (isTest) {
        await sendResendEmail(customerEmail, subject2, html2);
        await sendResendEmail(customerEmail, subject3, html3);
      } else {
        const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        sendResendEmail(customerEmail, subject2, html2, in2Days).catch(() => {});
        sendResendEmail(customerEmail, subject3, html3, in3Days).catch(() => {});
      }
    }

    res.json({
      success: true,
      order_code: orderCode,
      message: 'Đã tiếp nhận thông tin và kích hoạt chuỗi email Resend thành công'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Kiểm tra giao dịch thực tế có mã đơn hàng trên Google Sheet SePay
function checkSepaySheetForOrder(orderCode) {
  if (!orderCode) return Promise.resolve(false);
  const sheetUrl = process.env.SEPAY_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv";
  return new Promise((resolve) => {
    https.get(sheetUrl + '&t=' + Date.now(), { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        const normalized = data.toLowerCase();
        const codeNorm = orderCode.toLowerCase();
        if (normalized.includes(codeNorm)) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.warn('Lỗi đọc Google Sheet SePay:', err.message);
      resolve(false);
    });
  });
}

// Check Payment / Confirm Deposit API (Chỉ xác nhận thành công khi SePay ĐÃ NHẬN TIỀN THỰC SỰ)
app.all('/api/check-payment', async (req, res) => {
  try {
    const code = ((req.body && (req.body.code || req.body.order_code)) || req.query.code || '').trim().toUpperCase();
    const email = ((req.body && req.body.email) || req.query.email || '').trim();
    const name = ((req.body && req.body.name) || req.query.name || 'Khách hàng').trim();
    const amount = (req.body && req.body.amount) || req.query.amount || 2000;

    if (!code) {
      return res.json({ success: false, paid: false, message: 'Thiếu mã đơn hàng' });
    }

    // 1. Kiểm tra đơn hàng trong SQLite
    let order = await dbGet("SELECT o.*, c.name as customer_name, c.email as customer_email FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.order_code = ?", [code]);

    let isActuallyPaid = false;
    if (order && order.status === 'success') {
      isActuallyPaid = true;
    } else {
      // 2. Nếu đơn chưa có trạng thái success -> Kiểm tra trên SePay Google Sheet
      const foundInSheet = await checkSepaySheetForOrder(code);
      if (foundInSheet) {
        isActuallyPaid = true;
        if (order) {
          await dbRun("UPDATE orders SET status = 'success' WHERE id = ?", [order.id]);
        } else {
          // Thêm mới nếu đơn chưa kịp ghi nhận trong DB
          const cRes = await dbRun(
            "INSERT OR IGNORE INTO customers (name, phone, registered_at) VALUES (?, ?, ?)",
            [`Khách SePay (${code})`, `SP_${code}`, new Date().toLocaleString('vi-VN')]
          );
          const cust = await dbGet("SELECT id FROM customers WHERE phone = ?", [`SP_${code}`]);
          const custId = cust ? cust.id : cRes.id;
          await dbRun(
            "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, ?, 'success', ?, ?)",
            [custId, amount, new Date().toLocaleString('vi-VN'), code]
          );
        }

        // Gửi email xác nhận cọc qua Resend nếu có email và chưa gửi
        const targetEmail = email || (order && order.customer_email);
        const targetName = (name !== 'Khách hàng' ? name : (order && order.customer_name)) || 'Quý khách';
        if (targetEmail && process.env.RESEND_API_KEY) {
          const subject = `[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #${code}`;
          const html = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #22c55e;">
            <h2>XÁC NHẬN ĐẶT CỌC THÀNH CÔNG #${code}</h2>
            <p style="color: #fff;">Chào ${targetName}, xưởng Kar Hobby đã nhận được số tiền cọc ${Number(amount).toLocaleString('vi-VN')}đ qua VietQR SePay.</p>
            <p style="color: #aaa;">Đơn hàng của bạn đã được chuyển sang trạng thái chuẩn bị chế tác!</p>
          </div>`;
          await sendResendEmail(targetEmail, subject, html);
        }
      }
    }

    if (isActuallyPaid) {
      return res.json({
        success: true,
        paid: true,
        order_code: code,
        amount: order ? order.amount : amount,
        message: 'Đã xác nhận thanh toán cọc thành công từ SePay!'
      });
    } else {
      return res.json({
        success: true,
        paid: false,
        order_code: code,
        message: 'Đang chờ khách chuyển khoản qua SePay...'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SePay Webhook Endpoint (Nhận thông báo biến động số dư tức thì từ docs.sepay.vn)
app.post('/api/sepay-webhook', async (req, res) => {
  try {
    const { gateway, transactionDate, accountNumber, content, transferType, transferAmount } = req.body || {};
    console.log(`[SePay Webhook] Nhận giao dịch: ${transferAmount}đ, Nội dung: "${content}", Type: ${transferType}`);

    if (transferType === 'in' || !transferType) {
      const match = (content || '').match(/(?:SEVQR\s*)?(KH\d{4,})/i);
      if (match) {
        const orderCode = match[1].toUpperCase();
        console.log(`[SePay Webhook] Khớp mã đơn hàng: #${orderCode}`);

        const existing = await dbGet("SELECT o.*, c.email as customer_email, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.order_code = ?", [orderCode]);
        if (existing) {
          await dbRun("UPDATE orders SET status = 'success', amount = ? WHERE id = ?", [transferAmount || existing.amount, existing.id]);
          if (existing.customer_email && process.env.RESEND_API_KEY) {
            const subject = `[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #${orderCode}`;
            const html = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #22c55e;">
              <h2>XÁC NHẬN ĐẶT CỌC THÀNH CÔNG #${orderCode}</h2>
              <p style="color: #fff;">Chào ${existing.customer_name || 'Quý khách'}, xưởng Kar Hobby đã nhận được số tiền cọc ${Number(transferAmount || existing.amount).toLocaleString('vi-VN')}đ qua SePay.</p>
            </div>`;
            await sendResendEmail(existing.customer_email, subject, html);
          }
        } else {
          // Thêm mới
          const cRes = await dbRun(
            "INSERT OR IGNORE INTO customers (name, phone, registered_at) VALUES (?, ?, ?)",
            [`Khách SePay (${orderCode})`, `SP_${orderCode}`, new Date().toLocaleString('vi-VN')]
          );
          const cust = await dbGet("SELECT id FROM customers WHERE phone = ?", [`SP_${orderCode}`]);
          const custId = cust ? cust.id : cRes.id;
          await dbRun(
            "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, ?, 'success', ?, ?)",
            [custId, transferAmount || 2000, new Date().toLocaleString('vi-VN'), orderCode]
          );
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi SePay Webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sync SePay Google Sheet API
app.get('/api/sync-sepay', async (req, res) => {
  const sheetUrl = process.env.SEPAY_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv";
  try {
    https.get(sheetUrl, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', async () => {
        try {
          const lines = data.split('\n').filter(l => l.trim().length > 0);
          let updated = 0;
          for (let i = 1; i < lines.length; i++) {
            const m = lines[i].match(/(?:SEVQR\s*)?(KH\d{4,})/i);
            if (!m) continue;
            const code = m[1].toUpperCase();
            const existing = await dbGet("SELECT id, status FROM orders WHERE order_code = ?", [code]);
            if (existing) {
              if (existing.status !== 'success') {
                await dbRun("UPDATE orders SET status = 'success' WHERE id = ?", [existing.id]);
                updated++;
              }
            } else {
              // Thêm khách và đơn mới
              const cRes = await dbRun(
                "INSERT OR IGNORE INTO customers (name, phone, registered_at) VALUES (?, ?, ?)",
                [`Khách SePay (${code})`, `SP_${code}`, new Date().toLocaleString('vi-VN')]
              );
              const cust = await dbGet("SELECT id FROM customers WHERE phone = ?", [`SP_${code}`]);
              const custId = cust ? cust.id : cRes.id;
              await dbRun(
                "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, 2000, 'success', ?, ?)",
                [custId, new Date().toLocaleString('vi-VN'), code]
              );
              updated++;
            }
          }
          res.json({ success: true, updated_orders: updated, total_transactions: lines.length - 1 });
        } catch (parseErr) {
          res.status(500).json({ error: parseErr.message });
        }
      });
    }).on('error', err => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.5. MODEL CONTEXT PROTOCOL (MCP) SERVER CHO AI AGENT (GOCLAW / TELEGRAM)
const { setupMcpServer } = require('./mcp-server');
setupMcpServer(app, { dbAll, dbGet, dbRun, sendResendEmail });

// 4. ĐỊNH TUYẾN GIAO DIỆN (STATIC FILES & ADMIN)
// Phục vụ trang Admin tại /admin hoặc /admin-index
app.get(['/admin', '/admin-index', '/admin/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-index.html'));
});

// Phục vụ file tĩnh (CSS, JS, hình ảnh, assets)
app.use(express.static(__dirname));

// Mặc định mọi route khác về trang chủ index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. KHỞI CHẠY SERVER
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 KAR HOBBY Express Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`💾 Database: ${DB_PATH}`);
  console.log(`=================================================`);
});
