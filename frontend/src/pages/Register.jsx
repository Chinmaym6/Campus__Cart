import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    graduationYear: '',
    major: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', formData);

      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          university: '',
          graduationYear: '',
          major: ''
        });

        setTimeout(() => {
          navigate('/login', { state: { message: 'Check your email to verify your account' } });
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-box">
          <h1>Create Account</h1>
          <p className="subtitle">Join Campus Cart and start trading</p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <label htmlFor="firstName" className={`form-label ${formData.firstName ? 'active' : ''}`} data-icon="👤">First Name *</label>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <label htmlFor="lastName" className={`form-label ${formData.lastName ? 'active' : ''}`} data-icon="👤">Last Name *</label>
              </div>
            </div>

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
              <label htmlFor="email" className={`form-label ${formData.email ? 'active' : ''}`}>Email *</label>
            </div>

            <div className="form-group">
              <input
                type="text"
                id="university"
                name="university"
                value={formData.university}
                onChange={handleChange}
                required
                className="form-input"
              />
              <label htmlFor="university" className={`form-label ${formData.university ? 'active' : ''}`}>University *</label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="number"
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="form-input"
                />
                <label htmlFor="graduationYear" className={`form-label ${formData.graduationYear ? 'active' : ''}`}>Graduation Year</label>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="form-input"
                />
                <label htmlFor="major" className={`form-label ${formData.major ? 'active' : ''}`}>Major</label>
              </div>
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
              <label htmlFor="password" className={`form-label ${formData.password ? 'active' : ''}`}>Password *</label>
            </div>

            <div className="form-group">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
              />
              <label htmlFor="confirmPassword" className={`form-label ${formData.confirmPassword ? 'active' : ''}`}>Confirm Password *</label>
            </div>

            <button
              type="submit"
              className="btn btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <p className="auth-link">
            Already have an account? <Link to="/auth" state={{ mode: 'login' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
