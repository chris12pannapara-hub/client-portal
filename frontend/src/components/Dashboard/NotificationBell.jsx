/**
 * Notification Bell Component
 * 
 * Displays unread notification count and opens notification dropdown.
 * Polls for new notifications every 30 seconds.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  setUnreadCount,
  markAsReadSuccess,
  selectNotifications,
  selectUnreadCount,
} from '../../store/notificationSlice';
import api from '../../services/api';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Poll for unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const fetchNotifications = async () => {
    dispatch(fetchNotificationsStart());
    try {
      const response = await api.get('/api/notifications?limit=10');
      dispatch(fetchNotificationsSuccess(response.data));
    } catch (error) {
      dispatch(fetchNotificationsFailure(error.message));
    }
  };
  
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread/count');
      dispatch(setUnreadCount(response.data.unread_count));
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };
  
  const handleMarkAsRead = async (notificationIds) => {
    setLoading(true);
    try {
      await api.patch('/api/notifications/read', {
        notification_ids: notificationIds,
      });
      dispatch(markAsReadSuccess({ notification_ids: notificationIds }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    
    if (unreadIds.length > 0) {
      handleMarkAsRead(unreadIds);
    }
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(); // Refresh notifications when opening
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="notification-bell-button"
        aria-label={`Notifications. ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn-text"
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read ? 'notification-read' : 'notification-unread'
                  }`}
                  role="menuitem"
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatTimestamp(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead([notification.id])}
                      className="notification-mark-read"
                      aria-label="Mark as read"
                      disabled={loading}
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;