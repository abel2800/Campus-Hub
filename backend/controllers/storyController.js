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

// Get stories from friends
const getFriendsStories = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting stories for user:', userId);
    
    // Get friend IDs
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { userId: userId },
          { friendId: userId }
        ]
      }
    });
    
    const friendIds = friends.map(friend => 
      friend.userId === userId ? friend.friendId : friend.userId
    );
    
    // Add current user to see their own stories
    friendIds.push(userId);
    
    console.log('Getting stories for user and friends:', friendIds);
    
    // Get stories from friends that haven't expired
    const stories = await Story.findAll({
      where: {
        userId: {
          [Op.in]: friendIds
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
    
    console.log('Found stories:', stories.length);
    res.json(stories);
  } catch (error) {
    console.error('Get friends stories error:', error);
    res.status(500).json({ message: 'Failed to fetch stories', error: error.message });
  }
};

// Create a new story
const createStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'image' } = req.body;
    
    console.log('Creating story for user:', userId);
    console.log('Story type:', type);
    console.log('File:', req.file);
    
    // Handle file upload
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    
    const mediaUrl = `/uploads/stories/${req.file.filename}`;
    console.log('Media URL:', mediaUrl);
    
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const story = await Story.create({
      userId,
      mediaUrl,
      type,
      expiresAt
    });
    
    console.log('Story created:', story.id);
    
    // Return the story with user data
    const storyWithUser = await Story.findByPk(story.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    res.status(201).json(storyWithUser);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Failed to create story', error: error.message });
  }
};

// Get a specific story
const getStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const story = await Story.findByPk(storyId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    res.json(story);
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ message: 'Failed to fetch story' });
  }
};

// Like a story
const likeStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    
    // Update the story to indicate like (this is simplified - normally would have a StoryLikes table)
    // For this example we're just returning success
    
    res.json({ success: true, message: 'Story liked successfully' });
  } catch (error) {
    console.error('Like story error:', error);
    res.status(500).json({ message: 'Failed to like story' });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    
    const story = await Story.findByPk(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Check if the user owns the story
    if (story.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }
    
    await story.destroy();
    
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Failed to delete story' });
  }
};

module.exports = {
  getFriendsStories,
  createStory,
  getStory,
  likeStory,
  deleteStory,
  upload
}; 