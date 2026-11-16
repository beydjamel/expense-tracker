const express = require("express");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^\d{1,9}$/;

function parseBody(body) {
  const { type, amount, date, note, category_id } = body;
  const parsedAmount = Number(amount);

  if (
    !["income", "expense"].includes(type) ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0
  ) {
    return { error: "Valid type and positive amount are required" };
  }
  if (date !== undefined && (typeof date !== "string" || !DATE_RE.test(date))) {
    return { error: "Date must be YYYY-MM-DD" };
  }
  if (category_id != null && !Number.isInteger(category_id)) {
    return { error: "Invalid category" };
  }
  if (note != null && typeof note !== "string") {
    return { error: "Invalid note" };
  }
  return {
    value: {
      type,
      amount: parsedAmount,
      date: date ?? null,
      note: note ?? null,
      category_id: category_id ?? null,
    },
  };
}

async function categoryBelongsToUser(categoryId, userId) {
  const result = await pool.query(
    "SELECT 1 FROM categories WHERE id = $1 AND user_id = $2",
    [categoryId, userId],
  );
  return result.rows.length > 0;
}

function handleError(err, res) {
  if (err.code === "22008" || err.code === "22007") {
    return res.status(400).json({ error: "Invalid date" });
  }
  if (err.code === "22003") {
    return res.status(400).json({ error: "Amount too large" });
  }
  console.error(err.message);
  res.status(500).json({ error: "Server error" });
}

router.post("/", async (req, res) => {
  const { error, value } = parseBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    if (
      value.category_id !== null &&
      !(await categoryBelongsToUser(value.category_id, req.user.id))
    ) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, date, note)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
       RETURNING id, category_id, type, amount,
                 to_char(date, 'YYYY-MM-DD') AS date, note`,
      [
        req.user.id,
        value.category_id,
        value.type,
        value.amount,
        value.date,
        value.note,
      ],
    );
    res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/", async (req, res) => {
  const { month, category_id } = req.query;
  const params = [req.user.id];
  let where = "user_id = $1";

  if (month !== undefined) {
    if (typeof month !== "string" || !MONTH_RE.test(month)) {
      return res.status(400).json({ error: "Month must be YYYY-MM" });
    }
    params.push(`${month}-01`);
    where += ` AND date >= $${params.length}::date
               AND date < ($${params.length}::date + INTERVAL '1 month')`;
  }

  if (category_id !== undefined) {
    if (typeof category_id !== "string" || !ID_RE.test(category_id)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    params.push(Number(category_id));
    where += ` AND category_id = $${params.length}`;
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
    handleError(err, res);
  }
});

router.get("/summary", async (req, res) => {
  const { month } = req.query;
  if (typeof month !== "string" || !MONTH_RE.test(month)) {
    return res.status(400).json({ error: "Month must be YYYY-MM" });
  }
  const start = `${month}-01`;

  try {
    const totals = await pool.query(
      `SELECT income, expense, income - expense AS balance
       FROM (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
           COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
         FROM transactions
         WHERE user_id = $1
           AND date >= $2::date AND date < ($2::date + INTERVAL '1 month')
       ) s`,
      [req.user.id, start],
    );

    const byCategory = await pool.query(
      `SELECT t.category_id,
              COALESCE(c.name, 'Uncategorized') AS category,
              SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'expense'
         AND t.date >= $2::date AND t.date < ($2::date + INTERVAL '1 month')
       GROUP BY t.category_id, c.name
       ORDER BY total DESC`,
      [req.user.id, start],
    );

    res.json({
      month,
      ...totals.rows[0],
      expenses_by_category: byCategory.rows,
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.put("/:id", async (req, res) => {
  if (!ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const { error, value } = parseBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    if (
      value.category_id !== null &&
      !(await categoryBelongsToUser(value.category_id, req.user.id))
    ) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = $1, type = $2, amount = $3,
           date = COALESCE($4::date, date), note = $5
       WHERE id = $6 AND user_id = $7
       RETURNING id, category_id, type, amount,
                 to_char(date, 'YYYY-MM-DD') AS date, note`,
      [
        value.category_id,
        value.type,
        value.amount,
        value.date,
        value.note,
        Number(req.params.id),
        req.user.id,
      ],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ transaction: result.rows[0] });
  } catch (err) {
    handleError(err, res);
  }
});

router.delete("/:id", async (req, res) => {
  if (!ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [Number(req.params.id), req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;
