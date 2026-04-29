const router = require("express").Router();
const { UserCart, Products } = require("../models");
const TrackingService = require("../services/tracking-service");

// CHECKOUT - Process purchase and update product counts
router.post("/", async (req, res, next) => {
  try {
    const { user_id, cart_items } = req.body;

    if (!cart_items || cart_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Giỏ hàng trống",
      });
    }

    // Process each item in cart
    const results = [];

    for (const item of cart_items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity) continue;

      try {
        // Get current product
        const product = await Products.findById(product_id);

        if (!product) {
          results.push({
            product_id,
            success: false,
            message: "Sản phẩm không tìm thấy",
          });
          continue;
        }

        // Calculate new purchase count
        const newPurchaseCount = (product.purchase_count || 0) + quantity;

        // Update product purchase count and decrease stock
        const newStock = Math.max(0, (product.stock || 0) - quantity);

        await Products.update(product_id, {
          ...product,
          purchase_count: newPurchaseCount,
          stock: newStock,
        });

        // Track purchase for each quantity
        for (let i = 0; i < quantity; i++) {
          if (user_id) {
            await TrackingService.trackPurchase(user_id, product_id);
          }
        }

        results.push({
          product_id,
          success: true,
          old_count: product.purchase_count,
          new_count: newPurchaseCount,
          quantity_sold: quantity,
          new_stock: newStock,
        });
      } catch (err) {
        results.push({
          product_id,
          success: false,
          error: err.message,
        });
      }
    }

    // Clear user cart if user is logged in
    if (user_id) {
      try {
        await UserCart.clearUserCart(user_id);
      } catch (err) {
        console.error("Error clearing user cart:", err.message);
      }
    }

    res.json({
      success: true,
      message: "Thanh toán thành công",
      total_items: cart_items.length,
      processed_items: results.filter((r) => r.success).length,
      results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET CHECKOUT STATUS
router.get("/status", async (req, res, next) => {
  try {
    res.json({ status: "checkout service available" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
