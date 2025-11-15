import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import './CreateListing.css';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const dataURLToFile = (dataURL, filename) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const STEPS = [
  'Photo Upload',
  'Basic Item Details',
  'Pricing',
  'Transaction & Trade Options',
  'Location & Meetup',
  'Preview & Publish'
];

export default function CreateListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const getInitialEditData = () => {
    const editListing = JSON.parse(localStorage.getItem('editListing') || 'null');
    return editListing ? {
      isEditing: true,
      editingId: editListing.id,
      existingPhotos: editListing.photos || [],
      editListing
    } : {
      isEditing: false,
      editingId: null,
      existingPhotos: [],
      editListing: null
    };
  };

  const initialEditData = getInitialEditData();

  const [currentStep, setCurrentStep] = useState(0);
  const [isEditing, setIsEditing] = useState(initialEditData.isEditing);
  const [editingId, setEditingId] = useState(initialEditData.editingId);
  const [existingPhotos, setExistingPhotos] = useState(initialEditData.existingPhotos);
  const [formData, setFormData] = useState(() => {
    if (initialEditData.editListing) {
      const listing = initialEditData.editListing;
      return {
        photos: [],
        title: listing.title || '',
        description: listing.description || '',
        category_id: listing.category_id || '',
        condition: listing.condition || '',
        price: listing.price || '',
        priceType: listing.negotiable ? 'negotiable' : listing.firm ? 'firm' : 'negotiable',
        paymentMethod: listing.payment_methods?.[0] || 'cash',
        open_to_trades: listing.open_to_trades || false,
        trade_description: listing.trade_description || '',
        trade_preference: listing.trade_preference || '',
        location_text: listing.location_text || '',
        pickup_only: listing.pickup_only || false,
        willing_to_ship: listing.willing_to_ship || false,
        meetup_location: listing.meetup_locations?.[0] || '',
        availability: listing.availability || '',
        special_instructions: listing.special_instructions || '',
        deliveryMethod: listing.pickup_only ? 'pickup' : 'shipping'
      };
    }
    return {
      photos: [],
      title: '',
      description: '',
      category_id: '',
      condition: '',
      price: '',
      priceType: 'negotiable',
      paymentMethod: 'cash',
      open_to_trades: false,
      trade_description: '',
      trade_preference: '',
      location_text: '',
      pickup_only: false,
      willing_to_ship: false,
      meetup_location: '',
      availability: '',
      special_instructions: '',
      deliveryMethod: 'pickup'
    };
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);

  useEffect(() => {
    const savedFormData = localStorage.getItem('createListingFormData');
    if (savedFormData) {
      const parsed = JSON.parse(savedFormData);
      const restoredPhotos = parsed.photos.filter(p => p.base64).map(p => {
        const file = dataURLToFile(p.base64, p.name);
        return {
          ...p,
          file,
          url: URL.createObjectURL(file)
        };
      });
      setFormData({ ...parsed, photos: restoredPhotos });
    }
    const savedStep = localStorage.getItem('createListingStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  useEffect(() => {
    if (location.state?.editListing) {
      const editListing = location.state.editListing;
      setIsEditing(true);
      setEditingId(editListing.id);
      setExistingPhotos(editListing.photos || []);
      // Pre-fill form data (photos are handled separately for editing)
      setFormData(prev => ({
        ...prev,
        photos: [], // Start with empty, existing photos will be displayed differently
        title: editListing.title || '',
        description: editListing.description || '',
        category_id: editListing.category_id || '',
        condition: editListing.condition || '',
        price: editListing.price || '',
        priceType: editListing.negotiable ? 'negotiable' : editListing.firm ? 'firm' : 'negotiable',
        paymentMethod: editListing.payment_methods?.[0] || 'cash',
        open_to_trades: editListing.open_to_trades || false,
        trade_description: editListing.trade_description || '',
        trade_preference: editListing.trade_preference || '',
        location_text: editListing.location_text || '',
        pickup_only: editListing.pickup_only || false,
        willing_to_ship: editListing.willing_to_ship || false,
        meetup_location: editListing.meetup_locations?.[0] || '',
        availability: editListing.availability || '',
        special_instructions: editListing.special_instructions || '',
        deliveryMethod: editListing.pickup_only ? 'pickup' : 'shipping'
      }));
      setCurrentStep(0); // Start from first step
      localStorage.removeItem('editListing');
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('createListingFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('createListingStep', currentStep);
  }, [currentStep]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/items/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0: // Photo Upload
        // Photo validation handled by backend
        break;
      case 1: // Basic Details
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (formData.title.length > 255) newErrors.title = 'Title must be less than 255 characters';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        if (!formData.condition) newErrors.condition = 'Condition is required';
        break;
      case 2: // Pricing
        if (!formData.price || parseFloat(formData.price) <= 0) {
          newErrors.price = 'Valid price is required';
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handlePhotoUpload = async (input) => {
    const files = Array.from(input.target ? input.target.files : input.files);
    const validFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 10 - formData.photos.length);
    const newPhotos = await Promise.all(validFiles.map(async (file, i) => {
      const base64 = await fileToBase64(file);
      return {
        file,
        url: URL.createObjectURL(file),
        id: Date.now() + i,
        base64,
        name: file.name
      };
    }));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    if (errors.photos) {
      setErrors(prev => ({ ...prev, photos: '' }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handlePhotoUpload({ files: e.dataTransfer.files });
  };

  const removePhoto = (id) => {
    setFormData(prev => {
      const newPhotos = prev.photos.filter(photo => photo.id !== id);
      // Adjust primary photo index if needed
      const removedIndex = prev.photos.findIndex(photo => photo.id === id);
      if (primaryPhotoIndex === removedIndex) {
        setPrimaryPhotoIndex(0);
      } else if (primaryPhotoIndex > removedIndex) {
        setPrimaryPhotoIndex(primaryPhotoIndex - 1);
      }
      return { ...prev, photos: newPhotos };
    });
  };

  const movePhoto = (fromIndex, toIndex) => {
    const photos = [...formData.photos];
    const [moved] = photos.splice(fromIndex, 1);
    photos.splice(toIndex, 0, moved);
    
    let newPrimaryIndex = primaryPhotoIndex;
    if (primaryPhotoIndex === fromIndex) {
      newPrimaryIndex = toIndex;
    } else if (primaryPhotoIndex > fromIndex && primaryPhotoIndex <= toIndex) {
      newPrimaryIndex = primaryPhotoIndex - 1;
    } else if (primaryPhotoIndex < fromIndex && primaryPhotoIndex >= toIndex) {
      newPrimaryIndex = primaryPhotoIndex + 1;
    }
    
    setFormData(prev => ({ ...prev, photos }));
    setPrimaryPhotoIndex(newPrimaryIndex);
  };

  const submitListing = async (status) => {
    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.condition || !formData.category_id) {
      setErrors({ submit: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      const reorderedPhotos = [...formData.photos];
      if (primaryPhotoIndex > 0) {
        const [primary] = reorderedPhotos.splice(primaryPhotoIndex, 1);
        reorderedPhotos.unshift(primary);
      }

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('condition', formData.condition);
      data.append('category_id', formData.category_id);
      data.append('location_text', formData.location_text || '');
      
      // Handle delivery method
      data.append('pickup_only', formData.deliveryMethod === 'pickup');
      data.append('willing_to_ship', formData.deliveryMethod === 'ship' || formData.deliveryMethod === 'both');
      
      // Handle pricing type
      data.append('negotiable', formData.priceType === 'negotiable');
      data.append('firm', formData.priceType === 'firm');
      
      // Handle payment method
      data.append('payment_methods', JSON.stringify([formData.paymentMethod]));
      
      // Handle trades
      data.append('open_to_trades', formData.open_to_trades);
      if (formData.open_to_trades) {
        data.append('trade_description', formData.trade_description || '');
        data.append('trade_preference', formData.trade_preference || '');
      }
      
      // Handle meetup and availability
      if (formData.meetup_location) {
        data.append('meetup_locations', JSON.stringify([formData.meetup_location]));
      }
      if (formData.availability) {
        data.append('availability', JSON.stringify([formData.availability]));
      }
      if (formData.special_instructions) {
        data.append('special_instructions', formData.special_instructions);
      }
      
      data.append('status', status);

      // Append photos (only new ones for editing)
      if (!isEditing || reorderedPhotos.length > 0) {
        reorderedPhotos.forEach((photo) => {
          data.append('photos', photo.file, photo.name);
        });
      }

      if (isEditing) {
        await axios.put(`/items/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/items', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/profile');
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrors({ submit: 'Failed to create listing. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <div className="photo-upload-section">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                id="photo-input"
              />
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('photo-input').click()}
              >
                <div className="upload-content">
                  <div className="upload-icon">📸</div>
                  <h3>Click to upload or drag and drop</h3>
                  <p className="upload-requirements">Supports JPG, JPEG, PNG, WebP • Up to 10 photos</p>
                  <p className="photo-count">
                    {formData.photos.length + (isEditing ? existingPhotos.length : 0)} of 10 photos uploaded
                  </p>
                </div>
              </div>
              
              {(formData.photos.length > 0 || (isEditing && existingPhotos.length > 0)) && (
                <div className="photo-preview-section">
                  <h4>Photos</h4>
                  <div className="photo-grid">
                    {isEditing && existingPhotos.map((photo, index) => (
                      <div key={`existing-${index}`} className="photo-item existing-photo">
                        <img src={`http://localhost:5000${photo.url}`} alt={`Existing ${index + 1}`} />
                        <div className="photo-overlay">
                          <span>Existing</span>
                        </div>
                      </div>
                    ))}
                    {formData.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        data-photo-id={photo.id}
                        className={`photo-item ${draggedIndex === index ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => {
                          setDraggedIndex(index);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedIndex !== null && draggedIndex !== index) {
                            movePhoto(draggedIndex, index);
                          }
                          setDraggedIndex(null);
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                      >
                        <img src={photo.url} alt={`Photo ${index + 1}`} />
                        
                        <button
                          className="drag-handle"
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </button>
                        
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(photo.id);
                          }}
                          title="Remove photo"
                        >
                          ×
                        </button>
                        
                        {index === primaryPhotoIndex && (
                          <div className="main-photo-badge">PRIMARY</div>
                        )}
                        
                        {index !== primaryPhotoIndex && (
                          <button
                            className="set-primary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryPhotoIndex(index);
                            }}
                            title="Set as primary photo"
                          >
                            ★ Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.photos && <p className="error-message">{errors.photos}</p>}
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="step-content">
            <h2>Basic Item Details</h2>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                maxLength={255}
                placeholder="Enter item title"
              />
              <small className="char-count">{formData.title.length}/255 characters</small>
              {errors.title && <p className="error-message">{errors.title}</p>}
            </div>
            
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your item in detail"
                rows={6}
              />
              {errors.description && <p className="error-message">{errors.description}</p>}
            </div>
            
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => updateFormData('category_id', e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="error-message">{errors.category_id}</p>}
            </div>
            
            <div className="form-group">
              <label>Condition *</label>
              <div className="radio-group">
                {[
                  { value: 'brand_new', label: 'Brand New', desc: 'Unused item in original packaging' },
                  { value: 'like_new', label: 'Like New', desc: 'Barely used, in excellent condition' },
                  { value: 'good', label: 'Good', desc: 'Used but in good working condition' },
                  { value: 'fair', label: 'Fair', desc: 'Shows wear but still functional' },
                  { value: 'for_parts', label: 'For Parts', desc: 'Not working, for parts only' }
                ].map(cond => (
                  <label key={cond.value} className="radio-option">
                    <input
                      type="radio"
                      name="condition"
                      value={cond.value}
                      checked={formData.condition === cond.value}
                      onChange={(e) => updateFormData('condition', e.target.value)}
                    />
                    <div className="radio-content">
                      <strong>{cond.label}</strong>
                      <p>{cond.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.condition && <p className="error-message">{errors.condition}</p>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="step-content">
            <h2>Pricing</h2>
            
            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateFormData('price', e.target.value)}
                placeholder="0.00"
              />
              {errors.price && <p className="error-message">{errors.price}</p>}
            </div>
            
            <div className="form-group">
              <label>Price Flexibility</label>
              <div className="radio-group">
                {[
                  { value: 'negotiable', label: 'Price is negotiable' },
                  { value: 'firm', label: 'Price is firm' }
                ].map(option => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="priceFlexibility"
                      value={option.value}
                      checked={formData.priceType === option.value}
                      onChange={(e) => updateFormData('priceType', e.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="step-content">
            <h2>Transaction & Trade Options</h2>
            
            <div className="form-group">
              <label>Payment Method</label>
              <div className="radio-group">
                {[
                  { value: 'cash', label: 'Cash' },
                  { value: 'digital', label: 'Digital Payment (Venmo/Zelle)' }
                ].map(method => (
                  <label key={method.value} className="radio-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                    />
                    <span>{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.open_to_trades}
                  onChange={(e) => updateFormData('open_to_trades', e.target.checked)}
                />
                <span>Open to trades</span>
              </label>
            </div>
            
            {formData.open_to_trades && (
              <>
                <div className="form-group">
                  <label>What items are you interested in trading for?</label>
                  <textarea
                    value={formData.trade_description}
                    onChange={(e) => updateFormData('trade_description', e.target.value)}
                    placeholder="Describe items you're willing to trade for"
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>Trade Preference</label>
                  <select
                    value={formData.trade_preference}
                    onChange={(e) => updateFormData('trade_preference', e.target.value)}
                  >
                    <option value="">Select preference</option>
                    <option value="trade_only">Trade only</option>
                    <option value="trade_plus_cash">Trade + cash</option>
                    <option value="consider_all">Consider all offers</option>
                  </select>
                </div>
              </>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="step-content">
            <h2>Location & Meetup</h2>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location_text}
                onChange={(e) => updateFormData('location_text', e.target.value)}
                placeholder="Enter your location"
              />
            </div>
            
            <div className="form-group">
              <label>Delivery Method</label>
              <div className="radio-group">
                {[
                  { value: 'pickup', label: 'Pickup only' },
                  { value: 'ship', label: 'Willing to ship' },
                  { value: 'both', label: 'Both pickup and shipping' }
                ].map(option => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={option.value}
                      checked={formData.deliveryMethod === option.value}
                      onChange={(e) => updateFormData('deliveryMethod', e.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Preferred Meetup Location</label>
              <div className="radio-group">
                {['Library', 'Student Center', 'Dorm Lobby', 'Parking Lot', 'Cafeteria', 'Gym'].map(location => (
                  <label key={location} className="radio-option">
                    <input
                      type="radio"
                      name="meetupLocation"
                      value={location}
                      checked={formData.meetup_location === location}
                      onChange={(e) => updateFormData('meetup_location', e.target.value)}
                    />
                    <span>{location}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Availability</label>
              <div className="radio-group">
                {['Weekdays 9AM-5PM', 'Weekdays after 5PM', 'Weekends', 'Evenings'].map(time => (
                  <label key={time} className="radio-option">
                    <input
                      type="radio"
                      name="availability"
                      value={time}
                      checked={formData.availability === time}
                      onChange={(e) => updateFormData('availability', e.target.value)}
                    />
                    <span>{time}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Special Instructions</label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => updateFormData('special_instructions', e.target.value)}
                placeholder="Any special meetup instructions"
                rows={3}
              />
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="step-content">
            <h2>Preview & Publish</h2>
            
            <div className="listing-preview">
              {formData.photos.length > 0 && (
                <div className="preview-photos">
                  {formData.photos.slice(0, 3).map((photo, index) => (
                    <img key={index} src={photo.url} alt={`Preview ${index + 1}`} />
                  ))}
                </div>
              )}
              
              <h3>{formData.title || 'Item Title'}</h3>
              <p className="preview-price">${formData.price || '0.00'}</p>
              <p className="preview-description">{formData.description || 'Item description'}</p>
              
              <div className="preview-details">
                <p><strong>Condition:</strong> {formData.condition ? formData.condition.replace('_', ' ') : 'Not specified'}</p>
                <p><strong>Location:</strong> {formData.location_text || 'Not specified'}</p>
              </div>
            </div>
            
            {errors.submit && <p className="error-message">{errors.submit}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="create-listing">
      <div className="create-listing-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1 className="header-title">{STEPS[currentStep]}</h1>
          <p className="header-subtitle">
            {currentStep === 0 && "Add high-quality photos to attract more buyers."}
            {currentStep === 1 && "Provide detailed information about your item."}
            {currentStep === 2 && "Set your pricing and negotiation preferences."}
            {currentStep === 3 && "Specify payment methods and trade options."}
            {currentStep === 4 && "Set your location and meetup preferences."}
            {currentStep === 5 && "Review your listing before publishing."}
          </p>
        </div>
        <div className="header-spacer"></div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`progress-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <span className="step-label">{step}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-container">
        {renderStepContent()}
      </div>
      
      <div className="form-navigation">
        <div className="nav-left">
          {currentStep === 0 && (
            <div className="photo-count">
              {formData.photos.length + (isEditing ? existingPhotos.length : 0)} of 10 photos uploaded
            </div>
          )}
        </div>
        
        <div className="nav-right">
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <button onClick={prevStep} className="btn-secondary">
              Back
            </button>
          )}
          
          {currentStep === 0 && (
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={nextStep}
                className="btn-primary"
                disabled={(formData.photos.length + (isEditing ? existingPhotos.length : 0)) < 3}
              >
                Continue
              </button>
            </>
          )}
          
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <button onClick={nextStep} className="btn-primary">
              Next
            </button>
          )}
          
          {currentStep === STEPS.length - 1 && (
            <>
              <button onClick={prevStep} className="btn-secondary">
                Back
              </button>
              <button
                onClick={() => submitListing('draft')}
                className="btn-secondary"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save as Draft'}
              </button>
              <button
                onClick={() => submitListing('available')}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Publishing...' : isEditing ? 'Publish Changes' : 'Publish Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}