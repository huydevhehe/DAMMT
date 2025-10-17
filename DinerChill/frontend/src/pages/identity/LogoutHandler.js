import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import LogoutConfirmation from './LogoutConfirmation';
import '../../styles/layout/logout-confirmation.css';

// ✅ import hàm ngắt kết nối realtime đúng cách
import { disconnectRealtime } from '../../lib/tracking/realtimeTracker';
import { notifyUserLogout } from "../../lib/tracking/realtimeTracker"; // Đảm bảo import đúng

function LogoutHandler() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // ✅ Lấy user hiện tại từ localStorage
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // 🆕 Gửi thông báo realtime đến server rằng user này vừa logout
    notifyUserLogout(currentUser?.name); // Gửi sự kiện logout tới Realtime

    // ✅ Gọi hàm logout của context (nếu có)
    logout();

    // ✅ Xóa toàn bộ thông tin user trong localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");

    // ✅ Ngắt kết nối socket realtime
    disconnectRealtime(); // 👉 ngắt socket + reset tracker

    console.log("🔴 Socket realtime đã ngắt kết nối sau khi logout");

    // ✅ Quay lại trang chủ hoặc login
    navigate('/');
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <button className="logout-btn" onClick={handleLogoutClick}>
        <span className="nav-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </span>
        Thoát
      </button>

      {showLogoutConfirm && (
        <LogoutConfirmation
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
}

export default LogoutHandler;
