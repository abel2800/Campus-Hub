const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Story extends Model {}

Story.init({
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
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    defaultValue: 'image'
  },
  caption: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => {
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Story',
  tableName: 'Stories',
  timestamps: true,
  indexes: [
    {
      name: 'story_user_idx',
      fields: ['userId']
    },
    {
      name: 'story_expiration_idx',
      fields: ['expiresAt']
    }
  ]
});

module.exports = Story; 