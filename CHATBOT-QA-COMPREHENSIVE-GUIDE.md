# Chatbot Q&A Capabilities - Hướng Dẫn Đầy Đủ

## 📋 Tổng Quan

Hệ thống chatbot đã được mở rộng với hơn **16 loại intent** và hỗ trợ trả lời các câu hỏi khác nhau từ khách hàng. Tích hợp **Ollama LLM** và **FAQ Knowledge Base** để cung cấp câu trả lời tự nhiên và chính xác.

---

## 🎯 Các Loại Intent (Ý Định) Được Hỗ Trợ

### 1. WARRANTY_QUERY - Hỏi về Bảo Hành

**Từ khóa**: bảo hành, warranty, bảo vệ, hỏng, lỗi, sự cố, thay thế

**Ví dụ câu hỏi**:

- "Sản phẩm có bảo hành không?"
- "Bảo hành mấy năm?"
- "Nếu hỏng thì sao?"

**Response từ chatbot**:

```json
{
  "text": "Sản phẩm có bảo hành 12-24 tháng chính hãng...",
  "support_contact": {
    "email": "support@thecuahang.com",
    "phone": "1900 1234"
  }
}
```

---

### 2. DELIVERY_QUERY - Hỏi về Giao Hàng

**Từ khóa**: giao hàng, delivery, ship, vận chuyển, bao lâu, thời gian giao

**Ví dụ câu hỏi**:

- "Giao hàng miễn phí không?"
- "Mất bao lâu để giao?"
- "Giao hôm nay được không?"

**Response từ chatbot**:

```json
{
  "text": "Giao hàng miễn phí từ 500k HN, 2M toàn quốc...",
  "delivery_info": {
    "free_shipping_hanoi": "≥500.000đ",
    "time_hanoi": "1-2 ngày"
  }
}
```

---

### 3. PAYMENT_QUERY - Hỏi về Thanh Toán

**Từ khóa**: thanh toán, payment, trả góp, credit, debit, e-wallet, ví điện tử

**Ví dụ câu hỏi**:

- "Có trả góp 0% không?"
- "Thanh toán bằng cách nào?"
- "Có chấp nhận Momo không?"

**Phương thức thanh toán được hỗ trợ**:

- Thanh toán khi nhận hàng (COD)
- Chuyển khoản ngân hàng
- Thẻ tín dụng / Thẻ ghi nợ
- Ví điện tử (Momo, Zalopay, Airpay)
- Trả góp 0% (AEON, HSBC)

---

### 4. RETURN_QUERY - Hỏi về Hoàn Trả

**Từ khóa**: hoàn trả, refund, trả lại, không hài lòng, return, đổi

**Ví dụ câu hỏi**:

- "Có hoàn trả hàng không?"
- "Hoàn trả trong bao lâu?"
- "Điều kiện hoàn trả là gì?"

**Chính sách hoàn trả**:

- 30 ngày hoàn trả
- Sản phẩm nguyên vẹn, chưa sử dụng
- Hoàn tiền trong 5-7 ngày

---

### 5. SPECIFICATION_QUERY - Hỏi về Thông Số

**Từ khóa**: thông số, spec, cấu hình, dung lượng, pin, màu sắc, kích thước

**Ví dụ câu hỏi**:

- "Sản phẩm này có những thông số gì?"
- "Pin bao lâu?"
- "Có mấy màu?"

**Response**:

- Hiển thị thông tin chi tiết của sản phẩm
- Link xem chi tiết đầy đủ

---

### 6. AVAILABILITY_QUERY - Hỏi về Hàng Có Sẵn

**Từ khóa**: có hàng, còn hàng, hết hàng, stock, available, sẵn không

**Ví dụ câu hỏi**:

- "Có hàng không?"
- "Còn mấy cái?"
- "Khi nào có hàng trở lại?"

**Response**:

- Kiểm tra số lượng hàng tồn
- Cập nhật trạng thái hàng

---

### 7. PROMOTION_QUERY - Hỏi về Khuyến Mãi

**Từ khóa**: khuyến mãi, sale, discount, giảm giá, coupon, voucher, mã, ưu đãi

**Ví dụ câu hỏi**:

- "Có code giảm giá không?"
- "Sale khi nào?"
- "Mã WELCOME10 là gì?"

**Mã giảm giá có sẵn**:

- `WELCOME10` - Giảm 10% cho khách lần đầu
- `MEMBER15` - Giảm 15% cho thành viên
- `FREESHIP50` - Miễn phí vận chuyển (đơn ≥50k)

---

### 8. ORDER_STATUS_QUERY - Hỏi về Trạng Thái Đơn Hàng

**Từ khóa**: đơn hàng, order, trạng thái, track, theo dõi, lịch sử mua

**Ví dụ câu hỏi**:

- "Đơn hàng tôi ở đâu?"
- "Cách kiểm tra trạng thái đơn hàng?"
- "Lịch sử mua hàng của tôi?"

**Response**:

- Truy vấn đơn hàng từ database
- Hiển thị 5 đơn hàng gần nhất
- Link theo dõi chi tiết

---

### 9. BRAND_QUERY - Hỏi về Thương Hiệu

**Từ khóa**: thương hiệu, brand, nhãn hiệu, apple, samsung, dell, etc.

**Ví dụ câu hỏi**:

- "Có sản phẩm Apple không?"
- "Brand nào bán chủ yếu?"
- "Hãng Samsung có gì?"

---

### 10. PURCHASE_INTENT - Ý Định Mua Hàng

**Từ khóa**: muốn mua, đặt hàng, checkout, order, mua ngay

**Ví dụ câu hỏi**:

- "Tôi muốn mua sản phẩm này"
- "Làm sao để đặt hàng?"
- "Thêm vào giỏ hàng"

---

### 11. PRODUCT_COMPARISON - So Sánh Sản Phẩm

**Từ khóa**: so sánh, compare, so với, khác biệt, nào tốt hơn

**Ví dụ câu hỏi**:

- "iPhone vs Samsung, cái nào tốt hơn?"
- "So sánh laptop A với laptop B"

---

### 12. PRODUCT_RECOMMENDATION - Gợi Ý Sản Phẩm

**Từ khóa**: gợi ý, recommend, suggest, nên mua, đề xuất

**Ví dụ câu hỏi**:

- "Gợi ý cho tôi sản phẩm"
- "Nên mua gì?"
- "Sản phẩm nào phù hợp?"

---

### 13. PRODUCT_SEARCH - Tìm Kiếm Sản Phẩm

**Từ khóa**: tìm, search, looking for, find, có ... không

**Ví dụ câu hỏi**:

- "Có laptop dưới 20 triệu không?"
- "Tìm điện thoại Samsung"

---

### 14. PRICE_QUERY - Hỏi về Giá

**Từ khóa**: giá, bao nhiêu, rẻ, đắt, khuyến mãi, sale

**Ví dụ câu hỏi**:

- "Giá bao nhiêu?"
- "Có rẻ hơn không?"

---

### 15. CATEGORY_BROWSE - Duyệt Danh Mục

**Từ khóa**: danh mục, category, loại, ngành hàng

**Ví dụ câu hỏi**:

- "Có danh mục nào?"
- "Laptop ở đâu?"

---

### 16. CONTACT_QUERY - Hỏi về Liên Hệ

**Từ khóa**: liên hệ, contact, gọi, email, số điện thoại, chat

**Thông tin liên hệ**:

- 📧 Email: support@thecuahang.com
- 📱 Phone: 1900 1234
- 💬 Zalo: 0912345678
- 🕐 Giờ: T2-T7 (8h-20h), CN (9h-18h)

---

### 17. FAQ_QUERY - Hỏi Câu Hỏi Thường Gặp

**Từ khóa**: câu hỏi, faq, thường gặp, cách, làm sao, như nào

**Response**: Tìm kiếm FAQ Knowledge Base và trả lời

---

### 18. HELP - Trợ Giúp

**Từ khóa**: help, giúp, hướng dẫn, support, trợ giúp, assist

**Response**: Menu trợ giúp với các tùy chọn

---

### 19. GENERAL_QUERY - Câu Hỏi Chung

Khi không detect được ý định cụ thể, sử dụng Ollama LLM để trả lời tự nhiên.

---

## 🔌 Ollama LLM Integration

### Cài Đặt Ollama

```bash
# Download từ ollama.ai
# Cài đặt theo hệ điều hành

# Start Ollama service
ollama serve

# Download model (nếu chưa có)
ollama pull llama3:latest

# Kiểm tra model
ollama list
```

### API Endpoints

```bash
# Test Ollama trực tiếp
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3:latest",
    "prompt": "Xin chào",
    "stream": false
  }'
```

### Cấu Hình trong Chatbot

File: `backend/services/ollama-service.js`

```javascript
// System prompt mặc định
static SYSTEM_PROMPT = `Bạn là một trợ lý mua sắm AI chuyên nghiệp...`;

// Tùy chọn response
const options = {
  model: "llama3:latest",
  temperature: 0.7,      // 0-1, cao hơn = sáng tạo hơn
  topK: 40,              // Số token top để chọn
  topP: 0.9,             // Nucleus sampling
  numPredict: 256,       // Max tokens sinh ra
  timeout: 30000         // Timeout 30 giây
};
```

---

## 📚 FAQ Knowledge Base

### Cấu Trúc FAQ

```javascript
{
  id: 1,
  question: "Làm sao để tạo tài khoản?",
  answer: "1. Nhấp 'Đăng ký'...",
  category: "Tài khoản",
  is_active: 1,
  views: 100,
  helpful_count: 85,
  created_at: "2026-04-25"
}
```

### Các Danh Mục FAQ

- Đặt hàng
- Giao hàng
- Thanh toán
- Hoàn trả & Hỗ trợ
- Bảo hành
- Khuyến mãi & Giảm giá
- Tài khoản & Hồ sơ
- Theo dõi đơn hàng

### API FAQ

```bash
# Lấy tất cả FAQ
GET /api/chatbot/faq?category=Đặt hàng&limit=20

# Lấy danh mục FAQ
GET /api/chatbot/faq/categories

# Tìm kiếm FAQ
GET /api/chatbot/faq/search?q=bảo hành&limit=5

# Đánh dấu hữu ích
POST /api/chatbot/faq/1/helpful

# Thêm FAQ mới (Admin)
POST /api/chatbot/faq/add
{
  "question": "...",
  "answer": "...",
  "category": "..."
}

# Cập nhật FAQ (Admin)
PUT /api/chatbot/faq/1
{
  "question": "...",
  "answer": "...",
  "category": "..."
}
```

---

## 🚀 Các API Endpoint Mới

### Health Check

```bash
GET /api/chatbot/health

Response:
{
  "success": true,
  "status": "healthy",
  "components": {
    "ollama": "ready",
    "database": "ready"
  }
}
```

### Test Ollama

```bash
POST /api/chatbot/ollama/test
{
  "message": "Xin chào"
}

Response:
{
  "success": true,
  "message": "Xin chào",
  "response": "Xin chào! Tôi là trợ lý...",
  "timestamp": "2026-04-25T10:30:00Z"
}
```

---

## 💬 Ví Dụ Sử Dụng

### Frontend (JavaScript)

```javascript
// Gửi tin nhắn
async function sendChatMessage(userId, message) {
  const response = await fetch("/api/chatbot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      message: message,
      context: { page: "shop" },
    }),
  });

  const data = await response.json();
  console.log("Intent:", data.intent);
  console.log("Response:", data.response.text);
  console.log("Products:", data.response.recommendations);
}

// Tìm kiếm FAQ
async function searchFAQ(query) {
  const response = await fetch(`/api/chatbot/faq/search?q=${query}`);
  const data = await response.json();
  return data.faqs;
}
```

### Backend (Node.js)

```javascript
const ChatbotService = require("./services/chatbot-service");
const FAQService = require("./services/faq-service");
const OllamaService = require("./services/ollama-service");

// Trích xuất intent
const intent = ChatbotService.extractIntent("Bảo hành bao lâu?");
// → "WARRANTY_QUERY"

// Tìm FAQ
const faqs = await FAQService.findRelevantFAQs("bảo hành");

// Gọi Ollama
const response = await OllamaService.generateResponse(
  "Tôi cần giúp gì?",
  "Danh sách sản phẩm...",
);
```

---

## 🧪 Testing

### Test Các Intent

```bash
# Test WARRANTY_QUERY
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Sản phẩm bảo hành bao lâu?"
  }'

# Test DELIVERY_QUERY
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Giao hàng mấy ngày?"
  }'

# Test PAYMENT_QUERY
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Có trả góp không?"
  }'
```

### Test FAQ

```bash
# Tìm kiếm FAQ
curl http://localhost:3000/api/chatbot/faq/search?q=bảo hành

# Lấy danh mục
curl http://localhost:3000/api/chatbot/faq/categories
```

---

## 📊 Monitoring & Analytics

### Theo Dõi Hiệu Suất

```javascript
// Tương tác được lưu tự động vào database
const interaction = {
  user_id: 1,
  intent: "WARRANTY_QUERY",
  message: "Bảo hành bao lâu?",
  response_time: 245,  // ms
  ollama_used: true,
  faq_matched: true,
  timestamp: new Date()
};

// FAQ tracking
- views: Số lần xem
- helpful_count: Số người đánh dấu hữu ích
```

---

## 🔒 Security & Best Practices

1. **Input Validation**: Tất cả input được validate trước xử lý
2. **SQL Injection**: Sử dụng parameterized queries
3. **Rate Limiting**: Giới hạn số request từ một IP
4. **Timeout**: Ollama requests có timeout 30 giây
5. **Error Handling**: Fallback responses khi Ollama không sẵn

---

## 🐛 Troubleshooting

### Ollama không kết nối

```bash
# Kiểm tra Ollama running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### Response quá chậm

- Giảm `numPredict` xuống 128
- Giảm `temperature` xuống 0.5
- Kiểm tra CPU/Memory

### FAQ không tìm thấy

- Chạy `FAQService.seedDefaultFAQs()`
- Kiểm tra category tồn tại

---

## 📝 Cập Nhật Tương Lai

- [ ] Multi-language support (English, Chinese)
- [ ] Voice chat integration
- [ ] Admin dashboard for FAQ management
- [ ] Sentiment analysis
- [ ] User satisfaction survey
- [ ] Advanced NLP with entity recognition
- [ ] Chatbot training with user feedback
- [ ] Integration với live agents

---

## 📞 Support

Liên hệ:

- Email: support@thecuahang.com
- Phone: 1900 1234
- Documentation: `/CHATBOT-QA-GUIDE.md`

---

**Version**: 1.0  
**Last Updated**: April 25, 2026  
**Status**: ✅ Production Ready
