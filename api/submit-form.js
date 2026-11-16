/**
 * Vercel Serverless Function: /api/submit-form
 * Tự động kích hoạt Chuỗi 3 Email (3-Email Sequence) qua Resend:
 * (1) Email 1: Chào mừng (Welcome) - Gửi ngay lập tức
 * (2) Email 2: Nuôi dưỡng (Nurture - Bí quyết sơn lót) - 2 ngày sau
 * (3) Email 3: Chốt đơn (Sales Closing - Gói dịch vụ & link thanh toán) - 1 ngày sau Email 2 (3 ngày sau đăng ký)
 * 
 * Chế độ TEST: Nếu email có chứa "+test" -> Gửi cả 3 email ngay lập tức!
 */

const fs = require('fs');
const path = require('path');

// Ưu tiên đọc biến môi trường hệ thống (Vercel Environment Variables)
let RESEND_API_KEY = process.env.RESEND_API_KEY || '';
let SENDER_EMAIL = process.env.RESEND_SENDER || process.env.SENDER_EMAIL || 'KAR HOBBY <contact@karhobby.io.vn>';
let ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lenguyendangkha260304@gmail.com';

// Fallback: Đọc từ file .env hoặc resend_config.txt nếu chưa cấu hình trên môi trường
if (!RESEND_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const cfgPath = path.join(process.cwd(), 'resend_config.txt');
    const targetFile = fs.existsSync(envPath) ? envPath : (fs.existsSync(cfgPath) ? cfgPath : null);
    if (targetFile) {
      const lines = fs.readFileSync(targetFile, 'utf-8').split('
');
      for (const line of lines) {
        if (line.includes('=') && !line.trim().startsWith('#')) {
          const [k, v] = line.split('=');
          const key = k.trim();
          const val = v.trim();
          if (key === 'RESEND_API_KEY') RESEND_API_KEY = val;
          if (key === 'RESEND_SENDER' || key === 'SENDER_EMAIL') SENDER_EMAIL = val;
          if (key === 'ADMIN_EMAIL') ADMIN_EMAIL = val;
        }
      }
    }
  } catch (e) {}
}

function getEmailTemplates(customerName, orderCode) {
  const name = customerName || 'anh em';
  const codeText = orderCode ? ` (Mã yêu cầu: #${orderCode})` : '';

  // EMAIL 1: CHÀO MỪNG
  const subject1 = "[Kar Hobby] Xác nhận thông tin & lời chào từ góc bàn thợ 1:64";
  const html1 = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // GÓC BÀN THỢ 1:64</h2>
          <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 01 // WELCOME &amp; INTRO</span>
      </div>

      <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào ${name},</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Xưởng mình đã nhận được thông tin bạn gửi qua website${codeText}. Cảm ơn bạn đã dành thời gian ghé chơi với Kar Hobby!
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Xưởng mình là một góc nhỏ của những anh em mê tiếng động cơ thu nhỏ tỉ lệ 1:64 và ghiền cảm giác "lên đồ" phong trần cho Gunpla. Ở đây, tụi mình không bán đồ chơi công nghiệp sản xuất hàng loạt. Tụi mình ngồi tỉ mẩn cùng nhau để biến từng chiếc phôi xe nguyên bản, từng vệt rỉ sét trên giáp chiến thành những tác phẩm mang đúng cái tôi của người sở hữu.
      </p>

      <div style="background: #18181b; padding: 16px; border-radius: 10px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e4e4e7; font-style: italic;">
              "Thật ra, để tạo ra một bản độ ưng ý, điều quan trọng nhất không phải đồ nghề đắt tiền, mà là cảm xúc và sự hiểu nhau giữa người chơi với người thợ."
          </p>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Trong 1-2 ngày tới, mình sẽ gửi cho bạn một vài bí quyết nhỏ từ góc xưởng — những kinh nghiệm "xương máu" về kỹ thuật sơn và xử lý phôi mà bình thường thợ ít khi chia sẻ. Đảm bảo đọc xong, bạn ngắm bất kỳ con xe hay kit mô hình nào cũng sẽ thấy một góc nhìn hoàn toàn khác.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Nếu đang có sẵn một ý tưởng độ xe hay ráp kit nào trong đầu, cứ nhắn trực tiếp qua Zalo cho xưởng mình nhé.
      </p>

      <p style="font-size: 15px; color: #ffffff; font-weight: bold; margin-top: 24px;">Hẹn gặp lại bạn ở email sau!</p>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          <strong style="color: #ffffff;">Lê Nguyễn Đăng Khoa &amp; Đội ngũ Kar Hobby</strong><br>
          <em>Thế Giới Mô Hình Chuyên Nghiệp — Độ xe &amp; kit theo ý bạn</em><br>
          Website: <a href="https://karhobby.io.vn" style="color: #ef4444; text-decoration: none;">karhobby.io.vn</a> • Zalo/Hotline: <strong style="color: #ffffff;">0906 349 768</strong>
      </div>
  </div>
  `;

  // EMAIL 2: NUÔI DƯỠNG (KỸ THUẬT SƠN)
  const subject2 = "Sai lầm khiến 90% anh em tự sơn xe 1:64 bị dày cộm mất gân cửa";
  const html2 = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // CHIA SẺ KỸ THUẬT</h2>
          <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 02 // WORKSHOP INSIGHT</span>
      </div>

      <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào ${name},</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Hôm nay ngồi xả phôi một chiếc Mini GT cho khách, mình chợt nhớ lại lỗi sai kinh điển mà hầu như anh em nào mới tập tự custom cũng từng dính phải ít nhất một lần.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #ef4444; font-weight: bold;">
          Đó là: Sơn lót quá dày làm bít sạch đường gân cửa.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Cầm một chiếc xe kim loại đã tẩy sạch sơn zin, ai cũng nôn nóng muốn xịt thật kín màu lót xám. Anh em đè ngón tay vào vòi xịt, giữ yên một chỗ... và thế là xong. Sơn chảy thành vệt, đọng cục ở hốc đèn và nắp ca-pô. Chiếc xe mất hết những đường nét dập nổi tinh xảo của hãng, nhìn cục mịch và nặng nề.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Thật ra, bí quyết của nước sơn "mỏng như lụa, lì như thép" lại nằm ở một nguyên tắc rất ngược đời: <strong style="color: #ffffff;">Càng ít lại càng đẹp.</strong>
      </p>

      <div style="background: #18181b; padding: 18px; border-radius: 12px; border: 1px solid #27272a; margin: 20px 0;">
          <h4 style="margin: 0 0 10px; color: #38bdf8; font-size: 15px; text-transform: uppercase;">QUY TẮC 2 LỚP MỎNG CÁCH NHAU 15 PHÚT:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #e4e4e7;">
              <li><strong style="color: #ffffff;">Lớp 1 (Lớp phủ sương):</strong> Cầm chai sơn cách phôi 15-20cm, lia tay thật nhanh và dứt khoát. Chỉ xịt phớt qua một lớp bụi sơn mỏng manh, nhìn qua vẫn còn ánh kim loại của phôi. Tuyệt đối không cố che kín màu ở lần xịt này.</li>
              <li><strong style="color: #ffffff;">Nghỉ 15 phút:</strong> Đợi dung môi bay hơi hoàn toàn để bề mặt se khô tự nhiên.</li>
              <li><strong style="color: #ffffff;">Lớp 2 (Lớp phủ đều):</strong> Xịt lướt dứt khoát lần hai để phủ kín màu xám primer. Lúc này hạt sơn bám vào lớp nền cũ cực kỳ mịn màng, rãnh cửa sâu hoắm và sắc lẹm như dao cạo.</li>
          </ol>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Đơn giản thôi. Nhưng kiên nhẫn hơn 15 phút là bạn đã cứu được cả một tác phẩm.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Dù sao thì, dù tự tay vọc vạch ở nhà hay gửi xưởng làm, hiểu đúng về kỹ thuật luôn cho mình một cảm giác rất thú vị khi ngắm nhìn mô hình.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Email sau mình sẽ bật mí cách xưởng kết hợp nước sơn này với góc sa bàn garage có đèn LED để tạo ra một không gian trưng bày cực chill trên bàn làm việc nhé.
      </p>

      <p style="font-size: 15px; color: #ffffff; font-weight: bold; margin-top: 24px;">Chúc bạn một ngày nhiều cảm hứng!</p>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          <strong style="color: #ffffff;">Kar Hobby Workshop</strong><br>
          <em>Đam mê trên từng chi tiết nhỏ</em><br>
          Website: <a href="https://karhobby.io.vn" style="color: #3b82f6; text-decoration: none;">karhobby.io.vn</a>
      </div>
  </div>
  `;

  // EMAIL 3: CHỐT ĐƠN & LINK THANH TOÁN
  const subject3 = "Chiếc xe trong mơ của anh em khi thu nhỏ 64 lần sẽ trông thế nào?";
  const html3 = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #22c55e; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // GIẢI PHÁP TRỌN GÓI</h2>
          <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 03 // SPECIAL OFFER</span>
      </div>

      <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào ${name},</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Một ngày làm việc dài và nhiều áp lực. Về đến nhà, ngồi vào bàn và bật công tắc đèn vàng của góc sa bàn garage tí hon lên.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Ngắm chiếc xe 1:64 hạ gầm sát đất, dàn chân camber bánh béo, màu sơn chuyển sắc dưới ánh đèn... Cảm giác đó, đàn ông tụi mình ai cũng hiểu: nó kéo lại sự cân bằng sau cả ngày mệt mỏi.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
          Thật ra, bàn làm việc luôn cần một thứ gì đó bụi bặm một chút, nghệ thuật một tí để nhắc mình về đam mê. Nếu bạn chưa có thời gian hay đồ nghề chuyên dụng để tự làm, cứ để Kar Hobby hiện thực hóa cỗ máy trong mơ đó cho bạn:
      </p>

      <!-- PACKAGES -->
      <div style="margin: 20px 0;">
          <div style="background: #18181b; padding: 16px; border-radius: 10px; border-left: 4px solid #ef4444; margin-bottom: 12px;">
              <p style="margin: 0 0 6px; font-size: 15px; font-weight: bold; color: #ffffff;">🔥 Gói Độ Xe Diecast 1:64 Chuyên Sâu (Full Paint &amp; Camber): <span style="color: #ef4444;">380.000đ</span></p>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">Tẩy sơn zin sạch bóng, 2 lớp lót chống tróc, lên màu Chameleon/Candy 2K bóng gương, căn góc camber bánh béo và lên tem đấu thể thao theo yêu cầu.</p>
          </div>

          <div style="background: #18181b; padding: 16px; border-radius: 10px; border-left: 4px solid #3b82f6; margin-bottom: 12px;">
              <p style="margin: 0 0 6px; font-size: 15px; font-weight: bold; color: #ffffff;">🔥 Sa Bàn Diorama Garage 1:64 Kèm Đèn LED USB &amp; Hộp Mica: <span style="color: #3b82f6;">450.000đ</span></p>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">Sàn bê tông xước chân thật, kệ phụ tùng cơ khí, lốp xe độ, hệ thống đèn LED 5V cắm cổng USB máy tính và hộp mica bảo vệ chống bụi hoàn hảo.</p>
          </div>

          <div style="background: #18181b; padding: 16px; border-radius: 10px; border-left: 4px solid #eab308; margin-bottom: 12px;">
              <p style="margin: 0 0 6px; font-size: 15px; font-weight: bold; color: #ffffff;">🔥 Gói Trọn Gói Xe Độ Độc Bản Mini GT 1-of-1: <span style="color: #eab308;">890.000đ</span></p>
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">Bao trọn phôi xe Mini GT chính hãng, custom mâm + sơn độc bản kèm biển số cá nhân hóa mang tên riêng của bạn.</p>
          </div>
      </div>

      <!-- COMMITMENT -->
      <div style="background: #18181b; padding: 16px; border-radius: 10px; margin: 20px 0; border: 1px solid #27272a;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #22c55e; font-weight: bold; text-transform: uppercase;">CAM KẾT TỪ THỢ XƯỞNG KAR HOBBY:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #d4d4d8; line-height: 1.6;">
              <li><strong>Độc bản 100%:</strong> Không sản xuất hàng loạt, mỗi chiếc làm ra là một cá tính riêng.</li>
              <li><strong>Nghiệm thu minh bạch:</strong> Quay video, chụp ảnh cận cảnh từng góc qua Zalo trước khi giao.</li>
              <li><strong>An toàn tuyệt đối:</strong> Đóng hộp xốp 3 lớp chống sốc, bảo hành đền bù 100% nếu gãy vỡ.</li>
              <li><strong>Thanh toán tự động 3 giây:</strong> Quét mã QR nhận đơn tự động, không cần chụp bill thủ công.</li>
          </ul>
      </div>

      <!-- CTA BUTTON -->
      <div style="text-align: center; margin: 30px 0 20px;">
          <a href="https://karhobby.io.vn" target="_blank" style="display: inline-block; padding: 16px 32px; background: #ef4444; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 12px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);">
              👉 BẤM VÀO ĐÂY ĐỂ ĐẶT LỊCH &amp; THANH TOÁN QR →
          </a>
          <p style="margin: 8px 0 0; font-size: 12px; color: #71717a;">Thử xem chiếc xe trong mơ của bạn khi thu nhỏ 64 lần sẽ chiến thế nào nhé!</p>
      </div>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          <strong style="color: #ffffff;">Xưởng Chế Tác Mô Hình Độc Bản KAR HOBBY</strong><br>
          Hotline/Zalo hỗ trợ trực tiếp 1-1: <strong style="color: #ffffff;">0906 349 768</strong><br>
          Website: <a href="https://karhobby.io.vn" style="color: #ef4444; text-decoration: none;">karhobby.io.vn</a>
      </div>
  </div>
  `;

  return {
    email1: { subject: subject1, html: html1 },
    email2: { subject: subject2, html: html2 },
    email3: { subject: subject3, html: html3 }
  };
}

async function sendResendMail(to, subject, html, scheduledAt = null) {
  const payload = {
    from: SENDER_EMAIL,
    to: [to],
    subject,
    html
  };
  if (scheduledAt) {
    payload.scheduled_at = scheduledAt;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const name = (body.name || 'Khách hàng').trim();
    const phone = (body.phone || '').trim();
    const email = (body.email || '').trim();
    const service = body.service || 'custom diecast 1:64';
    const note = body.note || '';
    const order_code = body.order_code || ('KH' + Math.floor(1000 + Math.random() * 9000));
    const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (email) {
      const isTest = email.toLowerCase().includes('+test');
      const templates = getEmailTemplates(name, order_code);

      // (1) Email 1: Chào mừng - Gửi ngay lập tức
      await sendResendMail(email, templates.email1.subject, templates.email1.html);

      // (2) Email 2: Nuôi dưỡng (2 ngày sau, hoặc ngay lập tức nếu là test)
      const sched2 = isTest ? null : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      await sendResendMail(email, templates.email2.subject, templates.email2.html, sched2);

      // (3) Email 3: Chốt đơn kèm link thanh toán (3 ngày sau, hoặc ngay lập tức nếu là test)
      const sched3 = isTest ? null : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      await sendResendMail(email, templates.email3.subject, templates.email3.html, sched3);

      console.log(`[Sequence Queued] Email: ${email} | Test Mode: ${isTest}`);
    }

    // Gửi email thông báo cho Admin (bác Kha)
    const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #3f3f46; background: #18181b; color: #ffffff; border-radius: 12px;">
        <h3 style="color: #22c55e; margin-top: 0;">🔔 KHÁCH HÀNG MỚI ĐIỀN FORM TRÊN WEB!</h3>
        <p><strong>Khách hàng:</strong> ${name}</p>
        <p><strong>Số điện thoại:</strong> <a href="tel:${phone}" style="color: #38bdf8;">${phone}</a></p>
        <p><strong>Email:</strong> ${email || 'Chưa điền'}</p>
        <p><strong>Dịch vụ:</strong> ${service}</p>
        <p><strong>Ghi chú:</strong> ${note || 'Không'}</p>
        <p><strong>Mã đơn:</strong> #${order_code}</p>
        <p><strong>Chuỗi email:</strong> Đã kích hoạt 3-Email Sequence qua Resend</p>
        <p><strong>Thời gian:</strong> ${nowStr}</p>
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;">
        <a href="https://www.karhobby.io.vn/admin" style="display: inline-block; padding: 8px 16px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px;">MỞ CRM ADMIN QUẢN TRỊ →</a>
    </div>
    `;

    await sendResendMail(ADMIN_EMAIL, `🔔 [Khách mới #${order_code}] ${name} - ${phone}`, adminHtml);

    return res.status(200).json({
      success: true,
      order_code,
      message: 'Đã tiếp nhận thông tin và kích hoạt chuỗi 3 email Resend thành công'
    });

  } catch (error) {
    console.error('Sequence error:', error);
    return res.status(500).json({ error: error.message });
  }
};
