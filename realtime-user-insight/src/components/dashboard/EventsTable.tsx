import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

interface EventData {
  id: number;
  timestamp: string;
  type: string;
  page: string;
  user_name?: string;
  element?: string;
  content?: string;
}

const EventsTable = ({ socket, events: initialEvents }: any) => {
  const [events, setEvents] = useState<EventData[]>(initialEvents || []);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    if (!socket) return;
    console.log("🟢 [EventsTable] Socket ID:", socket.id);

    socket.on("new_event", (event: EventData) => {
      console.log("📩 [EventsTable] Nhận event mới:", event);
      setEvents((prev) => [event, ...prev.slice(0, 49)]);
    });

    return () => {
      socket.off("new_event");
    };
  }, [socket]);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="font-semibold text-lg mb-4">🔥 Sự kiện realtime gần đây</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-2 border">Thời gian</th>
              <th className="p-2 border">Người dùng</th>
              <th className="p-2 border">Loại</th>
              <th className="p-2 border">Phần tử</th>
              <th className="p-2 border">Nội dung</th>
              <th className="p-2 border">Trang</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50 transition-all">
                <td className="p-2 border">{new Date(e.timestamp).toLocaleString("vi-VN")}</td>
                <td className="p-2 border">{e.user_name || "Guest"}</td>
                <td className="p-2 border">{e.type}</td>
                <td className="p-2 border">{e.element || "-"}</td>
                <td className="p-2 border max-w-[250px] truncate">{e.content || "-"}</td>
                <td className="p-2 border text-blue-600 underline truncate max-w-[250px]">
                  {e.page}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsTable;
