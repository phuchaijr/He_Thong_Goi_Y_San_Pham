# Advanced Intents - Quick Reference Guide

**Version:** 2.0 | **Date:** April 29, 2026

---

## 🎯 Intent Overview

| #   | Intent                           | Keywords                             | Endpoint                                                     | Purpose                        |
| --- | -------------------------------- | ------------------------------------ | ------------------------------------------------------------ | ------------------------------ |
| 1   | **ANALYZE_USER_NEEDS**           | "phân tích", "nhu cầu", "bạn nghĩ"   | `POST /api/chatbot/analyze-needs/:userId`                    | Analyze what users really need |
| 2   | **REFINE_SEARCH**                | "hẹp hơn", "lọc", "tiêu chí"         | `POST /api/chatbot/refine-search/:userId`                    | Help narrow down choices       |
| 3   | **WEIGHT_PRIORITY_CHANGE**       | "ưu tiên", "quan trọng"              | `POST /api/chatbot/change-priority/:userId`                  | Adjust recommendation weights  |
| 4   | **EXPLAIN_RECOMMENDATION**       | "vì sao gợi ý", "tại sao chọn"       | `GET /api/chatbot/explain-recommendation/:productId/:userId` | Why recommend this             |
| 5   | **WHY_NOT_THIS_PRODUCT**         | "vì sao không", "có gì không tốt"    | `GET /api/chatbot/why-not-product/:productId/:userId`        | Why not recommend              |
| 6   | **TREND_ANALYSIS**               | "xu hướng", "hot", "phổ biến"        | `GET /api/chatbot/trends`                                    | Market trends                  |
| 7   | **PREDICT_FUTURE_NEED**          | "dự đoán", "tiếp theo", "sắp tới"    | `GET /api/chatbot/predict-needs/:userId`                     | Future purchases               |
| 8   | **USER_BEHAVIOR_ANALYSIS**       | "hành vi", "thói quen", "engagement" | `GET /api/chatbot/behavior-analysis/:userId`                 | Behavior analysis              |
| 9   | **CROSS_SELLING**                | "bổ sung", "phụ kiện", "kèm theo"    | `GET /api/chatbot/cross-selling/:userId`                     | Complementary products         |
| 10  | **UP_SELLING**                   | "nâng cấp", "upgrade", "cao cấp hơn" | `GET /api/chatbot/upsell/:userId/:productId`                 | Premium alternatives           |
| 11  | **LOW_CONFIDENCE_CLARIFICATION** | "không hiểu", "cần biết thêm"        | `POST /api/chatbot/clarify/:userId`                          | Ask clarification              |

---

## 📌 Key Endpoints

### Analyze Needs

```bash
POST /api/chatbot/analyze-needs/1
{
  "message": "Phân tích nhu cầu của tôi",
  "context": {}
}
```

### Refine Search

```bash
POST /api/chatbot/refine-search/1
{
  "message": "Chỉ muốn Apple, giá dưới 40tr",
  "filters": {
    "brands": ["apple"],
    "maxPrice": 40000000
  }
}
```

### Change Priority

```bash
POST /api/chatbot/change-priority/1
{
  "priorityChanges": {
    "prioritize_price": true
  }
}
```

### View Trends

```bash
GET /api/chatbot/trends?timeRange=7days&categoryId=3
```

### Predict Needs

```bash
GET /api/chatbot/predict-needs/1
```

### Behavior Analysis

```bash
GET /api/chatbot/behavior-analysis/1
```

### Cross-Selling

```bash
GET /api/chatbot/cross-selling/1?currentProduct=100
```

### Up-Selling

```bash
GET /api/chatbot/upsell/1/100?budget=50000000
```

### Clarify

```bash
POST /api/chatbot/clarify/1
{
  "message": "Tôi muốn...",
  "context": {}
}
```

---

## 🔧 Frontend Integration

### Load Advanced Intents Support

```html
<script src="/advanced-intents-support.js"></script>
```

### Use in Chatbot Widget

```javascript
// Example 1: Analyze needs
const analysis = await AdvancedIntentsSupport.analyzeUserNeeds(chatbot);
chatbot.displayMessage(analysis, "bot");

// Example 2: Get trends
const trends = await AdvancedIntentsSupport.analyzeTrends(chatbot, 3, "7days");
chatbot.displayMessage(trends, "bot");

// Example 3: Predict needs
const predictions = await AdvancedIntentsSupport.predictFutureNeeds(chatbot);
chatbot.displayMessage(predictions, "bot");
```

---

## 📊 Intent Detection

The chatbot automatically detects these intents from user messages:

```javascript
const intent = ChatbotService.extractIntent(userMessage);
// Returns: ANALYZE_USER_NEEDS | REFINE_SEARCH | etc.
```

### Auto-Detection Examples

- "Phân tích nhu cầu của tôi" → `ANALYZE_USER_NEEDS`
- "Chỉ muốn từ Apple" → `REFINE_SEARCH`
- "Ưu tiên giá rẻ" → `WEIGHT_PRIORITY_CHANGE`
- "Tại sao chọn cái này?" → `EXPLAIN_RECOMMENDATION`
- "Xu hướng hiện tại?" → `TREND_ANALYSIS`

---

## 💾 Database Support

**Required Tables:** (Auto-created by `init-chatbot-db.js`)

- `ChatHistory` - Chat messages
- `RecommendationLog` - Recommendation tracking
- `UserPreferences` - User priority weights
- `UserInteractions` - Behavior tracking

---

## 🎨 CSS Classes

For styling advanced intent results:

```css
.advanced-intent-result {
}
.intent-label {
}
.result-content {
}
.trend-details {
}
.behavior-details {
}
.clarification-questions {
}
.recommendation-item {
}
.rejection-reasons {
}
.reason-item {
}
.reason-item.severity-high {
}
```

---

## ✅ Testing Checklist

- [ ] All 11 intents are recognized by `extractIntent()`
- [ ] Backend endpoints return correct data structure
- [ ] Frontend displays results properly
- [ ] Cross-domain requests work with CORS
- [ ] Rate limiting prevents abuse
- [ ] Analytics tracking works
- [ ] Mobile responsive design maintained
- [ ] Error handling for all scenarios

---

## 🐛 Common Issues & Solutions

| Issue                        | Solution                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| Intent not recognized        | Add keywords to pattern or use LOW_CONFIDENCE_CLARIFICATION |
| Slow response                | Use appropriate timeRange parameter or cache results        |
| Low recommendation quality   | Use WEIGHT_PRIORITY_CHANGE to adjust weights                |
| Frontend not loading results | Check CORS, verify API endpoints, check console             |
| Database errors              | Verify tables exist via `init-chatbot-db.js`                |

---

## 📈 Response Structure

All endpoints follow this structure:

```json
{
  "success": true,
  "intent": "INTENT_NAME",
  "data": {
    "text": "Response text",
    "recommendations": [...],
    "additional_fields": "..."
  }
}
```

---

## 🚀 Performance Tips

1. **Cache Trends** - Cache for 1 hour
2. **Lazy Load** - Load only when needed
3. **Pagination** - Use limit parameter
4. **Index DB Fields** - User ID, Product ID
5. **Rate Limit** - Max 10 requests/min per user

---

## 📚 Files Modified/Created

### New Files

- `backend/services/advanced-intent-handler.js` - Core logic
- `public/advanced-intents-support.js` - Frontend support
- `ADVANCED-INTENTS-GUIDE.md` - Full documentation

### Modified Files

- `backend/services/chatbot-service.js` - Added intent patterns
- `backend/routes/chatbot.routes.js` - Added 11 endpoints

---

## 🔗 Related Documentation

- Full Guide: [ADVANCED-INTENTS-GUIDE.md](ADVANCED-INTENTS-GUIDE.md)
- Chatbot Guide: [CHATBOT-INTEGRATION-GUIDE.md](CHATBOT-INTEGRATION-GUIDE.md)
- Quick Start: [CHATBOT-QUICK-START.md](CHATBOT-QUICK-START.md)

---

## 📞 Support

- **Email:** support@thecuahang.com
- **Documentation:** `/ADVANCED-INTENTS-GUIDE.md`
- **Examples:** Backend test files

---

**Last Updated:** April 29, 2026
