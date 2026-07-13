const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'Posts',
  timestamps: true
});

Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  Post.hasMany(models.Comment, {
    foreignKey: 'postId',
    as: 'comments'
  });
  Post.hasMany(models.Like, {
    foreignKey: 'postId',
    as: 'likes'
  });
};

module.exports = Post; 