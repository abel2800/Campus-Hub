const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Debug: Check if controller methods exist
console.log('Controller methods:', {
  getRecentChats: typeof messageController.getRecentChats,
  getMessages: typeof messageController.getMessages,
  createChat: typeof messageController.createChat,
  sendMessage: typeof messageController.sendMessage
});

// Define routes with explicit error handling
router.get('/recent', authMiddleware, (req, res) => {
  messageController.getRecentChats(req, res);
});

router.get('/:participantId', authMiddleware, (req, res) => {
  messageController.getMessages(req, res);
});

router.post('/create', authMiddleware, (req, res) => {
  messageController.createChat(req, res);
});

router.post('/send', authMiddleware, (req, res) => {
  messageController.sendMessage(req, res);
});

module.exports = router; 