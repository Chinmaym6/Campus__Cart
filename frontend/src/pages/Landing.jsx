import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <div className="floating-elements">
        <div className="floating-circle circle1"></div>
        <div className="floating-circle circle2"></div>
        <div className="floating-circle circle3"></div>
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
      </div>
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Trade Smarter on Campus</h1>
          <p className="hero-subtitle">Buy, sell, and exchange items with fellow students. Secure, fast, and hassle-free.</p>

          <div className="hero-buttons">
            <Link to="/auth" state={{ mode: 'register' }} className="btn btn-primary">Get Started</Link>
            <Link to="/auth" state={{ mode: 'login' }} className="btn btn-secondary">Already have an account?</Link>
          </div>

          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon">📚</div>
              <h3>Textbooks</h3>
              <p>Buy, sell, or exchange textbooks at better prices</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛋️</div>
              <h3>Furniture</h3>
              <p>Find dorm essentials and furniture from students</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">👟</div>
              <h3>Fashion & More</h3>
              <p>Browse clothing, gadgets, and more student items</p>
            </div>

            {/* <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3>Trust & Safety</h3>
              <p>Verified student profiles for secure transactions</p>
            </div> */}
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-container">
          <h2>How It Works</h2>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your Campus Cart account with your university email</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Verify Email</h3>
              <p>Verify your email to unlock buying and selling features</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Browse or List</h3>
              <p>Browse items from other students or create a listing</p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Meet & Trade</h3>
              <p>Meet on campus and complete your transaction safely</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to start trading?</h2>
          <p>Join thousands of students buying and selling on Campus Cart</p>
          <Link to="/auth" state={{ mode: 'register' }} className="btn btn-primary btn-large">Register Now</Link>
        </div>
      </section>
    </div>
  );
}
