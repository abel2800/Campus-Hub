const { Post, User, Comment, Like, Friend } = require('../models');
const { Op } = require('sequelize');
const { getMutualFriendIds } = require('../utils/friendship');
const { canViewPosts } = require('../utils/privacy');
const { rejectIfSensitive, normalizeText } = require('../utils/contentModeration');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
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
    // Allow both images and videos
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|avi|webp/i;
    const mimetype = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  }
});

// Create a new post
const createPost = async (req, res) => {
    try {
      const caption = normalizeText(req.body.caption);
      const userId = req.user.id;

      if (rejectIfSensitive(res, caption, 'caption')) return;
    
    // Handle media upload - store in imageUrl field
      let imageUrl = null;

      if (req.file) {
        imageUrl = `/uploads/posts/${req.file.filename}`;
      console.log('File uploaded:', req.file);
      console.log('Image URL:', imageUrl);
      }

    console.log('Creating post with caption:', caption);
    console.log('User ID:', userId);
    
    // IMPORTANT: Only include fields that exist in the actual database
    // Do NOT include mediaType, mediaUrl, or thumbnailUrl as they don't exist in the database
      const post = await Post.create({
      caption: caption || null,
      imageUrl,
        userId,
      likesCount: 0,
      commentsCount: 0
    });
    
    console.log('Post created successfully:', post.id);
    
    // Get the post with user data
    const postWithUser = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'user',
          attributes: ['id', 'username', 'avatar']
          }
        ]
      });

    // Convert to JSON and add virtual fields for frontend
    const postJSON = postWithUser.toJSON();
    
    // For compatibility with frontend, add derived fields but don't save to database
    if (postJSON.imageUrl) {
      postJSON.mediaUrl = postJSON.imageUrl;
      postJSON.mediaType = postJSON.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
    }
    
    res.status(201).json(postJSON);
    } catch (error) {
      console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Get posts for feed (from user and friends)
const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting feed for user:', userId);

    const friendIds = await getMutualFriendIds(userId);
    friendIds.push(userId);

    console.log('Getting posts for user and friends:', friendIds);
    
    // Get posts from friends and user
      const posts = await Post.findAll({
      where: {
        userId: {
          [Op.in]: friendIds
        }
      },
      attributes: ['id', 'caption', 'imageUrl', 'userId', 'likesCount', 'commentsCount', 'createdAt', 'updatedAt'],
        include: [
          {
            model: User,
            as: 'user',
          attributes: ['id', 'username', 'avatar']
          },
          {
            model: Comment,
            as: 'comments',
            include: [
              {
                model: User,
                as: 'user',
              attributes: ['id', 'username', 'avatar']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

    console.log('Found posts:', posts.length);
    
    // Check if user has liked each post
    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      const isLiked = await Like.findOne({
        where: { postId: post.id, userId }
      });
      
      // Convert to proper format for frontend
      const postData = post.toJSON();
      
      // For compatibility with frontend expecting mediaUrl
      if (postData.imageUrl) {
        postData.mediaUrl = postData.imageUrl;
        // Detect if it's a video based on file extension
        postData.mediaType = postData.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
      }
      
      return {
        ...postData,
        isLiked: !!isLiked
      };
    }));
    
    res.json(postsWithLikeStatus);
    } catch (error) {
      console.error('Get feed error:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
    }
};

// Like/unlike a post
const likePost = async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

    console.log('Liking post:', postId, 'by user:', userId);
    
    // For sample posts (ID >= 999900), simulate like
    if (postId >= 999900) {
      return res.json({ liked: true, likesCount: 43 });
    }
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if already liked
      const existingLike = await Like.findOne({
        where: { postId, userId }
      });

      if (existingLike) {
      // Unlike
        await existingLike.destroy();
      await post.update({ likesCount: post.likesCount - 1 });
      return res.json({ liked: false, likesCount: post.likesCount - 1 });
      } else {
      // Like
        await Like.create({ postId, userId });
      await post.update({ likesCount: post.likesCount + 1 });
      return res.json({ liked: true, likesCount: post.likesCount + 1 });
      }
    } catch (error) {
      console.error('Like post error:', error);
    res.status(500).json({ message: 'Failed to like/unlike post', error: error.message });
    }
};

// Add comment to a post
const addComment = async (req, res) => {
    try {
      const { postId } = req.params;
      const content = normalizeText(req.body.content);
      const userId = req.user.id;

    console.log('Adding comment to post:', postId, 'by user:', userId);
    console.log('Comment content:', content);

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    if (rejectIfSensitive(res, content, 'content')) return;
    
    // For sample posts (ID >= 999900), simulate comment
    if (parseInt(postId) >= 999900) {
      return res.status(201).json({
        id: Math.floor(Math.random() * 10000),
        content,
        postId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          username: req.user.username,
          avatar: req.user.avatar
        }
      });
    }
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create comment
    const comment = await Comment.create({
      content,
      postId,
      userId
    });
    
    // Update comment count
    await post.update({ commentsCount: post.commentsCount + 1 });
    
    // Get comment with user info
    const commentWithUser = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Get user posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const target = await User.findByPk(userId);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowed = await canViewPosts(req.user.id, target);
    if (!allowed) {
      return res.json([]);
    }
    
    const posts = await Post.findAll({
      where: { userId },
      attributes: ['id', 'caption', 'imageUrl', 'userId', 'likesCount', 'commentsCount', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'bio']
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Check if current user has liked each post
    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      const isLiked = await Like.findOne({
        where: { postId: post.id, userId: req.user.id }
      });
      
      // Convert to proper format for frontend
      const postData = post.toJSON();
      
      // For compatibility with frontend expecting mediaUrl
      if (postData.imageUrl) {
        postData.mediaUrl = postData.imageUrl;
        // Detect if it's a video based on file extension
        postData.mediaType = postData.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
      }
      
      return {
        ...postData,
        isLiked: !!isLiked
      };
    }));

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await post.destroy();
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Save/unsave post placeholder
const savePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  res.json({ success: true, message: 'Post saved successfully' });
};

const unsavePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  res.json({ success: true, message: 'Post unsaved successfully' });
};

// Get recommended posts (from users who are not friends)
const getRecommendedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting recommended posts for user:', userId);

    const friendIds = await getMutualFriendIds(userId);
    const excludeIds = [...friendIds, userId];

    const posts = await Post.findAll({
      where: {
        userId: {
          [Op.notIn]: excludeIds.length ? excludeIds : [userId]
        }
      },
      attributes: ['id', 'caption', 'imageUrl', 'userId', 'likesCount', 'commentsCount', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ],
          limit: 2
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const formattedPosts = await Promise.all(posts.map(async (post) => {
      const postData = post.toJSON();
      if (postData.imageUrl) {
        postData.mediaUrl = postData.imageUrl;
        postData.mediaType = postData.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
      }
      const isLiked = await Like.findOne({ where: { postId: post.id, userId } });
      return { ...postData, isLiked: !!isLiked };
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get recommended posts error:', error);
    res.status(500).json({ message: 'Failed to fetch recommended posts', error: error.message });
  }
};

// Export as an object with methods
const postController = {
  createPost,
  getFeed,
  likePost,
  addComment,
  getUserPosts,
  deletePost,
  savePost,
  unsavePost,
  getRecommendedPosts
};

module.exports = { postController, upload }; 