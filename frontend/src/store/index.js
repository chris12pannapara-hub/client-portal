/**
 * Redux Store Configuration
 * 
 * Combines all slices and configures the Redux store.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values (like tokens)
    }),
});

export default store;