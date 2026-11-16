const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

const ID_RE = /^\d{1,9}$/;

router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.includes("@")
  ) {
    return res
      .status(400)
      .json({ error: "Valid name, email and password are required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, admin_id)
       VALUES ($1, $2, $3, 'worker', $4)
       RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, req.user.id],
    );
    res.status(201).json({ worker: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE admin_id = $1 AND role = 'worker' ORDER BY id",
      [req.user.id],
    );
    res.json({ workers: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!ID_RE.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND admin_id = $2 AND role = 'worker' RETURNING id",
      [Number(req.params.id), req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Worker not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
