// AI chat module riêng
(function () {
  const chatSessionKey = "aiChatSession";
  const behaviorSessionKey = "aiBehaviorHistory";
  const productReviewData = {
    "Smartphone Pro Max": { score: 4.8, count: 124 },
    "Loa Bluetooth": { score: 4.6, count: 87 },
    "Nồi chiên không dầu 5L": { score: 4.5, count: 152 },
    "Robot hút bụi": { score: 4.7, count: 93 },
    "Đèn bàn LED": { score: 4.3, count: 68 },
    "Máy pha cà phê": { score: 4.4, count: 74 },
    "Tai nghe Bluetooth AirPods": { score: 4.9, count: 156 },
    "Laptop Gaming X1": { score: 4.7, count: 98 },
    "Monitor 4K 32 inch": { score: 4.6, count: 82 },
    "Ổ cứng SSD 1TB": { score: 4.5, count: 143 },
    "Bàn nấu điện từ": { score: 4.6, count: 71 },
    "Máy hút bụi cầm tay cordless": { score: 4.4, count: 95 },
    "Camera an ninh WiFi": { score: 4.8, count: 121 },
    "Bóng đèn LED thông minh Tuya": { score: 4.7, count: 108 },
  };

  let aiMessages;
  let aiInput;
  let aiWindow;

  function parseSessionData(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  let conversationContext = parseSessionData(chatSessionKey);
  let behaviorHistory = parseSessionData(behaviorSessionKey);
  let lastUserBehavior = behaviorHistory[behaviorHistory.length - 1] || null;

  function saveConversationContext() {
    sessionStorage.setItem(chatSessionKey, JSON.stringify(conversationContext));
  }

  function saveBehaviorHistory() {
    sessionStorage.setItem(behaviorSessionKey, JSON.stringify(behaviorHistory));
  }

  function addConversationEntry(text, sender) {
    conversationContext.push({ text, sender, time: Date.now() });
    if (conversationContext.length > 25) {
      conversationContext.shift();
    }
    saveConversationContext();
  }

  function getContextInfo() {
    const info = {
      lastCategory:
        lastUserBehavior?.type === "category" ? lastUserBehavior.value : null,
      lastSearch:
        lastUserBehavior?.type === "search" ? lastUserBehavior.value : null,
      recentQueries: conversationContext
        .filter((entry) => entry.sender === "user")
        .slice(-2)
        .map((entry) => entry.text.toLowerCase()),
    };
    return info;
  }

  function addAIMessage(text, sender) {
    if (!aiMessages) {
      return;
    }
    const message = document.createElement("div");
    message.className = `message ${sender}`;
    message.textContent = text;
    aiMessages.appendChild(message);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  function chooseRandom(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  function formatProductInfo(item) {
    return `${item.title} (${item.category}) - ${item.price}, đánh giá ${item.reviewScore}/5 (${item.reviewCount} đánh giá)`;
  }

  function getProductReason(item) {
    if (item.category === "Điện tử") {
      return "mang lại hiệu năng tốt và trải nghiệm giải trí hiện đại.";
    }
    if (item.category === "Gia dụng") {
      return "giúp bạn nấu nướng nhanh gọn, tiết kiệm thời gian.";
    }
    if (item.category === "Nhà thông minh") {
      return "giúp ngôi nhà bạn tiện nghi hơn và dễ điều khiển.";
    }
    return "được khách hàng đánh giá tốt và phù hợp nhu cầu của bạn.";
  }

  function createProductsData() {
    const productCards = document.querySelectorAll(".product-card");
    return Array.from(productCards).map((card) => {
      const title = card.querySelector("h3")?.textContent.trim() || "";
      const review = productReviewData[title] || { score: 4.0, count: 0 };
      const priceText =
        card.querySelector(".current-price")?.textContent.trim() || "";
      // Convert VND price back to number for calculations
      const priceNumber = parseInt(priceText.replace(/[^\d]/g, "")) || 0;
      return {
        title,
        category:
          card.dataset.category ||
          card.querySelector(".cat-label")?.textContent.trim() ||
          "",
        description: card.querySelector(".weight")?.textContent.trim() || "",
        price: priceText,
        priceNumber,
        reviewScore: review.score,
        reviewCount: review.count,
      };
    });
  }

  function getAiResponse(query) {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      return "Hãy cho tôi biết bạn đang tìm gì, ví dụ: điện thoại, loa, laptop, máy pha cà phê, hoặc nhà thông minh.";
    }

    const contextInfo = getContextInfo();
    const productData = createProductsData();

    const matches = productData.filter((item) => {
      return (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
      );
    });

    const wantsBuy =
      /mua|muốn mua|cần mua|tư vấn|gợi ý|nên mua|nên chọn|tốt nhất/.test(
        lowerQuery,
      );
    const wantsReview = /đánh giá|review|khách hàng|feedback|nhận xét/.test(
      lowerQuery,
    );
    const wantsDeal = /rẻ|giá tốt|ưu đãi|sale|giảm giá|khuyến mãi/.test(
      lowerQuery,
    );
    const wantsSmart =
      /nhà thông minh|smart home|đèn|robot|hút bụi|camera|an ninh/.test(
        lowerQuery,
      );
    const wantsKitchen =
      /gia dụng|bếp|máy pha|nồi|lò|coffee|air fryer|nấu|bàn/.test(lowerQuery);
    const wantsElectronics =
      /điện thoại|smartphone|loa|speaker|tai nghe|âm thanh|laptop|monitor|ổ cứng/.test(
        lowerQuery,
      );

    if (wantsReview) {
      const topRated = [...productData]
        .sort((a, b) => b.reviewScore - a.reviewScore)
        .slice(0, 3);
      const formatted = topRated.map(
        (item) =>
          `★ ${item.title}\n   Đánh giá: ${item.reviewScore}/5 (${item.reviewCount} lượt)\n   Giá: ${item.price} - ${getProductReason(item)}`,
      );
      return `Những sản phẩm được khách hàng yêu thích nhất:\n\n${formatted.join("\n\n")}`;
    }

    if (matches.length > 0) {
      const exactMatch = matches.find(
        (item) => item.title.toLowerCase() === lowerQuery,
      );
      if (exactMatch) {
        return `✓ ${exactMatch.title}\n\n💰 Giá: ${exactMatch.price}\n★ Đánh giá: ${exactMatch.reviewScore}/5 (${exactMatch.reviewCount} người)\n\n${getProductReason(exactMatch)}`;
      }

      const suggested = matches
        .sort((a, b) => b.reviewScore - a.reviewScore)
        .slice(0, 3);
      const formatted = suggested.map(
        (item) =>
          `✓ ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5 (${item.reviewCount})`,
      );
      const responsePhrases = [
        `Tôi tìm thấy những sản phẩm tuyệt vời cho bạn:`,
        `Đây là những lựa chọn hàng đầu:`,
        `Những sản phẩm phù hợp nhất:`,
      ];
      return `${chooseRandom(responsePhrases)}\n\n${formatted.join("\n\n")}`;
    }

    if (wantsBuy) {
      const topChoice = [...productData]
        .sort((a, b) => b.reviewScore - a.reviewScore)
        .slice(0, 3);
      const formatted = topChoice.map(
        (item) =>
          `🔥 ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5\n   ${getProductReason(item)}`,
      );
      return `Những sản phẩm tốt nhất cho bạn:\n\n${formatted.join("\n\n")}`;
    }

    if (wantsDeal) {
      const cheap = [...productData]
        .sort(
          (a, b) =>
            parseInt(a.price.replace(/\D/g, "")) -
            parseInt(b.price.replace(/\D/g, "")),
        )
        .slice(0, 3);
      const formatted = cheap.map(
        (item) =>
          `💎 ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5`,
      );
      return `Những sản phẩm giá tốt nhất:\n\n${formatted.join("\n\n")}\n\nVừa rẻ, vừa chất lượng cao! 🎉`;
    }

    if (wantsSmart) {
      const smart = productData
        .filter((item) => item.category === "Nhà thông minh")
        .slice(0, 3);
      if (smart.length > 0) {
        const formatted = smart.map(
          (item) =>
            `🏠 ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5`,
        );
        return `Nhà thông minh cho cuộc sống hiện đại:\n\n${formatted.join("\n\n")}`;
      }
    }

    if (wantsKitchen) {
      const kitchen = productData
        .filter((item) => item.category === "Gia dụng")
        .slice(0, 3);
      if (kitchen.length > 0) {
        const formatted = kitchen.map(
          (item) =>
            `👨‍🍳 ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5`,
        );
        return `Gia dụng nấu nướng tuyệt vời:\n\n${formatted.join("\n\n")}`;
      }
    }

    if (wantsElectronics) {
      const electronics = productData
        .filter((item) => item.category === "Điện tử")
        .slice(0, 3);
      if (electronics.length > 0) {
        const formatted = electronics.map(
          (item) =>
            `💻 ${item.title}\n   💰 ${item.price} | ★ ${item.reviewScore}/5`,
        );
        return `Công nghệ tân tiến cho bạn:\n\n${formatted.join("\n\n")}`;
      }
    }

    const genericResponses = [
      `Hmm, "${query}" chưa có trong kho hàng của chúng tôi. 😅\n\nBạn có thể tìm: 📱 Điện thoại, 🎧 Tai nghe, 💻 Laptop, 🏠 Nhà thông minh, 👨‍🍳 Gia dụng, v.v.`,
      `Bạn tìm gì nào? 🤔 Tôi có thể giới thiệu sản phẩm về:\n📱 Điện tử\n👨‍🍳 Gia dụng\n🏠 Nhà thông minh`,
      `Chỉ cần cho tôi biết loại sản phẩm bạn muốn, tôi sẽ giúp bạn tìm được thứ phù hợp nhất! ✨`,
    ];
    return chooseRandom(genericResponses);
  }

  function initChat() {
    injectChatWidget();

    const aiToggle = document.querySelector(".ai-chat-toggle");
    const aiClose = document.querySelector(".ai-chat-close");
    aiMessages = document.querySelector(".ai-chat-messages");
    aiInput = document.querySelector(".ai-chat-form input");
    aiWindow = document.querySelector(".ai-chat-window");

    if (!aiToggle || !aiClose || !aiMessages || !aiInput || !aiWindow) {
      return;
    }

    aiToggle.addEventListener("click", function () {
      toggleAIWindow();
      setUserBehavior("open-chat", "mở chat");
    });

    aiClose.addEventListener("click", function () {
      aiWindow.classList.add("hidden");
    });

    document
      .querySelector(".ai-chat-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const question = aiInput.value.trim();
        if (!question) {
          return;
        }
        addAIMessage(question, "user");
        addConversationEntry(question, "user");
        aiInput.value = "";

        setTimeout(function () {
          const answer = getAiResponse(question);
          addAIMessage(answer, "bot");
          addConversationEntry(answer, "bot");
        }, 300);
      });

    restoreConversation();
  }

  function restoreConversation() {
    if (!aiMessages) {
      return;
    }
    conversationContext.forEach((entry) => {
      addAIMessage(entry.text, entry.sender);
    });
  }

  function injectChatWidget() {
    if (document.querySelector(".ai-chat-widget")) {
      return;
    }

    const widget = document.createElement("div");
    widget.className = "ai-chat-widget";
    widget.innerHTML = `
      <button type="button" class="ai-chat-toggle">Chat hỗ trợ</button>
      <div class="ai-chat-window hidden">
        <div class="ai-chat-header">
          <span>Trợ lý mua sắm</span>
          <button type="button" class="ai-chat-close">&times;</button>
        </div>
        <div class="ai-chat-messages"></div>
        <form class="ai-chat-form">
          <input type="text" placeholder="Bạn cần tìm gì..." />
          <button type="submit"><i class="fas fa-paper-plane"></i></button>
        </form>
      </div>
    `;

    document.body.appendChild(widget);
  }

  function toggleAIWindow() {
    if (!aiWindow) {
      return;
    }
    aiWindow.classList.toggle("hidden");
    if (!aiWindow.classList.contains("hidden")) {
      aiInput.focus();
    }
  }

  window.AIChat = {
    init: initChat,
    setUserBehavior(type, value) {
      lastUserBehavior = { type, value, time: Date.now() };
      behaviorHistory.push(lastUserBehavior);
      if (behaviorHistory.length > 20) {
        behaviorHistory.shift();
      }
      saveBehaviorHistory();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChat);
  } else {
    initChat();
  }
})();
