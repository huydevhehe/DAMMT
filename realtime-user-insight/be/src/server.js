import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { pool } from "./db.js";
import eventRoutes from "./routes/events.js";
import metricsRoutes, { getEventTypeCounts } from "./routes/metrics.js";
import userActivityRouter from "./routes/userActivity.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ==================== API ROUTES ====================
app.use("/api/events", eventRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/user-activity", userActivityRouter);

// ==================== SOCKET.IO SETUP ====================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ✅ FIX: Khai báo global lưu người dùng đang online
const activeUsers = new Map(); // key: user_name, value: { socketId, loginTime }
const activeGuests = new Set(); // lưu socketId của khách

// ==================== HELPER FUNCTION ====================
async function updateUserStatus(user_name, isGuest, status) {
  try {
    
    // tạo bảng nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(100) UNIQUE,
        is_guest BOOLEAN DEFAULT 0,
        status ENUM('online', 'offline') DEFAULT 'online',
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME NULL,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    if (status === "online") {
      await pool.query(
        `INSERT INTO user_status (user_name, is_guest, status, login_time)
         VALUES (?, ?, 'online', NOW())
         ON DUPLICATE KEY UPDATE status='online', logout_time=NULL, last_update=NOW();`,
        [user_name, isGuest ? 1 : 0]
      );
    } else if (status === "offline") {
      await pool.query(
        `UPDATE user_status
         SET status='offline', logout_time=NOW()
         WHERE user_name = ?;`,
        [user_name]
      );
    }
  } catch (err) {
    console.error("❌ [DB] updateUserStatus lỗi:", err);
  }
}

async function buildSummaryFromDB() {
  const [rows] = await pool.query(`
    SELECT user_name, is_guest, login_time, logout_time
    FROM user_status
    WHERE status='online'
    ORDER BY login_time DESC;
  `);

  return {
    total_active: rows.length,
    guest_count: rows.filter((u) => u.is_guest).length,
    users: rows.filter((u) => !u.is_guest),
  };
}

// ==================== SOCKET HANDLER ====================
io.on("connection", async (socket) => {
  const origin = socket.handshake.headers.origin || "";
  const isDashboard = origin.includes("localhost:8080");

  let userName = socket.handshake?.query?.userName?.trim() || "Guest";
  if (userName === "undefined" || userName === "null") userName = "Guest";

  console.log(`🟢 Client connected: ${socket.id}, userName = ${userName}`);

  // ==================== DASHBOARD ====================
  if (isDashboard) {
    console.log("📊 Dashboard connected — chỉ quan sát, không tính active users");

    const summary = await buildSummaryFromDB();
    socket.emit("active_summary", summary);
    console.log("📤 [Server] Gửi active_summary từ DB:", summary);

    // yêu cầu các FE gửi lại user_active
    setTimeout(() => {
      io.emit("request_active_users");
    }, 300);
    return;
  }

  // ==================== USER CONNECT ====================
  const isGuest = !userName || userName === "Guest";
  const loginTime = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  await updateUserStatus(userName, isGuest, "online");
  console.log(`✅ User ${userName} online lúc ${loginTime}`);

  // ✅ Lưu user vào memory map
  if (isGuest) {
    activeGuests.add(socket.id);
  } else {
    activeUsers.set(userName, { socketId: socket.id, loginTime });
  }

  const summary = await buildSummaryFromDB();
  io.emit("active_summary", summary);

  // ==================== PIE CHART BAN ĐẦU ====================
  try {
    const counts = await getEventTypeCounts(pool, 10);
    io.to(socket.id).emit("event_type_counts", counts);
  } catch (err) {
    console.error("emit event_type_counts (initial) error:", err);
  }

  // ==================== METRICS BAN ĐẦU ====================
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(DISTINCT session_id) FROM sessions) AS total_sessions,
        (SELECT COUNT(*) FROM events) AS total_events,
        (SELECT COUNT(*) FROM sessions WHERE end_time IS NULL) AS active_users,
        COALESCE(ROUND(AVG(TIMESTAMPDIFF(SECOND, start_time, end_time))), 0) AS avg_duration
      FROM sessions;
    `);
    socket.emit("update_metrics", rows[0]);
  } catch (err) {
    console.error("❌ Lỗi gửi metrics ban đầu:", err);
  }

  // ==================== TRACK EVENT ====================
  socket.on("track_event", async (event) => {
    try {
      let { type, x, y, page, user_name, element, content } = event;
      if (!user_name || user_name === "Guest") user_name = "Khách vãng lai";

      const [insertResult] = await pool.query(
        `INSERT INTO events (type, x, y, page, timestamp, user_name, element, content)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?);`,
        [type, x, y, page, user_name, element || null, content || null]
      );

      const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [insertResult.insertId]);
      const insertedEvent = rows[0];
      io.emit("new_event", insertedEvent);

      const [metricsRows] = await pool.query(`
        SELECT 
          (SELECT COUNT(DISTINCT session_id) FROM sessions) AS total_sessions,
          (SELECT COUNT(*) FROM events) AS total_events,
          (SELECT COUNT(*) FROM sessions WHERE end_time IS NULL) AS active_users,
          COALESCE(ROUND(AVG(TIMESTAMPDIFF(SECOND, start_time, end_time))), 0) AS avg_duration
        FROM sessions;
      `);
      io.emit("update_metrics", metricsRows[0]);

      const [rows24] = await pool.query(`
        SELECT COUNT(*) AS total_24h
        FROM events
        WHERE timestamp >= NOW() - INTERVAL 1 DAY;
      `);
      io.emit("update_24h", { total_24h: rows24[0].total_24h });

      const counts = await getEventTypeCounts(pool, 10);
      io.emit("event_type_counts", counts);

      console.log("📡 [Realtime] new_event + update_metrics:", insertedEvent);
    } catch (err) {
      console.error("❌ Lỗi track_event:", err);
    }
  });

  // ==================== USER_ACTIVE ====================
  socket.on("user_active", async (data) => {
    const user = data?.user_name || "Guest";
    const isGuest = !user || user === "Guest";
    console.log("📩 [Server] Nhận user_active:", user, "(guest:", isGuest, ")");

    await updateUserStatus(user, isGuest, "online");

    const summary = await buildSummaryFromDB();
    io.emit("active_summary", summary);
  });

  // ==================== DISCONNECT ====================
socket.on('user_active', async (data) => {
  const { user_name, action } = data;

  if (action === 'logout') {
    // Cập nhật logout_time và status thành offline trong cơ sở dữ liệu
    const logoutTime = new Date().toISOString(); // Lấy thời gian logout hiện tại
    await updateUserStatus(user_name, false, 'offline', logoutTime);  // Cập nhật logout_time và status
    console.log(`📤 [Server] Cập nhật trạng thái người dùng ${user_name} thành offline và thời gian logout: ${logoutTime}`);

    // Phát lại sự kiện active_summary để cập nhật frontend
    const summary = await buildSummaryFromDB();
    io.emit('active_summary', summary);
    console.log("📡 [Server] Gửi active_summary từ DB:", summary);
  }
});

});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Realtime Server running on port ${PORT}`));
