import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  useEffect(() => {
    if (user && !user.profile_completed && !localStorage.getItem('profile_reminded')) {
      setShowProfileModal(true);
    }
  }, [user]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <div className="welcome-section">
          <h1>Welcome to Campus Cart! 🎓</h1>
          <p>Your account is set up and ready to go.</p>
        </div>

        {user && (
          <div className="user-info">
            <h2>Account Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="info-item">
                <label>User ID</label>
                <p>{user.id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="features-section">
          <h2>Coming Soon</h2>
          <p>We're building these features to enhance your trading experience:</p>
          <ul className="feature-list">
            <li>🛒 Browse marketplace listings</li>
            <li>📝 Create and manage your listings</li>
            <li>💬 Message other traders</li>
            <li>⭐ View reviews and ratings</li>
            <li>📍 Find items near you on campus</li>
            <li>❤️ Save your favorite items</li>
          </ul>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" disabled>
              <span className="action-icon">📚</span>
              <span>Browse Items</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/create-listing')}>
              <span className="action-icon">➕</span>
              <span>Create Listing</span>
            </button>
            <button className="action-btn" disabled>
              <span className="action-icon">👥</span>
              <span>My Trades</span>
            </button>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <div className="modal-overlay">
          <div className="profile-modal">
            <h2>Complete Your Profile</h2>
            <p>Enhance your experience by adding more details to your profile.</p>
            <div className="modal-actions">
              <button onClick={() => {
                localStorage.setItem('profile_reminded', 'true');
                setShowProfileModal(false);
              }} className="btn-secondary">
                Remind me later
              </button>
              <button onClick={() => navigate('/profile-setup')} className="btn-primary">
                Do it now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
