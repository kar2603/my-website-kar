const path = require('path');
const fs = require('fs');
const https = require('https');

const SEPAY_BANK = 'VietinBank';
const SEPAY_ACC = '105879570545';
const SEPAY_HOLDER = 'LE NGUYEN DANG KHA';

const DIGITAL_PRODUCTS = {
  'sop-pack-do-xe-164': {
    id: 8,
    slug: 'sop-pack-do-xe-164',
    name: 'SOP Pack: Bộ Quy Trình Chuẩn 6 Bước Độ Xe Diecast 1:64 & Bảng Cứu Xe Khẩn Cấp',
    tagline: 'Từ phôi xe thô đến bản độ độc bản trên bàn làm việc — Không cần máy nén khí, đồ nghề dưới 150k cho người mới bắt đầu.',
    price: 79000,
    testPrice: 2000,
    originalPrice: 199000,
    deliverables: [
      {
        title: 'Bộ SOP 6 bước chuẩn thợ xưởng',
        desc: 'Quy trình chuẩn hóa từng milimet: Mở tán rivet 3 phút, tẩy sạch sơn zin, xịt lót 2 lớp cách nhau đúng 15 phút, hạ gầm Stance JDM, căn góc camber âm 5 độ và dán decal nước khóa tem bằng Clear Coat.'
      },
      {
        title: 'Checklist đồ nghề dưới 150k',
        desc: 'Danh mục 5 món tối giản (khoan tay mini 2.5/3.0mm, nhíp cong, nhám nước P1000/1500, keo dẻo B-7000) kèm từ khóa tìm mua chuẩn Shopee, không mua đồ dư thừa lãng phí.'
      },
      {
        title: 'Bảng ma trận Cứu xe khẩn cấp (1 trang tra cứu nhanh)',
        desc: 'Thao tác cấp cứu 4 tai nạn kinh điển trong 5 phút theo logic IF-THEN: Lỡ khoan lủng gầm, sơn chảy đọng giọt, rách decal khi dán và bánh kẹt cứng không lăn.'
      },
      {
        title: 'Checklist 12 bước nghiệm thu chuẩn xuất xưởng',
        desc: 'Bản in 1 trang A4 kẹp đầu bàn làm việc kiểm tra từng tiêu chí khắt khe (độ khít gầm, độ lăn bánh, độ sạch kính) trước khi đặt xe lên kệ kính.'
      },
      {
        title: 'Tài liệu số xuất bản chuẩn A4 tải ngay tức thì',
        desc: 'File cẩm nang điện tử định dạng PDF/HTML layout sách tuyệt đẹp, đọc mượt mà trên điện thoại/máy tính hoặc in ra sách giấy kẹp đầu bàn.'
      }
    ],
    targetAudience: [
      'Anh em mới sưu tầm hoặc mê xe Hot Wheels, Tomica, Mini GT muốn tự tay nắn nót bản độ đầu tiên mang cá tính riêng.',
      'Dân văn phòng, người làm việc công nghệ cần một góc bàn chill buổi tối để xả stress, thỏa mãn đam mê cơ khí mà không có phòng sơn hay máy móc cồng kềnh.',
      'Người sợ tự làm hỏng phôi xe bạc triệu hoặc từng thất bại do sơn bị bong tróc, đục kính chắn gió hay gãy trục bánh.'
    ],
    authorBio: {
      name: 'KAR HOBBY Workshop',
      title: 'Xưởng Chế Tác & Độ Xe Mô Hình Độc Bản',
      desc: 'Mọi thông số vòng xoay mũi khoan, thời gian nghỉ dung môi 15 phút, khoảng hở vè 0.5mm đều được đúc kết từ hàng trăm bản độ thực tế xuất xưởng đến tay anh em chơi xe trên toàn quốc. Triết lý của xưởng mình: Họ bán mô hình đúc hàng loạt — KAR HOBBY trao bạn phương pháp tạo ra tác phẩm độc bản mang linh hồn của chính bạn.'
    },
    fileName: 'SOP-Pack-Do-Xe-Diecast-164-KarHobby.html',
    fileRelativePath: 'downloads/sop-pack-do-xe-diecast-164.html'
  }
};

// -------------------------------------------------------------
// TRANG 1: LANDING PAGE
// -------------------------------------------------------------
function renderLandingPage(product) {
  const p = product || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
  const formattedPrice = Number(p.price).toLocaleString('vi-VN');
  const formattedOrigPrice = Number(p.originalPrice).toLocaleString('vi-VN');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.name} — KAR HOBBY</title>
  <meta name="description" content="${p.tagline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,300;0,400;0,600;0,800;0,900;1,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <style>
    :root {
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-heading: 'Chivo', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: var(--font-body);
      background-color: #f2f0eb;
      background-image:
        radial-gradient(#d5d3cb 0.85px, transparent 0.85px),
        linear-gradient(to right, rgba(213, 211, 203, 0.25) 1px, transparent 1px);
      background-size: 24px 24px, 120px 120px;
    }
    h1, h2, h3, .font-heading { font-family: var(--font-heading); }
    .font-mono-tech { font-family: var(--font-mono); }
    .jdm-shadow {
      box-shadow: 0 25px 50px -12px rgba(24, 24, 27, 0.12), 0 0 0 1px rgba(24, 24, 27, 0.05);
    }
  </style>
</head>
<body class="min-h-screen p-3 pb-20 md:p-8 flex justify-center items-start text-zinc-800">

  <div class="w-full max-w-4xl bg-[#faf9f5] rounded-[24px] md:rounded-[32px] border border-[#e5e3db] jdm-shadow overflow-hidden relative">

    <!-- TOP HEADER -->
    <header class="p-6 md:p-8 border-b border-[#e5e3db] flex justify-between items-center bg-[#faf9f5]">
      <a href="/" class="flex items-center gap-2 text-decoration-none">
        <span class="font-heading font-black tracking-tighter text-xl md:text-2xl text-zinc-950">KAR HOBBY</span>
        <span class="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-zinc-900 text-amber-400 font-bold tracking-widest uppercase">WORKSHOP</span>
      </a>
      <div class="flex items-center gap-3">
        <span class="hidden sm:inline-block font-mono-tech text-xs text-zinc-500">DIGITAL GUIDE // INSTANT</span>
        <a href="https://zalo.me" target="_blank" class="text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Zalo Tư Vấn
        </a>
      </div>
    </header>

    <!-- HERO SECTION -->
    <section class="p-6 md:p-12 border-b border-[#e5e3db]">
      <div class="inline-flex items-center gap-2 font-mono-tech text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-6">
        <span>⚡ BẢN QUY TRÌNH KỸ THUẬT THỰC CHIẾN • PHÁT HÀNH 2026</span>
      </div>

      <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 leading-tight tracking-tight mb-4">
        ${p.name}
      </h1>

      <p class="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mb-8">
        ${p.tagline}
      </p>

      <!-- PRICE CARD MOBILE & DESKTOP HIGHLIGHT -->
      <div class="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div class="flex items-baseline gap-3 mb-1">
            <span class="text-3xl sm:text-4xl font-heading font-black text-amber-400">${formattedPrice} đ</span>
            <span class="text-sm sm:text-base text-zinc-400 line-through">${formattedOrigPrice} đ</span>
            <span class="text-xs font-mono-tech bg-red-950/80 text-red-400 border border-red-800/60 px-2 py-0.5 rounded font-bold">-60% MỞ BÁN</span>
          </div>
          <div class="text-xs text-zinc-400 font-mono-tech flex items-center gap-2 mt-2">
            <span class="text-emerald-400 font-bold">✓ Thanh toán VietQR</span>
            <span>•</span>
            <span class="text-emerald-400 font-bold">✓ File giao ngay lập tức</span>
            <span>•</span>
            <span>Tải về vĩnh viễn</span>
          </div>
        </div>

        <a href="/san-pham/${p.slug}/checkout" class="w-full md:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-heading font-black text-base px-8 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-center">
          MUA NGAY ${formattedPrice}đ →
        </a>
      </div>
    </section>

    <!-- KHÁCH NHẬN ĐƯỢC GÌ -->
    <section class="p-6 md:p-12 border-b border-[#e5e3db] bg-white/60">
      <div class="max-w-3xl">
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2 flex items-center gap-2">
          <span>📦</span> BẠN SẼ NHẬN ĐƯỢC GÌ TRONG BỘ TÀI LIỆU NÀY?
        </h2>
        <p class="text-sm text-zinc-500 font-mono-tech mb-8">THÔNG SỐ CHUẨN THỢ • KHÔNG VĂN VẺ LÝ THUYẾT</p>

        <div class="space-y-4">
          ${p.deliverables.map((item, idx) => `
            <div class="p-4 sm:p-5 rounded-xl border border-zinc-200/80 bg-white hover:border-amber-400 transition-all flex items-start gap-4">
              <span class="w-8 h-8 rounded-lg bg-zinc-900 text-amber-400 font-mono-tech font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">0${idx+1}</span>
              <div>
                <h3 class="font-bold text-base text-zinc-900 mb-1">${item.title}</h3>
                <p class="text-sm text-zinc-600 leading-relaxed">${item.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- DÀNH CHO AI -->
    <section class="p-6 md:p-12 border-b border-[#e5e3db]">
      <div class="max-w-3xl">
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-6 flex items-center gap-2">
          <span>🎯</span> BỘ QUY TRÌNH NÀY DÀNH CHO AI?
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${p.targetAudience.map((target, idx) => `
            <div class="p-5 rounded-xl border border-[#e5e3db] bg-[#faf9f5]">
              <span class="text-red-600 text-lg font-black block mb-2">#0${idx+1}</span>
              <p class="text-sm text-zinc-700 leading-relaxed">${target}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- VỀ TÁC GIẢ -->
    <section class="p-6 md:p-12 border-b border-[#e5e3db] bg-zinc-900 text-white">
      <div class="max-w-3xl">
        <div class="font-mono-tech text-xs text-amber-400 font-bold uppercase tracking-widest mb-2">VỀ TÁC GIẢ BIÊN SOẠN</div>
        <h2 class="font-heading text-2xl sm:text-3xl font-black text-white mb-2">${p.authorBio.name}</h2>
        <p class="text-sm text-zinc-400 font-mono-tech mb-6">${p.authorBio.title}</p>
        <p class="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
          ${p.authorBio.desc}
        </p>
        <div class="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-300 font-mono-tech flex items-center gap-2">
          <span>📍</span> Xưởng hoạt động tại Việt Nam • Hotline/Zalo hỗ trợ trực tiếp từ thợ xưởng
        </div>
      </div>
    </section>

    <!-- BOTTOM CTA BOX -->
    <section class="p-6 md:p-12 text-center bg-[#faf9f5]">
      <div class="max-w-xl mx-auto space-y-4">
        <h3 class="font-heading text-2xl font-black text-zinc-950">Sở hữu ngay bộ quy trình thực chiến hôm nay</h3>
        <p class="text-sm text-zinc-600">Thao tác theo đúng cữ thông số, không còn nỗi sợ hỏng phôi xe.</p>
        
        <div class="pt-4">
          <a href="/san-pham/${p.slug}/checkout" class="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-heading font-black text-base px-10 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
            MUA NGAY CHỈ ${formattedPrice}Đ →
          </a>
        </div>
        <p class="text-xs text-zinc-400 font-mono-tech mt-2">
          🔒 Thanh toán VietQR · File giao ngay tự động · Xem trọn đời
        </p>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="p-6 border-t border-[#e5e3db] text-center font-mono-tech text-xs text-zinc-400 bg-white">
      © 2026 KAR HOBBY WORKSHOP • THẾ GIỚI MÔ HÌNH CHUYÊN NGHIỆP
    </footer>

  </div>

</body>
</html>`;
}

// -------------------------------------------------------------
// TRANG 2: CHECKOUT PAGE
// -------------------------------------------------------------
function renderCheckoutPage(product) {
  const p = product || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
  const formattedPrice = Number(p.price).toLocaleString('vi-VN');
  const formattedTestPrice = Number(p.testPrice || 2000).toLocaleString('vi-VN');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt mua: ${p.name} — KAR HOBBY</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,300;0,400;0,600;0,800;0,900;1,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <style>
    :root {
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-heading: 'Chivo', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: var(--font-body);
      background-color: #f2f0eb;
      background-image:
        radial-gradient(#d5d3cb 0.85px, transparent 0.85px),
        linear-gradient(to right, rgba(213, 211, 203, 0.25) 1px, transparent 1px);
      background-size: 24px 24px, 120px 120px;
    }
    h1, h2, h3, .font-heading { font-family: var(--font-heading); }
    .font-mono-tech { font-family: var(--font-mono); }
    .jdm-shadow {
      box-shadow: 0 25px 50px -12px rgba(24, 24, 27, 0.12), 0 0 0 1px rgba(24, 24, 27, 0.05);
    }
    input { font-size: 16px; }
  </style>
</head>
<body class="min-h-screen p-3 pb-20 md:p-8 flex justify-center items-start text-zinc-800">

  <div class="w-full max-w-2xl bg-[#faf9f5] rounded-[24px] md:rounded-[32px] border border-[#e5e3db] jdm-shadow overflow-hidden relative">

    <!-- HEADER -->
    <header class="p-5 md:p-6 border-b border-[#e5e3db] flex justify-between items-center bg-[#faf9f5]">
      <a href="/san-pham/${p.slug}" class="flex items-center gap-2 text-decoration-none">
        <span class="font-heading font-black tracking-tighter text-lg md:text-xl text-zinc-950">KAR HOBBY</span>
        <span class="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-zinc-900 text-amber-400 font-bold uppercase">CHECKOUT</span>
      </a>
      <a href="/san-pham/${p.slug}" class="text-xs text-zinc-500 hover:text-zinc-800 font-mono-tech flex items-center gap-1">
        ← Quay lại
      </a>
    </header>

    <!-- STEP PROGRESS -->
    <div class="bg-zinc-100/70 border-b border-[#e5e3db] px-6 py-3 flex justify-between items-center text-xs font-mono-tech">
      <div class="flex items-center gap-2 text-zinc-900 font-bold">
        <span class="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">1</span>
        <span>Điền thông tin</span>
      </div>
      <div class="w-8 h-[1px] bg-zinc-300"></div>
      <div class="flex items-center gap-2 text-zinc-500 font-medium" id="step2Indicator">
        <span class="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-[10px]">2</span>
        <span>Quét VietQR</span>
      </div>
      <div class="w-8 h-[1px] bg-zinc-300"></div>
      <div class="flex items-center gap-2 text-zinc-400 font-medium">
        <span class="w-5 h-5 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center text-[10px]">3</span>
        <span>Nhận tài liệu</span>
      </div>
    </div>

    <!-- MAIN BODY -->
    <div class="p-6 md:p-8">

      <!-- PRODUCT SUMMARY STRIP -->
      <div class="mb-6 p-4 rounded-xl border border-zinc-200 bg-white flex justify-between items-center">
        <div>
          <span class="text-[10px] font-mono-tech text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">SẢN PHẨM SỐ</span>
          <h2 class="font-heading font-bold text-base text-zinc-900 mt-1">${p.name}</h2>
          <p class="text-xs text-zinc-500 mt-0.5">Tải ngay bản PDF & HTML xuất bản chuẩn A4</p>
        </div>
        <div class="text-right shrink-0 ml-4">
          <div class="font-heading font-black text-xl text-amber-600" id="displayPrice">${formattedPrice} đ</div>
          <span class="text-[10px] text-zinc-400 line-through">${Number(p.originalPrice).toLocaleString('vi-VN')} đ</span>
        </div>
      </div>

      <!-- PRICE SELECTOR (HỖ TRỢ TEST 2.000đ HOẶC GIÁ CHÍNH THỨC) -->
      <div class="mb-6 p-3 bg-zinc-100/60 rounded-xl border border-zinc-200 text-xs">
        <span class="font-bold text-zinc-700 block mb-2 font-mono-tech">CHỌN MỨC THANH TOÁN:</span>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onclick="selectAmount(${p.price})" id="btnPriceOfficial" class="py-2.5 px-3 rounded-lg border-2 border-amber-500 bg-amber-50/50 text-amber-900 font-bold text-xs text-center transition-all">
            Giá chính thức: ${formattedPrice}đ
          </button>
          <button type="button" onclick="selectAmount(${p.testPrice || 2000})" id="btnPriceTest" class="py-2.5 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs text-center transition-all">
            Test giao dịch: ${formattedTestPrice}đ
          </button>
        </div>
      </div>

      <!-- SECTION 1: FORM THÔNG TIN -->
      <div id="checkoutFormSection">
        <form id="orderForm" onsubmit="handleCreateOrder(event)" class="space-y-4">
          <div>
            <label for="customerName" class="block font-heading font-bold text-sm text-zinc-900 mb-1">
              Họ và tên của bạn <span class="text-red-500">*</span>
            </label>
            <input type="text" id="customerName" required placeholder="Ví dụ: Nguyễn Văn A" class="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm">
          </div>

          <div>
            <label for="customerEmail" class="block font-heading font-bold text-sm text-zinc-900 mb-1">
              Email nhận tài liệu <span class="text-red-500">*</span>
            </label>
            <input type="email" id="customerEmail" required placeholder="emailcuaban@gmail.com" class="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm">
            <p class="text-xs text-zinc-500 mt-1 font-mono-tech">
              🔒 Hệ thống sẽ tự động gửi link tải vĩnh viễn qua Resend về email này ngay khi thanh toán.
            </p>
          </div>

          <div>
            <label for="customerPhone" class="block font-heading font-bold text-sm text-zinc-900 mb-1">
              Số điện thoại / Zalo <span class="text-zinc-400 font-normal">(tùy chọn)</span>
            </label>
            <input type="tel" id="customerPhone" placeholder="09xxxxxxxx" class="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm">
            <p class="text-xs text-zinc-400 mt-1 font-mono-tech">Dùng để thợ xưởng hỗ trợ kỹ thuật qua Zalo khi cần.</p>
          </div>

          <div class="pt-2">
            <button type="submit" id="btnSubmit" class="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-heading font-black text-base shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer">
              XÁC NHẬN & TẠO MÃ VIETQR (${formattedPrice}đ) →
            </button>
          </div>

          <div class="text-center font-mono-tech text-xs text-zinc-400 pt-2 flex items-center justify-center gap-3">
            <span>🛡️ Bảo mật VietinBank</span>
            <span>•</span>
            <span>⚡ Xác thực tự động SePay</span>
          </div>
        </form>
      </div>

      <!-- SECTION 2: QR CODE THANH TOÁN (ẨN BAN ĐẦU) -->
      <div id="qrSection" style="display: none;" class="space-y-6">
        
        <div class="p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-800 text-center relative overflow-hidden">
          <div class="inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span id="pollStatusText">ĐANG CHỜ BẠN QUÉT MÃ CHUYỂN KHOẢN (24/7)...</span>
          </div>

          <h3 class="font-heading font-bold text-lg text-white mb-1">Mã VietQR SePay Tự Động</h3>
          <p class="text-xs text-zinc-400 mb-4">Mở app ngân hàng bất kỳ để quét mã, hệ thống sẽ tự động xác nhận trong 3-5 giây</p>

          <!-- KHUNG MÃ QR -->
          <div class="bg-white p-3 rounded-xl inline-block shadow-2xl mx-auto mb-4">
            <img id="qrImage" src="" alt="Mã VietQR Thanh Toán" class="w-56 h-56 object-contain rounded-lg">
          </div>

          <!-- THÔNG TIN CHUYỂN KHOẢN KÈM NÚT COPY -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs font-mono-tech max-w-md mx-auto bg-zinc-800/80 p-3.5 rounded-xl border border-zinc-700">
            <div>
              <span class="text-zinc-400 block text-[10px]">NGÂN HÀNG:</span>
              <strong class="text-white text-sm">${SEPAY_BANK}</strong>
            </div>
            <div>
              <span class="text-zinc-400 block text-[10px]">SỐ TÀI KHOẢN:</span>
              <div class="flex items-center justify-between">
                <strong class="text-amber-400 text-sm" id="txtAcc">${SEPAY_ACC}</strong>
                <button type="button" onclick="copyText('${SEPAY_ACC}')" class="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-1.5 py-0.5 rounded">Copy</button>
              </div>
            </div>
            <div>
              <span class="text-zinc-400 block text-[10px]">CHỦ TÀI KHOẢN:</span>
              <strong class="text-white">${SEPAY_HOLDER}</strong>
            </div>
            <div>
              <span class="text-zinc-400 block text-[10px]">SỐ TIỀN:</span>
              <strong class="text-emerald-400 text-sm" id="txtAmount">${formattedPrice} đ</strong>
            </div>
            <div class="sm:col-span-2 pt-1 border-t border-zinc-700/60">
              <span class="text-amber-400 block text-[10px] font-bold">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
              <div class="flex items-center justify-between mt-0.5">
                <strong class="text-red-400 text-sm font-black tracking-wider" id="txtMemo">SEVQR KH...</strong>
                <button type="button" onclick="copyMemo()" class="text-[10px] bg-red-900/60 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded font-bold border border-red-700">Copy Nội Dung</button>
              </div>
            </div>
          </div>

          <div class="mt-4 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200/90 max-w-md mx-auto text-left">
            ⚠️ <em>Giữ nguyên nội dung chuyển khoản có tiền tố <strong>SEVQR</strong> để VietinBank & SePay tự động mở khóa trang tải file ngay lập tức.</em>
          </div>

          <div class="mt-4 pt-3 border-t border-zinc-800">
            <a id="btnManualConfirm" href="#" class="text-xs text-zinc-400 hover:text-white underline font-mono-tech">
              Đã chuyển khoản xong? Bấm vào đây nếu hệ thống chưa tự chuyển trang
            </a>
          </div>

        </div>

      </div>

    </div>

    <!-- FOOTER -->
    <footer class="p-4 border-t border-[#e5e3db] text-center font-mono-tech text-xs text-zinc-400 bg-white">
      © 2026 KAR HOBBY WORKSHOP • CỔNG THANH TOÁN TỰ ĐỘNG SEPAY
    </footer>

  </div>

  <script>
    let currentOrderId = '';
    let selectedAmount = ${p.price};
    let currentMemo = '';
    let checkInterval = null;

    function selectAmount(amt) {
      selectedAmount = amt;
      const formatted = amt.toLocaleString('vi-VN') + 'đ';
      document.getElementById('displayPrice').textContent = formatted;
      document.getElementById('btnSubmit').textContent = 'XÁC NHẬN & TẠO MÃ VIETQR (' + formatted + ') →';

      if (amt === ${p.price}) {
        document.getElementById('btnPriceOfficial').className = 'py-2.5 px-3 rounded-lg border-2 border-amber-500 bg-amber-50/50 text-amber-900 font-bold text-xs text-center transition-all';
        document.getElementById('btnPriceTest').className = 'py-2.5 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs text-center transition-all';
      } else {
        document.getElementById('btnPriceTest').className = 'py-2.5 px-3 rounded-lg border-2 border-amber-500 bg-amber-50/50 text-amber-900 font-bold text-xs text-center transition-all';
        document.getElementById('btnPriceOfficial').className = 'py-2.5 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs text-center transition-all';
      }
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt).then(() => {
        alert('Đã sao chép: ' + txt);
      });
    }

    function copyMemo() {
      if (currentMemo) copyText(currentMemo);
    }

    async function handleCreateOrder(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSubmit');
      btn.disabled = true;
      btn.textContent = 'ĐANG TẠO ĐƠN & MÃ VIETQR...';

      const name = document.getElementById('customerName').value.trim();
      const email = document.getElementById('customerEmail').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();

      // Sinh mã đơn hàng chuẩn KAR HOBBY (KH + 4 số)
      const randNum = Math.floor(1000 + Math.random() * 9000);
      currentOrderId = 'KH' + randNum;
      currentMemo = 'SEVQR ' + currentOrderId;

      try {
        // Gửi thông tin đơn lên server
        const res = await fetch('/api/digital-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderCode: currentOrderId,
            customerName: name,
            email: email,
            phone: phone,
            productSlug: '${p.slug}',
            productName: '${p.name}',
            amount: selectedAmount
          })
        });

        // Tạo VietQR SePay URL
        const qrUrl = 'https://vietqr.app/img?acc=${SEPAY_ACC}&bank=${SEPAY_BANK}&amount=' + selectedAmount + '&des=' + encodeURIComponent(currentMemo) + '&template=compact';

        document.getElementById('qrImage').src = qrUrl;
        document.getElementById('txtAmount').textContent = selectedAmount.toLocaleString('vi-VN') + ' đ';
        document.getElementById('txtMemo').textContent = currentMemo;
        document.getElementById('btnManualConfirm').href = '/san-pham/${p.slug}/cam-on?orderCode=' + currentOrderId + '&email=' + encodeURIComponent(email);

        // Chuyển view sang QR Code
        document.getElementById('checkoutFormSection').style.display = 'none';
        document.getElementById('qrSection').style.display = 'block';
        document.getElementById('step2Indicator').className = 'flex items-center gap-2 text-zinc-900 font-bold';

        window.scrollTo({ top: 100, behavior: 'smooth' });

        // Bắt đầu Polling kiểm tra SePay mỗi 3 giây
        if (checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(() => checkPaymentStatus(currentOrderId, email), 3000);

      } catch (err) {
        console.error('Lỗi tạo đơn:', err);
        alert('Có lỗi khi tạo đơn hàng, vui lòng thử lại!');
        btn.disabled = false;
        btn.textContent = 'XÁC NHẬN & TẠO MÃ VIETQR (' + selectedAmount.toLocaleString('vi-VN') + 'đ) →';
      }
    }

    async function checkPaymentStatus(code, email) {
      try {
        const res = await fetch('/api/digital-orders/' + code + '/status?email=' + encodeURIComponent(email));
        if (res.ok) {
          const data = await res.json();
          if (data.paid || data.status === 'success' || data.status === 'paid') {
            clearInterval(checkInterval);
            document.getElementById('pollStatusText').textContent = '✅ ĐÃ NHẬN TIỀN THÀNH CÔNG! ĐANG CHUYỂN TRANG...';
            setTimeout(() => {
              window.location.href = '/san-pham/${p.slug}/cam-on?orderCode=' + code + '&email=' + encodeURIComponent(email);
            }, 800);
          }
        }
      } catch (err) {
        // Polling retry
      }
    }
  </script>

</body>
</html>`;
}

// -------------------------------------------------------------
// TRANG 3: CẢM ƠN & TẢI FILE
// -------------------------------------------------------------
function renderThankYouPage(product, orderCode, email) {
  const p = product || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
  const code = orderCode || 'KH_DIRECT';
  const mail = email || 'quý khách';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cảm ơn bạn — Tải tài liệu ${p.name} | KAR HOBBY</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,300;0,400;0,600;0,800;0,900;1,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <style>
    :root {
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-heading: 'Chivo', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    body {
      font-family: var(--font-body);
      background-color: #f2f0eb;
      background-image:
        radial-gradient(#d5d3cb 0.85px, transparent 0.85px),
        linear-gradient(to right, rgba(213, 211, 203, 0.25) 1px, transparent 1px);
      background-size: 24px 24px, 120px 120px;
    }
    h1, h2, h3, .font-heading { font-family: var(--font-heading); }
    .font-mono-tech { font-family: var(--font-mono); }
    .jdm-shadow {
      box-shadow: 0 25px 50px -12px rgba(24, 24, 27, 0.12), 0 0 0 1px rgba(24, 24, 27, 0.05);
    }
  </style>
</head>
<body class="min-h-screen p-3 pb-20 md:p-8 flex justify-center items-start text-zinc-800">

  <div class="w-full max-w-2xl bg-[#faf9f5] rounded-[24px] md:rounded-[32px] border border-[#e5e3db] jdm-shadow overflow-hidden relative">

    <!-- HEADER -->
    <header class="p-5 md:p-6 border-b border-[#e5e3db] flex justify-between items-center bg-[#faf9f5]">
      <a href="/" class="flex items-center gap-2 text-decoration-none">
        <span class="font-heading font-black tracking-tighter text-lg md:text-xl text-zinc-950">KAR HOBBY</span>
        <span class="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-emerald-900 text-emerald-400 font-bold uppercase">SUCCESS</span>
      </a>
      <span class="font-mono-tech text-xs text-zinc-500">MÃ ĐƠN: #${code}</span>
    </header>

    <div class="p-6 md:p-10 text-center">

      <!-- SUCCESS BADGE -->
      <div class="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg">
        ✓
      </div>

      <div class="inline-block font-mono-tech text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-3">
        SEPAY VERIFIED • THANH TOÁN THÀNH CÔNG
      </div>

      <h1 class="font-heading font-black text-2xl sm:text-3xl text-zinc-950 mb-2">
        CẢM ƠN BẠN ĐÃ ĐẶT MUA TÀI LIỆU!
      </h1>
      <p class="text-sm text-zinc-600 max-w-md mx-auto mb-8">
        Hệ thống xưởng KAR HOBBY đã xác thực thanh toán thành công cho đơn hàng <strong>#${code}</strong>.
      </p>

      <!-- DOWNLOAD BOX -->
      <div class="p-6 sm:p-8 rounded-2xl bg-white border-2 border-dashed border-amber-500 shadow-md max-w-lg mx-auto mb-8">
        <span class="text-3xl block mb-2">📥</span>
        <h3 class="font-heading font-black text-lg text-zinc-900 mb-1">${p.name}</h3>
        <p class="text-xs text-zinc-500 font-mono-tech mb-6">ĐỊNH DẠNG SÁCH XUẤT BẢN CHUẨN A4 • HOÀN THIỆN ĐẦY ĐỦ</p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href="/api/download-product/${code}" class="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-heading font-black text-base px-8 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer">
            TẢI FILE VỀ MÁY (HTML/PDF) ⬇
          </a>
          <a href="/downloads/${p.fileName}" target="_blank" class="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono-tech font-bold text-xs px-5 py-3.5 rounded-xl border border-zinc-300 transition-all">
            Mở xem trực tiếp ↗
          </a>
        </div>
      </div>

      <!-- RESEND EMAIL NOTIFICATION -->
      <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-left max-w-lg mx-auto mb-6 text-xs text-blue-900">
        <div class="flex items-start gap-3">
          <span class="text-base">📧</span>
          <div>
            <strong class="block font-bold mb-0.5">Đã gửi link tải dự phòng qua Resend</strong>
            <p class="text-blue-700 leading-relaxed">
              Xưởng đã gửi một email xác nhận kèm link tải vĩnh viễn về địa chỉ <strong>${mail}</strong>. Bạn có thể mở lại email bất cứ lúc nào để tải tài liệu khi đổi thiết bị.
            </p>
          </div>
        </div>
      </div>

      <!-- HƯỚNG DẪN IN PDF -->
      <div class="p-4 rounded-xl bg-zinc-100 border border-zinc-200 text-left max-w-lg mx-auto text-xs text-zinc-600 font-mono-tech">
        <strong>💡 Mẹo in ra PDF đẹp như sách in:</strong>
        <p class="mt-1">Khi mở file trên trình duyệt Chrome, bấm <code>Ctrl + P</code> > chọn <em>"Save as PDF"</em> > Khổ A4 > Tích chọn <em>"Background graphics"</em> để in thành sách giấy kẹp đầu bàn làm việc.</p>
      </div>

      <div class="mt-8 pt-6 border-t border-[#e5e3db] flex justify-center gap-4">
        <a href="/" class="text-xs text-zinc-500 hover:text-zinc-800 font-mono-tech">
          ← Về trang chủ KAR HOBBY
        </a>
      </div>

    </div>

    <!-- FOOTER -->
    <footer class="p-4 border-t border-[#e5e3db] text-center font-mono-tech text-xs text-zinc-400 bg-white">
      © 2026 KAR HOBBY WORKSHOP • THẾ GIỚI MÔ HÌNH CHUYÊN NGHIỆP
    </footer>

  </div>

</body>
</html>`;
}

// -------------------------------------------------------------
// SETUP CONTROLLER & ROUTES
// -------------------------------------------------------------
function setupDigitalFlow(app, { dbGet, dbRun, dbAll, sendResendEmail, checkSepaySheetForOrder }) {

  // TRANG 1: LANDING PAGE
  app.get('/san-pham/:slug', (req, res) => {
    const slug = req.params.slug;
    const product = DIGITAL_PRODUCTS[slug] || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderLandingPage(product));
  });

  // TRANG 2: CHECKOUT
  app.get('/san-pham/:slug/checkout', (req, res) => {
    const slug = req.params.slug;
    const product = DIGITAL_PRODUCTS[slug] || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderCheckoutPage(product));
  });

  // TRANG 3: CẢM ƠN / TẢI FILE
  app.get('/san-pham/:slug/cam-on', async (req, res) => {
    const slug = req.params.slug;
    const product = DIGITAL_PRODUCTS[slug] || DIGITAL_PRODUCTS['sop-pack-do-xe-164'];
    const orderCode = (req.query.orderCode || req.query.orderId || '').trim().toUpperCase();
    const email = (req.query.email || '').trim();

    // Verify và kích hoạt email Resend nếu chưa gửi
    if (orderCode) {
      try {
        const order = await dbGet("SELECT o.*, c.email as customer_email, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.order_code = ?", [orderCode]);
        if (order) {
          if (order.status !== 'success') {
            await dbRun("UPDATE orders SET status = 'success' WHERE id = ?", [order.id]);
          }

          const targetEmail = email || order.customer_email;
          const targetName = order.customer_name || 'Quý khách';

          if (targetEmail && sendResendEmail && process.env.RESEND_API_KEY) {
            const downloadUrl = `https://karhobby.io.vn/san-pham/${slug}/cam-on?orderCode=${orderCode}&email=${encodeURIComponent(targetEmail)}`;
            const subject = `[Kar Hobby] Xác nhận thanh toán & Link tải ${product.name} (#${orderCode})`;
            const html = `<div style="font-family: Arial, sans-serif; padding: 24px; background: #09090b; color: #fff; max-width: 600px; margin: 0 auto; border-radius: 12px;">
              <h2 style="color: #fbbf24; margin-top: 0;">KAR HOBBY WORKSHOP</h2>
              <h3 style="color: #22c55e;">XÁC NHẬN THANH TOÁN THÀNH CÔNG ĐƠN HÀNG #${orderCode}</h3>
              <p>Chào <strong>${targetName}</strong>,</p>
              <p>Xưởng Kar Hobby đã nhận được thanh toán của bạn cho tài liệu <strong>${product.name}</strong> qua SePay VietQR.</p>
              <div style="margin: 24px 0; text-align: center;">
                <a href="${downloadUrl}" style="background: #16a34a; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                  TẢI VỀ TRỌN BỘ TÀI LIỆU NGAY →
                </a>
              </div>
              <p style="color: #aaa; font-size: 13px;">Bạn có thể lưu email này để mở và tải lại tài liệu bất kỳ lúc nào.</p>
            </div>`;
            sendResendEmail(targetEmail, subject, html).catch(() => {});
          }
        }
      } catch (e) {
        console.error('Lỗi verify trang cảm ơn:', e);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderThankYouPage(product, orderCode, email));
  });

  // API TẠO ĐƠN SẢN PHẨM SỐ (STATUS=PENDING)
  app.post('/api/digital-orders', async (req, res) => {
    try {
      const { orderCode, customerName, email, phone, productSlug, amount } = req.body || {};
      const code = (orderCode || ('KH' + Math.floor(1000 + Math.random() * 9000))).toUpperCase();
      const name = (customerName || 'Khách Mua Tài Liệu').trim();
      const mail = (email || '').trim();
      const tel = (phone || `DIGI_${code}`).trim();
      const price = amount || 79000;

      // Lưu customer
      let cust = await dbGet("SELECT id FROM customers WHERE email = ? OR phone = ?", [mail, tel]);
      let custId = cust ? cust.id : null;
      if (!custId) {
        const cRes = await dbRun(
          "INSERT INTO customers (name, phone, email, registered_at) VALUES (?, ?, ?, ?)",
          [name, tel, mail, new Date().toLocaleString('vi-VN')]
        );
        custId = cRes.id;
      }

      // Lưu order
      await dbRun(
        "INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 8, ?, 'pending', ?, ?)",
        [custId, price, new Date().toLocaleString('vi-VN'), code]
      );

      res.json({
        success: true,
        orderCode: code,
        amount: price,
        message: 'Đã tạo đơn thành công, chờ quét mã VietQR'
      });
    } catch (err) {
      console.error('Lỗi tạo digital order:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API CHECK TRẠNG THÁI THANH TOÁN CHO POLLING CLIENT
  app.get('/api/digital-orders/:code/status', async (req, res) => {
    try {
      const code = (req.params.code || '').trim().toUpperCase();
      const email = (req.query.email || '').trim();

      const order = await dbGet("SELECT o.*, c.email as customer_email, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.order_code = ?", [code]);

      let isPaid = false;
      if (order && order.status === 'success') {
        isPaid = true;
      } else if (checkSepaySheetForOrder) {
        // Fallback kiểm tra trên Google Sheet SePay
        const found = await checkSepaySheetForOrder(code);
        if (found) {
          isPaid = true;
          if (order) {
            await dbRun("UPDATE orders SET status = 'success' WHERE id = ?", [order.id]);
          }
        }
      }

      if (isPaid) {
        // Gửi email Resend nếu có email
        const targetEmail = email || (order && order.customer_email);
        const targetName = (order && order.customer_name) || 'Quý khách';
        if (targetEmail && sendResendEmail && process.env.RESEND_API_KEY) {
          const downloadUrl = `https://karhobby.io.vn/san-pham/sop-pack-do-xe-164/cam-on?orderCode=${code}&email=${encodeURIComponent(targetEmail)}`;
          const subject = `[Kar Hobby] Xác nhận thanh toán & Link tải trọn bộ SOP Pack (#${code})`;
          const html = `<div style="font-family: Arial, sans-serif; padding: 24px; background: #09090b; color: #fff; max-width: 600px; margin: 0 auto; border-radius: 12px;">
            <h2 style="color: #fbbf24; margin-top: 0;">KAR HOBBY WORKSHOP</h2>
            <h3 style="color: #22c55e;">XÁC NHẬN THANH TOÁN THÀNH CÔNG #${code}</h3>
            <p>Chào <strong>${targetName}</strong>,</p>
            <p>Xưởng đã nhận được thanh toán của bạn cho bộ tài liệu <strong>SOP Pack Độ Xe Diecast 1:64</strong>.</p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${downloadUrl}" style="background: #16a34a; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                TẢI VỀ TRỌN BỘ TÀI LIỆU NGAY →
              </a>
            </div>
            <p style="color: #aaa; font-size: 13px;">Bạn có thể lưu email này để mở và tải lại tài liệu bất kỳ lúc nào.</p>
          </div>`;
          sendResendEmail(targetEmail, subject, html).catch(() => {});
        }

        return res.json({ success: true, paid: true, status: 'success' });
      }

      res.json({ success: true, paid: false, status: 'pending' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API TẢI FILE CHÍNH THỨC
  app.get('/api/download-product/:code', async (req, res) => {
    try {
      const code = (req.params.code || '').trim().toUpperCase();
      const filePath = path.join(__dirname, 'downloads', 'sop-pack-do-xe-diecast-164.html');

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Không tìm thấy file tài liệu trên máy chủ.');
      }

      res.setHeader('Content-Disposition', 'attachment; filename="SOP-Pack-Do-Xe-Diecast-164-KarHobby.html"');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).send('Lỗi khi tải file: ' + err.message);
    }
  });

}

module.exports = {
  DIGITAL_PRODUCTS,
  setupDigitalFlow,
  renderLandingPage,
  renderCheckoutPage,
  renderThankYouPage
};
