/**
 * Advanced Intents Handler - Frontend Support
 * Methods to integrate 11 advanced intents into chatbot widget
 */

// Add these methods to ChatbotWidget class

class AdvancedIntentsSupport {
  /**
   * 1. Analyze User Needs
   */
  static async analyzeUserNeeds(chatbot, message = "") {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/analyze-needs/${chatbot.userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || "Phân tích nhu cầu của tôi",
            context: {
              sessionDuration: Date.now() - chatbot.sessionStart,
            },
          }),
        },
      );

      const data = await response.json();
      return data.analysis;
    } catch (err) {
      console.error("Error analyzing user needs:", err);
      return {
        text: "Xin lỗi, tôi không thể phân tích nhu cầu của bạn. Vui lòng thử lại.",
        recommendations: [],
      };
    }
  }

  /**
   * 2. Refine Search
   */
  static async refineSearch(chatbot, message, previousProducts = []) {
    try {
      const filters = this.extractFiltersFromMessage(message);

      const response = await fetch(
        `${chatbot.apiBaseUrl}/refine-search/${chatbot.userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            previousProducts,
            filters,
          }),
        },
      );

      const data = await response.json();
      return data.refined;
    } catch (err) {
      console.error("Error refining search:", err);
      return {
        text: "Có lỗi khi điều chỉnh tìm kiếm.",
        recommendations: [],
      };
    }
  }

  /**
   * 3. Change Priority
   */
  static async changePriority(chatbot, priorityChanges, recommendations = []) {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/change-priority/${chatbot.userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priorityChanges,
            currentRecommendations: recommendations,
          }),
        },
      );

      const data = await response.json();
      return data.result;
    } catch (err) {
      console.error("Error changing priority:", err);
      return { text: "Có lỗi khi thay đổi ưu tiên.", recommendations: [] };
    }
  }

  /**
   * 4. Explain Recommendation
   */
  static async explainRecommendation(
    chatbot,
    productId,
    source = "personalized",
  ) {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/explain-recommendation/${productId}/${chatbot.userId}?source=${source}`,
      );

      const data = await response.json();
      return data.explanation;
    } catch (err) {
      console.error("Error explaining recommendation:", err);
      return {
        text: "Tôi không thể giải thích lý do gợi ý sản phẩm này.",
      };
    }
  }

  /**
   * 5. Why Not This Product
   */
  static async explainRejection(chatbot, productId, message = "") {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/why-not-product/${productId}/${chatbot.userId}?message=${encodeURIComponent(message)}`,
      );

      const data = await response.json();
      return data.rejection;
    } catch (err) {
      console.error("Error explaining rejection:", err);
      return { text: "Có lỗi khi giải thích." };
    }
  }

  /**
   * 6. Trend Analysis
   */
  static async analyzeTrends(chatbot, categoryId = null, timeRange = "30days") {
    try {
      let url = `${chatbot.apiBaseUrl}/trends?timeRange=${timeRange}`;
      if (categoryId) url += `&categoryId=${categoryId}`;

      const response = await fetch(url);
      const data = await response.json();
      return data.trends;
    } catch (err) {
      console.error("Error analyzing trends:", err);
      return {
        text: "Có lỗi khi phân tích xu hướng.",
        trending_products: [],
      };
    }
  }

  /**
   * 7. Predict Future Needs
   */
  static async predictFutureNeeds(chatbot) {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/predict-needs/${chatbot.userId}`,
      );

      const data = await response.json();
      return data.predictions;
    } catch (err) {
      console.error("Error predicting future needs:", err);
      return {
        text: "Có lỗi khi dự đoán nhu cầu tương lai.",
        predicted_needs: [],
      };
    }
  }

  /**
   * 8. User Behavior Analysis
   */
  static async analyzeUserBehavior(chatbot) {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/behavior-analysis/${chatbot.userId}`,
      );

      const data = await response.json();
      return data.analysis;
    } catch (err) {
      console.error("Error analyzing user behavior:", err);
      return {
        text: "Có lỗi khi phân tích hành vi.",
        behavior_summary: {},
      };
    }
  }

  /**
   * 9. Cross-Selling
   */
  static async getCrossSelling(chatbot, currentProduct = null) {
    try {
      let url = `${chatbot.apiBaseUrl}/cross-selling/${chatbot.userId}`;
      if (currentProduct) url += `?currentProduct=${currentProduct}`;

      const response = await fetch(url);
      const data = await response.json();
      return data.recommendations;
    } catch (err) {
      console.error("Error getting cross-selling recommendations:", err);
      return {
        text: "Có lỗi.",
        recommendations: { co_purchased_products: [] },
      };
    }
  }

  /**
   * 10. Up-Selling
   */
  static async getUpselling(chatbot, productId, budget = null) {
    try {
      let url = `${chatbot.apiBaseUrl}/upsell/${chatbot.userId}/${productId}`;
      if (budget) url += `?budget=${budget}`;

      const response = await fetch(url);
      const data = await response.json();
      return data.recommendations;
    } catch (err) {
      console.error("Error getting upselling recommendations:", err);
      return {
        text: "Có lỗi.",
        recommendations: { premium_alternatives: [] },
      };
    }
  }

  /**
   * 11. Low Confidence Clarification
   */
  static async requestClarification(chatbot, message, context = {}) {
    try {
      const response = await fetch(
        `${chatbot.apiBaseUrl}/clarify/${chatbot.userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context,
          }),
        },
      );

      const data = await response.json();
      return data.clarification;
    } catch (err) {
      console.error("Error requesting clarification:", err);
      return {
        confidence_score: 0.5,
        can_proceed: false,
      };
    }
  }

  /**
   * Helper: Extract filters from message
   */
  static extractFiltersFromMessage(message) {
    const filters = {};

    // Extract price range
    const priceMatch = message.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (priceMatch) {
      filters.minPrice = parseInt(priceMatch[1]) * 1000000;
      filters.maxPrice = parseInt(priceMatch[2]) * 1000000;
    }

    // Extract brands
    const brandKeywords = [
      "apple",
      "samsung",
      "dell",
      "sony",
      "lg",
      "hp",
      "lenovo",
      "asus",
    ];
    filters.brands = brandKeywords.filter((b) =>
      message.toLowerCase().includes(b),
    );

    // Extract rating preference
    if (
      message.includes("rating cao") ||
      message.includes("đánh giá tốt") ||
      message.includes("tốt nhất")
    ) {
      filters.minRating = 4.0;
    }

    return filters;
  }

  /**
   * Helper: Format trend data for display
   */
  static formatTrendDisplay(trendData) {
    const display = [];

    if (trendData.trending_products && trendData.trending_products.length) {
      display.push(
        `<strong>🔥 Sản phẩm hot nhất:</strong><br/>` +
          trendData.trending_products
            .slice(0, 3)
            .map((p) => `• ${p.name} - ${p.price.toLocaleString("vi-VN")}₫`)
            .join("<br/>"),
      );
    }

    if (trendData.trending_categories && trendData.trending_categories.length) {
      display.push(
        `<strong>📊 Danh mục phổ biến:</strong><br/>` +
          trendData.trending_categories
            .slice(0, 3)
            .map((c) => `• ${c.name}`)
            .join("<br/>"),
      );
    }

    return display.join("<br/><br/>");
  }

  /**
   * Helper: Format behavior analysis for display
   */
  static formatBehaviorDisplay(behaviorData) {
    const summary = behaviorData.behavior_summary;
    const categories = behaviorData.favorite_categories || [];
    const brands = behaviorData.favorite_brands || [];

    return `
      <strong>📈 Phân tích hành vi:</strong><br/>
      • Tổng tương tác: ${summary.total_interactions}<br/>
      • Mức engagement: ${summary.engagement_level}<br/>
      • Score: ${Math.round(summary.engagement_score)}/100<br/>
      ${
        categories.length
          ? `<br/><strong>Danh mục yêu thích:</strong><br/>` +
            categories
              .slice(0, 3)
              .map((c) => `• ${c.name}`)
              .join("<br/>")
          : ""
      }
      ${
        brands.length
          ? `<br/><strong>Thương hiệu yêu thích:</strong><br/>` +
            brands
              .slice(0, 3)
              .map((b) => `• ${b.p_brand}`)
              .join("<br/>")
          : ""
      }
    `;
  }

  /**
   * Helper: Format clarification questions for display
   */
  static formatClarificationDisplay(clarificationData) {
    if (!clarificationData.clarification_questions) return "";

    return (
      `<strong>🤔 Hãy giúp tôi hiểu rõ hơn:</strong><br/>` +
      clarificationData.clarification_questions
        .map((q, i) => `${i + 1}. <em>${q.question}</em><br/>`)
        .join("")
    );
  }

  /**
   * Display advanced intent results in chatbot
   */
  static displayResult(chatbot, data, intent) {
    let htmlContent = `<div class="advanced-intent-result">`;
    htmlContent += `<div class="intent-label">📌 ${intent}</div>`;
    htmlContent += `<div class="result-content">${data.text || ""}</div>`;

    // Add recommendations if available
    if (data.recommendations && data.recommendations.length) {
      htmlContent += this.formatRecommendations(data.recommendations);
    }

    // Add analysis/details for specific intents
    switch (intent) {
      case "TREND_ANALYSIS":
        if (data.trending_products) {
          htmlContent += `<div class="trend-details">${this.formatTrendDisplay(data)}</div>`;
        }
        break;

      case "USER_BEHAVIOR_ANALYSIS":
        htmlContent += `<div class="behavior-details">${this.formatBehaviorDisplay(data)}</div>`;
        break;

      case "LOW_CONFIDENCE_CLARIFICATION":
        htmlContent += `<div class="clarification-questions">${this.formatClarificationDisplay(data)}</div>`;
        break;

      case "EXPLAIN_RECOMMENDATION":
        if (data.recommendation_reasons) {
          htmlContent += `<div class="reasons">`;
          data.recommendation_reasons.forEach((r) => {
            htmlContent += `<div class="reason-item"><strong>${r.reason}:</strong> ${r.description}</div>`;
          });
          htmlContent += `</div>`;
        }
        break;

      case "WHY_NOT_THIS_PRODUCT":
        if (data.rejection_reasons) {
          htmlContent += `<div class="rejection-reasons">`;
          data.rejection_reasons.forEach((r) => {
            htmlContent += `<div class="reason-item severity-${r.severity}"><strong>${r.reason}:</strong> ${r.description}</div>`;
          });
          htmlContent += `</div>`;
        }
        break;
    }

    htmlContent += `</div>`;
    return htmlContent;
  }

  /**
   * Format product recommendations for display
   */
  static formatRecommendations(products) {
    if (!products || !products.length) return "";

    return (
      `<div class="recommendations-container">` +
      products
        .slice(0, 5)
        .map((p) => {
          const image =
            p.image_url || p.image || "https://via.placeholder.com/120";
          const productId = p.id;

          return `
            <div class="recommendation-item">
              <img src="${image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/120'">
              <div class="product-info">
                <p class="product-name">${p.name}</p>
                <p class="product-price">${p.price.toLocaleString("vi-VN")}₫</p>
                ${p.rating ? `<p class="product-rating">⭐ ${p.rating}/5</p>` : ""}
              </div>
              <button class="view-details-btn" data-product-id="${productId}">Xem chi tiết</button>
            </div>
          `;
        })
        .join("") +
      `</div>`
    );
  }
}

// Export for use in ChatbotWidget
if (typeof module !== "undefined" && module.exports) {
  module.exports = AdvancedIntentsSupport;
}
