# ✅ Hệ thống Thanh toán - Hoàn tất

## Tóm tắt Chức năng

Khi người dùng nhấn nút **"Thanh toán"** trong giỏ hàng:

1. ✅ **Cập nhật purchase_count** - Số lần mua của mỗi sản phẩm tăng
2. ✅ **Giảm stock** - Số lượng hàng trong kho giảm
3. ✅ **Track hành vi** - Ghi lại hành vi mua hàng vào database
4. ✅ **Xóa giỏ hàng** - Giỏ hàng được xóa sau khi thanh toán thành công

## 📁 Files Tạo/Cập nhật

### Backend

**Tạo: `backend/routes/checkout.routes.js`**

- POST `/api/checkout` - Xử lý thanh toán
  - Cập nhật purchase_count cho mỗi sản phẩm
  - Giảm stock cho mỗi sản phẩm
  - Track purchase event cho mỗi sản phẩm
  - Clear giỏ hàng của user

**Cập nhật: `backend/server.js`**

- Thêm import checkout routes
- Thêm route mount `/api/checkout`

### Frontend

**Cập nhật: `public/cart.js`**

- Thêm `checkout()` function
- Gọi `/api/checkout` API
- Xóa local cart
- Show success/error messages
- Track purchase events

**Cập nhật HTML Files (index, shop, brands, deals, weekly, smart-home)**

- Thêm `id="checkoutBtn"` cho button Thanh toán

## 🔌 API Endpoint

### POST /api/checkout

**Request:**

```json
{
  "user_id": 1,
  "cart_items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 5, "quantity": 1 }
  ]
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Thanh toán thành công",
  "total_items": 2,
  "processed_items": 2,
  "results": [
    {
      "product_id": 1,
      "success": true,
      "old_count": 5,
      "new_count": 7,
      "quantity_sold": 2,
      "new_stock": 48
    },
    {
      "product_id": 5,
      "success": true,
      "old_count": 10,
      "new_count": 11,
      "quantity_sold": 1,
      "new_stock": 19
    }
  ]
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Giỏ hàng trống"
}
```

## 🔄 Quy trình Thanh toán

```
User clicks "Thanh toán" button
│
├─ Frontend: Lấy giỏ hàng từ localStorage
├─ Frontend: Gọi POST /api/checkout
│
└─ Backend: Xử lý
   ├─ Kiểm tra giỏ hàng không rỗng
   ├─ Cho mỗi sản phẩm trong giỏ:
   │  ├─ Lấy thông tin sản phẩm
   │  ├─ Cập nhật purchase_count += quantity
   │  ├─ Cập nhật stock -= quantity
   │  └─ Ghi nhận tracking: purchase
   ├─ Clear giỏ hàng của user (nếu đăng nhập)
   └─ Trả về kết quả
│
├─ Frontend: Nhận response
├─ Frontend: Xóa local cart
├─ Frontend: Show success message
├─ Frontend: Track purchase events
└─ Frontend: Đóng cart overlay
```

## 📊 Database Changes

### Products Table Update

```sql
-- Ví dụ: Mua 2 iPhone 15
UPDATE Products
SET purchase_count = 7,  -- (cũ 5 + 2)
    stock = 48            -- (cũ 50 - 2)
WHERE id = 1;
```

### UserInteractions Insert

```sql
-- Ví dụ: Ghi nhận 2 lần mua
INSERT INTO UserInteractions (user_id, product_id, interaction_type, timestamp)
VALUES (123, 1, 'purchase', GETDATE());
INSERT INTO UserInteractions (user_id, product_id, interaction_type, timestamp)
VALUES (123, 1, 'purchase', GETDATE());
```

## 💻 Frontend Logic

### Checkout Process

```javascript
// 1. Lấy giỏ hàng
const cart = getCart(); // [{ id: 1, quantity: 2 }, ...]

// 2. Gọi API
const response = await fetch("/api/checkout", {
  method: "POST",
  body: JSON.stringify({
    user_id: userId,
    cart_items: [{ product_id: 1, quantity: 2 }],
  }),
});

// 3. Xử lý response
if (result.success) {
  localStorage.removeItem("cart"); // Xóa local cart
  alert("Thanh toán thành công!");
  closeCart();
}
```

### Auto Tracking

```javascript
// Sau khi thanh toán thành công
// Tracker tự động ghi nhận purchase events
if (typeof tracker !== "undefined") {
  for (const item of cart) {
    tracker.trackPurchase(item.id);
  }
}
```

## 📈 Ưu tiên & Best Practices

1. **Transaction Safety**
   - Tất cả sản phẩm được xử lý trong loop
   - Nếu 1 sản phẩm lỗi, sản phẩm khác vẫn được xử lý
   - Return chi tiết kết quả cho từng sản phẩm

2. **Stock Management**
   - Stock không được âm (nếu stock < 0 → set = 0)
   - Kiểm tra stock trước khi bán (có thể thêm)

3. **User Experience**
   - Hiển thị số sản phẩm được xử lý
   - Rõ ràng các sản phẩm nào thành công/thất bại
   - Auto clear cart chỉ nếu thanh toán thành công

4. **Tracking**
   - Mỗi unit được mua sẽ track 1 purchase event
   - Có thể phân tích được bao nhiêu unit bán được

## ✅ Testing

### Manual Test

```javascript
// 1. Mở DevTools Console
// 2. Add sản phẩm vào giỏ
tracker.trackAddToCart(1, 2);

// 3. Mở giỏ hàng
// 4. Click "Thanh toán"
// 5. Kiểm tra response
```

### Database Check

```sql
-- Kiểm tra purchase_count tăng
SELECT id, name, purchase_count, stock
FROM Products
WHERE id IN (1, 5)
ORDER BY id;

-- Kiểm tra tracking
SELECT * FROM UserInteractions
WHERE interaction_type = 'purchase'
ORDER BY timestamp DESC;
```

## 🔐 Security Notes

1. **User Validation** - Kiểm tra user_id từ token (có thể thêm)
2. **Stock Validation** - Kiểm tra stock trước bán (có thể thêm)
3. **Quantity Validation** - Kiểm tra quantity > 0 (có thể thêm)
4. **SQL Injection** - Hiện tại không safe, nên dùng parameterized queries (TODO)

## 🚀 Cách Sử dụng

### 1. Thêm sản phẩm vào giỏ

```javascript
tracker.trackAddToCart(1, 2); // Thêm 2 iPhone
```

### 2. Mở giỏ hàng

```
Click vào giỏ hàng icon
```

### 3. Nhấn "Thanh toán"

```
✅ Hệ thống sẽ:
- Cập nhật purchase_count
- Giảm stock
- Ghi nhận purchase events
- Xóa giỏ hàng
```

### 4. Kiểm tra kết quả

```sql
SELECT * FROM Products WHERE id = 1;
-- purchase_count tăng, stock giảm

SELECT * FROM UserInteractions
WHERE interaction_type = 'purchase';
-- Có purchase events mới
```

## 📝 Lưu ý

- Checkout API không yêu cầu authentication (user_id optional)
- Nếu user chưa đăng nhập, giỏ hàng vẫn được xóa sau checkout
- Purchase events chỉ được track nếu user_id có
- Anonymous purchases không được ghi vào UserInteractions

## 🔮 Features Có thể Thêm

1. ✅ Stock validation trước khi bán
2. ✅ Order history table
3. ✅ Payment gateway integration
4. ✅ Email confirmation
5. ✅ Delivery tracking
6. ✅ Return/Refund system
