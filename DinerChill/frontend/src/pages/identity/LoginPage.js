import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import '../../styles/identity/AuthPages.css';

// ⚙️ Import realtime tracking
import { initRealtimeTracking, disconnectRealtime } from "../../lib/tracking/realtimeTracker";

function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra nếu có redirect path
  const from = location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.emailOrPhone.trim()) {
      setError('Vui lòng nhập email hoặc số điện thoại');
      return false;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    return true;
  };

  const normalizeCredentials = () => {
    let credentials = { ...formData };
    if (credentials.emailOrPhone) {
      credentials.emailOrPhone = credentials.emailOrPhone.trim();
    }
    return credentials;
  };

  // ============================================================
  // ⚙️ Xử lý đăng nhập
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;
    setLoading(true);

    try {
      // 1️⃣ Chuẩn hóa thông tin đăng nhập
      const normalizedCredentials = normalizeCredentials();

      // 2️⃣ Gọi API login thật
      // 1️⃣ Gọi API login
      await login(normalizedCredentials);

      
      // 🕒 Thêm delay nhỏ đảm bảo login() đã ghi xong vào localStorage
await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("🧩 [LoginPage] Đang lấy token và user sau login...");

      // 3️⃣ Lấy lại token & user sau khi login
      const token = localStorage.getItem("dinerchillToken");

      const storedUser = localStorage.getItem("user");
      console.log("🧩 [LoginPage] token =", token, "| storedUser =", storedUser);


      // 4️⃣ Ngắt socket Guest
      disconnectRealtime();




      // 5️⃣ Khởi động realtime với user thật (nếu có)
      let userData = null;
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
        } catch {
          userData = { name: "Guest" };
        }
      }

      if (token && userData) {
        console.log("✅ [LoginPage] Bắt đầu tracking cho user:", userData.name);
        initRealtimeTracking(userData);
      } else {
        console.log("⚪ [LoginPage] Không có token hoặc user → fallback Guest");
        initRealtimeTracking(null);
      }

      // 6️⃣ Xử lý điều hướng (giữ nguyên logic cũ)
      const savedReservationData = sessionStorage.getItem("pendingReservation");
      if (savedReservationData) {
        const reservationData = JSON.parse(savedReservationData);
        if (reservationData.tableId) {
          const query = new URLSearchParams({
            restaurant: reservationData.restaurantId,
            date: reservationData.date,
            time: reservationData.time,
            guests: reservationData.guests,
            children: reservationData.children,
            tableId: reservationData.tableId,
            tableCode: reservationData.tableCode,
            tableCapacity: reservationData.tableCapacity
          });
          if (reservationData.promotion) query.append("promotion", reservationData.promotion);
          if (reservationData.promotionId) query.append("promotionId", reservationData.promotionId);
          navigate(`/reservation?${query.toString()}`);
        } else {
          const query = new URLSearchParams({
            date: reservationData.date,
            time: reservationData.time,
            guests: reservationData.guests,
            children: reservationData.children
          });
          if (reservationData.promotion) query.append("promotion", reservationData.promotion);
          navigate(`/restaurant/${reservationData.restaurantId}/tables?${query.toString()}`);
        }
        sessionStorage.removeItem("pendingReservation");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);
      if (err.message && err.message.includes('đăng nhập bằng Google')) {
        setError('Tài khoản hoặc mật khẩu đăng nhập không chính xác');
      } else if (loginAttempts >= 1) {
        setError('Tài khoản hoặc mật khẩu đăng nhập không chính xác. Vui lòng nhấn "Quên mật khẩu?" để đặt lại mật khẩu mới.');
      } else {
        setError('Tài khoản hoặc mật khẩu đăng nhập không chính xác');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 🧠 Các hàm đăng nhập mạng xã hội (giữ nguyên)
  // ============================================================
  const handleGoogleLogin = () => {
    if (sessionStorage.getItem("pendingReservation")) {
      sessionStorage.setItem("oauthLoginPending", "true");
    }
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const handleZaloLogin = () => {
    if (sessionStorage.getItem("pendingReservation")) {
      sessionStorage.setItem("oauthLoginPending", "true");
    }
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/zalo`;
  };

  // ============================================================
  // 📄 JSX giao diện (giữ nguyên)
  // ============================================================
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Đăng nhập</h1>
            <p>Chào mừng trở lại! Đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="auth-error">
              <i className="error-icon">⚠️</i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="emailOrPhone">Tài khoản</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="text"
                  id="emailOrPhone"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  placeholder="Nhập email hoặc số điện thoại"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <i className="loading-icon">⏳</i> Đang xử lý...
                </>
              ) : (
                <>
                  <i className="button-icon">🔑</i> Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>HOẶC</span>
          </div>

          <div className="social-login">
            <button type="button" className="google-login-button" onClick={handleGoogleLogin}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                className="google-logo"
              />
              <span>Đăng nhập với Google</span>
            </button>

            <button type="button" className="zalo-login-button" onClick={handleZaloLogin}>
              <img
                src="https://stc-zaloprofile.zdn.vn/pc/v1/images/zalo_sharelogo.png"
                alt="Zalo logo"
                className="zalo-logo"
              />
              <span>Đăng nhập với Zalo</span>
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản?{" "}
              <Link to="/register" className="register-link">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
