# ✅ Hệ thống Tracking Hành vi Người dùng - Hoàn tất

## Tóm tắt Công việc

Đã tạo hệ thống tracking hoàn chỉnh để ghi lại tất cả hành vi người dùng trên web vào database.

## 📁 Files Tạo ra

### Backend

1. **backend/services/tracking-service.js** - Service xử lý tracking logic
   - `trackViewProduct()` - Track xem sản phẩm
   - `trackAddToCart()` - Track thêm vào giỏ
   - `trackRemoveFromCart()` - Track xóa khỏi giỏ
   - `trackPurchase()` - Track mua hàng
   - `trackSearch()` - Track tìm kiếm
   - `trackProductClick()` - Track click sản phẩm
   - `trackCategoryClick()` - Track click danh mục
   - `trackWishlist()` - Track wishlist
   - `trackRating()` - Track đánh giá
   - `getUserActivitySummary()` - Lấy tóm tắt hành vi

2. **backend/routes/tracking.routes.js** - API Endpoints
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

### Frontend

3. **public/tracking.js** - Client-side Tracking Manager
   - Global `tracker` object
   - Gọi API tracking từ frontend
   - Quản lý user_id
   - Xử lý offline tracking

### Documentation

4. **TRACKING-GUIDE.md** - Hướng dẫn sử dụng tracking
   - Cách hoạt động
   - Các hành vi được track
   - Ví dụ thực tế
   - SQL queries

5. **README-API.md** - Cập nhật với Tracking API section

## 🔄 Files Cập nhật

### Backend

1. **backend/server.js**
   - Thêm `const trackingRoutes = require("./routes/tracking.routes");`
   - Thêm `app.use("/api/tracking", trackingRoutes);`

### Frontend

2. **public/index.html** - Thêm `<script src="tracking.js"></script>`
3. **public/shop.html** - Thêm `<script src="tracking.js"></script>`
4. **public/brands.html** - Thêm `<script src="tracking.js"></script>`
5. **public/deals.html** - Thêm `<script src="tracking.js"></script>`
6. **public/weekly.html** - Thêm `<script src="tracking.js"></script>`
7. **public/smart-home.html** - Thêm `<script src="tracking.js"></script>`

### Script Files

8. **public/script.js**
   - Cập nhật `addToCart()` - Thêm `tracker.trackAddToCart()`
   - Cập nhật `searchProducts()` - Thêm `tracker.trackSearch()`

9. **public/cart.js**
   - Cập nhật remove button handler - Thêm `tracker.trackRemoveFromCart()`

10. **public/shop.js**
    - Cập nhật `addToCart()` - Thêm `tracker.trackAddToCart()`
    - Cập nhật `attachProductClickListeners()` - Thêm `tracker.trackViewProduct()`
    - Cập nhật `searchProducts()` - Thêm `tracker.trackSearch()`

## 📊 Dữ liệu Được Track

### Hành vi Ghi lại

| Hành vi        | Loại             | Bảng             | User_id Yêu cầu |
| -------------- | ---------------- | ---------------- | --------------- |
| Xem sản phẩm   | view             | UserInteractions | Không           |
| Click sản phẩm | click            | UserInteractions | Không           |
| Thêm vào giỏ   | add_to_cart      | UserInteractions | Không           |
| Xóa khỏi giỏ   | remove_from_cart | UserInteractions | Không           |
| Mua hàng       | purchase         | UserInteractions | Có              |
| Thêm wishlist  | wishlist         | UserInteractions | Có              |
| Đánh giá       | rate             | UserInteractions | Có              |
| Click danh mục | view_category    | UserInteractions | Không           |
| Tìm kiếm       | -                | SearchHistory    | Không           |

## 🔌 API Endpoints

### Tracking Endpoints

```
POST   /api/tracking/view-product      - Track xem sản phẩm
POST   /api/tracking/add-to-cart       - Track thêm vào giỏ
POST   /api/tracking/remove-from-cart  - Track xóa khỏi giỏ
POST   /api/tracking/purchase          - Track mua hàng
POST   /api/tracking/search            - Track tìm kiếm
POST   /api/tracking/product-click     - Track click sản phẩm
POST   /api/tracking/category-click    - Track click danh mục
POST   /api/tracking/wishlist          - Track wishlist
POST   /api/tracking/rating            - Track đánh giá
GET    /api/tracking/activity/:userId  - Lấy tóm tắt hành vi
```

## 📱 Frontend Usage

### Tự động Tracking (Không cần code thêm)

- Khi click vào sản phẩm → Tự động track "view"
- Khi click "Thêm vào giỏ" → Tự động track "add_to_cart"
- Khi tìm kiếm → Tự động track "search"
- Khi xóa khỏi giỏ → Tự động track "remove_from_cart"

### Manual Tracking (Dùng khi cần)

```javascript
// Xem sản phẩm
tracker.trackViewProduct(productId);

// Thêm vào giỏ
tracker.trackAddToCart(productId, quantity);

// Xóa khỏi giỏ
tracker.trackRemoveFromCart(productId);

// Tìm kiếm
tracker.trackSearch(query, resultsCount);

// Mua hàng (sau khi đăng nhập)
tracker.trackPurchase(productId);

// Wishlist
tracker.trackWishlist(productId);

// Đánh giá
tracker.trackRating(productId);

// Lấy activity summary
const summary = await tracker.getActivitySummary();
```

## 💾 Database Schema

### UserInteractions Table

```sql
id INT PRIMARY KEY IDENTITY(1,1),
user_id INT,                      -- Nullable
product_id INT NOT NULL,
interaction_type NVARCHAR(50),    -- view, click, add_to_cart, etc.
timestamp DATETIME DEFAULT GETDATE(),
FOREIGN KEY (user_id) REFERENCES Users(id),
FOREIGN KEY (product_id) REFERENCES Products(id)
```

### SearchHistory Table

```sql
id INT PRIMARY KEY IDENTITY(1,1),
user_id INT,                      -- Nullable
query NVARCHAR(255) NOT NULL,
results_count INT DEFAULT 0,
timestamp DATETIME DEFAULT GETDATE(),
FOREIGN KEY (user_id) REFERENCES Users(id)
```

## 🚀 Cách Sử dụng

### 1. Khởi động Server

```bash
cd h:\He_Thong_Goi_Y_San_Pham\backend
node server.js
```

### 2. Test Tracking

```javascript
// Trong browser console
tracker.trackViewProduct(1);
tracker.trackAddToCart(1, 2);
tracker.trackSearch("iPhone", 5);
```

### 3. Kiểm tra Database

```sql
SELECT * FROM UserInteractions ORDER BY timestamp DESC;
SELECT * FROM SearchHistory ORDER BY timestamp DESC;
```

## 📈 Sử dụng cho RAG

Dữ liệu tracking được dùng để:

1. **Personalized Recommendations** - Gợi ý sản phẩm dựa trên hành vi
2. **Search Enhancement** - Tối ưu hóa kết quả tìm kiếm
3. **Behavior Analysis** - Phân tích xu hướng người dùng
4. **Hot Products** - Xác định sản phẩm phổ biến

## ✨ Features

- ✅ Tracking tự động cho tất cả hành vi
- ✅ Support anonymous users (user_id = NULL)
- ✅ Real-time data collection
- ✅ Activity summary API
- ✅ Search history tracking
- ✅ User interaction analytics
- ✅ Easy to extend

## 🔐 Privacy & Security

- Tracking vẫn hoạt động cho users không đăng nhập
- Sensitive data không được ghi nhận
- User_id từ JWT token khi có sẵn
- Compliant với privacy best practices

## 📝 Lưu ý

- Tracking.js phải load trước script.js, cart.js, shop.js
- User ID được lấy tự động từ localStorage
- Sau khi đăng nhập, gọi `tracker.setUserId(userId)`
- Các endpoint tracking không yêu cầu authentication (except purchase, wishlist, rating)
  fix
  for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %a
