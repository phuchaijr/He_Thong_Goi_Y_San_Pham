const router = require("express").Router();
const { UserInteractions } = require("../models");

// GET ALL USER INTERACTIONS
router.get("/", async (req, res, next) => {
  try {
    const interactions = await UserInteractions.findAll();
    res.json(interactions);
  } catch (err) {
    next(err);
  }
});

// GET INTERACTIONS BY USER ID
router.get("/user/:userId(\\d+)", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const interactions = await UserInteractions.findByUserId(userId);
    res.json(interactions);
  } catch (err) {
    next(err);
  }
});

// GET INTERACTIONS BY PRODUCT ID
router.get("/product/:productId(\\d+)", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const interactions = await UserInteractions.findByProductId(productId);
    res.json(interactions);
  } catch (err) {
    next(err);
  }
});

// GET INTERACTIONS BY TYPE
router.get("/type/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const interactions = await UserInteractions.findByType(type);
    res.json(interactions);
  } catch (err) {
    next(err);
  }
});

// CREATE USER INTERACTION
router.post("/", async (req, res, next) => {
  try {
    const interactionData = req.body;
    const interaction = await UserInteractions.create(interactionData);
    res.status(201).json(interaction);
  } catch (err) {
    next(err);
  }
});

// DELETE USER INTERACTION
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await UserInteractions.delete(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
