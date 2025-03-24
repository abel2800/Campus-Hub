const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notificationSettings: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: JSON.stringify({
      emailNotifications: 'all',
      newMessageNotification: true,
      friendRequestNotification: true,
      postLikeNotification: true,
      courseNotification: true
    }),
    get() {
      const rawValue = this.getDataValue('notificationSettings');
      return rawValue ? JSON.parse(rawValue) : null;
    }
  },
  privacySettings: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: JSON.stringify({
      profileVisibility: 'friends',
      searchable: true,
      showCourses: true
    }),
    get() {
      const rawValue = this.getDataValue('privacySettings');
      return rawValue ? JSON.parse(rawValue) : null;
    }
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'Users',
  timestamps: true
});

// Add method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  // In a real app, you would use bcrypt.compare here
  // For simplicity, we'll just compare directly (not secure for production!)
  return this.password === candidatePassword;
};

module.exports = User;