/**
 * Chatbot Service - Tích hợp hành vi người dùng với chatbot gợi ý
 */

const { sql } = require("../db");
const RecommendationEngine = require("./recommendation-engine");
const BehaviorAggregationService = require("./behavior-aggregation-service");

class ChatbotService {
  /**
   * Trích xuất từ khóa từ tin nhắn người dùng
   */
  static extractKeywords(userMessage) {
    if (!userMessage) return [];

    // Các từ dừng tiếng Việt phổ biến
    const stopwords = new Set([
      "để", "được", "là", "từ", "nên", "có", "không", "hay", "và", "hoặc",
      "nhưng", "mà", "với", "về", "tại", "ở", "trong", "ngoài", "trên",
      "dưới", "phía", "bên", "giữa", "giống", "khác", "này", "kia", "nào",
      "nó", "cái", "chiếc", "những", "mấy", "bao", "lắm", "rất", "nhiều",
      "ít", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín",
      "mười", "trăm", "nghìn", "triệu", "tỉ", "cái", "cảu", "tư", "lần",
      "tới", "cho", "bởi", "nếu", "khi", "còn", "mặc", "dù", "sau", "trước",
      "đang", "sẽ", "vừa", "lúc", "vào", "ra", "qua", "xong", "hết", "nữa"
    ]);

    // Tách từ và loại bỏ stopwords
    const words = userMessage
      .toLowerCase()
      .trim()
      .replace(/[!\"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, " ") // Loại bỏ ký tự đặc biệt
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopwords.has(word));

    // Loại bỏ trùng lặp
    return [...new Set(words)];
  }

  /**
   * Phân tích ý định từ câu hỏi của người dùng
   */
  static extractIntent(userMessage) {
  if (!userMessage) return "GENERAL_QUERY";

  const message = userMessage.toLowerCase().trim();

  const intents = [
    {
      name: "PURCHASE_INTENT",
      pattern: /(muốn mua|đặt hàng|checkout|order|buy now|mua ngay)/i,
    },
    {
      name: "PRODUCT_COMPARISON",
      pattern: /(so sánh|compare|so với|khác biệt|nào tốt hơn)/i,
    },
    {
      name: "PRODUCT_RECOMMENDATION",
      pattern: /(gợi ý|recommend|suggest|nên mua|đề xuất)/i,
    },
    {
      name: "PRODUCT_SEARCH",
      pattern: /(tìm|search|looking for|find|có .* không)/i,
    },
    {
      name: "PRICE_QUERY",
      pattern: /(giá|bao nhiêu|rẻ|đắt|khuyến mãi|sale)/i,
    },
    {
      name: "CATEGORY_BROWSE",
      pattern: /(danh mục|category|loại|ngành hàng|thể loại)/i,
    },
    {
      name: "BRAND_QUERY",
      pattern: /(thương hiệu|brand|nhãn hiệu|hãng)/i,
    },
    {
      name: "HELP",
      pattern: /(help|giúp|hướng dẫn|support|trợ giúp|assist)/i,
    },
  ];

  for (const intent of intents) {
    if (intent.pattern.test(message)) {
      return intent.name;
    }
  }

  return "GENERAL_QUERY";
}
  /**
   * Tìm sản phẩm tương ứng với câu hỏi của người dùng
   */
  static async findRelevantProducts(userMessage, keywords, limit = 5) {
  try {
    limit = Math.min(parseInt(limit) || 5, 20);
    if (!keywords.length) return [];

    const pool = await sql.connect();
    const request = pool.request();

    // Bind từng keyword an toàn
    const conditions = keywords.map((k, index) => {
      request.input(`keyword${index}`, sql.NVarChar(255), `%${k}%`);
      return `(p.name LIKE @keyword${index} OR p.description LIKE @keyword${index})`;
    });

    request.input("limit", sql.Int, limit);

    const result = await request.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.image,
        p.rating,
        p.description,
        c.name as category_name
      FROM Products p
      JOIN Categories c ON p.category_id = c.id
      WHERE (${conditions.join(" OR ")})
        AND p.stock > 0
      ORDER BY p.purchase_count DESC, p.rating DESC
      OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return result.recordset;

  } catch (err) {
    console.error("Error finding relevant products:", err);
    return [];
  }
}

  /**
   * Xây dựng response từ chatbot dựa trên ý định
   */
  static async buildChatbotResponse(userId, userMessage, intent, context = {}) {
    const keywords = this.extractKeywords(userMessage);
    const relevantProducts = await this.findRelevantProducts(
      userMessage,
      keywords,
    );

    let response = {};

    switch (intent) {
      case "PRODUCT_RECOMMENDATION":
        response = await this.handleRecommendationIntent(userId, context);
        break;

      case "PRODUCT_SEARCH":
        response = await this.handleSearchIntent(
          userId,
          relevantProducts,
          keywords,
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
        response = await this.handlePurchaseIntent(userId, relevantProducts);
        break;

      case "BRAND_QUERY":
        response = await this.handleBrandIntent(relevantProducts, keywords);
        break;

      case "HELP":
        response = this.handleHelpIntent();
        break;

      default:
        response = await this.handleGeneralQuery(userId, relevantProducts);
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
          text:
            "Xin lỗi, tôi không thể tìm thấy gợi ý phù hợp. Bạn có muốn tôi giúp tìm kiếm sản phẩm gì không?",
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
   * Xử lý ý định tìm kiếm
   */
  static async handleSearchIntent(userId, products, keywords) {
    if (!products.length) {
      return {
        text: `Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn. Có muốn tôi gợi ý sản phẩm phổ biến không?`,
        recommendations: [],
      };
    }

    return {
      text: `Tôi tìm thấy ${products.length} sản phẩm phù hợp với tìm kiếm của bạn:`,
      recommendations: products.slice(0, 5),
      search_keywords: keywords,
    };
  }

  /**
   * Xử lý ý định so sánh sản phẩm
   */
  static async handleComparisonIntent(products) {
    if (products.length < 2) {
      return {
        text:
          "Để so sánh, tôi cần ít nhất 2 sản phẩm. Bạn có thể nói tên của chúng không?",
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
          text:
            "Bạn chưa xem danh mục nào. Có muốn tôi giới thiệu một số danh mục phổ biến không?",
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
        text:
          "Tôi không tìm thấy sản phẩm nào. Bạn có muốn tôi gợi ý theo khoảng giá không?",
        recommendations: [],
      };
    }

    const priceInfo = products.map((p) => ({
      name: p.name,
      price: p.price,
      id: p.id,
    }));

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
        ? `Bạn có muốn mua các sản phẩm này không? Tôi có thể giúp bạn thêm vào giỏ hàng.`
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
      text: `Tôi là trợ lý mua sắm AI của bạn. Tôi có thể giúp bạn với:
      - Gợi ý sản phẩm phù hợp
      - Tìm kiếm sản phẩm
      - So sánh giữa các sản phẩm
      - Giúp tìm sản phẩm theo danh mục
      - Tìm kiếm theo giá
      - Và nhiều hơn nữa!
      
      Bạn cần giúp gì?",
      recommendations: [
        { label: "Gợi ý cho tôi sản phẩm", text: "Gợi ý sản phẩm" },
        { label: "Tìm laptop giá dưới 20 triệu", text: "Tìm laptop" },
        { label: "So sánh iPhone 15 và Samsung S24", text: "So sánh" },
        { label: "Có gì mới nhất không?", text: "Sản phẩm mới" },
      ],
    };
  }

  /**
   * Xử lý truy vấn chung
   */
  static async handleGeneralQuery(userId, products) {
    if (products.length > 0) {
      return {
        text: "Tôi tìm thấy những sản phẩm này phù hợp với bạn:",
        recommendations: products,
      };
    }

    const recommendations =
      await RecommendationEngine.getMultiChannelRecommendations(userId, 3);

    return {
      text: "Bạn có muốn xem những sản phẩm được gợi ý cho bạn không?",
      recommendations: recommendations,
    };
  }

  /**
   * Lưu cuộc trò chuyện vào database
   */
  static async saveChatMessage(userId, userMessage, botResponse, intent) {
    try {
      const botText = botResponse?.text || botResponse?.message || "";

      const pool = await sql.connect();

      await pool.request()
        .input("user_id", sql.Int, userId)
        .input("user_message", sql.NVarChar(1000), userMessage)
        .input("bot_response", sql.NVarChar(2000), botText)
        .input("intent", sql.NVarChar(100), intent)
        .query(`
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

      const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .input("limit", sql.Int, limit)
        .query(`
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

module.exports = ChatbotService;
