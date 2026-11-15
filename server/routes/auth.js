require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

router.post("/register", async (req, res) => {
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
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash],
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email.trim().toLowerCase()],
    );
    const found = result.rows[0];
    const valid =
      found && (await bcrypt.compare(password, found.password_hash));

    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { password_hash, ...user } = found;
    res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
