/**
 * useNotifications Hook
 * 
 * Provides notification-related functions and state.
 */

import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  setUnreadCount,
  markAsReadSuccess,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '../store/notificationSlice';
import api from '../services/api';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationsLoading);
  
  /**
   * Fetch notifications from API
   * @param {Object} params - Query parameters (limit, offset, unread_only)
   */
  const fetchNotifications = async (params = {}) => {
    dispatch(fetchNotificationsStart());
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.unread_only) queryParams.append('unread_only', params.unread_only);
      
      const queryString = queryParams.toString();
      const endpoint = `/api/notifications${queryString ? '?' + queryString : ''}`;
      
      const response = await api.get(endpoint);
      dispatch(fetchNotificationsSuccess(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      dispatch(fetchNotificationsFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };
  
  /**
   * Fetch only the unread count (lightweight for polling)
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread/count');
      dispatch(setUnreadCount(response.data.unread_count));
      return { success: true, count: response.data.unread_count };
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Mark one or more notifications as read
   * @param {Array<string>} notificationIds - Array of notification UUIDs
   */
  const markAsRead = async (notificationIds) => {
    try {
      await api.patch('/api/notifications/read', {
        notification_ids: notificationIds,
      });
      dispatch(markAsReadSuccess({ notification_ids: notificationIds }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark as read';
      return { success: false, error: errorMessage };
    }
  };
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    
    if (unreadIds.length === 0) {
      return { success: true, message: 'No unread notifications' };
    }
    
    return await markAsRead(unreadIds);
  };
  
  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};