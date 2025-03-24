import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LandingPage from './components/LandingPage';
import CreateAccount from './components/CreateAccount';
import DashboardPage from './components/DashboardPage';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Chat from './components/ChatPage';
import SocialMediaPage from './components/SocialMediaPage';
import Friends from './components/Friends';
import Profile from './components/ProfilePage';
import Settings from './components/Settings';
import Courses from './components/Courses';
import MyCourses from './components/MyCourses';
import CourseDetailPage from './components/CourseDetail';
import CourseAnalytics from './components/CourseAnalytics';
import CourseManagement from './components/CourseManagement';
import HomePage from './components/HomePage';
import { SocketProvider } from './contexts/SocketContext';
import AppLayout from './components/AppLayout';
import TeacherApp from './components/teacher/TeacherApp';
import TeacherRegistration from './pages/TeacherRegistration';
import LoginPage from './components/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import { Spin } from 'antd';

// App with Router
function App() {
  return (
    <Router>
      <ConfigProvider>
        <Routes>
          <Route path="/*" element={<AppWithProviders />} />
        </Routes>
      </ConfigProvider>
    </Router>
  );
}

// Component with providers
function AppWithProviders() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

// Routes component that uses location
function AppRoutes() {
  const { isAuthenticated, isTeacher, loading, logout, user } = useAuth();
  const location = useLocation();
  
  // Check if the path is a public route
  const isPublicRoute = ['/', '/login', '/create-account', '/teacher-registration'].includes(location.pathname);
  
  // Check if it's a teacher-specific route (but not shared functionality like social media)
  const isTeacherRoute = location.pathname.startsWith('/teacher') && 
    !location.pathname.includes('/social-media') && 
    !location.pathname.includes('/friends') && 
    !location.pathname.includes('/chat') && 
    !location.pathname.includes('/profile');
  
  // Check if it's a shared functionality route
  const isSharedRoute = ['/social-media', '/friends', '/chat', '/profile'].some(path => 
    location.pathname.startsWith(path)
  );
  
  // Show loading indicator while checking auth state
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
  
  // If at root path, show landing page regardless of auth state
  if (location.pathname === '/') {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }
  
  // If already authenticated and trying to access login, redirect based on role
  if (isAuthenticated && location.pathname === '/login') {
    return isTeacher() ? <Navigate to="/teacher" replace /> : <Navigate to="/home" replace />;
  }
  
  // Handle teacher-specific routes
  if (isTeacherRoute) {
    console.log("Teacher route detected:", location.pathname);
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    // If not a teacher, redirect to home
    if (!isTeacher()) {
      console.log("User is not a teacher, redirecting to home");
      return <Navigate to="/home" replace />;
    }
    
    // Log information about route paths
    console.log("Rendering TeacherApp with path:", location.pathname);
    console.log("User:", user?.username, "Role:", user?.role);
    
    // Return TeacherApp component
    return <TeacherApp />;
  }
  
  // Handle shared functionality routes for authenticated users
  if (isSharedRoute) {
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    // Return the appropriate component based on the route
    return (
      <AppLayout>
        <Routes>
          <Route path="/social-media" element={<SocialMediaPage />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </AppLayout>
    );
  }
  
  // Show public routes or private routes based on authentication
  return (
    <>
      {isPublicRoute ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/teacher-registration" element={<TeacherRegistration />} />
        </Routes>
      ) : (
        isAuthenticated ? (
          // If user is a teacher and trying to access a student route, redirect to teacher homepage
          isTeacher() && location.pathname === '/home' ? (
            <Navigate to="/teacher" replace />
          ) : (
            <AppLayout>
              <Routes>
                <Route path="/home" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/social-media" element={<SocialMediaPage />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/my-courses" element={isTeacher() ? <Navigate to="/home" replace /> : <MyCourses />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/courses/:courseId/analytics" element={<CourseAnalytics />} />
                <Route path="/course-management" element={<CourseManagement />} />
                <Route path="*" element={
                  isTeacher() ? <Navigate to="/teacher" replace /> : <Navigate to="/home" replace />
                } />
              </Routes>
            </AppLayout>
          )
        ) : (
          <Navigate to="/" replace />
        )
      )}
    </>
  );
}

export default App;