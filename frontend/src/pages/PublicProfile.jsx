import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../config/axios";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/auth/user/${userId}`);
      setProfile(response.data.user);
      setListings(response.data.listings || []);
    } catch (err) {
      setError("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-container">
        <div className="error">{error || "Profile not found"}</div>
      </div>
    );
  }

  return (
    <div className="public-profile-container">
      
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
     

      <div className="profile-card">
        <div className="profile-content">
          <div className="profile-avatar">
            {profile.profile_photo_url ? (
              <img
                src={`http://localhost:5000${profile.profile_photo_url}`}
                alt="Profile"
              />
            ) : (
              <div className="avatar-placeholder">
                {profile.first_name?.[0]}
                {profile.last_name?.[0]}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="university">{profile.university}</p>
            <p className="major">{profile.major}</p>
            {profile.graduation_year && (
              <p className="grad-year">Graduation Year: {profile.graduation_year}</p>
            )}

            <div className="badges">
              {profile.email_verified && (
                <span className="badge verified">✓ Email Verified</span>
              )}
              {profile.phone_verified && (
                <span className="badge verified">✓ Phone Verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <h2 className="section-title">📊 Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Level {profile.level}</h3>
              <p className="stat-value">{profile.total_points} Points</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Rating</h3>
              <div className="rating-display">
                <span className="rating-value">
                  {profile.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : "N/A"}
                </span>
                <span className="rating-count">
                  ({profile.total_reviews_received || 0} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Sales</h3>
              <p className="stat-value">{profile.total_sales || 0} completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>Response Time</h3>
              <p className="stat-value">
                {profile.avg_response_time ? `${profile.avg_response_time}m` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bio-section">
          <h2 className="section-title">About</h2>
          <p className="bio-text">{profile.bio}</p>
        </div>
      )}

      {/* Active Listings */}
      {listings.length > 0 && (
        <div className="listings-section">
          <h2 className="section-title">Active Listings ({listings.length})</h2>
          <div className="listings-grid">
            {listings.slice(0, 6).map((listing) => (
              <div
                key={listing.id}
                className="listing-card"
                onClick={() => navigate(`/item/${listing.id}`)}
              >
                <div className="listing-image">
                  {listing.primary_photo_url ? (
                    <img
                      src={`http://localhost:5000${listing.primary_photo_url}`}
                      alt={listing.title}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                </div>
                <div className="listing-content">
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-price">${listing.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Button */}
      <div className="action-section">
        <button
          className="btn-message"
          onClick={() => navigate(`/messages?user=${userId}`)}
        >
          💬 Message {profile.first_name}
        </button>
      </div>
    </div>
  );
}
