const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for the current user
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Clear a notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/', notificationController.clearAllNotifications);

// Test route to create a sample notification (for development purposes only)
router.post('/test', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'message' } = req.body;
    
    const notification = await notificationController.createNotification(
      userId,
      type,
      `This is a test ${type} notification`,
      userId, // sender is self for testing
      Math.floor(Math.random() * 1000) // random entity ID for testing
    );
    
    res.json({ message: 'Test notification created', notification });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 