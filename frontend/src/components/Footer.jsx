import React from 'react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Campus Cart</h3>
            <p>Trade smarter on campus. Buy, sell, and exchange items with fellow students.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/login">Login</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: campus.cart7@gmail.com</p>
            <p>Follow us on social media</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Campus Cart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
