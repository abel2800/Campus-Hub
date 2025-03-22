const { Notification } = require('../models');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      const notifications = await Notification.findAll({
        where: {
          userId
        },
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const result = await Notification.update(
        { read: true },
        {
          where: {
            id: notificationId,
            userId
          }
        }
      );

      if (result[0] === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  createNotification: async (userId, type, content) => {
    try {
      const notification = await Notification.create({
        userId,
        type,
        content,
        read: false
      });
      
      // Emit socket event if the global function is available
      if (global.sendNotification) {
        global.sendNotification(userId, notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  }
};

module.exports = notificationController; 