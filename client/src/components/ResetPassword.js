import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter OTP, 2: Enter new password

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      // Just verify OTP format, actual verification happens with password reset
      setStep(2);
      setMessage('OTP verified. Please enter your new password.');
    } catch (error) {
      setError(error.response?.data?.error || 'OTP verification failed');
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const resetData = { email, otp, newPassword };
      
      const response = await axios.post('/api/auth/reset-password', resetData);

      if (response.data.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
      setStep(1); // Go back to OTP step if verification fails
    }
    
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/resend-otp', { email, type: 'reset' });
      if (response.data.success) {
        setMessage('OTP resent to your email!');
        setStep(1);
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
            <h1>Enter OTP</h1>
            <p>Enter the 6-digit OTP sent to {email || 'your email'}</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {!email && (
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
            )}

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
              {loading ? 'Verifying...' : 'Verify OTP'}
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
              <Link to="/forgot-password" className="auth-link">
                Back to forgot password
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
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <form onSubmit={handleResetPassword} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Back to OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


