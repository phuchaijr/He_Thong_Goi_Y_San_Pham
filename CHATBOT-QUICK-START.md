# ⚡ QUICK START - CHATBOT INTEGRATION

## 🚀 Bắt Đầu Nhanh (5 Phút)

### **Bước 1: Khởi Động Server**

```bash
cd backend
npm install
node server.js
```

Server sẽ chạy trên http://localhost:3000

### **Bước 2: Kiểm Tra Chatbot**

Mở trình duyệt và truy cập:

- http://localhost:3000 (Trang chủ)
- http://localhost:3000/shop.html (Cửa hàng)
- http://localhost:3000/cart.html (Giỏ hàng)

**Chatbot widget sẽ xuất hiện ở góc dưới phải với nút 💬**

### **Bước 3: Test Chatbot**

1. **Đăng nhập** trước (tùy chọn, để có gợi ý cá nhân)
2. **Nhấn nút chatbot** (góc dưới phải)
3. **Gửi tin nhắn** ví dụ:
   - "Gợi ý laptop cho tôi"
   - "Tìm iPhone dưới 20 triệu"
   - "So sánh MacBook và Dell"
   - "Giúp tôi"

**✅ Bạn sẽ nhận được phản hồi từ chatbot!**

---

## 📁 Cấu Trúc File

```
public/
  ├── chatbot.css              # Style chatbot widget
  ├── chatbot.js               # Logic chatbot widget
  ├── index.html               # ← chatbot.css & chatbot.js được thêm
  ├── shop.html                # ← chatbot.css & chatbot.js được thêm
  ├── cart.html                # ← chatbot.css & chatbot.js được thêm
  └── ... (các trang khác)

backend/
  ├── routes/
  │   ├── chatbot.routes.js    # API endpoints chatbot
  │   └── tracking.routes.js   # ← thêm endpoint /chat-interaction
  ├── services/
  │   ├── chatbot-service.js   # Xử lý logic chatbot
  │   ├── recommendation-engine.js
  │   ├── behavior-aggregation-service.js
  │   └── tracking-service.js  # ← thêm method trackChatInteraction
  └── server.js                # ← chatbot routes đã được thêm
```

---

## 🔌 API Endpoints Sử Dụng

### **Chính**

- `POST /api/chatbot/chat` - Gửi tin nhắn
- `GET /api/chatbot/chat-history/:userId` - Lấy lịch sử
- `GET /api/chatbot/recommendations/:userId` - Lấy gợi ý
- `POST /api/tracking/chat-interaction` - Theo dõi

### **Tìm Kiếm & Phân Tích**

- `GET /api/chatbot/user-profile/:userId` - Hồ sơ user
- `GET /api/chatbot/frequently-bought-together/:productId` - Sản phẩm liên quan
- `GET /api/chatbot/similar-users/:userId` - Người dùng tương tự
- `GET /api/chatbot/engagement-score/:userId/:productId` - Điểm tương tác

---

## 🎯 Các Tính Năng Chính

✅ **Chat Real-time**

- Ghi nhận ý định người dùng tự động
- Phản hồi nhanh chóng

✅ **Gợi Ý Thông Minh**

- 6 chiến lược gợi ý khác nhau
- Cá nhân hóa dựa trên hành vi
- Sản phẩm bán chạy & mới

✅ **Tracking Tự Động**

- Theo dõi mọi tương tác
- Phân tích hành vi user
- Cải thiện độ chính xác gợi ý

✅ **Responsive Design**

- Desktop, tablet, mobile
- Dark mode support
- Fast loading (< 2s)

---

## 🛠️ Tùy Chỉnh Widget

### **Thay đổi Tiêu Đề**

Trong `public/chatbot.js`:

```javascript
const chatbot = new ChatbotWidget({
  title: "Cửa hàng Hỗ Trợ",
  subtitle: "Gợi ý sản phẩm",
  placeholder: "Hỏi gì đi...",
});
```

### **Thay đổi Màu Sắc**

Trong `public/chatbot.css`:

```css
:root {
  --chatbot-primary: #ff6b6b; /* Đỏ */
  --chatbot-secondary: #c92a2a;
}
```

### **Tự động Mở Chatbot**

```javascript
const chatbot = new ChatbotWidget({
  autoOpen: true, // Mở ngay
  autoOpenDelay: 3000, // Sau 3 giây
});
```

---

## 📊 Test API Endpoints

### **Gửi Tin Nhắn**

```bash
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Gợi ý laptop cho tôi"
  }'
```

### **Lấy Gợi Ý**

```bash
curl http://localhost:3000/api/chatbot/recommendations/1?type=multi&limit=5
```

### **Lấy Hồ Sơ User**

```bash
curl http://localhost:3000/api/chatbot/user-profile/1
```

### **Lấy Lịch Sử Chat**

```bash
curl http://localhost:3000/api/chatbot/chat-history/1?limit=20
```

---

## 🐛 Khắc Phục Sự Cố

| Sự Cố                 | Nguyên Nhân               | Giải Pháp                 |
| --------------------- | ------------------------- | ------------------------- |
| Widget không hiển thị | File JS/CSS không load    | Kiểm tra DevTools Console |
| Tin nhắn không gửi    | API error                 | Kiểm tra Network tab      |
| Gợi ý không hiển thị  | Database không có dữ liệu | Thêm sản phẩm trước       |
| Chậm                  | Quá nhiều dữ liệu         | Giảm limit query          |
| User không nhận gợi ý | Chưa login                | Đăng nhập trước           |

---

## 📈 Monitoring & Logs

Kiểm tra logs:

```bash
# Terminal nơi chạy server
# Sẽ thấy các dòng như:
# ✅ Chatbot widget initialized
# 📝 Chat interaction tracked - User: 1, Intent: PRODUCT_RECOMMENDATION
```

Kiểm tra Database:

```sql
-- Lịch sử chat
SELECT * FROM ChatHistory WHERE user_id = 1;

-- Gợi ý được hiển thị
SELECT * FROM RecommendationLog ORDER BY created_at DESC;

-- Session analytics
SELECT * FROM SessionLogs WHERE user_id = 1;
```

---

## 🎨 Widget Placement

Chatbot widget tự động:

- ✅ Xuất hiện ở góc dưới phải
- ✅ Fixed position (luôn nhìn thấy khi scroll)
- ✅ z-index: 9999 (trên tất cả elements)
- ✅ Responsive (auto adjust mobile/tablet)

Để ẩn widget:

```javascript
document.querySelector(".chatbot-toggle-btn").style.display = "none";
```

Để buộc mở:

```javascript
window.chatbotWidget.openChat();
```

---

## 📞 Các Lệnh Quan Trọng

```javascript
// Trên console của browser

// Mở/Đóng
window.chatbotWidget.openChat();
window.chatbotWidget.closeChat();
window.chatbotWidget.toggleChat();

// Gửi tin nhắn
window.chatbotWidget.sendQuickMessage("Gợi ý laptop");

// Quản lý
window.chatbotWidget.refreshChat(); // Làm mới
window.chatbotWidget.clearConversation(); // Xóa lịch sử
window.chatbotWidget.getHistory(); // Lấy lịch sử

// Thêm sản phẩm
window.chatbotWidget.addProductRecommendation({
  id: 1,
  name: "Laptop Dell",
  price: 20000000,
  image: "/img/dell.jpg",
});
```

---

## ✅ Checklist Triển Khai

- [x] File `chatbot.css` tạo trong `public/`
- [x] File `chatbot.js` tạo trong `public/`
- [x] Thêm CSS link vào tất cả `.html`
- [x] Thêm JS script vào tất cả `.html`
- [x] API endpoints chatbot đã ready
- [x] Tracking endpoint `/api/tracking/chat-interaction` ready
- [x] Database tables cho chatbot đã tạo
- [x] Server.js có route `/api/chatbot`
- [x] Hướng dẫn người dùng viết xong

---

## 🎓 Tiếp Theo

1. **Tối ưu hóa**
   - Thêm caching cho gợi ý
   - Cải thiện NLP intent detection
   - Machine learning model cho ranking

2. **Tính năng bổ sung**
   - Chatbot voice input/output
   - Multi-language support
   - Integration với payment gateway
   - AI-powered personalization

3. **Analytics**
   - Dashboard thống kê
   - A/B testing gợi ý
   - Heat map tương tác
   - Retention tracking

---

## 📚 Tài Liệu Liên Quan

- [Hướng Dẫn Toàn Diện](./CHATBOT-INTEGRATION-GUIDE.md)
- [Recommendation Engine Guide](./RECOMMENDATION-CHATBOT-GUIDE.md)
- [Quick Start Tracking](./QUICK-START-GUIDE.md)

---

**Happy chatting! 🤖💬**
