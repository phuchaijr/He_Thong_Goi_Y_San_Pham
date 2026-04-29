/**
 * Test Chatbot Service
 * Kiểm tra xem chatbot có hoạt động đúng không
 */

const ChatbotService = require("./services/chatbot-service");

// Test cases
const testCases = [
  {
    message: "Gợi ý cho tôi một số sản phẩm",
    expectedIntent: "PRODUCT_RECOMMENDATION",
  },
  {
    message: "Tôi muốn tìm laptop",
    expectedIntent: "PRODUCT_SEARCH",
  },
  {
    message: "So sánh iPhone 15 và Samsung S24",
    expectedIntent: "PRODUCT_COMPARISON",
  },
  {
    message: "Laptop giá bao nhiêu?",
    expectedIntent: "PRICE_QUERY",
  },
  {
    message: "Có sản phẩm Apple nào không?",
    expectedIntent: "BRAND_QUERY",
  },
  {
    message: "Danh mục nào có laptop?",
    expectedIntent: "CATEGORY_BROWSE",
  },
  {
    message: "Tôi muốn mua một chiếc máy tính",
    expectedIntent: "PURCHASE_INTENT",
  },
  {
    message: "Giúp tôi cái gì với chatbot này?",
    expectedIntent: "HELP",
  },
  {
    message: "Xin chào",
    expectedIntent: "GENERAL_QUERY",
  },
];

console.log("🧪 Testing Chatbot Service\n");
console.log("=".repeat(60));

// Test extractIntent
console.log("\n✅ Testing extractIntent():");
testCases.forEach((testCase) => {
  const intent = ChatbotService.extractIntent(testCase.message);
  const pass = intent === testCase.expectedIntent;
  console.log(`${pass ? "✓" : "✗"} "${testCase.message}"`);
  console.log(`  → Kỳ vọng: ${testCase.expectedIntent}, Nhận được: ${intent}`);
});

// Test extractKeywords
console.log("\n✅ Testing extractKeywords():");
const keywordTests = [
  "Tôi muốn tìm laptop Dell giá dưới 20 triệu",
  "Gợi ý những sản phẩm mới nhất",
  "So sánh iPhone 15 Pro và Samsung Galaxy S24 Ultra",
];

keywordTests.forEach((message) => {
  const keywords = ChatbotService.extractKeywords(message);
  console.log(`"${message}"`);
  console.log(`  → Keywords: ${keywords.join(", ") || "(none)"}`);
});

console.log("\n" + "=".repeat(60));
console.log("✅ Chatbot Service test hoàn tất!");
console.log("\n💡 Hãy khởi động server với 'npm start' hoặc 'node server.js'");
