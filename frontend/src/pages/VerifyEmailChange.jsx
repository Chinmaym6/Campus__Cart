import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './Verify.css';

export default function VerifyEmailChange() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const newEmail = searchParams.get('newEmail');
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Delay the API call to show the verifying state
    const timer = setTimeout(() => {
      verifyEmailChange();
    }, 1000);
    return () => clearTimeout(timer);
  }, [token, newEmail]);

  const verifyEmailChange = async () => {
    try {
      const response = await axiosInstance.get(`/auth/verify-email-change/${token}?newEmail=${encodeURIComponent(newEmail)}`);
      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been successfully updated!');
        // Update localStorage user email
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.email = newEmail;
        localStorage.setItem('user', JSON.stringify(user));
        setTimeout(() => navigate('/profile'), 3000);
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
              <h2>Verifying Email Change</h2>
              <p>{message || 'Please wait while we verify your new email...'}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-content success">
              <div className="success-icon">✓</div>
              <h2>Email Updated Successfully</h2>
              <p>{message}</p>
              <p className="redirect-text">Redirecting to your profile in 3 seconds...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-content error">
              <div className="error-icon">✕</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="action-links">
                <button onClick={() => navigate('/edit-profile')} className="btn btn-primary">
                  Back to Edit Profile
                </button>
                <Link to="/" className="btn btn-secondary">Go to Home</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}