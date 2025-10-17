// [ADD] src/components/dashboard/EventTypePie.tsx
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSocket } from "@/context/SocketContext"; // [KEEP] context socket sẵn có của bạn

const COLORS = ["#ef4444", "#3b82f6", "#22c55e"]; // đỏ, xanh dương, xanh lá

type Counts = {
  window_minutes: number;
  click: number;
  scroll: number;
  page_view: number;
};

export default function EventTypePie() {
  const socket = useSocket();
  const [counts, setCounts] = useState<Counts>({
    window_minutes: 10,
    click: 0,
    scroll: 0,
    page_view: 0,
  });

  useEffect(() => {
    if (!socket) return;
    // Nhận dữ liệu lần đầu + cập nhật realtime
    const handler = (payload: Counts) => setCounts(payload);
    socket.on("event_type_counts", handler);

    return () => {
      socket.off("event_type_counts", handler);
    };
  }, [socket]);

  const data = useMemo(
    () => [
      { name: "Click", value: counts.click },
      { name: "Scroll", value: counts.scroll },
      { name: "Page View", value: counts.page_view },
    ],
    [counts]
  );

  const total = counts.click + counts.scroll + counts.page_view;

  return (
    <div className="p-4 rounded-2xl shadow-sm bg-white/70 backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Tỉ lệ loại sự kiện</h3>
        <span className="text-xs text-gray-500">
          {counts.window_minutes} phút gần nhất • Tổng: {total}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              label={({ name, value }) => `${name}: ${value}`}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
