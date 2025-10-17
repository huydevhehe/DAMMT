import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SocketProvider } from "@/context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ✅ Bọc toàn app trong SocketProvider */}
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>
);
