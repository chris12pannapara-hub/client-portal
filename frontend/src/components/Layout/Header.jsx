/**
 * Header Component
 * 
 * Displays app logo, user info, and logout button.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectUser } from '../../store/authSlice';
import NotificationBell from '../Dashboard/NotificationBell';
import api from '../../services/api';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  
  const handleLogout = async () => {
    try {
      // Call logout API
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear Redux state
      dispatch(logout());
      // Redirect to login
      navigate('/login');
    }
  };
  
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <h1>Client Portal</h1>
        </div>
        
        {/* Right side - user info and actions */}
        <div className="header-actions">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* User info */}
          {user && (
            <div className="header-user">
              <span className="user-name">
                {user.first_name || user.username}
              </span>
              <span className="user-role">{user.role}</span>
            </div>
          )}
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-small"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;