/**
 * Dashboard Component
 * 
 * Main dashboard content - displays user profile and stats.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import UserProfile from './UserProfile';

const Dashboard = () => {
  const user = useSelector(selectUser);
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.first_name || user?.username}!</h1>
        <p className="dashboard-subtitle">
          Here's what's happening with your account today.
        </p>
      </div>
      
      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3 className="stat-value">Active</h3>
              <p className="stat-label">Account Status</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-content">
              <h3 className="stat-value">{user?.role || 'User'}</h3>
              <p className="stat-label">Role</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3 className="stat-value">{user?.email?.substring(0, 20)}...</h3>
              <p className="stat-label">Email</p>
            </div>
          </div>
        </div>
        
        {/* User Profile Section */}
        <div className="dashboard-section">
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;