import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Messages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <h1>Messages</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchConversations}>Retry</button>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h2>No messages yet</h2>
          <p>When you message sellers or buyers message you, they'll appear here</p>
          <button onClick={() => navigate('/marketplace')} className="browse-btn">
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-item"
              onClick={() => navigate(`/messages/${conv.id}`)}
            >
              <div className="conv-avatar">
                {conv.other_user.profilePhoto ? (
                  <img src={`${API_URL}${conv.other_user.profilePhoto}`} alt={conv.other_user.fullName} />
                ) : (
                  <div className="avatar-placeholder">
                    {conv.other_user.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <div className="conv-content">
                <div className="conv-top">
                  <h3>{conv.other_user.fullName || `${conv.other_user.firstName} ${conv.other_user.lastName}`}</h3>
                  <span className="conv-time">
                    {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                  </span>
                </div>

                <div className="conv-item-preview">
                  <span className="item-title">{conv.item_title}</span>
                  <span className="item-separator">•</span>
                  <span className="item-price">${conv.item_price}</span>
                </div>

                {conv.last_message_preview && (
                  <div className="conv-preview">
                    <p className={conv.unread_count > 0 ? 'unread' : ''}>
                      {conv.last_message_preview}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
