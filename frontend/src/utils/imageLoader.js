/**
 * An image cache to prevent reloading of already loaded images
 * @type {Object}
 */
const imageCache = {};

/**
 * Preloads an image by creating an Image object and setting its src
 * 
 * @param {string} src - The image URL to preload
 * @returns {Promise} - A promise that resolves when the image is loaded
 */
export const preloadImage = (src) => {
  // If the source doesn't exist or isn't valid, reject immediately
  if (!src || typeof src !== 'string') {
    return Promise.reject(new Error('Invalid image source'));
  }
  
  // If we've already loaded this image, return the cached promise
  if (imageCache[src]) {
    return imageCache[src];
  }
  
  // Create a new promise for loading this image
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Image loaded successfully
      imageCache[src] = Promise.resolve(img);
      resolve(img);
    };
    img.onerror = (error) => {
      // Image failed to load
      console.error(`Failed to load image: ${src}`, error);
      delete imageCache[src];
      reject(error);
    };
    img.src = src;
  });
  
  // Store the promise in the cache
  imageCache[src] = promise;
  
  return promise;
};

/**
 * Preloads multiple images in parallel
 * 
 * @param {Array<string>} sources - Array of image URLs to preload
 * @returns {Promise} - A promise that resolves when all images are loaded
 */
export const preloadImages = (sources) => {
  if (!Array.isArray(sources)) {
    return Promise.reject(new Error('Sources must be an array'));
  }
  
  // Filter out invalid sources
  const validSources = sources.filter(src => src && typeof src === 'string');
  
  // Map each source to a preloadImage promise
  const promises = validSources.map(src => {
    return preloadImage(src)
      .catch(error => {
        // Don't fail the whole batch if one image fails to load
        console.warn(`Failed to preload ${src}:`, error);
        return null;
      });
  });
  
  // Return a promise that resolves when all images are loaded
  return Promise.all(promises);
};

/**
 * Clears the image cache
 */
export const clearImageCache = () => {
  Object.keys(imageCache).forEach(key => {
    delete imageCache[key];
  });
};

/**
 * Gets information about the image cache
 * 
 * @returns {Object} - Information about the image cache
 */
export const getImageCacheInfo = () => {
  return {
    size: Object.keys(imageCache).length,
    urls: Object.keys(imageCache)
  };
};

/**
 * Checks if an image is already cached
 * 
 * @param {string} src - The image URL to check
 * @returns {boolean} - Whether the image is cached
 */
export const isImageCached = (src) => {
  return !!imageCache[src];
}; 