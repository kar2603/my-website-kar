import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
import urllib.request
import csv
import io
import re
from datetime import datetime, timedelta, timezone

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "brain.db")
SEPAY_SHEET_ID = "1EoLQtiL1cfjNnou5AHLcqaGi60aJJiahvAVXXnPCcC4"
SEPAY_CSV_URL = f"https://docs.google.com/spreadsheets/d/{SEPAY_SHEET_ID}/export?format=csv"
SEPAY_SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SEPAY_SHEET_ID}/edit?usp=sharing"

def load_resend_config():
    # 1. Đọc từ biến môi trường hệ thống
    api_key = os.environ.get("RESEND_API_KEY", "")
    sender = os.environ.get("RESEND_SENDER", os.environ.get("SENDER_EMAIL", "KAR HOBBY <contact@karhobby.io.vn>"))
    admin = os.environ.get("ADMIN_EMAIL", "lenguyendangkha260304@gmail.com")

    # 2. Đọc từ file .env nếu chưa có trong môi trường
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip()
                        if k == "RESEND_API_KEY" and not api_key:
                            api_key = v
                        elif k in ("RESEND_SENDER", "SENDER_EMAIL") and sender == "KAR HOBBY <contact@karhobby.io.vn>":
                            sender = v
                        elif k == "ADMIN_EMAIL" and admin == "lenguyendangkha260304@gmail.com":
                            admin = v
        except Exception:
            pass

    # 3. Fallback: resend_config.txt
    config_path = os.path.join(BASE_DIR, "resend_config.txt")
    if os.path.exists(config_path) and not api_key:
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line:
                        k, v = line.strip().split("=", 1)
                        if k.strip() == "RESEND_API_KEY":
                            api_key = v.strip()
        except Exception:
            pass

    return {
        "RESEND_API_KEY": api_key,
        "SENDER_EMAIL": sender,
        "ADMIN_EMAIL": admin
    }

def send_resend_email_async(to_email, subject, html_content, scheduled_at=None):
    import threading
    def _send():
        try:
            cfg = load_resend_config()
            api_key = cfg.get("RESEND_API_KEY")
            sender = cfg.get("SENDER_EMAIL", "KAR HOBBY <contact@karhobby.io.vn>")
            url = 'https://api.resend.com/emails'
            payload = {
                'from': sender,
                'to': [to_email] if isinstance(to_email, str) else to_email,
                'subject': subject,
                'html': html_content
            }
            if scheduled_at:
                payload['scheduled_at'] = scheduled_at

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                pass
        except Exception as e:
            print(f"[Resend Email Error]:", e)

    t = threading.Thread(target=_send, daemon=True)
    t.start()

def get_email_sequence_templates(customer_name, order_code=""):
    name = customer_name or "anh em"
    code_text = f" (Mã yêu cầu: #{order_code})" if order_code else ""

    # EMAIL 1: CHÀO MỪNG
    subject_1 = "[Kar Hobby] Xác nhận thông tin & lời chào từ góc bàn thợ 1:64"
    html_1 = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // GÓC BÀN THỢ 1:64</h2>
            <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 01 // WELCOME &amp; INTRO</span>
        </div>

        <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào {name},</p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
            Xưởng mình đã nhận được thông tin bạn gửi qua website{code_text}. Cảm ơn bạn đã dành thời gian ghé chơi với Kar Hobby!
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
    """

    # EMAIL 2: NUÔI DƯỠNG (KỸ THUẬT SƠN)
    subject_2 = "Sai lầm khiến 90% anh em tự sơn xe 1:64 bị dày cộm mất gân cửa"
    html_2 = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #3b82f6; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // CHIA SẺ KỸ THUẬT</h2>
            <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 02 // WORKSHOP INSIGHT</span>
        </div>

        <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào {name},</p>
        
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
    """

    # EMAIL 3: CHỐT ĐƠN & LINK THANH TOÁN
    subject_3 = "Chiếc xe trong mơ của anh em khi thu nhỏ 64 lần sẽ trông thế nào?"
    html_3 = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
        <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #22c55e; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // GIẢI PHÁP TRỌN GÓI</h2>
            <span style="font-size: 12px; color: #71717a; font-family: monospace;">EMAIL 03 // SPECIAL OFFER</span>
        </div>

        <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào {name},</p>
        
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
    """

    return {
        "email_1": {"subject": subject_1, "html": html_1},
        "email_2": {"subject": subject_2, "html": html_2},
        "email_3": {"subject": subject_3, "html": html_3}
    }

def get_order_confirmation_template(customer_name, phone, order_code, product_name, amount, status="pending"):
    name = customer_name or "anh em"
    formatted_amount = f"{int(amount):,}đ".replace(",", ".") if amount else "0đ"
    status_badge = '<span style="color: #22c55e; font-weight: bold;">ĐÃ XÁC NHẬN</span>' if status in ('paid', 'success', 'completed') else '<span style="color: #eab308; font-weight: bold;">ĐANG XỬ LÝ (CHỜ GIAO)</span>'

    subject = f"[Kar Hobby] Xác nhận đơn hàng #{order_code} — {product_name}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #ef4444; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // WORKSHOP</h2>
            <span style="font-size: 12px; color: #71717a; font-family: monospace;">PHIẾU XÁC NHẬN ĐƠN HÀNG TỪ BÀN THỢ</span>
        </div>

        <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào {name},</p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
            Thật ra, giữa vô vàn xưởng mô hình ngoài kia, việc bạn tin tưởng gửi gắm đơn hàng <strong>#{order_code}</strong> cho Kar Hobby chăm chút là điều tụi mình vô cùng trân quý. Tụi mình đã lên lịch bàn thợ và chuẩn bị bắt tay vào thực hiện tác phẩm cho bạn!
        </p>

        <!-- THÔNG TIN ĐƠN HÀNG -->
        <div style="background: #18181b; padding: 18px; border-radius: 12px; border: 1px solid #27272a; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; color: #71717a; text-transform: uppercase; font-family: monospace;">CHI TIẾT ĐƠN HÀNG #{order_code}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; width: 140px;">Sản phẩm / Dịch vụ:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">{product_name}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Số tiền:</td>
                    <td style="padding: 6px 0; color: #ef4444; font-weight: bold; font-size: 16px;">{formatted_amount}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Trạng thái đơn:</td>
                    <td style="padding: 6px 0;">{status_badge}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Người nhận:</td>
                    <td style="padding: 6px 0; color: #ffffff;">{name} ({phone})</td>
                </tr>
            </table>
        </div>

        <!-- HƯỚNG DẪN NHẬN HÀNG -->
        <div style="background: #18181b; padding: 18px; border-radius: 12px; border: 1px solid #3f3f46; margin: 20px 0;">
            <h4 style="margin: 0 0 10px; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📦 HƯỚNG DẪN NHẬN HÀNG CHUẨN XƯỞNG:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #d4d4d8;">
                <li><strong style="color: #ffffff;">Đóng gói chuyên dụng:</strong> Mỗi tác phẩm trước khi xuất xưởng đều được bọc màng PE chống xước sơn, chèn mút định hình và đóng thùng xốp 3 lớp chống sốc tuyệt đối.</li>
                <li><strong style="color: #ffffff;">Kiểm tra khi nhận (Đồng kiểm):</strong> Khi shipper giao đến, bạn cứ thoải mái mở hộp kiểm tra ngoại quan. Đúng màu sơn, đúng dàn chân camber và phụ kiện nguyên vẹn thì mới nhận hàng nhé.</li>
                <li><strong style="color: #ffffff;">Quay video mở hộp:</strong> Đơn giản thôi — bạn quay lại một clip ngắn lúc khui hộp. Nếu bên vận chuyển có lỡ quăng quật làm nứt vỡ mica hay gãy chi tiết, xưởng mình cam kết bảo hành đổi mới hoặc phục chế đền bù 100% không tốn một xu.</li>
            </ul>
        </div>

        <!-- LỜI CẢM ƠN -->
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
            Tụi mình sẽ ngồi tỉ mẩn chăm chút từng đường nét nhỏ nhất để khi bạn cầm tác phẩm trên tay, cảm giác thỏa mãn hoàn toàn xứng đáng với sự chờ đợi.
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #ffffff; font-weight: bold;">
            Cảm ơn bạn đã đồng hành cùng đam mê với xưởng Kar Hobby!
        </p>

        <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #a1a1aa;">
            <strong style="color: #ffffff;">Lê Nguyễn Đăng Khoa &amp; Đội ngũ Kar Hobby</strong><br>
            <em>Thế Giới Mô Hình Chuyên Nghiệp — Đam mê trên từng chi tiết nhỏ</em><br>
            Website: <a href="https://karhobby.io.vn" style="color: #ef4444; text-decoration: none;">karhobby.io.vn</a> • Hotline/Zalo hỗ trợ trực tiếp 1-1: <strong style="color: #ffffff;">0906 349 768</strong>
        </div>
    </div>
    """
    return subject, html

def get_deposit_confirmation_template(customer_name, phone, order_code, product_name, amount):
    name = customer_name or "anh em"
    code = order_code or "KH0000"
    formatted_amount = f"{int(amount):,}đ".replace(",", ".") if amount else "2.000đ"
    product = product_name or "Custom Diecast 1:64"

    subject = f"[Kar Hobby] Xác nhận đặt cọc thành công đơn hàng #{code}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px;">
        <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #22c55e; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">KAR HOBBY // XÁC NHẬN ĐẶT CỌC</h2>
            <span style="font-size: 12px; color: #71717a; font-family: monospace;">PHIẾU TIẾP NHẬN BÀN THỢ — ĐƠN HÀNG #{code}</span>
        </div>

        <p style="font-size: 16px; color: #ffffff; font-weight: bold;">Chào {name},</p>
        
        <p style="font-size: 15px; line-height: 1.6; color: #d4d4d8;">
            Xưởng Kar Hobby xác nhận đã nhận được khoản thanh toán cọc <strong style="color: #22c55e;">{formatted_amount}</strong> cho đơn hàng <strong style="color: #ef4444;">#{code}</strong> qua hệ thống VietQR SePay tự động.
        </p>

        <!-- THÔNG TIN ĐẶT CỌC -->
        <div style="background: #18181b; padding: 18px; border-radius: 12px; border: 1px solid #27272a; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 13px; color: #71717a; text-transform: uppercase; font-family: monospace;">CHI TIẾT ĐƠN HÀNG #{code}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa; width: 140px;">Sản phẩm / Dịch vụ:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">{product}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Số tiền cọc đã nhận:</td>
                    <td style="padding: 6px 0; color: #22c55e; font-weight: bold; font-size: 16px;">{formatted_amount}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Trạng thái đơn:</td>
                    <td style="padding: 6px 0;"><span style="color: #22c55e; font-weight: bold;">✓ ĐÃ ĐẶT CỌC THÀNH CÔNG (SUCCESS)</span></td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #a1a1aa;">Người đặt:</td>
                    <td style="padding: 6px 0; color: #ffffff;">{name} {f'({phone})' if phone else ''}</td>
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
    """
    return subject, html

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn

class CRMHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. Điều hướng /admin và /admin.html
        if path in ('/admin', '/admin.html'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            admin_file = os.path.join(BASE_DIR, 'admin.html')
            if not os.path.exists(admin_file):
                admin_file = os.path.join(BASE_DIR, 'admin', 'index.html')
            with open(admin_file, 'rb') as f:
                self.wfile.write(f.read())
            return

        # 2. APIs
        if path == '/api/products':
            conn = get_db()
            cur = conn.cursor()
            rows = cur.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
            products = [dict(r) for r in rows]
            conn.close()
            return self.send_json(products)

        elif path == '/api/customers':
            conn = get_db()
            cur = conn.cursor()
            rows = cur.execute("SELECT * FROM customers ORDER BY id DESC").fetchall()
            customers = [dict(r) for r in rows]
            conn.close()
            return self.send_json(customers)

        elif path == '/api/orders':
            conn = get_db()
            cur = conn.cursor()
            rows = cur.execute("""
                SELECT o.*, c.name as customer_name, c.phone as customer_phone, p.name as product_name, p.type as product_type
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN products p ON o.product_id = p.id
                ORDER BY o.id DESC
            """).fetchall()
            orders = [dict(r) for r in rows]
            conn.close()
            return self.send_json(orders)

        elif path == '/api/check-payment':
            query = urllib.parse.parse_qs(parsed.query)
            code = query.get('code', [''])[0].strip()
            order_id = query.get('order_id', [''])[0].strip()
            name_param = query.get('name', [''])[0].strip()
            email_param = query.get('email', [''])[0].strip()
            phone_param = query.get('phone', [''])[0].strip()
            service_param = query.get('service', [''])[0].strip()
            try:
                amount_param = float(query.get('amount', ['2000'])[0] or 2000)
            except Exception:
                amount_param = 2000.0

            conn = get_db()
            cur = conn.cursor()

            order = None
            if code:
                order = cur.execute("SELECT * FROM orders WHERE order_code = ? OR instr(?, order_code) > 0 ORDER BY id DESC LIMIT 1", (code, code)).fetchone()
            elif order_id:
                order = cur.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()

            if order and order['status'] in ('paid', 'success'):
                conn.close()
                return self.send_json({
                    "paid": True,
                    "status": "success",
                    "order_id": order['id'],
                    "order_code": order['order_code'],
                    "amount": order['amount'],
                    "message": "Đã thanh toán thành công!"
                })

            # Quét nhanh Google Sheet SePay nếu đơn đang pending
            try:
                req = urllib.request.Request(SEPAY_CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    csv_text = resp.read().decode('utf-8', errors='ignore')

                reader = csv.reader(io.StringIO(csv_text))
                rows = list(reader)
                if rows and len(rows) > 1:
                    headers = [h.strip() for h in rows[0]]
                    for r in rows[1:]:
                        if len(r) >= 6:
                            row_dict = {headers[i]: r[i].strip() for i in range(min(len(headers), len(r)))}
                            desc = row_dict.get('Nội dung thanh toán', '')
                            amount_str = row_dict.get('Số tiền', '').replace(',', '').replace('.', '').replace('đ', '')
                            try:
                                amount = float(amount_str) if amount_str else amount_param
                            except ValueError:
                                amount = amount_param

                            if amount > 0 and code and (code.lower() in desc.lower()):
                                if order:
                                    cur.execute("UPDATE orders SET status = 'success', amount = ? WHERE id = ?", (amount, order['id']))
                                    cust = cur.execute("SELECT * FROM customers WHERE id = ?", (order['customer_id'],)).fetchone()
                                    target_email = email_param or (cust['email'] if cust else '')
                                    target_name = name_param or (cust['name'] if cust else '')
                                    target_phone = phone_param or (cust['phone'] if cust else '')
                                else:
                                    # Tạo mới khách và đơn nếu chưa có
                                    cur.execute("INSERT INTO customers (name, phone, email, registered_at) VALUES (?, ?, ?, ?)",
                                                (name_param or f"Khách SePay ({code})", phone_param or f"SP_{code}", email_param, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                                    new_cid = cur.lastrowid
                                    cur.execute("INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, ?, 'success', ?, ?)",
                                                (new_cid, amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), code))
                                    target_email = email_param
                                    target_name = name_param or f"Khách SePay ({code})"
                                    target_phone = phone_param

                                conn.commit()
                                conn.close()

                                # Gửi email xác nhận đặt cọc qua Resend nếu có email
                                email_sent = False
                                if target_email:
                                    subj, html = get_deposit_confirmation_template(target_name, target_phone, code, service_param or "Custom Diecast 1:64", amount)
                                    send_resend_email_async(target_email, subj, html)
                                    email_sent = True

                                    # Gửi alert cho admin
                                    cfg = load_resend_config()
                                    adm_to = cfg.get("ADMIN_EMAIL", "lenguyendangkha260304@gmail.com")
                                    adm_html = f'''
                                    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #3f3f46; background: #18181b; color: #ffffff; border-radius: 12px;">
                                        <h3 style="color: #22c55e; margin-top: 0;">💰 ĐÃ NHẬN TIỀN CỌC SEPAY!</h3>
                                        <p><strong>Mã đơn:</strong> #{code}</p>
                                        <p><strong>Số tiền:</strong> <span style="color: #22c55e; font-weight: bold;">{int(amount):,} đ</span></p>
                                        <p><strong>Khách hàng:</strong> {target_name} ({target_phone})</p>
                                        <p><strong>Email:</strong> {target_email}</p>
                                        <p><strong>Giao dịch:</strong> {desc}</p>
                                        <p>Đã tự động gửi email xác nhận đặt cọc cho khách.</p>
                                    </div>
                                    '''
                                    send_resend_email_async(adm_to, f"💰 [ĐÃ NHẬN CỌC #{code}] {target_name} - {int(amount):,}đ", adm_html)

                                return self.send_json({
                                    "paid": True,
                                    "status": "success",
                                    "order_code": code,
                                    "amount": amount,
                                    "email_sent": email_sent,
                                    "message": "Thanh toán cọc SePay thành công!"
                                })
            except Exception as e:
                print("Lỗi quét SePay check-payment:", e)

            conn.close()
            return self.send_json({
                "paid": False,
                "status": order['status'] if order else "pending",
                "order_code": code
            })

        elif path == '/api/simulate-payment':
            query = urllib.parse.parse_qs(parsed.query)
            code = query.get('code', [''])[0].strip()
            conn = get_db()
            cur = conn.cursor()
            if code:
                cur.execute("UPDATE orders SET status = 'success' WHERE order_code = ?", (code,))
            else:
                cur.execute("UPDATE orders SET status = 'success' WHERE id = (SELECT MAX(id) FROM orders)")
            conn.commit()
            conn.close()
            return self.send_json({"success": True, "message": f"Đã mô phỏng thanh toán thành công cho đơn {code}!"})

        elif path == '/api/config':
            cfg_file = os.path.join(BASE_DIR, 'crm_config.json')
            cfg = {"form_sheet_url": "", "sepay_sheet_url": SEPAY_SHEET_URL}
            if os.path.exists(cfg_file):
                try:
                    with open(cfg_file, 'r', encoding='utf-8') as f:
                        cfg = json.load(f)
                except Exception:
                    pass
            return self.send_json(cfg)

        elif path == '/api/sync-form-customers':
            cfg_file = os.path.join(BASE_DIR, 'crm_config.json')
            form_sheet_url = ""
            if os.path.exists(cfg_file):
                try:
                    with open(cfg_file, 'r', encoding='utf-8') as f:
                        cfg = json.load(f)
                        form_sheet_url = cfg.get('form_sheet_url', '').strip()
                except Exception:
                    pass

            query = urllib.parse.parse_qs(parsed.query)
            if query.get('url'):
                form_sheet_url = query.get('url')[0].strip()

            if not form_sheet_url:
                return self.send_json({
                    "success": False,
                    "need_config": True,
                    "message": "Chưa cài đặt link Google Sheet của Form. Bác vui lòng nhập link vào ô trên trang Admin."
                })

            csv_url = form_sheet_url
            sheet_match = re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', csv_url)
            if sheet_match:
                s_id = sheet_match.group(1)
                gid_m = re.search(r'gid=(\d+)', csv_url)
                gid_part = f"&gid={gid_m.group(1)}" if gid_m else ""
                csv_url = f"https://docs.google.com/spreadsheets/d/{s_id}/export?format=csv{gid_part}"

            try:
                req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    csv_text = resp.read().decode('utf-8', errors='ignore')

                reader = csv.reader(io.StringIO(csv_text))
                rows = list(reader)
                if not rows or len(rows) < 2:
                    return self.send_json({"success": True, "new_customers": 0, "total_rows": 0, "message": "Google Sheet chưa có dòng phản hồi nào."})

                headers = [h.strip() for h in rows[0]]
                col_name, col_phone, col_service, col_note, col_time, col_email = -1, -1, -1, -1, -1, -1
                for idx, h in enumerate(headers):
                    hl = h.lower()
                    if 'thời gian' in hl or 'timestamp' in hl:
                        col_time = idx
                    elif 'họ tên' in hl or 'tên' in hl or 'name' in hl:
                        col_name = idx
                    elif 'điện thoại' in hl or 'zalo' in hl or 'phone' in hl or 'sđt' in hl:
                        col_phone = idx
                    elif 'email' in hl or 'thư điện tử' in hl:
                        col_email = idx
                    elif 'bạn cần' in hl or 'dịch vụ' in hl or 'sản phẩm' in hl:
                        col_service = idx
                    elif 'mô tả' in hl or 'ghi chú' in hl:
                        col_note = idx

                conn = get_db()
                cur = conn.cursor()
                new_cust_count = 0
                new_order_count = 0

                for r in rows[1:]:
                    if not any(r):
                        continue
                    name = r[col_name].strip() if col_name != -1 and col_name < len(r) else ''
                    raw_phone = r[col_phone].strip() if col_phone != -1 and col_phone < len(r) else ''
                    email = r[col_email].strip() if col_email != -1 and col_email < len(r) else ''
                    service = r[col_service].strip() if col_service != -1 and col_service < len(r) else 'custom diecast 1:64'
                    note = r[col_note].strip() if col_note != -1 and col_note < len(r) else ''
                    time_val = r[col_time].strip() if col_time != -1 and col_time < len(r) else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                    phone = re.sub(r'[^0-9+]', '', raw_phone)
                    if not phone and not name:
                        continue
                    if not phone:
                        phone = 'KHACH_' + str(abs(hash(name)))[:8]

                    existing = cur.execute("SELECT id FROM customers WHERE phone = ?", (phone,)).fetchone()
                    if existing:
                        cust_id = existing['id']
                        if name or email:
                            cur.execute("UPDATE customers SET name = ?, zalo = ?, email = COALESCE(NULLIF(?, ''), email) WHERE id = ?", (name, phone, email, cust_id))
                    else:
                        cur.execute("""
                            INSERT INTO customers (name, phone, zalo, email, registered_at)
                            VALUES (?, ?, ?, ?, ?)
                        """, (name or 'Khách hàng', phone, phone, email, time_val))
                        cust_id = cur.lastrowid
                        new_cust_count += 1

                    existing_order = cur.execute("""
                        SELECT id FROM orders 
                        WHERE customer_id = ? AND (order_date = ? OR instr(?, customer_id) > 0)
                    """, (cust_id, time_val, str(cust_id))).fetchone()

                    if not existing_order:
                        prod = cur.execute("SELECT id FROM products WHERE name LIKE ? LIMIT 1", (f"%{service[:10]}%",)).fetchone()
                        prod_id = prod['id'] if prod else 1
                        order_code = 'KH' + str(abs(hash(phone + time_val)))[:4]
                        cur.execute("""
                            INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code)
                            VALUES (?, ?, 2000, 'pending', ?, ?)
                        """, (cust_id, prod_id, time_val, order_code))
                        new_order_count += 1

                conn.commit()
                conn.close()

                return self.send_json({
                    "success": True,
                    "new_customers": new_cust_count,
                    "new_orders": new_order_count,
                    "total_rows": len(rows) - 1,
                    "message": f"Đã đồng bộ {new_cust_count} khách mới & cập nhật toàn bộ danh sách khách từ Google Form Sheet!"
                })
            except urllib.error.HTTPError as e:
                if e.code in (404, 403):
                    return self.send_json({
                        "error": "Google Sheet đang ở chế độ 'Hạn chế' (Riêng tư). Bác vui lòng mở Sheet này -> Bấm nút 'Chia sẻ' góc trên bên phải -> Chuyển sang 'Bất kỳ ai có đường liên kết' (Người xem) rồi bấm Đồng bộ lại nhé!"
                    }, 400)
                return self.send_json({"error": f"Lỗi kết nối Google Sheet: {str(e)}"}, 500)
            except Exception as e:
                return self.send_json({"error": f"Lỗi đọc Google Sheet: {str(e)}"}, 500)

        elif path == '/api/sync-sepay':
            try:
                req = urllib.request.Request(SEPAY_CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    csv_text = resp.read().decode('utf-8', errors='ignore')

                reader = csv.reader(io.StringIO(csv_text))
                rows = list(reader)
                if not rows:
                    return self.send_json({"success": True, "count": 0, "transactions": [], "message": "Sheet SePay đang trống."})

                headers = [h.strip() for h in rows[0]]
                transactions = []
                conn = get_db()
                cur = conn.cursor()
                updated_orders = 0

                for r in rows[1:]:
                    if len(r) >= 6 and any(r):
                        row_dict = {headers[i]: r[i].strip() for i in range(min(len(headers), len(r)))}
                        bank = row_dict.get('Ngân hàng', '')
                        date_str = row_dict.get('Ngày giao dịch', '')
                        desc = row_dict.get('Nội dung thanh toán', '')
                        amount_str = row_dict.get('Số tiền', '').replace(',', '').replace('.', '').replace('đ', '')

                        try:
                            amount = float(amount_str) if amount_str else 0
                        except ValueError:
                            amount = 0

                        # Lọc dòng giao dịch thật (bỏ qua các dòng nhãn mẫu)
                        if amount > 0 or ('vietin' in bank.lower() and date_str):
                            tx = {
                                "bank": bank,
                                "date": date_str,
                                "account": row_dict.get('Số tài khoản', ''),
                                "description": desc,
                                "amount": amount,
                                "code": row_dict.get('Code TT', ''),
                                "ref": row_dict.get('Mã tham chiếu', '')
                            }
                            transactions.append(tx)

                            # Khớp đơn hàng theo mã đơn KHxxxx
                            import re
                            m = re.search(r'(?:SEVQR\s*)?(KH\d{4,})', desc, re.I)
                            if m:
                                code = m.group(1).upper()
                                existing = cur.execute("SELECT * FROM orders WHERE order_code = ? LIMIT 1", (code,)).fetchone()
                                if existing:
                                    if existing['status'] != 'success':
                                        cur.execute("UPDATE orders SET status = 'success', amount = ? WHERE id = ?", (amount, existing['id']))
                                        updated_orders += 1
                                        cust = cur.execute("SELECT * FROM customers WHERE id = ?", (existing['customer_id'],)).fetchone()
                                        if cust and cust['email']:
                                            subj, body = get_deposit_confirmation_template(cust['name'], cust['phone'], code, "Custom Diecast 1:64", amount)
                                            send_resend_email_async(cust['email'], subj, body)
                                else:
                                    # Tự động tạo đơn mới từ giao dịch SePay nếu chưa có trong DB
                                    cur.execute("INSERT INTO customers (name, phone, registered_at) VALUES (?, ?, ?)", (f"Khách SePay ({code})", f"SP_{code}", date_str or datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                                    new_cid = cur.lastrowid
                                    cur.execute("""
                                        INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code)
                                        VALUES (?, 1, ?, 'success', ?, ?)
                                    """, (new_cid, amount, date_str or datetime.now().strftime('%Y-%m-%d %H:%M:%S'), code))
                                    updated_orders += 1

                conn.commit()
                conn.close()

                return self.send_json({
                    "success": True,
                    "sheet_url": SEPAY_SHEET_URL,
                    "count": len(transactions),
                    "updated_orders": updated_orders,
                    "transactions": transactions,
                    "message": f"Đã kết nối và quét {len(transactions)} giao dịch từ Google Sheet SePay. Cập nhật {updated_orders} đơn."
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # Mặc định phục vụ file tĩnh
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = json.loads(post_data.decode('utf-8', errors='replace')) if post_data else {}

        conn = get_db()
        cur = conn.cursor()

        try:
            # 0. API Xác nhận cọc từ client (SePay Modal)
            if path in ('/api/check-payment', '/api/confirm-deposit'):
                code = (body.get('order_code') or body.get('code') or '').strip()
                name = (body.get('name') or body.get('customer_name') or 'Quý khách').strip()
                email = (body.get('email') or '').strip()
                phone = (body.get('phone') or '').strip()
                service = (body.get('service') or body.get('product_name') or 'Custom Diecast 1:64').strip()
                amount = float(body.get('amount') or 2000)

                # Cập nhật đơn hàng trong DB nếu có
                if code:
                    existing_order = cur.execute("SELECT * FROM orders WHERE order_code = ? LIMIT 1", (code,)).fetchone()
                    if existing_order:
                        cur.execute("UPDATE orders SET status = 'success', amount = ? WHERE id = ?", (amount, existing_order['id']))
                        cust = cur.execute("SELECT * FROM customers WHERE id = ?", (existing_order['customer_id'],)).fetchone()
                        if cust:
                            if not email and cust['email']: email = cust['email']
                            if not name and cust['name']: name = cust['name']
                            if not phone and cust['phone']: phone = cust['phone']
                    else:
                        cur.execute("INSERT INTO customers (name, phone, email, registered_at) VALUES (?, ?, ?, ?)",
                                    (name, phone or f"SP_{code}", email, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                        new_cid = cur.lastrowid
                        cur.execute("INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code) VALUES (?, 1, ?, 'success', ?, ?)",
                                    (new_cid, amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), code))
                    conn.commit()

                # Gửi email xác nhận đặt cọc thành công qua Resend nếu có email
                email_sent = False
                if email:
                    subj, html = get_deposit_confirmation_template(name, phone, code, service, amount)
                    send_resend_email_async(email, subj, html)
                    email_sent = True

                    cfg = load_resend_config()
                    adm_to = cfg.get("ADMIN_EMAIL", "lenguyendangkha260304@gmail.com")
                    adm_html = f'''
                    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #3f3f46; background: #18181b; color: #ffffff; border-radius: 12px;">
                        <h3 style="color: #22c55e; margin-top: 0;">💰 ĐÃ NHẬN TIỀN CỌC SEPAY!</h3>
                        <p><strong>Mã đơn:</strong> #{code}</p>
                        <p><strong>Số tiền:</strong> <span style="color: #22c55e; font-weight: bold;">{int(amount):,} đ</span></p>
                        <p><strong>Khách hàng:</strong> {name} ({phone})</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p>Đã tự động gửi email xác nhận đặt cọc thành công cho khách.</p>
                        <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;">
                        <a href="https://www.karhobby.io.vn/admin" style="display: inline-block; padding: 8px 16px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px;">XEM TRANG CRM ADMIN →</a>
                    </div>
                    '''
                    send_resend_email_async(adm_to, f"💰 [ĐÃ NHẬN CỌC #{code}] {name} - {int(amount):,}đ", adm_html)

                conn.close()
                return self.send_json({
                    "success": True,
                    "paid": True,
                    "order_code": code,
                    "amount": amount,
                    "email_sent": email_sent,
                    "message": "Đã xác nhận đặt cọc thành công!"
                })

            # 1. API Điền Form từ Landing Page (Tự động lưu Khách hàng + Đơn hàng vào CRM brain.db)
            elif path == '/api/submit-form':
                name = body.get('name', 'Khách hàng').strip()
                phone = body.get('phone', '').strip()
                zalo = body.get('zalo', phone).strip()
                email = body.get('email', '').strip()
                service = body.get('service', 'custom diecast 1:64')
                note = body.get('note', '')
                amount = float(body.get('amount', 2000))
                status = body.get('status', 'pending')
                order_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                # Lưu hoặc cập nhật khách hàng
                existing_cust = cur.execute("SELECT id FROM customers WHERE phone = ?", (phone,)).fetchone()
                if existing_cust:
                    cust_id = existing_cust['id']
                    if name or email:
                        cur.execute("UPDATE customers SET name = ?, zalo = ?, email = COALESCE(NULLIF(?, ''), email) WHERE id = ?", (name, zalo, email, cust_id))
                else:
                    cur.execute("""
                        INSERT INTO customers (name, phone, zalo, email, registered_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (name, phone, zalo, email, order_date))
                    cust_id = cur.lastrowid

                # Map nhu cầu sang sản phẩm tương ứng trong db
                prod_row = None
                if 'diecast' in service.lower():
                    prod_row = cur.execute("SELECT id, type, stock_quantity FROM products WHERE name LIKE '%Diecast%' ORDER BY id ASC LIMIT 1").fetchone()
                elif 'sa bàn' in service.lower() or 'diorama' in service.lower():
                    prod_row = cur.execute("SELECT id, type, stock_quantity FROM products WHERE name LIKE '%Diorama%' LIMIT 1").fetchone()
                elif 'weathering' in service.lower():
                    prod_row = cur.execute("SELECT id, type, stock_quantity FROM products WHERE name LIKE '%Weathering%' LIMIT 1").fetchone()
                elif 'mua xe' in service.lower():
                    prod_row = cur.execute("SELECT id, type, stock_quantity FROM products WHERE type = 'physical' LIMIT 1").fetchone()

                if not prod_row:
                    prod_row = cur.execute("SELECT id, type, stock_quantity FROM products ORDER BY id ASC LIMIT 1").fetchone()

                prod_id = prod_row['id']
                prod_type = prod_row['type']

                # Chỉ trừ tồn kho nếu là sản phẩm vật lý
                stock_deducted = False
                if prod_type == 'physical':
                    cur.execute("UPDATE products SET stock_quantity = MAX(0, stock_quantity - 1) WHERE id = ?", (prod_id,))
                    stock_deducted = True

                # Tạo đơn hàng
                order_code = body.get('order_code', '')
                if not order_code:
                    order_code = 'KH' + str(int(datetime.now().timestamp()))[-4:]

                cur.execute("""
                    INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code)
                    VALUES (?, ?, ?, 'pending', ?, ?)
                """, (cust_id, prod_id, amount, order_date, order_code))
                order_id = cur.lastrowid

                conn.commit()
                conn.close()

                # Kích hoạt Chuỗi 3 Email (3-Email Sequence) qua Resend
                if email:
                    is_test = '+test' in email.lower()
                    seq = get_email_sequence_templates(name, order_code)

                    # (1) Email 1: Chào mừng (Welcome) - Gửi ngay lập tức
                    send_resend_email_async(email, seq['email_1']['subject'], seq['email_1']['html'])

                    # (2) Email 2: Nuôi dưỡng (Nurture) - 2 ngày sau (hoặc ngay lập tức nếu là test)
                    sched_2 = None if is_test else (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
                    send_resend_email_async(email, seq['email_2']['subject'], seq['email_2']['html'], sched_2)

                    # (3) Email 3: Chốt đơn (Sales Closing) - 1 ngày sau email 2 (3 ngày sau đăng ký, hoặc ngay lập tức nếu là test)
                    sched_3 = None if is_test else (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
                    send_resend_email_async(email, seq['email_3']['subject'], seq['email_3']['html'], sched_3)

                # 2. Gửi email thông báo cho Admin (bác Kha)
                cfg = load_resend_config()
                adm_to = cfg.get("ADMIN_EMAIL", "lenguyendangkha260304@gmail.com")
                admin_html = f'''
                <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #3f3f46; background: #18181b; color: #ffffff; border-radius: 12px;">
                    <h3 style="color: #22c55e; margin-top: 0;">🔔 KHÁCH HÀNG MỚI ĐIỀN FORM!</h3>
                    <p><strong>Khách hàng:</strong> {name}</p>
                    <p><strong>Số điện thoại:</strong> <a href="tel:{phone}" style="color: #38bdf8;">{phone}</a></p>
                    <p><strong>Email:</strong> {email or 'Chưa điền'}</p>
                    <p><strong>Dịch vụ:</strong> {service}</p>
                    <p><strong>Ghi chú:</strong> {note or 'Không'}</p>
                    <p><strong>Mã đơn:</strong> #{order_code}</p>
                    <p><strong>Chuỗi email:</strong> Đã kích hoạt 3-Email Sequence qua Resend</p>
                    <p><strong>Thời gian:</strong> {order_date}</p>
                    <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;">
                    <a href="https://www.karhobby.io.vn/admin" style="display: inline-block; padding: 8px 16px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px;">MỞ CRM ADMIN QUẢN TRỊ →</a>
                </div>
                '''
                send_resend_email_async(adm_to, f"🔔 [Khách mới #{order_code}] {name} - {phone}", admin_html)

                return self.send_json({
                    "success": True,
                    "customer_id": cust_id,
                    "order_id": order_id, "order_code": order_code, "status": "pending",
                    "stock_deducted": stock_deducted,
                    "message": "Đã lưu thông tin khách hàng, đơn hàng và kích hoạt chuỗi 3 email Resend thành công"
                })

            elif path == '/api/products':
                p_name = body.get('name')
                p_type = body.get('type', 'service')
                p_price = float(body.get('price', 0))
                p_desc = body.get('description', '')
                p_stock = body.get('stock_quantity')
                if p_type == 'physical':
                    p_stock = int(p_stock) if p_stock is not None and str(p_stock).strip() != '' else 0
                else:
                    p_stock = None

                cur.execute("""
                    INSERT INTO products (name, type, price, description, stock_quantity)
                    VALUES (?, ?, ?, ?, ?)
                """, (p_name, p_type, p_price, p_desc, p_stock))
                conn.commit()
                new_id = cur.lastrowid
                conn.close()
                return self.send_json({"success": True, "id": new_id, "message": "Đã thêm sản phẩm thành công"})

            elif path == '/api/customers':
                name = body.get('name', 'Khách hàng')
                phone = body.get('phone', '')
                zalo = body.get('zalo', phone)
                email = body.get('email', '').strip()

                existing = cur.execute("SELECT id FROM customers WHERE phone = ?", (phone,)).fetchone()
                if existing:
                    cust_id = existing['id']
                    cur.execute("UPDATE customers SET name = ?, zalo = ?, email = ? WHERE id = ?", (name, zalo, email, cust_id))
                    conn.commit()
                    conn.close()
                    return self.send_json({"success": True, "id": cust_id, "message": "Khách hàng đã tồn tại, đã cập nhật thông tin"})
                else:
                    cur.execute("""
                        INSERT INTO customers (name, phone, zalo, email)
                        VALUES (?, ?, ?, ?)
                    """, (name, phone, zalo, email))
                    conn.commit()
                    cust_id = cur.lastrowid
                    conn.close()
                    return self.send_json({"success": True, "id": cust_id, "message": "Đã thêm khách hàng thành công"})

            elif path == '/api/orders':
                cust_id = int(body.get('customer_id'))
                prod_id = int(body.get('product_id'))
                amount = float(body.get('amount', 0))
                status = body.get('status', 'pending')
                order_date = body.get('order_date') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                prod = cur.execute("SELECT id, name, type, price, stock_quantity FROM products WHERE id = ?", (prod_id,)).fetchone()
                if not prod:
                    conn.close()
                    return self.send_json({"error": "Không tìm thấy sản phẩm"}, 400)

                cust = cur.execute("SELECT id, name, phone, email FROM customers WHERE id = ?", (cust_id,)).fetchone()
                if not cust:
                    conn.close()
                    return self.send_json({"error": "Không tìm thấy khách hàng"}, 400)

                prod_type = prod['type']
                stock_deducted = False

                # Chỉ trừ tồn kho nếu là sản phẩm vật lý
                if prod_type == 'physical':
                    cur.execute("""
                        UPDATE products 
                        SET stock_quantity = MAX(0, stock_quantity - 1)
                        WHERE id = ?
                    """, (prod_id,))
                    stock_deducted = True

                order_code = body.get('order_code', '')
                if not order_code:
                    order_code = 'KH' + str(int(datetime.now().timestamp()))[-4:]

                cur.execute("""
                    INSERT INTO orders (customer_id, product_id, amount, status, order_date, order_code)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (cust_id, prod_id, amount, status, order_date, order_code))
                conn.commit()
                new_id = cur.lastrowid
                conn.close()

                # TỰ ĐỘNG GỬI EMAIL XÁC NHẬN ĐƠN HÀNG QUA RESEND NẾU KHÁCH CÓ EMAIL
                email_sent = False
                cust_email = cust['email']
                if cust_email:
                    subj, html_body = get_order_confirmation_template(
                        customer_name=cust['name'],
                        phone=cust['phone'],
                        order_code=order_code,
                        product_name=prod['name'],
                        amount=amount,
                        status=status
                    )
                    send_resend_email_async(cust_email, subj, html_body)
                    email_sent = True

                msg = f"Đã tạo đơn hàng #{order_code} thành công!"
                if stock_deducted:
                    msg += " Đã tự động trừ 1 sản phẩm tồn kho (Sản phẩm vật lý)."
                if email_sent:
                    msg += f" Đã tự động gửi email xác nhận đơn hàng đến {cust_email} qua Resend."

                return self.send_json({
                    "success": True, 
                    "id": new_id, 
                    "order_code": order_code,
                    "email_sent": email_sent,
                    "stock_deducted": stock_deducted, 
                    "message": msg
                })

        except Exception as e:
            conn.rollback()
            conn.close()
            return self.send_json({"error": str(e)}, 500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        parts = parsed.path.strip('/').split('/')
        if len(parts) != 3 or parts[0] != 'api':
            return self.send_json({"error": "Đường dẫn không hợp lệ"}, 404)

        resource, item_id = parts[1], parts[2]
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = json.loads(post_data.decode('utf-8', errors='replace')) if post_data else {}

        conn = get_db()
        cur = conn.cursor()

        try:
            if resource == 'products':
                p_name = body.get('name')
                p_type = body.get('type')
                p_price = float(body.get('price', 0))
                p_desc = body.get('description', '')
                p_stock = body.get('stock_quantity')
                if p_type == 'physical':
                    p_stock = int(p_stock) if p_stock is not None and str(p_stock).strip() != '' else 0
                else:
                    p_stock = None

                cur.execute("""
                    UPDATE products 
                    SET name = ?, type = ?, price = ?, description = ?, stock_quantity = ?
                    WHERE id = ?
                """, (p_name, p_type, p_price, p_desc, p_stock, item_id))
                conn.commit()
                conn.close()
                return self.send_json({"success": True, "message": "Đã cập nhật sản phẩm"})

            elif resource == 'customers':
                name = body.get('name')
                phone = body.get('phone')
                zalo = body.get('zalo')
                email = body.get('email', '')
                cur.execute("""
                    UPDATE customers 
                    SET name = ?, phone = ?, zalo = ?, email = ?
                    WHERE id = ?
                """, (name, phone, zalo, email, item_id))
                conn.commit()
                conn.close()
                return self.send_json({"success": True, "message": "Đã cập nhật khách hàng"})

            elif resource == 'orders':
                status = body.get('status')
                amount = float(body.get('amount', 0))
                cur.execute("""
                    UPDATE orders 
                    SET status = ?, amount = ?
                    WHERE id = ?
                """, (status, amount, item_id))
                conn.commit()
                conn.close()
                return self.send_json({"success": True, "message": "Đã cập nhật đơn hàng"})

        except Exception as e:
            conn.rollback()
            conn.close()
            return self.send_json({"error": str(e)}, 500)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        parts = parsed.path.strip('/').split('/')
        if len(parts) != 3 or parts[0] != 'api':
            return self.send_json({"error": "Đường dẫn không hợp lệ"}, 404)

        resource, item_id = parts[1], parts[2]
        conn = get_db()
        cur = conn.cursor()

        try:
            if resource == 'products':
                cur.execute("DELETE FROM products WHERE id = ?", (item_id,))
            elif resource == 'customers':
                cur.execute("DELETE FROM customers WHERE id = ?", (item_id,))
            elif resource == 'orders':
                cur.execute("DELETE FROM orders WHERE id = ?", (item_id,))
            conn.commit()
            conn.close()
            return self.send_json({"success": True, "message": "Đã xóa thành công"})
        except Exception as e:
            conn.rollback()
            conn.close()
            return self.send_json({"error": str(e)}, 500)

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CRMHandler) as httpd:
        print(f"🚀 KAR HOBBY Admin Server đang chạy tại:")
        print(f"👉 http://localhost:{PORT}/admin")
        print(f"👉 http://127.0.0.1:{PORT}/admin")
        print("Bấm Ctrl + C để dừng server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐã dừng server.")
