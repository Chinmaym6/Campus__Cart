import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';
import LocationMessage from '../components/LocationMessage';
import './Chat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [hasMessages, setHasMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [liveLocationActive, setLiveLocationActive] = useState(false);
  const [liveLocationMessageIds, setLiveLocationMessageIds] = useState([]);

  const messageContainerRef = useRef(null);
  const inputRef = useRef(null);
  const attachMenuRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUserId(JSON.parse(userData).id);
    }
    loadConversation();
    loadMessages();
    checkHasMessages();
    loadTemplates();

    const interval = setInterval(loadMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conv = response.data.find(c => c.id === conversationId);
      setConversation(conv);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/messages/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading messages:', err);
      setLoading(false);
    }
  };

  const checkHasMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/messages/conversations/${conversationId}/has-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasMessages(response.data.hasMessages);
    } catch (err) {
      console.error('Error checking messages:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/messages/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const markAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/messages/conversations/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const sendMessage = async (content = newMessage, messageType = 'text', locationData = null) => {
    if (!content.trim() && !locationData || sending) return null;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        content: content.trim() || 'Shared location',
        messageType: messageType
      };

      if (locationData) {
        payload.locationData = JSON.stringify(locationData);
      }

      const response = await axios.post(
        `${API_URL}/api/messages/conversations/${conversationId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages([...messages, response.data]);
      setNewMessage('');
      setHasMessages(true);
      setShowTemplates(false);
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
      return null;
    } finally {
      setSending(false);
    }
  };

  const handleLocationSend = async (locationData) => {
    if (locationData.isLive) {
      // For live location updates
      const message = await sendMessage('📍 Location Update', 'location', locationData);
      if (message) {
        setLiveLocationActive(true);
        setLiveLocationMessageIds(prev => [...prev, message.id]);
      }
    } else {
      // For one-time location
      await sendMessage('📍 Location', 'location', locationData);
      setShowLocationPicker(false);
    }
  };

  const handleStopLiveSharing = () => {
    setLiveLocationActive(false);
    setShowLocationPicker(false);
  };

  const handleTemplateClick = (template) => {
    const text = template.template_text;
    if (text.includes('[amount]') || text.includes('[item]')) {
      setNewMessage(text);
      setShowTemplates(false);
      inputRef.current?.focus();
    } else {
      sendMessage(text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const groupMessagesByDate = () => {
    const grouped = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        grouped.push({ type: 'date', date: msg.created_at });
      }
      grouped.push({ type: 'message', data: msg });
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <p>Conversation not found</p>
          <button onClick={() => navigate('/messages')}>Back to Messages</button>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/messages')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="header-user" onClick={() => navigate(`/user/${conversation.other_user.id}`)}>
          <div className="user-avatar">
            {conversation.other_user.profilePhoto ? (
              <img src={`${API_URL}${conversation.other_user.profilePhoto}`} alt={conversation.other_user.fullName} />
            ) : (
              <div className="avatar-placeholder">
                {conversation.other_user.firstName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="user-info">
            <h3>{conversation.other_user.fullName || `${conversation.other_user.firstName} ${conversation.other_user.lastName}`}</h3>
          </div>
        </div>

        <button className="menu-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Item Preview Card */}
      {conversation.item_title && (
        <div className="item-preview-card" onClick={() => navigate(`/item/${conversation.item_id}`)}>
          {conversation.item_photo && (
            <img src={`${API_URL}${conversation.item_photo}`} alt={conversation.item_title} />
          )}
          <div className="item-info">
            <h4>{conversation.item_title}</h4>
            <p className="item-price">${conversation.item_price}</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Messages Area */}
      <div className="messages-area" ref={messageContainerRef}>
        {groupedMessages.map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${index}`} className="date-divider">
                <span>{formatDate(item.date)}</span>
              </div>
            );
          }

          const msg = item.data;
          const isOwn = msg.sender_id === currentUserId;

          return (
            <div key={msg.id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && (
                <div className="message-avatar">
                  {msg.sender.profilePhoto ? (
                    <img src={`${API_URL}${msg.sender.profilePhoto}`} alt={msg.sender.fullName} />
                  ) : (
                    <div className="avatar-placeholder-sm">
                      {msg.sender.firstName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              )}
              
              <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                {msg.message_type === 'location' && msg.location_data ? (
                  <LocationMessage 
                    location={typeof msg.location_data === 'string' ? JSON.parse(msg.location_data) : msg.location_data}
                    isOwn={isOwn}
                    onStopSharing={isOwn && liveLocationActive && liveLocationMessageIds.includes(msg.id) ? handleStopLiveSharing : null}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
                <div className="message-meta">
                  <span className="message-time">{formatTime(msg.created_at)}</span>
                  {isOwn && (
                    <span className="message-status">
                      {msg.read_at ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8L6 12L14 4" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 8L10 12" stroke="#0084ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8L6 12L14 4" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
          })}
          </div>

      {/* Quick Templates - Show only on first message */}
      {!hasMessages && (
        <div className="quick-templates">
          <div className="templates-scroll">
            {templates.map((template) => (
              <button
                key={template.id}
                className="template-chip"
                onClick={() => handleTemplateClick(template)}
              >
                {template.template_text.replace('[amount]', '___').replace('[item]', '___')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="input-area">
        <div className="attachment-container" ref={attachMenuRef}>
          <button 
            className="attachment-btn" 
            title="Attach"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {showAttachMenu && (
            <div className="attachment-menu">
              <button 
                className="attachment-option"
                onClick={() => {
                  setShowLocationPicker(true);
                  setShowAttachMenu(false);
                }}
              >
                <span className="attachment-icon">📍</span>
                <span>Location</span>
              </button>
              <button className="attachment-option" disabled>
                <span className="attachment-icon">📷</span>
                <span>Photo</span>
              </button>
              <button className="attachment-option" disabled>
                <span className="attachment-icon">📁</span>
                <span>File</span>
              </button>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="1"
            disabled={sending}
          />
        </div>

        <button 
          className="send-btn" 
          onClick={() => sendMessage()}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <div className="btn-spinner"></div>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onSend={handleLocationSend}
          onClose={() => {
            setShowLocationPicker(false);
            setLiveLocationActive(false);
          }}
        />
      )}
    </div>
  );
}
