const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserGamification = sequelize.define('UserGamification', {
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  xp: { type: DataTypes.INTEGER, defaultValue: 0 },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  streak: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastActiveDate: { type: DataTypes.DATEONLY, allowNull: true },
  badges: { type: DataTypes.TEXT, defaultValue: '[]' }
}, { tableName: 'UserGamification' });

const Wallet = sequelize.define('Wallet', {
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'ETB' }
}, { tableName: 'Wallets' });

const WalletTransaction = sequelize.define('WalletTransaction', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  method: { type: DataTypes.STRING, defaultValue: 'telebirr' },
  description: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'completed' }
}, { tableName: 'WalletTransactions' });

const Club = sequelize.define('Club', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING, defaultValue: 'general' },
  memberCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  imageUrl: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'Clubs' });

const ClubMember = sequelize.define('ClubMember', {
  clubId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'ClubMembers' });

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.INTEGER, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'present' }
}, { tableName: 'AttendanceRecords' });

const VoiceRoom = sequelize.define('VoiceRoom', {
  name: { type: DataTypes.STRING, allowNull: false },
  topic: { type: DataTypes.STRING, allowNull: true },
  hostId: { type: DataTypes.INTEGER, allowNull: false },
  participantCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  isLive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'VoiceRooms' });

module.exports = {
  UserGamification,
  Wallet,
  WalletTransaction,
  Club,
  ClubMember,
  AttendanceRecord,
  VoiceRoom
};
