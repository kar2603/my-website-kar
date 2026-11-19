/**
 * Vercel Serverless Function: /api/check-payment
 * Kiểm tra thanh toán SePay & Tự động gửi Email Xác nhận Đặt cọc thành công qua Resend
 */

const fs = require('fs');
const path = require('path');

let RESEND_API_KEY = process.env.RESEND_API_KEY || "";
let SENDER_EMAIL = "KAR HOBBY <contact@karhobby.io.vn>";
let ADMIN_EMAIL = "lenguyendangkha260304@gmail.com";
const SEPAY_CSV_URL = "https://docs.google.com/spreadsheets/d/1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4/export?format=csv";

try {
  const cfgPath = path.join(process.cwd(), 'resend_config.txt');
  if (fs.existsSync(cfgPath)) {
    const lines = fs.readFileSync(cfgPath, 'utf-8').split('\n');
    for (const line of lines) {
      if (line.includes('=')) {
        const [k, v] = line.split('=');
        if (k.trim() === 'RESEND_API_KEY') RESEND_API_KEY = v.trim();
        if (k.trim() === 'SENDER_EMAIL') SENDER_EMAIL = v.trim();
        if (k.trim() === 'ADMIN_EMAIL') ADMIN_EMAIL = v.trim();
      }
    }
  }
} catch (e) {}

function getDepositEmailTemplate(name, orderCode, amount, phone, productName) {
  const customerName = name || 'anh em';
  const code = orderCode || 'KH0000';
  const formattedAmount = (amount ? Number(amount).toLocaleString('vi-VN') : '2.000') + ' đ';
  const product = productName || 'Custom Diecast 1:64';

  const subject = `[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #${code}`;
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #22c55e; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // XÁC NHẬN ĐẶT CỌC</h2>
          <span style="font-size: 12px; color: #71717a; font-family: monospace;">PHIẾU TIẾP NHẬN BÀN THỢ — ĐƠN HÀNG #${code}</span>
      </div>

      <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào ${customerName},</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Xưởng Kar Hobby xác nhận đã nhận được khoản thanh toán cọc <strong style="color: #22c55e;">${formattedAmount}</strong> cho đơn hàng <strong style="color: #ef4444;">#${code}</strong> qua hệ thống VietQR SePay tự động.
      </p>

      <!-- THÔNG TIN ĐẶT CỌC -->
      <div style="background: #18181b; padding: 18px; border-radius: 12px; border: 1px solid #27272a; margin: 20px 0;">
          <p style="margin: 0 0 10px; font-size: 13px; color: #71717a; text-transform: uppercase; font-family: monospace;">CHI TIẾT ĐƠN HÀNG #${code}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                  <td style="padding: 6px 0; color: #a1a1aa; width: 140px;">Sản phẩm / Dịch vụ:</td>
                  <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${product}</td>
              </tr>
              <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Số tiền cọc đã nhận:</td>
                  <td style="padding: 6px 0; color: #22c55e; font-weight: bold; font-size: 16px;">${formattedAmount}</td>
              </tr>
              <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Trạng thái đơn:</td>
                  <td style="padding: 6px 0;"><span style="color: #22c55e; font-weight: bold;">✓ ĐÃ ĐẶT CỌC THÀNH CÔNG (SUCCESS)</span></td>
              </tr>
              <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Người đặt:</td>
                  <td style="padding: 6px 0; color: #ffffff;">${customerName} ${phone ? '(' + phone + ')' : ''}</td>
              </tr>
          </table>
      </div>

      <!-- TIẾN ĐỘ TỪ BÀN THỢ -->
      <div style="background: #18181b; padding: 18px; border-radius: 12px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <h4 style="margin: 0 0 10px; color: #ef4444; font-size: 14px; text-transform: uppercase;">TIẾN ĐỘ THỰC HIỆN TỪ GÓC BÀN THỢ:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #d4d4d8;">
              <li><strong style="color: #ffffff;">Lên lịch gia công:</strong> Xưởng đã khóa lịch bàn thợ và chuẩn bị phôi xe / vật liệu theo đúng yêu cầu của bạn.</li>
              <li><strong style="color: #ffffff;">Cập nhật ảnh &amp; clip qua Zalo:</strong> Trong suốt quá trình tẩy sơn, lên màu và căn góc camber, thợ xưởng sẽ chụp ảnh và quay clip tiến độ gửi trực tiếp qua Zalo để bạn theo dõi tác phẩm ra lò từng ngày.</li>
              <li><strong style="color: #ffffff;">Đóng gói 3 lớp chống sốc:</strong> Sản phẩm hoàn thiện được bọc màng PE chống xước, cố định mút đệm và đóng hộp xốp bảo vệ tuyệt đối.</li>
              <li><strong style="color: #ffffff;">Đồng kiểm khi nhận hàng:</strong> Khách kiểm tra đúng màu, đúng chi tiết ưng ý mới thanh toán phần còn lại. Đền bù đổi mới 100% nếu có lỗi vận chuyển.</li>
          </ul>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Nếu bạn có bất kỳ thay đổi nào về ý tưởng phối màu, số tem xe hay chi tiết độ, cứ nhắn tin trực tiếp qua Zalo <strong style="color: #ffffff;">0906 349 768</strong> để thợ xưởng điều chỉnh kịp thời nhé!
      </p>

      <p style="font-size: 15px; color: #ffffff; font-weight: bold; margin-top: 24px;">Cảm ơn bạn đã tin tưởng xưởng Kar Hobby!</p>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          <strong style="color: #ffffff;">Lê Nguyễn Đăng Khoa &amp; Đội ngũ Kar Hobby</strong><br>
          <em>Thế Giới Mô Hình Chuyên Nghiệp — Độ xe &amp; kit theo ý bạn</em><br>
          Website: <a href="https://karhobby.io.vn" style="color: #ef4444; text-decoration: none;">karhobby.io.vn</a> • Hotline/Zalo: <strong style="color: #ffffff;">0906 349 768</strong>
      </div>
  </div>
  `;
  return { subject, html };
}

async function sendResendMail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: SENDER_EMAIL,
      to: [to],
      subject,
      html
    })
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = req.query || {};
    const body = req.body || {};

    const code = (query.code || body.order_code || body.code || '').trim();
    const name = (query.name || body.name || body.customer_name || 'Quý khách').trim();
    const email = (query.email || body.email || '').trim();
    const phone = (query.phone || body.phone || '').trim();
    const service = body.service || body.product_name || 'Custom Diecast 1:64';
    let amount = parseFloat(query.amount || body.amount || 2000);

    let isPaid = false;
    let matchedDesc = '';

    // Kiểm tra trực tiếp từ Google Sheet SePay nếu có mã code
    if (code) {
      try {
        const sheetRes = await fetch(SEPAY_CSV_URL + '&t=' + Date.now(), {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (sheetRes.ok) {
          const csvText = await sheetRes.text();
          if (csvText && csvText.toLowerCase().includes(code.toLowerCase())) {
            isPaid = true;
            matchedDesc = `Tìm thấy giao dịch chứa mã #${code} trên SePay Sheet.`;
          }
        }
      } catch (errSheet) {
        console.warn('Lỗi đọc SePay Sheet từ serverless:', errSheet);
      }
    }

    // CHỈ xác nhận thanh toán khi thực sự tìm thấy mã đơn hàng trên Google Sheet SePay
    // Không tự động gán isPaid = true nếu chưa có giao dịch thực tế

    let emailSent = false;
    if (isPaid && email) {
      const tpl = getDepositEmailTemplate(name, code, amount, phone, service);
      await sendResendMail(email, tpl.subject, tpl.html);
      emailSent = true;
      console.log(`[Deposit Confirmed] Email sent to ${email} for order #${code}`);

      // Gửi thông báo cho Admin
      const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #3f3f46; background: #18181b; color: #ffffff; border-radius: 12px;">
          <h3 style="color: #22c55e; margin-top: 0;">💰 ĐÃ NHẬN TIỀN CỌC TỰ ĐỘNG QUA SEPAY!</h3>
          <p><strong>Mã đơn:</strong> #${code}</p>
          <p><strong>Số tiền:</strong> <span style="color: #22c55e; font-size: 16px; font-weight: bold;">${Number(amount).toLocaleString('vi-VN')} đ</span></p>
          <p><strong>Khách hàng:</strong> ${name}</p>
          <p><strong>Số điện thoại:</strong> ${phone || 'Không có'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Thời gian:</strong> ${nowStr}</p>
          <p><strong>Ghi chú:</strong> Hệ thống đã tự động gửi email xác nhận đặt cọc thành công cho khách hàng.</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;">
          <a href="https://www.karhobby.io.vn/admin" style="display: inline-block; padding: 8px 16px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px;">XEM TRANG QUẢN TRỊ CRM →</a>
      </div>
      `;
      await sendResendMail(ADMIN_EMAIL, `💰 [ĐÃ NHẬN CỌC #${code}] ${name} - ${Number(amount).toLocaleString('vi-VN')}đ`, adminHtml);
    }

    return res.status(200).json({
      success: true,
      paid: isPaid,
      order_code: code,
      amount,
      email_sent: emailSent,
      message: isPaid ? 'Đã xác nhận thanh toán cọc thành công!' : 'Chưa tìm thấy giao dịch cho mã này.'
    });

  } catch (error) {
    console.error('Check payment error:', error);
    return res.status(500).json({ error: error.message });
  }
};
