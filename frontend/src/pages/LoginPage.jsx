/**
 * Login Page
 * 
 * Full-page login view with centered form.
 */

import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-page-background"></div>
      <div className="login-page-content">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;