// src/lib/tracking/realtimeTracker.js
import { io } from "socket.io-client";

let socket = null;
let trackingInitialized = false;
// // dòng code mới thêm: giữ context pageKey toàn cục
let context = { pageKey: "unknown" }; // mặc định


// [ADD] Hàm đọc lại user từ localStorage (nếu có) để cập nhật tên
function refreshUserName(currentValue) {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.name) return parsed.name;
    }
  } catch {}
  return currentValue || "Guest";
}


// Giữ handler để gỡ khi logout
let clickHandler = null;
let scrollHandler = null;
let scrollTimerId = null;

// ============================================================
// ⚙️ Ngắt kết nối realtime khi logout
// ============================================================
export function disconnectRealtime() {
  if (clickHandler) {
    document.removeEventListener("click", clickHandler);
    clickHandler = null;
  }
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
    scrollHandler = null;
  }
  if (scrollTimerId) {
    clearTimeout(scrollTimerId);
    scrollTimerId = null;
  }
  if (socket) {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser?.name) {
      socket.emit("user_active", { user_name: storedUser.name, action: "logout" }); // ⚡ Gửi logout lần cuối
      console.log("📤 [Tracker] Gửi sự kiện logout lần cuối cho:", storedUser.name);
    }
  } catch {}

  socket.disconnect();
  console.log("🔴 [Tracker] Socket ngắt kết nối do logout");
  socket = null;
}

  trackingInitialized = false;
}

// ============================================================
// 🚀 Khởi tạo theo dõi realtime
// ============================================================
export function initRealtimeTracking(currentUser) {
  if (trackingInitialized) return;
  trackingInitialized = true;


  // ✅ Mới — luôn ưu tiên lấy user từ localStorage mới nhất
const getCurrentUserName = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.name) return parsed.name;
    } catch {}
  }
  return currentUser?.name || "Guest";
};
  // 🟩 Lấy userName chính xác từ currentUser hoặc localStorage
  let userName = currentUser?.name || "Guest";
  console.log("👤 [Tracker] Nhận currentUser từ AppContext:", currentUser);

  if (userName === "Guest") {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) {
          userName = parsed.name;
          console.log("👤 [Tracker] Lấy user từ localStorage:", userName);
        }
      } catch (err) {
        console.warn("⚠️ [Tracker] Lỗi parse user localStorage:", err);
      }
    }
  }

  // 🧠 Nếu chưa có user trong localStorage, thử lấy lại sau
if (!currentUser) {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
}



  // 🟢 TẠO SOCKET CHẬM 0.6s — chờ AppContext và localStorage load user thật
setTimeout(() => {
  const finalUser = refreshUserName(currentUser?.name || "Guest"); // ✅ đọc lại user chuẩn từ localStorage

  socket = io("http://localhost:4000", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionAttempts: 20,
    query: {
      userName: finalUser, // 🟩 luôn gửi user thật
    },
  });

  // ✅ Khi socket lần đầu connect
  socket.on("connect", () => {
    console.log("🟢 [Tracker] Kết nối socket:", socket.id);

    const isGuest = !finalUser || finalUser === "Guest";
    socket.emit("user_active", { user_name: finalUser, isGuest });
    console.log("📡 [Tracker] Gửi user_active lần đầu:", finalUser, "(guest:", isGuest, ")");

    // 🛑 Khi đóng tab → gửi user_inactive
    window.addEventListener("beforeunload", () => {
      socket.emit("user_inactive", { user_name: finalUser, isGuest });
      console.log("📴 [Tracker] user_inactive gửi trước khi đóng tab:", finalUser);
    });
  });

  // ♻️ Khi socket reconnect (sau F5 hoặc mạng chập chờn)
  socket.io.on("reconnect", (attempt) => {
    const reUser = refreshUserName(currentUser?.name || finalUser);
    const isGuest = !reUser || reUser === "Guest";
    console.log(`♻️ [Tracker] Socket reconnect lần ${attempt} → gửi lại user_active`);
    socket.emit("user_active", { user_name: reUser, isGuest });
  });

  // 📡 Khi server (Dashboard) yêu cầu FE gửi lại user_active
  socket.on("request_active_users", () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentName = storedUser?.name || finalUser || "Guest";
    console.log("📡 [FE] Server yêu cầu gửi lại user_active:", currentName);
    socket.emit("user_active", { user_name: currentName });
  });

  // 🔴 Khi mất kết nối
  socket.on("disconnect", (reason) => {
    console.warn("🔴 [Tracker] Socket ngắt kết nối:", reason);
  });

  console.log("📡 [Tracker] Tracking khởi tạo cho user:", finalUser);

  // ============================================================
  // 🖱️ CLICK + 🧭 SCROLL + 🚀 PAGE_VIEW giữ nguyên như cũ
  // ============================================================
}, 600);


  // ============================================================
  // 🖱️ THEO DÕI CLICK
  // ============================================================
  clickHandler = (e) => {
    const element = e.target.tagName;
    const content = e.target.innerText?.trim().slice(0, 100) || "(no text)";
    const eventData = {
      type: "click",
      user_name: userName,
      page: window.location.href,
      x: e.clientX,
      y: e.clientY,
      element,
      content,
    };
    socket.emit("track_event", eventData);
    console.log("🖱️ [Tracker] Gửi event click:", eventData);
  };
  document.addEventListener("click", clickHandler);

  // ============================================================
  // 🧭 THEO DÕI SCROLL
  // ============================================================
  scrollHandler = () => {
    clearTimeout(scrollTimerId);
    scrollTimerId = setTimeout(() => {
      const scrollPercent = Math.round(
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
          100
      );
      const eventData = {
        type: "scroll",
        user_name: userName,
        page: window.location.href,
        y: scrollPercent,
      };
      socket.emit("track_event", eventData);
      console.log("🧭 [Tracker] Gửi event scroll:", eventData);
    }, 400);
  };
  window.addEventListener("scroll", scrollHandler);

  // ============================================================
  // 🚀 PAGE_VIEW
  // ============================================================
  // [REPLACE] 🚀 PAGE_VIEW: trì hoãn & đảm bảo đã có user thật
setTimeout(() => {
  // đọc lại tên user mới nhất trước khi gửi
  userName = refreshUserName(userName);

  const pageViewEvent = {
    type: "page_view",
    user_name: userName,
    page: window.location.href,
  };
  socket.emit("track_event", pageViewEvent);
  console.log("🚀 [Tracker] Page view:", pageViewEvent);
}, 900); // 0.9s: đủ thời gian AppContext lưu user vào localStorage
}
// 🆕 Gửi event khi user logout để server cập nhật ngay
export function notifyUserLogout(userName) {
  if (!socket) return;
  socket.emit("user_active", { user_name: userName, action: "logout" });
  console.log("📤 [Realtime] Đã gửi sự kiện logout cho user:", userName);
}
