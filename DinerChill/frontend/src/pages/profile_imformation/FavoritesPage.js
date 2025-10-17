import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteAPI } from '../../services/api';
import { useApp } from '../../context/AppContext';
import '../../styles/profile_imformation/FavoritesPage.css';
import LogoutHandler from '../identity/LogoutHandler';

function FavoritesPage() {
  const { user } = useApp();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      // Lấy dữ liệu từ localStorage làm nguồn ban đầu
      const localFavoriteDetails = JSON.parse(localStorage.getItem('favoriteDetails') || '[]');
      const formattedLocalFavorites = Array.isArray(localFavoriteDetails) ? localFavoriteDetails.map(fav => ({
        id: fav.id,
        restaurantId: fav.id,
        restaurantName: fav.name || 'Nhà hàng không xác định',
        restaurantImage: fav.image || '',
        address: fav.address || 'Địa chỉ không xác định',
        source: 'local',
      })) : [];

      // Gọi API để lấy dữ liệu từ server
      let apiData = [];
      try {
        const response = await favoriteAPI.getUserFavorites();
        if (Array.isArray(response)) {
          apiData = response;
        } else {
          console.warn('API response is not an array:', response);
        }
      } catch (apiErr) {
        console.error('API call failed:', apiErr);
      }

      const apiFavorites = Array.isArray(apiData) ? apiData.map(fav => ({
        id: fav.id,
        restaurantId: fav.restaurantId,
        restaurantName: fav.restaurantName || 'Nhà hàng không xác định',
        restaurantImage: fav.restaurantImage || '',
        address: fav.address || 'Địa chỉ không xác định',
        cuisine: fav.cuisine || '',
        rating: fav.rating || 0,
        reviewCount: fav.reviewCount || 0,
        priceRange: fav.priceRange || '',
        description: fav.description || '',
        source: 'api',
      })) : [];

      // Hợp nhất dữ liệu: ưu tiên API, bổ sung từ localStorage nếu chưa có
      const mergedFavorites = [
        ...apiFavorites,
        ...formattedLocalFavorites.filter(localFav => 
          !apiFavorites.some(apiFav => apiFav.restaurantId === localFav.restaurantId)
        ),
      ];

      // Loại bỏ trùng lặp dựa trên restaurantId
      const uniqueFavorites = Array.from(new Map(mergedFavorites.map(fav => [fav.restaurantId, fav])).values());
      setFavorites(uniqueFavorites);

      // Đồng bộ localStorage với dữ liệu từ API
      localStorage.setItem('favorites', JSON.stringify(uniqueFavorites.map(fav => fav.restaurantId)));
      localStorage.setItem('favoriteDetails', JSON.stringify(uniqueFavorites.map(fav => ({
        id: fav.restaurantId,
        name: fav.restaurantName,
        image: fav.restaurantImage,
        address: fav.address,
      }))));

      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      // Nếu API lỗi, vẫn dùng dữ liệu từ localStorage
      const localFavoriteDetails = JSON.parse(localStorage.getItem('favoriteDetails') || '[]');
      const formattedLocalFavorites = Array.isArray(localFavoriteDetails) ? localFavoriteDetails.map(fav => ({
        id: fav.id,
        restaurantId: fav.id,
        restaurantName: fav.name || 'Nhà hàng không xác định',
        restaurantImage: fav.image || '',
        address: fav.address || 'Địa chỉ không xác định',
        source: 'local',
      })) : [];
      setFavorites(formattedLocalFavorites);
      setError('Không thể tải danh sách yêu thích từ server. Đang hiển thị dữ liệu cục bộ.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (restaurantId) => {
    if (window.confirm('Bạn có chắc muốn xóa nhà hàng này khỏi danh sách yêu thích?')) {
      try {
        // Gọi API để xóa trên server
        await favoriteAPI.remove(restaurantId);

        // Cập nhật localStorage
        const updatedFavorites = favorites.filter(fav => fav.restaurantId !== restaurantId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites.map(fav => fav.restaurantId)));
        localStorage.setItem('favoriteDetails', JSON.stringify(updatedFavorites.map(fav => ({
          id: fav.restaurantId,
          name: fav.restaurantName,
          image: fav.restaurantImage,
          address: fav.address,
        }))));

        // Cập nhật state favorites
        setFavorites(updatedFavorites);

        // Hiển thị thông báo thành công
        setToast({
          show: true,
          message: 'Đã xóa nhà hàng khỏi danh sách yêu thích!',
          type: 'success',
        });

        // Ẩn toast sau 3 giây
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      } catch (err) {
        console.error('Error removing favorite:', err);

        // Cập nhật localStorage ngay cả khi API lỗi
        const updatedFavorites = favorites.filter(fav => fav.restaurantId !== restaurantId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites.map(fav => fav.restaurantId)));
        localStorage.setItem('favoriteDetails', JSON.stringify(updatedFavorites.map(fav => ({
          id: fav.restaurantId,
          name: fav.restaurantName,
          image: fav.restaurantImage,
          address: fav.address,
        }))));

        // Cập nhật state favorites
        setFavorites(updatedFavorites);

        // Hiển thị thông báo lỗi
        setToast({
          show: true,
          message: 'Đã loại bỏ yêu thích nhà hàng.',
          type: 'error',
        });

        // Ẩn toast sau 3 giây
        setTimeout(() => {
          setToast({ show: false, message: '', type: '' });
        }, 3000);
      }
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return '?';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="avatar-image" />
              ) : (
                getInitials()
              )}
            </div>
            <div className="username">{user?.name || 'Người dùng'}</div>
            <div className="user-info">ID: {user?.id || 'N/A'}</div>
            <div className="user-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg> {user?.phone || 'Chưa có số điện thoại'}
            </div>
          </div>
          
          <nav className="profile-nav">
            <ul>
              <li>
                <Link to="/profile">
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  Thông tin tài khoản
                </Link>
              </li>
              <li>
                <Link to="/my-reservations">
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                  Lịch sử đặt chỗ
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="active">
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </span>
                  Danh sách yêu thích
                </Link>
              </li>
              <li>
                <Link to="/change-password">
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  Quản lý mật khẩu
                </Link>
              </li>
              <li>
                <Link to="/payment-history">
                  <span className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                  </span>
                  Lịch sử đặt cọc
                </Link>
              </li>
              <li>
                <LogoutHandler />
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="profile-main">
          <div className="profile-header">
            <h1>
              <span className="header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </span>
              DANH SÁCH YÊU THÍCH
            </h1>
          </div>
          
          {error && (
            <div className="error-message">
              <span className="message-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              {error}
            </div>
          )}
          
          {loading && favorites.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3>Bạn chưa có nhà hàng yêu thích nào</h3>
              <p>Hãy khám phá và thêm nhà hàng yêu thích của bạn ngay bây giờ</p>
              <Link to="/restaurants" className="btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Khám phá nhà hàng
              </Link>
            </div>
          ) : (
            <div className="favorites-container">
              {favorites.map(favorite => (
                <div key={favorite.id} className="favorite-card">
                  <div className="favorite-image">
                    {favorite.restaurantImage && typeof favorite.restaurantImage === 'string' && favorite.restaurantImage.trim() !== '' ? (
                      <img
                        src={favorite.restaurantImage}
                        alt={favorite.restaurantName}
                        className="restaurant-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="image-placeholder"
                      style={{
                        display: favorite.restaurantImage && typeof favorite.restaurantImage === 'string' && favorite.restaurantImage.trim() !== '' ? 'none' : 'flex',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <button 
                      className="remove-favorite-btn"
                      onClick={() => handleRemoveFavorite(favorite.restaurantId)}
                      title="Xóa khỏi danh sách yêu thích"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="favorite-content">
                    <h3 className="restaurant-name">{favorite.restaurantName}</h3>
                    
                    <div className="restaurant-info">
                      <div className="info-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{favorite.address}</span>
                      </div>
                      
                      {favorite.cuisine && (
                        <div className="info-item">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                            <line x1="6" y1="1" x2="6" y2="4"></line>
                            <line x1="10" y1="1" x2="10" y2="4"></line>
                            <line x1="14" y1="1" x2="14" y2="4"></line>
                          </svg>
                          <span>{favorite.cuisine}</span>
                        </div>
                      )}
                      
                      {favorite.rating > 0 && (
                        <div className="info-item">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <span>{favorite.rating} ({favorite.reviewCount} đánh giá)</span>
                        </div>
                      )}
                      
                      {favorite.priceRange && (
                        <div className="info-item">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          <span>{favorite.priceRange}</span>
                        </div>
                      )}
                    </div>
                    
                    {favorite.description && (
                      <p className="restaurant-description">{favorite.description}</p>
                    )}
                    
                    <div className="favorite-actions">
                      <Link to={`/restaurants/${favorite.restaurantId}`} className="btn-view">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Xem chi tiết
                      </Link>
                      
                      <Link to={`/restaurants/${favorite.restaurantId}?showReservation=true`} className="btn-reserve">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Đặt bàn
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Toast notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;