const router = require("express").Router();
const { SearchHistory } = require("../models");

// GET ALL SEARCH HISTORY
router.get("/", async (req, res, next) => {
  try {
    const history = await SearchHistory.findAll();
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET SEARCH HISTORY BY USER ID
router.get("/user/:userId(\\d+)", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const history = await SearchHistory.findByUserId(userId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// CREATE SEARCH HISTORY ENTRY
router.post("/", async (req, res, next) => {
  try {
    const searchData = req.body;
    const entry = await SearchHistory.create(searchData);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// DELETE SEARCH HISTORY ENTRY
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await SearchHistory.delete(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// CLEAR USER SEARCH HISTORY
router.delete("/user/:userId(\\d+)/clear", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await SearchHistory.clearUserHistory(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
