/**
 * Advanced Tracking Manager - Client Side
 * Ghi lại chi tiết tất cả hành vi người dùng cho hệ thống gợi ý
 */

class AdvancedTrackingManager {
  constructor() {
    this.userId = this.getUserIdFromLocalStorage();
    this.apiBaseUrl = "/api/tracking";
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.isTracking = true;

    // Theo dõi hành vi tương tác
    this.interactions = [];
    this.currentPage = this.getCurrentPage();
    this.scrollDepth = 0;
    this.timeOnPage = 0;
    this.mouseMovements = [];
    this.clickCount = 0;

    this.initializeTracking();
  }

  /**
   * Tạo session ID độc đáo
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lấy user ID từ localStorage
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
   * Cập nhật user ID (gọi sau khi login)
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Lấy trang hiện tại
   */
  getCurrentPage() {
    return window.location.pathname;
  }

  /**
   * Khởi tạo tracking cho phiên hiện tại
   */
  initializeTracking() {
    // Theo dõi thời gian trên trang
    setInterval(() => {
      if (this.isTracking) {
        this.timeOnPage += 1;
      }
    }, 1000);

    // Theo dõi scroll depth
    window.addEventListener("scroll", () => {
      this.trackScrollDepth();
    });

    // Theo dõi mouse movements
    document.addEventListener("mousemove", (e) => {
      this.trackMouseMovement(e);
    });

    // Theo dõi clicks
    document.addEventListener("click", () => {
      this.clickCount++;
    });

    // Lưu session khi người dùng thoát
    window.addEventListener("beforeunload", () => {
      this.saveSessionData();
    });

    // Gửi dữ liệu mỗi 30 giây
    setInterval(() => {
      this.flushData();
    }, 30000);
  }

  /**
   * Theo dõi độ sâu scroll
   */
  trackScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const scrollPercent = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100,
    );
    if (scrollPercent > this.scrollDepth) {
      this.scrollDepth = scrollPercent;
    }
  }

  /**
   * Theo dõi chuyển động chuột (mẫu hóa)
   */
  trackMouseMovement(e) {
    if (this.mouseMovements.length < 100) {
      this.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Gửi dữ liệu theo dõi đến server
   */
  async sendTracking(endpoint, data) {
    try {
      const payload = {
        ...data,
        user_id: this.userId,
        session_id: this.sessionId,
        page: this.currentPage,
        timestamp: new Date().toISOString(),
        session_duration: Math.floor(
          (Date.now() - this.sessionStartTime) / 1000,
        ),
      };

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Tracking error:", err);
      return null;
    }
  }

  /**
   * Track xem sản phẩm (chi tiết)
   */
  async trackViewProduct(productId, productData = {}) {
    if (!productId) return;

    const data = {
      product_id: productId,
      product_name: productData.name || "",
      product_price: productData.price || 0,
      product_category: productData.category || "",
      time_on_page: this.timeOnPage,
      scroll_depth: this.scrollDepth,
      view_duration: Date.now(), // client sẽ ghi lại thời gian chi tiết
    };

    return this.sendTracking("/view-product", data);
  }

  /**
   * Track thêm vào giỏ hàng (chi tiết)
   */
  async trackAddToCart(productId, quantity = 1, productData = {}) {
    if (!productId) return;

    const data = {
      product_id: productId,
      quantity,
      product_name: productData.name || "",
      product_price: productData.price || 0,
      product_category: productData.category || "",
      cart_size_before: this.getCartSize(),
      time_on_page: this.timeOnPage,
    };

    return this.sendTracking("/add-to-cart", data);
  }

  /**
   * Track xóa khỏi giỏ hàng
   */
  async trackRemoveFromCart(productId, quantity = 1) {
    if (!productId) return;

    const data = {
      product_id: productId,
      quantity,
      cart_size_before: this.getCartSize(),
    };

    return this.sendTracking("/remove-from-cart", data);
  }

  /**
   * Track mua hàng (chi tiết)
   */
  async trackPurchase(orderData = {}) {
    if (!this.userId) return;

    const data = {
      order_id: orderData.id || "",
      order_total: orderData.total || 0,
      products: orderData.items || [],
      payment_method: orderData.payment_method || "",
      session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      time_to_purchase: this.timeOnPage,
      device_type: this.getDeviceType(),
    };

    return this.sendTracking("/purchase", data);
  }

  /**
   * Track click vào danh mục
   */
  async trackCategoryClick(categoryId, categoryData = {}) {
    if (!categoryId) return;

    return this.sendTracking("/category-click", {
      category_id: categoryId,
      category_name: categoryData.name || "",
    });
  }

  /**
   * Track tìm kiếm (chi tiết)
   */
  async trackSearch(query, resultsCount = 0, filters = {}) {
    if (!query) return;

    const data = {
      query,
      results_count: resultsCount,
      filters: JSON.stringify(filters),
      search_position_on_page: this.getSearchPosition(),
      time_to_search: this.timeOnPage,
    };

    return this.sendTracking("/search", data);
  }

  /**
   * Track click vào sản phẩm
   */
  async trackProductClick(productId, clickContext = {}) {
    if (!productId) return;

    return this.sendTracking("/product-click", {
      product_id: productId,
      click_context: clickContext.context || "product_list",
      position: clickContext.position || 0,
    });
  }

  /**
   * Track thêm vào wishlist
   */
  async trackWishlist(productId, productData = {}) {
    if (!productId || !this.userId) return;

    return this.sendTracking("/wishlist", {
      product_id: productId,
      product_name: productData.name || "",
    });
  }

  /**
   * Track đánh giá sản phẩm
   */
  async trackRating(productId, rating, review = "") {
    if (!productId || !this.userId) return;

    return this.sendTracking("/rating", {
      product_id: productId,
      rating,
      review,
    });
  }

  /**
   * Track tương tác chung (khác)
   */
  async trackInteraction(eventType, eventData = {}) {
    const data = {
      event_type: eventType,
      event_data: JSON.stringify(eventData),
      timestamp: Date.now(),
    };

    return this.sendTracking("/interaction", data);
  }

  /**
   * Lấy kích thước giỏ hàng hiện tại
   */
  getCartSize() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart.length;
    } catch {
      return 0;
    }
  }

  /**
   * Xác định loại thiết bị
   */
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return "mobile";
    if (/tablet/i.test(ua)) return "tablet";
    return "desktop";
  }

  /**
   * Lấy vị trí search trên trang
   */
  getSearchPosition() {
    const searchBox = document.querySelector("[data-tracking='search']");
    if (!searchBox) return 0;
    return searchBox.getBoundingClientRect().top;
  }

  /**
   * Lưu dữ liệu phiên làm việc
   */
  async saveSessionData() {
    if (!this.userId) return;

    const sessionData = {
      total_interactions: this.interactions.length,
      session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      time_on_page: this.timeOnPage,
      scroll_depth: this.scrollDepth,
      click_count: this.clickCount,
      page: this.currentPage,
      device_type: this.getDeviceType(),
      mouse_activity_count: this.mouseMovements.length,
    };

    return this.sendTracking("/session", sessionData);
  }

  /**
   * Xóa dữ liệu và gửi nó
   */
  async flushData() {
    if (this.interactions.length > 0) {
      await this.sendTracking("/batch", {
        interactions: this.interactions,
      });

      this.interactions = [];
    }
  }

  /**
   * Lấy tóm tắt hành vi người dùng
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

// Tạo global instance
const tracker = new AdvancedTrackingManager();
