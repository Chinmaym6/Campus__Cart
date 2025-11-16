import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./Marketplace.css";
import "./marketplace-saved-btn.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [suggestions, setSuggestions] = useState({
    suggestions: [],
    categories: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const [filters, setFilters] = useState({
    category_id: searchParams.get("category") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    condition: searchParams.get("condition") || "",
    transaction_type: searchParams.get("transaction_type") || "",
    distance: searchParams.get("distance") || "",
    date_posted: searchParams.get("date_posted") || "",
    sort_by: searchParams.get("sort") || "newest",
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [userId, setUserId] = useState(null);

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
    }

    fetchCategories();
    getUserLocation();
  }, []);

  useEffect(() => {
    const count = Object.values(filters).filter(
      (v) => v && v !== "newest" && v !== ""
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [filters, currentPage, userLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items/categories`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: 24,
        search: searchQuery,
        ...filters,
      };

      if (userLocation && filters.distance) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.distance = filters.distance;
      }

      if (userId) {
        params.user_id = userId;
      }

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === "") delete params[key];
      });

      console.log("Fetching items with params:", params);

      const response = await axios.get(`${API_URL}/api/items/browse`, {
        params,
      });

      console.log("Response:", response.data);

      setItems(response.data.items || []);
      setTotalItems(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Error fetching items:", error);
      console.error("Error details:", error.response?.data);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions({ suggestions: [], categories: [] });
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(
        `${API_URL}/api/items/search-suggestions`,
        {
          params: { q: query },
        }
      );
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      const recent = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(recent);
      localStorage.setItem("recentSearches", JSON.stringify(recent));
    }

    setShowSuggestions(false);
    setCurrentPage(1);
    updateURLParams();
    fetchItems();
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);

    const recent = [
      suggestion,
      ...recentSearches.filter((s) => s !== suggestion),
    ].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem("recentSearches", JSON.stringify(recent));

    setCurrentPage(1);
    fetchItems();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    updateURLParams({ [key]: value });
  };

  const updateURLParams = (newFilters = {}) => {
    const params = new URLSearchParams();
    const allFilters = { ...filters, ...newFilters };

    if (searchQuery) params.set("search", searchQuery);
    Object.entries(allFilters).forEach(([key, value]) => {
      if (value && value !== "newest" && value !== "") {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setFilters({
      category_id: "",
      min_price: "",
      max_price: "",
      condition: "",
      transaction_type: "",
      distance: "",
      date_posted: "",
      sort_by: "newest",
    });
    setSearchQuery("");
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const formatTimeAgo = (secondsAgo) => {
    const minutes = Math.floor(secondsAgo / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatCondition = (condition) => {
    const map = {
      brand_new: "Brand New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
      for_parts: "For Parts",
    };
    return map[condition] || condition;
  };

  const handleSaveItem = async (itemId, e) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth", { state: { mode: "login" } });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/items/${itemId}/save`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <div className="marketplace-container">
          <div className="header-top">
            <h1 className="marketplace-title">
              <span className="title-icon">🛍️</span>
              Browse Marketplace
            </h1>

            <button
              className="saved-items-btn"
              onClick={() => navigate("/profile?tab=saved")}
              title="View Saved Items"
            >
              ❤️ Saved
            </button>

            <div className="search-container" ref={suggestionsRef}>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                <button type="submit" className="search-btn">
                  🔍
                </button>
              </form>

              {showSuggestions &&
                (suggestions.suggestions.length > 0 ||
                  suggestions.categories.length > 0 ||
                  recentSearches.length > 0) && (
                  <div className="search-suggestions">
                    {recentSearches.length > 0 && !searchQuery && (
                      <div className="suggestions-section">
                        <div className="suggestions-label">Recent Searches</div>
                        {recentSearches.map((search, idx) => (
                          <div
                            key={idx}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(search)}
                          >
                            <span className="suggestion-icon">🕐</span>
                            {search}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.categories.length > 0 && (
                      <div className="suggestions-section">
                        <div className="suggestions-label">Categories</div>
                        {suggestions.categories.map((cat) => (
                          <div
                            key={cat.slug}
                            className="suggestion-item"
                            onClick={() => {
                              handleFilterChange("category_id", cat.slug);
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="suggestion-icon">📁</span>
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {suggestions.suggestions.length > 0 && (
                      <div className="suggestions-section">
                        <div className="suggestions-label">Items</div>
                        {suggestions.suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <span className="suggestion-icon">🔍</span>
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>

          <div className="header-filters">
            <button
              className={`filter-toggle-btn ${
                showFilterDrawer ? "active" : ""
              }`}
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            >
              <span>⚙️ Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge">{activeFiltersCount}</span>
              )}
            </button>

            <div className="quick-filters">
              <select
                className="filter-select"
                value={filters.category_id}
                onChange={(e) =>
                  handleFilterChange("category_id", e.target.value)
                }
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filters.condition}
                onChange={(e) =>
                  handleFilterChange("condition", e.target.value)
                }
              >
                <option value="">Any Condition</option>
                <option value="brand_new">Brand New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="for_parts">For Parts</option>
              </select>

              <select
                className="filter-select"
                value={filters.sort_by}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Lowest Price</option>
                <option value="price_high">Highest Price</option>
                {userLocation && <option value="nearest">Nearest First</option>}
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {showFilterDrawer && (
        <div
          className="filter-drawer-overlay"
          onClick={() => setShowFilterDrawer(false)}
        >
          <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Advanced Filters</h3>
              <button
                className="drawer-close-btn"
                onClick={() => setShowFilterDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-content">
              <div className="filter-group">
                <label className="filter-label">Price Range</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) =>
                      handleFilterChange("min_price", e.target.value)
                    }
                  />
                  <span className="price-separator">—</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) =>
                      handleFilterChange("max_price", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Distance</label>
                <div className="distance-options">
                  {["1", "5", "10", "25", "50"].map((dist) => (
                    <button
                      key={dist}
                      className={`distance-btn ${
                        filters.distance === dist ? "active" : ""
                      }`}
                      onClick={() => handleFilterChange("distance", dist)}
                    >
                      {dist} mi
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Transaction Type</label>
                <div className="transaction-options">
                  <button
                    className={`transaction-btn ${
                      filters.transaction_type === "" ? "active" : ""
                    }`}
                    onClick={() => handleFilterChange("transaction_type", "")}
                  >
                    All
                  </button>
                  <button
                    className={`transaction-btn ${
                      filters.transaction_type === "cash" ? "active" : ""
                    }`}
                    onClick={() =>
                      handleFilterChange("transaction_type", "cash")
                    }
                  >
                    💵 Cash
                  </button>
                  <button
                    className={`transaction-btn ${
                      filters.transaction_type === "digital" ? "active" : ""
                    }`}
                    onClick={() =>
                      handleFilterChange("transaction_type", "digital")
                    }
                  >
                    💳 Digital
                  </button>
                  <button
                    className={`transaction-btn ${
                      filters.transaction_type === "trade" ? "active" : ""
                    }`}
                    onClick={() =>
                      handleFilterChange("transaction_type", "trade")
                    }
                  >
                    🔄 Trade
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Date Posted</label>
                <select
                  className="filter-select-full"
                  value={filters.date_posted}
                  onChange={(e) =>
                    handleFilterChange("date_posted", e.target.value)
                  }
                >
                  <option value="">All Time</option>
                  <option value="today">Last 24 Hours</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="drawer-btn btn-secondary"
                onClick={clearAllFilters}
              >
                Reset
              </button>
              <button
                className="drawer-btn btn-primary"
                onClick={() => setShowFilterDrawer(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="marketplace-container">
        <div className="results-header">
          <p className="results-count">
            {totalItems} {totalItems === 1 ? "item" : "items"} found
          </p>
        </div>

        {loading ? (
          <div className="items-grid">
            {[...Array(12)].map((_, idx) => (
              <div key={idx} className="item-card skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-price"></div>
                  <div className="skeleton-line skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No items found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button className="btn-primary" onClick={clearAllFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="items-grid">
              {items.map((item) => (
                <div key={item.id} className="item-card" onClick={() => navigate(`/item/${item.id}`)}>
                  <div className="item-image-container">
                    <img
                      src={`${API_URL}${
                        item.primary_photo_url ||
                        (item.photos && JSON.parse(item.photos)[0]?.url)
                      }`}
                      alt={item.title}
                      className="item-image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                    <button
                      className={`save-btn ${item.is_saved ? "saved" : ""}`}
                      onClick={(e) => handleSaveItem(item.id, e)}
                      title={item.is_saved ? "Unsave item" : "Save item"}
                    >
                      {item.is_saved ? "❤️" : "🤍"}
                    </button>
                    <div className="condition-badge">
                      {formatCondition(item.condition)}
                    </div>
                  </div>

                  <div className="item-content">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-price">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>

                    {item.distance && (
                      <p className="item-location">
                        📍 {item.distance} miles away
                      </p>
                    )}

                    <div className="item-stats">
                      <span>👁️ {item.view_count || 0}</span>
                      <span>💾 {item.save_count || 0}</span>
                    </div>

                    <div className="item-seller">
                      <div className="seller-avatar">
                        {item.seller_photo ? (
                          <img
                            src={`${API_URL}${item.seller_photo}`}
                            alt="Seller"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {item.seller_first_name?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div 
                        className="seller-info"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${item.seller_id}`);
                        }}
                      >
                        <span className="seller-name">
                          {item.seller_first_name} {item.seller_last_name?.[0]}.
                        </span>
                      </div>
                    </div>

                    <p className="item-time">
                      {formatTimeAgo(item.seconds_ago)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ← Previous
                </button>

                <div className="pagination-pages">
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`pagination-page ${
                            currentPage === page ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
