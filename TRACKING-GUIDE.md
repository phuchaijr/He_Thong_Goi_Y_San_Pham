# Hướng dẫn Tracking Hành vi Người dùng

## Tổng quan

Hệ thống Nhóm 12 Shop trang bị đầy đủ chức năng tracking hành vi người dùng. Tất cả hành vi như:

- Xem sản phẩm
- Thêm vào giỏ hàng
- Tìm kiếm
- Mua hàng
- Thêm vào wishlist
- Đánh giá sản phẩm

...được ghi lại vào database để sử dụng cho RAG personalization.

## Cách hoạt động

### 1. Frontend Tracking (tracking.js)

File `tracking.js` cung cấp `TrackingManager` class toàn cầu với tên là `tracker`:

```javascript
// Đã có sẵn trong tất cả pages
tracker.trackViewProduct(productId);
tracker.trackAddToCart(productId, quantity);
tracker.trackSearch(query, resultsCount);
tracker.trackRemoveFromCart(productId);
tracker.trackPurchase(productId);
tracker.trackWishlist(productId);
tracker.trackRating(productId);
```

### 2. Backend Tracking Service

File `backend/services/tracking-service.js` xử lý tất cả tracking logic:

```javascript
const TrackingService = require("./services/tracking-service");

// Tracking sản phẩm được xem
await TrackingService.trackViewProduct(userId, productId);

// Tracking thêm vào giỏ
await TrackingService.trackAddToCart(userId, productId, quantity);

// Tracking tìm kiếm
await TrackingService.trackSearch(userId, query, resultsCount);
```

### 3. Tracking API Routes

File `backend/routes/tracking.routes.js` cung cấp API endpoints:

- POST `/api/tracking/view-product`
- POST `/api/tracking/add-to-cart`
- POST `/api/tracking/remove-from-cart`
- POST `/api/tracking/purchase`
- POST `/api/tracking/search`
- POST `/api/tracking/product-click`
- POST `/api/tracking/category-click`
- POST `/api/tracking/wishlist`
- POST `/api/tracking/rating`
- GET `/api/tracking/activity/:userId`

## Các hành vi được track

### 1. View Product (Xem sản phẩm)

**Khi nào:** Khi người dùng click vào sản phẩm để xem chi tiết
**Interaction Type:** `view`

```javascript
tracker.trackViewProduct(productId);
```

### 2. Add to Cart (Thêm vào giỏ)

**Khi nào:** Khi người dùng click nút "Thêm vào giỏ"
**Interaction Type:** `add_to_cart`

```javascript
tracker.trackAddToCart(productId, quantity);
```

### 3. Remove from Cart (Xóa khỏi giỏ)

**Khi nào:** Khi người dùng click nút xóa trong giỏ hàng
**Interaction Type:** `remove_from_cart`

```javascript
tracker.trackRemoveFromCart(productId);
```

### 4. Purchase (Mua hàng)

**Khi nào:** Khi người dùng hoàn tất mua hàng
**Interaction Type:** `purchase`
**Yêu cầu:** Phải đăng nhập

```javascript
tracker.trackPurchase(productId);
```

### 5. Search (Tìm kiếm)

**Khi nào:** Khi người dùng thực hiện tìm kiếm
**Interaction Type:** `search` (lưu vào SearchHistory)

```javascript
tracker.trackSearch(query, resultsCount);
```

### 6. Product Click (Click sản phẩm)

**Khi nào:** Khi người dùng click link sản phẩm
**Interaction Type:** `click`

```javascript
tracker.trackProductClick(productId);
```

### 7. Category Click (Click danh mục)

**Khi nào:** Khi người dùng click vào danh mục
**Interaction Type:** `view_category`

```javascript
tracker.trackCategoryClick(categoryId);
```

### 8. Wishlist (Danh sách yêu thích)

**Khi nào:** Khi người dùng thêm vào wishlist
**Interaction Type:** `wishlist`
**Yêu cầu:** Phải đăng nhập

```javascript
tracker.trackWishlist(productId);
```

### 9. Rating (Đánh giá)

**Khi nào:** Khi người dùng đánh giá sản phẩm
**Interaction Type:** `rate`
**Yêu cầu:** Phải đăng nhập

```javascript
tracker.trackRating(productId);
```

## Dữ liệu được lưu

### UserInteractions Table

```sql
{
  id: INT,                           -- ID duy nhất
  user_id: INT,                      -- ID người dùng (nullable nếu không đăng nhập)
  product_id: INT,                   -- ID sản phẩm
  interaction_type: NVARCHAR(50),   -- Loại hành vi (view, click, add_to_cart, etc.)
  timestamp: DATETIME                -- Thời gian hành vi
}
```

**Interaction Types:**

- `view` - Xem sản phẩm
- `click` - Click vào sản phẩm
- `view_category` - Xem danh mục
- `add_to_cart` - Thêm vào giỏ
- `remove_from_cart` - Xóa khỏi giỏ
- `purchase` - Mua hàng
- `wishlist` - Thêm vào wishlist
- `rate` - Đánh giá

### SearchHistory Table

```sql
{
  id: INT,                           -- ID duy nhất
  user_id: INT,                      -- ID người dùng (nullable)
  query: NVARCHAR(255),              -- Từ khóa tìm kiếm
  results_count: INT,                -- Số kết quả tìm được
  timestamp: DATETIME                -- Thời gian tìm kiếm
}
```

## Sử dụng dữ liệu Tracking

### 1. Lấy Activity Summary của User

```javascript
const summary = await tracker.getActivitySummary();
// Trả về: {
//   total_views: 5,
//   total_clicks: 3,
//   total_add_to_cart: 2,
//   total_purchases: 1,
//   total_wishlist: 1,
//   total_ratings: 0
// }
```

### 2. Lấy tất cả hành vi của user

```javascript
GET /api/interactions/user/:userId
```

### 3. Lấy hành vi theo loại

```javascript
GET / api / interactions / type / view; // Tất cả view
GET / api / interactions / type / purchase; // Tất cả purchase
GET / api / interactions / type / add_to_cart; // Tất cả thêm vào giỏ
```

### 4. Lấy lịch sử tìm kiếm

```javascript
GET /api/search/user/:userId
```

### 5. Lấy hành vi của sản phẩm

```javascript
GET /api/interactions/product/:productId
// Lấy tất cả user nào đã interact với sản phẩm này
```

## Tích hợp với RAG

Dữ liệu tracking được sử dụng để:

1. **Personalized Recommendations**
   - Xem lịch sử xem sản phẩm của user
   - Xem lịch sử mua của user
   - Khuyến nghị sản phẩm tương tự

2. **Search Enhancement**
   - Lưu query tìm kiếm phổ biến
   - Phân tích xu hướng tìm kiếm
   - Tối ưu hóa kết quả tìm kiếm

3. **User Behavior Analysis**
   - Phân tích hành vi người dùng
   - Xác định sản phẩm hot
   - Tối ưu hóa UX

## Ví dụ Thực tế

### Scenario 1: Người dùng xem sản phẩm

```
User clicks vào iPhone 15
├─ Frontend gọi: tracker.trackViewProduct(1)
├─ Gửi POST /api/tracking/view-product {product_id: 1}
└─ Backend: INSERT INTO UserInteractions (user_id, product_id, interaction_type)
   VALUES (123, 1, 'view')
```

### Scenario 2: Người dùng tìm kiếm

```
User nhập "iPhone" vào search box
├─ Frontend gọi: tracker.trackSearch("iPhone", 5)
├─ Gửi POST /api/tracking/search {query: "iPhone", results_count: 5}
└─ Backend: INSERT INTO SearchHistory (user_id, query, results_count)
   VALUES (123, "iPhone", 5)
```

### Scenario 3: Người dùng thêm vào giỏ

```
User clicks "Thêm vào giỏ" trên iPhone 15
├─ Frontend gọi: tracker.trackAddToCart(1, 1)
├─ Gửi POST /api/tracking/add-to-cart {product_id: 1, quantity: 1}
└─ Backend: INSERT INTO UserInteractions (user_id, product_id, interaction_type)
   VALUES (123, 1, 'add_to_cart')
```

## Privacy & Best Practices

1. **Anonymous Tracking**
   - Tracking vẫn hoạt động cho users không đăng nhập (user_id = NULL)
   - Dữ liệu được ghi lại nhưng không liên kết trực tiếp

2. **Data Retention**
   - Giữ dữ liệu tracking lâu dài cho phân tích
   - Xóa dữ liệu cũ theo chính sách bảo mật

3. **Security**
   - User_id được lấy từ token JWT khi có sẵn
   - Không ghi nhận sensitive information

## Debugging

### Kiểm tra Tracking hoạt động

```javascript
// Trong console của trình duyệt
console.log(tracker); // Xem object tracker
tracker.trackViewProduct(1); // Test manual tracking
```

### Xem dữ liệu trong Database

```sql
-- Lấy tất cả hành vi của user 1
SELECT * FROM UserInteractions WHERE user_id = 1 ORDER BY timestamp DESC;

-- Lấy tất cả tìm kiếm
SELECT * FROM SearchHistory ORDER BY timestamp DESC;

-- Top sản phẩm được xem
SELECT product_id, COUNT(*) as view_count
FROM UserInteractions
WHERE interaction_type = 'view'
GROUP BY product_id
ORDER BY view_count DESC;

-- Top sản phẩm được mua
SELECT product_id, COUNT(*) as purchase_count
FROM UserInteractions
WHERE interaction_type = 'purchase'
GROUP BY product_id
ORDER BY purchase_count DESC;
```

## Tương lai

Tracking data sẽ được sử dụng để:

- Xây dựng ML models cho recommendations
- Phân tích user behavior patterns
- Optimize product placement & pricing
- Improve search & discovery
