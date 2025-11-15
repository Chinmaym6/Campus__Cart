import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './EditProfile.css';

export default function EditProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      if (response.data.success) {
        setProfile(response.data.user);
        setPhotoPreview(response.data.user.profile_photo_url ? `http://localhost:5000${response.data.user.profile_photo_url}` : null);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
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

  const uploadPhoto = async () => {
    if (!photoFile) return;

    const formData = new FormData();
    formData.append('photo', photoFile);

    try {
      const response = await axiosInstance.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setProfile(prev => ({ ...prev, profile_photo_url: response.data.photoUrl }));
        setPhotoFile(null);
        setSuccess('Profile photo updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Failed to upload photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        bio: profile.bio,
        phone_number: profile.phone_number,
        university: profile.university,
        graduation_year: profile.graduation_year,
        major: profile.major,
        location_text: profile.location_text
      };

      const response = await axiosInstance.put('/auth/profile', updateData);
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail) return;

    setSendingEmail(true);
    setError('');
    setSuccess('');

    try {
      const response = await axiosInstance.put('/auth/update-email', { email: newEmail });
      if (response.data.success) {
        setEmailModal(false);
        setNewEmail('');
        setSuccess('Verification email sent to new email address. Please check your inbox.');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1>Edit Profile</h1>
        <p>Update your information and preferences</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-section">
          <h2>Profile Photo</h2>
          <div className="photo-section">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile Preview" />
              ) : (
                <div className="photo-placeholder">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="photo-controls">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button type="button" onClick={() => fileInputRef.current.click()} className="btn-secondary">
                Choose Photo
              </button>
              {photoFile && (
                <button type="button" onClick={uploadPhoto} className="btn-primary">
                  Upload Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" value={profile.first_name} disabled />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" value={profile.last_name} disabled />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="email-group">
              <input type="email" value={profile.email} disabled />
              <button type="button" onClick={() => setEmailModal(true)} className="btn-secondary">
                Change Email
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={profile.phone_number || ''}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Academic Information</h2>
          <div className="form-group">
            <label>University</label>
            <input
              type="text"
              name="university"
              value={profile.university || ''}
              onChange={handleChange}
              placeholder="Enter university"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Major</label>
              <input
                type="text"
                name="major"
                value={profile.major || ''}
                onChange={handleChange}
                placeholder="Enter major"
              />
            </div>
            <div className="form-group">
              <label>Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                value={profile.graduation_year || ''}
                onChange={handleChange}
                placeholder="Enter graduation year"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profile.bio || ''}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location_text"
              value={profile.location_text || ''}
              onChange={handleChange}
              placeholder="Enter your location"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/profile')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {emailModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Email Address</h3>
            <p>You must verify your new email before it becomes active.</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              required
            />
            <div className="modal-actions">
              <button onClick={() => setEmailModal(false)} className="btn-primary" disabled={sendingEmail}>
                Cancel
              </button>
              <button onClick={handleEmailUpdate} className="btn-primary" disabled={sendingEmail}>
                {sendingEmail ? 'Sending...' : 'Send Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}