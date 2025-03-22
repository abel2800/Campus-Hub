import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeacherHomePage from './TeacherHomePage';
import CourseCreation from './CourseCreation';
import CourseEdit from './CourseEdit';
import CourseView from './CourseView';
import CourseVideoUpload from './CourseVideoUpload';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../AppLayout';
import { Spin, Alert } from 'antd';

const TeacherApp = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('TeacherApp RENDER START - Path:', location.pathname);
  
  useEffect(() => {
    // Log that TeacherApp has mounted and the current user
    console.log('TeacherApp mounted', { 
      user,
      username: user?.username,
      role: user?.role,
      currentPath: location.pathname
    });
    
    // Simulate delay to ensure components are properly loaded
    const timer = setTimeout(() => {
      console.log('TeacherApp loading timeout complete');
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, location]);

  // Handle case when user object is not properly loaded
  if (!user && !loading) {
    console.error('TeacherApp: User object is missing');
    return (
      <div style={{ padding: 20 }}>
        <Alert
          message="Authentication Error"
          description="Could not load user information. Please try logging in again."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    console.log('TeacherApp: Still loading...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading Teacher Dashboard...</div>
      </div>
    );
  }

  console.log('Current teacher route path:', location.pathname);

  // Render the appropriate component based on path
  const renderContent = () => {
    const path = location.pathname;
    console.log('Rendering content for path:', path);
    
    // Home/Default routes
    if (path === '/teacher' || path === '/teacher/') {
      console.log('Redirecting to /teacher/home');
      return <Navigate to="/teacher/home" replace />;
    }
    
    if (path === '/teacher/home') {
      console.log('Rendering TeacherHomePage');
      return <TeacherHomePage />;
    }
    
    // Course creation route
    if (path === '/teacher/create-course') {
      console.log('Rendering CourseCreation');
      return <CourseCreation />;
    }
    
    // Course specific routes with ID
    const courseViewMatch = path.match(/^\/teacher\/courses\/(\d+)$/);
    if (courseViewMatch) {
      const courseId = courseViewMatch[1];
      console.log('Course view route matched with ID:', courseId);
      // Pass courseId as a prop to ensure it's available
      return <CourseView key={courseId} courseId={courseId} />;
    }
    
    const courseEditMatch = path.match(/^\/teacher\/courses\/(\d+)\/edit$/);
    if (courseEditMatch) {
      const courseId = courseEditMatch[1];
      console.log('Course edit route matched with ID:', courseId);
      return <CourseEdit key={courseId} courseId={courseId} />;
    }
    
    const videoUploadMatch = path.match(/^\/teacher\/courses\/(\d+)\/videos$/);
    if (videoUploadMatch) {
      const courseId = videoUploadMatch[1];
      console.log('Video upload route matched with ID:', courseId);
      return <CourseVideoUpload key={courseId} courseId={courseId} />;
    }
    
    // Fallback - return to teacher home
    console.log('No route matched, redirecting to /teacher/home');
    return <Navigate to="/teacher/home" replace />;
  };
  
  return (
    <AppLayout>
      <ErrorBoundary>
        {renderContent()}
      </ErrorBoundary>
    </AppLayout>
  );
};

// ErrorBoundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <Alert
            message="Error Loading Component"
            description={`Something went wrong. ${this.state.error?.message || 'Please try again later.'}`}
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Export ErrorBoundary for use in other components
export { ErrorBoundary };
export default TeacherApp; 