const router = require("express").Router();
const { ProductEmbeddings } = require("../models");

// GET ALL PRODUCT EMBEDDINGS
router.get("/", async (req, res, next) => {
  try {
    const embeddings = await ProductEmbeddings.findAll();
    res.json(embeddings);
  } catch (err) {
    next(err);
  }
});

// GET EMBEDDINGS BY PRODUCT ID
router.get("/product/:productId(\\d+)", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const embeddings = await ProductEmbeddings.findByProductId(productId);
    res.json(embeddings);
  } catch (err) {
    next(err);
  }
});

// GET EMBEDDING BY ID
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const embedding = await ProductEmbeddings.findById(id);

    if (!embedding) {
      return res.status(404).json({ error: "Product embedding not found" });
    }

    res.json(embedding);
  } catch (err) {
    next(err);
  }
});

// CREATE PRODUCT EMBEDDING
router.post("/", async (req, res, next) => {
  try {
    const embeddingData = req.body;
    const embedding = await ProductEmbeddings.create(embeddingData);
    res.status(201).json(embedding);
  } catch (err) {
    next(err);
  }
});

// UPDATE PRODUCT EMBEDDING
router.put("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const embeddingData = req.body;
    const embedding = await ProductEmbeddings.update(id, embeddingData);
    res.json(embedding);
  } catch (err) {
    next(err);
  }
});

// DELETE PRODUCT EMBEDDING
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ProductEmbeddings.delete(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
