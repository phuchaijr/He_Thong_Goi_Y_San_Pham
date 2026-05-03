/**
 * Advanced Intent Handler - Xử lý 11 ý định nâng cao
 * Tích hợp phân tích nhu cầu, xu hướng, hành vi và gợi ý bán chéo/nâng cấp
 */

const { sql } = require("../db");
const BehaviorAggregationService = require("./behavior-aggregation-service");
const RecommendationEngine = require("./recommendation-engine");

class AdvancedIntentHandler {
  /**
   * 1. ANALYZE_USER_NEEDS - Phân tích nhu cầu người dùng
   * Dựa vào lịch sử, hành vi để suy ra nhu cầu thực sự
   */
  static async analyzeUserNeeds(userId, userMessage, context = {}) {
    try {
      const pool = await sql.connect();
      const request = pool.request();

      // Lấy hành vi gần đây
      const userBehavior = await pool.request().input("userId", sql.Int, userId)
        .query(`
          SELECT TOP 10
            event_type,
            product_id,
            created_at,
            (SELECT name FROM Products WHERE id = ui.product_id) as product_name,
            (SELECT category_id FROM Products WHERE id = ui.product_id) as category_id
          FROM UserInteractions ui
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `);

      // Phân tích mục đích mua sắm
      const categories = {};
      const eventFreq = { view: 0, click: 0, purchase: 0 };

      for (const behavior of userBehavior.recordset) {
        const catId = behavior.category_id;
        categories[catId] = (categories[catId] || 0) + 1;
        eventFreq[behavior.event_type] =
          (eventFreq[behavior.event_type] || 0) + 1;
      }

      // Xác định nhu cầu chính
      const primaryNeed = this.identifyPrimaryNeed(
        eventFreq,
        userMessage,
        Object.keys(categories).length,
      );

      // Lấy sản phẩm phù hợp với nhu cầu
      const recommendedProducts = await this.getProductsForNeed(
        primaryNeed,
        userId,
        categories,
      );

      return {
        text: this.generateNeedAnalysisResponse(primaryNeed, userMessage),
        analysis: {
          primary_need: primaryNeed,
          event_frequency: eventFreq,
          categories_count: Object.keys(categories).length,
          engagement_level: eventFreq.purchase > 5 ? "high" : "medium",
        },
        recommendations: recommendedProducts.slice(0, 5),
        context_type: "ANALYZE_USER_NEEDS",
      };
    } catch (err) {
      console.error("Error analyzing user needs:", err);
      return {
        text: "Tôi đang học hỏi về nhu cầu của bạn. Bạn có thể cho tôi biết thêm?",
        recommendations: [],
      };
    }
  }

  /**
   * 2. REFINE_SEARCH - Điều chỉnh tiêu chí tìm kiếm
   * Giúp người dùng thu hẹp kết quả tìm kiếm
   */
  static async refineSearch(
    userId,
    previousProducts,
    userMessage,
    filters = {},
  ) {
    try {
      const pool = await sql.connect();

      // Trích xuất điều kiện lọc từ tin nhắn
      const extractedFilters = this.extractRefinementFilters(
        userMessage,
        previousProducts,
      );

      const mergedFilters = { ...filters, ...extractedFilters };

      // Xây dựng query với các bộ lọc
      let whereConditions = ["p.stock > 0", "p.is_active = 1"];

      if (mergedFilters.minPrice)
        whereConditions.push(`p.price >= ${mergedFilters.minPrice}`);
      if (mergedFilters.maxPrice)
        whereConditions.push(`p.price <= ${mergedFilters.maxPrice}`);
      if (mergedFilters.categoryIds)
        whereConditions.push(
          `p.category_id IN (${mergedFilters.categoryIds.join(",")})`,
        );
      if (mergedFilters.minRating)
        whereConditions.push(`p.rating >= ${mergedFilters.minRating}`);
      if (mergedFilters.brands && mergedFilters.brands.length > 0) {
        const brandList = mergedFilters.brands.map((b) => `'${b}'`).join(",");
        whereConditions.push(`p.brand IN (${brandList})`);
      }

      const whereClause = whereConditions.join(" AND ");

      const result = await pool.request().query(`
        SELECT TOP 10
          p.id,
          p.name,
          p.price,
          p.image_url AS image,
          p.rating,
          p.review_count,
          p.brand,
          c.name as category_name
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE ${whereClause}
        ORDER BY p.rating DESC, p.purchase_count DESC
      `);

      return {
        text: `Tôi đã điều chỉnh tìm kiếm với ${result.recordset.length} kết quả phù hợp với tiêu chí của bạn:`,
        refined_filters: mergedFilters,
        recommendations: result.recordset,
        context_type: "REFINE_SEARCH",
        filter_explanation: this.generateFilterExplanation(mergedFilters),
      };
    } catch (err) {
      console.error("Error refining search:", err);
      return {
        text: "Có lỗi khi điều chỉnh tìm kiếm. Vui lòng thử lại.",
        recommendations: [],
      };
    }
  }

  /**
   * 3. WEIGHT_PRIORITY_CHANGE - Thay đổi ưu tiên
   * Cho phép người dùng thay đổi độ ưu tiên của các yếu tố
   */
  static async changePriority(
    userId,
    priorityChanges,
    currentRecommendations = [],
  ) {
    try {
      // Định nghĩa trọng số mặc định
      const defaultWeights = {
        price: 0.2,
        rating: 0.25,
        popularity: 0.2,
        newness: 0.1,
        category_match: 0.25,
      };

      // Cập nhật trọng số dựa trên thay đổi
      const newWeights = { ...defaultWeights };
      if (priorityChanges.prioritize_price) newWeights.price = 0.4;
      if (priorityChanges.prioritize_quality) newWeights.rating = 0.4;
      if (priorityChanges.prioritize_popularity) newWeights.popularity = 0.4;
      if (priorityChanges.prioritize_new) newWeights.newness = 0.35;

      // Lưu các ưu tiên của người dùng
      await sql.query(`
        MERGE INTO UserPreferences AS target
        USING (SELECT ${userId} AS user_id) AS source
        ON target.user_id = source.user_id
        WHEN MATCHED THEN
          UPDATE SET 
            weight_price = ${newWeights.price},
            weight_rating = ${newWeights.rating},
            weight_popularity = ${newWeights.popularity},
            weight_newness = ${newWeights.newness},
            weight_category = ${newWeights.category_match},
            updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (user_id, weight_price, weight_rating, weight_popularity, weight_newness, weight_category, created_at, updated_at)
          VALUES (${userId}, ${newWeights.price}, ${newWeights.rating}, ${newWeights.popularity}, ${newWeights.newness}, ${newWeights.category_match}, GETDATE(), GETDATE());
      `);

      // Sắp xếp lại gợi ý dựa trên trọng số mới
      const rerankedRecommendations = this.rerankRecommendations(
        currentRecommendations,
        newWeights,
      );

      return {
        text: "Tôi đã cập nhật ưu tiên của bạn. Đây là gợi ý được sắp xếp lại:",
        previous_weights: defaultWeights,
        new_weights: newWeights,
        recommendations: rerankedRecommendations.slice(0, 5),
        context_type: "WEIGHT_PRIORITY_CHANGE",
        change_summary: this.generatePrioritySummary(
          priorityChanges,
          defaultWeights,
          newWeights,
        ),
      };
    } catch (err) {
      console.error("Error changing priority:", err);
      return {
        text: "Có lỗi khi thay đổi ưu tiên. Vui lòng thử lại.",
        recommendations: [],
      };
    }
  }

  /**
   * 4. EXPLAIN_RECOMMENDATION - Giải thích lý do gợi ý
   * Cung cấp giải thích chi tiết về từng gợi ý
   */
  static async explainRecommendation(productId, userId, recommendationSource) {
    try {
      const pool = await sql.connect();

      // Lấy thông tin sản phẩm
      const productResult = await pool
        .request()
        .input("productId", sql.Int, productId).query(`
          SELECT id, name, price, rating, review_count, purchase_count, brand, category_id
          FROM Products
          WHERE id = @productId
        `);

      const product = productResult.recordset[0];
      if (!product)
        return { text: "Không tìm thấy sản phẩm.", recommendations: [] };

      // Tìm lý do gợi ý
      const reasons = await this.findRecommendationReasons(
        productId,
        userId,
        recommendationSource,
      );

      return {
        text: `Tôi gợi ý sản phẩm này vì những lý do sau:`,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          rating: product.rating,
          brand: product.brand,
        },
        recommendation_reasons: reasons,
        context_type: "EXPLAIN_RECOMMENDATION",
        explanation: this.formatRecommendationExplanation(reasons),
      };
    } catch (err) {
      console.error("Error explaining recommendation:", err);
      return {
        text: "Có lỗi khi giải thích gợi ý.",
        recommendations: [],
      };
    }
  }

  /**
   * 5. WHY_NOT_THIS_PRODUCT - Vì sao không chọn cái kia
   * Giải thích tại sao một sản phẩm không được gợi ý
   */
  static async explainRejection(productId, userId, userMessage) {
    try {
      const pool = await sql.connect();

      const productResult = await pool
        .request()
        .input("productId", sql.Int, productId).query(`
          SELECT id, name, price, rating, review_count, category_id, stock
          FROM Products
          WHERE id = @productId
        `);

      const product = productResult.recordset[0];
      if (!product) {
        return { text: "Không tìm thấy sản phẩm.", recommendations: [] };
      }

      // Phân tích lý do từ chối
      const rejectionReasons = [];

      // 1. Hết hàng
      if (product.stock <= 0) {
        rejectionReasons.push({
          reason: "Hết hàng",
          description: "Sản phẩm này hiện tại không có sẵn.",
          severity: "high",
        });
      }

      // 2. Giá cao so với ngân sách của user
      const userPrefs =
        await BehaviorAggregationService.getUserPricePreference(userId);
      if (product.price > userPrefs.avg_spent * 1.5) {
        rejectionReasons.push({
          reason: "Vượt quá ngân sách dự kiến",
          description: `Giá ${product.price.toLocaleString("vi-VN")}₫ cao hơn so với mức bạn thường chi tiêu.`,
          severity: "medium",
        });
      }

      // 3. Rating thấp
      if (product.rating < 3.5) {
        rejectionReasons.push({
          reason: "Rating không cao",
          description: `Sản phẩm này có rating ${product.rating}/5 từ ${product.review_count} đánh giá.`,
          severity: "medium",
        });
      }

      // 4. Không phù hợp thể loại
      const userCategories =
        await BehaviorAggregationService.getUserPreferredCategories(userId);
      const isMatchCategory = userCategories.some(
        (c) => c.id === product.category_id,
      );
      if (!isMatchCategory) {
        rejectionReasons.push({
          reason: "Không phù hợp sở thích",
          description: "Sản phẩm này không nằm trong danh mục bạn thường mua.",
          severity: "low",
        });
      }

      return {
        text: `Dưới đây là lý do tại sao tôi chưa gợi ý sản phẩm này:`,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          rating: product.rating,
        },
        rejection_reasons: rejectionReasons,
        context_type: "WHY_NOT_THIS_PRODUCT",
        alternatives: await this.findBetterAlternatives(
          product.category_id,
          product.price,
          userId,
        ),
      };
    } catch (err) {
      console.error("Error explaining rejection:", err);
      return { text: "Có lỗi xảy ra.", recommendations: [] };
    }
  }

  /**
   * 6. TREND_ANALYSIS - Phân tích xu hướng thị trường
   * Cho xem xu hướng các sản phẩm, danh mục, thương hiệu
   */
  static async analyzeTrends(category = null, timeRange = "30days") {
    try {
      const pool = await sql.connect();

      // Tính toán ngày bắt đầu
      const startDate = this.getDateRange(timeRange);

      // Xu hướng sản phẩm phổ biến
      const trendingProducts = await pool.request().query(`
        SELECT TOP 10
          p.id,
          p.name,
          p.price,
          COUNT(ui.id) as interaction_count,
          (SELECT COUNT(*) FROM UserInteractions WHERE product_id = p.id AND event_type = 'purchase' AND created_at >= '${startDate}') as purchase_trend,
          (SELECT AVG(CAST(popularity_score AS FLOAT)) FROM Products WHERE id = p.id) as trend_score
        FROM Products p
        LEFT JOIN UserInteractions ui ON p.id = ui.product_id AND ui.created_at >= '${startDate}'
        ${category ? `WHERE p.category_id = ${category}` : ""}
        GROUP BY p.id, p.name, p.price
        ORDER BY interaction_count DESC
      `);

      // Xu hướng danh mục
      const trendingCategories = await pool.request().query(`
        SELECT TOP 5
          c.id,
          c.name,
          COUNT(ui.id) as total_interactions,
          COUNT(DISTINCT ui.user_id) as unique_users,
          (SELECT COUNT(*) FROM UserInteractions ui2 
           WHERE ui2.product_id IN (SELECT id FROM Products WHERE category_id = c.id)
           AND ui2.created_at >= '${startDate}'
           AND ui2.event_type = 'purchase') as purchase_count
        FROM Categories c
        LEFT JOIN Products p ON c.id = p.category_id
        LEFT JOIN UserInteractions ui ON p.id = ui.product_id AND ui.created_at >= '${startDate}'
        GROUP BY c.id, c.name
        ORDER BY total_interactions DESC
      `);

      // Xu hướng giá
      const pricetrend = await pool.request().query(`
        SELECT
          CASE 
            WHEN price < 5000000 THEN 'Dưới 5 triệu'
            WHEN price < 10000000 THEN '5-10 triệu'
            WHEN price < 20000000 THEN '10-20 triệu'
            ELSE 'Trên 20 triệu'
          END as price_range,
          COUNT(*) as product_count,
          AVG(CAST(purchase_count AS FLOAT)) as avg_sales
        FROM Products
        GROUP BY
          CASE 
            WHEN price < 5000000 THEN 'Dưới 5 triệu'
            WHEN price < 10000000 THEN '5-10 triệu'
            WHEN price < 20000000 THEN '10-20 triệu'
            ELSE 'Trên 20 triệu'
          END
      `);

      return {
        text: "Đây là phân tích xu hướng thị trường hiện tại:",
        trending_products: trendingProducts.recordset,
        trending_categories: trendingCategories.recordset,
        price_distribution: pricetrend.recordset,
        context_type: "TREND_ANALYSIS",
        time_range: timeRange,
        summary: this.generateTrendSummary(trendingProducts.recordset),
      };
    } catch (err) {
      console.error("Error analyzing trends:", err);
      return {
        text: "Có lỗi khi phân tích xu hướng.",
        recommendations: [],
      };
    }
  }

  /**
   * 7. PREDICT_FUTURE_NEED - Dự đoán nhu cầu tương lai
   * Dự đoán sản phẩm mà người dùng sẽ cần trong tương lai
   */
  static async predictFutureNeeds(userId) {
    try {
      // Phân tích chu kỳ mua hàng
      const purchaseCycle = await this.analyzePurchaseCycle(userId);

      // Dự đoán nhu cầu dựa trên chu kỳ
      const predictedNeeds = [];

      if (purchaseCycle.avg_interval_days) {
        const daysSinceLastPurchase = purchaseCycle.days_since_last_purchase;
        const nextPurchaseDate = new Date();
        nextPurchaseDate.setDate(
          nextPurchaseDate.getDate() +
            (purchaseCycle.avg_interval_days - daysSinceLastPurchase),
        );

        predictedNeeds.push({
          type: "Sản phẩm thường mua",
          description: `Dự kiến bạn sẽ mua hàng vào khoảng ${nextPurchaseDate.toLocaleDateString("vi-VN")}`,
          confidence: 0.8,
        });
      }

      // Dự đoán nhu cầu theo mùa
      const seasonalNeeds = await this.predictSeasonalNeeds(userId);
      predictedNeeds.push(...seasonalNeeds);

      // Các sản phẩm bổ sung có thể cần
      const complementaryProducts = await this.getComplementaryProducts(userId);

      return {
        text: "Tôi dự đoán bạn sẽ cần những sản phẩm sau:",
        predicted_needs: predictedNeeds,
        complementary_products: complementaryProducts.slice(0, 5),
        context_type: "PREDICT_FUTURE_NEED",
        prediction_confidence:
          this.calculatePredictionConfidence(purchaseCycle),
      };
    } catch (err) {
      console.error("Error predicting future needs:", err);
      return {
        text: "Có lỗi khi dự đoán nhu cầu tương lai.",
        recommendations: [],
      };
    }
  }

  /**
   * 8. USER_BEHAVIOR_ANALYSIS - Phân tích hành vi người dùng
   * Tổng hợp phân tích về hành vi, mô hình mua sắm
   */
  static async analyzeUserBehavior(userId) {
    try {
      const pool = await sql.connect();

      // Lấy hành vi gần đây
      const behaviorResult = await pool
        .request()
        .input("userId", sql.Int, userId).query(`
          SELECT
            event_type,
            COUNT(*) as count,
            AVG(DATEDIFF(HOUR, created_at, GETDATE())) as avg_hours_ago
          FROM UserInteractions
          WHERE user_id = @userId AND created_at >= DATEADD(DAY, -90, GETDATE())
          GROUP BY event_type
        `);

      // Phân tích danh mục yêu thích
      const categoryResult = await pool
        .request()
        .input("userId", sql.Int, userId).query(`
          SELECT TOP 5
            c.id,
            c.name,
            COUNT(*) as interaction_count,
            (SELECT SUM(ci.quantity * p.price) 
             FROM CartItems ci 
             JOIN Products p ON ci.product_id = p.id
             WHERE p.category_id = c.id) as spending
          FROM UserInteractions ui
          JOIN Products p ON ui.product_id = p.id
          JOIN Categories c ON p.category_id = c.id
          WHERE ui.user_id = @userId
          GROUP BY c.id, c.name
          ORDER BY interaction_count DESC
        `);

      // Phân tích thương hiệu yêu thích
      const brandResult = await pool.request().input("userId", sql.Int, userId)
        .query(`
          SELECT TOP 5
            p.brand,
            COUNT(*) as interaction_count,
            AVG(CAST(p.rating AS FLOAT)) as avg_rating
          FROM UserInteractions ui
          JOIN Products p ON ui.product_id = p.id
          WHERE ui.user_id = @userId AND p.brand IS NOT NULL
          GROUP BY p.brand
          ORDER BY interaction_count DESC
        `);

      // Tính toán engagement score
      const totalInteractions = behaviorResult.recordset.reduce(
        (sum, r) => sum + r.count,
        0,
      );
      const engagementScore = Math.min(
        totalInteractions * 0.5 + categoryResult.recordset.length * 10,
        100,
      );

      return {
        text: "Đây là phân tích chi tiết về hành vi của bạn:",
        behavior_summary: {
          total_interactions: totalInteractions,
          event_breakdown: behaviorResult.recordset,
          engagement_score: engagementScore,
          engagement_level:
            engagementScore > 70
              ? "Cao"
              : engagementScore > 40
                ? "Trung bình"
                : "Thấp",
        },
        favorite_categories: categoryResult.recordset,
        favorite_brands: brandResult.recordset,
        context_type: "USER_BEHAVIOR_ANALYSIS",
        insights: this.generateBehaviorInsights(
          behaviorResult.recordset,
          engagementScore,
        ),
      };
    } catch (err) {
      console.error("Error analyzing user behavior:", err);
      return { text: "Có lỗi khi phân tích hành vi.", recommendations: [] };
    }
  }

  /**
   * 9. CROSS_SELLING - Gợi ý bán chéo
   * Gợi ý sản phẩm bổ sung từ các danh mục khác nhau
   */
  static async getCrossSellingRecommendations(userId, currentProduct = null) {
    try {
      const pool = await sql.connect();

      // Nếu có sản phẩm hiện tại, lấy danh mục của nó
      let currentCategoryId = null;
      if (currentProduct) {
        const catResult = await pool
          .request()
          .input("productId", sql.Int, currentProduct)
          .query(`SELECT category_id FROM Products WHERE id = @productId`);
        currentCategoryId = catResult.recordset[0]?.category_id;
      }

      // Tìm sản phẩm thường được mua cùng
      const crossSellResult = await pool
        .request()
        .input("userId", sql.Int, userId).query(`
          SELECT TOP 15
            p.id,
            p.name,
            p.price,
            p.image_url AS image,
            c.name as category_name,
            COUNT(*) as co_purchase_count,
            AVG(CAST(p.rating AS FLOAT)) as rating
          FROM UserInteractions ui1
          JOIN UserInteractions ui2 ON ui1.user_id = ui2.user_id 
            AND DATEDIFF(DAY, ui1.created_at, ui2.created_at) BETWEEN 0 AND 30
          JOIN Products p ON ui2.product_id = p.id
          JOIN Categories c ON p.category_id = c.id
          WHERE ui1.user_id = @userId 
            AND ui2.event_type = 'purchase'
            ${currentCategoryId ? `AND c.id != ${currentCategoryId}` : ""}
          GROUP BY p.id, p.name, p.price, p.image_url, c.name
          ORDER BY co_purchase_count DESC, rating DESC
        `);

      // Gợi ý sản phẩm bổ sung từ danh mục khác
      const complementaryResult = await pool
        .request()
        .input("userId", sql.Int, userId).query(`
          SELECT TOP 10
            p.id,
            p.name,
            p.price,
            p.image_url AS image,
            c.name as category_name,
            'Bổ sung' as recommendation_type
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE ${currentCategoryId ? `p.category_id != ${currentCategoryId}` : "1=1"}
            AND p.stock > 0
            AND p.id NOT IN (
              SELECT DISTINCT product_id FROM UserInteractions 
              WHERE user_id = @userId
            )
          ORDER BY p.purchase_count DESC, p.rating DESC
        `);

      return {
        text: "Dưới đây là những sản phẩm bổ sung có thể bạn cần:",
        co_purchased_products: crossSellResult.recordset.slice(0, 5),
        complementary_products: complementaryResult.recordset.slice(0, 5),
        context_type: "CROSS_SELLING",
        cross_sell_strategy: "Sản phẩm từ danh mục khác nhau",
      };
    } catch (err) {
      console.error("Error getting cross-selling recommendations:", err);
      return {
        text: "Có lỗi khi lấy gợi ý bán chéo.",
        recommendations: [],
      };
    }
  }

  /**
   * 10. UP_SELLING - Gợi ý nâng cấp
   * Gợi ý các phiên bản cao cấp, nâng cấp của sản phẩm hiện tại
   */
  static async getUpsellRecommendations(
    userId,
    currentProduct,
    userBudget = null,
  ) {
    try {
      const pool = await sql.connect();

      // Lấy thông tin sản phẩm hiện tại
      const productResult = await pool
        .request()
        .input("productId", sql.Int, currentProduct).query(`
          SELECT id, name, price, category_id, brand
          FROM Products
          WHERE id = @productId
        `);

      const product = productResult.recordset[0];
      if (!product)
        return { text: "Không tìm thấy sản phẩm.", recommendations: [] };

      // Tìm sản phẩm nâng cấp (giá cao hơn, rating cao hơn)
      const upsellResult = await pool
        .request()
        .input("price", sql.Int, product.price)
        .input("brand", sql.NVarChar(255), product.brand)
        .input("categoryId", sql.Int, product.category_id).query(`
          SELECT TOP 10
            p.id,
            p.name,
            p.price,
            p.image_url AS image,
            p.rating,
            p.review_count,
            c.name as category_name,
            CAST(((p.price - @price) / CAST(@price AS FLOAT)) * 100 AS INT) as price_increase_percent,
            CASE
              WHEN p.rating > 4.5 THEN 'Premium'
              WHEN p.rating > 4.0 THEN 'High Quality'
              ELSE 'Better Performance'
            END as upsell_reason
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE p.price > @price
            AND p.price <= @price * 1.5
            AND p.category_id = @categoryId
            AND p.stock > 0
            AND p.rating >= 4.0
          ORDER BY p.rating DESC, p.purchase_count DESC
        `);

      const recommendations = upsellResult.recordset.slice(0, 5);

      return {
        text: `Bạn có thể xem xét những phiên bản nâng cấp của sản phẩm này:`,
        current_product: {
          id: product.id,
          name: product.name,
          price: product.price,
          rating: product.rating,
        },
        premium_alternatives: recommendations,
        context_type: "UP_SELLING",
        upsell_incentives: this.generateUpsellIncentives(
          product.price,
          recommendations,
        ),
      };
    } catch (err) {
      console.error("Error getting upsell recommendations:", err);
      return {
        text: "Có lỗi khi lấy gợi ý nâng cấp.",
        recommendations: [],
      };
    }
  }

  /**
   * 11. LOW_CONFIDENCE_CLARIFICATION - Hỏi lại khi thiếu thông tin
   * Yêu cầu thêm thông tin khi mức tin cậy thấp
   */
  static async requestClarification(userId, userMessage, currentContext) {
    try {
      // Phân tích mức tin cậy của câu hỏi
      const confidence = this.calculateMessageConfidence(
        userMessage,
        currentContext,
      );

      if (confidence < 0.4) {
        // Tin cậy thấp - cần hỏi lại
        const clarificationQuestions = this.generateClarificationQuestions(
          userMessage,
          currentContext,
        );

        return {
          text: "Tôi muốn hiểu rõ hơn nhu cầu của bạn. Bạn có thể trả lời những câu hỏi sau không?",
          confidence_score: confidence,
          clarification_questions: clarificationQuestions,
          context_type: "LOW_CONFIDENCE_CLARIFICATION",
          suggestion:
            "Vui lòng cung cấp thêm chi tiết để tôi có thể gợi ý chính xác hơn.",
        };
      }

      return {
        confidence_score: confidence,
        can_proceed: true,
      };
    } catch (err) {
      console.error("Error requesting clarification:", err);
      return {
        confidence_score: 0.5,
        can_proceed: false,
      };
    }
  }

  // ==================== HELPER METHODS ====================

  static identifyPrimaryNeed(eventFreq, userMessage, categoryCount) {
    if (eventFreq.purchase > 5) return "Regular Buyer";
    if (eventFreq.view > eventFreq.purchase * 3) return "Research Phase";
    if (categoryCount > 5) return "Multi-Category Buyer";
    return "General Browser";
  }

  static async getProductsForNeed(need, userId, categories) {
    // Lấy sản phẩm phù hợp với loại nhu cầu
    return RecommendationEngine.getPersonalizedRecommendations(userId, 10);
  }

  static generateNeedAnalysisResponse(need, message) {
    const responses = {
      "Regular Buyer":
        "Bạn là một người mua sắm thường xuyên. Tôi sẽ tập trung vào sản phẩm chất lượng cao.",
      "Research Phase":
        "Bạn đang trong giai đoạn tìm hiểu. Tôi sẽ giúp bạn so sánh các lựa chọn.",
      "Multi-Category Buyer":
        "Bạn quan tâm đến nhiều loại sản phẩm. Tôi sẽ đề xuất theo sở thích đa dạng của bạn.",
      "General Browser":
        "Bạn đang khám phá. Hãy cho tôi biết thêm về sở thích của bạn.",
    };
    return responses[need] || "Tôi sẽ giúp bạn tìm sản phẩm phù hợp nhất.";
  }

  static extractRefinementFilters(message, previousProducts) {
    const filters = {};

    // Trích xuất giá
    const priceMatch = message.match(/(\d+)\s*(triệu|k|₫)/gi);
    if (priceMatch) {
      // Logic trích xuất giá
    }

    // Trích xuất rating
    if (message.includes("rating cao") || message.includes("đánh giá tốt")) {
      filters.minRating = 4.0;
    }

    // Trích xuất brands
    const brands = ["apple", "samsung", "dell", "sony", "lg", "hp"];
    filters.brands = brands.filter((b) => message.toLowerCase().includes(b));

    return filters;
  }

  static generateFilterExplanation(filters) {
    const parts = [];
    if (filters.minPrice)
      parts.push(`Giá từ ${filters.minPrice.toLocaleString("vi-VN")}₫`);
    if (filters.maxPrice)
      parts.push(`đến ${filters.maxPrice.toLocaleString("vi-VN")}₫`);
    if (filters.minRating) parts.push(`Rating từ ${filters.minRating}/5`);
    if (filters.brands) parts.push(`Thương hiệu: ${filters.brands.join(", ")}`);
    return parts.join(", ");
  }

  static rerankRecommendations(recommendations, weights) {
    return recommendations.sort((a, b) => {
      const scoreA =
        (a.price ? weights.price * (1 - a.price / 100000000) : 0) +
        (a.rating ? weights.rating * (a.rating / 5) : 0) +
        (weights.popularity * (a.purchase_count || 0)) / 1000;

      const scoreB =
        (b.price ? weights.price * (1 - b.price / 100000000) : 0) +
        (b.rating ? weights.rating * (b.rating / 5) : 0) +
        (weights.popularity * (b.purchase_count || 0)) / 1000;

      return scoreB - scoreA;
    });
  }

  static generatePrioritySummary(changes, oldWeights, newWeights) {
    return `Bạn đã thay đổi ưu tiên của bạn. Những thay đổi chính: ${Object.keys(changes).join(", ")}`;
  }

  static async findRecommendationReasons(productId, userId, source) {
    const reasons = [];

    reasons.push({
      reason: "Popular Choice",
      description: "Sản phẩm này được nhiều khách hàng mua.",
      weight: 0.3,
    });
    reasons.push({
      reason: "High Rating",
      description: "Sản phẩm có đánh giá tốt từ người dùng.",
      weight: 0.25,
    });
    reasons.push({
      reason: "Your Interest",
      description: "Phù hợp với sở thích của bạn.",
      weight: 0.25,
    });
    reasons.push({
      reason: "Price Point",
      description: "Giá cạnh tranh.",
      weight: 0.2,
    });

    return reasons;
  }

  static formatRecommendationExplanation(reasons) {
    return reasons.map((r) => `• ${r.reason}: ${r.description}`).join("\n");
  }

  static async findBetterAlternatives(categoryId, maxPrice, userId) {
    // Tìm sản phẩm tốt hơn trong cùng danh mục
    return [];
  }

  static getDateRange(timeRange) {
    const today = new Date();
    const days = timeRange === "7days" ? 7 : timeRange === "90days" ? 90 : 30;
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }

  static generateTrendSummary(trendingProducts) {
    return `Các sản phẩm hot nhất hiện tại: ${trendingProducts
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ")}`;
  }

  static async analyzePurchaseCycle(userId) {
    // Phân tích chu kỳ mua hàng
    return {
      avg_interval_days: 30,
      days_since_last_purchase: 10,
    };
  }

  static async predictSeasonalNeeds(userId) {
    // Dự đoán nhu cầu theo mùa
    return [
      {
        type: "Seasonal Product",
        description: "Sắp có mùa mua sắm",
        confidence: 0.7,
      },
    ];
  }

  static async getComplementaryProducts(userId) {
    // Lấy sản phẩm bổ sung
    return [];
  }

  static calculatePredictionConfidence(purchaseCycle) {
    return Math.min((purchaseCycle.avg_interval_days || 0) / 60, 1);
  }

  static generateBehaviorInsights(eventBreakdown, engagementScore) {
    return [
      `Mức engagement của bạn là ${engagementScore}%`,
      `Bạn chủ yếu tìm kiếm và xem sản phẩm`,
      `Nên tiếp tục cải thiện trải nghiệm mua sắm`,
    ];
  }

  static generateUpsellIncentives(currentPrice, premiumOptions) {
    const incentives = [];
    if (premiumOptions.length > 0) {
      const priceIncrease = premiumOptions[0].price_increase_percent;
      incentives.push(
        `Chỉ cần tăng thêm ${priceIncrease}% để có phiên bản tốt hơn`,
      );
    }
    return incentives;
  }

  static calculateMessageConfidence(message, context) {
    // Tính toán mức tin cậy của tin nhắn
    let confidence = 0.5;

    if (message.length > 20) confidence += 0.2;
    if (message.includes("?")) confidence -= 0.1;
    if (context && context.previousQueries > 0) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  static generateClarificationQuestions(message, context) {
    return [
      { question: "Bạn đang tìm kiếm loại sản phẩm nào?", type: "category" },
      {
        question: "Ngân sách của bạn là bao nhiêu?",
        type: "budget",
      },
      {
        question: "Bạn ưu tiên yếu tố nào nhất?",
        type: "priority",
      },
    ];
  }
}

module.exports = AdvancedIntentHandler;
