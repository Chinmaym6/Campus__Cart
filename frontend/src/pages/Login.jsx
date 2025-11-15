import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      return data.display_name || `${lat}, ${lng}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat}, ${lng}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', formData);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Try to get location
        try {
          const position = await getLocation();
          const { latitude: lat, longitude: lng } = position.coords;
          const address = await reverseGeocode(lat, lng);
          await axiosInstance.put('/auth/update-location', { lat, lng, address });
        } catch (locationError) {
          console.log('Location not available:', locationError.message);
          // Proceed without location
        }

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const infoMessage = location.state?.message;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1>Welcome Back</h1>
          <p className="subtitle">Login to your Campus Cart account</p>

          {infoMessage && <div className="alert alert-info">{infoMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
              <label htmlFor="email" className={`form-label ${formData.email ? 'active' : ''}`} data-icon="📧">Email *</label>
            </div>

            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
              <label htmlFor="password" className={`form-label ${formData.password ? 'active' : ''}`} data-icon="🔒">Password *</label>
            </div>

            <button
              type="submit"
              className="btn btn-submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/auth" state={{ mode: 'register' }}>Register here</Link>
          </p>
          <p className="auth-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>

          <div className="divider"></div>

          <p className="help-text">
            Make sure you've verified your email before logging in.
          </p>
        </div>
      </div>
    </div>
  );
}
