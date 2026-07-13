const express = require('express');
const router = express.Router();
const { searchUsers, getUserById } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { User, Friend, FriendRequest } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { areFriends } = require('../utils/friendship');
const { getPrivacySettings, isPrivateProfile, canViewPosts, canViewCourses, canViewFriendsList } = require('../utils/privacy');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create the multer instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Search users route
router.get('/search', authMiddleware, (req, res, next) => {
  console.log('Search route hit with query:', req.query);
  console.log('Authenticated user:', req.user);
  searchUsers(req, res).catch(next);
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { resolveUserRole, serializeUser } = require('../utils/authResponse');
    const role = await resolveUserRole(user);
    res.json(serializeUser(user, role));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, department, bio } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username && username.trim() !== user.username) {
      const taken = await User.findOne({
        where: { username: username.trim(), id: { [Op.ne]: userId } },
      });
      if (taken) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username.trim();
    }

    if (department !== undefined) user.department = department;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const { resolveUserRole, serializeUser } = require('../utils/authResponse');
    const role = await resolveUserRole(user);
    const privacy = getPrivacySettings(user);
    res.json({
      ...serializeUser(user, role),
      privacySettings: privacy,
      isPrivate: isPrivateProfile(user),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Update privacy settings
router.put('/privacy', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const current = getPrivacySettings(user);
    const next = { ...current };

    if (req.body.isPrivate !== undefined) {
      next.profileVisibility = req.body.isPrivate ? 'private' : 'public';
    }
    if (req.body.profileVisibility) {
      next.profileVisibility = req.body.profileVisibility;
    }
    if (req.body.searchable !== undefined) {
      next.searchable = Boolean(req.body.searchable);
    }
    if (req.body.showCourses !== undefined) {
      next.showCourses = Boolean(req.body.showCourses);
    }
    if (req.body.showFriendsList !== undefined) {
      next.showFriendsList = Boolean(req.body.showFriendsList);
    }

    user.privacySettings = next;
    await user.save();

    res.json({
      message: 'Privacy settings updated',
      privacySettings: next,
      isPrivate: next.profileVisibility === 'private' || next.profileVisibility === 'friends',
    });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ message: 'Error updating privacy settings' });
  }
});

// Get own privacy settings
router.get('/privacy', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const privacy = getPrivacySettings(user);
    res.json({
      privacySettings: privacy,
      isPrivate: isPrivateProfile(user),
    });
  } catch (error) {
    console.error('Error fetching privacy:', error);
    res.status(500).json({ message: 'Error fetching privacy settings' });
  }
});

// Upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    await User.update(
      { avatar: avatarPath, avatarUrl: avatarPath },
      { where: { id: userId } }
    );
    
    console.log(`Updated avatar for user ${userId} to ${avatarPath}`);
    
    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      avatarUrl: avatarPath,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error uploading avatar', error: error.message });
  }
});

// Get user by ID - this must be the last route to avoid conflicts with other routes
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const viewerId = req.user.id;

    const user = await User.findByPk(targetId, {
      attributes: [
        'id',
        'username',
        'email',
        'department',
        'bio',
        'avatar',
        'avatarUrl',
        'privacySettings',
        'createdAt',
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const privacy = getPrivacySettings(user);
    const isOwn = Number(viewerId) === targetId;
    const friends = await areFriends(viewerId, targetId);

    let friendshipStatus = friends ? 'accepted' : 'none';
    let requestId = null;

    if (!isOwn && !friends) {
      const incoming = await FriendRequest.findOne({
        where: { senderId: targetId, receiverId: viewerId, status: 'pending' },
      });
      const outgoing = await FriendRequest.findOne({
        where: { senderId: viewerId, receiverId: targetId, status: 'pending' },
      });
      if (incoming) {
        friendshipStatus = 'incoming';
        requestId = incoming.id;
      } else if (outgoing) {
        friendshipStatus = 'pending';
      }
    }

    const postsVisible = await canViewPosts(viewerId, user);
    const coursesVisible = await canViewCourses(viewerId, user);
    const friendsVisible = await canViewFriendsList(viewerId, user);

    let friendsPreview = [];
    let friendsCount = 0;
    if (friendsVisible) {
      const friendRows = await Friend.findAll({
        where: { userId: targetId },
        include: [{
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'avatar', 'avatarUrl', 'department', 'bio'],
        }],
        limit: 50,
      });
      const mutual = [];
      for (const row of friendRows) {
        const reciprocal = await Friend.findOne({
          where: { userId: row.friendId, friendId: targetId },
        });
        if (reciprocal && row.friend) mutual.push(row.friend);
      }
      friendsPreview = mutual;
      friendsCount = mutual.length;
    } else {
      // Still return count only for owner stats? For strangers on private, hide count.
      if (isOwn || friends || !isPrivateProfile(user)) {
        const countRows = await Friend.findAll({
          where: { userId: targetId },
          attributes: ['friendId'],
        });
        let n = 0;
        for (const row of countRows) {
          const reciprocal = await Friend.findOne({
            where: { userId: row.friendId, friendId: targetId },
          });
          if (reciprocal) n += 1;
        }
        friendsCount = n;
      }
    }

    res.json({
      id: user.id,
      username: user.username,
      email: isOwn || friends ? user.email : undefined,
      department: user.department,
      bio: user.bio || '',
      avatar: user.avatar || user.avatarUrl,
      avatarUrl: user.avatarUrl || user.avatar,
      createdAt: user.createdAt,
      isFriend: friends,
      isOwnProfile: isOwn,
      friendshipStatus,
      requestId,
      isPrivate: isPrivateProfile(user),
      privacySettings: isOwn
        ? privacy
        : {
            profileVisibility: privacy.profileVisibility,
            showFriendsList: privacy.showFriendsList,
          },
      canViewPosts: postsVisible,
      canViewCourses: coursesVisible,
      canViewFriends: friendsVisible,
      friends: friendsVisible ? friendsPreview : [],
      friendsCount: friendsVisible || isOwn ? friendsCount : null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

module.exports = router;
