import axios from '../utils/axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 errors
      if (error.response.status === 401) {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show error message
        message.error('Session expired. Please login again.');
        
        // Redirect to login page
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
      
      // Handle other errors
      const errorMessage = error.response.data?.message || 'An error occurred';
      message.error(errorMessage);
    } else if (error.request) {
      message.error('Network error. Please check your connection.');
    } else {
      message.error('An error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export const postService = {
  getPosts: async (page = 1, limit = 10) => {
    const response = await axios.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  createPost: async (data) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.media) formData.append('media', data.media);
    
    const response = await axios.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  likePost: async (postId) => {
    const response = await axios.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId) => {
    const response = await axios.delete(`/posts/${postId}/like`);
    return response.data;
  },

  getComments: async (postId) => {
    const response = await axios.get(`/posts/${postId}/comments`);
    return response.data;
  }
};

export const courseService = {
  getCourses: async () => {
    const response = await axios.get('/courses');
    return response.data;
  },

  enrollCourse: async (courseId) => {
    const response = await axios.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  updateProgress: async (courseId, progress) => {
    const response = await axios.put(`/courses/${courseId}/progress`, { progress });
    return response.data;
  }
};

export const messageService = {
  getConversations: async () => {
    const response = await axios.get('/messages/conversations');
    return response.data;
  },

  getMessages: async (userId, page = 1) => {
    const response = await axios.get(`/messages/${userId}?page=${page}`);
    return response.data;
  },

  sendMessage: async (recipientId, content) => {
    const response = await axios.post('/messages/send', { participantId: recipientId, content });
    return response.data;
  }
};

export const userService = {
  updateProfile: async (data) => {
    const response = await axios.put('/users/profile', data);
    return response.data;
  },

  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await axios.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getFriendSuggestions: async () => {
    const response = await axios.get('/users/suggestions');
    return response.data;
  }
};

export default api;
