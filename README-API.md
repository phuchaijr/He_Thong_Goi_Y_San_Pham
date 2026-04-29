# Nhóm 12 Shop - Product Recommendation System API

## Tổng quan

Hệ thống API backend cho ứng dụng thương mại điện tử Nhóm 12 Shop với tính năng gợi ý sản phẩm sử dụng RAG (Retrieval-Augmented Generation).

## Cơ sở dữ liệu

Database: `Nhom12Shop` trên SQL Server

### Các bảng chính:

1. **Users** - Thông tin người dùng
   - id, full_name, email, password_hash, role, phone, address, avatar, created_at, updated_at, is_active

2. **Categories** - Danh mục sản phẩm
   - id, name, slug, created_at

3. **Products** - Sản phẩm
   - id, name, price, description, image_url, purchase_count, stock, rating, review_count, category_id, created_at, updated_at

4. **UserCart** - Giỏ hàng
   - id, user_id, product_id, quantity, added_at

5. **ProductEmbeddings** - Vector embeddings cho RAG
   - id, product_id, embedding, embedding_text, created_at

6. **UserInteractions** - Tương tác người dùng cho personalization
   - id, user_id, product_id, interaction_type, timestamp

7. **SearchHistory** - Lịch sử tìm kiếm
   - id, user_id, query, results_count, timestamp

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`

Đăng ký tài khoản mới

```json
{
  "fullname": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### POST `/api/auth/login`

Đăng nhập

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Products (`/api/products`)

#### GET `/api/products`

Lấy tất cả sản phẩm

#### GET `/api/products/featured`

Lấy sản phẩm nổi bật (top 8 theo purchase_count)

#### GET `/api/products/deals`

Lấy sản phẩm khuyến mãi (top 12 mới nhất)

#### GET `/api/products/:id`

Lấy chi tiết sản phẩm theo ID

#### GET `/api/products/category/:categoryId`

Lấy sản phẩm theo danh mục

#### POST `/api/products`

Tạo sản phẩm mới

```json
{
  "name": "iPhone 15",
  "price": 999.99,
  "description": "Latest iPhone model",
  "image_url": "/img/iphone15.jpg",
  "stock": 50,
  "category_id": 1
}
```

#### PUT `/api/products/:id`

Cập nhật sản phẩm

#### DELETE `/api/products/:id`

Xóa sản phẩm

### Categories (`/api/categories`)

#### GET `/api/categories`

Lấy tất cả danh mục

#### GET `/api/categories/:id`

Lấy danh mục theo ID

#### GET `/api/categories/slug/:slug`

Lấy danh mục theo slug

#### POST `/api/categories`

Tạo danh mục mới

```json
{
  "name": "Điện thoại",
  "slug": "dien-thoai"
}
```

#### PUT `/api/categories/:id`

Cập nhật danh mục

#### DELETE `/api/categories/:id`

Xóa danh mục

### Cart (`/api/cart`)

#### GET `/api/cart`

Lấy tất cả items trong giỏ hàng

#### GET `/api/cart/user/:userId`

Lấy giỏ hàng của user

#### GET `/api/cart/:id`

Lấy item giỏ hàng theo ID

#### POST `/api/cart`

Thêm sản phẩm vào giỏ hàng

```json
{
  "user_id": 1,
  "product_id": 5,
  "quantity": 2
}
```

#### PUT `/api/cart/:id`

Cập nhật số lượng

```json
{
  "quantity": 3
}
```

#### DELETE `/api/cart/:id`

Xóa item khỏi giỏ hàng

#### DELETE `/api/cart/user/:userId/clear`

Xóa toàn bộ giỏ hàng của user

### Product Embeddings (`/api/embeddings`)

#### GET `/api/embeddings`

Lấy tất cả embeddings

#### GET `/api/embeddings/product/:productId`

Lấy embeddings của sản phẩm

#### GET `/api/embeddings/:id`

Lấy embedding theo ID

#### POST `/api/embeddings`

Tạo embedding mới

```json
{
  "product_id": 1,
  "embedding": "[0.1, 0.2, ...]",
  "embedding_text": "iPhone 15 Pro Max features..."
}
```

#### PUT `/api/embeddings/:id`

Cập nhật embedding

#### DELETE `/api/embeddings/:id`

Xóa embedding

### User Interactions (`/api/interactions`)

#### GET `/api/interactions`

Lấy tất cả tương tác

#### GET `/api/interactions/user/:userId`

Lấy tương tác của user

#### GET `/api/interactions/product/:productId`

Lấy tương tác của sản phẩm

#### GET `/api/interactions/type/:type`

Lấy tương tác theo loại (view, purchase, etc.)

#### POST `/api/interactions`

Tạo tương tác mới

```json
{
  "user_id": 1,
  "product_id": 5,
  "interaction_type": "view"
}
```

#### DELETE `/api/interactions/:id`

Xóa tương tác

### Search History (`/api/search`)

#### GET `/api/search`

Lấy tất cả lịch sử tìm kiếm

#### GET `/api/search/user/:userId`

Lấy lịch sử tìm kiếm của user

#### POST `/api/search`

Tạo entry lịch sử tìm kiếm

```json
{
  "user_id": 1,
  "query": "iPhone 15",
  "results_count": 10
}
```

#### DELETE `/api/search/:id`

Xóa entry lịch sử

#### DELETE `/api/search/user/:userId/clear`

Xóa lịch sử tìm kiếm của user

## Khởi chạy

1. Cài đặt dependencies:

```bash
npm install
```

2. Khởi tạo database:

```bash
npm run init-db
```

3. Chạy server:

```bash
npm start
```

4. Chạy server development:

```bash
npm run dev
```

## Environment Variables

Tạo file `.env` trong thư mục backend:

```env
DB_USER=nhom12user
DB_PASSWORD=123456
DB_SERVER=DESKTOP-CEOPGPT\SQLEXPRESS
DB_NAME=Nhom12Shop
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=3000
OPENAI_API_KEY=your_openai_api_key
```

## Cấu trúc thư mục

```
backend/
├── models.js          # Database models
├── db.js             # Database connection
├── init-db.js        # Database initialization
├── auth-system.js    # Authentication logic
├── server.js         # Main server file
├── routes/           # API routes
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── category.routes.js
│   ├── cart.routes.js
│   ├── embeddings.routes.js
│   ├── interactions.routes.js
│   ├── search.routes.js
│   └── tracking.routes.js
├── services/         # Business logic services
│   └── tracking-service.js
├── .env              # Environment variables
└── package.json
```

## Tracking API (`/api/tracking`)

### Hệ thống ghi lại hành vi người dùng

Toàn bộ hành vi người dùng được ghi lại vào database để sử dụng cho RAG personalization.

#### POST `/api/tracking/view-product`

Track xem sản phẩm

```json
{
  "product_id": 1
}
```

#### POST `/api/tracking/add-to-cart`

Track thêm vào giỏ hàng

```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### POST `/api/tracking/remove-from-cart`

Track xóa khỏi giỏ hàng

```json
{
  "product_id": 1
}
```

#### POST `/api/tracking/purchase`

Track mua hàng (cần đăng nhập)

```json
{
  "product_id": 1
}
```

#### POST `/api/tracking/search`

Track tìm kiếm

```json
{
  "query": "iPhone 15",
  "results_count": 10
}
```

#### POST `/api/tracking/product-click`

Track click vào sản phẩm

```json
{
  "product_id": 1
}
```

#### POST `/api/tracking/category-click`

Track click vào danh mục

```json
{
  "category_id": 1
}
```

#### POST `/api/tracking/wishlist`

Track thêm vào wishlist (cần đăng nhập)

```json
{
  "product_id": 1
}
```

#### POST `/api/tracking/rating`

Track đánh giá sản phẩm (cần đăng nhập)

```json
{
  "product_id": 1
}
```

#### GET `/api/tracking/activity/:userId`

Lấy tóm tắt hành vi người dùng

```json
{
  "success": true,
  "data": {
    "total_views": 5,
    "total_clicks": 3,
    "total_add_to_cart": 2,
    "total_purchases": 1,
    "total_wishlist": 1,
    "total_ratings": 0
  }
}
```

## Frontend Tracking Integration

### Sử dụng Tracking Manager

Tracking.js cung cấp global `tracker` object để track hành vi từ frontend:

```javascript
// Track xem sản phẩm
tracker.trackViewProduct(productId);

// Track thêm vào giỏ
tracker.trackAddToCart(productId, quantity);

// Track tìm kiếm
tracker.trackSearch(query, resultsCount);

// Track xóa khỏi giỏ
tracker.trackRemoveFromCart(productId);

// Track mua hàng (sau khi đăng nhập)
tracker.trackPurchase(productId);

// Track wishlist
tracker.trackWishlist(productId);

// Lấy activity summary
const summary = await tracker.getActivitySummary();
```

### Hoạt động tự động

- Khi người dùng click vào sản phẩm, hệ thống tự động track "view_product"
- Khi thêm vào giỏ, hệ thống tự động track "add_to_cart"
- Khi tìm kiếm, hệ thống tự động track "search" với query và số kết quả
- Khi xóa khỏi giỏ, hệ thống tự động track "remove_from_cart"

### User ID Tracking

- User ID được lấy từ localStorage (authData.user.id)
- Nếu không có user ID, hành vi vẫn được ghi lại (user_id = NULL)
- Sau khi đăng nhập, hãy gọi `tracker.setUserId(userId)` để cập nhật
