import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TeacherApp from '../components/teacher/TeacherApp';
import { Spin, message } from 'antd';

const TeacherPage = () => {
  const { isAuthenticated, isTeacher, loading, user } = useAuth();
  
  useEffect(() => {
    // Log user details for debugging
    console.log('TeacherPage - Auth state:', {
      isAuthenticated,
      isTeacher: isTeacher(), 
      loading, 
      user,
      username: user?.username
    });
    
    // If user is authenticated but not a teacher, show a message
    if (isAuthenticated && !isTeacher() && user) {
      message.error('Access denied. This area is for teachers only.');
    }
  }, [isAuthenticated, user]);
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading...</div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to home if not a teacher
  if (!isTeacher()) {
    console.log('Not a teacher, redirecting to home');
    return <Navigate to="/home" replace />;
  }
  
  console.log('Rendering TeacherApp');
  // Render the teacher app
  return <TeacherApp />;
};

export default TeacherPage; 