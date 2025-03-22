const { Post, User, Comment, Like, Friend } = require('../models');
const { Op } = require('sequelize');
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
      const { caption } = req.body;
      const userId = req.user.id;
    
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
      caption,
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
    
    // Add current user to see their own posts
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
      const { content } = req.body;
      const userId = req.user.id;

    console.log('Adding comment to post:', postId, 'by user:', userId);
    console.log('Comment content:', content);
    
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
    
    const posts = await Post.findAll({
      where: { userId },
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
    
    const generateSamplePosts = () => {
      console.log('Generating sample posts for new users');
      
      return [
        {
          id: 999901,
          caption: 'Welcome to Campus Hub! Connect with fellow students, share your academic journey, and discover campus events.',
          mediaUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          mediaType: 'image',
          userId: 999901,
          likesCount: 42,
          commentsCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 999901,
            username: 'campus_official',
            avatar: 'https://images.unsplash.com/photo-1572965733194-784e4b4efa45?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
          },
          comments: [
            {
              id: 99991,
              content: 'Excited to be part of this community!',
              user: {
                id: 999902,
                username: 'john_doe',
                avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
              }
            }
          ],
          isLiked: false
        },
        {
          id: 999902,
          caption: 'Check out the latest campus events and activities. Don\'t miss out!',
          mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          mediaType: 'image',
          userId: 999903,
          likesCount: 38,
          commentsCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 999903,
            username: 'campus_events',
            avatar: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
          },
          comments: [
            {
              id: 99992,
              content: 'Looking forward to the science fair!',
              user: {
                id: 999904,
                username: 'emily_science',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
              }
            }
          ],
          isLiked: false
        }
      ];
    };
    
    // Always return sample posts for now to help with testing
    // This ensures the UI always shows something even if database is empty
    return res.json(generateSamplePosts());
    
    /*
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
    
    // Add current user to exclude their posts as well
    friendIds.push(userId);
    
    console.log('Excluding posts from user and friends:', friendIds);
    
    // Get posts from non-friends
    const posts = await Post.findAll({
      where: {
        userId: {
          [Op.notIn]: friendIds
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
          limit: 2 // Only include a few comments for recommended posts
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10 // Limit to 10 recommended posts
    });
    
    console.log('Found recommended posts:', posts.length);
    
    // If no posts found, return sample posts
    if (posts.length === 0) {
      return res.json(generateSamplePosts());
    }
    
    // Format posts for frontend
    const formattedPosts = posts.map(post => {
      const postData = post.toJSON();
      
      // For compatibility with frontend expecting mediaUrl
      if (postData.imageUrl) {
        postData.mediaUrl = postData.imageUrl;
        // Detect if it's a video based on file extension
        postData.mediaType = postData.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
      }
      
      return {
        ...postData,
        isLiked: false // Default for recommended posts
      };
    });
    
    res.json(formattedPosts);
    */
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