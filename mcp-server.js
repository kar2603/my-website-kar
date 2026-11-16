/**
 * MCP Server Module for KAR HOBBY Workshop & CRM
 * Giao thức Model Context Protocol (SSE Transport) kết nối trực tiếp với GoClaw AI Agent
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');
const https = require('https');

// Lưu trữ các active SSE transports theo sessionId
const activeTransports = {};

/**
 * Khởi tạo MCP Server và đăng ký các endpoint vào Express app
 */
function setupMcpServer(app, { dbAll, dbGet, dbRun, sendResendEmail }) {

  /**
   * Tạo instance MCP Server với 3 tool cốt lõi
   */
  function createServerInstance() {
    const server = new McpServer({
      name: 'karhobby-mcp',
      version: '1.0.0'
    });

    // -------------------------------------------------------------
    // TOOL 1: get_daily_summary
    // -------------------------------------------------------------
    server.tool(
      'get_daily_summary',
      'Báo cáo nhanh tình hình xưởng: số khách mới điền form, số đơn cọc thành công, tổng tiền cọc thu được và các đơn hàng cần làm trong ngày.',
      {
        date: z.string().optional().describe('Ngày cần xem theo định dạng YYYY-MM-DD hoặc "today", "yesterday". Mặc định là today.')
      },
      async ({ date }) => {
        try {
          const now = new Date();
          const toVNISO = (d) => {
            const offset = 7 * 60;
            const local = new Date(d.getTime() + offset * 60 * 1000);
            return local.toISOString().slice(0, 10);
          };

          let targetDate = (date || '').trim();
          if (!targetDate || targetDate.toLowerCase() === 'today') {
            targetDate = toVNISO(now);
          } else if (targetDate.toLowerCase() === 'yesterday') {
            const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            targetDate = toVNISO(y);
          }

          // 1. Số lead mới điền form trong ngày
          const leadsRow = await dbGet(
            "SELECT COUNT(*) as count FROM customers WHERE registered_at LIKE ?",
            [`${targetDate}%`]
          );
          const newLeadsCount = leadsRow ? leadsRow.count : 0;

          // 2. Các đơn hàng trong ngày
          const orders = await dbAll(`
            SELECT o.*, c.name as customer_name, c.phone as customer_phone, p.name as product_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN products p ON o.product_id = p.id
            WHERE o.order_date LIKE ?
            ORDER BY o.id DESC
          `, [`${targetDate}%`]);

          const paidOrders = orders.filter(o => o.status === 'success');
          const pendingOrders = orders.filter(o => o.status === 'pending');
          const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

          let recentPaid = paidOrders.map(o => ({
            code: o.order_code,
            customer: o.customer_name || 'Khách hàng',
            amount: o.amount,
            service: o.product_name || 'Độ xe 1:64'
          }));

          // Nếu trong ngày chưa có đơn cọc, lấy 3 đơn cọc gần nhất để cung cấp ngữ cảnh hữu ích
          let latestOrdersNote = '';
          if (recentPaid.length === 0) {
            const recentOverall = await dbAll(`
              SELECT o.order_code, o.amount, o.order_date, c.name as customer_name, p.name as product_name
              FROM orders o
              LEFT JOIN customers c ON o.customer_id = c.id
              LEFT JOIN products p ON o.product_id = p.id
              WHERE o.status = 'success'
              ORDER BY o.id DESC LIMIT 3
            `);
            if (recentOverall.length > 0) {
              latestOrdersNote = ` (Gần nhất trước đó: ${recentOverall.map(r => `#${r.order_code} của ${r.customer_name}`).join(', ')})`;
            }
          }

          const responseData = {
            date: targetDate,
            new_leads_count: newLeadsCount,
            paid_deposits_count: paidOrders.length,
            total_revenue_today: totalRevenue,
            pending_orders_count: pendingOrders.length,
            recent_paid_orders: recentPaid,
            message: `Báo cáo xưởng ngày ${targetDate}: Có ${newLeadsCount} khách mới điền form, ${paidOrders.length} đơn đã cọc thành công (thu về ${totalRevenue.toLocaleString('vi-VN')}đ). Đang có ${pendingOrders.length} đơn chờ xử lý.${latestOrdersNote}`
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }]
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
            isError: true
          };
        }
      }
    );

    // -------------------------------------------------------------
    // TOOL 2: lookup_order_info
    // -------------------------------------------------------------
    server.tool(
      'lookup_order_info',
      'Tra cứu siêu tốc thông tin đơn hàng, số điện thoại, tên khách hàng, dịch vụ yêu cầu, số tiền cọc và ghi chú kỹ thuật.',
      {
        query: z.string().describe('Từ khóa tra cứu: Mã đơn hàng (ví dụ KH5621), Số điện thoại khách (ví dụ 0905138105), hoặc Tên khách hàng.')
      },
      async ({ query }) => {
        try {
          const q = String(query || '').trim();
          if (!q) {
            return {
              content: [{ type: 'text', text: 'Vui lòng cung cấp mã đơn (KHxxxx), số điện thoại hoặc tên khách hàng cần tìm.' }]
            };
          }

          const qLike = `%${q}%`;
          const rows = await dbAll(`
            SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
                   p.name as product_name, p.type as product_type
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN products p ON o.product_id = p.id
            WHERE UPPER(o.order_code) = UPPER(?)
               OR UPPER(o.order_code) LIKE UPPER(?)
               OR c.phone = ?
               OR c.phone LIKE ?
               OR UPPER(c.name) LIKE UPPER(?)
            ORDER BY o.id DESC LIMIT 5
          `, [q, qLike, q, qLike, qLike]);

          if (!rows || rows.length === 0) {
            // Tra cứu thêm bảng customers nếu chưa có đơn
            const custs = await dbAll(`
              SELECT * FROM customers
              WHERE phone = ? OR phone LIKE ? OR UPPER(name) LIKE UPPER(?)
              ORDER BY id DESC LIMIT 3
            `, [q, qLike, qLike]);

            if (custs && custs.length > 0) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    found: true,
                    type: 'lead_only',
                    customers: custs.map(c => ({
                      name: c.name,
                      phone: c.phone,
                      email: c.email,
                      registered_at: c.registered_at
                    })),
                    message: `Tìm thấy thông tin khách hàng "${custs[0].name}" (${custs[0].phone}) trong danh sách Lead nhưng chưa có đơn hàng liên kết.`
                  }, null, 2)
                }]
              };
            }

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  found: false,
                  query: q,
                  message: `Không tìm thấy thông tin đơn hàng hay khách hàng nào khớp với từ khóa "${q}".`
                }, null, 2)
              }]
            };
          }

          const results = rows.map(r => ({
            order_code: r.order_code,
            customer_name: r.customer_name || 'Chưa cập nhật',
            customer_phone: r.customer_phone || 'Chưa cập nhật',
            customer_email: r.customer_email || 'Chưa cập nhật',
            service_name: r.product_name || 'Độ xe Diecast 1:64',
            deposit_amount: r.amount,
            status: r.status,
            order_date: r.order_date,
            email_sent: !!r.customer_email
          }));

          const primary = results[0];
          const friendlyMessage = `Đã tìm thấy đơn #${primary.order_code}:
- Khách hàng: ${primary.customer_name} (SĐT: ${primary.customer_phone})
- Dịch vụ: ${primary.service_name}
- Tiền cọc: ${Number(primary.deposit_amount).toLocaleString('vi-VN')}đ
- Trạng thái: ${primary.status === 'success' ? 'ĐÃ CỌC THÀNH CÔNG' : 'Đang chờ cọc'}
- Ngày đặt: ${primary.order_date}`;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                found: true,
                count: results.length,
                orders: results,
                summary: friendlyMessage
              }, null, 2)
            }]
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
            isError: true
          };
        }
      }
    );

    // -------------------------------------------------------------
    // TOOL 3: sync_sepay_deposits
    // -------------------------------------------------------------
    server.tool(
      'sync_sepay_deposits',
      'Đối soát và đồng bộ giao dịch ngân hàng VietinBank (qua SePay Google Sheet). Tự động cập nhật đơn hàng thành công và gửi email xác nhận cọc qua Resend.',
      {
        order_code: z.string().optional().describe('Mã đơn hàng cụ thể cần kiểm tra gấp (ví dụ KH3208). Nếu để trống sẽ đối soát toàn bộ các giao dịch mới nhất.')
      },
      async ({ order_code }) => {
        try {
          const sheetUrl = process.env.SEPAY_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv";

          const data = await new Promise((resolve, reject) => {
            https.get(sheetUrl, (resp) => {
              let raw = '';
              resp.on('data', chunk => raw += chunk);
              resp.on('end', () => resolve(raw));
            }).on('error', reject);
          });

          const lines = data.split('\n').filter(l => l.trim().length > 0);
          const targetCode = order_code ? String(order_code).trim().toUpperCase() : null;

          let newlyUpdated = 0;
          const matchedList = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const m = line.match(/(?:SEVQR\s*)?(KH\d{4,})/i);
            if (!m) continue;
            const code = m[1].toUpperCase();

            // Nếu user chỉ định kiểm tra 1 mã đơn cụ thể
            if (targetCode && code !== targetCode) {
              continue;
            }

            const existing = await dbGet(`
              SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
              FROM orders o
              LEFT JOIN customers c ON o.customer_id = c.id
              WHERE o.order_code = ?
            `, [code]);

            if (existing) {
              if (existing.status !== 'success') {
                await dbRun("UPDATE orders SET status = 'success' WHERE id = ?", [existing.id]);
                newlyUpdated++;

                // Kích hoạt gửi email qua Resend nếu có email
                let emailSent = false;
                if (existing.customer_email && process.env.RESEND_API_KEY) {
                  const subject = `[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #${code}`;
                  const html = `<div style="font-family: Arial; padding: 20px; background: #09090b; color: #22c55e;">
                    <h2>XÁC NHẬN ĐẶT CỌC THÀNH CÔNG #${code}</h2>
                    <p style="color: #fff;">Chào ${existing.customer_name || 'Khách hàng'}, xưởng Kar Hobby đã nhận được số tiền cọc 2.000đ.</p>
                    <p style="color: #aaa;">Đơn hàng của bạn đã được chuyển sang trạng thái chuẩn bị chế tác!</p>
                  </div>`;
                  sendResendEmail(existing.customer_email, subject, html).catch(() => {});
                  emailSent = true;
                }

                matchedList.push({
                  code: code,
                  customer: existing.customer_name || 'Khách hàng',
                  amount: existing.amount || 2000,
                  action: 'Khớp thành công & đã kích hoạt cọc',
                  email_notification: emailSent ? 'Đã gửi email Resend' : 'Không có email'
                });
              } else {
                matchedList.push({
                  code: code,
                  customer: existing.customer_name || 'Khách hàng',
                  amount: existing.amount || 2000,
                  action: 'Đơn này đã được xác nhận cọc thành công từ trước'
                });
              }
            } else {
              // Giao dịch chuyển khoản chưa có trong bảng orders -> tự động tạo
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
              newlyUpdated++;
              matchedList.push({
                code: code,
                customer: `Khách SePay (${code})`,
                amount: 2000,
                action: 'Tạo đơn mới tự động từ sao kê & chuyển sang success'
              });
            }
          }

          let message = '';
          if (newlyUpdated > 0) {
            message = `Đã đối soát xong! Khớp thành công ${newlyUpdated} giao dịch cọc mới từ VietinBank (${matchedList.map(m => `#${m.code}`).join(', ')}). Trạng thái đơn đã được cập nhật sang SUCCESS.`;
          } else if (matchedList.length > 0) {
            message = `Đã kiểm tra sao kê SePay: Các đơn (${matchedList.map(m => `#${m.code}`).join(', ')}) đều đã ở trạng thái cọc thành công từ trước. Không có giao dịch mới phát sinh.`;
          } else {
            message = targetCode
              ? `Chưa tìm thấy giao dịch chuyển khoản nào có nội dung "${targetCode}" trên sao kê SePay.`
              : 'Đã quét toàn bộ sao kê SePay: Không có đơn cọc mới nào cần xử lý.';
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                newly_updated_count: newlyUpdated,
                matched_orders: matchedList,
                message: message
              }, null, 2)
            }]
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
            isError: true
          };
        }
      }
    );

    return server;
  }

  // -------------------------------------------------------------
  // SSE ENDPOINT: /api/mcp/sse
  // GoClaw connects here via EventSource to establish connection
  // -------------------------------------------------------------
  app.get('/api/mcp/sse', async (req, res) => {
    console.log('📡 [MCP] Có kết nối mới từ client MCP (GoClaw Agent)...');

    const serverInstance = createServerInstance();
    // Tạo transport SSE trỏ tin nhắn POST về /api/mcp/messages
    const transport = new SSEServerTransport('/api/mcp/messages', res, {
      enableDnsRebindingProtection: false
    });

    const sessionId = transport.sessionId;
    activeTransports[sessionId] = { transport, server: serverInstance };

    console.log(`✅ [MCP] Thiết lập session SSE thành công: ${sessionId}`);

    res.on('close', () => {
      console.log(`🔌 [MCP] Session SSE đóng: ${sessionId}`);
      delete activeTransports[sessionId];
    });

    await serverInstance.connect(transport);
  });

  // -------------------------------------------------------------
  // MESSAGES ENDPOINT: /api/mcp/messages
  // GoClaw gửi JSON-RPC messages (initialize, list_tools, call_tool) qua POST
  // -------------------------------------------------------------
  app.post('/api/mcp/messages', async (req, res) => {
    const sessionId = req.query.sessionId;
    const session = activeTransports[sessionId];

    if (!session) {
      console.warn(`⚠️ [MCP] Không tìm thấy session: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Chuyển req.body đã được parse bởi express.json() vào handler
    await session.transport.handlePostMessage(req, res, req.body);
  });

  console.log('🛠️  [MCP] Endpoints đã sẵn sàng tại /api/mcp/sse & /api/mcp/messages');
}

// -------------------------------------------------------------
// STANDALONE SERVER RUNNER (Port 3001)
// Cho phép chạy độc lập như 1 systemd service riêng (mcp-server.service)
// -------------------------------------------------------------
if (require.main === module) {
  require('dotenv').config();
  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  const sqlite3 = require('sqlite3').verbose();

  const standaloneApp = express();
  const PORT = process.env.MCP_PORT || 3001;
  const DB_PATH = path.join(__dirname, process.env.DATABASE_PATH || 'brain.db');

  standaloneApp.use(cors());
  standaloneApp.use(express.json());
  standaloneApp.use(express.urlencoded({ extended: true }));

  // Database connection
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ [MCP-Standalone] Lỗi kết nối SQLite:', err.message);
    } else {
      console.log(`✅ [MCP-Standalone] Đã kết nối cơ sở dữ liệu SQLite: ${DB_PATH}`);
      db.run("PRAGMA journal_mode = WAL;");
      db.run("PRAGMA busy_timeout = 30000;");
    }
  });

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

  // Resend email helper
  async function sendResendEmail(to, subject, html, scheduledAt = null) {
    if (!process.env.RESEND_API_KEY) return null;
    try {
      const payload = {
        from: process.env.RESEND_FROM_EMAIL || 'KAR HOBBY <contact@karhobby.io.vn>',
        to: [to],
        subject: subject,
        html: html
      };
      if (scheduledAt) payload.scheduled_at = scheduledAt;
      const data = JSON.stringify(payload);
      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.resend.com',
          port: 443,
          path: '/emails',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch (_) { resolve(body); }
          });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
    } catch (e) {
      console.error('Error sending email:', e.message);
      return null;
    }
  }

  // Health check endpoint for /mcp, /api/mcp and /health
  standaloneApp.get(['/mcp', '/api/mcp', '/health'], (req, res) => {
    res.json({
      status: 'ok',
      server: 'karhobby-mcp',
      transport: 'sse',
      port: Number(PORT),
      endpoints: {
        sse: '/mcp/sse',
        messages: '/mcp/messages'
      },
      tools: ['get_daily_summary', 'lookup_order_info', 'sync_sepay_deposits']
    });
  });

  // Also mount /mcp/sse and /mcp/messages in addition to /api/mcp/...
  standaloneApp.get('/mcp/sse', (req, res, next) => {
    req.url = '/api/mcp/sse';
    standaloneApp.handle(req, res, next);
  });
  standaloneApp.post('/mcp/messages', (req, res, next) => {
    req.url = '/api/mcp/messages';
    standaloneApp.handle(req, res, next);
  });

  setupMcpServer(standaloneApp, { dbAll, dbGet, dbRun, sendResendEmail });

  standaloneApp.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 KAR HOBBY Standalone MCP Server is running!`);
    console.log(`📡 URL: http://127.0.0.1:${PORT}`);
    console.log(`🔍 Health Check: http://127.0.0.1:${PORT}/mcp`);
    console.log(`⚙️  SSE Endpoint: http://127.0.0.1:${PORT}/mcp/sse`);
    console.log(`💾 Database: ${DB_PATH}`);
    console.log(`=================================================`);
  });
}

module.exports = { setupMcpServer };
