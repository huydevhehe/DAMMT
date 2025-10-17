import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

const HeatmapView = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    const res = await apiClient.get("/events");
    setEvents(res.data.filter((e: any) => e.type === "click"));
  };

  return (
    <div className="relative w-full h-[600px] bg-gray-100 border rounded-lg overflow-hidden">
      {events.map((e, i) => (
        <div
          key={i}
          className="absolute bg-red-500 opacity-40 blur-lg rounded-full"
          style={{
            left: `${e.x}px`,
            top: `${e.y}px`,
            width: "50px",
            height: "50px",
            transform: "translate(-50%, -50%)",
          }}
          title={`${e.page} (${e.x}, ${e.y})`}
        />
      ))}
    </div>
  );
};

export default HeatmapView;
