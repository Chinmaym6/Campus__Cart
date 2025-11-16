import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Profile.css';
import './profile-tabs-styles.css';
import './profile-saved-items.css';

// PreviewContent Component - Completely Rebuilt with Modern UI
const PreviewContent = ({ listing }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!listing) return null;

  // Parse photos safely
  let photos = [];
  try {
    if (listing.photos) {
      photos = typeof listing.photos === 'string' ? JSON.parse(listing.photos) : listing.photos;
    }
  } catch (e) {
    photos = [];
  }

  const allPhotos = [];
  if (listing.primary_photo_url) allPhotos.push({ url: listing.primary_photo_url });
  if (Array.isArray(photos)) {
    photos.forEach(p => {
      if (p?.url && p.url !== listing.primary_photo_url) allPhotos.push(p);
    });
  }

  const formatCondition = (condition) => {
    if (!condition) return 'N/A';
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const parsePaymentMethods = (methods) => {
    try {
      if (Array.isArray(methods)) return methods.join(', ');
      if (typeof methods === 'string') {
        const parsed = JSON.parse(methods);
        return Array.isArray(parsed) ? parsed.join(', ') : methods;
      }
      return 'N/A';
    } catch {
      return methods || 'N/A';
    }
  };

  const parseAvailability = (availability) => {
    try {
      if (!availability) return null;
      const data = typeof availability === 'string' ? JSON.parse(availability) : availability;
      if (Array.isArray(data) && data.length > 0) return data.join(', ');
      if (typeof data === 'object') return JSON.stringify(data);
      return String(data);
    } catch {
      return availability ? String(availability) : null;
    }
  };

  const safeIndex = Math.min(currentPhotoIndex, Math.max(0, allPhotos.length - 1));
  const availabilityDisplay = parseAvailability(listing.availability);

  return (
    <>
      {/* Left Side: Fixed Photo Gallery */}
      <div className="preview-gallery">
        <div className="preview-main-photo">
          {allPhotos.length > 0 ? (
            <>
              <img 
                src={`http://localhost:5000${allPhotos[safeIndex]?.url}`} 
                alt={listing.title}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23667eea"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle" dy=".3em">No Image</text></svg>';
                }}
              />
              {allPhotos.length > 1 && (
                <>
                  <button 
                    className="gallery-nav nav-prev" 
                    onClick={() => setCurrentPhotoIndex(p => (p - 1 + allPhotos.length) % allPhotos.length)}
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button 
                    className="gallery-nav nav-next" 
                    onClick={() => setCurrentPhotoIndex(p => (p + 1) % allPhotos.length)}
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                  <div className="gallery-counter">{safeIndex + 1} / {allPhotos.length}</div>
                </>
              )}
            </>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', color: '#667eea'}}>
              📷
            </div>
          )}
        </div>
        
        {allPhotos.length > 1 && (
          <div className="preview-thumbnails">
            {allPhotos.map((photo, index) => (
              <img
                key={index}
                src={`http://localhost:5000${photo.url}`}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail ${index === safeIndex ? 'active' : ''}`}
                onClick={() => setCurrentPhotoIndex(index)}
                onError={(e) => e.target.style.display = 'none'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Side: Scrollable Details */}
      <div className="preview-info">
        <div className="preview-content-wrapper">
          {/* Header with Title and Price */}
          <div className="preview-header">
            <h2>{listing.title}</h2>
            <div className="preview-price-section">
              <span className="preview-price">${listing.price}</span>
              {listing.negotiable && <span className="badge-negotiable">💬 Negotiable</span>}
              {listing.firm && <span className="badge-firm">🔒 Firm</span>}
            </div>
          </div>

          {/* Item Details */}
          <div className="preview-section">
            <h4>📋 Item Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Condition</span>
                <span className="value">{formatCondition(listing.condition)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Category</span>
                <span className="value">{listing.category_name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Methods</span>
                <span className="value">{parsePaymentMethods(listing.payment_methods)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Delivery Options</span>
                <span className="value">
                  {listing.pickup_only && listing.willing_to_ship ? '🚗📦 Pickup & Shipping' 
                    : listing.pickup_only ? '🚗 Pickup Only' 
                    : listing.willing_to_ship ? '📦 Shipping Available' 
                    : 'Contact Seller'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="preview-section">
              <h4>📝 Description</h4>
              <p className="preview-description">{listing.description}</p>
            </div>
          )}

          {/* Trade Options */}
          {listing.open_to_trades && (
            <div className="preview-section">
              <h4>🔄 Trade Options</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Open to Trades</span>
                  <span className="value">✅ Yes</span>
                </div>
                {listing.trade_preference && (
                  <div className="detail-item">
                    <span className="label">Trade Preference</span>
                    <span className="value">{listing.trade_preference.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
              {listing.trade_description && (
                <p className="trade-desc">{listing.trade_description}</p>
              )}
            </div>
          )}

          {/* Location Information */}
          {(listing.location_text || listing.meetup_location_text) && (
            <div className="preview-section">
              <h4>📍 Location Details</h4>
              {listing.location_text && (
                <div className="location-box">
                  <strong>📌 Listing Location</strong>
                  <p>{listing.location_text}</p>
                  {listing.location_description && (
                    <p className="location-note">ℹ️ {listing.location_description}</p>
                  )}
                </div>
              )}
              {listing.meetup_location_text && (
                <div className="location-box">
                  <strong>🤝 Meetup Location</strong>
                  <p>{listing.meetup_location_text}</p>
                  {listing.meetup_description && (
                    <p className="location-note">ℹ️ {listing.meetup_description}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Availability & Special Instructions */}
          {(availabilityDisplay || listing.special_instructions) && (
            <div className="preview-section">
              <h4>ℹ️ Additional Information</h4>
              <div className="detail-grid">
                {availabilityDisplay && (
                  <div className="detail-item full-width">
                    <span className="label">📅 Availability</span>
                    <span className="value">{availabilityDisplay}</span>
                  </div>
                )}
                {listing.special_instructions && (
                  <div className="detail-item full-width">
                    <span className="label">📝 Special Instructions</span>
                    <p className="instructions">{listing.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="preview-section">
            <h4>📊 Engagement Stats</h4>
            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-number">{listing.view_count || 0}</span>
                <span className="stat-label">👁️ Views</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{listing.save_count || 0}</span>
                <span className="stat-label">💾 Saves</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{listing.share_count || 0}</span>
                <span className="stat-label">🔗 Shares</span>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="preview-meta">
            <span>🗓️ Created: {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}</span>
            <span>🔄 Updated: {listing.updated_at ? new Date(listing.updated_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

// ListingCard Component with Photo Carousel
const ListingCard = ({ listing, isDraft, onClick }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Safely parse photos with error handling
  let photos = [];
  try {
    if (listing?.photos) {
      if (typeof listing.photos === 'string') {
        photos = JSON.parse(listing.photos);
      } else if (Array.isArray(listing.photos)) {
        photos = listing.photos;
      }
    }
  } catch (e) {
    console.warn('Failed to parse photos:', e);
    photos = [];
  }

  // Build photo array safely
  const allPhotos = [];
  if (listing?.primary_photo_url) {
    allPhotos.push({ url: listing.primary_photo_url });
  }
  if (Array.isArray(photos)) {
    photos.forEach(p => {
      if (p && p.url && p.url !== listing?.primary_photo_url) {
        allPhotos.push(p);
      }
    });
  }

  const nextPhoto = (e) => {
    e.stopPropagation();
    if (allPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
    }
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    if (allPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    }
  };

  const formatCondition = (condition) => {
    if (!condition) return 'N/A';
    return condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Safety check for listing object
  if (!listing) {
    return null;
  }

  // Ensure currentPhotoIndex is valid
  const safePhotoIndex = allPhotos.length > 0 
    ? Math.min(currentPhotoIndex, allPhotos.length - 1) 
    : 0;

  return (
    <div className={`listing-card ${isDraft ? 'draft-card' : 'active-card'}`} onClick={onClick}>
      {/* Photo Carousel */}
      <div className="listing-photo-container">
        {allPhotos.length > 0 ? (
          <>
            <img 
              src={`http://localhost:5000${allPhotos[safePhotoIndex]?.url || ''}`} 
              alt={listing.title || 'Listing'}
              className="listing-photo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="no-photo"><span>📷</span><p>Image not found</p></div>';
              }}
            />
            {allPhotos.length > 1 && (
              <>
                <button className="photo-nav photo-prev" onClick={prevPhoto}>
                  ‹
                </button>
                <button className="photo-nav photo-next" onClick={nextPhoto}>
                  ›
                </button>
                <div className="photo-dots">
                  {allPhotos.map((_, index) => (
                    <span 
                      key={index} 
                      className={`dot ${index === safePhotoIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index < allPhotos.length) {
                          setCurrentPhotoIndex(index);
                        }
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="no-photo">
            <span>📷</span>
            <p>No photos</p>
          </div>
        )}
        {isDraft && <div className="draft-badge">DRAFT</div>}
      </div>

      {/* Listing Details */}
      <div className="listing-details">
        <h4 className="listing-title">{listing.title || 'Untitled Listing'}</h4>
        <div className="listing-price">
          <span className="price-amount">${listing.price || '0.00'}</span>
          {listing.negotiable && <span className="price-badge negotiable">Negotiable</span>}
          {listing.firm && <span className="price-badge firm">Firm</span>}
        </div>
        
        <div className="listing-info">
          <div className="info-row">
            <span className="info-label">Condition:</span>
            <span className="info-value">{formatCondition(listing.condition)}</span>
          </div>
          {listing.category_name && (
            <div className="info-row">
              <span className="info-label">Category:</span>
              <span className="info-value">{listing.category_name}</span>
            </div>
          )}
          {listing.location_text && (
            <div className="info-row">
              <span className="info-label">📍 Location:</span>
              <span className="info-value">
                {listing.location_text.substring(0, 30)}
                {listing.location_text.length > 30 ? '...' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="listing-stats">
          <span className="stat-item">👁 {listing.view_count || 0} views</span>
          <span className="stat-item">💾 {listing.save_count || 0} saves</span>
        </div>

        <div className="listing-footer">
          <span className="listing-date">
            {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}
          </span>
          <span className={`listing-status ${isDraft ? 'status-draft' : 'status-active'}`}>
            {isDraft ? '📝 Draft' : '✅ Active'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
const [selectedActive, setSelectedActive] = useState(null);
const [showActiveModal, setShowActiveModal] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'listings');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchListings();
    fetchSavedItems();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

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

  const fetchSavedItems = async () => {
    try {
      const response = await axiosInstance.get('/items/saved');
      setSavedItems(response.data.items);
    } catch (err) {
      console.error('Failed to load saved items:', err);
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

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile data...</div>
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
        <button className="edit-profile-btn" onClick={() => navigate('/edit-profile')}>
          <span>✏️</span> Edit Profile
        </button>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          📦 My Listings ({listings.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          ❤️ Saved Items ({savedItems.length})
        </button>
      </div>

      {activeTab === 'listings' && (
        <div className="profile-listings">
          <h2>My Listings</h2>
          {listings.length === 0 ? (
            <p>You have no listings yet. <button onClick={() => navigate('/create-listing')}>Create your first listing</button></p>
          ) : (
            <>
            {listings.filter(l => l.status === 'draft').length > 0 && (
              <div className="listings-section">
                <div className="section-header">
                  <h3>📝 Drafts ({listings.filter(l => l.status === 'draft').length})</h3>
                  {listings.filter(l => l.status === 'draft').length > 4 && (
                    <button className="view-all-btn" onClick={() => navigate('/all-drafts')}>
                      View All Drafts →
                    </button>
                  )}
                </div>
                <div className="listings-grid">
                  {listings.filter(l => l.status === 'draft').slice(0, 4).map(listing => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing} 
                      isDraft={true}
                      onClick={() => handleDraftClick(listing)}
                    />
                  ))}
                </div>
              </div>
            )}
            {listings.filter(l => l.status === 'available').length > 0 && (
              <div className="listings-section">
                <div className="section-header">
                  <h3>✅ Active Listings ({listings.filter(l => l.status === 'available').length})</h3>
                  {listings.filter(l => l.status === 'available').length > 4 && (
                    <button className="view-all-btn" onClick={() => navigate('/all-listings')}>
                      View All Listings →
                    </button>
                  )}
                </div>
                <div className="listings-grid">
                  {listings.filter(l => l.status === 'available').slice(0, 4).map(listing => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing} 
                      isDraft={false}
                      onClick={() => handleActiveClick(listing)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="profile-listings saved-items-section">
          <div className="section-header-main">
            <h2 className="saved-title">
              <span className="saved-icon">❤️</span>
              Saved Items
              <span className="saved-count">{savedItems.length}</span>
            </h2>
            {savedItems.length > 0 && (
              <button className="browse-more-btn" onClick={() => navigate('/browse')}>
                <span>🛍️</span> Browse More
              </button>
            )}
          </div>
          
          {savedItems.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-icon">💔</div>
              <h3>No Saved Items Yet</h3>
              <p>Start exploring and save items you love!</p>
              <button className="cta-button" onClick={() => navigate('/browse')}>
                <span>🔍</span> Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="saved-items-grid">
              {savedItems.map(item => (
                <div key={item.id} className="saved-item-card" onClick={() => navigate(`/item/${item.id}`)}>
                  <div className="saved-item-image-container">
                    <img
                      src={`http://localhost:5000${item.primary_photo_url || (item.photos && JSON.parse(item.photos)[0]?.url) || ''}`}
                      alt={item.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    <div className="saved-overlay">
                      <div className="saved-badge">
                        <span className="heart-icon">❤️</span>
                        Saved
                      </div>
                    </div>
                    <div className="condition-tag-saved">
                      {item.condition?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                  
                  <div className="saved-item-content">
                    <h3 className="saved-item-title">{item.title}</h3>
                    <div className="saved-item-price-row">
                      <span className="saved-item-price">₹{parseFloat(item.price).toFixed(2)}</span>
                      {item.negotiable && <span className="negotiable-tag">💬 Negotiable</span>}
                    </div>
                    
                    <div className="saved-item-meta">
                      <div className="saved-stats">
                        <span className="stat-badge">
                          <span className="stat-icon">👁️</span>
                          {item.view_count || 0}
                        </span>
                        <span className="stat-badge">
                          <span className="stat-icon">💾</span>
                          {item.save_count || 0}
                        </span>
                      </div>
                      
                      <div className="saved-seller-info" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${item.seller_id}`);
                      }}>
                        <div className="seller-avatar-small">
                          {item.seller_photo ? (
                            <img src={`http://localhost:5000${item.seller_photo}`} alt="Seller" />
                          ) : (
                            <span>{item.seller_first_name?.[0] || '?'}</span>
                          )}
                        </div>
                        <span className="seller-name-small">
                          {item.seller_first_name} {item.seller_last_name?.[0]}.
                        </span>
                      </div>
                    </div>
                    
                    <div className="saved-date-info">
                      <span className="date-icon">🕒</span>
                      Saved {new Date(item.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Stats Section */}
      <div className="activity-stats-section">
        <h2 className="section-title">📊 Activity Overview</h2>
        
        <div className="stats-grid">
          {/* Level & Points Card */}
          <div className="stat-card-modern featured">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Level {profile.level}</h3>
              <p className="stat-value">{profile.total_points} Points</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${Math.min((profile.total_points % 100), 100)}%`}}></div>
              </div>
            </div>
          </div>

          {/* Trading Stats */}
          <div className="stat-card-modern">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Trading Activity</h3>
              <div className="stat-row">
                <span className="stat-label">Sales:</span>
                <span className="stat-number">{profile.total_sales || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Purchases:</span>
                <span className="stat-number">{profile.total_purchases || 0}</span>
              </div>
              <div className="stat-highlight">
                ₹{profile.total_revenue ? parseFloat(profile.total_revenue).toFixed(2) : '0.00'} Revenue
              </div>
            </div>
          </div>

          {/* Rating & Reviews */}
          <div className="stat-card-modern">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Reputation</h3>
              <div className="rating-display">
                <span className="rating-stars">
                  {'★'.repeat(Math.round(profile.avg_rating || 0))}
                  {'☆'.repeat(5 - Math.round(profile.avg_rating || 0))}
                </span>
                <span className="rating-value">{profile.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : '0.0'}</span>
              </div>
              <p className="stat-subtext">{profile.total_reviews_received || 0} reviews</p>
            </div>
          </div>

          {/* Response & Reliability */}
          <div className="stat-card-modern">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>Reliability</h3>
              <div className="stat-row">
                <span className="stat-label">Response Time:</span>
                <span className="stat-number">{profile.avg_response_time ? `${profile.avg_response_time}m` : 'N/A'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Meetups:</span>
                <span className="stat-number">{profile.total_meetups_completed || 0}</span>
              </div>
              <div className="reliability-score">
                {((profile.meetup_reliability_score || 1) * 100).toFixed(0)}% Reliable
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Section - Compact */}
      <div className="profile-info-compact">
        <h2 className="section-title">📋 Quick Info</h2>
        
        <div className="quick-info-grid">
          {/* Bio Snippet */}
          {profile.bio && (
            <div className="quick-card bio-snippet">
              <span className="quick-icon">💬</span>
              <div className="quick-content">
                <h4>About</h4>
                <p>{profile.bio.length > 100 ? profile.bio.substring(0, 100) + '...' : profile.bio}</p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="quick-card">
            <span className="quick-icon">📧</span>
            <div className="quick-content">
              <h4>Email</h4>
              <p>{profile.email}</p>
            </div>
          </div>

          {profile.phone_number && (
            <div className="quick-card">
              <span className="quick-icon">📱</span>
              <div className="quick-content">
                <h4>Phone</h4>
                <p>{profile.phone_number}</p>
              </div>
            </div>
          )}

          {profile.location_text && (
            <div className="quick-card">
              <span className="quick-icon">📍</span>
              <div className="quick-content">
                <h4>Location</h4>
                <p>{profile.location_text.split(',').slice(0, 2).join(', ')}</p>
              </div>
            </div>
          )}

          <div className="quick-card">
            <span className="quick-icon">🕐</span>
            <div className="quick-content">
              <h4>Last Active</h4>
              <p>{profile.last_active_at ? new Date(profile.last_active_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Options Modal */}
      {showDraftModal && selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal-content options-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDraftModal(false)}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon draft-icon">📝</div>
              <h3>Draft Options</h3>
              <p className="modal-subtitle">{selectedDraft.title}</p>
            </div>

            <div className="options-grid">
              <button className="option-card preview-option" onClick={handlePreview}>
                <div className="option-icon">👁️</div>
                <div className="option-text">
                  <h4>Preview</h4>
                  <p>View full listing details</p>
                </div>
              </button>

              <button className="option-card edit-option" onClick={handleEdit}>
                <div className="option-icon">✏️</div>
                <div className="option-text">
                  <h4>Edit</h4>
                  <p>Modify listing details</p>
                </div>
              </button>

              <button className="option-card publish-option" onClick={handlePublish}>
                <div className="option-icon">🚀</div>
                <div className="option-text">
                  <h4>Publish Now</h4>
                  <p>Make listing public</p>
                </div>
              </button>

              <button className="option-card delete-option" onClick={handleDeleteDraft}>
                <div className="option-icon">🗑️</div>
                <div className="option-text">
                  <h4>Delete</h4>
                  <p>Remove this draft</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Drafts */}
      {showPreview && selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
            
            <div className="preview-full">
              <PreviewContent listing={selectedDraft} />
            </div>

            <div className="preview-actions">
              <button className="action-btn btn-close" onClick={() => setShowPreview(false)}>
                <span>✕</span> Close
              </button>
              <button className="action-btn btn-edit" onClick={handleEdit}>
                <span>✏️</span> Edit
              </button>
              <button className="action-btn btn-publish" onClick={handlePublish}>
                <span>🚀</span> Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Listing Options Modal */}
      {showActiveModal && selectedActive && (
        <div className="modal-overlay" onClick={() => setShowActiveModal(false)}>
          <div className="modal-content options-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowActiveModal(false)}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon active-icon">✅</div>
              <h3>Listing Options</h3>
              <p className="modal-subtitle">{selectedActive.title}</p>
            </div>

            <div className="options-grid">
              <button className="option-card preview-option" onClick={handlePreviewActive}>
                <div className="option-icon">👁️</div>
                <div className="option-text">
                  <h4>Preview</h4>
                  <p>View full listing details</p>
                </div>
              </button>

              <button className="option-card edit-option" onClick={handleEditActive}>
                <div className="option-icon">✏️</div>
                <div className="option-text">
                  <h4>Edit</h4>
                  <p>Modify listing details</p>
                </div>
              </button>

              <button className="option-card delete-option" onClick={handleDeleteActive}>
                <div className="option-icon">🗑️</div>
                <div className="option-text">
                  <h4>Delete</h4>
                  <p>Remove this listing</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Active Listings */}
      {showPreview && selectedActive && !selectedDraft && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
            
            <div className="preview-full">
              <PreviewContent listing={selectedActive} />
            </div>

            <div className="preview-actions">
              <button className="action-btn btn-close" onClick={() => setShowPreview(false)}>
                <span>✕</span> Close
              </button>
              <button className="action-btn btn-edit" onClick={handleEditActive}>
                <span>✏️</span> Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}