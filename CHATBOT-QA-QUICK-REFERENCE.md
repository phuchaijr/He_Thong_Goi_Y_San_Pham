# Chatbot Q&A - Quick Reference Card

## 🎯 16 Intent Types Supported

| Intent                 | Keywords                     | Example              |
| ---------------------- | ---------------------------- | -------------------- |
| WARRANTY_QUERY         | bảo hành, warranty, lỗi      | "Bảo hành bao lâu?"  |
| DELIVERY_QUERY         | giao hàng, ship, delivery    | "Giao bao lâu?"      |
| PAYMENT_QUERY          | thanh toán, trả góp, payment | "Có trả góp không?"  |
| RETURN_QUERY           | hoàn trả, return, refund     | "Hoàn trả như nào?"  |
| SPECIFICATION_QUERY    | thông số, spec, cấu hình     | "Thông số chi tiết?" |
| AVAILABILITY_QUERY     | có hàng, stock, available    | "Còn hàng không?"    |
| PROMOTION_QUERY        | khuyến mãi, sale, discount   | "Có sale không?"     |
| ORDER_STATUS_QUERY     | đơn hàng, order, track       | "Đơn hàng ở đâu?"    |
| BRAND_QUERY            | thương hiệu, brand, apple    | "Có Apple không?"    |
| PURCHASE_INTENT        | muốn mua, checkout, order    | "Mua sản phẩm này"   |
| PRODUCT_COMPARISON     | so sánh, compare             | "So sánh A vs B"     |
| PRODUCT_RECOMMENDATION | gợi ý, recommend             | "Gợi ý hàng tốt"     |
| PRODUCT_SEARCH         | tìm, search, find            | "Tìm laptop"         |
| PRICE_QUERY            | giá, bao nhiêu, rẻ           | "Giá bao nhiêu?"     |
| CATEGORY_BROWSE        | danh mục, category           | "Danh mục nào?"      |
| CONTACT_QUERY          | liên hệ, contact, gọi        | "Liên hệ cách nào?"  |
| FAQ_QUERY              | câu hỏi, faq, thường gặp     | "Câu hỏi phổ biến?"  |
| HELP                   | help, giúp, support          | "Giúp tôi"           |
| GENERAL_QUERY          | _Các câu hỏi khác_           | Sử dụng Ollama LLM   |

---

## 📡 Main API Endpoints

```
POST /api/chatbot/chat
├─ Gửi tin nhắn
├─ Return: intent, response, timestamp
└─ Body: { user_id, message, context }

GET /api/chatbot/faq
├─ Lấy FAQ
├─ Query: ?category=...&limit=20
└─ Return: [faqs]

GET /api/chatbot/faq/search?q=...
├─ Tìm kiếm FAQ
└─ Return: [matching_faqs]

GET /api/chatbot/health
├─ Check hệ thống
└─ Return: { status, components }

POST /api/chatbot/ollama/test
├─ Test Ollama
└─ Return: { response }
```

---

## 🎨 Response Structure

```javascript
{
  text: "Câu trả lời chính",
  recommendations: [{ id, name, price }],
  intent: "WARRANTY_QUERY",
  action: "add_to_cart",          // Optional
  faqs: [{question, answer}],     // Optional
  support_contact: {...},          // Optional
  delivery_info: {...},            // Optional
  payment_methods: [...],          // Optional
  source: "products|general|faq"   // Nguồn trả lời
}
```

---

## 🔧 Key Services

**ChatbotService**

- `extractIntent(message)` → Intent name
- `extractKeywords(message)` → [keywords]
- `findRelevantProducts(message)` → [products]
- `buildChatbotResponse(userId, message, intent)` → response

**FAQService**

- `getAllFAQs(category)` → [faqs]
- `findRelevantFAQs(question)` → [matched_faqs]
- `addFAQ(question, answer, category)` → faq_id
- `markFAQHelpful(id)` → success

**OllamaService**

- `generateResponse(message, context)` → ai_response
- `checkOllamaHealth()` → true|false
- `generateEmbedding(text)` → [embedding]

---

## 💾 Database Tables

- **ChatHistory** - Lưu trữ tin nhắn
- **FAQs** - Knowledge base
- **RecommendationLog** - Tracking gợi ý
- **RecommendationClickLog** - Click tracking

---

## 🚀 Quick Setup

```bash
# 1. Start Ollama
ollama serve

# 2. Install dependencies
cd backend && npm install

# 3. Initialize database
node init-chatbot-db.js

# 4. Start server
node server.js

# 5. Test
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"message":"Bảo hành bao lâu?"}'
```

---

## 🎯 Promotion Codes

```
WELCOME10  → 10% for first order
MEMBER15   → 15% for members
FREESHIP50 → Free shipping (≥50k)
```

---

## 📞 Contact Info Response

```json
{
  "email": "support@thecuahang.com",
  "phone": "1900 1234",
  "zalo": "0912345678",
  "facebook": "/thecuahang.official",
  "hours": "T2-T7: 8h-20h, CN: 9h-18h"
}
```

---

## 🧪 Common Test Cases

```bash
# Test intent detection
curl -X POST http://localhost:3000/api/chatbot/chat \
  -d '{"message":"Bảo hành bao lâu?"}' \
  -H "Content-Type: application/json"
# Expected: WARRANTY_QUERY

# Test FAQ search
curl "http://localhost:3000/api/chatbot/faq/search?q=thanh%20toán"

# Test Ollama
curl -X POST http://localhost:3000/api/chatbot/ollama/test \
  -d '{"message":"Xin chào"}' \
  -H "Content-Type: application/json"

# Test health
curl http://localhost:3000/api/chatbot/health
```

---

## ⚙️ Configuration

**Ollama Options** (in `ollama-service.js`)

```javascript
temperature: 0.7; // 0-1, cao hơn = sáng tạo
topK: 40; // Số top tokens
topP: 0.9; // Nucleus sampling
numPredict: 256; // Max output tokens
timeout: 30000; // 30 sec timeout
```

**Chat Widget Settings** (in `public/chatbot.js`)

```javascript
const CONFIG = {
  title: "Trợ Lý Mua Sắm",
  placeholder: "Hỏi gì đó...",
  autoOpen: false,
  width: 380,
  height: 600,
};
```

---

## 📈 Monitoring

- **FAQ Views**: Tracked automatically
- **Helpful Votes**: POST `/api/chatbot/faq/{id}/helpful`
- **Chat History**: Stored in ChatHistory table
- **Intent Distribution**: Analyze intent counts
- **Response Time**: Tracked in interactions

---

## 🐛 Troubleshooting

| Issue                 | Solution                                    |
| --------------------- | ------------------------------------------- |
| Ollama not connecting | `ollama serve` running?                     |
| Slow responses        | Reduce `numPredict`, increase `temperature` |
| No FAQ results        | Run `FAQService.seedDefaultFAQs()`          |
| Wrong intent          | Check keyword patterns in `extractIntent()` |

---

**Last Updated**: April 25, 2026  
**Version**: 1.0
