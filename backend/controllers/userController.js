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

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { id: { [Op.ne]: currentUserId } },
        ],
      },
      attributes: ['id', 'username', 'department', 'avatar', 'avatarUrl', 'bio'],
      limit: 20,
    });

    const userIds = users.map((u) => u.id);

    const sentRequests = userIds.length
      ? await FriendRequest.findAll({
          where: {
            senderId: currentUserId,
            receiverId: { [Op.in]: userIds },
            status: 'pending',
          },
          raw: true,
        })
      : [];

    const incomingRequests = userIds.length
      ? await FriendRequest.findAll({
          where: {
            receiverId: currentUserId,
            senderId: { [Op.in]: userIds },
            status: 'pending',
          },
          raw: true,
        })
      : [];

    const friendships = userIds.length
      ? await Friend.findAll({
          where: {
            [Op.or]: [
              { userId: currentUserId, friendId: { [Op.in]: userIds } },
              { userId: { [Op.in]: userIds }, friendId: currentUserId },
            ],
          },
          raw: true,
        })
      : [];

    const formattedUsers = users.map((user) => {
      const incoming = incomingRequests.find((fr) => fr.senderId === user.id);
      const sent = sentRequests.find((fr) => fr.receiverId === user.id);
      const isFriend = friendships.some(
        (f) =>
          (f.userId === currentUserId && f.friendId === user.id) ||
          (f.userId === user.id && f.friendId === currentUserId),
      );

      let friendshipStatus = 'none';
      if (isFriend) friendshipStatus = 'accepted';
      else if (incoming) friendshipStatus = 'incoming';
      else if (sent) friendshipStatus = 'pending';

      return {
        id: user.id,
        username: user.username,
        department: user.department,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        requestSent: Boolean(sent),
        isFriend,
        friendshipStatus,
        requestId: incoming?.id,
      };
    });

    console.log('Formatted users:', formattedUsers);
    res.json(formattedUsers);

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

const userController = { getAllUsers, createUser, getUserById, searchUsers };

module.exports = userController;
