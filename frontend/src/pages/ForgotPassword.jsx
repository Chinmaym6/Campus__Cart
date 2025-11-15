import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      // Navigate to enter OTP page
      setTimeout(() => navigate('/enter-otp'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-forms" style={{ transform: 'translateX(0)' }}>
            <div className="auth-form">
              <h1>Forgot Password</h1>
              <p className="subtitle">Enter your email address and we'll send you an OTP to reset your password.</p>

              {error && <div className="alert alert-error">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>

              <div className="auth-links">
                <Link to="/auth" state={{ mode: 'login' }}>Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}