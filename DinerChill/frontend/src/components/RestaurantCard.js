import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "../styles/components/RestaurantCard.css";

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const { addToRecentlyViewed } = useApp();

  // Initialize with null instead of a default image URL
  const [imageSrc, setImageSrc] = useState(null);

  // Set image source from restaurant images or default to fallback
  useEffect(() => {
    if (restaurant?.images && restaurant.images.length > 0) {
      // Use the first image from the images array
      const imagePath = restaurant.images[0].image_path;

      // Handle different URL formats
      if (imagePath.startsWith("http")) {
        setImageSrc(imagePath);
      } else if (imagePath.startsWith("/uploads/")) {
        // If the path starts with /uploads/, prepend the API URL
        const apiBaseUrl =
          process.env.REACT_APP_API_URL || "http://localhost:5000";
        setImageSrc(`${apiBaseUrl}${imagePath}`);
      } else {
        // Default case, just use the path as is
        setImageSrc(imagePath);
      }
    } else if (restaurant?.image) {
      // Fallback to the image property if available
      setImageSrc(restaurant.image);
    }
    // No need for else case as we already have a default image set in the initial state
  }, [restaurant]);

  const handleCardClick = () => {
    if (!restaurant?.id) return;
    addToRecentlyViewed(restaurant);
    const routes = {
      product: `/promotions/${restaurant.id}`,
      blog: `/blog/${restaurant.id}`,
      amenity: `/amenities/${restaurant.id}`,
    };
    const route = routes[restaurant.type] || `/restaurants/${restaurant.id}`;
    navigate(route);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleImageError = () => {
    setImageSrc(
      "https://images.unsplash.com/photo-1600585154360-0e7d76a0e0e7?fit=crop&w=300&h=200&q=80"
    );
  };

  const renderStars = (rating) => {
    const numericRating =
      typeof rating === "string" ? parseFloat(rating) : rating;
    if (isNaN(numericRating) || numericRating === 0) return null;

    const stars = Math.round(numericRating);
    const fullStars = Math.min(Math.max(stars, 0), 5);
    const emptyStars = 5 - fullStars;
    return (
      <>
        <span className="stars">
          {"★".repeat(fullStars) + "☆".repeat(emptyStars)}
        </span>
        <span className="rating-value">{numericRating.toFixed(1)}</span>
      </>
    );
  };

  if (!restaurant || !restaurant.id || !restaurant.name) return null;

  const discountValue =
    restaurant.discountPrice && restaurant.price
      ? restaurant.price - restaurant.discountPrice
      : null;

  return (
    <div
      className="restaurant-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Xem chi tiết ${
        restaurant.type === "product"
          ? "sản phẩm"
          : restaurant.type === "blog"
          ? "bài viết"
          : restaurant.type === "amenity"
          ? "tiện ích"
          : "nhà hàng"
      } ${restaurant.name}`}
    >
      <div className="card-image">
        <img
          src={imageSrc}
          alt={`Ảnh của ${restaurant.name}`}
          onError={handleImageError}
        />
        <div className="logo-overlay">DinerChill</div>
        {(restaurant.discount || discountValue) && (
          <span className="discount-badge">
            {restaurant.discount ||
              (discountValue > 0 && `Giảm ${discountValue}K`)}
          </span>
        )}
      </div>
      <div className="card-content">
        <h3>{restaurant.name}</h3>
        <div className="rating-price">
          {typeof restaurant.rating !== "undefined" &&
            renderStars(restaurant.rating)}
          {(restaurant.price || restaurant.discountPrice) && (
            <span className="price">
              {restaurant.discountPrice && restaurant.price ? (
                <>
                  <span className="original-price">{restaurant.price}K</span>
                  <span className="discounted-price">
                    {restaurant.discountPrice}K
                  </span>
                </>
              ) : (
                `${restaurant.price || restaurant.discountPrice}K`
              )}
            </span>
          )}
        </div>
        <div className="additional-info">
          {restaurant.cuisine && (
            <p className="cuisine">{restaurant.cuisine}</p>
          )}
          {restaurant.offer && <p className="offer">{restaurant.offer}</p>}
          {restaurant.validUntil && (
            <p className="valid-until">{restaurant.validUntil}</p>
          )}
          {restaurant.location && (
            <p className="location">
              Tọa độ: {restaurant.location.latitude},{" "}
              {restaurant.location.longitude}
            </p>
          )}
          {restaurant.description && (
            <p className="description">{restaurant.description}</p>
          )}
          {restaurant.date && <p className="date">{restaurant.date}</p>}
        </div>
        {restaurant.type !== "product" &&
          restaurant.type !== "blog" &&
          restaurant.type !== "amenity" && (
            <p className="reservation-text">Đặt bàn giữ chỗ</p>
          )}
      </div>
    </div>
  );
}

export default RestaurantCard;
