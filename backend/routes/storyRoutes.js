const express = require('express');
const router = express.Router();
const {
  getFriendsStories,
  createStory,
  getStory,
  likeStory,
  deleteStory,
  upload
} = require('../controllers/storyController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get stories from friends
router.get('/friends', getFriendsStories);

// Create a new story
router.post('/create', upload.single('media'), createStory);

// Get a specific story
router.get('/:storyId', getStory);

// Like a story
router.post('/:storyId/like', likeStory);

// Delete a story
router.delete('/:storyId', deleteStory);

module.exports = router; 