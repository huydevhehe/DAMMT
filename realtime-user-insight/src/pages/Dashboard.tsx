"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import apiClient from "@/lib/apiClient";
import MetricsCard from "@/components/dashboard/MetricsCard";
import EventsTable from "@/components/dashboard/EventsTable";
import HeatmapView from "@/components/dashboard/HeatmapView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Activity, MousePointer2, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import EventTypePie from "@/components/dashboard/EventTypePie";


// 🕒 Hàm định dạng thời gian sang kiểu dễ đọc (giờ Việt Nam)
function formatDateTime(isoString?: string | null) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const Dashboard = () => {
  // 🧠 Socket toàn cục
  const socket = useSocket();

  // ====================== STATE ======================
  const [metrics, setMetrics] = useState({
    active_users: 0,
    total_sessions: 0,
    total_events: 0,
    avg_duration: 0,
    total_24h: 0,
  });
  const [chartData, setChartData] = useState<{ time: string; count: number }[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // ====================== 🟢 NEW: State quản lý người dùng đang hoạt động ======================
  const [totalActive, setTotalActive] = useState(0); // tổng user (login + guest)
  const [guestCount, setGuestCount] = useState(0);   // số khách chưa login


  const [activeUsers, setActiveUsers] = useState<
  { name: string; login_time: string; logout_time?: string }[]>([]); // danh sách user login

  
  // ====================== 🟢 Modal chi tiết user ======================
const [showDetail, setShowDetail] = useState(false);        // điều khiển mở/đóng popup
const [selectedUser, setSelectedUser] = useState<string | null>(null);  // lưu tên user được chọn
const [userActions, setUserActions] = useState<any[]>([]);  // danh sách hành động của user


  // 🧭 Toggle hiển thị từng phần
  const [showChart, setShowChart] = useState(true);
  const [showPie, setShowPie] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // ====================== LOAD BAN ĐẦU ======================
  useEffect(() => {
    console.log("🚀 Mount Dashboard component...");
    loadMetrics();
    loadInitialEvents();
  }, []);
    // ✅ Lấy lại thông tin user login từ localStorage khi F5
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      console.log("👤 Khôi phục user từ localStorage:", user?.name);
      // Emit lại user cho server biết user này đang hoạt động
      socket?.emit("user_active", { user_name: user?.name });
    }
  }, [socket]);



  // ====================== SOCKET REALTIME ======================
  useEffect(() => {
    if (!socket) return;
    console.log("🟢 [Dashboard] Socket connected:", socket.id);
    
    // --- Realtime metrics ---
    socket.on("update_metrics", (data) => {
      console.log("📊 [Realtime] update_metrics:", data);
      setMetrics((prev) => ({ ...prev, ...data }));

        

    });

    // --- Realtime tổng 24h ---
    socket.on("update_24h", (data) => {
      console.log("📊 [Realtime] update_24h:", data);
      setMetrics((prev) => ({
        ...prev,
        total_24h: data.total_24h || prev.total_24h,
      }));
    });

    // ====================== 🟢 Lắng nghe danh sách user đang hoạt động ======================
socket.on("active_summary", (data) => {
  console.log("📡 [Realtime] Nhận active_summary từ server:", data);

  // 🧩 Kiểm tra log, đảm bảo server gửi đúng danh sách user
  console.table(data?.users);

  // ✅ Cập nhật state hiển thị realtime
  setTotalActive(data?.total_active ?? 0);
  setGuestCount(data?.guest_count ?? 0);
  setActiveUsers(data?.users ?? []);

  // ⚙️ Nếu server chưa gửi được, tự động tính tổng lại
  if (!data?.total_active) {
    setTotalActive((data?.users?.length || 0) + (data?.guest_count || 0));
  }
});



    // --- Khi có event mới ---
    socket.on("new_event", (event) => {
      console.log("⚡ [Realtime] new_event:", event);
      updateChart(event);
      setEvents((prev) => [event, ...prev.slice(0, 49)]);
      setMetrics((prev) => ({
        ...prev,
        total_events: prev.total_events + 1,
      }));
    });

    socket.on("disconnect", () => {
      console.log("🔴 [Dashboard] Socket disconnected");
    });

    // Cleanup
    return () => {
      socket.off("update_metrics");
      socket.off("update_24h");
      socket.off("new_event");
      console.log("🧹 Cleanup socket listeners");
       socket.off("active_summary"); // ✅ thêm dòng này
    };
  }, [socket]);

  // ====================== LOAD API ======================
  const loadMetrics = async () => {
    try {
      console.log("📥 [API] Load metrics...");
      const res = await apiClient.get("/metrics");
      const res24 = await apiClient.get("/metrics/last24h");
      if (res?.data) {
        setMetrics({
          ...res.data,
          total_24h: res24.data?.total_24h || 0,
        });
      }
    } catch (err) {
      console.error("❌ [API] Lỗi load metrics:", err);
    }
  };

  const loadInitialEvents = async () => {
    try {
      console.log("📥 [API] Load events...");
      const res = await apiClient.get("/events");
      const data = res.data || [];
      setEvents(data);
      setChartData(groupByMinute(data));
    } catch (err) {
      console.error("❌ [API] Lỗi load events:", err);
    }
  };

  // ====================== HÀM HỖ TRỢ ======================
  const groupByMinute = (events: any[]) => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString("vi-VN", {
        hour12: false,
      });
      map.set(time, (map.get(time) || 0) + 1);
    });
    return Array.from(map.entries()).map(([time, count]) => ({ time, count }));
  };

  // ✅ Sửa gọn lại, bỏ phần định nghĩa formatDateTime trùng lặp
const updateChart = (event: any) => {
  const time = new Date(event.timestamp).toLocaleTimeString("vi-VN", {
    hour12: false,
  });

  setChartData((prev) => {
    const existing = prev.find((d) => d.time === time);
    if (existing) {
      return prev.map((d) =>
        d.time === time ? { ...d, count: d.count + 1 } : d
      );
    }
    return [...prev.slice(-29), { time, count: 1 }];
  });
};


    // ====================== 🟢 Hàm xem chi tiết hành động của user ======================
  const handleViewDetail = async (username: string) => {
  setSelectedUser(username);
  setShowDetail(true);

  try {
    console.log("📡 [Dashboard] Gọi API lấy chi tiết hành động của:", username);
    const res = await fetch(`http://localhost:4000/api/user-activity/${username}`);
    let data = await res.json();

    // ✅ Lấy thời điểm login của user từ state
    const userInfo = activeUsers.find((u) => u.name === username);
    if (userInfo?.login_time) {
      const loginTime = new Date(`1970-01-01T${userInfo.login_time}Z`);
      data = data.filter((e: any) => new Date(e.timestamp) > loginTime);
    }

    setUserActions(data);
    console.log("📜 Hành động của user sau khi đăng nhập:", data);
  } catch (err) {
    console.error("❌ Lỗi lấy hành động user:", err);
  }
};

  

  // ====================== GIAO DIỆN ======================
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" /> Dashboard Realtime
        </h1>
        <button
          onClick={loadMetrics}
          className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow transition"
        >
          🔄 Làm mới
        </button>
      </div>

        {/* ====================== 🟢 Popup xem chi tiết user ====================== */}
  {/* ====================== 🟢 Popup xem chi tiết user ====================== */}
{showDetail && (
  <div
    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    onClick={() => setShowDetail(false)} // 🆕 click ra ngoài để đóng
  >
    <div
      className="bg-white p-6 rounded-2xl w-[600px] max-h-[80vh] overflow-y-auto shadow-lg relative"
      onClick={(e) => e.stopPropagation()} // 🧩 chặn sự kiện click lan ra ngoài
    >
      {/* 🆕 Nút quay lại */}
      <button
        onClick={() => setShowDetail(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
      >
        ⬅️ Quay lại
      </button>

      <h3 className="text-lg font-semibold mb-4">
        Hành động của {selectedUser}
      </h3>

      {userActions.length > 0 ? (
        <ul className="space-y-2 text-sm text-gray-700">
          {userActions.map((a, i) => (
            <li
              key={i}
              className="border-b py-2 last:border-none flex justify-between"
            >
              <span>
                🏷️ {a.type} — <span className="text-blue-600">{a.page}</span>
              </span>
              <span className="text-gray-500 text-xs">{a.timestamp}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">Không có hành động nào sau khi đăng nhập.</p>
      )}
    </div>
  </div>
)}




      {/* ====================== 🟢 Tổng người dùng đang hoạt động ====================== */}
{/* ✅ Thống kê tổng khách và phân loại */}
<div className="ml-4 space-y-2 text-gray-700">
  {/* Tổng khách = tổng user đã login + khách chưa login */}
  <p>👥 Tổng khách: <b>{(activeUsers?.length || 0) + (guestCount || 0)}</b></p>

  {/* Khách chưa login */}
  <p>🔹 Khách chưa đăng nhập: <b>{guestCount || 0}</b></p>

  {/* Khách đã login */}
  <p>🔸 Khách đã đăng nhập: <b>{activeUsers?.length || 0}</b></p>
</div>


      {/* --- Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <MetricsCard title="Người dùng hoạt động" value={metrics.active_users} icon={<Users />} />
        <MetricsCard title="Phiên làm việc" value={metrics.total_sessions} icon={<Activity />} />
        <MetricsCard title="Tổng sự kiện" value={metrics.total_events} icon={<MousePointer2 />} />
        <MetricsCard title="Sự kiện 24h qua" value={metrics.total_24h} icon={<Clock />} />
        <MetricsCard title="Thời gian TB (giây)" value={metrics.avg_duration} icon={<Clock />} />
      </div>

      {/* --- Chart --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📈 Biểu đồ realtime (Tổng sự kiện)
          </h2>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-sm px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            {showChart ? "Ẩn" : "Hiện"}
          </button>
        </div>

        {showChart && (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- Pie chart --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📊 Phân loại sự kiện (Click / Scroll / Page View)
          </h2>
          <button
            onClick={() => setShowPie(!showPie)}
            className="text-sm px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            {showPie ? "Ẩn" : "Hiện"}
          </button>
        </div>
        {showPie && <EventTypePie />}
      </div>

      {/* --- Tabs (Events + Heatmap) --- */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Sự kiện</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="text-sm px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
            >
              {showEvents ? "Ẩn bảng" : "Hiện bảng"}
            </button>
          </div>
          {showEvents && <EventsTable socket={socket} events={events} />}
        </TabsContent>

        <TabsContent value="heatmap">
          <HeatmapView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
