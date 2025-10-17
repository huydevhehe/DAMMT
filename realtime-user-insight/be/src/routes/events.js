// src/routes/events.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/* 
  =============================================
  🟢 API: Lấy 50 event mới nhất (cho biểu đồ realtime)
  =============================================
*/
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, x, y, page, user_name, element, content, timestamp 
       FROM events 
       ORDER BY id DESC 
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* 
  =============================================
  🟢 API: Ghi event mới (click / scroll / page_view)
  =============================================
*/
router.post("/", async (req, res) => {
  try {
    const { type, x, y, page, user_name, element, content } = req.body;

    // Nếu FE quên gửi user_name thì gán mặc định là Guest
    const safeUser = user_name || "Guest";

    // 🧠 Ghi dữ liệu vào DB, có thêm element và content
    const [result] = await pool.query(
      `INSERT INTO events (type, x, y, page, user_name, element, content, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [type, x, y, page, safeUser, element, content]
    );

    // Lấy lại bản ghi vừa thêm để trả về
    const [insertedRows] = await pool.query(
      `SELECT * FROM events WHERE id = ?`, [result.insertId]
    );

    console.log("📩 New event saved via API:", insertedRows[0]);
    res.status(201).json({
      message: "Event added successfully",
      event: insertedRows[0],
    });

  } catch (err) {
    console.error("❌ Insert error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

export default router;
