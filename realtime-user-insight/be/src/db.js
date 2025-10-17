// src/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "realtime",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
(async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log("✅ Connected to MySQL at:", rows[0].now);
  } catch (err) {
    console.error("❌ MySQL connect error:", err);
  }
})();
