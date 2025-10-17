// ========================== 🟢 IMPORT ==========================
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ========================== 🟢 API LẤY HÀNH ĐỘNG USER ==========================
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    console.log("📥 [API] Nhận yêu cầu xem hành động user:", username);

    // 🟢 Lấy thời điểm login gần nhất của user
    const [loginRows] = await pool.query(
      `
      SELECT MAX(timestamp) AS last_login
      FROM events
      WHERE user_name = ? AND type = 'login'
      `,
      [username]
    );

    const lastLoginTime = loginRows[0]?.last_login;
    console.log("🕒 [API] Lần đăng nhập gần nhất:", lastLoginTime);

    // 🟢 Nếu có loginTime → chỉ lấy sự kiện sau thời điểm đó
    let query = `
      SELECT type, page, element, timestamp
      FROM events
      WHERE user_name = ?
    `;
    const params = [username];

    if (lastLoginTime) {
      query += " AND timestamp >= ?";
      params.push(lastLoginTime);
    }

    query += " ORDER BY timestamp DESC LIMIT 50";

    const [rows] = await pool.query(query, params);
    console.log(`📊 [API] Trả về ${rows.length} hành động sau login của user ${username}`);

    res.json(rows);
  } catch (err) {
    console.error("❌ [API] Lỗi lấy dữ liệu userActivity:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
