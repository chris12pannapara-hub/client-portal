/**
 * Loading Spinner Component
 * 
 * Props:
 * - size: 'small' | 'medium' | 'large'
 * - message: string (optional loading message)
 */

import React from 'react';

const Loader = ({ size = 'medium', message }) => {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className={`loader loader-${size}`} aria-hidden="true"></div>
      {message && <p className="loader-message">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;