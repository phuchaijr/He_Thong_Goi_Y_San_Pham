# Advanced Chatbot Intent Integration Guide

**Date:** April 29, 2026  
**Version:** 2.0 - Enhanced with 11 Advanced Intents  
**Language:** Vietnamese & English

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [11 Advanced Intents](#11-advanced-intents)
3. [API Endpoints](#api-endpoints)
4. [Implementation Guide](#implementation-guide)
5. [Example Requests & Responses](#example-requests--responses)
6. [Testing Guide](#testing-guide)
7. [Best Practices](#best-practices)

---

## Overview

This guide explains how to integrate and use 11 advanced intents in your chatbot system that provide sophisticated user need analysis, trend analysis, behavior insights, and personalized recommendations.

### New Features

- 🎯 **User Need Analysis** - Understand what users really need
- 📊 **Market Trend Analysis** - See what's trending
- 🔍 **Smart Search Refinement** - Help users narrow down choices
- ⚖️ **Priority-based Recommendations** - Adjust based on user preferences
- 🤖 **Intelligent Clarification** - Ask the right questions
- 🔮 **Future Need Prediction** - Anticipate future purchases
- 👥 **User Behavior Analysis** - Understand purchase patterns
- 🎁 **Cross-selling** - Suggest complementary products
- 🚀 **Up-selling** - Suggest premium alternatives
- 📈 **Explanation Engine** - Explain why products are recommended
- ❌ **Rejection Analysis** - Explain why products aren't recommended

---

## 11 Advanced Intents

### 1. **ANALYZE_USER_NEEDS** (Phân tích nhu cầu người dùng)

**Purpose:** Deeply analyze user behavior and suggest what they actually need

**Keywords:**

- "phân tích nhu cầu của tôi"
- "bạn nghĩ tôi cần gì"
- "bạn có thể giúp tôi hiểu nhu cầu không"
- "nên mua cái gì"
- "phù hợp với tôi không"

**Endpoint:**

```
POST /api/chatbot/analyze-needs/:userId
Body: {
  message: "Tôi không biết nên mua gì",
  context: {}
}
```

**Response:**

```json
{
  "success": true,
  "intent": "ANALYZE_USER_NEEDS",
  "analysis": {
    "text": "Dựa vào lịch sử của bạn...",
    "primary_need": "Regular Buyer",
    "event_frequency": {
      "view": 45,
      "click": 23,
      "purchase": 8
    },
    "engagement_level": "high",
    "recommendations": [...]
  }
}
```

**Primary Need Types:**

- `Regular Buyer` - User who purchases frequently
- `Research Phase` - User doing research before buying
- `Multi-Category Buyer` - User interested in many types
- `General Browser` - User just exploring

---

### 2. **REFINE_SEARCH** (Điều chỉnh tiêu chí tìm kiếm)

**Purpose:** Help users narrow down search results with better filters

**Keywords:**

- "hẹp hơn"
- "lọc"
- "chỉ muốn"
- "loại trừ"
- "không muốn"
- "tiêu chí"

**Endpoint:**

```
POST /api/chatbot/refine-search/:userId
Body: {
  message: "Chỉ muốn laptop từ Apple",
  previousProducts: [...],
  filters: {
    minPrice: 1000000,
    maxPrice: 50000000
  }
}
```

**Response:**

```json
{
  "success": true,
  "intent": "REFINE_SEARCH",
  "refined": {
    "text": "Tôi đã điều chỉnh tìm kiếm...",
    "refined_filters": {
      "minPrice": 1000000,
      "maxPrice": 50000000,
      "brands": ["apple"]
    },
    "recommendations": [...]
  }
}
```

**Supported Filters:**

- `minPrice` / `maxPrice` - Price range
- `categoryIds` - Product categories
- `minRating` - Minimum rating
- `brands` - Brand filters

---

### 3. **WEIGHT_PRIORITY_CHANGE** (Thay đổi ưu tiên)

**Purpose:** Let users change what they prioritize in recommendations

**Keywords:**

- "ưu tiên"
- "quan trọng nhất"
- "yếu tố chính"
- "độ ưu tiên"
- "thứ tự"

**Endpoint:**

```
POST /api/chatbot/change-priority/:userId
Body: {
  priorityChanges: {
    prioritize_price: true,
    prioritize_quality: false
  },
  currentRecommendations: [...]
}
```

**Available Weights:**

- `price` - 0-0.4
- `rating` - 0-0.4
- `popularity` - 0-0.4
- `newness` - 0-0.35
- `category_match` - 0-0.25

**Example Response:**

```json
{
  "success": true,
  "intent": "WEIGHT_PRIORITY_CHANGE",
  "result": {
    "text": "Tôi đã cập nhật ưu tiên...",
    "previous_weights": {...},
    "new_weights": {...},
    "recommendations": [...]
  }
}
```

---

### 4. **EXPLAIN_RECOMMENDATION** (Giải thích gợi ý)

**Purpose:** Provide detailed explanation for why a product is recommended

**Keywords:**

- "vì sao gợi ý"
- "tại sao chọn"
- "giải thích"
- "lý do"
- "có gì hay"

**Endpoint:**

```
GET /api/chatbot/explain-recommendation/:productId/:userId?source=personalized
```

**Response:**

```json
{
  "success": true,
  "intent": "EXPLAIN_RECOMMENDATION",
  "explanation": {
    "text": "Tôi gợi ý sản phẩm này vì...",
    "product": {
      "id": 123,
      "name": "MacBook Pro 14\"",
      "price": 45000000,
      "rating": 4.8
    },
    "recommendation_reasons": [
      {
        "reason": "Popular Choice",
        "description": "Sản phẩm này được nhiều khách hàng mua"
      },
      {
        "reason": "High Rating",
        "description": "Sản phẩm có đánh giá tốt từ người dùng"
      }
    ]
  }
}
```

**Recommendation Sources:**

- `personalized` - Based on user preferences
- `collaborative` - Based on similar users
- `popular` - Based on popularity
- `new` - New products
- `cart_based` - Based on cart items

---

### 5. **WHY_NOT_THIS_PRODUCT** (Vì sao không chọn sản phẩm)

**Purpose:** Explain why a product wasn't recommended

**Keywords:**

- "vì sao không gợi ý"
- "cái này sao không"
- "tại sao không"
- "có gì không tốt"
- "nhược điểm"

**Endpoint:**

```
GET /api/chatbot/why-not-product/:productId/:userId?message=...
```

**Response:**

```json
{
  "success": true,
  "intent": "WHY_NOT_THIS_PRODUCT",
  "rejection": {
    "text": "Dưới đây là lý do...",
    "product": {
      "id": 456,
      "name": "Samsung Galaxy Tab",
      "price": 25000000
    },
    "rejection_reasons": [
      {
        "reason": "Vượt quá ngân sách",
        "description": "Giá cao hơn mức bạn thường chi tiêu",
        "severity": "medium"
      }
    ],
    "alternatives": [...]
  }
}
```

**Rejection Severity Levels:**

- `high` - Important issue (out of stock)
- `medium` - Moderate issue (price, rating)
- `low` - Minor issue (category preference)

---

### 6. **TREND_ANALYSIS** (Phân tích xu hướng thị trường)

**Purpose:** Show market trends and what's popular

**Keywords:**

- "xu hướng"
- "hot"
- "trending"
- "phổ biến"
- "bán chạy"
- "mốt"
- "topx"

**Endpoint:**

```
GET /api/chatbot/trends?categoryId=5&timeRange=30days
```

**Time Ranges:**

- `7days` - Last 7 days
- `30days` - Last 30 days (default)
- `90days` - Last 90 days

**Response:**

```json
{
  "success": true,
  "intent": "TREND_ANALYSIS",
  "trends": {
    "text": "Đây là phân tích xu hướng...",
    "trending_products": [
      {
        "id": 101,
        "name": "iPhone 15 Pro",
        "price": 30000000,
        "interaction_count": 1250,
        "purchase_trend": 45
      }
    ],
    "trending_categories": [...],
    "price_distribution": [...]
  }
}
```

---

### 7. **PREDICT_FUTURE_NEED** (Dự đoán nhu cầu tương lai)

**Purpose:** Predict what users will need in the future

**Keywords:**

- "dự đoán"
- "tiếp theo"
- "lần sau"
- "trong tương lai"
- "sắp tới"
- "sẽ cần"

**Endpoint:**

```
GET /api/chatbot/predict-needs/:userId
```

**Response:**

```json
{
  "success": true,
  "intent": "PREDICT_FUTURE_NEED",
  "predictions": {
    "text": "Tôi dự đoán...",
    "predicted_needs": [
      {
        "type": "Sản phẩm thường mua",
        "description": "Dự kiến bạn sẽ mua hàng vào...",
        "confidence": 0.8
      }
    ],
    "complementary_products": [...],
    "prediction_confidence": 0.75
  }
}
```

---

### 8. **USER_BEHAVIOR_ANALYSIS** (Phân tích hành vi người dùng)

**Purpose:** Provide comprehensive analysis of user shopping behavior

**Keywords:**

- "phân tích hành vi"
- "thói quen"
- "xu hướng mua"
- "mô hình mua"
- "lịch sử"
- "engagement"

**Endpoint:**

```
GET /api/chatbot/behavior-analysis/:userId
```

**Response:**

```json
{
  "success": true,
  "intent": "USER_BEHAVIOR_ANALYSIS",
  "analysis": {
    "text": "Đây là phân tích chi tiết...",
    "behavior_summary": {
      "total_interactions": 156,
      "event_breakdown": [
        {
          "event_type": "view",
          "count": 98
        }
      ],
      "engagement_score": 78,
      "engagement_level": "Cao"
    },
    "favorite_categories": [...],
    "favorite_brands": [...]
  }
}
```

**Engagement Levels:**

- `Cao` (High) - score > 70
- `Trung bình` (Medium) - score > 40
- `Thấp` (Low) - score ≤ 40

---

### 9. **CROSS_SELLING** (Gợi ý bán chéo)

**Purpose:** Suggest complementary products from different categories

**Keywords:**

- "bổ sung"
- "kèm theo"
- "dùng cùng"
- "phối hợp"
- "phụ kiện"
- "bộ sưu tập"

**Endpoint:**

```
GET /api/chatbot/cross-selling/:userId?currentProduct=123
```

**Response:**

```json
{
  "success": true,
  "intent": "CROSS_SELLING",
  "recommendations": {
    "text": "Dưới đây là những sản phẩm bổ sung...",
    "co_purchased_products": [
      {
        "id": 501,
        "name": "MacBook Pro Stand",
        "category_name": "Accessories"
      }
    ],
    "complementary_products": [...]
  }
}
```

---

### 10. **UP_SELLING** (Gợi ý nâng cấp)

**Purpose:** Suggest premium or upgraded versions of a product

**Keywords:**

- "nâng cấp"
- "upgrade"
- "phiên bản cao hơn"
- "tốt hơn"
- "cao cấp hơn"
- "phiên bản pro"

**Endpoint:**

```
GET /api/chatbot/upsell/:userId/:productId?budget=50000000
```

**Response:**

```json
{
  "success": true,
  "intent": "UP_SELLING",
  "recommendations": {
    "text": "Bạn có thể xem xét những phiên bản nâng cấp...",
    "current_product": {
      "id": 100,
      "name": "MacBook Air 13\"",
      "price": 35000000
    },
    "premium_alternatives": [
      {
        "id": 200,
        "name": "MacBook Pro 14\"",
        "price": 45000000,
        "price_increase_percent": 29,
        "upsell_reason": "Premium"
      }
    ]
  }
}
```

---

### 11. **LOW_CONFIDENCE_CLARIFICATION** (Hỏi lại khi thiếu thông tin)

**Purpose:** Ask clarification questions when confidence is low

**Keywords:**

- "không hiểu"
- "mơ hồ"
- "cần biết thêm"
- "giải thích rõ"
- "cụ thể"

**Endpoint:**

```
POST /api/chatbot/clarify/:userId
Body: {
  message: "Tôi muốn...",
  context: {}
}
```

**Response:**

```json
{
  "success": true,
  "intent": "LOW_CONFIDENCE_CLARIFICATION",
  "clarification": {
    "text": "Tôi muốn hiểu rõ hơn nhu cầu của bạn...",
    "confidence_score": 0.35,
    "clarification_questions": [
      {
        "question": "Bạn đang tìm kiếm loại sản phẩm nào?",
        "type": "category"
      },
      {
        "question": "Ngân sách của bạn là bao nhiêu?",
        "type": "budget"
      },
      {
        "question": "Bạn ưu tiên yếu tố nào nhất?",
        "type": "priority"
      }
    ]
  }
}
```

---

## API Endpoints

### Endpoint Summary

| Method | Endpoint                                                 | Intent                       | Purpose                |
| ------ | -------------------------------------------------------- | ---------------------------- | ---------------------- |
| POST   | `/api/chatbot/analyze-needs/:userId`                     | ANALYZE_USER_NEEDS           | Analyze user needs     |
| POST   | `/api/chatbot/refine-search/:userId`                     | REFINE_SEARCH                | Refine search results  |
| POST   | `/api/chatbot/change-priority/:userId`                   | WEIGHT_PRIORITY_CHANGE       | Change priorities      |
| GET    | `/api/chatbot/explain-recommendation/:productId/:userId` | EXPLAIN_RECOMMENDATION       | Explain recommendation |
| GET    | `/api/chatbot/why-not-product/:productId/:userId`        | WHY_NOT_THIS_PRODUCT         | Explain rejection      |
| GET    | `/api/chatbot/trends`                                    | TREND_ANALYSIS               | Analyze trends         |
| GET    | `/api/chatbot/predict-needs/:userId`                     | PREDICT_FUTURE_NEED          | Predict future needs   |
| GET    | `/api/chatbot/behavior-analysis/:userId`                 | USER_BEHAVIOR_ANALYSIS       | Analyze behavior       |
| GET    | `/api/chatbot/cross-selling/:userId`                     | CROSS_SELLING                | Cross-sell products    |
| GET    | `/api/chatbot/upsell/:userId/:productId`                 | UP_SELLING                   | Upsell products        |
| POST   | `/api/chatbot/clarify/:userId`                           | LOW_CONFIDENCE_CLARIFICATION | Ask clarification      |

---

## Implementation Guide

### 1. Installation Requirements

```bash
# Backend already has:
- Node.js with Express
- SQL Server database
- Advanced services installed
```

### 2. Database Tables Needed

All required tables are already created by `init-chatbot-db.js`:

- `ChatHistory` - Chat messages
- `RecommendationLog` - Recommendation tracking
- `UserPreferences` - User priority preferences
- `UserInteractions` - User behavior tracking

### 3. Environment Variables

No additional environment variables needed. Uses existing database connection.

### 4. Frontend Integration

To use these features in your frontend:

```javascript
// Example: Analyze user needs
const analyzeNeeds = async (userId) => {
  const response = await fetch(`/api/chatbot/analyze-needs/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Phân tích nhu cầu của tôi",
      context: {},
    }),
  });
  return await response.json();
};

// Example: Get trends
const getTrends = async () => {
  const response = await fetch(
    "/api/chatbot/trends?categoryId=5&timeRange=30days",
  );
  return await response.json();
};

// Example: Predict future needs
const predictNeeds = async (userId) => {
  const response = await fetch(`/api/chatbot/predict-needs/${userId}`);
  return await response.json();
};
```

---

## Example Requests & Responses

### Example 1: User Analyzes Their Own Needs

**Request:**

```bash
curl -X POST http://localhost:3000/api/chatbot/analyze-needs/1 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi không biết nên mua gì",
    "context": {}
  }'
```

**Response:**

```json
{
  "success": true,
  "intent": "ANALYZE_USER_NEEDS",
  "analysis": {
    "text": "Dựa vào lịch sử mua sắm của bạn, tôi thấy bạn thường quan tâm đến các sản phẩm công nghệ...",
    "primary_need": "Regular Buyer",
    "analysis": {
      "event_frequency": {
        "view": 45,
        "click": 23,
        "purchase": 8
      },
      "engagement_level": "high"
    },
    "recommendations": [
      {
        "id": 101,
        "name": "MacBook Pro 14\"",
        "price": 45000000,
        "image_url": "...",
        "rating": 4.8
      }
    ]
  }
}
```

### Example 2: User Refines Search

**Request:**

```bash
curl -X POST http://localhost:3000/api/chatbot/refine-search/1 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Chỉ muốn từ Apple, giá dưới 40 triệu",
    "filters": {
      "maxPrice": 40000000,
      "brands": ["apple"]
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "intent": "REFINE_SEARCH",
  "refined": {
    "text": "Tôi đã điều chỉnh tìm kiếm với 3 kết quả phù hợp...",
    "refined_filters": {
      "maxPrice": 40000000,
      "brands": ["apple"]
    },
    "filter_explanation": "Thương hiệu: apple, đến 40,000,000₫",
    "recommendations": [...]
  }
}
```

### Example 3: View Trends

**Request:**

```bash
curl http://localhost:3000/api/chatbot/trends?categoryId=3&timeRange=7days
```

**Response:**

```json
{
  "success": true,
  "intent": "TREND_ANALYSIS",
  "trends": {
    "text": "Đây là phân tích xu hướng...",
    "trending_products": [
      {
        "id": 501,
        "name": "iPhone 15 Pro Max",
        "price": 35000000,
        "interaction_count": 1500,
        "trend_score": 0.95
      }
    ],
    "trending_categories": [...]
  }
}
```

---

## Testing Guide

### Test with cURL

```bash
# 1. Test Analyze Needs
curl -X POST http://localhost:3000/api/chatbot/analyze-needs/1 \
  -H "Content-Type: application/json" \
  -d '{"message": "Phân tích nhu cầu của tôi", "context": {}}'

# 2. Test Trends
curl http://localhost:3000/api/chatbot/trends

# 3. Test Behavior Analysis
curl http://localhost:3000/api/chatbot/behavior-analysis/1

# 4. Test Cross-Selling
curl http://localhost:3000/api/chatbot/cross-selling/1?currentProduct=100

# 5. Test Upsell
curl http://localhost:3000/api/chatbot/upsell/1/100
```

### Test with Postman

1. Create new collection "Advanced Intents"
2. Add requests for each endpoint
3. Set userId = 1 for testing
4. Run all requests

### Test in Frontend

Add buttons to test each intent:

```html
<button onclick="testAnalyzeNeeds()">Test Analyze Needs</button>
<button onclick="testTrends()">Test Trends</button>
<button onclick="testPrediction()">Test Prediction</button>
```

---

## Best Practices

### 1. User Context

Always provide context when possible:

```javascript
const context = {
  currentProduct: 100,
  previousInteractions: 45,
  sessionDuration: 300,
  deviceType: "mobile",
};
```

### 2. Error Handling

```javascript
try {
  const result = await fetch(`/api/chatbot/analyze-needs/${userId}`, {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
  if (!result.ok) throw new Error(result.statusText);
  return await result.json();
} catch (err) {
  console.error("Chatbot error:", err);
  // Fallback to general query
}
```

### 3. Caching Recommendations

```javascript
// Cache trend data for 1 hour
const trendCache = new Map();
const CACHE_DURATION = 3600000;

const getTrendsWithCache = async () => {
  const cached = trendCache.get("trends");
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const data = await fetch("/api/chatbot/trends").then((r) => r.json());
  trendCache.set("trends", { data, timestamp: Date.now() });
  return data;
};
```

### 4. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const requestCounts = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

const checkRateLimit = (userId) => {
  const count = requestCounts.get(userId) || 0;
  if (count >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error("Too many requests");
  }
  requestCounts.set(userId, count + 1);
  setTimeout(() => requestCounts.set(userId, 0), 60000);
};
```

### 5. Analytics Tracking

Track which intents are most used:

```javascript
const trackIntent = async (userId, intent, success) => {
  await fetch("/api/tracking/intent", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      intent,
      success,
      timestamp: new Date(),
    }),
  });
};
```

---

## Troubleshooting

### Issue: Low Confidence Responses

**Solution:** Provide more context in requests

```javascript
const context = {
  recentViewedProducts: [1, 2, 3],
  previousPurchases: [4, 5],
  currentCart: [6],
};
```

### Issue: Slow Trend Analysis

**Solution:** Use time range parameter and cache results

```javascript
GET /api/chatbot/trends?timeRange=7days // Faster than 90days
```

### Issue: Inaccurate Recommendations

**Solution:** Change priority weights

```javascript
POST / api / chatbot / change - priority / 1;
Body: {
  priorityChanges: {
    prioritize_quality: true;
  }
}
```

---

## Support & Resources

- **Documentation:** See `/CHATBOT-INTEGRATION-GUIDE.md`
- **Quick Start:** See `/CHATBOT-QUICK-START.md`
- **API Examples:** See test files in backend
- **Support Email:** support@thecuahang.com

---

## Version History

- **v2.0** (April 29, 2026) - Added 11 advanced intents
- **v1.0** (April 25, 2026) - Initial release with 8 basic intents

---

**Last Updated:** April 29, 2026  
**Maintained by:** Development Team
