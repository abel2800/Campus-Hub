const { User, Friend, FriendRequest, Notification } = require('../models');
const { Op } = require('sequelize');

const friendController = {
  // Get pending friend requests
  getPendingRequests: async (req, res) => {
    try {
      const userId = req.user.id;
      const requests = await FriendRequest.findAll({
        where: {
          receiverId: userId,
          status: 'pending'
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'email', 'avatar', 'avatarUrl']
          }
        ]
      });

      res.json(requests);
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Accept friend request
  acceptRequest: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const userId = req.user.id;

      // Find and update the request
      const request = await FriendRequest.findOne({
        where: {
          id: requestId,
          receiverId: userId,
          status: 'pending'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      // Update request status
      await request.update({ status: 'accepted' });

      // Create two-way friendship
      await Friend.create({
        userId: request.receiverId,
        friendId: request.senderId
      });

      await Friend.create({
        userId: request.senderId,
        friendId: request.receiverId
      });

      // Get sender's username for notification
      const sender = await User.findByPk(request.senderId);
      const receiver = await User.findByPk(request.receiverId);

      // Create notification
      await Notification.create({
        userId: request.senderId,
        type: 'FRIEND_REQUEST_ACCEPTED',
        content: `${receiver.username} accepted your friend request`,
        read: false
      });

      res.json({ 
        message: 'Friend request accepted',
        friend: {
          id: sender.id,
          username: sender.username
        }
      });

    } catch (error) {
      console.error('Accept request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Reject friend request
  rejectRequest: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const userId = req.user.id;

      const request = await FriendRequest.findOne({
        where: {
          id: requestId,
          receiverId: userId,
          status: 'pending'
        }
      });

      if (!request) {
        return res.status(404).json({ message: 'Friend request not found' });
      }

      await request.update({ status: 'rejected' });
      res.json({ message: 'Friend request rejected' });
    } catch (error) {
      console.error('Reject request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Send friend request
  sendRequest: async (req, res) => {
    try {
      const senderId = req.user.id;
      const { receiverId } = req.body;

      // Validate receiver ID
      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }

      // Check if users exist
      const sender = await User.findByPk(senderId);
      const receiver = await User.findByPk(receiverId);

      if (!sender || !receiver) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if friendship already exists or is pending
      const existingFriendship = await Friend.findOne({
        where: {
          [Op.or]: [
            { 
              userId: senderId, 
              friendId: receiverId 
            },
            { 
              userId: receiverId, 
              friendId: senderId 
            }
          ]
        }
      });

      if (existingFriendship) {
        return res.status(400).json({ message: 'Friend request already exists or users are already friends' });
      }

      // Create friendship record with pending status
      const friendship = await Friend.create({
        userId: senderId,
        friendId: receiverId,
        status: 'pending'
      });

      // Create notification for the receiver
      const notificationController = require('./notificationController');
      await notificationController.createFriendRequestNotification(
        receiverId,
        senderId,
        sender.username
      );

      res.status(201).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      console.error('Send friend request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get friends list
  getFriends: async (req, res) => {
    try {
      const userId = req.user.id;

      const friends = await Friend.findAll({
        where: { userId },
        include: [{
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'department', 'avatar', 'avatarUrl']
        }]
      });

      // Log the response for debugging
      console.log('Friends response:', JSON.stringify(friends, null, 2));

      res.json(friends);
    } catch (error) {
      console.error('Get friends error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Remove friend
  removeFriend: async (req, res) => {
    try {
      const userId = req.user.id;
      const friendId = req.params.friendId;

      await Friend.destroy({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      res.json({ message: 'Friend removed successfully' });
    } catch (error) {
      console.error('Remove friend error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Search users
  searchUsers: async (req, res) => {
    try {
      const userId = req.user.id;
      const { query } = req.query;

      if (!query || query.trim() === '') {
        return res.json([]);
      }

      // Find users matching the search query
      const users = await User.findAll({
        where: {
          id: { [Op.ne]: userId }, // Exclude current user
          username: { [Op.iLike]: `%${query}%` }
        },
        attributes: ['id', 'username', 'department', 'avatar', 'avatarUrl'],
        limit: 10
      });

      // Get current user's friends
      const friends = await Friend.findAll({
        where: { userId },
        attributes: ['friendId']
      });
      
      const friendIds = friends.map(f => f.friendId);

      // Get pending friend requests
      const sentRequests = await FriendRequest.findAll({
        where: { 
          senderId: userId,
          status: 'pending'
        },
        attributes: ['receiverId']
      });
      
      const sentRequestIds = sentRequests.map(r => r.receiverId);

      // Add friendship status to each user
      const usersWithStatus = users.map(user => {
        const userData = user.toJSON();
        
        if (friendIds.includes(user.id)) {
          userData.friendshipStatus = 'accepted';
        } else if (sentRequestIds.includes(user.id)) {
          userData.friendshipStatus = 'pending';
        } else {
          userData.friendshipStatus = 'none';
        }
        
        return userData;
      });

      res.json(usersWithStatus);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = friendController;