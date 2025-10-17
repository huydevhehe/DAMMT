import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI, reservationAPI } from "../services/api";

// [FIX] đổi alias @ sang đường dẫn tương đối
import { initRealtimeTracking } from "../lib/tracking/realtimeTracker";


const AppContext = createContext();

export function AppProvider({ children }) {
  const [restaurants, setRestaurants] = useState([]);
  const [hotRestaurants, setHotRestaurants] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [partyRestaurants, setPartyRestaurants] = useState([]);
  const [famousLocations, setFamousLocations] = useState([]);
  const [seafoodRestaurants, setSeafoodRestaurants] = useState([]);
  const [chineseRestaurants, setChineseRestaurants] = useState([]);
  const [popularCuisines, setPopularCuisines] = useState([]);
  const [monthlyFavorites, setMonthlyFavorites] = useState([]);
  const [amenitiesRestaurants, setAmenitiesRestaurants] = useState([]);
  const [luxuryRestaurants, setLuxuryRestaurants] = useState([]);
  const [trustedRestaurants, setTrustedRestaurants] = useState([]);
  const [touristRestaurants, setTouristRestaurants] = useState([]);
  const [lunchSuggestions, setLunchSuggestions] = useState([]);
  const [newOnDinerChill, setNewOnDinerChill] = useState([]);
  const [newsAndBlog, setNewsAndBlog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [page, setPage] = useState({
    all: 1,
    hotRestaurants: 1,
    hotProducts: 1,
    recommendedRestaurants: 1,
    partyRestaurants: 1,
    famousLocations: 1,
    seafoodRestaurants: 1,
    chineseRestaurants: 1,
    popularCuisines: 1,
    monthlyFavorites: 1,
    amenitiesRestaurants: 1,
    luxuryRestaurants: 1,
    trustedRestaurants: 1,
    touristRestaurants: 1,
    lunchSuggestions: 1,
    newOnDinerChill: 1,
    newsAndBlog: 1,
  });

  const [filters, setFilters] = useState({
    location: "",
    distance: "all",
    cuisine: "all",
    rating: "all",
    price: "all",
    operatingHours: "all",
    keyword: "",
  });

  const [locations, setLocations] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const deduplicateData = (data) => {
    const seenIds = new Set();
    return data.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  };



useEffect(() => {
  try {
    const savedRecentlyViewed = localStorage.getItem("recentlyViewed");
    if (savedRecentlyViewed) {
      setRecentlyViewed(JSON.parse(savedRecentlyViewed));
    }

    // [FIX] đọc đủ các key đã dùng, ưu tiên dinerchillToken
const token =
  localStorage.getItem("dinerchillToken") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token");

    if (token) {
  setAuthLoading(true);
  authAPI
    .getCurrentUser()
    .then((userData) => {
      if (userData) {
        setUser(userData);

        // ✅ [FIX] luôn đảm bảo user lưu vào localStorage trước khi khởi tạo tracker
        const safeUser = {
          name:
            userData?.name ||
            userData?.displayName ||
            userData?.email?.split("@")[0] ||
            "Người dùng",
          email: userData?.email || null,
        };
        localStorage.setItem("user", JSON.stringify(safeUser));

        // 🟢 [FIX] Chờ user xác thực hoàn tất rồi mới khởi tạo tracker
        setTimeout(() => {
          if (safeUser?.name && safeUser?.email) {
            console.log("⚡ [AppContext] User xác thực hoàn tất:", safeUser);
            initRealtimeTracking(safeUser);
            console.log("⚡ [AppContext] Khởi tạo realtime với user:", safeUser.name);
          } else {
            console.warn("⚠️ [AppContext] Chưa có user hợp lệ, bỏ qua khởi tạo tracker.");
          }
        }, 1000); // tăng delay lên 1000ms để chắc chắn user đã cập nhật


        // [FIX] Đảm bảo chỉ khởi tạo tracker sau khi xác thực user thật sự
        setTimeout(async () => {
          const storedUser = localStorage.getItem("user");

          // ✅ Nếu có user trong localStorage, thử verify lại với BE
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);

              // 🧩 Gọi API xác thực /auth/me để chắc chắn user còn hợp lệ
              const res = await fetch("http://localhost:5000/api/auth/me", {
                headers: {
                  Authorization: `Bearer ${
                    localStorage.getItem("dinerchillToken") ||
                    localStorage.getItem("accessToken") ||
                    localStorage.getItem("token")
                  }`,
                },
              });

              if (res.ok) {
                const verified = await res.json();
                console.log("🟢 [AppContext] User xác thực lại thành công:", verified);

                // [FIX] Ghi lại user đã xác thực
                localStorage.setItem("user", JSON.stringify(verified.data || parsed));
                initRealtimeTracking(verified.data || parsed); // 🟢 user thật
              } else {
                console.log("⚠️ [AppContext] Token không hợp lệ, fallback Guest");
                initRealtimeTracking({ name: "Guest" });
              }
            } catch (err) {
              console.warn("⚠️ [AppContext] Lỗi khi xác thực user:", err);
              initRealtimeTracking({ name: "Guest" });
            }
          } else {
            console.log("⚪ [AppContext] Không có user lưu, fallback Guest");
            initRealtimeTracking({ name: "Guest" });
          }
        }, 800); // [ADD] delay lâu hơn 800ms cho chắc BE phản hồi xong


      }

      setAuthLoading(false);
    })
    .catch((error) => {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      setAuthLoading(false);

      // 🟡 [FIX] KHÔNG gọi tracker Guest ở đây nữa — vì user có thể vẫn đang load
    });
} else {
  // 🟠 [KEEP] nếu thực sự không có token (chưa login)
  initRealtimeTracking(null);
  setAuthLoading(false);
}

  } catch (err) {
    console.error("Lỗi khi truy cập localStorage:", err);
    setRecentlyViewed([]);

    // 🔴 [ADD] Đề phòng lỗi → vẫn khởi tạo realtime guest
    initRealtimeTracking(null);
  }
}, []);


  useEffect(() => {
    try {
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } catch (err) {
      console.error("Lỗi khi lưu vào localStorage:", err);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((restaurant) => {
    if (!restaurant || !restaurant.id) return;
    setRecentlyViewed((prev) => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(
        (item) => item.id === restaurant.id
      );
      if (existingIndex !== -1) updated.splice(existingIndex, 1);
      updated.unshift(restaurant);
      if (updated.length > 10) updated.pop();
      return updated;
    });
  }, []);

  const removeFromRecentlyViewed = useCallback((restaurantId) => {
    setRecentlyViewed((prev) =>
      prev.filter((item) => item.id !== restaurantId)
    );
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewed");
  }, []);

  const applyFilters = useCallback(
    (data) => {
      let filteredData = [...(data || [])];
      if (filters.location && filters.location !== "") {
        filteredData = filteredData.filter((item) =>
          item.address?.includes(filters.location)
        );
      }
      if (filters.distance !== "all") {
        filteredData = filteredData.filter((item) => {
          const distance = item.distance || 0;
          return filters.distance === "near"
            ? distance <= 2
            : filters.distance === "under5km"
            ? distance <= 5
            : filters.distance === "under10km"
            ? distance <= 10
            : true;
        });
      }
      if (filters.cuisine && filters.cuisine !== "all") {
        filteredData = filteredData.filter((item) =>
          (item.cuisine?.toLowerCase() || "").includes(
            filters.cuisine.toLowerCase()
          )
        );
      }
      if (filters.rating !== "all") {
        filteredData = filteredData.filter((item) => {
          const rating = item.rating || 0;
          return filters.rating === "above4"
            ? rating >= 4
            : filters.rating === "above3"
            ? rating >= 3
            : true;
        });
      }
      if (filters.price !== "all") {
        filteredData = filteredData.filter((item) => {
          const averagePrice = item.averagePrice || 0;
          return filters.price === "low"
            ? averagePrice < 100000
            : filters.price === "medium"
            ? averagePrice >= 100000 && averagePrice < 300000
            : filters.price === "high"
            ? averagePrice >= 300000 && averagePrice < 500000
            : filters.price === "luxury"
            ? averagePrice >= 500000
            : true;
        });
      }
      if (filters.operatingHours !== "all") {
        filteredData = filteredData.filter((item) => {
          // Convert time strings to hours and minutes
          const openingTime = item.openingTime || "";
          const closingTime = item.closingTime || "";

          if (!openingTime || !closingTime) return false;

          // Extract hours and minutes from time strings
          const [openHour, openMinute] = openingTime.split(":").map(Number);
          const [closeHour, closeMinute] = closingTime.split(":").map(Number);

          // Convert to minutes for easier comparison
          const openTimeInMinutes = openHour * 60 + (openMinute || 0);
          const closeTimeInMinutes = closeHour * 60 + (closeMinute || 0);

          // Define time ranges in minutes for filtering
          const timeRanges = {
            morning: { start: 6 * 60, end: 11 * 60 }, // 6:00 - 11:00
            lunch: { start: 11 * 60, end: 14 * 60 }, // 11:00 - 14:00
            evening: { start: 17 * 60, end: 22 * 60 }, // 17:00 - 22:00
            latenight: { start: 22 * 60, end: 2 * 60 }, // 22:00 - 2:00
            "24h": { start: 0, end: 24 * 60 }, // 24h
          };

          const selectedRange = timeRanges[filters.operatingHours];
          if (!selectedRange) return true;

          // Check if restaurant is open during the entire selected time range
          // For overnight ranges like latenight
          if (selectedRange.end < selectedRange.start) {
            // Overnight case (e.g., 22:00 - 2:00)
            if (closeTimeInMinutes < openTimeInMinutes) {
              // Restaurant also operates overnight
              return (
                openTimeInMinutes <= selectedRange.start ||
                closeTimeInMinutes >= selectedRange.end
              );
            } else {
              // Restaurant closes on the same day
              return (
                openTimeInMinutes <= selectedRange.start &&
                closeTimeInMinutes >= 24 * 60
              );
            }
          } else {
            // Normal case (e.g., 11:00 - 14:00)
            return (
              openTimeInMinutes <= selectedRange.start &&
              (closeTimeInMinutes >= selectedRange.end ||
                closeTimeInMinutes < openTimeInMinutes)
            ); // handles overnight hours
          }
        });
      }
      if (filters.keyword) {
        const keywordLower = filters.keyword.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            (item.name?.toLowerCase() || "").includes(keywordLower) ||
            (item.description?.toLowerCase() || "").includes(keywordLower) ||
            (item.cuisine?.toLowerCase() || "").includes(keywordLower)
        );
      }
      return deduplicateData(filteredData);
    },
    [filters]
  );

  const fetchInitialData = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      // Get real locations from the database or API instead of mock data
      const defaultLocations = [
        { LocationID: 1, LocationName: "Hồ Chí Minh" },
        { LocationID: 2, LocationName: "Hà Nội" },
        { LocationID: 3, LocationName: "Đà Nẵng" },
      ];
      setLocations(defaultLocations);

      // No need to load mock data anymore
      setRestaurants([]);
      setOriginalData([]);
      // Data will now be loaded directly by the components that need it
    } catch (err) {
      console.error("Fetch initial data error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    setRestaurants(applyFilters(originalData));
    setHotRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "hotrestaurants"
        )
      )
    );
    setHotProducts(
      applyFilters(
        originalData.filter((r) => r.category?.toLowerCase() === "hotproducts")
      )
    );
    setRecommendedRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "recommendedrestaurants"
        )
      )
    );
    setPartyRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "partyrestaurants"
        )
      )
    );
    setFamousLocations(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "famouslocations"
        )
      )
    );
    setSeafoodRestaurants(
      applyFilters(
        originalData.filter((r) => r.cuisine?.toLowerCase() === "seafood")
      )
    );
    setChineseRestaurants(
      applyFilters(
        originalData.filter((r) => r.cuisine?.toLowerCase() === "chinese")
      )
    );
    setPopularCuisines(
      applyFilters(
        originalData.filter((r) => r.cuisine?.toLowerCase() !== "khác")
      )
    );
    setMonthlyFavorites(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "monthlyfavorites"
        )
      )
    );
    setAmenitiesRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "amenitiesrestaurants"
        )
      )
    );
    setLuxuryRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "luxuryrestaurants"
        )
      )
    );
    setTrustedRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "trustedrestaurants"
        )
      )
    );
    setTouristRestaurants(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "touristrestaurants"
        )
      )
    );
    setLunchSuggestions(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "lunchsuggestions"
        )
      )
    );
    setNewOnDinerChill(
      applyFilters(
        originalData.filter(
          (r) => r.category?.toLowerCase() === "newondinerchill"
        )
      )
    );
    setNewsAndBlog(
      applyFilters(
        originalData.filter((r) => r.category?.toLowerCase() === "newsandblog")
      )
    );
  }, [filters, applyFilters, originalData]);

  const loadMore = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const nextPage = page[category] + 1;
      const pageSize = category === "all" ? 20 : 10;
      const newData = originalData
        .filter((r) => r.category?.toLowerCase() === category)
        .slice((nextPage - 1) * pageSize, nextPage * pageSize);

      const updateState = {
        all: () =>
          setRestaurants((prev) => deduplicateData([...prev, ...newData])),
        hotRestaurants: () =>
          setHotRestaurants((prev) => deduplicateData([...prev, ...newData])),
        hotProducts: () =>
          setHotProducts((prev) => deduplicateData([...prev, ...newData])),
        recommendedRestaurants: () =>
          setRecommendedRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        partyRestaurants: () =>
          setPartyRestaurants((prev) => deduplicateData([...prev, ...newData])),
        famousLocations: () =>
          setFamousLocations((prev) => deduplicateData([...prev, ...newData])),
        seafoodRestaurants: () =>
          setSeafoodRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        chineseRestaurants: () =>
          setChineseRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        popularCuisines: () =>
          setPopularCuisines((prev) => deduplicateData([...prev, ...newData])),
        monthlyFavorites: () =>
          setMonthlyFavorites((prev) => deduplicateData([...prev, ...newData])),
        amenitiesRestaurants: () =>
          setAmenitiesRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        luxuryRestaurants: () =>
          setLuxuryRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        trustedRestaurants: () =>
          setTrustedRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        touristRestaurants: () =>
          setTouristRestaurants((prev) =>
            deduplicateData([...prev, ...newData])
          ),
        lunchSuggestions: () =>
          setLunchSuggestions((prev) => deduplicateData([...prev, ...newData])),
        newOnDinerChill: () =>
          setNewOnDinerChill((prev) => deduplicateData([...prev, ...newData])),
        newsAndBlog: () =>
          setNewsAndBlog((prev) => deduplicateData([...prev, ...newData])),
      }[category];
      updateState();

      setPage((prev) => ({ ...prev, [category]: nextPage }));
    } catch (err) {
      console.error("Load more error:", err);
      setError("Không thể tải thêm dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      const isFormData = userData instanceof FormData;
      console.log(
        "updateProfile - userData:",
        isFormData ? "FormData object" : userData
      );
      const response = await authAPI.updateProfile(userData);
      console.log("updateProfile - response:", response);
      if (response && response.user) setUser(response.user);
      return response;
    } catch (err) {
      console.error("Update profile error:", err);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setAuthLoading(true);
      const response = await authAPI.register(userData);
      if (!response.requiresVerification) {
        localStorage.setItem("dinerchillToken", response.token);
        setUser(response.user);
      }
      setAuthLoading(false);
      return response;
    } catch (err) {
      setAuthLoading(false);
      console.error("Register error:", err);
      throw err;
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      setAuthLoading(true);
      const response = await authAPI.verifyEmail(email, code);
      if (response.token) {
        localStorage.setItem("dinerchillToken", response.token);
        setUser(response.user);
      }
      setAuthLoading(false);
      return response;
    } catch (err) {
      setAuthLoading(false);
      console.error("Email verification error:", err);
      throw err;
    }
  };

  const resendVerification = async (email) => {
    try {
      return await authAPI.resendVerification(email);
    } catch (err) {
      console.error("Resend verification error:", err);
      throw err;
    }
  };

  const googleLogin = async (tokenId) => {
    try {
      setAuthLoading(true);
      const response = await authAPI.googleLogin(tokenId);
      if (response.user && response.user.name) {
        if (response.user.name.includes("\\")) {
          response.user.name =
            response.user.displayName ||
            response.user.email.split("@")[0] ||
            "Người dùng";
        }
      }
      setUser(response.user);
      localStorage.setItem("dinerchillToken", response.token);
      setAuthLoading(false);
      return true;
    } catch (error) {
      setAuthLoading(false);
      console.error("Google login error:", error);
      throw error;
    }
  };

  const zaloLogin = async (tokenId) => {
    try {
      setAuthLoading(true);
      const response = await authAPI.zaloLogin(tokenId);
      if (response.user && response.user.name) {
        if (response.user.name.includes("\\")) {
          response.user.name =
            response.user.displayName ||
            response.user.email.split("@")[0] ||
            "Người dùng";
        }
      }
      setUser(response.user);
      localStorage.setItem("dinerchillToken", response.token);
      setAuthLoading(false);
      return true;
    } catch (error) {
      setAuthLoading(false);
      console.error("Zalo login error:", error);
      throw error;
    }
  };

  // ⚙️ [SỬA HÀM LOGIN] - thêm lưu user thật vào localStorage
const login = async (userData) => {
  try {
    setAuthLoading(true);
    const response = await authAPI.login(userData);

    // ✅ Lưu user vào state React
    setUser(response.user);

    // ✅ Lưu token vào localStorage
    localStorage.setItem("dinerchillToken", response.token);

    // 🆕 [THÊM MỚI] Lưu user thật vào localStorage cho realtimeTracker
    localStorage.setItem("user", JSON.stringify({
      name:
        response.user?.name ||
        response.user?.displayName ||
        response.user?.email?.split("@")[0] ||
        "Người dùng",
      email: response.user?.email || null
    }));

    console.log("💾 [AppContext] Đã lưu user vào localStorage:", response.user);

    setAuthLoading(false);
    return true;
  } catch (error) {
    setAuthLoading(false);
    console.error("Lỗi đăng nhập:", error);
    throw error;
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dinerchillToken");
     localStorage.removeItem("accessToken");     // key cũ
  localStorage.removeItem("token");           // key cũ nữa
  localStorage.removeItem("user"); 
  };

  const addReservationHistory = (reservation) => {
    if (!user) return;
    console.log("Lưu lịch sử đặt chỗ:", reservation);
    setUser((prev) => ({
      ...prev,
      reservationHistory: [...(prev.reservationHistory || []), reservation],
    }));
  };

  const addReservation = async (reservationData) => {
    console.log("Đặt bàn:", reservationData);
    try {
      // Sử dụng reservationAPI.create từ services/api.js
      const response = await reservationAPI.create(reservationData);

      return {
        success: true,
        message: "Đặt bàn thành công",
        id: response.id || `RES-${Date.now()}`,
        tableCode: response.table?.tableCode,
      };
    } catch (error) {
      console.error("Error saving reservation:", error);

      // Kiểm tra nếu có response.data để lấy thông tin lỗi chi tiết
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đặt bàn thất bại, vui lòng thử lại";
      const showAsToast = error.response?.data?.showAsToast || false;

      return {
        success: false,
        message: errorMessage,
        showAsToast: showAsToast,
      };
    }
  };

  // Lấy userName từ user (nếu có)
  const userName = user
    ? user.name || user.displayName || user.email?.split("@")[0] || "Người dùng"
    : null;

  return (
    <AppContext.Provider
      value={{
        restaurants,
        hotRestaurants,
        hotProducts,
        recommendedRestaurants,
        partyRestaurants,
        famousLocations,
        seafoodRestaurants,
        chineseRestaurants,
        popularCuisines,
        monthlyFavorites,
        amenitiesRestaurants,
        luxuryRestaurants,
        trustedRestaurants,
        touristRestaurants,
        lunchSuggestions,
        newOnDinerChill,
        newsAndBlog,
        loading,
        error,
        user,
        authLoading,
        userName, // Thêm userName vào context
        login,
        logout,
        recentlyViewed,
        addToRecentlyViewed,
        removeFromRecentlyViewed,
        clearRecentlyViewed,
        loadMore,
        filters,
        setFilters,
        locations,
        register,
        verifyEmail,
        resendVerification,
        googleLogin,
        zaloLogin,
        updateProfile,
        addReservation,
        addReservationHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
