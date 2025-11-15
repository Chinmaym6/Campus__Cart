import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './ProfileSetup.css';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bio: '',
    phone_number: '',
    university: '',
    graduation_year: '',
    major: '',
    location_text: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Upload photo if selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        await axiosInstance.post('/auth/upload-photo', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Update profile
      await axiosInstance.put('/auth/profile', {
        ...formData,
        profile_completed: true
      });

      // Update localStorage user data
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.profile_completed = true;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setMessage('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">
        <div className="profile-setup-box">
          <h1>Complete Your Profile</h1>
          <p>Add details to enhance your Campus Cart experience. All fields are optional.</p>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label htmlFor="photo">Profile Photo</label>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Academic Information</h3>

              <div className="form-group">
                <label htmlFor="university">University</label>
                <input
                  type="text"
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="Your university name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="major">Major</label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="Your field of study"
                />
              </div>

              <div className="form-group">
                <label htmlFor="graduation_year">Graduation Year</label>
                <input
                  type="number"
                  id="graduation_year"
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  placeholder="2025"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Contact & Location</h3>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
                <small>Phone verification will unlock a badge</small>
              </div>

              <div className="form-group">
                <label htmlFor="location_text">Location</label>
                <input
                  type="text"
                  id="location_text"
                  name="location_text"
                  value={formData.location_text}
                  onChange={handleChange}
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={skip} className="btn btn-secondary">
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}