const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PasswordReset extends Model {}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'PasswordResets',
    timestamps: true,
  }
);

module.exports = PasswordReset;
