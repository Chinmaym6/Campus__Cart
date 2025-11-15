import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Auth.css';

export default function EnterOTP() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axiosInstance.post('/auth/verify-otp', { email, otp });
      if (response.data.success) {
        // Navigate to reset password with token
        navigate(`/reset-password?token=${response.data.resetToken}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
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
              <h1>Enter OTP</h1>
              <p className="subtitle">Enter the OTP sent to your email and your email address.</p>

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

                <div className="form-group">
                  <label htmlFor="otp">OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <div className="auth-links">
                <Link to="/forgot-password">Resend OTP</Link>
                <Link to="/auth" state={{ mode: 'login' }}>Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}