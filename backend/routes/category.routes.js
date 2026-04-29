const router = require("express").Router();
const { Categories } = require("../models");

router.get("/", async (req, res, next) => {
  try {
    const categories = await Categories.findAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET CATEGORY BY ID
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Categories.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
});

// GET CATEGORY BY SLUG
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await Categories.findBySlug(slug);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
});

// CREATE CATEGORY
router.post("/", async (req, res, next) => {
  try {
    const categoryData = req.body;
    const category = await Categories.create(categoryData);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// UPDATE CATEGORY
router.put("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const category = await Categories.update(id, categoryData);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// DELETE CATEGORY
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Categories.delete(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
