/**
 * Hành vi Tổng hợp Service - Tổng hợp và phân tích hành vi người dùng
 * Tối ưu cho hệ thống gợi ý sản phẩm
 */

const { sql } = require("../db");

class BehaviorAggregationService {
  /**
   * Tính toán điểm hành vi tương tác với sản phẩm
   * Weight: view=1, click=3, add_to_cart=5, purchase=10, wishlist=8, rating=7
   */
  static async calculateProductEngagementScore(userId, productId) {
    try {
      const result = await sql.query(`
        SELECT
          SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
          SUM(CASE WHEN event_type = 'click' THEN 3 ELSE 0 END) as clicks,
          SUM(CASE WHEN event_type = 'add_to_cart' THEN 5 ELSE 0 END) as cart_adds,
          SUM(CASE WHEN event_type = 'purchase' THEN 10 ELSE 0 END) as purchases,
          SUM(CASE WHEN event_type = 'wishlist' THEN 8 ELSE 0 END) as wishlist,
          SUM(CASE WHEN event_type = 'rating' THEN 7 ELSE 0 END) as ratings
        FROM UserInteractions
        WHERE ${userId ? `user_id = ${userId} AND` : ""} product_id = ${productId}
      `);

      if (!result.recordset.length) return 0;

      const row = result.recordset[0];
      const score =
        (row.views || 0) +
        (row.clicks || 0) +
        (row.cart_adds || 0) +
        (row.purchases || 0) +
        (row.wishlist || 0) +
        (row.ratings || 0);

      return score;
    } catch (err) {
      console.error("Error calculating engagement score:", err);
      return 0;
    }
  }

  /**
   * Lấy các danh mục ưa thích của người dùng dựa trên hành vi
   */
  static async getUserPreferredCategories(userId, limit = 5) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          c.id,
          c.name,
          c.slug,
          COUNT(*) as interaction_count,
          SUM(CASE WHEN ui.event_type = 'purchase' THEN 1 ELSE 0 END) as purchase_count,
          SUM(CASE WHEN ui.event_type = 'add_to_cart' THEN 1 ELSE 0 END) as cart_count,
          SUM(CASE WHEN ui.event_type = 'view' THEN 1 ELSE 0 END) as view_count
        FROM UserInteractions ui
        JOIN Products p ON ui.product_id = p.id
        JOIN Categories c ON p.category_id = c.id
        WHERE ui.user_id = ${userId}
        GROUP BY c.id, c.name, c.slug
        ORDER BY
          SUM(CASE WHEN ui.event_type = 'purchase' THEN 10 ELSE 0 END) +
          SUM(CASE WHEN ui.event_type = 'add_to_cart' THEN 5 ELSE 0 END) +
          SUM(CASE WHEN ui.event_type = 'view' THEN 1 ELSE 0 END) DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting user preferred categories:", err);
      return [];
    }
  }

  /**
   * Lấy các sản phẩm tương tự với các sản phẩm mà người dùng đã xem/mua
   */
  static async getSimilarProductsFromUserHistory(userId, limit = 10) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.category_id,
          c.name as category_name,
          COUNT(*) as similarity_score,
          SUM(CASE WHEN ui.event_type = 'purchase' THEN 10 ELSE 0 END) as purchase_relevance
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        JOIN UserInteractions ui ON ui.product_id = p.id
        WHERE ui.user_id = ${userId}
          AND p.id NOT IN (
            SELECT DISTINCT product_id FROM UserInteractions
            WHERE user_id = ${userId}
          )
        GROUP BY p.id, p.name, p.price, p.category_id, c.name
        ORDER BY purchase_relevance DESC, COUNT(*) DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting similar products:", err);
      return [];
    }
  }

  /**
   * Lấy thống kê hành vi chi tiết của người dùng
   */
  static async getUserBehaviorStats(userId) {
    try {
      const result = await sql.query(`
        SELECT
          COUNT(*) as total_interactions,
          COUNT(DISTINCT product_id) as unique_products_viewed,
          COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN product_id END) as purchased_products,
          COUNT(DISTINCT CASE WHEN event_type = 'view' THEN product_id END) as viewed_products,
          COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN product_id END) as carted_products,
          COUNT(DISTINCT CASE WHEN event_type = 'wishlist' THEN product_id END) as wishlist_products,
          COUNT(DISTINCT category_id) as categories_visited,
          SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchase_count,
          SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as cart_add_count,
          SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as view_count
        FROM UserInteractions
        WHERE user_id = ${userId}
      `);

      if (!result.recordset.length) {
        return {
          total_interactions: 0,
          unique_products_viewed: 0,
          purchased_products: 0,
          viewed_products: 0,
          carted_products: 0,
          wishlist_products: 0,
          categories_visited: 0,
          purchase_count: 0,
          cart_add_count: 0,
          view_count: 0,
        };
      }

      return result.recordset[0];
    } catch (err) {
      console.error("Error getting user behavior stats:", err);
      return {};
    }
  }

  /**
   * Lấy lịch sử tìm kiếm và phân tích ý định
   */
  static async getUserSearchHistory(userId, limit = 20) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          query,
          COUNT(*) as frequency,
          SUM(results_count) as total_results,
          MAX(created_at) as last_search,
          AVG(CAST(results_count as FLOAT)) as avg_results
        FROM SearchHistory
        WHERE user_id = ${userId}
        GROUP BY query
        ORDER BY frequency DESC, last_search DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting search history:", err);
      return [];
    }
  }

  /**
   * Phân tích các truy vấn tìm kiếm thành danh mục ý định
   */
  static async analyzeSearchIntent(userId) {
    try {
      const result = await sql.query(`
        SELECT TOP 10
          c.id,
          c.name,
          c.slug,
          COUNT(*) as search_mentions
        FROM SearchHistory sh
        JOIN Products p ON sh.query LIKE '%' + p.name + '%' OR sh.query LIKE '%' + c.name + '%'
        JOIN Categories c ON p.category_id = c.id
        WHERE sh.user_id = ${userId}
        GROUP BY c.id, c.name, c.slug
        ORDER BY search_mentions DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error analyzing search intent:", err);
      return [];
    }
  }

  /**
   * Tính toán điểm tương đồng giữa hai người dùng dựa trên hành vi
   */
  static async calculateUserSimilarity(userId1, userId2) {
    try {
      // Lấy các sản phẩm mà cả hai đều đã tương tác
      const result = await sql.query(`
        SELECT
          COUNT(*) as common_products,
          SUM(CASE WHEN ui1.event_type = 'purchase' AND ui2.event_type = 'purchase' THEN 1 ELSE 0 END) as common_purchases
        FROM UserInteractions ui1
        JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id
        WHERE ui1.user_id = ${userId1} AND ui2.user_id = ${userId2}
      `);

      if (!result.recordset.length) return 0;

      const row = result.recordset[0];
      const similarity =
        (row.common_products || 0) * 5 + (row.common_purchases || 0) * 20;

      return similarity;
    } catch (err) {
      console.error("Error calculating user similarity:", err);
      return 0;
    }
  }

  /**
   * Tìm các người dùng tương tự
   */
  static async findSimilarUsers(userId, limit = 10) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          u.id,
          u.full_name,
          u.email,
          (
            SELECT COUNT(*) FROM UserInteractions ui1
            JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id
            WHERE ui1.user_id = ${userId} AND ui2.user_id = u.id
          ) as common_interactions,
          (
            SELECT COUNT(*)
            FROM UserInteractions ui1
            JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id AND ui1.event_type = 'purchase' AND ui2.event_type = 'purchase'
            WHERE ui1.user_id = ${userId} AND ui2.user_id = u.id
          ) as common_purchases
        FROM Users u
        WHERE u.id != ${userId}
          AND EXISTS (
            SELECT 1 FROM UserInteractions ui1
            JOIN UserInteractions ui2 ON ui1.product_id = ui2.product_id
            WHERE ui1.user_id = ${userId} AND ui2.user_id = u.id
          )
        ORDER BY common_interactions DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error finding similar users:", err);
      return [];
    }
  }

  /**
   * Lấy các sản phẩm được mua chung (thường xuyên mua cùng nhau)
   */
  static async getFrequentlyBoughtTogether(productId, limit = 5) {
    try {
      const result = await sql.query(`
        SELECT TOP ${limit}
          p.id,
          p.name,
          p.price,
          p.category_id,
          c.name as category_name,
          COUNT(*) as frequency,
          CAST(COUNT(*) AS FLOAT) / (
            SELECT COUNT(DISTINCT user_id) FROM UserInteractions
            WHERE product_id = ${productId} AND event_type = 'purchase'
          ) * 100 as purchase_correlation_percent
        FROM UserInteractions ui1
        JOIN UserInteractions ui2 ON ui1.user_id = ui2.user_id
        JOIN Products p ON ui2.product_id = p.id
        JOIN Categories c ON p.category_id = c.id
        WHERE ui1.product_id = ${productId}
          AND ui1.event_type = 'purchase'
          AND ui2.event_type = 'purchase'
          AND ui2.product_id != ${productId}
        GROUP BY p.id, p.name, p.price, p.category_id, c.name
        ORDER BY frequency DESC
      `);

      return result.recordset;
    } catch (err) {
      console.error("Error getting frequently bought together:", err);
      return [];
    }
  }

  /**
   * Tính độ dài phiên và thời gian trung bình giữa các tương tác
   */
  static async calculateSessionMetrics(userId) {
    try {
      const result = await sql.query(`
        SELECT
          COUNT(*) as total_interactions,
          DATEDIFF(SECOND, MIN(created_at), MAX(created_at)) as session_duration_seconds,
          CAST(COUNT(*) AS FLOAT) / NULLIF(DATEDIFF(DAY, MIN(created_at), MAX(created_at)), 0) as avg_interactions_per_day,
          DATEDIFF(DAY, MAX(created_at), GETDATE()) as days_since_last_activity
        FROM UserInteractions
        WHERE user_id = ${userId}
      `);

      if (!result.recordset.length) return {};
      return result.recordset[0];
    } catch (err) {
      console.error("Error calculating session metrics:", err);
      return {};
    }
  }

  /**
   * Xác định mục tiêu/ý định của người dùng dựa trên hành vi
   */
  static async identifyUserIntent(userId) {
    try {
      const recentInteractions = await sql.query(`
        SELECT TOP 50
          event_type,
          COUNT(*) as count
        FROM UserInteractions
        WHERE user_id = ${userId}
          AND created_at > DATEADD(DAY, -30, GETDATE())
        GROUP BY event_type
        ORDER BY count DESC
      `);

      const categories = await this.getUserPreferredCategories(userId, 3);
      const searchHistory = await this.getUserSearchHistory(userId, 5);

      return {
        primary_intent:
          recentInteractions.recordset[0]?.event_type || "browsing",
        recent_event_distribution: recentInteractions.recordset,
        preferred_categories: categories,
        search_keywords: searchHistory.map((s) => s.query),
      };
    } catch (err) {
      console.error("Error identifying user intent:", err);
      return {};
    }
  }
}

module.exports = BehaviorAggregationService;
