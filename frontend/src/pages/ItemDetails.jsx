import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../config/axios";
import "./ItemDetails.css";

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/items/${id}`);
      setItem(response.data);
      setIsSaved(response.data.is_saved || false);
      
      // Increment view count (no auth required)
      try {
        await axiosInstance.post(`/items/${id}/view`);
      } catch (e) {
        console.log("View count increment skipped");
      }
    } catch (err) {
      setError("Failed to load item details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth", { state: { mode: "login" } });
      return;
    }

    try {
      const response = await axiosInstance.post(`/items/${id}/save`);
      setIsSaved(response.data.saved);
    } catch (err) {
      console.error("Failed to save item:", err);
      if (err.response?.status === 401) {
        navigate("/auth", { state: { mode: "login" } });
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this ${item.title} for $${item.price}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleMessage = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth', { state: { mode: 'login' } });
      return;
    }

    try {
      // Create or get conversation
      const response = await axiosInstance.post('/messages/conversations', {
        itemId: item.id
      });
      
      // Navigate to chat
      navigate(`/messages/${response.data.id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      if (err.response?.status === 401) {
        navigate('/auth', { state: { mode: 'login' } });
      } else if (err.response?.status === 400 && err.response?.data?.error === 'Cannot message yourself') {
        alert('You cannot message yourself!');
      } else {
        alert('Failed to start conversation');
      }
    }
  };

  if (loading) {
    return (
      <div className="item-details-container">
        <div className="loading-state">Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-details-container">
        <div className="error-state">{error || "Item not found"}</div>
      </div>
    );
  }

  // Parse photos
  let photos = [];
  try {
    if (item.photos) {
      photos =
        typeof item.photos === "string" ? JSON.parse(item.photos) : item.photos;
    }
  } catch (e) {
    photos = [];
  }

  const allPhotos = [];
  if (item.primary_photo_url) allPhotos.push({ url: item.primary_photo_url });
  if (Array.isArray(photos)) {
    photos.forEach((p) => {
      if (p?.url && p.url !== item.primary_photo_url) allPhotos.push(p);
    });
  }

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

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="item-details-container">
      {/* Header */}
      <div className="item-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleShare}>
            ➤
          </button>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="photo-gallery">
        {allPhotos.length > 0 ? (
          <>
            <div className="main-photo" onClick={() => setShowFullscreen(true)}>
              <img
                src={`${API_URL}${allPhotos[currentPhotoIndex]?.url}`}
                alt={item.title}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/800x600?text=No+Image";
                }}
              />
              {allPhotos.length > 1 && (
                <>
                  <div className="photo-counter">
                    {currentPhotoIndex + 1} of {allPhotos.length}
                  </div>
                  <button
                    className="photo-nav-btn prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) =>
                        prev === 0 ? allPhotos.length - 1 : prev - 1
                      );
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="photo-nav-btn next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) =>
                        prev === allPhotos.length - 1 ? 0 : prev + 1
                      );
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {allPhotos.length > 1 && (
              <div className="photo-thumbnails">
                {allPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${
                      index === currentPhotoIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentPhotoIndex(index)}
                  >
                    <img
                      src={`${API_URL}${photo.url}`}
                      alt={`Thumbnail ${index + 1}`}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/100x100?text=No+Image";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-photos">📷 No photos available</div>
        )}
      </div>

      {/* Item Info */}
      <div className="item-info-section">
        <div className="item-title-row">
          <h1 className="item-title">{item.title}</h1>
          <button
            className={`save-btn ${isSaved ? "saved" : ""}`}
            onClick={handleSave}
          >
            {isSaved ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="item-price-row">
          <span className="item-price">
            ${parseFloat(item.price).toFixed(2)}
          </span>
          {item.negotiable && (
            <span className="negotiable-badge">💬 Negotiable</span>
          )}
          {item.firm && <span className="firm-badge">🔒 Firm</span>}
        </div>

        <div className="item-meta">
          <span className="condition-tag">
            {formatCondition(item.condition)}
          </span>
          <span className="posted-time">
            Posted {formatTimeAgo(item.created_at)}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="section">
        <h3 className="section-title">Description</h3>
        <p className="item-description">{item.description}</p>
      </div>

      {/* Location */}
      {item.location_text && (
        <div className="section">
          <h3 className="section-title">📍 Location</h3>
          <p className="location-text">{item.location_text}</p>
          {item.location_description && (
            <p className="location-note">{item.location_description}</p>
          )}
        </div>
      )}

      {/* Social Proof */}
      <div className="section social-proof">
        <div className="proof-item">
          <span className="proof-icon">👀</span>
          <span>{item.view_count || 0} people viewed</span>
        </div>
        <div className="proof-item">
          <span className="proof-icon">💾</span>
          <span>{item.save_count || 0} people saved this</span>
        </div>
      </div>

      {/* Seller Profile */}
      <div className="section seller-section">
        <h3 className="section-title">Seller Profile</h3>
        <div
          className="seller-card"
          onClick={() => navigate(`/user/${item.seller_id}`)}
        >
          <div className="seller-header">
            <div className="seller-avatar">
              {item.seller_photo ? (
                <img src={`${API_URL}${item.seller_photo}`} alt="Seller" />
              ) : (
                <div className="avatar-placeholder">
                  {item.seller_first_name?.[0] || "?"}
                </div>
              )}
            </div>
            <div className="seller-info">
              <h4 className="seller-name">
                {item.seller_first_name} {item.seller_last_name?.[0]}.
              </h4>
              {item.seller_rating && (
                <div className="seller-rating">
                  ⭐ {parseFloat(item.seller_rating).toFixed(1)} ({item.seller_reviews || 0}{" "}
                  reviews)
                </div>
              )}
              {item.seller_level && (
                <div className="seller-level">Level {item.seller_level}</div>
              )}
            </div>
          </div>
          <button className="view-profile-btn">View Full Profile →</button>
        </div>
      </div>

      {/* Action Bar - Sticky Footer */}
      <div className="action-bar">
        <button className="btn-primary" onClick={handleMessage}>
          💬 Message Seller
        </button>
        <button className="btn-outline" onClick={handleSave}>
          {isSaved ? "❤️ Saved" : "💾 Save"}
        </button>
        <button className="btn-icon" onClick={handleShare}>
          ➤
        </button>
      </div>

      {/* Fullscreen Photo Modal */}
      {showFullscreen && (
        <div
          className="fullscreen-modal"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="fullscreen-content">
            <button
              className="close-fullscreen"
              onClick={() => setShowFullscreen(false)}
            >
              ✕
            </button>
            <img
              src={`${API_URL}${allPhotos[currentPhotoIndex]?.url}`}
              alt={item.title}
            />
            {allPhotos.length > 1 && (
              <div className="fullscreen-nav">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) =>
                      prev === 0 ? allPhotos.length - 1 : prev - 1
                    );
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) =>
                      prev === allPhotos.length - 1 ? 0 : prev + 1
                    );
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
