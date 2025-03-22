const express = require('express');
const router = express.Router();
const chatRoutes = require('./chatRoutes');
const authMiddleware = require('../middleware/authMiddleware');

// Apply CORS middleware if needed
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount chat routes with authentication
router.use('/chats', authMiddleware, chatRoutes);

module.exports = router; 