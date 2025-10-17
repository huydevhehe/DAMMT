import { useEffect } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const TrackingScript = () => {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:4000");

    const sessionId = uuidv4();
    const userAgent = navigator.userAgent;
    console.log("🟢 Bắt đầu session:", sessionId);

    socket.emit("start_session", {
      session_id: sessionId,
      user_agent: userAgent,
    });

    const handleUnload = () => {
      console.log("🔴 Kết thúc session:", sessionId);
      socket.emit("end_session", { session_id: sessionId });
    };
    window.addEventListener("beforeunload", handleUnload);

    // 🖱️ Theo dõi click
    const handleClick = (e) => {
      socket.emit("track_event", {
        type: "click",
        x: e.clientX,
        y: e.clientY,
        page: window.location.href,
      });
    };

    // 🧭 Theo dõi cuộn trang
    let scrollTimer;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
            100
        );
        socket.emit("track_event", {
          type: "scroll",
          y: scrollPercent,
          page: window.location.href,
        });
      }, 300);
    };

    // 🚀 Khi user mở trang
    socket.emit("track_event", {
      type: "page_view",
      page: window.location.href,
    });

    document.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleUnload);
      socket.disconnect();
    };
  }, []);

  return null;
};

export default TrackingScript;
