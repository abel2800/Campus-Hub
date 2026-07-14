const { User, Friend, FriendRequest, Notification } = require('../models');
const { Op } = require('sequelize');

const friendController = {
  getPendingRequests: async (req, res) => {
    try {
      const userId = req.user.id;
      const requests = await FriendRequest.findAll({
        where: {
          receiverId: userId,
          status: 'pending',
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'email', 'avatar', 'avatarUrl', 'department', 'bio'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json(requests);
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  acceptRequest: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const userId = req.user.id;

      let request = await FriendRequest.findOne({
        where: {
          id: requestId,
          receiverId: userId,
          status: 'pending',
        },
      });

      // If already accepted, treat as success (common after a retry)
      if (!request) {
        const existing = await FriendRequest.findOne({
          where: { id: requestId, receiverId: userId },
        });
        if (existing && existing.status === 'accepted') {
          const sender = await User.findByPk(existing.senderId);
          return res.json({
            message: 'Friend request already accepted',
            friend: sender
              ? { id: sender.id, username: sender.username }
              : null,
          });
        }
        return res.status(404).json({ message: 'Friend request not found' });
      }

      await request.update({ status: 'accepted' });

      // Ensure mutual friendship rows (both directions)
      const a = await Friend.findOne({
        where: { userId: request.receiverId, friendId: request.senderId },
      });
      const b = await Friend.findOne({
        where: { userId: request.senderId, friendId: request.receiverId },
      });
      if (!a) {
        await Friend.create({ userId: request.receiverId, friendId: request.senderId });
      }
      if (!b) {
        await Friend.create({ userId: request.senderId, friendId: request.receiverId });
      }

      const sender = await User.findByPk(request.senderId);
      const receiver = await User.findByPk(request.receiverId);

      try {
        await Notification.create({
          userId: request.senderId,
          senderId: request.receiverId,
          type: 'friend_request_accepted',
          content: `${receiver.username} accepted your friend request`,
          entityId: request.receiverId,
          read: false,
        });
      } catch (notifErr) {
        // Friendship already created — don't fail accept because of notification issues
        console.error('Accept notification error (ignored):', notifErr.message);
      }

      res.json({
        message: 'Friend request accepted',
        friend: {
          id: sender.id,
          username: sender.username,
        },
      });
    } catch (error) {
      console.error('Accept request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  rejectRequest: async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const userId = req.user.id;

      const request = await FriendRequest.findOne({
        where: {
          id: requestId,
          receiverId: userId,
          status: 'pending',
        },
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

  sendRequest: async (req, res) => {
    try {
      const senderId = req.user.id;
      const { receiverId } = req.body;

      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }

      if (Number(receiverId) === Number(senderId)) {
        return res.status(400).json({ message: 'You cannot add yourself' });
      }

      const sender = await User.findByPk(senderId);
      const receiver = await User.findByPk(receiverId);

      if (!sender || !receiver) {
        return res.status(404).json({ message: 'User not found' });
      }

      const alreadyFriends = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId: senderId, friendId: receiverId },
            { userId: receiverId, friendId: senderId },
          ],
        },
      });

      if (alreadyFriends) {
        return res.status(400).json({ message: 'You are already friends' });
      }

      const pendingRequest = await FriendRequest.findOne({
        where: {
          status: 'pending',
          [Op.or]: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (pendingRequest) {
        if (pendingRequest.receiverId === senderId) {
          return res.status(400).json({
            message: 'This user already sent you a friend request',
            requestId: pendingRequest.id,
            friendshipStatus: 'incoming',
          });
        }
        return res.status(400).json({ message: 'Friend request already pending' });
      }

      await FriendRequest.create({
        senderId,
        receiverId,
        status: 'pending',
      });

      const notificationController = require('./notificationController');
      await notificationController.createFriendRequestNotification(
        receiverId,
        senderId,
        sender.username,
      );

      res.status(201).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      console.error('Send friend request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFriends: async (req, res) => {
    try {
      const userId = req.user.id;

      const friends = await Friend.findAll({
        where: { userId },
        include: [{
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'department', 'avatar', 'avatarUrl', 'bio'],
        }],
        order: [['createdAt', 'DESC']],
      });

      const mutualFriends = [];
      for (const row of friends) {
        const reciprocal = await Friend.findOne({
          where: { userId: row.friendId, friendId: userId },
        });
        if (reciprocal) mutualFriends.push(row);
      }

      res.json(mutualFriends);
    } catch (error) {
      console.error('Get friends error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  removeFriend: async (req, res) => {
    try {
      const userId = req.user.id;
      const friendId = req.params.friendId;

      await Friend.destroy({
        where: {
          [Op.or]: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      res.json({ message: 'Friend removed successfully' });
    } catch (error) {
      console.error('Remove friend error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  searchUsers: async (req, res) => {
    try {
      const userId = req.user.id;
      const { query } = req.query;

      if (!query || query.trim() === '') {
        return res.json([]);
      }

      const users = await User.findAll({
        where: {
          id: { [Op.ne]: userId },
          username: { [Op.iLike]: `%${query.trim()}%` },
        },
        attributes: ['id', 'username', 'department', 'avatar', 'avatarUrl', 'bio'],
        limit: 20,
        order: [['username', 'ASC']],
      });

      const friends = await Friend.findAll({
        where: { userId },
        attributes: ['friendId'],
      });

      const friendIds = new Set();
      for (const f of friends) {
        const reciprocal = await Friend.findOne({
          where: { userId: f.friendId, friendId: userId },
        });
        if (reciprocal) friendIds.add(f.friendId);
      }

      const sentRequests = await FriendRequest.findAll({
        where: { senderId: userId, status: 'pending' },
        attributes: ['receiverId'],
      });
      const sentRequestIds = new Set(sentRequests.map((r) => r.receiverId));

      const incomingRequests = await FriendRequest.findAll({
        where: { receiverId: userId, status: 'pending' },
        attributes: ['id', 'senderId'],
      });
      const incomingBySender = new Map(
        incomingRequests.map((r) => [r.senderId, r.id]),
      );

      const usersWithStatus = users.map((user) => {
        const userData = user.toJSON();

        if (friendIds.has(user.id)) {
          userData.friendshipStatus = 'accepted';
        } else if (incomingBySender.has(user.id)) {
          userData.friendshipStatus = 'incoming';
          userData.requestId = incomingBySender.get(user.id);
        } else if (sentRequestIds.has(user.id)) {
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
  },
};

module.exports = friendController;
