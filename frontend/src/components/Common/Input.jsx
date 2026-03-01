/**
 * Reusable Input Component
 * 
 * Props:
 * - label: string
 * - type: string
 * - name: string
 * - value: string
 * - onChange: function
 * - error: string
 * - placeholder: string
 * - required: boolean
 * - disabled: boolean
 */

import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  ...props
}) => {
  const inputId = `input-${name}`;
  const errorId = `${inputId}-error`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-mark" aria-label="required">*</span>}
        </label>
      )}
      
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;