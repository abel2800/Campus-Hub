const { Message, User } = require('../models');
const { Op } = require('sequelize');

const messageController = {
  getMessages: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participantId } = req.params;

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: participantId },
            { sender_id: participantId, receiver_id: userId }
          ]
        },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'department']
        }],
        order: [['created_at', 'ASC']]
      });

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  createChat: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participantId } = req.body;

      // Create initial message
      const message = await Message.create({
        sender_id: userId,
        receiver_id: participantId,
        content: 'Chat started'
      });

      const messageWithUser = await Message.findOne({
        where: { id: message.id },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'department']
        }]
      });

      res.json(messageWithUser);
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participantId, content } = req.body;

      const message = await Message.create({
        sender_id: userId,
        receiver_id: participantId,
        content
      });

      const messageWithUser = await Message.findOne({
        where: { id: message.id },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'department']
        }]
      });

      if (req.app.io) {
        req.app.io.to(`user_${participantId}`).emit('new_message', messageWithUser);
      }

      res.json(messageWithUser);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getRecentChats: async (req, res) => {
    try {
      const userId = req.user.id;

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'department']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'department']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Group messages by conversation
      const chatMap = new Map();
      messages.forEach(message => {
        const otherUser = message.sender_id === userId ? message.receiver : message.sender;
        if (!chatMap.has(otherUser.id)) {
          chatMap.set(otherUser.id, {
            participant: otherUser,
            lastMessage: message
          });
        }
      });

      res.json(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Get recent chats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = messageController; 