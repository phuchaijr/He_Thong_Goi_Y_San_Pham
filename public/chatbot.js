/**
 * Chatbot Widget - E-commerce Chatbot Integration
 * Tích hợp chatbot vào website với đầy đủ tính năng
 */

class ChatbotWidget {
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || "/api/chatbot";
    this.trackingUrl = config.trackingUrl || "/api/tracking";
    this.userId = null;
    this.conversationId = this.generateId();
    this.messages = [];
    this.unreadCount = 0;
    this.isOpen = false;
    this.isLoading = false;
    this.config = {
      title: config.title || "Trợ lý mua sắm",
      subtitle: config.subtitle || "Gợi ý sản phẩm thông minh",
      placeholder: config.placeholder || "Nhập câu hỏi của bạn...",
      autoOpen: config.autoOpen !== false,
      autoOpenDelay: config.autoOpenDelay || 2000,
      ...config,
    };

    this.init();
  }

  /**
   * Initialize chatbot widget
   */
  init() {
    this.getUserId();
    this.createWidgetHTML();
    this.attachEventListeners();

    // Restore chat history from sessionStorage first (persistent across pages)
    const hasRestoredHistory = this.restoreChatHistory();

    // Then load from server if no previous session
    if (!hasRestoredHistory) {
      this.loadChatHistory();
    }

    // Auto open after delay
    if (this.config.autoOpen) {
      setTimeout(() => this.openChat(), this.config.autoOpenDelay);
    }

    console.log("✅ Chatbot widget initialized");
  }

  /**
   * Get user ID from localStorage
   */
  getUserId() {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const data = JSON.parse(authData);
        this.userId = data.user?.id;
      }
    } catch (err) {
      console.error("Error getting user ID:", err);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create chatbot widget HTML
   */
  createWidgetHTML() {
    // Toggle Button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "chatbot-toggle-btn";
    toggleBtn.innerHTML = '<i class="fas fa-comments"></i>';
    toggleBtn.id = "chatbot-toggle-btn";
    toggleBtn.setAttribute("title", "Mở trợ lý mua sắm");

    // Notification Badge
    const badge = document.createElement("div");
    badge.className = "chatbot-notification-badge hidden";
    badge.id = "chatbot-notification-badge";
    badge.textContent = "0";
    toggleBtn.appendChild(badge);

    // Widget Container
    const widget = document.createElement("div");
    widget.className = "chatbot-widget";
    widget.id = "chatbot-widget";

    widget.innerHTML = `
      <!-- Header -->
      <div class="chatbot-header">
        <div class="chatbot-header-title">
          <div class="chatbot-header-icon">
            <i class="fas fa-robot"></i>
          </div>
          <div>
            <div>${this.config.title}</div>
            <div style="font-size: 12px; opacity: 0.8;">${this.config.subtitle}</div>
          </div>
        </div>
        <div class="chatbot-header-actions">
          <button class="chatbot-header-btn" id="chatbot-refresh-btn" title="Làm mới">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button class="chatbot-header-btn" id="chatbot-close-btn" title="Đóng">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="chatbot-body" id="chatbot-messages">
        <div class="chatbot-empty-state">
          <div class="chatbot-empty-icon">
            <i class="fas fa-smile"></i>
          </div>
          <div class="chatbot-empty-title">Xin chào!</div>
          <div class="chatbot-empty-text">
            Tôi là trợ lý mua sắm. Hỏi tôi về sản phẩm, gợi ý, hoặc cần giúp gì!
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="chatbot-footer">
        <div class="chatbot-input-group">
          <input
            type="text"
            class="chatbot-input"
            id="chatbot-input"
            placeholder="${this.config.placeholder}"
            autocomplete="off"
          />
          <button class="chatbot-send-btn" id="chatbot-send-btn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(toggleBtn);
    document.body.appendChild(widget);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const toggleBtn = document.getElementById("chatbot-toggle-btn");
    const closeBtn = document.getElementById("chatbot-close-btn");
    const refreshBtn = document.getElementById("chatbot-refresh-btn");
    const sendBtn = document.getElementById("chatbot-send-btn");
    const input = document.getElementById("chatbot-input");

    toggleBtn.addEventListener("click", () => this.toggleChat());
    closeBtn.addEventListener("click", () => this.closeChat());
    refreshBtn.addEventListener("click", () => this.refreshChat());
    sendBtn.addEventListener("click", () => this.sendMessage());

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Detect user login/logout
    document.addEventListener("userLoggedIn", (e) => {
      this.userId = e.detail?.userId;
      console.log("User logged in:", this.userId);
    });

    document.addEventListener("userLoggedOut", () => {
      this.userId = null;
      console.log("User logged out");
    });
  }

  /**
   * Toggle chat visibility
   */
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  /**
   * Open chat
   */
  openChat() {
    const widget = document.getElementById("chatbot-widget");
    const toggleBtn = document.getElementById("chatbot-toggle-btn");

    widget.classList.add("active");
    toggleBtn.style.display = "none";
    this.isOpen = true;

    // Clear unread count
    this.unreadCount = 0;
    this.updateNotificationBadge();

    // Focus input
    setTimeout(() => {
      document.getElementById("chatbot-input").focus();
    }, 300);
  }

  /**
   * Close chat
   */
  closeChat() {
    const widget = document.getElementById("chatbot-widget");
    const toggleBtn = document.getElementById("chatbot-toggle-btn");

    widget.classList.remove("active");
    toggleBtn.style.display = "flex";
    this.isOpen = false;
  }

  /**
   * Refresh chat
   */
  refreshChat() {
    const messagesContainer = document.getElementById("chatbot-messages");
    messagesContainer.innerHTML = `
      <div class="chatbot-empty-state">
        <div class="chatbot-empty-icon">
          <i class="fas fa-smile"></i>
        </div>
        <div class="chatbot-empty-title">Xin chào!</div>
        <div class="chatbot-empty-text">
          Tôi là trợ lý mua sắm. Hỏi tôi về sản phẩm, gợi ý, hoặc cần giúp gì!
        </div>
      </div>
    `;
    this.messages = [];
    this.conversationId = this.generateId();

    // Clear sessionStorage when user explicitly refreshes
    try {
      sessionStorage.removeItem("chatbot_messages");
      sessionStorage.removeItem("chatbot_conversationId");
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }

  /**
   * Send message to chatbot
   */
  async sendMessage() {
    const input = document.getElementById("chatbot-input");
    const message = input.value.trim();

    if (!message) return;

    // Display user message
    this.addMessage(message, "user");
    input.value = "";
    input.focus();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to API
      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: this.userId,
          message: message,
          context: {
            conversationId: this.conversationId,
            previousMessages: this.messages.slice(-5),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Remove typing indicator
      this.removeTypingIndicator();

      // Display bot response
      if (data.response) {
        this.addMessage(data.response.text, "bot", {
          intent: data.intent,
          recommendations: data.response.recommendations,
        });
      }

      // Track interaction
      await this.trackChatInteraction(message, data.intent);
    } catch (error) {
      console.error("Error sending message:", error);
      this.removeTypingIndicator();
      this.addMessage("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.", "bot");
    }
  }

  /**
   * Add message to conversation
   */
  addMessage(text, sender, data = {}) {
    const messagesContainer = document.getElementById("chatbot-messages");

    // Remove empty state on first message
    const emptyState = messagesContainer.querySelector(".chatbot-empty-state");
    if (emptyState) {
      emptyState.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message message-${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const timestamp = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    bubble.innerHTML = `
      <div>${this.escapeHtml(text)}</div>
    `;

    messageDiv.appendChild(bubble);

    // Add message time
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = timestamp;
    messageDiv.appendChild(timeDiv);

    // Add recommendations if available
    if (
      sender === "bot" &&
      data.recommendations &&
      data.recommendations.length > 0
    ) {
      // Check if recommendations are product objects or action buttons
      const isProductRecommendation = data.recommendations.some(
        (rec) => rec.id && rec.name && rec.price !== undefined,
      );

      if (isProductRecommendation) {
        // Render as product cards - limit to max 4 products
        const recommendationsDiv = document.createElement("div");
        recommendationsDiv.className = "message-product-recommendations";

        const limitedRecommendations = data.recommendations.slice(0, 4);
        limitedRecommendations.forEach((product) => {
          const productCard = document.createElement("div");
          productCard.className = "product-card-mini";
          const imageUrl =
            product.image || product.image_url || "/img/placeholder.jpg";
          productCard.innerHTML = `
            <img src="${imageUrl}" alt="${this.escapeHtml(product.name)}" class="product-card-mini-img" onerror="this.src='/img/placeholder.jpg'" />
            <div class="product-card-mini-info">
              <div class="product-card-mini-name">${this.escapeHtml(product.name)}</div>
              <div class="product-card-mini-price">
                ${this.formatPrice(product.price)}
              </div>
              <button class="product-card-mini-btn" data-product-id="${product.id}">
                Xem chi tiết
              </button>
            </div>
          `;

          productCard
            .querySelector(".product-card-mini-btn")
            .addEventListener("click", () => {
              window.location.href = `/products.html?id=${product.id}`;
            });

          recommendationsDiv.appendChild(productCard);
        });

        messageDiv.appendChild(recommendationsDiv);
      } else {
        // Render as action buttons
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "message-actions";

        data.recommendations.forEach((rec) => {
          const btn = document.createElement("button");
          btn.className = "action-btn";
          btn.textContent = rec.label || rec.text || "Hành động";
          btn.addEventListener("click", () => {
            if (rec.action === "search") {
              this.sendMessage(`Tìm ${rec.query}`);
            } else if (rec.action === "view") {
              window.location.href = rec.link;
            } else if (rec.action === "click") {
              this.sendMessage(rec.text || rec.label);
            }
          });
          actionsDiv.appendChild(btn);
        });

        messageDiv.appendChild(actionsDiv);
      }
    }

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store message
    this.messages.push({
      text: text,
      sender: sender,
      timestamp: new Date().toISOString(),
      data: data,
    });

    // Save to sessionStorage for persistence across pages
    this.saveChatHistory();

    // Increment unread if bot message
    if (sender === "bot" && !this.isOpen) {
      this.unreadCount++;
      this.updateNotificationBadge();
    }
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");

    const messageDiv = document.createElement("div");
    messageDiv.className = "chatbot-message message-bot";
    messageDiv.id = "typing-indicator";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    bubble.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Update notification badge
   */
  updateNotificationBadge() {
    const badge = document.getElementById("chatbot-notification-badge");

    if (this.unreadCount > 0 && !this.isOpen) {
      badge.classList.remove("hidden");
      badge.textContent = this.unreadCount > 99 ? "99+" : this.unreadCount;
    } else {
      badge.classList.add("hidden");
    }
  }

  /**
   * Load chat history from server
   */
  async loadChatHistory() {
    if (!this.userId) return;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/chat-history/${this.userId}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          // Load last 10 messages for context
          const historyMessages = data.history.slice(-10);
          historyMessages.forEach((msg) => {
            this.messages.push(msg);
          });

          // Display the loaded messages
          this.displayMessages();

          // Save to sessionStorage for persistence
          this.saveChatHistory();
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }

  /**
   * Save chat history to sessionStorage
   */
  saveChatHistory() {
    try {
      sessionStorage.setItem("chatbot_messages", JSON.stringify(this.messages));
      sessionStorage.setItem("chatbot_conversationId", this.conversationId);
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }

  /**
   * Restore chat history from sessionStorage
   */
  restoreChatHistory() {
    try {
      const savedMessages = sessionStorage.getItem("chatbot_messages");
      const savedConversationId = sessionStorage.getItem(
        "chatbot_conversationId",
      );

      if (savedMessages) {
        this.messages = JSON.parse(savedMessages);
        this.conversationId = savedConversationId || this.generateId();

        // Display restored messages
        this.displayMessages();

        console.log("✅ Chat history restored from sessionStorage");
        return true;
      }
    } catch (error) {
      console.error("Error restoring chat history:", error);
    }
    return false;
  }

  /**
   * Display all messages in the UI
   */
  displayMessages() {
    const messagesContainer = document.getElementById("chatbot-messages");

    // Clear current content
    messagesContainer.innerHTML = "";

    if (this.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="chatbot-empty-state">
          <div class="chatbot-empty-icon">
            <i class="fas fa-smile"></i>
          </div>
          <div class="chatbot-empty-title">Xin chào!</div>
          <div class="chatbot-empty-text">
            Tôi là trợ lý mua sắm. Hỏi tôi về sản phẩm, gợi ý, hoặc cần giúp gì!
          </div>
        </div>
      `;
      return;
    }

    // Display each message
    this.messages.forEach((msg) => {
      this.displayMessage(msg);
    });

    // Scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Display a single message in the UI
   */
  displayMessage(msg) {
    const messagesContainer = document.getElementById("chatbot-messages");

    // Remove empty state if still visible
    const emptyState = messagesContainer.querySelector(".chatbot-empty-state");
    if (emptyState) {
      emptyState.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message message-${msg.sender}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = `
      <div>${this.escapeHtml(msg.text)}</div>
    `;

    messageDiv.appendChild(bubble);

    // Add message time
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    const msgTime = new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeDiv.textContent = msgTime;
    messageDiv.appendChild(timeDiv);

    // Add recommendations if available
    if (
      msg.sender === "bot" &&
      msg.data?.recommendations &&
      msg.data.recommendations.length > 0
    ) {
      const isProductRecommendation = msg.data.recommendations.some(
        (rec) => rec.id && rec.name && rec.price !== undefined,
      );

      if (isProductRecommendation) {
        const recommendationsDiv = document.createElement("div");
        recommendationsDiv.className = "message-product-recommendations";

        const limitedRecommendations = msg.data.recommendations.slice(0, 4);
        limitedRecommendations.forEach((product) => {
          const productCard = document.createElement("div");
          productCard.className = "product-card-mini";
          const imageUrl =
            product.image || product.image_url || "/img/placeholder.jpg";
          productCard.innerHTML = `
            <img src="${imageUrl}" alt="${this.escapeHtml(product.name)}" class="product-card-mini-img" onerror="this.src='/img/placeholder.jpg'" />
            <div class="product-card-mini-info">
              <div class="product-card-mini-name">${this.escapeHtml(product.name)}</div>
              <div class="product-card-mini-price">
                ${this.formatPrice(product.price)}
              </div>
              <button class="product-card-mini-btn" data-product-id="${product.id}">
                Xem chi tiết
              </button>
            </div>
          `;

          productCard
            .querySelector(".product-card-mini-btn")
            .addEventListener("click", () => {
              window.location.href = `/products.html?id=${product.id}`;
            });

          recommendationsDiv.appendChild(productCard);
        });

        messageDiv.appendChild(recommendationsDiv);
      } else {
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "message-actions";

        msg.data.recommendations.forEach((rec) => {
          const btn = document.createElement("button");
          btn.className = "action-btn";
          btn.textContent = rec.label || rec.text || "Hành động";
          btn.addEventListener("click", () => {
            if (rec.action === "search") {
              this.sendMessage(`Tìm ${rec.query}`);
            } else if (rec.action === "view") {
              window.location.href = rec.link;
            } else if (rec.action === "click") {
              this.sendMessage(rec.text || rec.label);
            }
          });
          actionsDiv.appendChild(btn);
        });

        messageDiv.appendChild(actionsDiv);
      }
    }

    messagesContainer.appendChild(messageDiv);
  }

  /**
   * Track chat interaction
   */
  async trackChatInteraction(message, intent) {
    try {
      if (typeof tracker !== "undefined") {
        await tracker.sendTracking("/chat-interaction", {
          message: message,
          intent: intent,
          userId: this.userId,
          conversationId: this.conversationId,
        });
      }
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add product recommendation to chat
   */
  addProductRecommendation(product) {
    const messagesContainer = document.getElementById("chatbot-messages");

    const messageDiv = document.createElement("div");
    messageDiv.className = "chatbot-message message-bot";

    const productCard = document.createElement("div");
    productCard.className = "product-card-mini";
    productCard.innerHTML = `
      <img src="${product.image || "/img/placeholder.jpg"}" alt="${product.name}" />
      <div class="product-card-mini-info">
        <div class="product-card-mini-name">${this.escapeHtml(product.name)}</div>
        <div class="product-card-mini-price">
          ${this.formatPrice(product.price)}
        </div>
        <button class="product-card-mini-btn" data-product-id="${product.id}">
          Xem chi tiết
        </button>
      </div>
    `;

    productCard.querySelector("button").addEventListener("click", () => {
      window.location.href = `/product.html?id=${product.id}`;
    });

    messageDiv.appendChild(productCard);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Format price
   */
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Send predefined message (for quick actions)
   */
  sendQuickMessage(text) {
    const input = document.getElementById("chatbot-input");
    input.value = text;
    this.sendMessage();
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.messages;
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    this.messages = [];
    this.conversationId = this.generateId();
    this.refreshChat();
  }

  /**
   * Set custom welcome message
   */
  setWelcomeMessage(title, subtitle) {
    this.config.title = title;
    this.config.subtitle = subtitle;
    // Update header
    const headerTitle = document.querySelector(".chatbot-header-title div div");
    if (headerTitle) {
      headerTitle.textContent = title;
    }
  }
}

// Initialize chatbot on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if chatbot is already initialized
  if (!window.chatbotWidget) {
    window.chatbotWidget = new ChatbotWidget({
      title: "Trợ lý mua sắm",
      subtitle: "Gợi ý sản phẩm thông minh",
      placeholder: "Nhập câu hỏi của bạn...",
      autoOpen: false, // Không tự động mở
      autoOpenDelay: 2000,
    });
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChatbotWidget;
}
