const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for stories if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
const storiesDir = path.join(uploadsDir, 'stories');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(storiesDir)) {
  fs.mkdirSync(storiesDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storiesDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'story-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images and videos
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Create the multer instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size (videos can be large)
  }
});

// GET /api/stories - Get all stories from friends and self
router.get('/', authMiddleware, storyController.getStories);

// POST /api/stories - Create a new story
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Create media URL
    const mediaUrl = `/uploads/stories/${req.file.filename}`;
    
    // Add the media URL and type to the request body
    req.body.mediaUrl = mediaUrl;
    req.body.mediaType = mediaType;
    
    // Forward to the controller
    storyController.createStory(req, res);
  } catch (error) {
    console.error('Error uploading story media:', error);
    res.status(500).json({ message: 'Error uploading story media', error: error.message });
  }
});

// DELETE /api/stories/:id - Delete a story
router.delete('/:id', authMiddleware, storyController.deleteStory);

// PUT /api/stories/:id/like - Like a story
router.put('/:id/like', authMiddleware, storyController.likeStory);

module.exports = router; 