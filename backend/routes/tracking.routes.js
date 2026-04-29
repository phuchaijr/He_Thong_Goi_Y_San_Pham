const router = require("express").Router();
const TrackingService = require("../services/tracking-service");

// TRACK VIEW PRODUCT
router.post("/view-product", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const result = await TrackingService.trackViewProduct(user_id, product_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK ADD TO CART
router.post("/add-to-cart", async (req, res, next) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const result = await TrackingService.trackAddToCart(
      user_id,
      product_id,
      quantity || 1,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK PURCHASE
router.post("/purchase", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ error: "user_id and product_id are required" });
    }

    const result = await TrackingService.trackPurchase(user_id, product_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK CATEGORY CLICK
router.post("/category-click", async (req, res, next) => {
  try {
    const { user_id, category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({ error: "category_id is required" });
    }

    const result = await TrackingService.trackCategoryClick(
      user_id,
      category_id,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK SEARCH
router.post("/search", async (req, res, next) => {
  try {
    const { user_id, query, results_count } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const result = await TrackingService.trackSearch(
      user_id,
      query,
      results_count || 0,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK PRODUCT CLICK
router.post("/product-click", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const result = await TrackingService.trackProductClick(user_id, product_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK REMOVE FROM CART
router.post("/remove-from-cart", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    const result = await TrackingService.trackRemoveFromCart(
      user_id,
      product_id,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK WISHLIST
router.post("/wishlist", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ error: "user_id and product_id are required" });
    }

    const result = await TrackingService.trackWishlist(user_id, product_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// TRACK RATING
router.post("/rating", async (req, res, next) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ error: "user_id and product_id are required" });
    }

    const result = await TrackingService.trackRating(user_id, product_id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET USER ACTIVITY SUMMARY
router.get("/activity/:userId(\\d+)", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const summary = await TrackingService.getUserActivitySummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tracking/chat-interaction
 * Theo dõi tương tác với chatbot
 */
router.post("/chat-interaction", async (req, res, next) => {
  try {
    const { message, intent, user_id, conversationId } = req.body;

    // Log chat interaction (có thể thêm vào database nếu cần)
    if (user_id) {
      await TrackingService.trackChatInteraction(
        user_id,
        message,
        intent,
        conversationId,
      );
    }

    res.json({ success: true, message: "Chat interaction tracked" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
