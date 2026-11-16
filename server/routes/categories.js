const express = require("express");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/", async (req, res) => {
  const { name } = req.body;

  if (typeof name !== "string" || !name.trim() || name.trim().length > 50) {
    return res
      .status(400)
      .json({ error: "Name is required (max 50 characters)" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id, name",
      [req.user.id, name.trim()],
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Category already exists" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name",
      [req.user.id],
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
