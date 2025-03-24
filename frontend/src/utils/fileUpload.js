import api from './axios';
import { message } from 'antd';

/**
 * Handles uploading an avatar image for a user
 * @param {File} file - The image file to upload
 * @param {Function} onSuccess - Callback when upload is successful
 * @param {Function} onError - Callback when upload fails
 * @param {Function} onProgress - Callback for upload progress
 */
export const uploadUserAvatar = async (file, onSuccess, onError, onProgress) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed!');
      if (onError) onError(new Error('Only image files are allowed!'));
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      message.error('Image must be smaller than 2MB!');
      if (onError) onError(new Error('Image must be smaller than 2MB!'));
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log('Starting avatar upload:', file.name);
    
    // Upload the file
    const response = await api.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent: percentCompleted });
        }
      }
    });
    
    console.log('Avatar upload successful:', response.data);
    
    if (onSuccess) onSuccess(response.data);
    return response.data;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    message.error(`Upload failed: ${error.response?.data?.message || error.message}`);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * Validates that a file is a valid image
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is valid
 */
export const validateImageFile = (file) => {
  // Check file type
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('You can only upload image files!');
    return false;
  }
  
  // Check file size
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must be smaller than 2MB!');
    return false;
  }
  
  return true;
};

export default {
  uploadUserAvatar,
  validateImageFile
}; 