const { UserInteractions, SearchHistory } = require("../models");

class TrackingService {
  /**
   * Track user view product
   */
  static async trackViewProduct(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "view",
      });
    } catch (err) {
      console.error("Error tracking product view:", err.message);
      return null;
    }
  }

  /**
   * Track user add to cart
   */
  static async trackAddToCart(userId, productId, quantity = 1) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "add_to_cart",
      });
    } catch (err) {
      console.error("Error tracking add to cart:", err.message);
      return null;
    }
  }

  /**
   * Track user purchase
   */
  static async trackPurchase(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "purchase",
      });
    } catch (err) {
      console.error("Error tracking purchase:", err.message);
      return null;
    }
  }

  /**
   * Track user click on category
   */
  static async trackCategoryClick(userId, categoryId) {
    try {
      if (!userId || !categoryId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: categoryId, // Store category as product_id temporarily
        interaction_type: "view_category",
      });
    } catch (err) {
      console.error("Error tracking category click:", err.message);
      return null;
    }
  }

  /**
   * Track user search
   */
  static async trackSearch(userId, query, resultsCount = 0) {
    try {
      if (!query) return null;

      return await SearchHistory.create({
        user_id: userId || null,
        query,
        results_count: resultsCount,
      });
    } catch (err) {
      console.error("Error tracking search:", err.message);
      return null;
    }
  }

  /**
   * Track user click on product link
   */
  static async trackProductClick(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "click",
      });
    } catch (err) {
      console.error("Error tracking product click:", err.message);
      return null;
    }
  }

  /**
   * Track user remove from cart
   */
  static async trackRemoveFromCart(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "remove_from_cart",
      });
    } catch (err) {
      console.error("Error tracking remove from cart:", err.message);
      return null;
    }
  }

  /**
   * Track user wishlist
   */
  static async trackWishlist(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "wishlist",
      });
    } catch (err) {
      console.error("Error tracking wishlist:", err.message);
      return null;
    }
  }

  /**
   * Track user rating/review
   */
  static async trackRating(userId, productId) {
    try {
      if (!userId || !productId) return null;

      return await UserInteractions.create({
        user_id: userId,
        product_id: productId,
        interaction_type: "rate",
      });
    } catch (err) {
      console.error("Error tracking rating:", err.message);
      return null;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId) {
    try {
      const { UserInteractions } = require("../models");
      const allInteractions = await UserInteractions.findByUserId(userId);

      const summary = {
        total_views: 0,
        total_clicks: 0,
        total_add_to_cart: 0,
        total_purchases: 0,
        total_wishlist: 0,
        total_ratings: 0,
      };

      allInteractions.forEach((interaction) => {
        switch (interaction.interaction_type) {
          case "view":
            summary.total_views++;
            break;
          case "click":
            summary.total_clicks++;
            break;
          case "add_to_cart":
            summary.total_add_to_cart++;
            break;
          case "purchase":
            summary.total_purchases++;
            break;
          case "wishlist":
            summary.total_wishlist++;
            break;
          case "rate":
            summary.total_ratings++;
            break;
        }
      });

      return summary;
    } catch (err) {
      console.error("Error getting user activity summary:", err.message);
      return null;
    }
  }

  /**
   * Track chat interaction with chatbot
   */
  static async trackChatInteraction(userId, message, intent, conversationId) {
    try {
      if (!userId || !message) return null;

      // This can be extended to save to database if needed
      console.log(
        `📝 Chat interaction tracked - User: ${userId}, Intent: ${intent}, Message: ${message.substring(0, 50)}...`,
      );

      return {
        userId,
        message,
        intent,
        conversationId,
        timestamp: new Date(),
      };
    } catch (err) {
      console.error("Error tracking chat interaction:", err.message);
      return null;
    }
  }
}

module.exports = TrackingService;
