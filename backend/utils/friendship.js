const { Friend } = require('../models');
const { Op } = require('sequelize');

async function areFriends(userId, otherUserId) {
  if (!userId || !otherUserId || Number(userId) === Number(otherUserId)) {
    return false;
  }

  const friendship = await Friend.findOne({
    where: {
      [Op.or]: [
        { userId, friendId: otherUserId },
        { userId: otherUserId, friendId: userId },
      ],
    },
  });

  return Boolean(friendship);
}

async function getMutualFriendIds(userId) {
  const rows = await Friend.findAll({
    where: { userId },
    attributes: ['friendId'],
  });

  const ids = [];
  for (const row of rows) {
    const reciprocal = await Friend.findOne({
      where: { userId: row.friendId, friendId: userId },
    });
    if (reciprocal) ids.push(row.friendId);
  }
  return ids;
}

async function assertFriends(userId, otherUserId) {
  const ok = await areFriends(userId, otherUserId);
  if (!ok) {
    const err = new Error('You can only message friends');
    err.status = 403;
    throw err;
  }
}

module.exports = { areFriends, assertFriends, getMutualFriendIds };
