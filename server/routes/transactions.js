const express = require("express");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/", async (req, res) => {
  const { type, amount, date, note, category_id } = req.body;
  const parsedAmount = Number(amount);

  if (
    !["income", "expense"].includes(type) ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Valid type and positive amount are required" });
  }
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Date must be YYYY-MM-DD" });
  }

  try {
    if (category_id != null) {
      if (!Number.isInteger(category_id)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      const cat = await pool.query(
        "SELECT 1 FROM categories WHERE id = $1 AND user_id = $2",
        [category_id, req.user.id],
      );
      if (!cat.rows[0]) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, date, note)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
       RETURNING id, category_id, type, amount,
                 to_char(date, 'YYYY-MM-DD') AS date, note`,
      [
        req.user.id,
        category_id ?? null,
        type,
        parsedAmount,
        date ?? null,
        note ?? null,
      ],
    );
    res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    if (err.code === "22008" || err.code === "22007") {
      return res.status(400).json({ error: "Invalid date" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const { month } = req.query;
  const params = [req.user.id];
  let where = "user_id = $1";

  if (month !== undefined) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ error: "Month must be YYYY-MM" });
    }
    params.push(`${month}-01`);
    where += " AND date >= $2::date AND date < ($2::date + INTERVAL '1 month')";
  }

  try {
    const result = await pool.query(
      `SELECT id, category_id, type, amount,
              to_char(date, 'YYYY-MM-DD') AS date, note
       FROM transactions
       WHERE ${where}
       ORDER BY date DESC, id DESC`,
      params,
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
