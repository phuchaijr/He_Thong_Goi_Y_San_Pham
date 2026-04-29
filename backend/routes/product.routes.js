const express = require("express");
const router = express.Router();
const { Products } = require("../models");

// GET ALL PRODUCTS
router.get("/", async (req, res, next) => {
  try {
    const products = await Products.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FEATURED PRODUCTS
router.get("/featured", async (req, res, next) => {
  try {
    const products = await Products.findFeatured();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET DEALS PRODUCTS
router.get("/deals", async (req, res, next) => {
  try {
    const products = await Products.findDeals();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PRODUCT BY ID
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Products.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE PRODUCT
router.post("/", async (req, res, next) => {
  try {
    const productData = req.body;
    const product = await Products.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PRODUCT
router.put("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const product = await Products.update(id, productData);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PRODUCT
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Products.delete(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PRODUCTS BY CATEGORY
router.get("/category/:categoryId(\\d+)", async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const products = await Products.findByCategory(categoryId);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
