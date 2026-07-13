const { Message, User, Friend } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { assertFriends, areFriends } = require('../utils/friendship');

const messageController = {
  getMessages: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participantId } = req.params;

      await assertFriends(userId, participantId);

      console.log(`Fetching messages between users ${userId} and ${participantId}`);

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: participantId },
            { sender_id: participantId, receiver_id: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar', 'department']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar', 'department']
          }
        ],
        order: [['created_at', 'ASC']]
      });

      console.log(`Found ${messages.length} messages`);
      res.json(messages);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  createChat: async (req, res) => {
    try {
      const userId = req.user.id;
      const { participantId } = req.body;

      await assertFriends(userId, participantId);

      console.log(`Creating chat between users ${userId} and ${participantId}`);

      // Create initial message
      const message = await Message.create({
        sender_id: userId,
        receiver_id: participantId,
        content: 'Chat started'
      });

      const messageWithUser = await Message.findOne({
        where: { id: message.id },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar', 'department']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar', 'department']
          }
        ]
      });

      console.log('Chat created successfully');
      res.json(messageWithUser);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error('Create chat error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('Send message request body:', req.body);
      console.log('Sender user ID:', userId);
      
      // Extract participant ID and content from request body
      const { participantId, content } = req.body;
      
      console.log('Receiver ID:', participantId);
      console.log('Message content:', content);
      
      // Validate required parameters
      if (!participantId) {
        console.error('Missing participantId in request');
        return res.status(400).json({ message: 'Recipient ID is required' });
      }
      
      if (!content) {
        console.error('Missing content in request');
        return res.status(400).json({ message: 'Message content is required' });
      }

      await assertFriends(userId, participantId);

      // Get sender info for notification
      const sender = await User.findByPk(userId, {
        attributes: ['id', 'username', 'avatar']
      });

      if (!sender) {
        return res.status(404).json({ message: 'Sender not found' });
      }

      // Create the message with the correct parameter names
      const message = await Message.create({
        sender_id: userId,
        receiver_id: participantId,
        content: content
      });

      console.log('Message created successfully:', message.id);

      const messageWithUser = await Message.findOne({
        where: { id: message.id },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar', 'department']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar', 'department']
          }
        ]
      });

      // Create notification for the message recipient
      const notificationController = require('./notificationController');
      await notificationController.createMessageNotification(
        participantId,
        userId,
        sender.username,
        message.id
      );

      if (req.app.io) {
        req.app.io.to(`user:${participantId}`).emit('new_message', messageWithUser);
      }

      res.json(messageWithUser);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  getRecentChats: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('Fetching recent chats for user:', userId);

      const friendRows = await Friend.findAll({
        where: { userId },
        attributes: ['friendId'],
      });
      const friendIds = new Set(friendRows.map((f) => f.friendId));

      if (friendIds.size === 0) {
        return res.json([]);
      }

      // First, get the latest message for each conversation
      const latestMessages = await Message.findAll({
        attributes: [
          [sequelize.fn('MAX', sequelize.col('id')), 'maxId'],
          [sequelize.fn('MAX', sequelize.col('created_at')), 'latest_date'],
          [
            sequelize.literal(`
              CASE 
                WHEN sender_id = ${userId} THEN receiver_id 
                ELSE sender_id 
              END
            `),
            'other_user_id'
          ]
        ],
        where: {
          [Op.or]: [
            { sender_id: userId },
            { receiver_id: userId }
          ]
        },
        group: [
          [
            sequelize.literal(`
              CASE 
                WHEN sender_id = ${userId} THEN receiver_id 
                ELSE sender_id 
              END
            `)
          ]
        ],
        raw: true
      });

      console.log(`Found ${latestMessages.length} conversations`);

      if (latestMessages.length === 0) {
        return res.json([]);
      }

      // Get all the message IDs
      const messageIds = latestMessages.map(msg => msg.maxId);

      // Fetch the actual messages with user details
      const messages = await Message.findAll({
        where: {
          id: messageIds
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar', 'department']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'username', 'avatar', 'department']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Transform messages to include participant info
      const enrichedMessages = messages
        .map((message) => {
        const messageData = message.toJSON();
        
        // Determine which user is the conversation participant (not the current user)
        const isUserSender = message.sender_id === userId;
        const participant = isUserSender ? message.receiver : message.sender;
        
        return {
          ...messageData,
          lastMessage: message.content,
          participant: participant ? {
            id: participant.id,
            username: participant.username,
            avatar: participant.avatar,
            department: participant.department
          } : null
        };
      })
        .filter((m) => m.participant && friendIds.has(m.participant.id));

      console.log(`Returning ${enrichedMessages.length} enriched conversations`);
      res.json(enrichedMessages);
    } catch (error) {
      console.error('Get recent chats error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  deleteChat: async (req, res) => {
    try {
      const userId = req.user.id;
      const { chatId } = req.params;
      
      console.log(`Deleting chat with ID ${chatId} for user ${userId}`);
      
      // Find the chat first to determine the participants
      const chat = await Message.findOne({
        where: { id: chatId },
        attributes: ['id', 'sender_id', 'receiver_id']
      });
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Verify that the requesting user is a participant in the chat
      if (chat.sender_id !== userId && chat.receiver_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this chat' });
      }
      
      // Get the other participant's ID
      const otherParticipantId = chat.sender_id === userId ? chat.receiver_id : chat.sender_id;
      
      // Delete all messages between these two users
      const deletedCount = await Message.destroy({
        where: {
          [Op.or]: [
            { sender_id: userId, receiver_id: otherParticipantId },
            { sender_id: otherParticipantId, receiver_id: userId }
          ]
        }
      });
      
      console.log(`Deleted ${deletedCount} messages between users ${userId} and ${otherParticipantId}`);
      
      res.json({ 
        message: 'Chat deleted successfully', 
        deletedCount
      });
    } catch (error) {
      console.error('Delete chat error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = messageController; 