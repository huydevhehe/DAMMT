import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EventData {
  time: string;
  count: number;
}

const RealtimeChart = () => {
  const [data, setData] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/events");
        const grouped = groupByMinute(res.data);
        setData(grouped);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      }
    };
    fetchData();

    const socket = io("http://localhost:4000", { transports: ["websocket"] });

    socket.on("new_event", (event) => {
      const time = new Date(event.timestamp).toLocaleTimeString("vi-VN", {
        hour12: false,
      });

      setData((prev) => {
        const existing = prev.find((d) => d.time === time);
        if (existing) {
          return prev.map((d) =>
            d.time === time ? { ...d, count: d.count + 1 } : d
          );
        }
        return [...prev.slice(-29), { time, count: 1 }];
      });
    });

    socket.on("disconnect", () => console.log("🔴 Mất kết nối realtime"));

    return () => socket.disconnect();
  }, []);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8">
      <h2 className="text-lg font-semibold mb-4">
        📈 Biểu đồ realtime (Tổng sự kiện)
      </h2>
      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
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
    </div>
  );
};

export default RealtimeChart;
