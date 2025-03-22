const { User, FriendRequest, Friend } = require('../models');
const { Op } = require('sequelize');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

const getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id)
      const user = await User.findByPk(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  };
  

// Add a new user
const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.create({ username, email, password });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    console.log('Search query:', query);
    console.log('Current user:', currentUserId);

    if (!query || query.trim().length < 1) {
      return res.json([]);
    }

    // Find users matching the search query
    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            username: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            id: {
              [Op.ne]: currentUserId
            }
          }
        ]
      },
      attributes: ['id', 'username', 'department']
    });

    // Get only friend requests sent by the current user
    const sentRequests = await FriendRequest.findAll({
      where: {
        senderId: currentUserId,
        receiverId: users.map(u => u.id),
        status: 'pending'
      },
      raw: true
    });

    // Get existing friendships
    const friendships = await Friend.findAll({
      where: {
        [Op.or]: [
          {
            userId: currentUserId,
            friendId: users.map(u => u.id)
          },
          {
            userId: users.map(u => u.id),
            friendId: currentUserId
          }
        ]
      },
      raw: true
    });

    // Format users with request and friendship status
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      department: user.department,
      requestSent: sentRequests.some(fr => fr.receiverId === user.id),
      isFriend: friendships.some(f => 
        (f.userId === currentUserId && f.friendId === user.id) ||
        (f.userId === user.id && f.friendId === currentUserId)
      )
    }));

    console.log('Formatted users:', formattedUsers);
    res.json(formattedUsers);

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

const userController = { getAllUsers, createUser, getUserById, searchUsers };

module.exports = userController;
