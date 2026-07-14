const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoryLike = sequelize.define('StoryLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  storyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Stories', key: 'id' },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
}, {
  timestamps: true,
  tableName: 'StoryLikes',
  indexes: [
    {
      unique: true,
      fields: ['storyId', 'userId'],
      name: 'story_likes_unique',
    },
  ],
});

module.exports = StoryLike;
