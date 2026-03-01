/**
 * User Profile Component
 * 
 * Displays user information and allows profile editing.
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setUser } from '../../store/authSlice';
import api from '../../services/api';
import Button from '../Common/Button';
import Input from '../Common/Input';

const UserProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await api.patch('/api/users/me', formData);
      dispatch(setUser(response.data));
      setSuccess(true);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    });
    setIsEditing(false);
    setError(null);
  };
  
  if (!user) {
    return <div>Loading user data...</div>;
  }
  
  return (
    <div className="user-profile card">
      <div className="card-header">
        <h2>Profile</h2>
        {!isEditing && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
      
      <div className="card-body">
        {success && (
          <div className="alert alert-success" role="alert">
            Profile updated successfully!
          </div>
        )}
        
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <Input
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter first name"
            />
            
            <Input
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter last name"
            />
            
            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="profile-field">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            
            <div className="profile-field">
              <label>Username</label>
              <p>{user.username}</p>
            </div>
            
            <div className="profile-field">
              <label>Full Name</label>
              <p>
                {user.first_name || user.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : 'Not set'}
              </p>
            </div>
            
            <div className="profile-field">
              <label>Role</label>
              <p className="role-badge">{user.role}</p>
            </div>
            
            <div className="profile-field">
              <label>Account Status</label>
              <p className={user.is_active ? 'status-active' : 'status-inactive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;