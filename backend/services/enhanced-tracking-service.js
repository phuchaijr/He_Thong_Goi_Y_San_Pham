/**
 * Enhanced Tracking Service - Backend
 * Xử lý tracking chi tiết và lưu trữ hành vi người dùng
 */

const { sql } = require("../db");

class EnhancedTrackingService {
  /**
   * Track xem sản phẩm (chi tiết)
   */
  static async trackViewProduct(userId, productId, trackingData = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          session_id,
          time_on_page,
          scroll_depth,
          created_at
        )
        VALUES (
          ${userId || null},
          ${productId},
          'view',
          '${JSON.stringify(trackingData).replace(/'/g, "''")}',
          '${trackingData.session_id || ""}',
          ${trackingData.time_on_page || 0},
          ${trackingData.scroll_depth || 0},
          GETDATE()
        )
      `);

      // Cập nhật ProductViewLog
      await sql.query(`
        INSERT INTO ProductViewLog (user_id, product_id, view_duration, created_at)
        VALUES (${userId || null}, ${productId}, ${trackingData.view_duration || 0}, GETDATE())
      `);

      return { success: true, event: "view_product" };
    } catch (err) {
      console.error("Error tracking view product:", err);
      throw err;
    }
  }

  /**
   * Track thêm vào giỏ hàng (chi tiết)
   */
  static async trackAddToCart(
    userId,
    productId,
    quantity = 1,
    trackingData = {},
  ) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          session_id,
          created_at
        )
        VALUES (
          ${userId || null},
          ${productId},
          'add_to_cart',
          '${JSON.stringify({ ...trackingData, quantity }).replace(/'/g, "''")}',
          '${trackingData.session_id || ""}',
          GETDATE()
        )
      `);

      return { success: true, event: "add_to_cart" };
    } catch (err) {
      console.error("Error tracking add to cart:", err);
      throw err;
    }
  }

  /**
   * Track xóa khỏi giỏ hàng
   */
  static async trackRemoveFromCart(
    userId,
    productId,
    quantity = 1,
    trackingData = {},
  ) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId || null},
          ${productId},
          'remove_from_cart',
          '${JSON.stringify({ ...trackingData, quantity }).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "remove_from_cart" };
    } catch (err) {
      console.error("Error tracking remove from cart:", err);
      throw err;
    }
  }

  /**
   * Track mua hàng (chi tiết)
   */
  static async trackPurchase(userId, productId, orderData = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId},
          ${productId},
          'purchase',
          '${JSON.stringify(orderData).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      // Cập nhật purchase count
      await sql.query(`
        UPDATE Products SET purchase_count = purchase_count + 1
        WHERE id = ${productId}
      `);

      return { success: true, event: "purchase" };
    } catch (err) {
      console.error("Error tracking purchase:", err);
      throw err;
    }
  }

  /**
   * Track tìm kiếm (chi tiết)
   */
  static async trackSearch(userId, query, resultsCount = 0, trackingData = {}) {
    try {
      await sql.query(`
        INSERT INTO SearchHistory (
          user_id,
          query,
          results_count,
          search_data,
          created_at
        )
        VALUES (
          ${userId || null},
          '${query.replace(/'/g, "''")}',
          ${resultsCount},
          '${JSON.stringify(trackingData).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "search", query, results: resultsCount };
    } catch (err) {
      console.error("Error tracking search:", err);
      throw err;
    }
  }

  /**
   * Track click sản phẩm
   */
  static async trackProductClick(userId, productId, clickContext = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId || null},
          ${productId},
          'click',
          '${JSON.stringify(clickContext).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "product_click" };
    } catch (err) {
      console.error("Error tracking product click:", err);
      throw err;
    }
  }

  /**
   * Track click danh mục
   */
  static async trackCategoryClick(userId, categoryId, categoryData = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          category_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId || null},
          ${categoryId},
          'view_category',
          '${JSON.stringify(categoryData).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "category_click" };
    } catch (err) {
      console.error("Error tracking category click:", err);
      throw err;
    }
  }

  /**
   * Track wishlist
   */
  static async trackWishlist(userId, productId, productData = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId},
          ${productId},
          'wishlist',
          '${JSON.stringify(productData).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "wishlist" };
    } catch (err) {
      console.error("Error tracking wishlist:", err);
      throw err;
    }
  }

  /**
   * Track đánh giá
   */
  static async trackRating(userId, productId, rating, review = "") {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          product_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId},
          ${productId},
          'rating',
          '${JSON.stringify({ rating, review }).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: "rating", rating };
    } catch (err) {
      console.error("Error tracking rating:", err);
      throw err;
    }
  }

  /**
   * Track tương tác chung
   */
  static async trackInteraction(userId, eventType, eventData = {}) {
    try {
      await sql.query(`
        INSERT INTO UserInteractions (
          user_id,
          event_type,
          event_data,
          created_at
        )
        VALUES (
          ${userId || null},
          '${eventType}',
          '${JSON.stringify(eventData).replace(/'/g, "''")}',
          GETDATE()
        )
      `);

      return { success: true, event: eventType };
    } catch (err) {
      console.error("Error tracking interaction:", err);
      throw err;
    }
  }

  /**
   * Track phiên làm việc
   */
  static async trackSession(userId, sessionData = {}) {
    try {
      await sql.query(`
        INSERT INTO SessionLogs (
          user_id,
          session_id,
          page,
          total_interactions,
          session_duration,
          time_on_page,
          scroll_depth,
          click_count,
          device_type,
          mouse_activity_count,
          created_at
        )
        VALUES (
          ${userId || null},
          '${sessionData.session_id || ""}',
          '${sessionData.page || ""}',
          ${sessionData.total_interactions || 0},
          ${sessionData.session_duration || 0},
          ${sessionData.time_on_page || 0},
          ${sessionData.scroll_depth || 0},
          ${sessionData.click_count || 0},
          '${sessionData.device_type || "desktop"}',
          ${sessionData.mouse_activity_count || 0},
          GETDATE()
        )
      `);

      return { success: true, event: "session" };
    } catch (err) {
      console.error("Error tracking session:", err);
      throw err;
    }
  }

  /**
   * Track batch interactions (gửi nhiều tương tác cùng lúc)
   */
  static async trackBatch(userId, interactions = []) {
    try {
      for (const interaction of interactions) {
        await this.trackInteraction(
          userId,
          interaction.event_type,
          interaction.event_data,
        );
      }

      return { success: true, count: interactions.length };
    } catch (err) {
      console.error("Error tracking batch:", err);
      throw err;
    }
  }

  /**
   * Lấy tóm tắt hành vi người dùng
   */
  static async getUserActivitySummary(userId) {
    try {
      const result = await sql.query(`
        SELECT
          COUNT(*) as total_interactions,
          COUNT(DISTINCT product_id) as unique_products,
          SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchases,
          SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) as cart_additions,
          SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
          SUM(CASE WHEN event_type = 'wishlist' THEN 1 ELSE 0 END) as wishlist_items,
          SUM(CASE WHEN event_type = 'rating' THEN 1 ELSE 0 END) as ratings,
          MAX(created_at) as last_interaction
        FROM UserInteractions
        WHERE user_id = ${userId}
      `);

      if (!result.recordset.length) {
        return {
          total_interactions: 0,
          unique_products: 0,
          purchases: 0,
          cart_additions: 0,
          views: 0,
          wishlist_items: 0,
          ratings: 0,
        };
      }

      return result.recordset[0];
    } catch (err) {
      console.error("Error getting activity summary:", err);
      return {};
    }
  }
}

module.exports = EnhancedTrackingService;
