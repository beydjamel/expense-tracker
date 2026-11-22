const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

async function getAdminId(workerId) {
  const result = await pool.query(
    "SELECT admin_id FROM users WHERE id = $1 AND role = 'worker'",
    [workerId],
  );
  return result.rows[0]?.admin_id ?? null;
}

router.get("/categories", async (req, res) => {
  if (req.user.role !== "worker") {
    return res.status(403).json({ error: "Worker access required" });
  }
  try {
    const adminId = await getAdminId(req.user.id);
    if (!adminId) {
      return res.status(403).json({ error: "Worker account not found" });
    }
    const result = await pool.query(
      "SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name",
      [adminId],
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  if (req.user.role !== "worker") {
    return res.status(403).json({ error: "Worker access required" });
  }

  const { amount, note, category_id } = req.body;
  const type = req.body.type ?? "expense";
  const parsedAmount = Number(amount);

  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Positive amount is required" });
  }
  if (category_id != null && !Number.isInteger(category_id)) {
    return res.status(400).json({ error: "Invalid category" });
  }
  if (note != null && typeof note !== "string") {
    return res.status(400).json({ error: "Invalid note" });
  }

  try {
    const adminId = await getAdminId(req.user.id);
    if (!adminId) {
      return res.status(403).json({ error: "Worker account not found" });
    }

    if (category_id != null) {
      const cat = await pool.query(
        "SELECT 1 FROM categories WHERE id = $1 AND user_id = $2",
        [category_id, adminId],
      );
      if (!cat.rows[0]) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, note, created_by)
              VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, category_id, type, amount,
                 to_char(date, 'YYYY-MM-DD') AS date, note`,
      [
        adminId,
        category_id ?? null,
        type,
        parsedAmount,
        note ?? null,
        req.user.id,
      ],
    );
    res.status(201).json({ expense: result.rows[0] });
  } catch (err) {
    if (err.code === "22003") {
      return res.status(400).json({ error: "Amount too large" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
