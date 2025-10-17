import express from "express";
import { pool } from "../db.js";

const router = express.Router();



// [ADD] Đếm số event theo loại trong N phút gần nhất
async function getEventTypeCounts(pool, windowMinutes = 10) {
  const [rows] = await pool.query(
    `
    SELECT type, COUNT(*) AS count
    FROM events
    WHERE timestamp >= NOW() - INTERVAL ? MINUTE
    GROUP BY type
    `,
    [windowMinutes]
  );

  // Chuẩn hóa đủ 3 loại
  const map = { click: 0, scroll: 0, page_view: 0 };
  rows.forEach((r) => {
    if (r.type && map[r.type] !== undefined) map[r.type] = Number(r.count || 0);
  });

  return {
    window_minutes: windowMinutes,
    click: map.click,
    scroll: map.scroll,
    page_view: map.page_view,
  };
}

// [ADD] export hàm
export { getEventTypeCounts };





// ✅ API: /api/metrics - tổng hợp dữ liệu realtime
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        -- Số người dùng đang hoạt động (chưa kết thúc session)
        (SELECT COUNT(*) FROM sessions WHERE end_time IS NULL) AS active_users,
        
        -- Tổng số phiên làm việc
        (SELECT COUNT(*) FROM sessions) AS total_sessions,
        
        -- Tổng số sự kiện (click, scroll, page_view,...)
        (SELECT COUNT(*) FROM events) AS total_events,
        
        -- Thời gian trung bình mỗi phiên (giây)
        COALESCE(
          ROUND(AVG(TIMESTAMPDIFF(SECOND, sessions.start_time, sessions.end_time))),
          0
        ) AS avg_duration
      FROM sessions
      LIMIT 1;
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi metrics:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});
// ===============================================
// ✅ API: /api/metrics/last24h - Tổng sự kiện trong 24 giờ qua
// ===============================================
router.get("/last24h", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) AS total_24h
      FROM events
      WHERE timestamp >= NOW() - INTERVAL 1 DAY;
    `);

    res.json({ total_24h: rows[0].total_24h });
  } catch (err) {
    console.error("❌ Lỗi metrics/last24h:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

export default router;
