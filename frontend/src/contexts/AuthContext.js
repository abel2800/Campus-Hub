import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setLoading(true);
        
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Check if we should auto-login (used by landing page logic)
        const shouldAutoLogin = localStorage.getItem('autoLogin');
        
        // Only auto login if explicitly set
        if (shouldAutoLogin !== 'true') {
          // Clear stored credentials since we don't want auto-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
        
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Load stored user data
        const storedUserData = localStorage.getItem('user');
        
        if (storedUserData) {
          let userData = JSON.parse(storedUserData);
          
          // If role is missing, add it based on username
          if (!userData.role) {
            const isTeacherUser = userData.username && userData.username.toLowerCase().includes('teacher');
            userData = {
              ...userData,
              role: isTeacherUser ? 'teacher' : 'student'
            };
            
            // Update the stored user data with role
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          // Set user with role in state
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear any possibly corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('autoLogin');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await axios.post('/api/auth/login', credentials);
      
      console.log('Login response:', response.data);
      
      // Extract data from response - check if token is in the root or in user object
      const token = response.data.token || (response.data.user && response.data.user.token);
      const userData = response.data.user || response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Check if the user is a teacher by username - temporary solution until backend adds roles
      // This is a workaround because the backend doesn't provide role information
      const isTeacherUser = userData.username && userData.username.toLowerCase().includes('teacher');
      
      // Add role information to user data
      const userWithRole = {
        ...userData,
        role: isTeacherUser ? 'teacher' : 'student'
      };
      
      // Store user data and token in localStorage
      localStorage.setItem('user', JSON.stringify(userWithRole));
      localStorage.setItem('token', token);
      
      // Set user in state
      setUser(userWithRole);
      
      // Configure axios to use the token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Login successful, token set in axios headers');
      console.log('User role determined as:', userWithRole.role);
      
      setIsAuthenticated(true);
      
      return userWithRole; // Return user data with added role for role checking
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove user data and token from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('autoLogin');
    
    // Remove token from axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user from state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to landing page
    window.location.href = '/';
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => {
      const newUserData = { ...prev, ...updatedUserData };
      // Save updated user data to localStorage
      localStorage.setItem('user', JSON.stringify(newUserData));
      return newUserData;
    });
  };

  const isTeacher = () => {
    // If no user is logged in, they're not a teacher
    if (!user) return false;
    
    // If user has a role property, check it
    if (user.role) {
      return user.role === 'teacher';
    }
    
    // Fallback: check username for 'teacher' as a basic heuristic
    return user.username && user.username.toLowerCase().includes('teacher');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isTeacher
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext; 