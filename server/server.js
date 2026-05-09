import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";


dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World ");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
