import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );
};

//register
router.post("/register", async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    school,
    department,
    required_hours,
    start_date,
  } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    !fullname ||
    !school ||
    !department ||
    !required_hours ||
    !start_date
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (userExist.rows.length > 0) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await pool.query(
    "INSERT INTO users (fullname, username, email, password, school, department, required_hours, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, fullname, username, email, school, department, required_hours, start_date",
    [
      fullname,
      username,
      email,
      hashedPassword,
      school,
      department,
      required_hours,
      start_date,
    ],
  );

  const token = generateToken(newUser.rows[0].id);

  res.cookie("token", token, cookieOptions);

  return res
    .status(201)
    .json({ message: "User registered successfully", user: newUser.rows[0] });
});

//login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password." });
  }

  const user = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  if (user.rows.length === 0) {
    return res.status(400).json({ message: "Invalid credentials." });
  }

  const userData = user.rows[0];
  const isMatch = await bcrypt.compare(password, userData.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials." });
  }

  const token = generateToken(userData);
  res.cookie("token", token, cookieOptions);

  res.json({
    user: {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullname: userData.fullname,
      school: userData.school,
      department: userData.department,
      required_hours: userData.required_hours,
      start_date: userData.start_date,
    },
  });
});
