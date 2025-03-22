import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/login', values);
      
      // Check if login was successful
      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Check if user is a teacher and redirect accordingly
        if (response.data.user.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/');
        }
        
        message.success('Login successful!');
      }
    } catch (error) {
      console.log('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default LoginForm; 