/**
 * Dashboard Page
 * 
 * Main authenticated view with header, sidebar, and content area.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, setUser } from '../store/authSlice';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import Footer from '../components/Layout/Footer';
import Dashboard from '../components/Dashboard/Dashboard';
import Loader from '../components/Common/Loader';
import api from '../services/api';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [loading, setLoading] = React.useState(!user);
  
  useEffect(() => {
    // Fetch user data if not already loaded
    if (!user) {
      fetchUser();
    }
  }, [user]);
  
  const fetchUser = async () => {
    try {
      const response = await api.get('/api/users/me');
      dispatch(setUser(response.data));
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="page-loader">
        <Loader size="large" message="Loading dashboard..." />
      </div>
    );
  }
  
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-main">
        <Sidebar />
        <main className="dashboard-content">
          <Dashboard />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;