/**
 * Chatbot Routes - API cho hệ thống chatbot gợi ý (Mở rộng)
 */

const router = require("express").Router();
const ChatbotService = require("../services/chatbot-service");
const RecommendationEngine = require("../services/recommendation-engine");
const BehaviorAggregationService = require("../services/behavior-aggregation-service");
const FAQService = require("../services/faq-service");
const OllamaService = require("../services/ollama-service");
const { sql } = require("../db");

/**
 * POST /api/chatbot/chat
 * Gửi tin nhắn và nhận phản hồi từ chatbot (Mở rộng)
 */
router.post("/chat", async (req, res, next) => {
  try {
    const { user_id, message, context = {} } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Trích xuất ý định từ tin nhắn
    const intent = ChatbotService.extractIntent(message);
    console.log(`Extracted intent: ${intent} from message: "${message}"`);

    // otXây dựng phản hồi từ chatb
    const response = await ChatbotService.buildChatbotResponse(
      user_id,
      message,
      intent,
      context,
    );

    // Lưu vào lịch sử trò chuyện nếu có user_id
    if (user_id) {
      await ChatbotService.saveChatMessage(
        user_id,
        message,
        typeof response === "string" ? response : response.text,
        intent,
      );
    }

    res.json({
      success: true,
      intent,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/faq
 * Lấy danh sách FAQ
 */
router.get("/faq", async (req, res, next) => {
  try {
    const { category, limit = 20 } = req.query;
    const faqs = await FAQService.getAllFAQs(category, parseInt(limit));

    res.json({
      success: true,
      count: faqs.length,
      faqs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/faq/categories
 * Lấy danh mục FAQ
 */
router.get("/faq/categories", async (req, res, next) => {
  try {
    const categories = await FAQService.getFAQCategories();
    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/faq/search
 * Tìm kiếm FAQ
 */
router.get("/faq/search", async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }

    const faqs = await FAQService.findRelevantFAQs(q, parseInt(limit));

    // Tăng lượt xem
    await Promise.all(faqs.map((faq) => FAQService.incrementFAQView(faq.id)));

    res.json({
      success: true,
      query: q,
      count: faqs.length,
      faqs,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/faq/:id/helpful
 * Đánh dấu FAQ hữu ích
 */
router.post("/faq/:id/helpful", async (req, res, next) => {
  try {
    const { id } = req.params;
    await FAQService.markFAQHelpful(parseInt(id));

    res.json({
      success: true,
      message: "FAQ marked as helpful",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/health
 * Kiểm tra trạng thái hệ thống chatbot
 */
router.get("/health", async (req, res, next) => {
  try {
    const ollamaReady = await OllamaService.checkOllamaHealth();

    res.json({
      success: true,
      status: "healthy",
      components: {
        ollama: ollamaReady ? "ready" : "unavailable",
        database: "ready",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.json({
      success: false,
      status: "unhealthy",
      error: err.message,
    });
  }
});

/**
 * POST /api/chatbot/ollama/test
 * Test Ollama API
 */
router.post("/ollama/test", async (req, res, next) => {
  try {
    const { message = "Xin chào" } = req.body;
    const response = await OllamaService.generateResponse(message);

    res.json({
      success: true,
      message,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/chatbot/faq/add
 * Thêm FAQ mới (Admin)
 */
router.post("/faq/add", async (req, res, next) => {
  try {
    const { question, answer, category = "General" } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "question and answer are required" });
    }

    const id = await FAQService.addFAQ(question, answer, category);

    res.json({
      success: true,
      faq_id: id,
      message: "FAQ added successfully",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/chatbot/faq/:id
 * Cập nhật FAQ (Admin)
 */
router.put("/faq/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, category } = req.body;

    const success = await FAQService.updateFAQ(
      parseInt(id),
      question,
      answer,
      category,
    );

    if (success) {
      res.json({
        success: true,
        message: "FAQ updated successfully",
      });
    } else {
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/recommendations/:userId
 * Lấy gợi ý sản phẩm cho người dùng
 */
router.get("/recommendations/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type = "multi", limit = 10 } = req.query;

    let recommendations = [];

    switch (type) {
      case "personalized":
        recommendations =
          await RecommendationEngine.getPersonalizedRecommendations(
            userId,
            parseInt(limit),
          );
        break;
      case "collaborative":
        recommendations =
          await RecommendationEngine.getCollaborativeFilteringRecommendations(
            userId,
            parseInt(limit),
          );
        break;
      case "new":
        recommendations =
          await RecommendationEngine.getNewProductRecommendations(
            userId,
            parseInt(limit),
          );
        break;
      case "popular":
        recommendations = await RecommendationEngine.getPopularProducts(
          parseInt(limit),
        );
        break;
      case "cart":
        recommendations =
          await RecommendationEngine.getCartBasedRecommendations(
            userId,
            parseInt(limit),
          );
        break;
      default:
        recommendations =
          await RecommendationEngine.getMultiChannelRecommendations(
            userId,
            parseInt(limit),
          );
    }

    res.json({
      success: true,
      type,
      count: recommendations.length,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/user-profile/:userId
 * Lấy hồ sơ hành vi của người dùng
 */
router.get("/user-profile/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [stats, intent, categories, searchHistory, sessionMetrics] =
      await Promise.all([
        BehaviorAggregationService.getUserBehaviorStats(userId),
        BehaviorAggregationService.identifyUserIntent(userId),
        BehaviorAggregationService.getUserPreferredCategories(userId, 5),
        BehaviorAggregationService.getUserSearchHistory(userId, 10),
        BehaviorAggregationService.calculateSessionMetrics(userId),
      ]);

    res.json({
      success: true,
      profile: {
        behavior_stats: stats,
        user_intent: intent,
        preferred_categories: categories,
        recent_searches: searchHistory,
        session_metrics: sessionMetrics,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/frequently-bought-together/:productId
 * Lấy các sản phẩm thường xuyên mua cùng nhau
 */
router.get("/frequently-bought-together/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    const products =
      await BehaviorAggregationService.getFrequentlyBoughtTogether(
        productId,
        parseInt(limit),
      );

    res.json({
      success: true,
      product_id: productId,
      frequently_bought_together: products,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/similar-users/:userId
 * Tìm những người dùng tương tự
 */
router.get("/similar-users/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const similarUsers = await BehaviorAggregationService.findSimilarUsers(
      userId,
      parseInt(limit),
    );

    res.json({
      success: true,
      user_id: userId,
      similar_users: similarUsers,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/chat-history/:userId
 * Lấy lịch sử trò chuyện của người dùng
 */
router.get("/chat-history/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const history = await ChatbotService.getChatHistory(
      userId,
      parseInt(limit),
    );

    res.json({
      success: true,
      user_id: userId,
      chat_history: history,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/engagement-score/:userId/:productId
 * Tính toán điểm tương tác của người dùng với sản phẩm
 */
router.get("/engagement-score/:userId/:productId", async (req, res, next) => {
  try {
    const { userId, productId } = req.params;

    const score =
      await BehaviorAggregationService.calculateProductEngagementScore(
        userId,
        productId,
      );

    res.json({
      success: true,
      user_id: userId,
      product_id: productId,
      engagement_score: score,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/track-recommendation-click
 * Theo dõi khi người dùng click vào sản phẩm được gợi ý
 */
router.post("/track-recommendation-click", async (req, res, next) => {
  try {
    const { user_id, product_id, recommendation_source } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const pool = await sql.connect();

    await pool
      .request()
      .input("user_id", sql.Int, user_id || null)
      .input("product_id", sql.Int, product_id)
      .input("source", sql.NVarChar(255), recommendation_source || "unknown")
      .query(`
        INSERT INTO RecommendationClickLog 
        (user_id, product_id, source, clicked_at)
        VALUES (@user_id, @product_id, @source, GETDATE())
      `);

    res.json({ success: true, message: "Click tracked" });
  } catch (err) {
    next(err);
  }
});

// ==================== ADVANCED INTENT ENDPOINTS ====================

const AdvancedIntentHandler = require("../services/advanced-intent-handler");

/**
 * POST /api/chatbot/analyze-needs/:userId
 * 1. ANALYZE_USER_NEEDS - Phân tích nhu cầu người dùng
 */
router.post("/analyze-needs/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { message = "", context = {} } = req.body;

    const analysis = await AdvancedIntentHandler.analyzeUserNeeds(
      userId,
      message,
      context,
    );

    res.json({
      success: true,
      intent: "ANALYZE_USER_NEEDS",
      analysis,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/refine-search/:userId
 * 2. REFINE_SEARCH - Điều chỉnh tiêu chí tìm kiếm
 */
router.post("/refine-search/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { message = "", previousProducts = [], filters = {} } = req.body;

    const refined = await AdvancedIntentHandler.refineSearch(
      userId,
      previousProducts,
      message,
      filters,
    );

    res.json({
      success: true,
      intent: "REFINE_SEARCH",
      refined,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/change-priority/:userId
 * 3. WEIGHT_PRIORITY_CHANGE - Thay đổi ưu tiên
 */
router.post("/change-priority/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { priorityChanges = {}, currentRecommendations = [] } = req.body;

    const result = await AdvancedIntentHandler.changePriority(
      userId,
      priorityChanges,
      currentRecommendations,
    );

    res.json({
      success: true,
      intent: "WEIGHT_PRIORITY_CHANGE",
      result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/explain-recommendation/:productId/:userId
 * 4. EXPLAIN_RECOMMENDATION - Giải thích lý do gợi ý
 */
router.get(
  "/explain-recommendation/:productId/:userId",
  async (req, res, next) => {
    try {
      const { productId, userId } = req.params;
      const { source = "personalized" } = req.query;

      const explanation = await AdvancedIntentHandler.explainRecommendation(
        parseInt(productId),
        parseInt(userId),
        source,
      );

      res.json({
        success: true,
        intent: "EXPLAIN_RECOMMENDATION",
        explanation,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/chatbot/why-not-product/:productId/:userId
 * 5. WHY_NOT_THIS_PRODUCT - Vì sao không chọn sản phẩm này
 */
router.get("/why-not-product/:productId/:userId", async (req, res, next) => {
  try {
    const { productId, userId } = req.params;
    const { message = "" } = req.query;

    const rejection = await AdvancedIntentHandler.explainRejection(
      parseInt(productId),
      parseInt(userId),
      message,
    );

    res.json({
      success: true,
      intent: "WHY_NOT_THIS_PRODUCT",
      rejection,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/trends
 * 6. TREND_ANALYSIS - Phân tích xu hướng thị trường
 */
router.get("/trends", async (req, res, next) => {
  try {
    const { categoryId = null, timeRange = "30days" } = req.query;

    const trends = await AdvancedIntentHandler.analyzeTrends(
      categoryId ? parseInt(categoryId) : null,
      timeRange,
    );

    res.json({
      success: true,
      intent: "TREND_ANALYSIS",
      trends,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/predict-needs/:userId
 * 7. PREDICT_FUTURE_NEED - Dự đoán nhu cầu tương lai
 */
router.get("/predict-needs/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const predictions = await AdvancedIntentHandler.predictFutureNeeds(userId);

    res.json({
      success: true,
      intent: "PREDICT_FUTURE_NEED",
      predictions,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/behavior-analysis/:userId
 * 8. USER_BEHAVIOR_ANALYSIS - Phân tích hành vi người dùng
 */
router.get("/behavior-analysis/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const analysis = await AdvancedIntentHandler.analyzeUserBehavior(userId);

    res.json({
      success: true,
      intent: "USER_BEHAVIOR_ANALYSIS",
      analysis,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/cross-selling/:userId
 * 9. CROSS_SELLING - Gợi ý bán chéo
 */
router.get("/cross-selling/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { currentProduct = null } = req.query;

    const crossSellRecommendations =
      await AdvancedIntentHandler.getCrossSellingRecommendations(
        parseInt(userId),
        currentProduct ? parseInt(currentProduct) : null,
      );

    res.json({
      success: true,
      intent: "CROSS_SELLING",
      recommendations: crossSellRecommendations,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chatbot/upsell/:userId/:productId
 * 10. UP_SELLING - Gợi ý nâng cấp
 */
router.get("/upsell/:userId/:productId", async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const { budget = null } = req.query;

    const upsellRecommendations =
      await AdvancedIntentHandler.getUpsellRecommendations(
        parseInt(userId),
        parseInt(productId),
        budget ? parseInt(budget) : null,
      );

    res.json({
      success: true,
      intent: "UP_SELLING",
      recommendations: upsellRecommendations,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chatbot/clarify/:userId
 * 11. LOW_CONFIDENCE_CLARIFICATION - Hỏi lại khi thiếu thông tin
 */
router.post("/clarify/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { message = "", context = {} } = req.body;

    const clarification = await AdvancedIntentHandler.requestClarification(
      parseInt(userId),
      message,
      context,
    );

    res.json({
      success: true,
      intent: "LOW_CONFIDENCE_CLARIFICATION",
      clarification,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
