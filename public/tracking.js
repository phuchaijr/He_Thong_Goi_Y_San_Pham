/**
 * Tracking Service - Client Side
 * Ghi lại tất cả hành vi người dùng vào database
 */

class TrackingManager {
  constructor() {
    this.userId = this.getUserIdFromLocalStorage();
    this.apiBaseUrl = "/api/tracking";
  }

  /**
   * Get user ID from localStorage
   */
  getUserIdFromLocalStorage() {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const data = JSON.parse(authData);
        return data.user?.id || null;
      }
      return null;
    } catch (err) {
      console.error("Error getting user ID:", err);
      return null;
    }
  }

  /**
   * Update user ID (call after login)
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Send tracking data to server
   */
  async sendTracking(endpoint, data) {
    try {
      // Thêm user_id nếu có
      if (this.userId) {
        data.user_id = this.userId;
      }

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Tracking error:", err);
      return null;
    }
  }

  /**
   * Track xem sản phẩm
   */
  async trackViewProduct(productId) {
    if (!productId) return;
    return this.sendTracking("/view-product", { product_id: productId });
  }

  /**
   * Track thêm vào giỏ hàng
   */
  async trackAddToCart(productId, quantity = 1) {
    if (!productId) return;
    return this.sendTracking("/add-to-cart", {
      product_id: productId,
      quantity,
    });
  }

  /**
   * Track mua hàng
   */
  async trackPurchase(productId) {
    if (!productId || !this.userId) return;
    return this.sendTracking("/purchase", { product_id: productId });
  }

  /**
   * Track click vào danh mục
   */
  async trackCategoryClick(categoryId) {
    if (!categoryId) return;
    return this.sendTracking("/category-click", { category_id: categoryId });
  }

  /**
   * Track tìm kiếm
   */
  async trackSearch(query, resultsCount = 0) {
    if (!query) return;
    return this.sendTracking("/search", {
      query,
      results_count: resultsCount,
    });
  }

  /**
   * Track click vào sản phẩm
   */
  async trackProductClick(productId) {
    if (!productId) return;
    return this.sendTracking("/product-click", { product_id: productId });
  }

  /**
   * Track xóa khỏi giỏ hàng
   */
  async trackRemoveFromCart(productId) {
    if (!productId) return;
    return this.sendTracking("/remove-from-cart", { product_id: productId });
  }

  /**
   * Track thêm vào wishlist
   */
  async trackWishlist(productId) {
    if (!productId || !this.userId) return;
    return this.sendTracking("/wishlist", { product_id: productId });
  }

  /**
   * Track đánh giá sản phẩm
   */
  async trackRating(productId) {
    if (!productId || !this.userId) return;
    return this.sendTracking("/rating", { product_id: productId });
  }

  /**
   * Get activity summary của user
   */
  async getActivitySummary() {
    if (!this.userId) return null;
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/activity/${this.userId}`,
      );
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error("Error getting activity summary:", err);
      return null;
    }
  }
}

// Create global instance
const tracker = new TrackingManager();
