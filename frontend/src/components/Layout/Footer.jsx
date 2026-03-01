/**
 * Footer Component
 * 
 * Displays copyright and app version.
 */

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {currentYear} Client Portal. All rights reserved.
        </p>
        <p className="footer-version">Version {appVersion}</p>
      </div>
    </footer>
  );
};

export default Footer;