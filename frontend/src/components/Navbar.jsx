import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">🛍️</span> Campus Cart
        </Link>

        <div className="nav-links">
          {!isLoggedIn ? (
            <>
              <Link to="/auth" state={{ mode: 'login' }} className="nav-link">Login</Link>
              <Link to="/auth" state={{ mode: 'register' }} className="nav-link nav-link-primary">Register</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="profile-dropdown" ref={dropdownRef}>
                <button onClick={toggleDropdown} className="profile-icon">
                  👤
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="user-name">{user?.first_name} {user?.last_name}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>View Profile</Link>
                    <Link to="/edit-profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Edit Profile</Link>
                    <button onClick={handleLogout} className="dropdown-item logout">Logout</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
