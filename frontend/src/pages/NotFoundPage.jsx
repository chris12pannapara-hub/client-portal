/**
 * 404 Not Found Page
 * 
 * Displayed when user navigates to a non-existent route.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate(-1)} variant="ghost">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;