import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
const [selectedActive, setSelectedActive] = useState(null);
const [showActiveModal, setShowActiveModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchListings();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      if (response.data.success) {
        setProfile(response.data.user);
      }
    } catch (err) {
      setError('Failed to load profile');
      if (err.response?.status === 401) {
        navigate('/auth', { state: { mode: 'login' } });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const response = await axiosInstance.get('/items/my-listings');
      setListings(response.data);
    } catch (err) {
      console.error('Failed to load listings:', err);
    }
  };

  const handleDraftClick = (listing) => {
    setSelectedDraft(listing);
    setShowDraftModal(true);
  };

  const handlePreview = () => {
    setShowDraftModal(false);
    setShowPreview(true);
  };

  const handleEdit = () => {
    setShowDraftModal(false);
    localStorage.setItem('editListing', JSON.stringify(selectedDraft));
    navigate('/create-listing', { state: { editListing: selectedDraft } });
  };

  const handlePublish = async () => {
    try {
      await axiosInstance.put(`/items/${selectedDraft.id}`, { status: 'available' });
      setShowDraftModal(false);
      fetchListings();
    } catch (err) {
      console.error('Failed to publish listing:', err);
      alert('Failed to publish listing');
    }
  };

  const handleDeleteDraft = async () => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await axiosInstance.delete(`/items/${selectedDraft.id}`);
        setShowDraftModal(false);
        fetchListings();
      } catch (err) {
        console.error('Failed to delete draft:', err);
        alert('Failed to delete draft');
      }
    }
  };

  const handleActiveClick = (listing) => {
    setSelectedActive(listing);
    setShowActiveModal(true);
  };

  const handleEditActive = () => {
    setShowActiveModal(false);
    localStorage.setItem('editListing', JSON.stringify(selectedActive));
    navigate('/create-listing', { state: { editListing: selectedActive } });
  };

  const handleDeleteActive = async () => {
    if (window.confirm('Are you sure you want to delete this active listing?')) {
      try {
        await axiosInstance.delete(`/items/${selectedActive.id}`);
        setShowActiveModal(false);
        fetchListings();
      } catch (err) {
        console.error('Failed to delete listing:', err);
        alert('Failed to delete listing');
      }
    }
  };

  const handlePreviewActive = () => {
    setShowActiveModal(false);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profile_photo_url ? (
            <img src={`http://localhost:5000${profile.profile_photo_url}`} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.first_name} {profile.last_name}</h1>
          <p className="university">{profile.university}</p>
          <p className="major">{profile.major}</p>
          <p className="major">Graduation Year: {profile.graduation_year}</p>
          <div className="badges">
            {profile.email_verified && <span className="badge verified">Email Verified</span>}
            {profile.phone_verified && <span className="badge verified">Phone Verified</span>}
          </div>
        </div>
      </div>

      <div className="profile-listings">
        <h2>My Listings</h2>
        {listings.length === 0 ? (
          <p>You have no listings yet. <button onClick={() => navigate('/create-listing')}>Create your first listing</button></p>
        ) : (
          <>
            {listings.filter(l => l.status === 'draft').length > 0 && (
              <div className="listings-section">
                <h3>Drafts</h3>
                <div className="listings-grid">
                  {listings.filter(l => l.status === 'draft').map(listing => (
                    <div key={listing.id} className="listing-card draft-card" onClick={() => handleDraftClick(listing)}>
                      {listing.primary_photo_url && (
                        <img src={`http://localhost:5000${listing.primary_photo_url}`} alt={listing.title} />
                      )}
                      <h4>{listing.title}</h4>
                      <p>${listing.price}</p>
                      <p>Status: Draft</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {listings.filter(l => l.status === 'available').length > 0 && (
              <div className="listings-section">
                <h3>Active Listings</h3>
                <div className="listings-grid">
                  {listings.filter(l => l.status === 'available').map(listing => (
                    <div key={listing.id} className="listing-card active-card" onClick={() => handleActiveClick(listing)}>
                      {listing.primary_photo_url && (
                        <img src={`http://localhost:5000${listing.primary_photo_url}`} alt={listing.title} />
                      )}
                      <h4>{listing.title}</h4>
                      <p>${listing.price}</p>
                      <p>Status: Active</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>Level</h3>
          <p className="stat-value">{profile.level}</p>
        </div>
        <div className="stat-card">
          <h3>Total Points</h3>
          <p className="stat-value">{profile.total_points}</p>
        </div>
        <div className="stat-card">
          <h3>Total Sales</h3>
          <p className="stat-value">${profile.total_sales}</p>
        </div>
        <div className="stat-card">
          <h3>Total Purchases</h3>
          <p className="stat-value">${profile.total_purchases}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${profile.total_revenue ? parseFloat(profile.total_revenue).toFixed(2) : '0.00'}</p>
        </div>
        <div className="stat-card">
          <h3>Average Rating</h3>
          <p className="stat-value">{profile.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>Reviews Received</h3>
          <p className="stat-value">{profile.total_reviews_received}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <p className="stat-value">{profile.avg_response_time ? `${profile.avg_response_time}min` : 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>Meetups Completed</h3>
          <p className="stat-value">{profile.total_meetups_completed}</p>
        </div>
        <div className="stat-card">
          <h3>Meetup Reliability</h3>
          <p className="stat-value">{profile.meetup_reliability_score ? parseFloat(profile.meetup_reliability_score).toFixed(2) : 'N/A'}</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-section">
          <h2>Additional Information</h2>
          <div className="detail-item">
            <strong>Bio:</strong> {profile.bio || 'No bio provided'}
          </div>
          <div className="detail-item">
            <strong>Location:</strong> {profile.location_text || 'Not specified'}
          </div>
          <div className="detail-item">
            <strong>Last Active:</strong> {profile.last_active_at ? new Date(profile.last_active_at).toLocaleDateString() : 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {profile.phone_number || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {profile.email}
          </div>
        </div>
      </div>

      {/* Draft Options Modal */}
      {showDraftModal && selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal-content draft-modal" onClick={(e) => e.stopPropagation()}>
            <h3>What would you like to do with this draft?</h3>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handlePreview}>Preview</button>
              <button className="btn-primary" onClick={handleEdit}>Edit</button>
              <button className="btn-success" onClick={handlePublish}>Publish Now</button>
              <button className="btn-danger" onClick={handleDeleteDraft}>Delete</button>
            </div>
            <button className="modal-close" onClick={() => setShowDraftModal(false)}>×</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Preview: {selectedDraft.title}</h3>
            <div className="preview-content">
              {selectedDraft.primary_photo_url && (
                <img src={`http://localhost:5000${selectedDraft.primary_photo_url}`} alt={selectedDraft.title} className="preview-image" />
              )}
              <div className="preview-details">
                <p><strong>Price:</strong> ${selectedDraft.price}</p>
                <p><strong>Condition:</strong> {selectedDraft.condition}</p>
                <p><strong>Description:</strong> {selectedDraft.description}</p>
                {selectedDraft.location_text && <p><strong>Location:</strong> {selectedDraft.location_text}</p>}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
              <button className="btn-primary" onClick={handleEdit}>Edit</button>
              <button className="btn-success" onClick={handlePublish}>Publish Now</button>
            </div>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
          </div>
        </div>
      )}

      {/* Active Listing Options Modal */}
      {showActiveModal && selectedActive && (
        <div className="modal-overlay" onClick={() => setShowActiveModal(false)}>
          <div className="modal-content draft-modal" onClick={(e) => e.stopPropagation()}>
            <h3>What would you like to do with this listing?</h3>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handlePreviewActive}>Preview</button>
              <button className="btn-primary" onClick={handleEditActive}>Edit</button>
              <button className="btn-danger" onClick={handleDeleteActive}>Delete</button>
            </div>
            <button className="modal-close" onClick={() => setShowActiveModal(false)}>×</button>
          </div>
        </div>
      )}

      {/* Preview Modal for Active Listings */}
      {showPreview && selectedActive && !selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Preview: {selectedActive.title}</h3>
            <div className="preview-content">
              {selectedActive.primary_photo_url && (
                <img src={`http://localhost:5000${selectedActive.primary_photo_url}`} alt={selectedActive.title} className="preview-image" />
              )}
              <div className="preview-details">
                <p><strong>Price:</strong> ${selectedActive.price}</p>
                <p><strong>Condition:</strong> {selectedActive.condition}</p>
                <p><strong>Description:</strong> {selectedActive.description}</p>
                {selectedActive.location_text && <p><strong>Location:</strong> {selectedActive.location_text}</p>}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
              <button className="btn-primary" onClick={handleEditActive}>Edit</button>
            </div>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}