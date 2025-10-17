"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket phải được dùng trong SocketProvider");
  return context.socket;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("⚙️ [SocketProvider] Khởi tạo socket...");
    const newSocket = io("http://localhost:4000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    newSocket.on("connect", () => {
      console.log("🟢 [SocketProvider] Socket connected:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("🔴 [SocketProvider] Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ [SocketProvider] Lỗi kết nối socket:", err.message);
    });

    return () => {
      console.log("🧹 [SocketProvider] Cleanup socket");
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
