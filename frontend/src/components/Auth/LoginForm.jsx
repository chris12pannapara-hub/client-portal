/**
 * Login Form Component
 * 
 * Handles user authentication with email/username and password.
 * Features:
 * - Form validation
 * - Error handling
 * - Loading states
 * - WCAG accessibility (aria labels, focus management)
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  setUser,
  clearError,
  selectAuth,
} from '../../store/authSlice';
import api from '../../services/api';
import '../../styles/login.css';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(selectAuth);
  
  const [formData, setFormData] = useState({
    email_or_username: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email_or_username.trim()) {
      errors.email_or_username = 'Email or username is required';
    } else if (formData.email_or_username.length < 3) {
      errors.email_or_username = 'Must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    dispatch(clearError());
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    dispatch(loginStart());
    
    try {
      // Call login API
      const response = await api.post('/api/auth/login', formData);
      
      // Store tokens in Redux
      dispatch(loginSuccess(response.data));
      
      // Fetch user profile
      const userResponse = await api.get('/api/users/me');
      dispatch(setUser(userResponse.data));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Login failed. Please try again.';
      
      dispatch(loginFailure(errorMessage));
    }
  };
  
  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to your account</p>
        
        {/* Global error message */}
        {error && (
          <div className="alert alert-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        
        {/* Email/Username field */}
        <div className="form-group">
          <label htmlFor="email_or_username" className="form-label">
            Email or Username
          </label>
          <input
            type="text"
            id="email_or_username"
            name="email_or_username"
            value={formData.email_or_username}
            onChange={handleChange}
            className={`form-input ${
              formErrors.email_or_username ? 'form-input-error' : ''
            }`}
            placeholder="chris@portal.dev"
            aria-required="true"
            aria-invalid={!!formErrors.email_or_username}
            aria-describedby={
              formErrors.email_or_username ? 'email-error' : undefined
            }
            autoComplete="username"
            disabled={loading}
          />
          {formErrors.email_or_username && (
            <span
              id="email-error"
              className="form-error"
              role="alert"
            >
              {formErrors.email_or_username}
            </span>
          )}
        </div>
        
        {/* Password field */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${
                formErrors.password ? 'form-input-error' : ''
              }`}
              placeholder="Enter your password"
              aria-required="true"
              aria-invalid={!!formErrors.password}
              aria-describedby={formErrors.password ? 'password-error' : undefined}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={loading}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <span
              id="password-error"
              className="form-error"
              role="alert"
            >
              {formErrors.password}
            </span>
          )}
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
        
        {/* Test credentials hint (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-hint">
            <p>Test credentials:</p>
            <code>chris@portal.dev / Chris@123!</code>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;