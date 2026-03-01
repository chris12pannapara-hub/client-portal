/**
 * useAuth Hook
 * 
 * Provides authentication-related functions and state.
 */

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  setUser,
  selectAuth,
} from '../store/authSlice';
import api from '../services/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  
  const login = async (credentials) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/api/auth/login', credentials);
      dispatch(loginSuccess(response.data));
      
      // Fetch user profile
      const userResponse = await api.get('/api/users/me');
      dispatch(setUser(userResponse.data));
      
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Login failed';
      dispatch(loginFailure(errorMessage));
      return { success: false, error: errorMessage };
    }
  };
  
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  };
  
  return {
    ...auth,
    login,
    logout,
  };
};