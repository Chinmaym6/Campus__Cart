import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './AllListings.css';

// PreviewContent Component - EXACTLY from Profile.jsx
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

  const safeIndex = Math.min(currentPhotoIndex, Math.max(0, allPhotos.length - 1));

  return (
    <div className="preview-full">
      {/* Photo Gallery with Carousel */}
      {allPhotos.length > 0 && (
        <div className="preview-gallery">
          <div className="preview-main-photo">
            <img 
              src={`http://localhost:5000${allPhotos[safeIndex]?.url}`} 
              alt={listing.title}
              onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'} 
            />
            {allPhotos.length > 1 && (
              <>
                <button className="gallery-nav nav-prev" onClick={() => setCurrentPhotoIndex(p => (p - 1 + allPhotos.length) % allPhotos.length)}>
                  ‹
                </button>
                <button className="gallery-nav nav-next" onClick={() => setCurrentPhotoIndex(p => (p + 1) % allPhotos.length)}>
                  ›
                </button>
                <div className="gallery-counter">{safeIndex + 1} / {allPhotos.length}</div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allPhotos.length > 1 && (
            <div className="preview-thumbnails">
              {allPhotos.map((photo, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:5000${photo.url}`}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`thumbnail ${idx === safeIndex ? 'active' : ''}`}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Information Panel */}
      <div className="preview-info">
        <div className="preview-header">
          <h2>{listing.title}</h2>
          <div className="preview-price-section">
            <span className="preview-price">${listing.price}</span>
            {listing.negotiable && <span className="badge-negotiable">Negotiable</span>}
            {listing.firm && <span className="badge-firm">Firm</span>}
          </div>
        </div>

        {/* Basic Information */}
        <div className="preview-section">
          <h4>📋 Basic Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Condition</span>
              <span className="value">{formatCondition(listing.condition)}</span>
            </div>
            {listing.category_name && (
              <div className="detail-item">
                <span className="label">Category</span>
                <span className="value">{listing.category_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="preview-section">
            <h4>📝 Description</h4>
            <p className="preview-description">{listing.description}</p>
          </div>
        )}

        {/* Location */}
        {listing.location_text && (
          <div className="preview-section">
            <h4>📍 Location</h4>
            <div className="location-box">
              <p>{listing.location_text}</p>
              {listing.location_description && (
                <p className="location-note">{listing.location_description}</p>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="preview-section">
          <h4>📊 Statistics</h4>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-number">{listing.view_count || 0}</span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{listing.save_count || 0}</span>
              <span className="stat-label">Saves</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{listing.share_count || 0}</span>
              <span className="stat-label">Shares</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="preview-meta">
          <span>Created: {new Date(listing.created_at).toLocaleDateString()}</span>
          {listing.updated_at && (
            <span>Updated: {new Date(listing.updated_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ListingCard Component - EXACTLY from Profile.jsx
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
      </div>

      {/* Listing Details */}
      <div className="listing-details">
        <h4 className="listing-title">{listing.title || 'Untitled Listing'}</h4>
        <div className="listing-price">
          <span className="price-amount">₹{listing.price || '0.00'}</span>
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

        <div className="listing-footer">
          <span className="listing-date">
            {new Date(listing.created_at).toLocaleDateString()}
          </span>
          <span className="listing-status status-active">Active</span>
        </div>
      </div>
    </div>
  );
};

function AllListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await axiosInstance.get('/items/my-listings');
      const activeListings = response.data.filter(item => item.status === 'available');
      setListings(activeListings);
    } catch (err) {
      setError('Failed to load listings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  const handlePreview = () => {
    setShowListingModal(false);
    setShowPreview(true);
  };

  const handleEdit = () => {
    setShowListingModal(false);
    localStorage.setItem('editListing', JSON.stringify(selectedListing));
    navigate('/create-listing', { state: { editListing: selectedListing } });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await axiosInstance.delete(`/items/${selectedListing.id}`);
        setShowListingModal(false);
        fetchListings();
      } catch (err) {
        alert('Failed to delete listing');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="all-listings-container"><div className="loading">Loading listings...</div></div>;
  if (error) return <div className="all-listings-container"><div className="error">{error}</div></div>;

  return (
    <div className="all-listings-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ← Back to Profile
        </button>
        <div className="header-content">
          <h1>✅ All Active Listings</h1>
          <p className="header-subtitle">{listings.length} active listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No active listings</h2>
          <p>Your published listings will appear here</p>
          <button className="create-btn" onClick={() => navigate('/create-listing')}>
            Create New Listing
          </button>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id}
              listing={listing}
              isDraft={false}
              onClick={() => handleListingClick(listing)}
            />
          ))}
        </div>
      )}

      {/* Listing Options Modal */}
      {showListingModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowListingModal(false)}>
          <div className="modal-content options-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowListingModal(false)}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon active-icon">✅</div>
              <h3>Listing Options</h3>
              <p className="modal-subtitle">{selectedListing.title}</p>
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

              <button className="option-card delete-option" onClick={handleDelete}>
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

      {/* Preview Modal */}
      {showPreview && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPreview(false)}>×</button>
            
            <PreviewContent listing={selectedListing} />

            <div className="preview-actions">
              <button className="action-btn btn-close" onClick={() => setShowPreview(false)}>
                <span>✕</span> Close
              </button>
              <button className="action-btn btn-edit" onClick={handleEdit}>
                <span>✏️</span> Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllListings;
