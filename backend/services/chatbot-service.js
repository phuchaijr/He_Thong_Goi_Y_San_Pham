/**
 * Chatbot Service - Tích hợp hành vi người dùng với chatbot gợi ý
 */

const { sql } = require("../db");
const RecommendationEngine = require("./recommendation-engine");
const BehaviorAggregationService = require("./behavior-aggregation-service");
const OllamaService = require("./ollama-service");
const ConversationService = require("./conversation-service");
const AdvancedIntentHandler = require("./advanced-intent-handler");

class ChatbotService {
  // ========== INTENT CLASSIFIER WITH CONFIDENCE SCORING ==========

  /**
   * Product categories and variations
   * Used for detecting SEARCH_PRODUCT intent
   */
  static PRODUCT_CATEGORIES = {
    phone: {
      keywords: [
        "điện thoại",
        "iphone",
        "samsung",
        "nokia",
        "motorola",
        "oppo",
        "vivo",
        "xiaomi",
        "huawei",
      ],
      priority: 1.2,
    },
    laptop: {
      keywords: [
        "laptop",
        "macbook",
        "macbook pro",
        "dell",
        "hp",
        "asus",
        "lenovo",
        "acer",
        "computer",
      ],
      priority: 1.2,
    },
    tablet: {
      keywords: ["ipad", "tablet", "máy tính bảng"],
      priority: 1.1,
    },
    tv: {
      keywords: ["tivi", "tv", "televison", "màn hình", "tele"],
      priority: 1.1,
    },
    watch: {
      keywords: ["đồng hồ", "watch", "smartwatch", "apple watch"],
      priority: 1.0,
    },
    headphone: {
      keywords: [
        "tai nghe",
        "headphone",
        "earphone",
        "airpod",
        "speaker",
        "loa",
      ],
      priority: 1.0,
    },
    camera: {
      keywords: ["máy ảnh", "camera", "canon", "nikon", "sony"],
      priority: 1.0,
    },
    accessories: {
      keywords: ["phụ kiện", "charger", "cable", "dây", "cáp", "cover", "ốp"],
      priority: 0.9,
    },
  };

  /**
   * Classifies user intent with confidence score and priority
   * Returns: { intent, confidence, priority, category }
   */
  static _classifyIntent(userMessage) {
    if (!userMessage) {
      return { intent: "GENERAL_QUERY", confidence: 0, priority: 0 };
    }

    const message = userMessage.toLowerCase().trim();
    let bestMatch = { intent: "GENERAL_QUERY", confidence: 0, priority: 0 };

    // First: Check for product category detection
    const categoryMatch = this._detectProductCategory(message);
    if (categoryMatch) {
      bestMatch = {
        intent: "SEARCH_PRODUCT",
        confidence: 0.95,
        priority: categoryMatch.priority + 10, // High priority if category detected
        category: categoryMatch.category,
      };
    }

    // Define all intent patterns with priority weights
    const intents = [
      // ========== GREETING (Highest Priority) ==========
      {
        name: "GREETING",
        pattern: /(xin chào|chào|hello|hi|chào bạn|chào bạn nhé|xin chào bạn)/i,
        confidence: 0.95,
        priority: 9,
      },

      // ========== PURCHASE & SEARCH INTENTS (Highest Priority) ==========
      {
        name: "PURCHASE_INTENT",
        pattern:
          /(muốn mua|đặt hàng|checkout|order|buy now|mua ngay|cho vào giỏ|sẽ mua|mua luôn)/i,
        confidence: 0.85,
        priority: 8,
      },
      {
        name: "SEARCH_BY_PRICE",
        pattern:
          /(dưới|trên|từ|đến|giá|bao nhiêu|rẻ|đắt|khuyến mãi|sale|giá thấp|giá cao)\s*(triệu|tr|đ|\d+)/i,
        confidence: 0.8,
        priority: 7,
      },
      {
        name: "PRODUCT_SEARCH",
        pattern: /(tìm|search|looking for|find|có .* không|tìm kiếm|kiếm)/i,
        confidence: 0.75,
        priority: 6.5,
      },

      // ========== PRODUCT QUERIES (Medium-High Priority) ==========
      {
        name: "PRODUCT_COMPARISON",
        pattern:
          /(so sánh|compare|so với|khác biệt|nào tốt hơn|cái nào|hay hơn|vs)/i,
        confidence: 0.8,
        priority: 6,
      },
      {
        name: "PRODUCT_RECOMMENDATION",
        pattern:
          /(gợi ý|recommend|suggest|nên mua|đề xuất|phù hợp|thích hợp|chọn cái nào)/i,
        confidence: 0.78,
        priority: 5.5,
      },
      {
        name: "SELECT_PRODUCT_FROM_LIST",
        pattern:
          /(chọn sản phẩm nào|nên chọn cái nào|tôi nên mua cái nào|chọn từ danh sách|tại sao chọn)/i,
        confidence: 0.85,
        priority: 6,
      },
      {
        name: "SPECIFICATION_QUERY",
        pattern:
          /(thông số|spec|specifications|cấu hình|dung lượng|pin|màu sắc|kích thước|weight|trọng lượng)/i,
        confidence: 0.8,
        priority: 5,
      },

      // ========== TRANSACTION QUERIES (Medium Priority) ==========
      {
        name: "PAYMENT_QUERY",
        pattern:
          /(thanh toán|payment|trả góp|credit|debit|e-wallet|ví điện tử|trả tiền|thanh toán như nào)/i,
        confidence: 0.82,
        priority: 4.5,
      },
      {
        name: "DELIVERY_QUERY",
        pattern:
          /(giao hàng|delivery|ship|vận chuyển|tinh phí giao|bao lâu|thời gian giao|ở đâu)/i,
        confidence: 0.82,
        priority: 4.5,
      },
      {
        name: "ORDER_STATUS_QUERY",
        pattern:
          /(đơn hàng|order|trạng thái|track|theo dõi|lịch sử mua|account|tài khoản)/i,
        confidence: 0.8,
        priority: 4,
      },
      {
        name: "AVAILABILITY_QUERY",
        pattern:
          /(có hàng|còn hàng|hết hàng|stock|available|sẵn không|khi nào có|preborder)/i,
        confidence: 0.78,
        priority: 4,
      },

      // ========== SUPPORT QUERIES (Medium Priority) ==========
      {
        name: "WARRANTY_QUERY",
        pattern: /(bảo hành|warranty|bảo vệ|hỏng|lỗi|sự cố|bị hỏng|thay thế)/i,
        confidence: 0.8,
        priority: 3.5,
      },
      {
        name: "RETURN_QUERY",
        pattern:
          /(hoàn trả|refund|trả lại|không hài lòng|return|đổi sản phẩm)/i,
        confidence: 0.8,
        priority: 3.5,
      },
      {
        name: "PROMOTION_QUERY",
        pattern:
          /(khuyến mãi|sale|discount|giảm giá|coupon|voucher|mã|ưu đãi|free)/i,
        confidence: 0.75,
        priority: 3,
      },

      // ========== BRAND & CATEGORY QUERIES ==========
      {
        name: "BRAND_QUERY",
        pattern:
          /(thương hiệu|brand|nhãn hiệu|hãng|apple|samsung|dell|sony|lg|hp|lenovo|asus)/i,
        confidence: 0.75,
        priority: 2.5,
      },
      {
        name: "CATEGORY_BROWSE",
        pattern: /(danh mục|category|loại|ngành hàng|thể loại|genre)/i,
        confidence: 0.7,
        priority: 2.5,
      },

      // ========== 11 ADVANCED INTENTS ==========
      {
        name: "ANALYZE_USER_NEEDS",
        pattern:
          /(phân tích|giúp tôi hiểu|nhu cầu|bạn nghĩ tôi cần gì|nên mua gì|phù hợp)/i,
        confidence: 0.8,
        priority: 5.5,
      },
      {
        name: "REFINE_SEARCH",
        pattern:
          /(hẹp hơn|lọc|tiêu chí|điều kiện|giới hạn|chỉ muốn|chỉ cần|loại trừ)/i,
        confidence: 0.75,
        priority: 5,
      },
      {
        name: "WEIGHT_PRIORITY_CHANGE",
        pattern:
          /(ưu tiên|quan trọng nhất|yếu tố chính|tôi cần|lựa chọn chính)/i,
        confidence: 0.78,
        priority: 5,
      },
      {
        name: "EXPLAIN_RECOMMENDATION",
        pattern:
          /(vì sao gợi ý|tại sao chọn|giải thích|lý do|tại sao lại|có gì hay)/i,
        confidence: 0.8,
        priority: 4.5,
      },
      {
        name: "WHY_NOT_THIS_PRODUCT",
        pattern:
          /(vì sao không gợi ý|cái này sao không|tại sao không|có gì không tốt|nhược điểm)/i,
        confidence: 0.78,
        priority: 4,
      },
      {
        name: "TREND_ANALYSIS",
        pattern:
          /(xu hướng|hot|trending|phổ biến|bán chạy|mốt|hot nhất|được yêu thích)/i,
        confidence: 0.75,
        priority: 4,
      },
      {
        name: "PREDICT_FUTURE_NEED",
        pattern: /(dự đoán|tiếp theo|lần sau|trong tương lai|sắp tới|sẽ cần)/i,
        confidence: 0.7,
        priority: 3.5,
      },
      {
        name: "USER_BEHAVIOR_ANALYSIS",
        pattern:
          /(phân tích hành vi|thói quen|xu hướng mua|mô hình mua|lịch sử|engagement)/i,
        confidence: 0.72,
        priority: 3.5,
      },
      {
        name: "CROSS_SELLING",
        pattern:
          /(bổ sung|kèm theo|dùng cùng|phối hợp|ghép cặp|đi kèm|phụ kiện)/i,
        confidence: 0.7,
        priority: 3,
      },
      {
        name: "UP_SELLING",
        pattern:
          /(nâng cấp|upgrade|phiên bản cao hơn|tốt hơn|cao cấp hơn|premium)/i,
        confidence: 0.72,
        priority: 3,
      },
      {
        name: "LOW_CONFIDENCE_CLARIFICATION",
        pattern: /(không hiểu|mơ hồ|thế nào|cụ thể|rõ ràng|cần biết thêm)/i,
        confidence: 0.65,
        priority: 2.5,
      },

      // ========== GENERAL SUPPORT (Low Priority) ==========
      {
        name: "HELP",
        pattern:
          /(help|giúp|hướng dẫn|support|trợ giúp|assist|hỗ trợ|cần giúp)/i,
        confidence: 0.6,
        priority: 1.5,
      },
      {
        name: "CONTACT_QUERY",
        pattern: /(liên hệ|contact|gọi|call|email|số điện thoại|chat|message)/i,
        confidence: 0.75,
        priority: 1.5,
      },
      {
        name: "FAQ_QUERY",
        pattern:
          /(câu hỏi|faq|thường gặp|cách|làm sao|như nào|tại sao|vì sao)/i,
        confidence: 0.6,
        priority: 1,
      },
    ];

    // If product category already matched, skip to return
    if (categoryMatch) {
      return bestMatch;
    }

    // Find highest priority matching intent
    for (const intent of intents) {
      if (intent.pattern.test(message)) {
        // Calculate effective priority considering multiple factors
        const effectivePriority = intent.priority + intent.confidence * 0.5;

        if (
          effectivePriority > bestMatch.priority ||
          (effectivePriority === bestMatch.priority &&
            intent.confidence > bestMatch.confidence)
        ) {
          bestMatch = {
            intent: intent.name,
            confidence: intent.confidence,
            priority: effectivePriority,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Detects if message contains product category keyword
   * Returns: { category, priority } or null
   */
  static _detectProductCategory(message) {
    const msg = message.toLowerCase();

    for (const [category, data] of Object.entries(this.PRODUCT_CATEGORIES)) {
      for (const keyword of data.keywords) {
        if (msg.includes(keyword)) {
          return { category, priority: data.priority };
        }
      }
    }

    return null;
  }

  /**
   * Phân tích ý định từ câu hỏi của người dùng
   * Backward compatible: Returns only intent name
   * Internally uses _classifyIntent for scoring
   */
  static extractIntent(userMessage) {
    const classification = this._classifyIntent(userMessage);
    return classification.intent;
  }

  /**
   * Get detailed intent classification with confidence and priority
   * For advanced intent analysis and debugging
   */
  static getIntentDetailed(userMessage) {
    return this._classifyIntent(userMessage);
  }
  //Hàm tính khoảng giá (cải thiện)
  static extractPriceRange(message) {
    if (!message) return null;
    const text = message.toLowerCase().replace(/\./g, "");

    // 12-15tr
    const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(tr|triệu)/);
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1]) * 1000000,
        max: parseInt(rangeMatch[2]) * 1000000,
      };
    }

    // "giá tầm 10 triệu" hoặc "tầm 10 triệu" hoặc "khoảng 10 triệu"
    // Lấy ±20% để flexible
    const approximateMatch = text.match(
      /(giá\s+)?(?:tầm|khoảng|chừng)\s+(\d+)\s*(?:\,|\.)?(\d{0,2})?\s*(tr|triệu|k|nghìn)?/,
    );
    if (approximateMatch) {
      let basePrice = parseInt(approximateMatch[2]);

      // Nếu có decimal hoặc unit là K/nghìn, xử lý khác
      if (approximateMatch[4] === "k" || approximateMatch[4] === "nghìn") {
        basePrice = basePrice * 1000;
      } else {
        basePrice = basePrice * 1000000; // triệu
      }

      const rangePercent = basePrice * 0.2; // ±20%
      return {
        min: Math.max(0, basePrice - rangePercent),
        max: basePrice + rangePercent,
      };
    }

    // dưới 10tr
    const underMatch = text.match(/dưới\s*(\d+)\s*(tr|triệu)/);
    if (underMatch) {
      return { min: 0, max: parseInt(underMatch[1]) * 1000000 };
    }

    // trên 10tr
    const overMatch = text.match(/trên\s*(\d+)\s*(tr|triệu)/);
    if (overMatch) {
      return { min: parseInt(overMatch[1]) * 1000000, max: 999999999 };
    }

    // "giá rẻ" → đặt ngưỡng mặc định
    if (text.includes("giá rẻ") || text.includes("giá thấp")) {
      return { min: 0, max: 5000000 };
    }

    // "giá cao" → giá cao hơn 15 triệu
    if (text.includes("giá cao") || text.includes("giá đắt")) {
      return { min: 15000000, max: 999999999 };
    }

    return null;
  }

  /**
   * Tìm sản phẩm tương ứng với câu hỏi của người dùng
   * Cải thiện: filter theo product category nếu được detect
   */
  static async findRelevantProducts(userMessage, keywords, limit = 5) {
    try {
      limit = Math.min(parseInt(limit) || 5, 20);

      const pool = await sql.connect();
      const request = pool.request();

      let whereConditions = ["p.stock > 0", "p.is_active = 1"];

      // Detect product category from message
      const categoryMatch = this._detectProductCategory(userMessage);
      if (categoryMatch) {
        // Filter by product category if detected
        // Map internal category names to database category names
        const categoryMap = {
          phone: "Điện thoại",
          laptop: "Laptop",
          tablet: "Máy tính bảng",
          tv: "Tivi",
          watch: "Đồng hồ",
          headphone: "Tai nghe",
          camera: "Máy ảnh",
          accessories: "Phụ kiện",
        };
        const dbCategory =
          categoryMap[categoryMatch.category] || categoryMatch.category;
        request.input("category", sql.NVarChar(100), dbCategory);
        whereConditions.push(`c.name = @category`);
      }

      // 1️⃣ Keyword search (AND) - only product-related keywords
      if (keywords.length > 0) {
        const keywordParts = [];

        keywords.forEach((k, index) => {
          request.input(`keyword${index}`, sql.NVarChar(255), `%${k}%`);
          keywordParts.push(
            `(p.name LIKE @keyword${index} OR p.description LIKE @keyword${index})`,
          );
        });

        whereConditions.push(`(${keywordParts.join(" OR ")})`);
      }

      // 2️⃣ Price filter (AND riêng biệt)
      const priceRange = this.extractPriceRange(userMessage);

      if (priceRange) {
        request.input("minPrice", sql.Int, priceRange.min);
        request.input("maxPrice", sql.Int, priceRange.max);

        whereConditions.push(`p.price BETWEEN @minPrice AND @maxPrice`);
      }

      const finalWhere = "WHERE " + whereConditions.join(" AND ");

      const result = await request.query(`
      SELECT TOP (${limit})
        p.id,
        p.name,
        p.price,
        p.image_url AS image,
        p.rating,
        p.description,
        p.review_count,
        p.purchase_count,
        p.view_count,
        p.popularity_score,
        p.hot_score,
        p.stock,
        c.name as category_name
      FROM Products p
      JOIN Categories c ON p.category_id = c.id
      ${finalWhere}
      ORDER BY 
        p.popularity_score DESC,
        p.purchase_count DESC,
        p.rating DESC
    `);

      return result.recordset;
    } catch (err) {
      console.error("Error finding relevant products:", err);
      return [];
    }
  }

  /**
   * Xây dựng response từ chatbot dựa trên ý định (Mở rộng)
   */
  static async buildChatbotResponse(userId, userMessage, intent, context = {}) {
    const keywords = this.extractKeywords(userMessage);
    const detailedIntent = this._classifyIntent(userMessage);
    const relevantProducts = await this.findRelevantProducts(
      userMessage,
      keywords,
    );
    console.log("danh sacsh san pham lien quan", relevantProducts);
    console.log("keywords", keywords);
    console.log("Detailed intent:", detailedIntent);

    let response = {};

    switch (intent) {
      // ========== GREETING ==========
      case "GREETING":
        response = this.handleGreetingIntent();
        break;

      case "WARRANTY_QUERY":
        response = await this.handleWarrantyIntent(userMessage);
        break;

      case "DELIVERY_QUERY":
        response = await this.handleDeliveryIntent(
          userMessage,
          relevantProducts,
        );
        break;

      case "PAYMENT_QUERY":
        response = await this.handlePaymentIntent(userMessage);
        break;

      case "RETURN_QUERY":
        response = await this.handleReturnIntent(userMessage);
        break;

      case "SPECIFICATION_QUERY":
        response = await this.handleSpecificationIntent(relevantProducts);
        break;

      case "AVAILABILITY_QUERY":
        response = await this.handleAvailabilityIntent(
          relevantProducts,
          userMessage,
        );
        break;

      case "PROMOTION_QUERY":
        response = await this.handlePromotionIntent(userMessage);
        break;

      case "ORDER_STATUS_QUERY":
        response = await this.handleOrderStatusIntent(userId, userMessage);
        break;

      case "CONTACT_QUERY":
        response = this.handleContactIntent();
        break;

      case "FAQ_QUERY":
        response = await this.handleFAQIntent(userMessage);
        break;

      case "PRODUCT_RECOMMENDATION":
        response = await this.handleRecommendationIntent(userId, context);
        break;

      case "SELECT_PRODUCT_FROM_LIST":
        response = await this.handleSelectProductFromList(
          userId,
          context,
          userMessage,
        );
        break;

      case "PRODUCT_SEARCH":
        response = await this.handleSearchIntent(
          userId,
          context,
          relevantProducts,
          keywords,
        );
        break;

      case "SEARCH_PRODUCT":
        // When product category is detected, use search intent with category filtering
        response = await this.handleSearchIntent(
          userId,
          context,
          relevantProducts,
          keywords,
          detailedIntent.category,
        );
        break;

      case "PRODUCT_COMPARISON":
        response = await this.handleComparisonIntent(relevantProducts);
        break;

      case "CATEGORY_BROWSE":
        response = await this.handleCategoryIntent(userId, keywords);
        break;

      case "PRICE_QUERY":
        response = await this.handlePriceIntent(relevantProducts, keywords);
        break;

      case "PURCHASE_INTENT":
        // For purchase intent with products, show relevant products with purchase option
        if (relevantProducts.length > 0 || detailedIntent.category) {
          response = await this.handleSearchIntent(
            userId,
            context,
            relevantProducts,
            keywords,
            detailedIntent.category,
          );
          response.action = "add_to_cart";
        } else {
          response = await this.handlePurchaseIntent(userId, relevantProducts);
        }
        break;

      case "BRAND_QUERY":
        response = await this.handleBrandIntent(relevantProducts, keywords);
        break;

      case "HELP":
        response = this.handleHelpIntent();
        break;

      // ========== ADVANCED INTENTS HANDLERS ==========

      case "ANALYZE_USER_NEEDS":
        response = await AdvancedIntentHandler.analyzeUserNeeds(
          userId,
          userMessage,
          context,
        );
        break;

      case "REFINE_SEARCH":
        response = await AdvancedIntentHandler.refineSearch(
          userId,
          relevantProducts,
          userMessage,
          context.filters,
        );
        break;

      case "WEIGHT_PRIORITY_CHANGE":
        response = await AdvancedIntentHandler.changePriority(
          userId,
          context.priorityChanges || {},
          relevantProducts,
        );
        break;

      case "EXPLAIN_RECOMMENDATION":
        response = await AdvancedIntentHandler.explainRecommendation(
          context.productId || relevantProducts[0]?.id,
          userId,
          context.recommendationSource || "personalized",
        );
        break;

      case "WHY_NOT_THIS_PRODUCT":
        response = await AdvancedIntentHandler.explainRejection(
          context.productId || relevantProducts[0]?.id,
          userId,
          userMessage,
        );
        break;

      case "TREND_ANALYSIS":
        response = await AdvancedIntentHandler.analyzeTrends(
          context.categoryId,
          context.timeRange || "30days",
        );
        break;

      case "PREDICT_FUTURE_NEED":
        response = await AdvancedIntentHandler.predictFutureNeeds(userId);
        break;

      case "USER_BEHAVIOR_ANALYSIS":
        response = await AdvancedIntentHandler.analyzeUserBehavior(userId);
        break;

      case "CROSS_SELLING":
        response = await AdvancedIntentHandler.getCrossSellingRecommendations(
          userId,
          context.currentProduct || relevantProducts[0]?.id,
        );
        break;

      case "UP_SELLING":
        response = await AdvancedIntentHandler.getUpsellRecommendations(
          userId,
          context.productId || relevantProducts[0]?.id,
          context.userBudget,
        );
        break;

      case "LOW_CONFIDENCE_CLARIFICATION":
        response = await AdvancedIntentHandler.requestClarification(
          userId,
          userMessage,
          context,
        );
        break;

      default:
        response = await this.handleGeneralQuery(
          userId,
          relevantProducts,
          userMessage,
        );
    }

    return response;
  }

  /**
   * Xử lý ý định gợi ý sản phẩm
   */
  static async handleRecommendationIntent(userId, context = {}) {
    try {
      const recommendations =
        await RecommendationEngine.getMultiChannelRecommendations(userId, 5);

      if (!recommendations.length) {
        return {
          text: "Xin lỗi, tôi không thể tìm thấy gợi ý phù hợp. Bạn có muốn tôi giúp tìm kiếm sản phẩm gì không?",
          recommendations: [],
          fallback: true,
        };
      }

      await RecommendationEngine.saveRecommendationLog(userId, recommendations);

      return {
        text: `Tôi tìm thấy ${recommendations.length} sản phẩm phù hợp với sở thích của bạn:`,
        recommendations: recommendations,
        confidence:
          recommendations.reduce((acc, r) => acc + r.confidence, 0) /
          recommendations.length,
      };
    } catch (err) {
      console.error("Error handling recommendation intent:", err);
      return { text: "Có lỗi xảy ra, vui lòng thử lại.", recommendations: [] };
    }
  }

  /**
   * Xử lý ý định chọn sản phẩm từ danh sách
   */
  static async handleSelectProductFromList(userId, context = {}, userMessage) {
    try {
      // Kiểm tra xem có danh sách recommendations từ context không
      const previousRecommendations = context.recommendations || [];

      if (!previousRecommendations.length) {
        return {
          text: "Xin lỗi, tôi không có danh sách sản phẩm nào để chọn. Bạn có muốn tôi tìm kiếm sản phẩm trước không?",
          recommendations: [],
          fallback: true,
        };
      }

      // Chọn sản phẩm tốt nhất dựa trên các tiêu chí
      const selectedProduct = this.selectBestProduct(
        previousRecommendations,
        userMessage,
      );

      // Tạo giải thích
      const explanation = this.generateProductSelectionExplanation(
        selectedProduct,
        previousRecommendations,
      );

      return {
        text: `Dựa trên phân tích, tôi khuyên bạn nên chọn **${selectedProduct.name}** với giá ${selectedProduct.price.toLocaleString("vi-VN")} VND.\n\n${explanation}`,
        selected_product: selectedProduct,
        recommendations: previousRecommendations,
        explanation: explanation,
      };
    } catch (err) {
      console.error("Error handling select product from list:", err);
      return {
        text: "Có lỗi xảy ra khi chọn sản phẩm, vui lòng thử lại.",
        recommendations: [],
      };
    }
  }

  /**
   * Chọn sản phẩm tốt nhất từ danh sách dựa trên tiêu chí
   */
  static selectBestProduct(products, userMessage) {
    if (!products.length) return null;

    // Tính điểm cho mỗi sản phẩm dựa trên rating, review_count, purchase_count, popularity_score
    const scoredProducts = products.map((product) => {
      let score = 0;

      // Rating (0-5) * 40 = 0-200
      score += (product.rating || 0) * 40;

      // Review count (log scale to prevent domination)
      score += Math.log10((product.review_count || 1) + 1) * 10;

      // Purchase count
      score += Math.log10((product.purchase_count || 1) + 1) * 15;

      // Popularity score (normalized)
      score += (product.popularity_score || 0) / 100;

      // Hot score
      score += (product.hot_score || 0) / 10;

      // Giảm điểm nếu giá quá cao so với trung bình
      const avgPrice =
        products.reduce((sum, p) => sum + p.price, 0) / products.length;
      if (product.price > avgPrice * 1.5) {
        score -= 20; // Penalty for high price
      }

      return { ...product, selection_score: score };
    });

    // Sắp xếp theo rating giảm dần, sau đó purchase_count, sau đó popularity
    scoredProducts.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.purchase_count !== a.purchase_count)
        return b.purchase_count - a.purchase_count;
      return b.popularity_score - a.popularity_score;
    });

    return scoredProducts[0];
  }

  /**
   * Tạo giải thích cho việc chọn sản phẩm
   */
  static generateProductSelectionExplanation(selectedProduct, allProducts) {
    const reasons = [];

    // Rating cao
    if (selectedProduct.rating >= 4.0) {
      reasons.push(
        `⭐ Rating cao (${selectedProduct.rating}/5) cho thấy chất lượng tốt`,
      );
    }

    // Nhiều review
    if (selectedProduct.review_count > 100) {
      reasons.push(
        `📝 ${selectedProduct.review_count} đánh giá từ người dùng thực tế`,
      );
    }

    // Bán chạy
    if (selectedProduct.purchase_count > 0) {
      reasons.push(
        `🔥 Đã bán ${selectedProduct.purchase_count} sản phẩm, chứng tỏ được ưa chuộng`,
      );
    }

    // Giá cả hợp lý
    const avgPrice =
      allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length;
    if (selectedProduct.price <= avgPrice) {
      reasons.push(`💰 Giá cả hợp lý so với các lựa chọn khác`);
    }

    // Stock tốt
    if (selectedProduct.stock > 10) {
      reasons.push(
        `📦 Còn ${selectedProduct.stock} sản phẩm trong kho, sẵn sàng giao hàng`,
      );
    }

    // Mô tả sản phẩm
    if (selectedProduct.description) {
      reasons.push(`✨ ${selectedProduct.description}`);
    }

    // So sánh với sản phẩm khác
    const betterThanOthers = allProducts.filter(
      (p) => p.id !== selectedProduct.id && p.rating < selectedProduct.rating,
    );
    if (betterThanOthers.length > 0) {
      reasons.push(
        `🏆 Rating cao hơn ${betterThanOthers.length} sản phẩm khác trong danh sách`,
      );
    }

    return reasons.join("\n• ");
  }

  /**
   * Xử lý ý định lời chào
   */
  static handleGreetingIntent() {
    const greetings = [
      "Chào bạn! 👋 Tôi là trợ lý mua sắm AI của bạn. Hôm nay tôi có thể giúp bạn tìm kiếm sản phẩm nào không?",
      "Xin chào! 😊 Bạn muốn tìm kiếm sản phẩm gì để mua hôm nay?",
      "Chào bạn! 👋 Tôi sẵn sàng giúp bạn tìm kiếm các sản phẩm tuyệt vời. Bạn cần gì?",
    ];

    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      recommendations: [],
      source: "greeting",
    };
  }

  /**
   * Xử lý ý định tìm kiếm
   */
  static async handleSearchIntent(
    userId,
    context,
    products,
    keywords,
    category = null,
  ) {
    context = context || {};
    products = Array.isArray(products) ? products : [];
    keywords = Array.isArray(keywords) ? keywords : [];

    if (!products.length) {
      const categoryText = category ? ` loại ${category}` : "điều bạn muốn";
      return {
        text: `Xin lỗi, tôi không tìm thấy ${categoryText}. Bạn có muốn tôi gợi ý sản phẩm phổ biến không?`,
        recommendations: [],
      };
    }

    let responseText = "";

    if (category) {
      responseText = `Tôi tìm thấy ${products.length} ${category} phù hợp với yêu cầu của bạn:`;
    } else if (keywords.length > 0) {
      responseText = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với tìm kiếm của bạn:`;
    } else {
      responseText = `Tôi tìm thấy ${products.length} sản phẩm mà bạn có thể quan tâm:`;
    }

    const finalProducts = products.slice(0, 5);

    // 🔥 QUAN TRỌNG: LƯU VÀO CONTEXT
    context.recommendations = finalProducts;
    context.lastIntent = "SEARCH_PRODUCT";

    await ConversationService.saveContext(userId, context);

    return {
      text: responseText,
      recommendations: finalProducts,
      search_keywords: keywords,
      search_category: category,
    };
  }

  /**
   * Xử lý ý định so sánh sản phẩm
   */
  static async handleComparisonIntent(products) {
    if (products.length < 2) {
      return {
        text: "Để so sánh, tôi cần ít nhất 2 sản phẩm. Bạn có thể nói tên của chúng không?",
        recommendations: [],
      };
    }

    const comparison = products.slice(0, 2).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.rating,
      category: p.category_name,
    }));

    return {
      text: "Đây là so sánh giữa hai sản phẩm:",
      comparison: comparison,
      recommendations: products.slice(0, 2),
    };
  }

  /**
   * Xử lý ý định duyệt danh mục
   */
  static async handleCategoryIntent(userId, keywords) {
    try {
      const categories =
        await BehaviorAggregationService.getUserPreferredCategories(userId, 5);

      if (!categories.length) {
        return {
          text: "Bạn chưa xem danh mục nào. Có muốn tôi giới thiệu một số danh mục phổ biến không?",
          recommendations: [],
        };
      }

      return {
        text: "Đây là các danh mục bạn quan tâm:",
        recommendations: categories,
      };
    } catch (err) {
      console.error("Error handling category intent:", err);
      return { text: "Có lỗi xảy ra, vui lòng thử lại.", recommendations: [] };
    }
  }

  /**
   * Xử lý ý định tìm kiếm theo giá
   */
  static async handlePriceIntent(products, keywords) {
    if (!products.length) {
      return {
        text: "Tôi không tìm thấy sản phẩm nào. Bạn có muốn tôi gợi ý theo khoảng giá không?",
        recommendations: [],
      };
    }

    if (!products || products.length === 0) {
      return {
        text: "Hiện chưa có sản phẩm phù hợp khoảng giá này. Bạn muốn thử khoảng khác không?",
        recommendations: [],
      };
    }
    const minPrice = Math.min(...products.map((p) => p.price));
    const maxPrice = Math.max(...products.map((p) => p.price));
    const avgPrice = (minPrice + maxPrice) / 2;

    return {
      text: `Các sản phẩm được tìm thấy có giá từ ${minPrice.toLocaleString("vi-VN")}₫ đến ${maxPrice.toLocaleString("vi-VN")}₫`,
      price_range: { min: minPrice, max: maxPrice, avg: avgPrice },
      recommendations: products,
    };
  }

  /**
   * Xử lý ý định mua hàng
   */
  static async handlePurchaseIntent(userId, products) {
    return {
      text: products.length
        ? `Bạn có muốn mua các sản phẩm này không? Tôi có thể đề xuất vài món hàng cho bạn.`
        : "Bạn muốn mua sản phẩm nào? Tôi có thể giúp bạn tìm kiếm.",
      recommendations: products,
      action: "add_to_cart",
    };
  }

  /**
   * Xử lý ý định tìm kiếm theo thương hiệu
   */
  static async handleBrandIntent(products, keywords) {
    if (!products.length) {
      return {
        text: `Xin lỗi, tôi không tìm thấy thương hiệu nào phù hợp. Bạn có muốn xem các thương hiệu phổ biến không?`,
        recommendations: [],
      };
    }

    return {
      text: `Đây là sản phẩm từ các thương hiệu bạn tìm:`,
      recommendations: products,
    };
  }

  /**
   * Xử lý ý định trợ giúp
   */
  static handleHelpIntent() {
    return {
      text: `Tôi là trợ lý mua sắm AI nâng cao của bạn! Tôi có thể giúp bạn với:

**Gợi ý & Tìm kiếm:**
- Gợi ý sản phẩm phù hợp
- Tìm kiếm sản phẩm, so sánh giữa các sản phẩm
- Duyệt danh mục, tìm theo giá
- Phân tích nhu cầu của bạn

**Nâng cao:**
- 📊 Phân tích xu hướng thị trường
- 🔍 Điều chỉnh tiêu chí tìm kiếm
- ⭐ Giải thích tại sao gợi ý sản phẩm này
- 🚀 Gợi ý nâng cấp sản phẩm
- 🎁 Gợi ý bán chéo (sản phẩm bổ sung)
- 🔮 Dự đoán nhu cầu tương lai
- 👤 Phân tích hành vi mua sắm

**Hỗ trợ:**
- Thông tin bảo hành, giao hàng, thanh toán
- Trạng thái đơn hàng, chính sách hoàn trả
- Câu hỏi thường gặp

Bạn cần giúp gì?`,
      recommendations: [
        { label: "Gợi ý sản phẩm cho tôi", text: "Gợi ý sản phẩm" },
        { label: "Phân tích nhu cầu của tôi", text: "Phân tích nhu cầu" },
        { label: "Xu hướng thị trường hiện tại", text: "Xu hướng" },
        { label: "Gợi ý nâng cấp", text: "Nâng cấp" },
        { label: "Phân tích hành vi mua của tôi", text: "Hành vi" },
        { label: "Dự đoán tôi sẽ cần gì", text: "Dự đoán nhu cầu" },
      ],
    };
  }

  /**
   * Lưu cuộc trò chuyện vào database
   */
  static async saveChatMessage(userId, userMessage, botResponse, intent) {
    try {
      const botText = botResponse?.text || botResponse?.message || "";

      const pool = await sql.connect();

      await pool
        .request()
        .input("user_id", sql.Int, userId)
        .input("user_message", sql.NVarChar(1000), userMessage)
        .input("bot_response", sql.NVarChar(2000), botText)
        .input("intent", sql.NVarChar(100), intent).query(`
          INSERT INTO ChatHistory 
          (user_id, user_message, bot_response, intent, created_at)
          VALUES 
          (@user_id, @user_message, @bot_response, @intent, GETDATE())
        `);

      return true;
    } catch (err) {
      console.error("Error saving chat message:", err);
      return false;
    }
  }

  /**
   * Lấy lịch sử cuộc trò chuyện
   */
  static async getChatHistory(userId, limit = 50) {
    try {
      limit = Math.min(parseInt(limit) || 50, 100);

      const pool = await sql.connect();

      const result = await pool
        .request()
        .input("user_id", sql.Int, userId)
        .input("limit", sql.Int, limit).query(`
          SELECT
            id,
            user_message,
            bot_response,
            intent,
            created_at
          FROM ChatHistory
          WHERE user_id = @user_id
          ORDER BY created_at DESC
          OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
        `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting chat history:", err);
      return [];
    }
  }
  // màm phân tích giá của người dùng
  static parsePriceIntent(message) {
    const text = message.toLowerCase();

    // Khoảng giá dạng 12-15tr
    const rangeMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(tr|triệu)?/);
    if (rangeMatch) {
      return {
        type: "range",
        min: parseInt(rangeMatch[1]) * 1000000,
        max: parseInt(rangeMatch[2]) * 1000000,
      };
    }

    if (text.includes("giá rẻ") || text.includes("rẻ nhất")) {
      return { type: "cheap" };
    }

    if (text.includes("tầm trung")) {
      return { type: "mid" };
    }

    if (text.includes("cao cấp") || text.includes("đắt nhất")) {
      return { type: "premium" };
    }

    return null;
  }
  /**
   * Xử lý ý định bảo hành
   */
  static async handleWarrantyIntent(userMessage) {
    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Thông tin bảo hành của cửa hàng:
- Hầu hết sản phẩm điện tử: 12 tháng bảo hành chính hãng
- Sản phẩm cao cấp: 24 tháng bảo hành
- Bảo hành bao gồm lỗi kỹ thuật, không bao gồm vỡ/nước
- Quy trình: Liên hệ support -> Gửi sản phẩm -> Nhận sản phẩm mới hoặc sửa chữa
- Thời gian xử lý: 5-10 ngày làm việc
- Liên hệ: support@thecuahang.com hoặc gọi 1900 1234`,
      );

      return {
        text: aiResponse,
        faq_link: "warranty",
        support_contact: {
          email: "support@thecuahang.com",
          phone: "1900 1234",
          hours: "8h - 20h hàng ngày",
        },
      };
    } catch (err) {
      console.error("Error handling warranty intent:", err);
      return {
        text: "Sản phẩm của chúng tôi có bảo hành 12 tháng cho lỗi kỹ thuật. Vui lòng liên hệ support@thecuahang.com để được hỗ trợ.",
        faq_link: "warranty",
      };
    }
  }

  /**
   * Xử lý ý định giao hàng
   */
  static async handleDeliveryIntent(userMessage, products = []) {
    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Thông tin giao hàng:
- Giao hàng miễn phí cho đơn hàng từ 500k trong Hà Nội
- Giao hàng miễn phí toàn quốc cho đơn hàng từ 2 triệu
- Thời gian giao: 1-2 ngày ở Hà Nội, 2-3 ngày các tỉnh
- Giao vào thứ 2 đến thứ 7 (sáng 8h-12h, chiều 13h-18h)
- Phí giao hàng tính theo khoảng cách
- Có dịch vụ giao hôm nay ở khu vực Hà Nội
- Bảo hiểm vận chuyển miễn phí`,
      );

      return {
        text: aiResponse,
        delivery_info: {
          free_shipping_hanoi: "≥500.000đ",
          free_shipping_national: "≥2.000.000đ",
          time_hanoi: "1-2 ngày",
          time_nationwide: "2-3 ngày",
        },
      };
    } catch (err) {
      console.error("Error handling delivery intent:", err);
      return {
        text: "Chúng tôi cung cấp giao hàng miễn phí cho đơn hàng từ 500k ở Hà Nội. Thời gian giao: 1-2 ngày.",
        delivery_info: {
          free_shipping: "500.000đ (Hà Nội), 2.000.000đ (toàn quốc)",
        },
      };
    }
  }

  /**
   * Xử lý ý định thanh toán
   */
  static async handlePaymentIntent(userMessage) {
    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Phương thức thanh toán:
1. Thanh toán khi nhận hàng (COD) - Miễn phí
2. Chuyển khoản ngân hàng
3. Thẻ tín dụng / Thẻ ghi nợ
4. Ví điện tử: Momo, Zalopay, Airpay
5. Trả góp 0% qua các hãng TM (Aeon, HSBC, etc.)
- Hóa đơn: Cung cấp HĐTC cho các đơn hàng trên 1 triệu
- Bảo mật: Tất cả giao dịch được mã hóa SSL 256-bit`,
      );

      return {
        text: aiResponse,
        payment_methods: [
          "Thanh toán khi nhận hàng (COD)",
          "Chuyển khoản",
          "Thẻ tín dụng",
          "Ví điện tử (Momo, Zalopay)",
          "Trả góp 0%",
        ],
      };
    } catch (err) {
      console.error("Error handling payment intent:", err);
      return {
        text: "Chúng tôi chấp nhận thanh toán COD, chuyển khoản, thẻ tín dụng, ví điện tử và trả góp 0%.",
        payment_methods: ["COD", "Chuyển khoản", "Thẻ", "E-wallet", "Trả góp"],
      };
    }
  }

  /**
   * Xử lý ý định hoàn trả
   */
  static async handleReturnIntent(userMessage) {
    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Chính sách hoàn trả - Hài lòng 100%:
- Thời gian: Hoàn trả trong 30 ngày kể từ nhận hàng
- Điều kiện: Sản phẩm nguyên vẹn, chưa sử dụng, còn full box
- Sản phẩm đã kích hoạt: Hoàn trả trong 7 ngày
- Phí hoàn trả: Miễn phí nếu lỗi cửa hàng
- Quy trình: 1) Liên hệ support 2) Gửi hình ảnh 3) Nhận mã RMA 4) Gửi sản phẩm
- Hoàn tiền: Trong 5-7 ngày làm việc sau khi nhận được sản phẩm
- Hỗ trợ: support@thecuahang.com hoặc zalo 0xxx`,
      );

      return {
        text: aiResponse,
        return_policy: {
          duration: "30 ngày",
          condition: "Nguyên vẹn, chưa sử dụng",
          refund_time: "5-7 ngày",
        },
      };
    } catch (err) {
      console.error("Error handling return intent:", err);
      return {
        text: "Bạn có thể hoàn trả sản phẩm trong 30 ngày nếu chưa sử dụng. Chúng tôi sẽ hoàn tiền trong 5-7 ngày.",
        return_policy: { duration: "30 ngày", refund_time: "5-7 ngày" },
      };
    }
  }

  /**
   * Xử lý ý định thông số kỹ thuật
   */
  static async handleSpecificationIntent(products) {
    if (!products.length) {
      return {
        text: "Để xem thông số kỹ thuật, bạn hãy cho tôi biết bạn quan tâm đến sản phẩm nào.",
        recommendations: [],
      };
    }

    const specs = products.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.rating,
      category: p.category_name,
      description: p.description || "Xem chi tiết để biết thêm",
    }));

    return {
      text: `Đây là thông tin chi tiết về ${products.length} sản phẩm:`,
      specifications: specs,
      recommendations: products.slice(0, 3),
      action: "view_details",
    };
  }

  /**
   * Xử lý ý định kiểm tra hàng có sẵn
   */
  static async handleAvailabilityIntent(products, userMessage) {
    if (!products.length) {
      try {
        const aiResponse = await OllamaService.generateResponse(
          userMessage,
          "Thông tin sản phẩm không tìm thấy. Hãy đề nghị kiểm tra kho hoặc cho biết bạn có thể đặt trước không.",
        );
        return { text: aiResponse };
      } catch (err) {
        return {
          text: "Sản phẩm này hiện tại hết hàng. Bạn có muốn tôi gợi ý sản phẩm tương tự không?",
        };
      }
    }

    const available = products.filter((p) => p.stock > 0);
    const text =
      available.length === products.length
        ? `Cả ${products.length} sản phẩm đều còn hàng!`
        : `Có ${available.length}/${products.length} sản phẩm còn hàng`;

    return {
      text: text,
      availability: {
        in_stock: available.length,
        total: products.length,
        products: available.map((p) => ({
          name: p.name,
          stock: p.stock,
          price: p.price,
        })),
      },
      recommendations: available,
    };
  }

  /**
   * Xử lý ý định khuyến mãi
   */
  static async handlePromotionIntent(userMessage) {
    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Các khuyến mãi hiện tại:
1. Khuyến mãi hàng tuần (thứ 2-4)
2. Khuyến mãi thành viên (giảm 5-15%)
3. Khuyến mãi theo danh mục (áp dụng tất cả sản phẩm)
4. Combo giảm giá (mua 2 tặng 1)
5. Mã voucher: WELCOME10 (giảm 10%), MEMBER15 (giảm 15%)
6. Freeship voucher: FREESHIP50 (miễn phí với đơn 50k)
- Kiểm tra khuyến mãi: Vào mục "Khuyến mãi" trên website
- Thời hạn: Khuyến mãi thường kéo dài 3-7 ngày`,
      );

      return {
        text: aiResponse,
        promotions: ["WELCOME10", "MEMBER15", "FREESHIP50"],
        action: "view_promotions",
      };
    } catch (err) {
      console.error("Error handling promotion intent:", err);
      return {
        text: "Chúng tôi có nhiều khuyến mãi hấp dẫn hàng tuần. Sử dụng mã WELCOME10 để giảm 10% đơn hàng đầu tiên.",
        promotions: ["WELCOME10", "MEMBER15", "FREESHIP50"],
      };
    }
  }

  /**
   * Xử lý ý định kiểm tra trạng thái đơn hàng
   */
  static async handleOrderStatusIntent(userId, userMessage) {
    try {
      if (!userId) {
        return {
          text: "Để kiểm tra đơn hàng, bạn cần đăng nhập vào tài khoản của mình.",
          action: "login_required",
        };
      }

      const pool = await sql.connect();
      const result = await pool.request().input("user_id", sql.Int, userId)
        .query(`
          SELECT TOP 5 
            id, status, total_price, created_at
          FROM Orders 
          WHERE user_id = @user_id
          ORDER BY created_at DESC
        `);

      if (!result.recordset.length) {
        return {
          text: "Bạn chưa có đơn hàng nào. Bạn muốn mua sản phẩm gì không?",
        };
      }

      const orders = result.recordset.map((o) => ({
        id: o.id,
        status: o.status,
        price: o.total_price,
        date: o.created_at,
      }));

      return {
        text: `Bạn có ${orders.length} đơn hàng gần đây:`,
        orders: orders,
        action: "view_orders",
      };
    } catch (err) {
      console.error("Error handling order status intent:", err);
      return {
        text: "Xin lỗi, tôi không thể lấy thông tin đơn hàng. Vui lòng liên hệ support.",
      };
    }
  }

  /**
   * Xử lý ý định liên hệ
   */
  static handleContactIntent() {
    return {
      text: `Liên hệ với chúng tôi:
📧 Email: support@thecuahang.com | sales@thecuahang.com
📱 Điện thoại: 1900 1234 (8h-20h hàng ngày)
💬 Zalo: 0912345678
🗣️ Facebook: /Nhom_12.official
⏰ Thời gian hỗ trợ: T2-T7 (8h-20h), CN (9h-18h)
🏢 Địa chỉ: 123 Đường XYZ, Quận 1, TP.HCM`,
      contact_info: {
        email: "support@thecuahang.com",
        phone: "1900 1234",
        zalo: "0912345678",
        facebook: "/Nhom_12.official",
        hours: "T2-T7: 8h-20h, CN: 9h-18h",
      },
      action: "contact",
    };
  }

  /**
   * Xử lý ý định FAQ
   */
  static async handleFAQIntent(userMessage) {
    const faqs = this.getFAQKnowledgeBase();

    try {
      const aiResponse = await OllamaService.generateResponse(
        userMessage,
        `Các câu hỏi thường gặp:
${faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`,
      );

      return {
        text: aiResponse,
        faqs: faqs.slice(0, 5),
        action: "view_faq",
      };
    } catch (err) {
      console.error("Error handling FAQ intent:", err);
      return {
        text: "Câu hỏi phổ biến:",
        faqs: faqs.slice(0, 5),
      };
    }
  }

  /**
   * Cơ sở dữ liệu FAQ
   */
  static getFAQKnowledgeBase() {
    return [
      {
        id: 1,
        question: "Làm sao để tạo tài khoản?",
        answer:
          "Nhấp vào 'Đăng ký' ở góc trên phải, điền email và mật khẩu. Xác nhận email để hoàn tất.",
      },
      {
        id: 2,
        question: "Cách đặt hàng như thế nào?",
        answer:
          "1. Chọn sản phẩm và thêm vào giỏ 2. Nhấp Thanh toán 3. Chọn địa chỉ giao 4. Chọn phương thức thanh toán 5. Hoàn tất",
      },
      {
        id: 3,
        question: "Có giao hàng miễn phí không?",
        answer:
          "Có! Giao hàng miễn phí cho đơn từ 500k ở Hà Nội, hoặc 2 triệu toàn quốc.",
      },
      {
        id: 4,
        question: "Tôi có thể đổi/trả hàng không?",
        answer:
          "Có, trong 30 ngày nếu sản phẩm chưa sử dụng. Liên hệ support để tạo mã RMA.",
      },
      {
        id: 5,
        question: "Sản phẩm có bảo hành không?",
        answer:
          "Tất cả sản phẩm đều có bảo hành 12-24 tháng chính hãng tùy loại sản phẩm.",
      },
      {
        id: 6,
        question: "Cách theo dõi đơn hàng?",
        answer:
          "Đăng nhập tài khoản → Mục 'Đơn hàng của tôi' → Xem trạng thái chi tiết.",
      },
      {
        id: 7,
        question: "Có dịch vụ giao hôm nay không?",
        answer:
          "Có, ở khu vực Hà Nội. Đặt hàng trước 11h sáng để giao trong ngày.",
      },
      {
        id: 8,
        question: "Sử dụng code giảm giá như thế nào?",
        answer:
          "Tại trang thanh toán, nhập code vào ô 'Mã khuyến mãi' rồi nhấp 'Áp dụng'.",
      },
    ];
  }

  /**
   * Xử lý truy vấn chung (cải thiện)
   */
  static async handleGeneralQuery(userId, products, userMessage) {
    try {
      let contextInfo = `Bạn là trợ lý mua sắm AI của cửa hàng điện tử nhóm 12. `;
      contextInfo += `Hãy trả lời thân thiện, hữu ích, ngắn gọn (2-3 dòng). `;
      contextInfo += `Nếu user hỏi gì liên quan tới shopping, hãy gợi ý sản phẩm. `;

      // Generate personalized response based on user message and products
      let aiPrompt = userMessage;

      if (products.length > 0) {
        contextInfo += `\n\nSản phẩm liên quan:\n${products
          .map(
            (p, i) =>
              `${i + 1}. ${p.name}: ${p.price.toLocaleString("vi-VN")}₫ (⭐ ${p.rating || "N/A"}/5)`,
          )
          .join("\n")}`;

        aiPrompt = `${userMessage}\n\nHãy gợi ý các sản phẩm trên nếu phù hợp với nhu cầu của user.`;
      } else {
        // No relevant products found, generate general response
        aiPrompt = `${userMessage}\n\nNếu user đang tìm sản phẩm điện tử, hãy hỏi thêm chi tiết để giúp họ tìm kiếm tốt hơn.`;
      }

      const aiText = await OllamaService.generateResponse(
        aiPrompt,
        contextInfo,
      );

      return {
        text: aiText,
        recommendations: products.slice(0, 5),
        source: products.length > 0 ? "products" : "general",
      };
    } catch (err) {
      console.error("AI Error:", err);
      return {
        text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.",
        recommendations: [],
        error: true,
      };
    }
  }

  /**
   * Cải thiện cách trích xuất từ khóa cho tiếng Việt (Cải thiện)
   */
  static extractKeywords(userMessage) {
    if (!userMessage) return [];

    const stopwords = new Set([
      "để",
      "được",
      "là",
      "từ",
      "nên",
      "có",
      "không",
      "hay",
      "và",
      "hoặc",
      "nhưng",
      "mà",
      "với",
      "về",
      "tại",
      "ở",
      "trong",
      "ngoài",
      "trên",
      "dưới",
      "phía",
      "bên",
      "giữa",
      "giống",
      "khác",
      "này",
      "kia",
      "nào",
      "nó",
      "cái",
      "chiếc",
      "những",
      "mấy",
      "bao",
      "lắm",
      "rất",
      "nhiều",
      "ít",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
      "mười",
      "trăm",
      "nghìn",
      "triệu",
      "tỉ",
      "cảu",
      "tư",
      "lần",
      "tới",
      "cho",
      "bởi",
      "nếu",
      "khi",
      "còn",
      "mặc",
      "dù",
      "sau",
      "trước",
      "đang",
      "sẽ",
      "vừa",
      "lúc",
      "vào",
      "ra",
      "qua",
      "xong",
      "hết",
      "nữa",
      "cách",
      "làm",
      "sao",
      "như",
      "thế",
      "đó",
      "như nào",
      "tại sao",
      "vì sao",
      // ========== ACTION WORDS (to be ignored for product search) ==========
      "muốn",
      "mua",
      "đặt",
      "hàng",
      "order",
      "checkout",
      "tìm",
      "kiếm",
      "search",
      "looking",
      "find",
      "gợi",
      "ý",
      "recommend",
      "suggest",
      "nên",
      "đề",
      "xuất",
      "so",
      "sánh",
      "compare",
      "khác",
      "biệt",
      "nào",
      "tốt",
      "hơn",
      "cái",
      "hay",
      "vs",
      "cần",
      "thích",
      "hợp",
      "chọn",
      "giúp",
      "hỗ trợ",
      "trợ",
      "giúp",
      // ========== PRICE-RELATED WORDS (to be ignored) ==========
      "giá",
      "tầm",
      "khoảng",
      "chừng",
      "dưới",
      "trên",
      "rẻ",
      "đắt",
      "thấp",
      "cao",
      "tr",
      "k",
    ]);

    const words = userMessage
      .toLowerCase()
      .trim()
      .replace(/[!\"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopwords.has(word));

    return [...new Set(words)];
  }
}

module.exports = ChatbotService;
