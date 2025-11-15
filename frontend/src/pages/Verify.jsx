import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Verify.css';

export default function Verify() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Delay the API call to show the verifying state
    const timer = setTimeout(() => {
      verifyEmail();
    }, 1000);
    return () => clearTimeout(timer);
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axiosInstance.get(`/auth/verify/${token}`);
      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been successfully verified!');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-box">
          {status === 'verifying' && (
            <div className="verify-content">
              <div className="spinner"></div>
              <h2>Verifying Email</h2>
              <p>{message || 'Please wait while we verify your email...'}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-content success">
              <div className="success-icon">✓</div>
              <h2>Email Verified Successfully</h2>
              <p>{message}</p>
              <p className="redirect-text">Redirecting to login in 3 seconds...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-content error">
              <div className="error-icon">✕</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="action-links">
                <Link to="/auth" state={{ mode: 'register' }} className="btn btn-primary">Try Registering Again</Link>
                <Link to="/" className="btn btn-secondary">Go to Home</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
