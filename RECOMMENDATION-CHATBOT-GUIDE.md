# 🤖 Hệ thống Gợi ý Sản phẩm với Chatbot - Hướng dẫn Toàn diện

## 📋 Tóm tắt Các Tối ưu hóa

Dự án đã được tối ưu hóa toàn diện để xây dựng một hệ thống gợi ý sản phẩm thông minh với chatbot. Dưới đây là các cải thiện chính:

### 1. **Services Tối ưu hóa (Backend)**

#### A. `behavior-aggregation-service.js`

Dịch vụ tổng hợp và phân tích hành vi người dùng:

- `calculateProductEngagementScore()` - Tính điểm tương tác sản phẩm dựa trên hành vi
  - View: 1 điểm
  - Click: 3 điểm
  - Add to Cart: 5 điểm
  - Purchase: 10 điểm
  - Wishlist: 8 điểm
  - Rating: 7 điểm

- `getUserPreferredCategories()` - Xác định danh mục ưa thích của người dùng
- `getUserBehaviorStats()` - Lấy thống kê hành vi chi tiết
- `getUserSearchHistory()` - Phân tích lịch sử tìm kiếm
- `analyzeSearchIntent()` - Xác định ý định tìm kiếm từ các truy vấn
- `findSimilarUsers()` - Tìm những người dùng tương tự (Collaborative Filtering)
- `getFrequentlyBoughtTogether()` - Tìm sản phẩm thường xuyên mua cùng nhau
- `calculateSessionMetrics()` - Tính metrics phiên làm việc
- `identifyUserIntent()` - Xác định mục tiêu/ý định của người dùng

#### B. `recommendation-engine.js`

Engine gợi ý sản phẩm sử dụng nhiều chiến lược:

- **Content-Based Filtering**: Gợi ý dựa trên danh mục ưa thích
- **Collaborative Filtering**: Gợi ý dựa trên người dùng tương tự
- **Hybrid Approach**: Kết hợp nhiều phương pháp

Các phương thức chính:

- `getPersonalizedRecommendations()` - Gợi ý được cá nhân hóa
- `getCollaborativeFilteringRecommendations()` - Collaborative Filtering
- `getFrequentlyBoughtTogetherRecommendations()` - Sản phẩm thường mua cùng
- `getPopularProducts()` - Sản phẩm phổ biến
- `getNewProductRecommendations()` - Sản phẩm mới
- `getCartBasedRecommendations()` - Gợi ý dựa trên giỏ hàng
- `getMultiChannelRecommendations()` - Gợi ý đa chiều (kết hợp tất cả)
- `calculateRecommendationConfidence()` - Tính độ tin cậy gợi ý

#### C. `chatbot-service.js`

Dịch vụ chatbot gợi ý sản phẩm:

- **Intent Detection**: Nhận biết 8 loại ý định khác nhau:
  - PRODUCT_RECOMMENDATION: "Gợi ý cho tôi..."
  - PRODUCT_SEARCH: "Tìm..."
  - PRODUCT_COMPARISON: "So sánh..."
  - CATEGORY_BROWSE: "Danh mục..."
  - PRICE_QUERY: "Giá bao nhiêu..."
  - PURCHASE_INTENT: "Muốn mua..."
  - BRAND_QUERY: "Thương hiệu..."
  - HELP: "Giúp tôi..."

- **Keyword Extraction**: Trích xuất từ khóa từ câu hỏi
- **Context Awareness**: Xem xét ngữ cảnh người dùng
- **Natural Response**: Tạo phản hồi tự nhiên

#### D. `enhanced-tracking-service.js`

Dịch vụ tracking nâng cao:

- Ghi lại chi tiết tất cả hành vi người dùng
- Lưu trữ session ID, thời gian trên trang, scroll depth
- Theo dõi thời gian từng tương tác
- Ghi lại dữ liệu thiết bị (mobile/tablet/desktop)
- Support batch tracking (gửi nhiều tương tác cùng lúc)

### 2. **Routes API Mới (Backend)**

#### `chatbot.routes.js`

Endpoints cho hệ thống chatbot:

```
POST   /api/chatbot/chat                           - Gửi tin nhắn và nhận gợi ý
GET    /api/chatbot/recommendations/:userId        - Lấy gợi ý sản phẩm
GET    /api/chatbot/user-profile/:userId           - Lấy hồ sơ hành vi người dùng
GET    /api/chatbot/frequently-bought-together/:productId - Sản phẩm thường mua cùng
GET    /api/chatbot/similar-users/:userId          - Tìm người dùng tương tự
GET    /api/chatbot/chat-history/:userId           - Lấy lịch sử trò chuyện
GET    /api/chatbot/engagement-score/:userId/:productId   - Điểm tương tác
POST   /api/chatbot/track-recommendation-click      - Theo dõi click gợi ý
```

### 3. **Frontend Tracking Nâng cao**

#### `tracking-advanced.js`

Tracking client-side toàn diện:

**Dữ liệu thu thập:**

- Session ID (định danh phiên làm việc)
- Thời gian trên trang
- Scroll Depth (độ sâu cuộn)
- Mouse movements (chuyển động chuột)
- Click count (số lần click)
- Device type (loại thiết bị)
- Time to action (thời gian thực hiện hành động)

**Phương thức Tracking:**

- `trackViewProduct()` - Với thời gian xem, scroll depth
- `trackAddToCart()` - Với kích thước giỏ trước
- `trackPurchase()` - Với dữ liệu đơn hàng
- `trackSearch()` - Với vị trí search, bộ lọc
- `trackInteraction()` - Tương tác chung
- `saveSessionData()` - Lưu dữ liệu phiên

### 4. **Cấu trúc Dữ liệu Tối ưu**

**Bảng chính:**

- **UserInteractions**: Lưu tất cả hành vi
- **SearchHistory**: Lịch sử tìm kiếm với chi tiết
- **ProductViewLog**: Log xem sản phẩm
- **SessionLogs**: Thống kê phiên làm việc
- **ChatHistory**: Lịch sử trò chuyện chatbot
- **RecommendationLog**: Log gợi ý được hiển thị
- **RecommendationClickLog**: Log click vào gợi ý

---

## 🚀 Hướng dẫn Cài đặt

### 1. Cài đặt Packages (nếu chưa có)

```bash
npm install
```

### 2. Cập nhật Database Schema

Chạy script cập nhật database để tạo các bảng mới:

```bash
node backend/init-db.js
```

### 3. Update Tracking Script trong HTML

Thay đổi từ:

```html
<script src="tracking.js"></script>
```

Sang:

```html
<script src="tracking-advanced.js"></script>
```

### 4. Khởi động Server

```bash
node backend/server.js
```

Server sẽ chạy trên `http://localhost:3000`

---

## 💬 Cách Sử dụng Chatbot API

### 1. Gửi Tin nhắn

```javascript
fetch("/api/chatbot/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: 1,
    message: "Gợi ý cho tôi laptop tốt nhất",
    context: {},
  }),
})
  .then((r) => r.json())
  .then((data) => console.log(data));
```

**Response:**

```json
{
  "success": true,
  "intent": "PRODUCT_RECOMMENDATION",
  "response": {
    "message": "Tôi tìm thấy 5 sản phẩm phù hợp...",
    "type": "recommendation",
    "products": [...],
    "confidence": 0.95
  }
}
```

### 2. Lấy Gợi ý Sản phẩm

```javascript
// Multi-channel recommendations
fetch("/api/chatbot/recommendations/1?type=multi&limit=10");

// Personalized only
fetch("/api/chatbot/recommendations/1?type=personalized&limit=5");

// Collaborative Filtering
fetch("/api/chatbot/recommendations/1?type=collaborative&limit=5");
```

### 3. Lấy Hồ sơ Người dùng

```javascript
fetch("/api/chatbot/user-profile/1")
  .then((r) => r.json())
  .then((profile) => {
    console.log("Thống kê hành vi:", profile.profile.behavior_stats);
    console.log("Danh mục ưa thích:", profile.profile.preferred_categories);
    console.log("Từ khóa tìm kiếm:", profile.profile.recent_searches);
  });
```

---

## 📊 Chiến lược Gợi ý

### 1. **Content-Based Filtering**

- Dựa trên danh mục sản phẩm
- Gợi ý sản phẩm từ danh mục người dùng thích
- Công thức:
  ```
  Score = (View_Count * 1) + (Purchase_Count * 10) + (Rating * 2)
  ```

### 2. **Collaborative Filtering**

- Tìm người dùng có hành vi tương tự
- Gợi ý sản phẩm mà những người tương tự đã mua
- Công thức tương đồng người dùng:
  ```
  Similarity = (Common_Products * 5) + (Common_Purchases * 20)
  ```

### 3. **Frequently Bought Together**

- Phân tích các sản phẩm thường mua cùng nhau
- Công thức:
  ```
  Correlation = (Co_Purchase_Count / User_Purchase_Count) * 100
  ```

### 4. **Multi-Channel Hybrid**

- Kết hợp các chiến lược:
  - 40% Personalized
  - 20% Collaborative Filtering
  - 20% Popular Products
  - 10% New Products
  - 10% Cart-Based

---

## 🔍 Intent Detection Examples

```javascript
// Gợi ý sản phẩm
"Gợi ý cho tôi cái gì" → PRODUCT_RECOMMENDATION

// Tìm kiếm
"Tìm laptop gaming dưới 20 triệu" → PRODUCT_SEARCH

// So sánh
"So sánh iPhone 15 và Samsung S24" → PRODUCT_COMPARISON

// Danh mục
"Có danh mục nào mới không?" → CATEGORY_BROWSE

// Giá
"Sản phẩm nào rẻ nhất?" → PRICE_QUERY

// Mua hàng
"Tôi muốn mua cái này" → PURCHASE_INTENT

// Thương hiệu
"Có sản phẩm Apple nào không?" → BRAND_QUERY

// Giúp đỡ
"Bạn có thể giúp tôi không?" → HELP
```

---

## 📈 Metrics Quan trọng

### Engagement Score (Điểm Tương tác)

Công thức tính điểm tương tác của người dùng với sản phẩm:

```
Score = (Views × 1) + (Clicks × 3) + (AddToCart × 5) + (Purchases × 10) + (Wishlist × 8) + (Rating × 7)
```

### Recommendation Confidence (Độ Tin cậy Gợi ý)

```
Base Confidence = 0.5
+ 0.2 if Purchase_Count > 10
+ 0.15 if Rating >= 4.5
+ 0.15 if Total_Interactions > 100
= Final Confidence (max 1.0)
```

### User Similarity (Tương đồng Người dùng)

```
Similarity = (Common_Products × 5) + (Common_Purchases × 20)
```

---

## 🔐 Bảo mật & Performance

### Rate Limiting

- Giới hạn: 500 requests/15 phút cho /api/\*

### Data Security

- Sử dụng Helmet.js cho HTTP headers
- Input validation & sanitization
- CORS enabled

### Performance Optimization

- Query caching cho dữ liệu thống kê
- Batch tracking (gộp nhiều events)
- Session-based tracking để giảm DB queries
- Indexed columns: user_id, product_id, event_type, created_at

---

## 📝 Lợi Ích của Hệ thống

### ✅ Cho người dùng:

- Gợi ý sản phẩm cá nhân hóa
- Chatbot thông minh hỗ trợ 24/7
- Tìm kiếm và so sánh sản phẩm dễ dàng
- Tiết kiệm thời gian mua sắm

### ✅ Cho doanh nghiệp:

- Tăng tỷ lệ chuyển đổi (conversion rate)
- Tăng giá trị đơn hàng trung bình (AOV)
- Phân tích hành vi người dùng chi tiết
- Dự đoán xu hướng mua sắm
- Cải thiện trải nghiệm khách hàng

### ✅ Cho phát triển:

- Kiến trúc modular dễ mở rộng
- Services riêng biệt dễ bảo trì
- API RESTful chuẩn
- Documented cấu trúc dữ liệu

---

## 🛠 Các Bước Tiếp theo

### Phase 2 - Nâng cao

1. **Machine Learning Recommendation**
   - Sử dụng TensorFlow.js hoặc Python ML models
   - Collaborative filtering advanced
   - Neural network-based recommendations

2. **Real-time Chatbot**
   - WebSocket cho real-time chat
   - Queue system cho high-load scenarios

3. **Analytics Dashboard**
   - Thống kê hành vi người dùng
   - Heatmaps & user flow analysis
   - Conversion funnel tracking

4. **A/B Testing**
   - Test các chiến lược gợi ý khác nhau
   - Optimize recommendation algorithms

---

## 📚 Tài liệu Thêm

- Database Schema: `TRACKING-IMPLEMENTATION.md`
- Checkout System: `CHECKOUT-IMPLEMENTATION.md`
- API Reference: `README-API.md`

---

## 👨‍💻 Support & Maintenance

**Để bắt đầu:**

```bash
npm install
node backend/init-db.js
node backend/server.js
```

**Để test chatbot:**

- Mở Postman
- POST to `http://localhost:3000/api/chatbot/chat`
- Body:

```json
{
  "user_id": 1,
  "message": "Gợi ý cho tôi sản phẩm"
}
```

---

## 📞 Liên hệ & Feedback

Mọi câu hỏi hoặc đề xuất, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**Cập nhật cuối cùng:** April 24, 2026
**Phiên bản:** 2.0 (Chatbot & Recommendation System)
