import React, { useState, useEffect, useRef } from 'react';
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
  const [listingLocation, setListingLocation] = useState({ lat: null, lng: null });
  const [meetupLocation, setMeetupLocation] = useState({ lat: null, lng: null });
  const listingMapRef = useRef(null);
  const meetupMapRef = useRef(null);
  const listingMarkerRef = useRef(null);
  const meetupMarkerRef = useRef(null);

  useEffect(() => {
    const savedFormData = localStorage.getItem('createListingFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        if (parsed.photos && Array.isArray(parsed.photos)) {
          const restoredPhotos = parsed.photos.filter(p => p && p.base64).map(p => {
            const file = dataURLToFile(p.base64, p.name);
            return {
              ...p,
              file,
              url: URL.createObjectURL(file)
            };
          });
          setFormData({ ...parsed, photos: restoredPhotos });
        } else {
          setFormData(prev => ({ ...prev, ...parsed, photos: prev.photos }));
        }
      } catch (e) {
        console.error('Error restoring form data:', e);
        localStorage.removeItem('createListingFormData');
      }
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
      
      // Extract location coordinates if they exist
      // PostGIS geography points are stored as WKT or GeoJSON
      // We need to parse them if available
      if (editListing.location) {
        // Assuming backend sends lat/lng separately or we parse from geography
        const locLat = editListing.location_lat || null;
        const locLng = editListing.location_lng || null;
        if (locLat && locLng) {
          setListingLocation({ lat: parseFloat(locLat), lng: parseFloat(locLng) });
        }
      }
      
      if (editListing.meetup_location) {
        const meetupLat = editListing.meetup_location_lat || null;
        const meetupLng = editListing.meetup_location_lng || null;
        if (meetupLat && meetupLng) {
          setMeetupLocation({ lat: parseFloat(meetupLat), lng: parseFloat(meetupLng) });
        }
      }
      
      // Parse availability if it's JSON string
      let parsedAvailability = '';
      if (editListing.availability) {
        try {
          const availArray = typeof editListing.availability === 'string' 
            ? JSON.parse(editListing.availability) 
            : editListing.availability;
          parsedAvailability = Array.isArray(availArray) ? availArray[0] : editListing.availability;
        } catch {
          parsedAvailability = editListing.availability;
        }
      }
      
      // Parse payment methods
      let parsedPaymentMethod = 'cash';
      if (editListing.payment_methods) {
        try {
          const paymentArray = typeof editListing.payment_methods === 'string'
            ? JSON.parse(editListing.payment_methods)
            : editListing.payment_methods;
          parsedPaymentMethod = Array.isArray(paymentArray) ? paymentArray[0] : 'cash';
        } catch {
          parsedPaymentMethod = 'cash';
        }
      }
      
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
        paymentMethod: parsedPaymentMethod,
        open_to_trades: editListing.open_to_trades || false,
        trade_description: editListing.trade_description || '',
        trade_preference: editListing.trade_preference || '',
        location_text: editListing.location_text || '',
        location_description: editListing.location_description || '',
        meetup_location_text: editListing.meetup_location_text || '',
        meetup_description: editListing.meetup_description || '',
        pickup_only: editListing.pickup_only || false,
        willing_to_ship: editListing.willing_to_ship || false,
        availability: parsedAvailability,
        special_instructions: editListing.special_instructions || '',
        deliveryMethod: editListing.pickup_only ? 'pickup' : editListing.willing_to_ship ? 'ship' : 'pickup'
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

  const initMap = (mapRef, markerRef, location, setLocation, mapId) => {
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      document.head.appendChild(script);
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      
      script.onload = () => {
        setTimeout(() => initMapInstance(mapRef, markerRef, location, setLocation, mapId), 100);
      };
    } else {
      initMapInstance(mapRef, markerRef, location, setLocation, mapId);
    }
  };

  const initMapInstance = (mapRef, markerRef, location, setLocation, mapId) => {
    if (mapRef.current) return;
    
    const defaultLat = location.lat || 37.7749;
    const defaultLng = location.lng || -122.4194;
    
    const map = window.L.map(mapId).setView([defaultLat, defaultLng], 13);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    
    marker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      setLocation({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng, setLocation === setListingLocation ? 'listing' : 'meetup');
    });
    
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng, setLocation === setListingLocation ? 'listing' : 'meetup');
    });
    
    mapRef.current = map;
    markerRef.current = marker;
    
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  };

  const reverseGeocode = (lat, lng, type) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        const address = data.address;
        const locationText = `${address.road || ''}, ${address.city || address.town || address.village || ''}, ${address.state || ''}, ${address.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',');
        if (type === 'listing') {
          updateFormData('location_text', locationText);
        } else {
          updateFormData('meetup_location_text', locationText);
        }
      })
      .catch(err => console.error('Geocoding error:', err));
  };

  const useCurrentLocation = (type) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (type === 'listing') {
            setListingLocation({ lat, lng });
            if (listingMapRef.current && listingMarkerRef.current) {
              listingMapRef.current.setView([lat, lng], 13);
              listingMarkerRef.current.setLatLng([lat, lng]);
            }
            reverseGeocode(lat, lng, 'listing');
          } else {
            setMeetupLocation({ lat, lng });
            if (meetupMapRef.current && meetupMarkerRef.current) {
              meetupMapRef.current.setView([lat, lng], 13);
              meetupMarkerRef.current.setLatLng([lat, lng]);
            }
            reverseGeocode(lat, lng, 'meetup');
          }
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const submitListing = async (status) => {
    // Validation
    if (!formData.title || !formData.description || !formData.price || !formData.condition || !formData.category_id) {
      setErrors({ submit: 'Please fill in all required fields.' });
      return;
    }

    // Validate location - only required for new listings or if location was changed
    // For editing, if location exists in formData.location_text, we can skip coordinate validation
    if (!isEditing && (!listingLocation.lat || !listingLocation.lng)) {
      setErrors({ submit: 'Please select listing location on the map.' });
      return;
    }
    
    // For editing, check if we have location data either in state or from existing data
    if (isEditing && !listingLocation.lat && !formData.location_text) {
      setErrors({ submit: 'Please select listing location on the map.' });
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
      
      // Handle listing location (geography point)
      data.append('location_text', formData.location_text || '');
      if (listingLocation.lat && listingLocation.lng) {
        data.append('location_lat', listingLocation.lat);
        data.append('location_lng', listingLocation.lng);
      }
      data.append('location_description', formData.location_description || '');
      
      // Handle meetup location (geography point)
      if (meetupLocation.lat && meetupLocation.lng) {
        data.append('meetup_location_text', formData.meetup_location_text || '');
        data.append('meetup_location_lat', meetupLocation.lat);
        data.append('meetup_location_lng', meetupLocation.lng);
        data.append('meetup_description', formData.meetup_description || '');
      }
      
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
      
      // Handle availability
      if (formData.availability) {
        data.append('availability', JSON.stringify([formData.availability]));
      }
      if (formData.special_instructions) {
        data.append('special_instructions', formData.special_instructions);
      }
      
      data.append('status', status);

      // Append photos (only new ones for editing, and only if they have file objects)
      if (reorderedPhotos.length > 0) {
        reorderedPhotos.forEach((photo) => {
          if (photo.file) {
            data.append('photos', photo.file, photo.name);
          }
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

      // Clear localStorage after successful submission
      localStorage.removeItem('createListingFormData');
      localStorage.removeItem('createListingStep');
      
      navigate('/profile');
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to create listing. Please try again.' });
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
            <h1>        </h1>
            <h1></h1>
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
            
            {/* Listing Location Section */}
            <div className="location-section">
              <h3>📍 Listing Location</h3>
              <p className="section-description">Where is your item located?</p>
              
              <div className="form-group">
                <label>Select Location on Map *</label>
                <div className="map-controls">
                  <button
                    type="button"
                    className="current-location-btn"
                    onClick={() => useCurrentLocation('listing')}
                  >
                    📍 Use Current Location
                  </button>
                  <span className="map-hint">Click on map or drag marker to set location</span>
                </div>
                <div 
                  id="listing-map" 
                  className="location-map"
                  ref={(el) => {
                    if (el && !listingMapRef.current) {
                      setTimeout(() => {
                        initMap(listingMapRef, listingMarkerRef, listingLocation, setListingLocation, 'listing-map');
                      }, 100);
                    }
                  }}
                ></div>
                {listingLocation.lat && listingLocation.lng && (
                  <small className="coordinates-display">
                    Coordinates: {listingLocation.lat.toFixed(6)}, {listingLocation.lng.toFixed(6)}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>Detected Address</label>
                <input
                  type="text"
                  value={formData.location_text || 'Select location on map to detect address'}
                  readOnly
                  className="readonly-input"
                  placeholder="Address will be auto-detected from map"
                />
                <small className="field-hint">Address is automatically detected based on map location</small>
              </div>
              
              <div className="form-group">
                <label>Location Description (Optional)</label>
                <textarea
                  value={formData.location_description || ''}
                  onChange={(e) => updateFormData('location_description', e.target.value)}
                  placeholder="Add any specific details about the location (e.g., 'Room 305, Building A')"
                  rows={3}
                />
                <small className="field-hint">Help buyers understand where exactly the item is</small>
              </div>
            </div>

            <div className="section-divider"></div>
            
            {/* Meetup Location Section */}
            <div className="location-section">
              <h3>🤝 Meetup Location</h3>
              <p className="section-description">Where would you like to meet potential buyers?</p>
              
              <div className="form-group">
                <label>Select Meetup Location on Map *</label>
                <div className="map-controls">
                  <button
                    type="button"
                    className="current-location-btn"
                    onClick={() => useCurrentLocation('meetup')}
                  >
                    📍 Use Current Location
                  </button>
                  <button
                    type="button"
                    className="copy-location-btn"
                    onClick={() => {
                      setMeetupLocation({ ...listingLocation });
                      updateFormData('meetup_location_text', formData.location_text);
                      if (meetupMapRef.current && meetupMarkerRef.current && listingLocation.lat) {
                        meetupMapRef.current.setView([listingLocation.lat, listingLocation.lng], 13);
                        meetupMarkerRef.current.setLatLng([listingLocation.lat, listingLocation.lng]);
                      }
                    }}
                  >
                    📋 Copy Listing Location
                  </button>
                  <span className="map-hint">Click on map or drag marker to set location</span>
                </div>
                <div 
                  id="meetup-map" 
                  className="location-map"
                  ref={(el) => {
                    if (el && !meetupMapRef.current) {
                      setTimeout(() => {
                        initMap(meetupMapRef, meetupMarkerRef, meetupLocation, setMeetupLocation, 'meetup-map');
                      }, 100);
                    }
                  }}
                ></div>
                {meetupLocation.lat && meetupLocation.lng && (
                  <small className="coordinates-display">
                    Coordinates: {meetupLocation.lat.toFixed(6)}, {meetupLocation.lng.toFixed(6)}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>Detected Address</label>
                <input
                  type="text"
                  value={formData.meetup_location_text || 'Select location on map to detect address'}
                  readOnly
                  className="readonly-input"
                  placeholder="Address will be auto-detected from map"
                />
                <small className="field-hint">Address is automatically detected based on map location</small>
              </div>
              
              <div className="form-group">
                <label>Meetup Location Description (Optional)</label>
                <textarea
                  value={formData.meetup_description || ''}
                  onChange={(e) => updateFormData('meetup_description', e.target.value)}
                  placeholder="Add specific details about the meetup location (e.g., 'Main entrance of library, near the coffee shop')"
                  rows={3}
                />
                <small className="field-hint">Help buyers find the exact meetup spot</small>
              </div>
            </div>

            <div className="section-divider"></div>
            
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
        // Combine existing photos and new photos for preview
        const allPreviewPhotos = [
          ...(isEditing && existingPhotos ? existingPhotos.map(p => ({ 
            url: p.url.startsWith('http') ? p.url : `http://localhost:5000${p.url}`,
            isExisting: true 
          })) : []),
          ...(formData.photos || []).map(p => ({ 
            url: p.url,
            isExisting: false 
          }))
        ];
        
        // Debug: Log photos on preview step
        console.log('Preview Step - All Photos:', allPreviewPhotos);
        console.log('Existing Photos:', existingPhotos);
        console.log('New Photos:', formData.photos);
        console.log('Primary Photo Index:', primaryPhotoIndex);
        
        return (
          <div className="step-content preview-step">
            <div className="preview-header-banner">
              <h2>✨ Preview Your Listing</h2>
              <p>Review how your listing will appear to buyers</p>
            </div>
            
            <div className="listing-preview-full">
              {/* Photo Gallery Section */}
              <div className="preview-gallery-section">
                {allPreviewPhotos && allPreviewPhotos.length > 0 ? (
                  <>
                    <div className="preview-main-image">
                      {allPreviewPhotos[primaryPhotoIndex] && allPreviewPhotos[primaryPhotoIndex].url ? (
                        <img 
                          src={allPreviewPhotos[primaryPhotoIndex].url} 
                          alt={formData.title || 'Item'}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onLoad={() => console.log('Image loaded successfully:', allPreviewPhotos[primaryPhotoIndex].url)}
                          onError={(e) => {
                            console.error('Image failed to load:', allPreviewPhotos[primaryPhotoIndex]);
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3EImage Preview%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="image-loading">
                          <span>📸</span>
                          <p>Loading image...</p>
                        </div>
                      )}
                      {allPreviewPhotos.length > 1 && (
                        <>
                          <button 
                            type="button"
                            className="photo-nav-btn prev-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              setPrimaryPhotoIndex(p => (p - 1 + allPreviewPhotos.length) % allPreviewPhotos.length);
                            }}
                          >
                            ‹
                          </button>
                          <button 
                            type="button"
                            className="photo-nav-btn next-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              setPrimaryPhotoIndex(p => (p + 1) % allPreviewPhotos.length);
                            }}
                          >
                            ›
                          </button>
                        </>
                      )}
                      <div className="image-counter">
                        {primaryPhotoIndex + 1} / {allPreviewPhotos.length}
                      </div>
                    </div>
                    {allPreviewPhotos.length > 1 && (
                      <div className="preview-thumbnails">
                        {allPreviewPhotos.map((photo, index) => (
                          <div 
                            key={index}
                            className={`thumbnail-wrapper ${index === primaryPhotoIndex ? 'active' : ''}`}
                            onClick={() => setPrimaryPhotoIndex(index)}
                          >
                            <img
                              src={photo.url}
                              alt={`Thumbnail ${index + 1}`}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23374151" width="80" height="80"/%3E%3C/svg%3E';
                              }}
                            />
                            {photo.isExisting && (
                              <span className="existing-photo-badge">Existing</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-photos-placeholder">
                    <span className="placeholder-icon">📷</span>
                    <p>No photos added</p>
                    <small>Add at least 3 photos to publish</small>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="preview-details-section">
                {/* Header */}
                <div className="preview-listing-header">
                  <h1 className="preview-title">{formData.title || 'Item Title'}</h1>
                  <div className="preview-price-box">
                    <span className="preview-price">${formData.price || '0.00'}</span>
                    {formData.priceType === 'negotiable' && (
                      <span className="price-badge negotiable">💬 Negotiable</span>
                    )}
                    {formData.priceType === 'firm' && (
                      <span className="price-badge firm">🔒 Firm</span>
                    )}
                  </div>
                </div>

                {/* Basic Details */}
                <div className="preview-card">
                  <h3 className="card-title">📋 Item Details</h3>
                  <div className="details-grid">
                    <div className="detail-box">
                      <span className="detail-label">Condition</span>
                      <span className="detail-value">
                        {formData.condition ? formData.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                      </span>
                    </div>
                    <div className="detail-box">
                      <span className="detail-label">Category</span>
                      <span className="detail-value">
                        {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}
                      </span>
                    </div>
                    <div className="detail-box">
                      <span className="detail-label">Payment</span>
                      <span className="detail-value">{formData.paymentMethod || 'Not specified'}</span>
                    </div>
                    <div className="detail-box">
                      <span className="detail-label">Delivery</span>
                      <span className="detail-value">
                        {formData.deliveryMethod === 'pickup' ? '🚗 Pickup Only' 
                          : formData.deliveryMethod === 'ship' ? '📦 Shipping' 
                          : formData.deliveryMethod === 'both' ? '🚗📦 Both' 
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="preview-card">
                  <h3 className="card-title">📝 Description</h3>
                  <p className="description-text">
                    {formData.description || 'No description provided'}
                  </p>
                </div>

                {/* Trade Options */}
                {formData.open_to_trades && (
                  <div className="preview-card trade-card">
                    <h3 className="card-title">🔄 Trade Options</h3>
                    <div className="trade-info">
                      <p><strong>Open to trades:</strong> ✅ Yes</p>
                      {formData.trade_preference && (
                        <p><strong>Preference:</strong> {formData.trade_preference.replace(/_/g, ' ')}</p>
                      )}
                      {formData.trade_description && (
                        <div className="trade-description">
                          <strong>Looking for:</strong>
                          <p>{formData.trade_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Information */}
                {(formData.location_text || formData.meetup_location_text) && (
                  <div className="preview-card location-card">
                    <h3 className="card-title">📍 Location Information</h3>
                    
                    {formData.location_text && (
                      <div className="location-item">
                        <strong>📦 Listing Location</strong>
                        <p className="location-address">{formData.location_text}</p>
                        {formData.location_description && (
                          <p className="location-note">ℹ️ {formData.location_description}</p>
                        )}
                        {listingLocation.lat && listingLocation.lng && (
                          <p className="coordinates">
                            📌 {listingLocation.lat.toFixed(4)}, {listingLocation.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {formData.meetup_location_text && (
                      <div className="location-item">
                        <strong>🤝 Meetup Location</strong>
                        <p className="location-address">{formData.meetup_location_text}</p>
                        {formData.meetup_description && (
                          <p className="location-note">ℹ️ {formData.meetup_description}</p>
                        )}
                        {meetupLocation.lat && meetupLocation.lng && (
                          <p className="coordinates">
                            📌 {meetupLocation.lat.toFixed(4)}, {meetupLocation.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Information */}
                {(formData.availability || formData.special_instructions) && (
                  <div className="preview-card">
                    <h3 className="card-title">ℹ️ Additional Information</h3>
                    {formData.availability && (
                      <div className="info-item">
                        <strong>Availability:</strong>
                        <p>{formData.availability}</p>
                      </div>
                    )}
                    {formData.special_instructions && (
                      <div className="info-item">
                        <strong>Special Instructions:</strong>
                        <p>{formData.special_instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Stats */}
                <div className="preview-summary">
                  <div className="summary-item">
                    <span className="summary-icon">📸</span>
                    <span className="summary-text">{allPreviewPhotos.length} Photos</span>
                  </div>
                  {isEditing && existingPhotos.length > 0 && formData.photos.length > 0 && (
                    <div className="summary-item">
                      <span className="summary-icon">🆕</span>
                      <span className="summary-text">{formData.photos.length} New</span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="summary-icon">✅</span>
                    <span className="summary-text">Ready to {isEditing ? 'Update' : 'Publish'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {errors.submit && <div className="error-message-box">{errors.submit}</div>}
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






