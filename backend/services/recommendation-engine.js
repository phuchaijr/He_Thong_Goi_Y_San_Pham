/**
 * Recommendation Engine Service
 * Tạo các gợi ý sản phẩm dựa trên hành vi người dùng
 */

const { sql } = require("../db");
const BehaviorAggregationService = require("./behavior-aggregation-service");

class RecommendationEngine {
  /**
   * Lấy gợi ý sản phẩm cho người dùng (Collaborative Filtering + Content-Based)
   */
  static async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // Bước 1: Lấy các danh mục ưa thích
      const preferredCategories =
        await BehaviorAggregationService.getUserPreferredCategories(userId, 5);

      if (preferredCategories.length === 0) {
        // Nếu không có lịch sử, trả về sản phẩm phổ biến
        return this.getPopularProducts(limit);
      }

      // Bước 2: Lấy sản phẩm từ các danh mục ưa thích
      const categoryIds = preferredCategories.map((c) => c.id).join(",");

      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.image_url As image,
          p.category_id,
          c.name as category_name,
          p.purchase_count,
          (
            SELECT COUNT(*) FROM UserInteractions
            WHERE product_id = p.id AND event_type = 'view'
          ) as view_count,
          (
            SELECT COUNT(*) FROM UserInteractions
            WHERE product_id = p.id AND event_type = 'purchase'
          ) as purchase_count_total,
          CASE
            WHEN p.id IN (
              SELECT product_id FROM UserInteractions WHERE user_id = ${userId}
            ) THEN 0 ELSE 1
          END as is_new_to_user,
          (
            SELECT COUNT(*) FROM UserInteractions ui
            WHERE ui.product_id IN (
              SELECT product_id FROM UserInteractions
              WHERE user_id = ${userId}
            ) AND ui.product_id = p.id
          ) as similar_to_user_history
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE p.category_id IN (${categoryIds})
          AND p.id NOT IN (
            SELECT DISTINCT product_id FROM UserInteractions
            WHERE user_id = ${userId} AND event_type = 'purchase'
          )
          AND p.stock > 0
        ORDER BY
          (
            SELECT COUNT(*) FROM UserInteractions
            WHERE product_id = p.id AND event_type = 'purchase'
          ) DESC,
          p.purchase_count DESC,
          RAND()
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting personalized recommendations:", err);
      return [];
    }
  }

  /**
   * Lấy các sản phẩm thường xuyên mua cùng nhau
   */
  static async getFrequentlyBoughtTogetherRecommendations(
    userProductIds,
    limit = 5,
  ) {
    try {
      if (!userProductIds || userProductIds.length === 0) return [];

      const productIds = userProductIds.slice(0, 5).join(",");

      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.image_url As image,
          c.name as category_name,
          COUNT(*) as frequency,
          CAST(COUNT(*) AS FLOAT) / (
            SELECT MAX(purchase_count) FROM (
              SELECT product_id, COUNT(*) as purchase_count
              FROM UserInteractions
              WHERE product_id IN (${productIds}) AND event_type = 'purchase'
              GROUP BY product_id
            ) subq
          ) * 100 as correlation_score
        FROM UserInteractions ui1
        JOIN UserInteractions ui2 ON ui1.user_id = ui2.user_id
        JOIN Products p ON ui2.product_id = p.id
        JOIN Categories c ON p.category_id = c.id
        WHERE ui1.product_id IN (${productIds})
          AND ui1.event_type = 'purchase'
          AND ui2.event_type = 'purchase'
          AND ui2.product_id NOT IN (${productIds})
          AND p.stock > 0
        GROUP BY p.id, p.name, p.price, p.image_url, c.name
        ORDER BY frequency DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting frequently bought together:", err);
      return [];
    }
  }

  /**
   * Collaborative Filtering - Sản phẩm được người dùng tương tự mua
   */
  static async getCollaborativeFilteringRecommendations(userId, limit = 10) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.image_url AS image,
          c.name as category_name,
          COUNT(*) as recommendation_score
        FROM UserInteractions ui_similar
        JOIN Products p ON ui_similar.product_id = p.id
        JOIN Categories c ON p.category_id = c.id
        WHERE ui_similar.user_id IN (
          SELECT TOP 10 u.id
          FROM Users u
          WHERE u.id != ${userId}
            AND (
              SELECT COUNT(*)
              FROM UserInteractions ui1
              JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id
              WHERE ui1.user_id = ${userId} AND ui2.user_id = u.id
            ) > 0
          ORDER BY
            (
              SELECT COUNT(*)
              FROM UserInteractions ui1
              JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id
              WHERE ui1.user_id = ${userId} AND ui2.user_id = u.id
            ) DESC
        )
          AND ui_similar.event_type = 'purchase'
          AND ui_similar.product_id NOT IN (
            SELECT DISTINCT product_id FROM UserInteractions
            WHERE user_id = ${userId}
          )
          AND p.stock > 0
        GROUP BY p.id, p.name, p.price, p.image_url, c.name
        ORDER BY recommendation_score DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error(
        "Error getting collaborative filtering recommendations:",
        err,
      );
      return [];
    }
  }

  /**
   * Lấy các sản phẩm phổ biến (cho người dùng mới)
   */
  static async getPopularProducts(limit = 10) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.image_url AS image,
          c.name as category_name,
          p.purchase_count,
          p.rating,
          (
            SELECT COUNT(*) FROM UserInteractions
            WHERE product_id = p.id AND event_type = 'purchase'
          ) as purchase_count_interactions,
          (
            SELECT COUNT(*) FROM UserInteractions
            WHERE product_id = p.id
          ) as total_interactions
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE p.stock > 0
        ORDER BY p.purchase_count DESC, p.rating DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting popular products:", err);
      return [];
    }
  }

  /**
   * Gợi ý sản phẩm mới dựa trên danh mục ưa thích
   */
  static async getNewProductRecommendations(userId, limit = 10) {
    try {
      const preferredCategories =
        await BehaviorAggregationService.getUserPreferredCategories(userId, 5);

      if (preferredCategories.length === 0) {
        // Lấy sản phẩm mới nếu không có danh mục ưa thích
        return sql
          .query(
            `
          SELECT TOP ${limit}
            p.id,
            p.name,
            p.price,
            p.image_url AS image,
            c.name as category_name,
            p.created_at
          FROM Products p
          JOIN Categories c ON p.category_id = c.id
          WHERE p.stock > 0
          ORDER BY p.created_at DESC
        `,
          )
          .then((r) => r.recordset);
      }

      const categoryIds = preferredCategories.map((c) => c.id).join(",");

      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.image_url AS image,
          c.name as category_name,
          p.created_at
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE p.category_id IN (${categoryIds})
          AND p.stock > 0
          AND p.id NOT IN (
            SELECT DISTINCT product_id FROM UserInteractions
            WHERE user_id = ${userId}
          )
        ORDER BY p.created_at DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting new product recommendations:", err);
      return [];
    }
  }

  /**
   * Gợi ý dựa trên các sản phẩm trong giỏ hàng của người dùng
   */
  static async getCartBasedRecommendations(userId, limit = 5) {
    try {
      const pool = await sql.connect();

      const cartResult = await pool.request().input("userId", sql.Int, userId)
        .query(`
        SELECT ci.product_id
        FROM Carts c
        JOIN CartItems ci ON c.id = ci.cart_id
        WHERE c.user_id = @userId
      `);

      if (!cartResult.recordset.length) return [];

      const ids = cartResult.recordset.map((c) => c.product_id).join(",");

      const result = await pool.request().input("limit", sql.Int, limit).query(`
        SELECT TOP (@limit)
          p.id,
          p.name,
          p.price,
          p.image_url AS image,
          c.name as category_name
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE p.id NOT IN (${ids})
          AND p.stock > 0
          AND p.is_active = 1
        ORDER BY p.purchase_count DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting cart-based recommendations:", err);
      return [];
    }
  }

  /**
   * Tính toán độ tin cậy của gợi ý
   */
  static calculateRecommendationConfidence(recommendation) {
    let confidence = 0.5; // Base confidence

    if (recommendation.purchase_count > 10) confidence += 0.2;
    if (recommendation.rating && recommendation.rating >= 4.5)
      confidence += 0.15;
    if (recommendation.total_interactions > 100) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * Lấy gợi ý đa chiều cho người dùng
   */
  static async getMultiChannelRecommendations(userId, limit = 15) {
    try {
      const [personalized, collaborative, popular, newProducts, cartBased] =
        await Promise.all([
          this.getPersonalizedRecommendations(userId, Math.ceil(limit * 0.4)),
          this.getCollaborativeFilteringRecommendations(
            userId,
            Math.ceil(limit * 0.2),
          ),
          this.getPopularProducts(Math.ceil(limit * 0.2)),
          this.getNewProductRecommendations(userId, Math.ceil(limit * 0.1)),
          this.getCartBasedRecommendations(userId, Math.ceil(limit * 0.1)),
        ]);

      // Gộp kết quả và loại bỏ trùng lặp
      const recommendations = [];
      const seenIds = new Set();

      const allRecommendations = [
        ...personalized.map((r) => ({ ...r, source: "personalized" })),
        ...collaborative.map((r) => ({ ...r, source: "collaborative" })),
        ...popular.map((r) => ({ ...r, source: "popular" })),
        ...newProducts.map((r) => ({ ...r, source: "new" })),
        ...cartBased.map((r) => ({ ...r, source: "cart_based" })),
      ];

      for (const rec of allRecommendations) {
        if (!seenIds.has(rec.id)) {
          seenIds.add(rec.id);
          rec.confidence = this.calculateRecommendationConfidence(rec);
          recommendations.push(rec);

          if (recommendations.length >= limit) break;
        }
      }

      return recommendations;
    } catch (err) {
      console.error("Error getting multi-channel recommendations:", err);
      return [];
    }
  }

  /**
   * Lưu gợi ý vào database để tracking
   */
  static async saveRecommendationLog(userId, recommendations) {
    try {
      for (const rec of recommendations) {
        await sql.query(`
          INSERT INTO RecommendationLog (user_id, product_id, source, confidence, created_at)
          VALUES (${userId}, ${rec.id}, '${rec.source}', ${rec.confidence}, GETDATE())
        `);
      }
      return true;
    } catch (err) {
      console.error("Error saving recommendation log:", err);
      return false;
    }
  }
  // tìm sản phẩm rẻ
  async getCheapestProducts(keyword) {
    return db.query(`
      SELECT * FROM Products
      WHERE name LIKE @keyword
      ORDER BY price ASC
   `);
  }
  // tìm sản phẩm
  static async searchProducts(keyword, priceIntent, limit = 10) {
    try {
      limit = Math.min(parseInt(limit) || 10, 30);

      const pool = await sql.connect();
      const request = pool.request();

      let where = ["p.stock > 0", "p.is_active = 1"];
      let orderBy = "p.popularity_score DESC";

      // 🔎 Keyword search an toàn
      if (keyword) {
        request.input("keyword", sql.NVarChar(255), `%${keyword}%`);
        where.push(`
        (p.name LIKE @keyword 
         OR p.description LIKE @keyword 
         OR p.tags LIKE @keyword)
      `);
      }

      // 💰 Price logic
      if (priceIntent) {
        switch (priceIntent.type) {
          case "range":
            request.input("minPrice", sql.Int, priceIntent.min);
            request.input("maxPrice", sql.Int, priceIntent.max);
            where.push("p.price BETWEEN @minPrice AND @maxPrice");
            break;

          case "cheap":
            // nếu có keyword thì lấy rẻ nhất trong nhóm đó
            orderBy = "p.price ASC";
            break;

          case "mid":
            where.push("p.price BETWEEN 5000000 AND 15000000");
            orderBy = "p.price ASC";
            break;

          case "premium":
            orderBy = "p.price DESC";
            break;
        }
      }

      const finalWhere = "WHERE " + where.join(" AND ");

      const result = await request.query(`
      SELECT TOP (${limit})
        p.id,
        p.name,
        p.price,
        p.image_url AS image,
        p.rating,
        p.purchase_count,
        p.popularity_score,
        p.view_count
      FROM Products p
      ${finalWhere}
      ORDER BY ${orderBy}
    `);

      return result.recordset;
    } catch (err) {
      console.error("Search error:", err);
      return [];
    }
  }
}

module.exports = RecommendationEngine;
