const { Notification, User } = require('../models');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      const notifications = await Notification.findAll({
        where: {
          userId
        },
        order: [['createdAt', 'DESC']],
        limit: 20,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Notification.update(
        { read: true },
        {
          where: {
            id,
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
  
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      await Notification.update(
        { read: true },
        {
          where: {
            userId,
            read: false
          }
        }
      );

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  createNotification: async (userId, type, content, senderId = null, entityId = null) => {
    try {
      // Validate notification type
      const validTypes = ['friend_request', 'message', 'post_like', 'post_comment', 'course_enroll'];
      if (!validTypes.includes(type)) {
        console.error(`Invalid notification type: ${type}`);
        return null;
      }
      
      // Create notification with standard format
      const notification = await Notification.create({
        userId,
        type,
        content,
        senderId,
        entityId,
        read: false
      });
      
      // Add user data to the notification for immediate use
      if (senderId) {
        try {
          const sender = await User.findByPk(senderId, {
            attributes: ['id', 'username', 'avatar']
          });
          
          if (sender) {
            notification.user = sender;
          }
        } catch (err) {
          console.error('Error fetching sender data:', err);
        }
      }
      
      // Emit socket event if the global function is available
      if (global.sendNotification) {
        global.sendNotification(userId, notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  },
  
  // Create friend request notification
  createFriendRequestNotification: async (targetUserId, senderUserId, senderName) => {
    const content = `${senderName} sent you a friend request`;
    return notificationController.createNotification(
      targetUserId,
      'friend_request',
      content,
      senderUserId,
      senderUserId // entityId is the sender's user ID
    );
  },
  
  // Create new message notification
  createMessageNotification: async (targetUserId, senderUserId, senderName, chatId) => {
    const content = `${senderName} sent you a message`;
    return notificationController.createNotification(
      targetUserId,
      'message',
      content,
      senderUserId,
      chatId // entityId is the chat ID
    );
  },
  
  // Create post like notification
  createPostLikeNotification: async (targetUserId, senderUserId, senderName, postId) => {
    const content = `${senderName} liked your post`;
    return notificationController.createNotification(
      targetUserId,
      'post_like',
      content,
      senderUserId,
      postId // entityId is the post ID
    );
  },
  
  // Create post comment notification
  createPostCommentNotification: async (targetUserId, senderUserId, senderName, postId) => {
    const content = `${senderName} commented on your post`;
    return notificationController.createNotification(
      targetUserId,
      'post_comment',
      content,
      senderUserId,
      postId // entityId is the post ID
    );
  },
  
  // Create course enrollment notification for teachers
  createCourseEnrollNotification: async (teacherId, studentId, studentName, courseId, courseName) => {
    const content = `${studentName} enrolled in your course "${courseName}"`;
    return notificationController.createNotification(
      teacherId,
      'course_enroll',
      content,
      studentId,
      courseId // entityId is the course ID
    );
  },

  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Notification.destroy({
        where: {
          id,
          userId
        }
      });

      if (result === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  clearAllNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      await Notification.destroy({
        where: {
          userId
        }
      });

      res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
      console.error('Clear all notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = notificationController; 