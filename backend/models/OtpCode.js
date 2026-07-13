const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class OtpCode extends Model {}

OtpCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    codeHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: 'OtpCode',
    tableName: 'OtpCodes',
    timestamps: true,
  }
);

module.exports = OtpCode;
