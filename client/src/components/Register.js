import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Registration form, 2: OTP verification
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', { username, email, password, name });
      if (response.data.success) {
        setMessage('Verification OTP sent to your email!');
        setStep(2);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-email', { username, otp });
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        window.location.href = '/'; // Reload to update auth state
      }
    } catch (error) {
      setError(error.response?.data?.error || 'OTP verification failed');
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/resend-otp', { username, type: 'verification' });
      if (response.data.success) {
        setMessage('OTP resent to your email!');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend OTP');
    }
    
    setLoading(false);
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Start your mental health journey today</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Choose a unique username"
                required
                minLength={3}
                pattern="[a-zA-Z0-9_]+"
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>Letters, numbers, and underscores only</small>
            </div>

            <div className="form-group">
              <label htmlFor="name">Name (Optional)</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>Enter the 6-digit OTP sent to {email}</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Username: <strong>{username}</strong></p>
        </div>

        <form onSubmit={handleVerifyOTP} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
              disabled={loading}
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            className="auth-button-secondary"
            disabled={loading}
          >
            Resend OTP
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

