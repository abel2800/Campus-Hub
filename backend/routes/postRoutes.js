const express = require('express');
const router = express.Router();
const { postController, upload } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new post
router.post('/', upload.single('media'), postController.createPost);

// Get feed posts
router.get('/feed', postController.getFeed);

// Get user posts
router.get('/user/:userId', postController.getUserPosts);

// Like/unlike a post
router.post('/:postId/like', postController.likePost);
router.delete('/:postId/unlike', postController.likePost);

// Add comment to a post
router.post('/:postId/comment', postController.addComment);

// Save/unsave post
router.post('/:postId/save', postController.savePost);
router.delete('/:postId/unsave', postController.unsavePost);

// Delete a post
router.delete('/:postId', postController.deletePost);

// Get recommended posts
router.get('/recommended', auth, postController.getRecommendedPosts);

module.exports = router; 