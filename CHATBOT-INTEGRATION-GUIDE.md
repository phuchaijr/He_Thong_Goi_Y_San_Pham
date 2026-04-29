# 🤖 HƯỚNG DẪN TRỢ LÝ MUA SẮM - CHATBOT TÍCH HỢP

## 📌 Tổng Quan

Hệ thống **Chatbot Trợ Lý Mua Sắm** đã được tích hợp hoàn chỉnh vào website để cung cấp trải nghiệm mua sắm cá nhân hóa và hỗ trợ khách hàng thông minh.

---

## ✨ CÁC TÍNH NĂNG CHÍNH

### 1. **Gợi Ý Sản Phẩm Thông Minh**

- Gợi ý sản phẩm dựa trên hành vi người dùng
- Sử dụng 6 chiến lược gợi ý khác nhau:
  - **Personalized**: Dựa trên danh mục ưa thích
  - **Collaborative Filtering**: Dựa trên người dùng tương tự
  - **Popular**: Sản phẩm bán chạy nhất
  - **New**: Sản phẩm mới nhất
  - **Cart-Based**: Gợi ý sản phẩm bổ sung cho giỏ hàng
  - **Frequently Bought Together**: Sản phẩm thường mua cùng nhau

### 2. **Nhận Diện Ý Định Tìm Kiếm**

Chatbot tự động nhận diện 8 loại ý định khác nhau:

| Ý Định                     | Ví Dụ                     | Phản Hồi               |
| -------------------------- | ------------------------- | ---------------------- |
| **PRODUCT_RECOMMENDATION** | "Gợi ý cho tôi"           | Gợi ý sản phẩm phù hợp |
| **PRODUCT_SEARCH**         | "Tìm laptop"              | Tìm kiếm sản phẩm      |
| **PRODUCT_COMPARISON**     | "So sánh MacBook và Dell" | So sánh chi tiết       |
| **CATEGORY_BROWSE**        | "Danh mục điện tử"        | Duyệt danh mục         |
| **PRICE_QUERY**            | "Giá iPhone bao nhiêu"    | Hiển thị giá           |
| **PURCHASE_INTENT**        | "Muốn mua cái này"        | Hỗ trợ thanh toán      |
| **BRAND_QUERY**            | "Sản phẩm Apple"          | Lọc theo thương hiệu   |
| **HELP**                   | "Giúp tôi"                | Hướng dẫn sử dụng      |

### 3. **Lịch Sử Trò Chuyện**

- Lưu trữ tất cả cuộc hội thoại
- Có thể xem lại các gợi ý trước đó
- Dễ dàng tìm kiếm thông tin cũ

### 4. **Theo Dõi Hành Vi Người Dùng**

- Ghi lại mỗi tương tác (view, click, add to cart, purchase)
- Phân tích sở thích của người dùng
- Cải thiện độ chính xác gợi ý theo thời gian

### 5. **Giao Diện Thân Thiện**

- Widget nổi trên tất cả các trang
- Thiết kế responsive (mobile, tablet, desktop)
- Hỗ trợ dark mode tự động
- Animation mượt mà

---

## 🚀 CÁCH SỬ DỤNG

### **1. Mở Chatbot**

- Nhấn nút **Trợ Lý Mua Sắm** ở góc dưới phải màn hình
- Widget sẽ mở ra với chiều cao 600px
- Trên mobile, chiều cao là 400px

### **2. Hỏi Câu Hỏi**

```
Ví dụ:
- "Gợi ý cho tôi laptop chơi game"
- "Tìm tai nghe Bluetooth dưới 500k"
- "So sánh iPhone 13 và iPhone 14"
- "Sản phẩm của Apple có bao nhiêu"
- "Muốn mua cái gì thì bạn gợi ý"
```

### **3. Tương Tác với Gợi Ý**

- Click vào **nút hành động** để tìm kiếm hoặc xem chi tiết
- Click **"Xem chi tiết"** trên thẻ sản phẩm để xem toàn bộ thông tin
- Sản phẩm được gợi ý sẽ tự động thêm vào theo dõi

### **4. Quản Lý Cuộc Trò Chuyện**

- **Làm mới** (`🔄`): Bắt đầu cuộc trò chuyện mới
- **Đóng** (`✕`): Đóng widget (vẫn lưu lịch sử)
- **Badge thông báo**: Hiển thị số tin nhắn mới chưa đọc

---

## 💾 CÁC API ENDPOINTS

### **1. Gửi Tin Nhắn**

```
POST /api/chatbot/chat

Request:
{
  "user_id": 123,
  "message": "Gợi ý laptop cho tôi",
  "context": {
    "conversationId": "abc-123",
    "previousMessages": []
  }
}

Response:
{
  "success": true,
  "intent": "PRODUCT_RECOMMENDATION",
  "response": {
    "text": "Dựa trên sở thích của bạn...",
    "recommendations": [
      {
        "label": "Tìm kiếm",
        "text": "Tìm laptop gaming",
        "action": "search"
      }
    ]
  },
  "timestamp": "2026-04-25T10:30:00.000Z"
}
```

### **2. Lấy Gợi Ý Sản Phẩm**

```
GET /api/chatbot/recommendations/:userId?type=multi&limit=10

Types:
- multi (default): Kết hợp tất cả chiến lược
- personalized: Gợi ý được cá nhân hóa
- collaborative: Từ những người dùng tương tự
- popular: Sản phẩm bán chạy
- new: Sản phẩm mới
- cart: Gợi ý dựa trên giỏ hàng
```

### **3. Lấy Hồ Sơ Người Dùng**

```
GET /api/chatbot/user-profile/:userId

Response:
{
  "success": true,
  "profile": {
    "behavior_stats": { ... },
    "user_intent": "PRODUCT_RECOMMENDATION",
    "preferred_categories": [...],
    "recent_searches": [...],
    "session_metrics": { ... }
  }
}
```

### **4. Sản Phẩm Thường Mua Cùng**

```
GET /api/chatbot/frequently-bought-together/:productId?limit=5
```

### **5. Tìm Người Dùng Tương Tự**

```
GET /api/chatbot/similar-users/:userId?limit=10
```

### **6. Lịch Sử Trò Chuyện**

```
GET /api/chatbot/chat-history/:userId?limit=50
```

### **7. Theo Dõi Gợi Ý**

```
POST /api/chatbot/track-recommendation-click

Request:
{
  "user_id": 123,
  "product_id": 456,
  "recommendation_source": "chatbot"
}
```

### **8. Tương Tác Chat**

```
POST /api/tracking/chat-interaction

Request:
{
  "message": "Gợi ý cho tôi",
  "intent": "PRODUCT_RECOMMENDATION",
  "user_id": 123,
  "conversationId": "abc-123"
}
```

---

## 🎨 TỰY CHỈNH CHATBOT

### **Tùy Chỉnh Cầu Hình**

Trong `public/chatbot.js`, bạn có thể tùy chỉnh:

```javascript
// Khởi tạo với cấu hình tùy chỉnh
const chatbot = new ChatbotWidget({
  title: "Trợ Lý Mua Sắm",
  subtitle: "Gợi ý sản phẩm thông minh",
  placeholder: "Nhập câu hỏi của bạn...",
  autoOpen: false, // Không tự động mở
  autoOpenDelay: 2000, // Chờ 2 giây rồi mở
  apiBaseUrl: "/api/chatbot", // URL API
  trackingUrl: "/api/tracking", // URL tracking
});
```

### **Tùy Chỉnh Màu Sắc (CSS)**

Trong `public/chatbot.css`, thay đổi các biến:

```css
:root {
  --chatbot-primary: #007bff; /* Màu chính */
  --chatbot-secondary: #0056b3; /* Màu phụ */
  --chatbot-light: #f8f9fa; /* Màu sáng */
  --chatbot-dark: #212529; /* Màu tối */
}
```

### **Sử Dụng Chatbot Trong Code**

```javascript
// Mở chatbot
window.chatbotWidget.openChat();

// Đóng chatbot
window.chatbotWidget.closeChat();

// Gửi tin nhắn tùy chỉnh
window.chatbotWidget.sendQuickMessage("Gợi ý laptop cho tôi");

// Lấy lịch sử trò chuyện
const history = window.chatbotWidget.getHistory();

// Xóa cuộc trò chuyện
window.chatbotWidget.clearConversation();

// Thêm gợi ý sản phẩm
window.chatbotWidget.addProductRecommendation({
  id: 123,
  name: "MacBook Pro",
  price: 50000000,
  image: "/img/macbook.jpg",
});

// Đặt thông điệp chào mừng
window.chatbotWidget.setWelcomeMessage(
  "Xin chào!",
  "Tôi là trợ lý mua sắm của bạn",
);
```

---

## 📊 CÁC BẢNG DỮ LIỆU

### **1. ChatHistory**

```sql
CREATE TABLE ChatHistory (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT,
  user_message NVARCHAR(MAX),
  bot_response NVARCHAR(MAX),
  intent NVARCHAR(50),
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES Users(id)
)
```

### **2. RecommendationLog**

```sql
CREATE TABLE RecommendationLog (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT,
  product_id INT,
  source NVARCHAR(50),           -- personalized, collaborative, etc.
  confidence DECIMAL(3,2),
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (product_id) REFERENCES Products(id)
)
```

### **3. SessionLogs**

```sql
CREATE TABLE SessionLogs (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT,
  session_id NVARCHAR(100),
  page NVARCHAR(255),
  total_interactions INT,
  session_duration INT,          -- seconds
  scroll_depth INT,              -- percentage
  device_type NVARCHAR(20),      -- desktop, mobile, tablet
  created_at DATETIME DEFAULT GETDATE()
)
```

---

## 🔧 KHẮC PHỤC SỰ CỐ

### **Chatbot không hiển thị**

1. Kiểm tra xem file `chatbot.css` và `chatbot.js` có được load không
2. Mở DevTools (F12) → Console để xem lỗi
3. Kiểm tra permission JavaScript

### **Tin nhắn không gửi được**

1. Kiểm tra API `/api/chatbot/chat` có hoạt động không
2. Mở Network tab → kiểm tra response
3. Kiểm tra backend có chạy không (port 3000)

### **Gợi ý không chính xác**

1. Hãy chắc chắn bạn đã login để có user_id
2. Tăng số lượng dữ liệu hành vi (xem thêm sản phẩm)
3. Kiểm tra logs để xác định ý định nào được nhận diện

### **Hiệu suất chậm**

1. Giảm `limit` trong các API call
2. Xóa lịch sử chat để giảm dữ liệu
3. Kiểm tra network connection

---

## 📈 THEO DÕI HIỆU SUẤT

### **Metrics Quan Trọng**

```javascript
// Lấy thống kê user
const profile = await fetch("/api/chatbot/user-profile/USER_ID").then((r) =>
  r.json(),
);

console.log({
  views: profile.profile.behavior_stats.total_views,
  clicks: profile.profile.behavior_stats.total_clicks,
  cartAdds: profile.profile.behavior_stats.total_cart_adds,
  purchases: profile.profile.behavior_stats.total_purchases,
  avgSessionDuration: profile.profile.session_metrics.avg_session_duration,
  avgScrollDepth: profile.profile.session_metrics.avg_scroll_depth,
});
```

### **Dashboard Analytics**

Bạn có thể xây dựng dashboard để theo dõi:

- Tổng số cuộc trò chuyện
- Ý định phổ biến nhất
- Tỉ lệ chuyển đổi (chat → purchase)
- Sản phẩm được gợi ý nhiều nhất
- Tỉ lệ hài lòng khách hàng

---

## 🔐 BẢO MẬT

### **Bảo Vệ Dữ Liệu**

- ✅ Lưu trữ an toàn: Tất cả dữ liệu được mã hóa trong database
- ✅ JWT Authentication: Chỉ người dùng đăng nhập mới được gợi ý cá nhân
- ✅ Rate Limiting: Giới hạn số lượng request để tránh spam
- ✅ Data Privacy: Không chia sẻ dữ liệu user với bên thứ ba

### **Thiết Lập Bảo Mật**

```javascript
// Kiểm tra xem user đã login chưa
if (!window.chatbotWidget.userId) {
  window.location.href = "/auth.html";
}

// Xóa dữ liệu khi logout
document.addEventListener("userLoggedOut", () => {
  window.chatbotWidget.clearConversation();
  localStorage.removeItem("chatbot_history");
});
```

---

## 🌟 TIP & TRICKS

### **Sử Dụng Hiệu Quả**

1. **Hỏi cụ thể hơn**
   - ❌ "Tìm điện thoại"
   - ✅ "Tìm điện thoại Samsung dưới 15 triệu"

2. **Sử dụng các từ khóa chính**
   - ❌ "Cái gì tốt không"
   - ✅ "Gợi ý laptop chơi game"

3. **So sánh sản phẩm**
   - ✅ "So sánh iPhone 14 Pro và Samsung S23"
   - ✅ "Cái nào rẻ hơn: MacBook hay Dell XPS"

4. **Tìm giá phù hợp**
   - ✅ "Laptop dưới 20 triệu"
   - ✅ "Tai nghe rẻ nhất"

---

## 📱 HỖ TRỢ MOBILE

Chatbot được tối ưu hóa cho mobile:

- Responsive design tự động điều chỉnh kích thước
- Touch-friendly buttons (48x48px minimum)
- Optimized keyboard layout
- Fast loading (< 2s)

---

## 📞 LIÊN HỆ HỖ TRỢ

Nếu gặp sự cố hoặc có câu hỏi:

- 📧 Email: support@nhom12.vn
- 💬 Chat: Sử dụng chatbot với ý định HELP
- 📱 Hotline: +888-256-666
- 🌐 Website: https://nhom12.vn

---

## 📝 LỊCH SỬ CẬP NHẬT

### **v2.0 - 25/04/2026 (Hiện Tại)**

- ✨ Tích hợp chatbot widget lên tất cả trang
- ✨ Hỗ trợ 8 loại ý định tìm kiếm
- ✨ 6 chiến lược gợi ý sản phẩm
- ✨ Lưu trữ lịch sử trò chuyện
- ✨ Theo dõi hành vi người dùng
- ✨ Responsive design & dark mode

### **v1.0 - 24/04/2026**

- ✨ Backend API endpoints
- ✨ Recommendation engine
- ✨ Behavior aggregation service

---

**🎉 Chúc bạn có trải nghiệm mua sắm tuyệt vời với Chatbot Trợ Lý Mua Sắm!**
