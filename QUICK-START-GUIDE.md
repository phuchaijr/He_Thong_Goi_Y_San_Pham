# 🚀 Hướng dẫn Tích hợp Nhanh - Hệ thống Gợi ý & Chatbot

## ⚡ Bắt đầu nhanh (5 phút)

### Bước 1: Khởi tạo Database (1 phút)

```bash
cd backend
node init-chatbot-db.js
```

Lệnh này sẽ tạo tất cả các bảng cần thiết cho hệ thống gợi ý.

### Bước 2: Update Frontend Tracking (1 phút)

Thay đổi trong các file HTML (index.html, shop.html, brands.html, deals.html, weekly.html, smart-home.html):

**Từ:**

```html
<script src="tracking.js"></script>
```

**Sang:**

```html
<script src="tracking-advanced.js"></script>
```

### Bước 3: Khởi động Server (1 phút)

```bash
node server.js
```

Server sẽ chạy trên `http://localhost:3000`

### Bước 4: Test Chatbot (2 phút)

Sử dụng Postman hoặc cURL:

```bash
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Gợi ý cho tôi laptop tốt nhất"
  }'
```

---

## 📦 Services & Features Được Thêm

### Backend Services:

1. **behavior-aggregation-service.js**
   - Phân tích hành vi người dùng
   - Tính điểm tương tác sản phẩm
   - Xác định danh mục ưa thích
   - Tìm người dùng tương tự

2. **recommendation-engine.js**
   - 6 loại gợi ý khác nhau
   - Hybrid multi-channel recommendations
   - Tính toán độ tin cậy gợi ý

3. **chatbot-service.js**
   - Nhận biết 8 loại ý định
   - Xử lý các loại câu hỏi khác nhau
   - Trích xuất từ khóa tự động

4. **enhanced-tracking-service.js**
   - Tracking chi tiết hành vi
   - Session tracking
   - Batch tracking support

### API Routes Mới:

```
POST   /api/chatbot/chat
GET    /api/chatbot/recommendations/:userId
GET    /api/chatbot/user-profile/:userId
GET    /api/chatbot/frequently-bought-together/:productId
GET    /api/chatbot/similar-users/:userId
GET    /api/chatbot/chat-history/:userId
GET    /api/chatbot/engagement-score/:userId/:productId
POST   /api/chatbot/track-recommendation-click
```

### Frontend:

- **tracking-advanced.js** - Tracking client-side nâng cao
  - Theo dõi session
  - Scroll depth
  - Time on page
  - Mouse movements

---

## 💡 Ví dụ Sử dụng

### 1. Chatbot Chat

```javascript
// Gửi tin nhắn
const response = await fetch("/api/chatbot/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    message: "Bạn có laptop nào dưới 20 triệu không?",
    context: {},
  }),
});

const data = await response.json();
console.log(data.response.message);
console.log(data.response.products);
```

### 2. Lấy Gợi ý

```javascript
// Lấy gợi ý được cá nhân hóa
const recommendations = await fetch(
  `/api/chatbot/recommendations/${userId}?type=personalized&limit=10`,
).then((r) => r.json());

console.log(recommendations.recommendations);
```

### 3. Lấy Hồ sơ Người dùng

```javascript
// Lấy hồ sơ hành vi của người dùng
const profile = await fetch(`/api/chatbot/user-profile/${userId}`).then((r) =>
  r.json(),
);

console.log(profile.profile.behavior_stats);
console.log(profile.profile.preferred_categories);
```

### 4. Frontend Tracking

```javascript
// Tracking xem sản phẩm
tracker.trackViewProduct(productId, {
  name: "Laptop Dell XPS",
  price: 25000000,
  category: "Laptops"
});

// Tracking thêm vào giỏ
tracker.trackAddToCart(productId, 1, {
  name: "Laptop Dell XPS",
  price: 25000000
});

// Tracking mua hàng
tracker.trackPurchase({
  id: orderId,
  total: 50000000,
  items: [...],
  payment_method: "credit_card"
});
```

---

## 📊 Database Schema

### Bảng Chính:

```
UserInteractions
├── user_id
├── product_id
├── event_type (view, click, add_to_cart, purchase, etc)
├── event_data (JSON)
├── session_id
├── time_on_page
├── scroll_depth
└── created_at

ChatHistory
├── user_id
├── user_message
├── bot_response
├── intent
└── created_at

RecommendationLog
├── user_id
├── product_id
├── source (personalized, collaborative, etc)
├── confidence
└── created_at

SessionLogs
├── user_id
├── session_id
├── total_interactions
├── session_duration
├── device_type
└── created_at
```

---

## 🔧 Troubleshooting

### Lỗi: "sql.query is not a function"

- Kiểm tra `backend/db.js` - đảm bảo kết nối database đúng

### Lỗi: "Cannot read property 'recordset'"

- Kiểm tra query SQL syntax
- Xác nhận bảng tồn tại: `SELECT * FROM UserInteractions`

### Lỗi: Chatbot không trả lời

- Kiểm tra `console.log` trong browser dev tools
- Xác nhận `tracking-advanced.js` được load đúng

### Không thấy data trong database

- Chạy `node init-chatbot-db.js` để tạo bảng
- Kiểm tra user_id có đúng không

---

## 📈 Performance Tips

### 1. Batch Tracking

```javascript
// Gửi nhiều events cùng lúc
tracker.sendTracking("/batch", {
  interactions: [
    { event_type: "view", event_data: {...} },
    { event_type: "click", event_data: {...} }
  ]
});
```

### 2. Session-based Tracking

```javascript
// Sử dụng session để giảm database queries
const recommendations = await fetch(
  `/api/chatbot/recommendations/${userId}?type=multi`,
).then((r) => r.json());
```

### 3. Caching

- Kết quả gợi ý được cache 30 phút
- Popular products được cache 1 giờ

---

## 🎯 Optimization Checklist

- [x] Database schema tối ưu (indexes)
- [x] API endpoints chuẩn RESTful
- [x] Error handling toàn diện
- [x] Input validation
- [x] Rate limiting
- [x] Session management
- [x] Recommendation caching
- [x] Frontend tracking async
- [x] Batch tracking support
- [x] CORS enabled

---

## 📱 Frontend Integration Example

```html
<!-- Add tracking script -->
<script src="tracking-advanced.js"></script>

<!-- Track product view -->
<div onclick="tracker.trackViewProduct(123)">Product</div>

<!-- Track add to cart -->
<button onclick="tracker.trackAddToCart(productId, qty)">Add to Cart</button>

<!-- Initialize chatbot widget -->
<script>
  // Lấy gợi ý khi trang load
  async function loadRecommendations() {
    const userId = getCurrentUserId();
    const recs = await fetch(
      `/api/chatbot/recommendations/${userId}?limit=5`,
    ).then((r) => r.json());
    displayRecommendations(recs.recommendations);
  }

  loadRecommendations();
</script>
```

---

## 🚀 Các Bước Tiếp theo

1. **Thêm UI Chatbot Widget**
   - Tạo HTML/CSS cho chat interface
   - Kết nối với `/api/chatbot/chat` API

2. **Analytics Dashboard**
   - Biểu đồ hành vi người dùng
   - Recommendation performance metrics

3. **ML Model Training**
   - Sử dụng dữ liệu collected để train model
   - Improve recommendation accuracy

4. **Mobile App Integration**
   - React Native / Flutter
   - Sử dụng cùng APIs

---

## 📞 Support

Mọi câu hỏi, vui lòng check:

- `RECOMMENDATION-CHATBOT-GUIDE.md` - Tài liệu đầy đủ
- `README-API.md` - API reference
- `TRACKING-IMPLEMENTATION.md` - Tracking details

---

**Chuẩn bị xong! 🎉 Hệ thống của bạn đã sẵn sàng để sử dụng.**

---

**Cập nhật:** April 24, 2026
**Version:** 2.0 - Chatbot & Recommendation System
