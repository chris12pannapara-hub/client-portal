/**
 * Notification Redux Slice
 * 
 * Manages notification state:
 * - List of notifications
 * - Unread count
 * - Loading states
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Fetch notifications
    fetchNotificationsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNotificationsSuccess: (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unread_count;
      state.total = action.payload.total;
      state.error = null;
    },
    fetchNotificationsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Update unread count
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    
    // Mark notifications as read
    markAsReadSuccess: (state, action) => {
      const readIds = action.payload.notification_ids;
      state.notifications = state.notifications.map((notif) =>
        readIds.includes(notif.id)
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      );
      state.unreadCount = Math.max(0, state.unreadCount - readIds.length);
    },
    
    // Clear notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.total = 0;
    },
  },
});

export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  setUnreadCount,
  markAsReadSuccess,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) => state.notifications.loading;