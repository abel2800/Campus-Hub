const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoryComment = sequelize.define('StoryComment', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'StoryComments',
  indexes: [
    { fields: ['storyId'], name: 'story_comments_story_idx' },
    { fields: ['userId'], name: 'story_comments_user_idx' },
  ],
});

module.exports = StoryComment;
