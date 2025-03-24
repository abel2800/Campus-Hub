const { Story, User, Friend } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/stories');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for story uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const mimetype = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  }
});

// Get all stories from friends and user's own stories
const getStories = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current user's friends + the user's own ID
    const friendQuery = `
      SELECT "friendId" as id FROM "Friends" WHERE "userId" = :userId
      UNION
      SELECT "userId" as id FROM "Friends" WHERE "friendId" = :userId
      UNION
      SELECT :userId as id
    `;
    
    const friendIds = await Story.sequelize.query(friendQuery, {
      replacements: { userId },
      type: Story.sequelize.QueryTypes.SELECT,
      raw: true
    });
    
    const userIds = friendIds.map(friend => friend.id);
    
    // Get all stories from these users that haven't expired
    const stories = await Story.findAll({
      where: {
        userId: {
          [Op.in]: userIds
        },
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Error fetching stories', error: error.message });
  }
};

// Create a new story
const createStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mediaUrl, mediaType = 'image', caption } = req.body;
    
    // Validate required fields
    if (!mediaUrl) {
      return res.status(400).json({ message: 'Media URL is required' });
    }
    
    // Create story with expiration 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const story = await Story.create({
      userId,
      mediaUrl,
      mediaType,
      caption,
      expiresAt
    });
    
    // Get the created story with user information
    const createdStory = await Story.findByPk(story.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.status(201).json(createdStory);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Error creating story', error: error.message });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;
    
    const story = await Story.findByPk(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Check if user owns the story
    if (story.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }
    
    await story.destroy();
    
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Error deleting story', error: error.message });
  }
};

// Like a story
const likeStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = req.params.id;
    
    const story = await Story.findByPk(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Increment likes
    story.likes += 1;
    await story.save();
    
    res.json({ message: 'Story liked successfully', likes: story.likes });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({ message: 'Error liking story', error: error.message });
  }
};

module.exports = {
  getStories,
  createStory,
  deleteStory,
  likeStory
}; 