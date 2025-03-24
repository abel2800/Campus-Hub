// models/Notification.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['friend_request', 'message', 'post_like', 'post_comment', 'course_enroll']]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the related entity (post, chat, course, etc.) depending on notification type'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Notifications',
  timestamps: true
});

// This function will be called after all models are defined
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'recipient'
  });
  
  Notification.belongsTo(models.User, {
    foreignKey: 'senderId',
    as: 'sender'
  });
};

module.exports = Notification;