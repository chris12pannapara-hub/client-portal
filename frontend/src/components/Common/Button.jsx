/**
 * Reusable Button Component
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 * - size: 'small' | 'medium' | 'large'
 * - disabled: boolean
 * - loading: boolean
 * - onClick: function
 * - children: button content
 */

import React from 'react';

const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true"></span>}
      {children}
    </button>
  );
};

export default Button;