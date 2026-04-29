const router = require("express").Router();
const { UserCart } = require("../models");

// GET ALL CART ITEMS
router.get("/", async (req, res, next) => {
  try {
    const cartItems = await UserCart.findAll();
    res.json(cartItems);
  } catch (err) {
    next(err);
  }
});

// GET CART ITEMS BY USER ID
router.get("/user/:userId(\\d+)", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cartItems = await UserCart.findByUserId(userId);
    res.json(cartItems);
  } catch (err) {
    next(err);
  }
});

// GET CART ITEM BY ID
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cartItem = await UserCart.findById(id);

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json(cartItem);
  } catch (err) {
    next(err);
  }
});

// ADD TO CART
router.post("/", async (req, res, next) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const cartItem = await UserCart.addToCart(
      user_id,
      product_id,
      quantity || 1,
    );
    res.status(201).json(cartItem);
  } catch (err) {
    next(err);
  }
});

// UPDATE CART ITEM QUANTITY
router.put("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const cartItem = await UserCart.updateQuantity(id, quantity);
    res.json(cartItem);
  } catch (err) {
    next(err);
  }
});

// REMOVE FROM CART
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await UserCart.removeFromCart(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// CLEAR USER CART
router.delete("/user/:userId(\\d+)/clear", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await UserCart.clearUserCart(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
